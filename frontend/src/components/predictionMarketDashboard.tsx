"use client";

import { useReadContract } from "thirdweb/react";
import { quadraticContract, quadraticOracleContract } from "@/constants/contract";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MarketCard } from "./market-card";
import { Header } from "./header";
import { MarketCardSkeleton } from "./market-card-skeleton";
import { Footer } from "./footer";
import { useState, useEffect, useMemo } from "react";
import { VoteChart } from "./history-chart";
import { Navbar } from "./navbar";
import { SidebarMarketList } from "./market-list-sidebar";
import styled from "styled-components";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Activity, Clock, CheckCircle } from "lucide-react";

const ChartContainer = styled.div`
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.5s ease-out, opacity 0.5s ease-out;
  opacity: 0;
  padding: 1rem 0;

  &.show {
    max-height: 500px; /* 根据需要调整高度 */
    opacity: 1;
  }
`;

// 存储市场标题的接口
interface MarketTitleCache {
  [key: string]: string; // key 格式: "Currency-0", "General-1" 等
}

// 存储市场状态的接口
interface MarketStatusCache {
  [key: string]: "active" | "pending" | "resolved"; // key 格式: "Currency-0", "General-1" 等
}

export default function PredictionMarketDashboard() {
  const [category, setCategory] = useState<"Currency" | "General">("Currency");
  const [marketCount, setMarketCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMarketIndex, setSelectedMarketIndex] = useState<number | null>(
    null
  );
  const [chartTitle, setChartTitle] = useState("");
  const [showChart, setShowChart] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState<"Currency" | "General">(
    "Currency"
  );
  const [activeTab, setActiveTab] = useState("active");

  // 缓存市场标题，用于搜索
  const [marketTitles, setMarketTitles] = useState<MarketTitleCache>({});
  // 缓存市场状态，用于计数
  const [marketStatuses, setMarketStatuses] = useState<MarketStatusCache>({});
  // 存储过滤后的市场索引
  const [filteredMarketIndices, setFilteredMarketIndices] = useState<
    number[] | null
  >(null);

  // Use quadratic contracts directly
  const currentContract = useMemo(() => 
    category === "Currency" ? quadraticOracleContract : quadraticContract,
    [category]
  );

  const { data: marketCountData, isLoading: isLoadingMarketCount } =
    useReadContract({
      contract: currentContract,
      method: "function marketCount() view returns (uint256)",
      params: [],
    });

  useEffect(() => {
    if (!isLoadingMarketCount) {
      setMarketCount(marketCountData ? Number(marketCountData) : 0);
      setIsLoading(isLoadingMarketCount);
    }
  }, [category, isLoadingMarketCount, marketCountData]);

  // 当搜索条件改变时，更新过滤后的市场列表
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMarketIndices(null);
      return;
    }

    // 过滤与搜索条件匹配的市场索引
    const filteredIndices: number[] = [];
    const query = searchQuery.toLowerCase();
    const prefix = `${searchCategory}-`;

    for (const key in marketTitles) {
      if (key.startsWith(prefix)) {
        const title = marketTitles[key].toLowerCase();
        if (title.includes(query)) {
          const index = parseInt(key.substring(prefix.length));
          filteredIndices.push(index);
        }
      }
    }

    // 按索引排序，确保显示顺序一致
    filteredIndices.sort((a, b) => a - b);

    setFilteredMarketIndices(filteredIndices);
  }, [searchQuery, searchCategory, marketTitles]);

  const handleMarketCardClick = (index: number, title: string) => {
    setSelectedMarketIndex(index);
    setChartTitle(title);
    setShowChart(true);
  };

  // 当市场卡片加载时，缓存标题
  const cacheMarketTitle = (
    index: number,
    title: string,
    marketCategory: "Currency" | "General"
  ) => {
    const key = `${marketCategory}-${index}`;
    setMarketTitles((prev) => {
      if (prev[key] !== title) {
        return { ...prev, [key]: title };
      }
      return prev;
    });
  };

  // 缓存市场状态
  const cacheMarketStatus = (
    index: number,
    status: "active" | "pending" | "resolved",
    marketCategory: "Currency" | "General"
  ) => {
    const key = `${marketCategory}-${index}`;
    setMarketStatuses((prev) => {
      if (prev[key] !== status) {
        return { ...prev, [key]: status };
      }
      return prev;
    });
  };

  // 处理搜索函数
  const handleSearch = (query: string, category: "Currency" | "General") => {
    // 如果搜索类别与当前类别不同，先切换类别
    if (category !== searchCategory) {
      setCategory(category);
      setSearchCategory(category);
    }

    // 更新搜索查询
    setSearchQuery(query);

    // 注意：不再关闭图表，让搜索和图表显示互不干扰
  };

  // Show 6 skeleton cards while loading
  const skeletonCards = Array.from({ length: 6 }, (_, i) => (
    <MarketCardSkeleton key={`skeleton-${i}`} />
  ));

  // 决定是否显示搜索提示条
  const showSearchIndicator = searchQuery.trim().length > 0;

  // 计算每个标签页的结果数量
  const getMarketCountForStatus = (
    status: "active" | "pending" | "resolved"
  ) => {
    // 如果正在加载，返回 0
    if (isLoading) return 0;

    // 确定要统计的索引范围
    let indices = filteredMarketIndices;

    // 如果没有过滤，使用所有市场的索引
    if (indices === null) {
      indices = Array.from({ length: Number(marketCount) }, (_, i) => i);
    }

    // 计算满足状态的市场数量
    let count = 0;
    for (const index of indices) {
      const key = `${category}-${index}`;
      if (marketStatuses[key] === status) {
        count++;
      }
    }

    return count;
  };

  // 渲染市场卡片，过滤掉不匹配搜索的卡片
  const renderMarketCards = (filter: "active" | "pending" | "resolved") => {
    if (isLoading) return skeletonCards;

    // 确定要渲染的索引范围
    let indices = Array.from({ length: Number(marketCount) }, (_, i) => i);

    // 如果有搜索过滤结果，使用过滤后的列表
    if (filteredMarketIndices !== null) {
      indices = filteredMarketIndices;
    }

    if (indices.length === 0 && searchQuery) {
      return (
        <div className="col-span-full text-center p-8 text-muted-foreground">
          No {filter} markets found matching "<strong>{searchQuery}</strong>" in{" "}
          {category} category
        </div>
      );
    }

    return indices.map((index) => (
      <MarketCard
        key={`${category}-${filter}-${index}`}
        index={index}
        filter={filter}
        category={category}
        onClick={handleMarketCardClick}
        onTitleLoad={(title) => cacheMarketTitle(index, title, category)}
        onStatusChange={(status) => cacheMarketStatus(index, status, category)}
        isQuadratic={true}
      />
    ));
  };

  // 计算各标签页的市场数量
  const activeCount = getMarketCountForStatus("active");
  const pendingCount = getMarketCountForStatus("pending");
  const resolvedCount = getMarketCountForStatus("resolved");

  return (
    <div className="min-h-screen flex">
      <SidebarProvider>
        <SidebarMarketList />
        <SidebarInset>
          <div className="flex-grow container mx-auto p-4">
            <Header />

            <ChartContainer className={showChart ? "show" : ""}>
              {showChart && selectedMarketIndex !== null && (
                <VoteChart
                  index={selectedMarketIndex}
                  title={chartTitle}
                  category={category}
                />
              )}
            </ChartContainer>
            <Tabs
              defaultValue="active"
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex w-full flex-col justify-start gap-6"
            >
              <div className="flex justify-between ">
                <TabsList className="grid w-1/2 grid-cols-3">
                  <TabsTrigger
                    value="active"
                    className="flex items-center gap-1"
                  >
                    <Activity className="h-4 w-4" />
                    <span>Active</span>
                    <span className="ml-1 text-xs bg-muted/60 px-1.5 py-0.5 rounded-full">
                      {activeCount}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="pending"
                    className="flex items-center gap-1"
                  >
                    <Clock className="h-4 w-4" />
                    <span>Pending</span>
                    <span className="ml-1 text-xs bg-muted/60 px-1.5 py-0.5 rounded-full">
                      {pendingCount}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="resolved"
                    className="flex items-center gap-1"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Resolved</span>
                    <span className="ml-1 text-xs bg-muted/60 px-1.5 py-0.5 rounded-full">
                      {resolvedCount}
                    </span>
                  </TabsTrigger>
                </TabsList>
                <Navbar
                  category={category}
                  setCategory={setCategory}
                  onSearch={handleSearch}
                />
              </div>

              {isLoading ? (
                <TabsContent value="active" className="mt-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {skeletonCards}
                  </div>
                </TabsContent>
              ) : (
                <>
                  <TabsContent value="active">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {renderMarketCards("active")}
                    </div>
                  </TabsContent>

                  <TabsContent value="pending">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {renderMarketCards("pending")}
                    </div>
                  </TabsContent>

                  <TabsContent value="resolved">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                      {renderMarketCards("resolved")}
                    </div>
                  </TabsContent>
                </>
              )}
            </Tabs>
          </div>
          <Footer />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
