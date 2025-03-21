"use client";

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartLegend,
  ChartLegendContent,
  ChartTooltipContent,
} from "./ui/chart";
import { useReadContract } from "thirdweb/react";
import { contract, oracleContract } from "@/constants/contract";
import { toEther } from "thirdweb";
import { TrendingUp, TrendingDown, Calendar, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VoteChartProps {
  index: number;
  title: string;
  category: "Currency" | "General";
  isExpanded?: boolean; // 添加控制展开/折叠的属性
}

interface VoteData {
  date: string;
  yes: number;
  no: number;
  yesTrend?: TrendInfo;
  noTrend?: TrendInfo;
}

interface TrendInfo {
  isUp: boolean;
  isStable?: boolean; // 添加用于表示趋势保持不变的属性
  percent: string;
}

export function VoteChart({
  index,
  title,
  category,
  isExpanded = true,
}: VoteChartProps) {
  const [voteData, setVoteData] = useState<VoteData[]>([]);
  const [optionALabel, setOptionALabel] = useState<string>("Option A");
  const [optionBLabel, setOptionBLabel] = useState<string>("Option B");
  const [chartConfig, setChartConfig] = useState({
    yes: { label: "Yes", color: "#00ff00" },
    no: { label: "No", color: "#ff0000" },
  });

  // 当前选中的数据点索引
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(
    null
  );

  // 最后一个数据点的趋势信息（默认显示）
  const [lastTrendA, setLastTrendA] = useState<TrendInfo>({
    isUp: true,
    percent: "0",
  });
  const [lastTrendB, setLastTrendB] = useState<TrendInfo>({
    isUp: true,
    percent: "0",
  });

  const contractToUse = category === "Currency" ? oracleContract : contract;
  const methodToUse =
    category === "Currency"
      ? "function getMarketInfo(uint256 _marketId) view returns (string assetSymbol, uint8 operator, uint256 targetPrice, uint256 endTime, uint256 duration, uint8 outcome, uint256 totalOptionAShares, uint256 totalOptionBShares, bool resolved)"
      : "function getMarketInfo(uint256 _marketId) view returns (string question, uint256 endTime, uint256 duration, uint8 outcome, string optionA, string optionB, uint256 totalOptionAShares, uint256 totalOptionBShares, bool resolved)";

  // 读取市场信息
  const { data: marketData } = useReadContract({
    contract: contractToUse,
    method: methodToUse,
    params: [BigInt(index)],
  });

  // 读取所有投票数据
  const { data: voteResults } = useReadContract({
    contract: contractToUse,
    method:
      "function getAllVotesByDate(uint256 _marketId) view returns (uint256[] memory dates, uint256[] memory optionAVotes, uint256[] memory optionBVotes)",
    params: [BigInt(index)],
  });

  useEffect(() => {
    if (!marketData) return;

    const market =
      category === "Currency"
        ? {
            endTime: marketData[3],
            duration: marketData[4],
            optionA: "Yes",
            optionB: "No",
          }
        : {
            endTime: marketData[1],
            duration: marketData[2],
            optionA: marketData[4],
            optionB: marketData[5],
          };

    setOptionALabel(market.optionA);
    setOptionBLabel(market.optionB);

    setChartConfig({
      yes: { label: market.optionA, color: "#00ff00" },
      no: { label: market.optionB, color: "#ff0000" },
    });
  }, [marketData, category]);

  // 处理投票数据
  useEffect(() => {
    if (!voteResults) {
      setVoteData([]);
      return;
    }

    const [dates, optionAVotes, optionBVotes] = voteResults;

    // 首先创建基本投票数据
    const votes: VoteData[] = dates.map((date: bigint, i: number) => {
      const timestamp = Number(date) * 86400 * 1000; // 将天数转换为毫秒时间戳
      return {
        date: new Date(timestamp).toLocaleDateString(),
        yes: optionAVotes[i] ? parseInt(toEther(optionAVotes[i])) : 0,
        no: optionBVotes[i] ? parseInt(toEther(optionBVotes[i])) : 0,
      };
    });

    // 然后为每个数据点计算趋势信息
    const votesWithTrends = votes.map((vote, index) => {
      // 第一个数据点没有前一天的数据，所以没有趋势
      if (index === 0) return vote;

      const previousVote = votes[index - 1];
      const yesTrend = calculateTrend(vote.yes, previousVote.yes);
      const noTrend = calculateTrend(vote.no, previousVote.no);

      return {
        ...vote,
        yesTrend,
        noTrend,
      };
    });

    setVoteData(votesWithTrends);

    // 设置最后一个数据点的趋势作为默认显示
    if (votesWithTrends.length >= 2) {
      const lastPoint = votesWithTrends[votesWithTrends.length - 1];
      if (lastPoint.yesTrend) setLastTrendA(lastPoint.yesTrend);
      if (lastPoint.noTrend) setLastTrendB(lastPoint.noTrend);

      // 默认选中最后一个点
      setSelectedPointIndex(votesWithTrends.length - 1);
    }
  }, [voteResults]);

  // 计算趋势辅助函数 - 更新以处理不变的情况
  const calculateTrend = (
    current: number,
    previous: number
  ): TrendInfo | undefined => {
    if (previous === 0 && current > 0) {
      return {
        isUp: true,
        percent: "100",
      };
    }

    if (previous > 0 && current === 0) {
      return {
        isUp: false,
        percent: "100",
      };
    }

    if (previous === current) {
      return {
        isUp: true,
        isStable: true,
        percent: "0.0",
      };
    }

    // 正常情况：两天都有份额，计算百分比变化
    if (current > 0 && previous > 0) {
      const percentChange = ((current - previous) / previous) * 100;

      return {
        isUp: percentChange >= 0,
        percent: Math.abs(percentChange).toFixed(1),
      };
    }

    // 两天都没有份额，无趋势
    return undefined;
  };

  // 点击图表时的处理函数
  const handleChartClick = (data: any) => {
    if (data && data.activeTooltipIndex !== undefined) {
      setSelectedPointIndex(data.activeTooltipIndex);
    }
  };

  // 获取当前选中数据点的趋势信息
  const getCurrentTrends = () => {
    if (
      selectedPointIndex !== null &&
      selectedPointIndex > 0 &&
      voteData[selectedPointIndex]
    ) {
      return {
        trendA: voteData[selectedPointIndex].yesTrend || lastTrendA,
        trendB: voteData[selectedPointIndex].noTrend || lastTrendB,
        date: voteData[selectedPointIndex].date,
      };
    }

    return {
      trendA: lastTrendA,
      trendB: lastTrendB,
      date: voteData.length > 0 ? voteData[voteData.length - 1].date : "",
    };
  };

  // 获取日期范围
  const getDateRange = () => {
    if (voteData.length <= 1) return "";
    return `${voteData[0].date} - ${voteData[voteData.length - 1].date}`;
  };

  // 渲染趋势信息组件 - 更新以显示稳定趋势
  const renderTrendInfo = (trend: TrendInfo, label: string, color: string) => (
    <div className="flex items-center gap-1">
      <Badge
        variant="outline"
        style={{
          backgroundColor: color + "20",
          borderColor: color,
        }}
        className="h-5 px-1.5 text-[10px] justify-center"
      >
        {label}
      </Badge>
      {trend && (
        <span className="flex items-center text-[10px]">
          {trend.isStable ? (
            <>
              <Minus className="h-2.5 w-2.5 mr-0.5 text-gray-500" />
              <span className="text-gray-500">{trend.percent}%</span>
            </>
          ) : trend.isUp ? (
            <>
              <TrendingUp className="h-2.5 w-2.5 mr-0.5 text-green-500" />
              <span className="text-green-500">+{trend.percent}%</span>
            </>
          ) : (
            <>
              <TrendingDown className="h-2.5 w-2.5 mr-0.5 text-red-500" />
              <span className="text-red-500">-{trend.percent}%</span>
            </>
          )}
        </span>
      )}
    </div>
  );

  // 获取当前要显示的趋势
  const { trendA, trendB, date } = getCurrentTrends();

  return (
    <Card>
      <CardHeader className="py-2 px-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-sm">{title}</CardTitle>
            <CardDescription className="text-xs">
              Voting trend for {category.toLowerCase()} market
            </CardDescription>
          </div>

          {/* 显示当前选中点的趋势信息 */}
          {voteData.length > 1 && (
            <div className="flex flex-col gap-1 mt-0.5">
              {selectedPointIndex !== null && selectedPointIndex > 0 && (
                <div className="text-[10px] text-muted-foreground mb-0.5 text-right">
                  {date}
                </div>
              )}
              {renderTrendInfo(trendA, optionALabel, chartConfig.yes.color)}
              {renderTrendInfo(trendB, optionBLabel, chartConfig.no.color)}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent
        className="p-4 pb-0"
        style={{
          maxHeight: isExpanded ? "300px" : "0",
          overflow: "hidden",
          opacity: isExpanded ? 1 : 0,
          transition: "max-height 0.5s ease-out, opacity 0.5s ease-out",
        }}
      >
        <div className="h-[260px]">
          <ChartContainer config={chartConfig} className="w-full h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={voteData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 0,
                }}
                onClick={handleChartClick}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  opacity={0.5}
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={5}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  isAnimationActive={false}
                  cursor={{ strokeDasharray: "3 3" }}
                />
                <ChartLegend
                  content={<ChartLegendContent />}
                  verticalAlign="top"
                />

                <Line
                  type="monotone"
                  dataKey="yes"
                  stroke={chartConfig.yes.color}
                  name={optionALabel}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{
                    r: 5,
                    onClick: (_, index) => setSelectedPointIndex(index),
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="no"
                  stroke={chartConfig.no.color}
                  name={optionBLabel}
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  activeDot={{
                    r: 5,
                    onClick: (_, index) => setSelectedPointIndex(index),
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
      <CardFooter
        className="p-4 pt-2"
        style={{
          maxHeight: isExpanded ? "40px" : "0",
          overflow: "hidden",
          opacity: isExpanded ? 1 : 0,
          transition: "max-height 0.5s ease-out, opacity 0.5s ease-out",
        }}
      >
        <div className="w-full">
          {/* 只保留日期范围信息 */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{getDateRange()}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
