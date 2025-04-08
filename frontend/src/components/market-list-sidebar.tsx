"use client";

import React, { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarHeader,
} from "./ui/sidebar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReadContract } from "thirdweb/react";
import { candidateContract } from "@/constants/contract";
import { MarketItem } from "./market-item-sidebar";

export function SidebarMarketList() {
  const [expandedMarket, setExpandedMarket] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // 使用useReadContract获取候选市场数量
  const { data: pendingMarketsCount, isLoading: isLoadingCount } =
    useReadContract({
      contract: candidateContract,
      method: "function getPendingMarketsCount() view returns (uint256)",
      params: [],
    });

  // 使用useReadContract获取待定市场ID列表
  const { data: pendingMarketsData, isLoading: isLoadingPendingMarkets } =
    useReadContract({
      contract: candidateContract,
      method:
        "function getPendingMarkets(uint256 offset, uint256 limit) view returns (uint256[], uint256)",
      params: [BigInt(0), pendingMarketsCount ?? BigInt(0)],
    });

  // 获取市场ID列表
  const marketIds =
    pendingMarketsData?.[0]?.map((id: bigint) => id.toString()) || [];

  // 手动刷新数据
  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const isLoading = isLoadingCount || isLoadingPendingMarkets;

  return (
    <Sidebar side="left" variant="floating">
      <SidebarHeader className="p-3 bg-muted/50">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">Candidate Pool</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isLoading && "animate-spin")}
              />
            </Button>
          </div>
          <div className="flex items-center">
            <Badge variant="outline" className="text-xs font-normal">
              {marketIds.length} proposals
            </Badge>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        ) : marketIds.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No pending market proposals
            </p>
          </div>
        ) : (
          <SidebarMenu>
            {marketIds.map((marketId) => (
              <MarketItem
                key={marketId}
                marketId={marketId}
                isExpanded={expandedMarket === marketId}
                onToggleExpand={() => {
                  setExpandedMarket(
                    expandedMarket === marketId ? null : marketId
                  );
                }}
                onRefresh={handleRefresh}
              />
            ))}
          </SidebarMenu>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
