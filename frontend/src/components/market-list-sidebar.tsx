import React, { useEffect, useState } from "react";
import { useReadContract } from "thirdweb/react";
import { contract, oracleContract } from "@/constants/contract";
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

interface Market {
  index: number;
  category: "Currency" | "General";
  title: string;
}

const SidebarMarketList: React.FC = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { data: generalMarketCount } = useReadContract({
    contract: contract,
    method: "function marketCount() view returns (uint256)",
    params: [],
  });

  const { data: currencyMarketCount } = useReadContract({
    contract: oracleContract,
    method: "function marketCount() view returns (uint256)",
    params: [],
  });

  useEffect(() => {
    const fetchMarkets = async () => {
      const generalCount = generalMarketCount ? Number(generalMarketCount) : 0;
      const currencyCount = currencyMarketCount
        ? Number(currencyMarketCount)
        : 0;
      const allMarkets: Market[] = [];

      for (let i = 0; i < generalCount; i++) {
        allMarkets.push({
          index: i,
          category: "General",
          title: `General Market ${i + 1}`,
        });
      }

      for (let i = 0; i < currencyCount; i++) {
        allMarkets.push({
          index: i,
          category: "Currency",
          title: `Currency Market ${i + 1}`,
        });
      }

      setMarkets(allMarkets);
      setIsLoading(false);
    };

    fetchMarkets();
  }, [generalMarketCount, currencyMarketCount]);

  return (
    <Sidebar side="left" variant="floating">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Markets to be released</SidebarGroupLabel>
          <SidebarMenu>
            {isLoading ? (
              <div>Loading...</div>
            ) : (
              markets.map((market) => (
                <SidebarMenuItem key={`${market.category}-${market.index}`}>
                  <SidebarMenuButton>
                    <Badge variant="secondary">{market.category}</Badge>
                    {market.title}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default SidebarMarketList;
