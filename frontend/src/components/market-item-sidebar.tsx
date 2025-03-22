import React, { useEffect, useState } from "react";
import { SidebarMenuItem } from "./ui/sidebar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import {
  Clock,
  ThumbsUp,
  ThumbsDown,
  CalendarClock,
  Users,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { prepareContractCall } from "thirdweb";
import {
  useSendAndConfirmTransaction,
  useReadContract,
  useActiveAccount,
} from "thirdweb/react";
import { candidateContract } from "@/constants/contract";
import { useToast } from "@/hooks/use-toast";

interface MarketItemProps {
  marketId: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRefresh: () => void;
}

interface MarketDetails {
  id: string;
  category: "Currency" | "General";
  title: string;
  createdBy: string;
  creationTime: Date;
  votingEndTime: Date;
  supportVotes: number;
  againstVotes: number;
  requiredVotes: number;
  status: number;
  isPublished: boolean;
  options?: string[];
}

export function MarketItem({
  marketId,
  isExpanded,
  onToggleExpand,
  onRefresh,
}: MarketItemProps) {
  const [marketDetails, setMarketDetails] = useState<MarketDetails | null>(
    null
  );
  const [userVote, setUserVote] = useState<"support" | "against" | null>(null);
  const [thumbAnimation, setThumbAnimation] = useState<{
    type: "support" | "against";
    active: boolean;
  } | null>(null);
  const [isVoteLoading, setIsVoteLoading] = useState<{
    support: boolean;
    against: boolean;
  }>({
    support: false,
    against: false,
  });
  const [isProcessingExpiredVote, setIsProcessingExpiredVote] = useState(false);

  const { toast } = useToast();
  const { mutateAsync: mutateTransaction } = useSendAndConfirmTransaction();
  const account = useActiveAccount();
  const userAddress = account?.address;

  // 使用useReadContract获取市场详情
  const { data: marketDetailsData, isLoading: isLoadingMarketDetails } =
    useReadContract({
      contract: candidateContract,
      method:
        "function getMarketDetails(uint256 marketId) view returns (uint256, address, uint8, string, uint256, uint256, uint256, uint256, uint256, uint8,uint256, bool, uint256)",
      params: [BigInt(marketId)],
    });

  console.log("marketid", marketId);
  console.log("marketDetailsData", marketDetailsData);

  // 使用useReadContract获取用户投票信息
  const { data: userVoteData, isLoading: isLoadingUserVote } = useReadContract({
    contract: candidateContract,
    method:
      "function getUserVote(uint256 marketId, address voter) view returns (bool, bool)",
    params: [
      BigInt(marketId),
      userAddress || "0x0000000000000000000000000000000000000000",
    ],
  });

  // 处理市场详情数据
  useEffect(() => {
    if (!marketDetailsData) return;

    setMarketDetails({
      id: marketId,
      category: marketDetailsData[2] === 0 ? "Currency" : "General",
      title: marketDetailsData[3],
      createdBy: marketDetailsData[1], // creator address
      creationTime: new Date(Number(marketDetailsData[4]) * 1000),
      votingEndTime: new Date(Number(marketDetailsData[5]) * 1000),
      supportVotes: Number(marketDetailsData[6]),
      againstVotes: Number(marketDetailsData[7]),
      requiredVotes: Number(marketDetailsData[8]),
      status: Number(marketDetailsData[9]),
      isPublished: marketDetailsData[11],
    });
  }, [marketDetailsData, marketId]);

  // 处理用户投票数据
  useEffect(() => {
    if (!userVoteData || !userAddress) return;

    const [hasVoted, isSupport] = userVoteData;
    if (hasVoted) {
      setUserVote(isSupport ? "support" : "against");
    } else {
      setUserVote(null);
    }
  }, [userVoteData, userAddress]);

  // 处理投票
  const handleVote = async (vote: "support" | "against") => {
    try {
      // 设置对应投票类型的加载状态
      setIsVoteLoading((prev) => ({
        ...prev,
        [vote]: true,
      }));

      // 准备交易
      const tx = await prepareContractCall({
        contract: candidateContract,
        method: "function voteMarket(uint256 marketId, bool support)",
        params: [BigInt(marketId), vote === "support"],
      });

      // 发送交易
      await mutateTransaction(tx);

      // 更新本地状态
      setUserVote(userVote === vote ? null : vote);

      // 提示成功
      toast({
        title: "Vote submitted",
        description: `You have ${
          vote === "support" ? "supported" : "opposed"
        } this market proposal.`,
      });

      // 刷新市场数据
      onRefresh();

      // 交易完成后触发动画
      // 先重置加载状态
      setIsVoteLoading((prev) => ({
        ...prev,
        [vote]: false,
      }));

      // 短暂延迟后触发动画，形成停顿效果
      setTimeout(() => {
        setThumbAnimation({
          type: vote,
          active: true,
        });

        // 延长动画显示时间，让涟漪效果完整显示
        setTimeout(() => {
          setThumbAnimation(null);
        }, 300); // 提供足够时间显示完整动画
      }, 300); // 300ms的停顿效果
    } catch (error) {
      console.error("Error voting for market:", error);
      toast({
        title: "Vote failed",
        description: "There was an error submitting your vote.",
        variant: "destructive",
      });

      // 出错时重置加载状态
      setIsVoteLoading((prev) => ({
        ...prev,
        [vote]: false,
      }));
    }
  };

  // 处理过期投票
  const handleProcessExpiredVoting = async () => {
    try {
      setIsProcessingExpiredVote(true);

      const tx = await prepareContractCall({
        contract: candidateContract,
        method: "function processExpiredVotings(uint256 marketId)",
        params: [BigInt(marketId)],
      });

      await mutateTransaction(tx);

      toast({
        title: "Market processed",
        description: "The expired market voting has been processed.",
      });

      // 刷新市场数据
      onRefresh();
    } catch (error) {
      console.error("Error processing expired voting:", error);
      toast({
        title: "Process failed",
        description: "Failed to process the expired market voting.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingExpiredVote(false);
    }
  };

  // 计算投票进度
  const calculateProgress = () => {
    if (!marketDetails) return 0;
    const totalVotes = marketDetails.supportVotes + marketDetails.againstVotes;
    return Math.min(
      Math.round((totalVotes / marketDetails.requiredVotes) * 100),
      100
    );
  };

  // 获取投票百分比
  const getVotePercentage = (type: "support" | "against") => {
    if (!marketDetails) return 0;
    const totalVotes = marketDetails.supportVotes + marketDetails.againstVotes;
    if (totalVotes === 0) return 0;

    const votes =
      type === "support"
        ? marketDetails.supportVotes
        : marketDetails.againstVotes;
    return Math.round((votes / totalVotes) * 100);
  };

  // 格式化时间
  const formatTimeLeft = (date: Date) => {
    if (date.getTime() < Date.now()) {
      return "Voting ended";
    }
    return `Ends in ${formatDistanceToNow(date)}`;
  };

  // 检查是否正在进行动画
  const isAnimating = (type: "support" | "against") => {
    return thumbAnimation?.type === type && thumbAnimation.active;
  };

  // 如果市场详情加载中或者数据不存在，显示加载状态
  if (isLoadingMarketDetails || !marketDetails) {
    return (
      <SidebarMenuItem className="border-b last:border-b-0">
        <div className="w-full p-3 flex items-center justify-center">
          <div className="animate-pulse h-12 w-full bg-gray-200 rounded"></div>
        </div>
      </SidebarMenuItem>
    );
  }

  return (
    <SidebarMenuItem
      className={cn(
        "border-b last:border-b-0 transition-all duration-300",
        isExpanded ? "bg-muted/40" : "hover:bg-muted/20"
      )}
    >
      <div className="w-full p-3">
        <div
          className={cn(
            "cursor-pointer transition-all duration-200",
            "hover:translate-x-0.5"
          )}
          onClick={onToggleExpand}
        >
          <div className="mb-2">
            <Badge
              className={cn(
                "mb-1.5 text-xs pointer-events-none",
                marketDetails.category === "Currency"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-indigo-100 text-indigo-800"
              )}
            >
              {marketDetails.category}
            </Badge>
            <h3 className="text-sm font-medium line-clamp-2">
              {marketDetails.title}
            </h3>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
            <Clock className="h-3.5 w-3.5" />
            <span>
              Created {formatDistanceToNow(marketDetails.creationTime)} ago
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
            <CalendarClock className="h-3.5 w-3.5" />
            <span>{formatTimeLeft(marketDetails.votingEndTime)}</span>
          </div>

          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">
                Release voting progress
              </span>
              <span>{calculateProgress()}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-1.5" />
          </div>
        </div>

        <div
          className={cn(
            "mt-3 space-y-3 text-sm overflow-hidden transition-all duration-300 ease-in-out",
            isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="bg-muted/20 p-2 rounded-md">
            <div className="flex items-center justify-between mb-1.5 text-xs">
              <div className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                <span>Support vs Opposition</span>
              </div>
              <span>
                {marketDetails.supportVotes + marketDetails.againstVotes}/
                {marketDetails.requiredVotes} votes
              </span>
            </div>

            <div className="relative h-1 bg-gray-100 rounded-full gap-2 ">
              <div
                className="absolute left-0 top-0 h-full bg-green-400 transition-all duration-300 rounded-sm"
                style={{
                  width: `${getVotePercentage("support")}%`,
                }}
              ></div>
              <div
                className="absolute right-0 top-0 h-full bg-red-400 transition-all duration-300 rounded-sm"
                style={{
                  width: `${getVotePercentage("against")}%`,
                }}
              ></div>
            </div>

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{getVotePercentage("support")}% Support</span>
              <span>{getVotePercentage("against")}% Against</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Created by:</span>
              <span className="font-mono">{`${marketDetails.createdBy.slice(
                0,
                6
              )}...${marketDetails.createdBy.slice(-4)}`}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4">
            {marketDetails.votingEndTime.getTime() < Date.now() ? (
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1.5 h-9 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  handleProcessExpiredVoting();
                }}
                disabled={isProcessingExpiredVote}
              >
                {isProcessingExpiredVote ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  "Process Expired Voting"
                )}
              </Button>
            ) : (
              <>
                <Button
                  size="sm"
                  variant={userVote === "support" ? "default" : "outline"}
                  className={cn(
                    "flex-1 gap-1.5 h-9 rounded-full transition-all duration-200 relative overflow-hidden",
                    userVote === "support"
                      ? "bg-green-500 hover:bg-green-600"
                      : "hover:border-green-500 hover:text-green-600"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVote("support");
                  }}
                  disabled={isVoteLoading.support || isVoteLoading.against}
                >
                  <div className="flex items-center gap-1.5">
                    {isVoteLoading.support ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <div
                        className={cn(
                          "transition-transform duration-300 relative",
                          isAnimating("support")
                            ? "-translate-y-1 scale-110"
                            : "",
                          userVote === "support" ? "scale-105" : ""
                        )}
                      >
                        <ThumbsUp className="h-4 w-4" />
                      </div>
                    )}
                    <span>
                      {isVoteLoading.support ? "Voting..." : "Support"}
                    </span>
                  </div>

                  {/* 点赞涟漪动画 */}
                  {isAnimating("support") && (
                    <span className="absolute top-0 left-0 right-0 bottom-0 bg-green-300/30 animate-ripple rounded-full"></span>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant={userVote === "against" ? "destructive" : "outline"}
                  className={cn(
                    "flex-1 gap-1.5 h-9 rounded-full transition-all duration-200 relative overflow-hidden",
                    userVote === "against"
                      ? "bg-red-500 hover:bg-red-600"
                      : "hover:border-red-500 hover:text-red-600"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVote("against");
                  }}
                  disabled={isVoteLoading.support || isVoteLoading.against}
                >
                  <div className="flex items-center gap-1.5">
                    {isVoteLoading.against ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <div
                        className={cn(
                          "transition-transform duration-300 relative",
                          isAnimating("against")
                            ? "translate-y-1 scale-110"
                            : "",
                          userVote === "against" ? "scale-105" : ""
                        )}
                      >
                        <ThumbsDown className="h-4 w-4" />
                      </div>
                    )}
                    <span>
                      {isVoteLoading.against ? "Voting..." : "Against"}
                    </span>
                  </div>

                  {/* 反对涟漪动画 */}
                  {isAnimating("against") && (
                    <span className="absolute top-0 left-0 right-0 bottom-0 bg-red-300/30 animate-ripple rounded-full"></span>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </SidebarMenuItem>
  );
}
