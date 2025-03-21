"use client";

import React, { useEffect, useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "./ui/sidebar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import {
  Clock,
  ThumbsUp,
  ThumbsDown,
  CalendarClock,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

// Mock data for pending release markets
const MOCK_PENDING_MARKETS = [
  {
    id: "pm-001",
    category: "Currency",
    title: "Will BTC reach $100k before June?",
    description: "Predicting if Bitcoin will reach $100,000 before June 2025",
    createdBy: "0x7aD4...E0d1e",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    votingEndTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days later
    supportVotes: 128,
    againstVotes: 32,
    requiredVotes: 200,
    options: ["Yes", "No"],
  },
  {
    id: "pm-002",
    category: "General",
    title: "Will NUS enter the top 20 universities in 2025?",
    description:
      "Predicting if NUS will enter the world's top 20 in the 2025 QS rankings",
    createdBy: "0x252B...75A4",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    votingEndTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days later
    supportVotes: 67,
    againstVotes: 23,
    requiredVotes: 150,
    options: ["Yes", "No"],
  },
  {
    id: "pm-003",
    category: "Currency",
    title: "Will ETH price exceed $5000 within 2 weeks?",
    description:
      "Predicting if Ethereum price will break through $5000 in the next 2 weeks",
    createdBy: "0x4e9E...02D4",
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    votingEndTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days later
    supportVotes: 45,
    againstVotes: 15,
    requiredVotes: 100,
    options: ["Yes", "No"],
  },
  {
    id: "pm-004",
    category: "General",
    title: "Will Chainlink launch its own blockchain in 2025?",
    description:
      "Predicting if Chainlink will launch its own mainnet blockchain in 2025",
    createdBy: "0xd9d1...4fd3",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    votingEndTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day later
    supportVotes: 89,
    againstVotes: 56,
    requiredVotes: 180,
    options: ["Yes", "No"],
  },
];

interface PendingMarket {
  id: string;
  category: "Currency" | "General";
  title: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  votingEndTime: Date;
  supportVotes: number;
  againstVotes: number;
  requiredVotes: number;
  options: string[];
}

export function SidebarMarketList() {
  const [pendingMarkets, setPendingMarkets] = useState<PendingMarket[]>([]);
  const [expandedMarket, setExpandedMarket] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userVotes, setUserVotes] = useState<
    Record<string, "support" | "against" | null>
  >({});

  // Simulate loading data
  useEffect(() => {
    const fetchPendingMarkets = async () => {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setPendingMarkets(MOCK_PENDING_MARKETS);
      setIsLoading(false);
    };

    fetchPendingMarkets();
  }, []);

  // Handle voting
  const handleVote = (marketId: string, vote: "support" | "against") => {
    setPendingMarkets((markets) =>
      markets.map((market) => {
        if (market.id === marketId) {
          return {
            ...market,
            supportVotes:
              vote === "support"
                ? market.supportVotes +
                  (userVotes[marketId] === "against"
                    ? 2
                    : userVotes[marketId]
                    ? 0
                    : 1)
                : market.supportVotes -
                  (userVotes[marketId] === "support" ? 1 : 0),
            againstVotes:
              vote === "against"
                ? market.againstVotes +
                  (userVotes[marketId] === "support"
                    ? 2
                    : userVotes[marketId]
                    ? 0
                    : 1)
                : market.againstVotes -
                  (userVotes[marketId] === "against" ? 1 : 0),
          };
        }
        return market;
      })
    );

    setUserVotes((prev) => ({
      ...prev,
      [marketId]: prev[marketId] === vote ? null : vote,
    }));
  };

  // Calculate voting progress
  const calculateProgress = (market: PendingMarket) => {
    const totalVotes = market.supportVotes + market.againstVotes;
    return Math.min(Math.round((totalVotes / market.requiredVotes) * 100), 100);
  };

  // Get voting percentage
  const getVotePercentage = (
    market: PendingMarket,
    type: "support" | "against"
  ) => {
    const totalVotes = market.supportVotes + market.againstVotes;
    if (totalVotes === 0) return 0;

    const votes =
      type === "support" ? market.supportVotes : market.againstVotes;
    return Math.round((votes / totalVotes) * 100);
  };

  // Format date
  const formatTimeLeft = (date: Date) => {
    if (date.getTime() < Date.now()) {
      return "Voting ended";
    }
    return `Ends in ${formatDistanceToNow(date)}`;
  };

  return (
    <Sidebar side="left" variant="floating">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 bg-muted/50 flex justify-between items-center">
            <span>Candidate Pool</span>
            <Badge variant="outline" className="text-xs font-normal">
              {pendingMarkets.length} proposals
            </Badge>
          </SidebarGroupLabel>

          {isLoading ? (
            <div className="p-6 text-center">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
          ) : (
            <SidebarMenu>
              {pendingMarkets.map((market) => (
                <SidebarMenuItem
                  key={market.id}
                  className={cn(
                    "border-b last:border-b-0 transition-all duration-300",
                    expandedMarket === market.id
                      ? "bg-muted/40"
                      : "hover:bg-muted/20"
                  )}
                >
                  <div className="w-full p-3">
                    <div
                      className={cn(
                        "cursor-pointer transition-all duration-200",
                        "hover:translate-x-0.5"
                      )}
                      onClick={() =>
                        setExpandedMarket(
                          expandedMarket === market.id ? null : market.id
                        )
                      }
                    >
                      <div className="mb-2">
                        <Badge
                          className={cn(
                            "mb-1.5 text-xs pointer-events-none",
                            market.category === "Currency"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-indigo-100 text-indigo-800"
                          )}
                        >
                          {market.category}
                        </Badge>
                        <h3 className="text-sm font-medium line-clamp-2">
                          {market.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <CalendarClock className="h-3.5 w-3.5" />
                        <span>{formatTimeLeft(market.votingEndTime)}</span>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">
                            Release voting progress
                          </span>
                          <span>{calculateProgress(market)}%</span>
                        </div>
                        <Progress
                          value={calculateProgress(market)}
                          className="h-1.5"
                        />
                      </div>
                    </div>

                    <div
                      className={cn(
                        "mt-3 space-y-2 text-sm overflow-hidden transition-all duration-300 ease-in-out",
                        expandedMarket === market.id
                          ? "max-h-96 opacity-100"
                          : "max-h-0 opacity-0"
                      )}
                    >
                      <p className="text-muted-foreground text-xs">
                        {market.description}
                      </p>

                      <div className="bg-muted/20 p-2 rounded-md">
                        <div className="flex items-center justify-between mb-1.5 text-xs">
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            <span>Support vs opposition ratio</span>
                          </div>
                          <span>
                            {market.supportVotes + market.againstVotes}/
                            {market.requiredVotes} votes
                          </span>
                        </div>

                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="h-2 bg-green-100 rounded-sm flex-grow transition-all duration-300"
                            style={{
                              width: `${getVotePercentage(market, "support")}%`,
                            }}
                          ></div>
                          <div
                            className="h-2 bg-red-100 rounded-sm flex-grow transition-all duration-300"
                            style={{
                              width: `${getVotePercentage(market, "against")}%`,
                            }}
                          ></div>
                        </div>

                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>
                            {getVotePercentage(market, "support")}% Support
                          </span>
                          <span>
                            {getVotePercentage(market, "against")}% Against
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          size="sm"
                          variant={
                            userVotes[market.id] === "support"
                              ? "default"
                              : "outline"
                          }
                          className={cn(
                            "flex-1 gap-1 h-8 transition-all duration-200",
                            "hover:scale-105"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(market.id, "support");
                          }}
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                          Support
                        </Button>
                        <Button
                          size="sm"
                          variant={
                            userVotes[market.id] === "against"
                              ? "destructive"
                              : "outline"
                          }
                          className={cn(
                            "flex-1 gap-1 h-8 transition-all duration-200",
                            "hover:scale-105"
                          )}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVote(market.id, "against");
                          }}
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                          Against
                        </Button>
                      </div>
                    </div>
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          )}
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
