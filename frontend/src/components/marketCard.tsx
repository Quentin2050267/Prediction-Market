import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { useActiveAccount, useReadContract } from "thirdweb/react";
// import { contract } from "@/constants/contract";
import { MarketProgress } from "./market-progress";
import { MarketTime } from "./market-time";
import { MarketCardSkeleton } from "./market-card-skeleton";
import { MarketResolved } from "./market-resolved";
import { MarketPending } from "./market-pending";
import { MarketBuyInterface } from "./market-buy-interface";
import { MarketSharesDisplay } from "./market-shares-display";

// Props for the MarketCard component
// index is the market id
// filter is the filter to apply to the market
interface MarketCardProps {
    index: number;
    filter: 'active' | 'pending' | 'resolved';
}

// Interface for the market data
interface Market {
    question: string;
    optionA: string;
    optionB: string;
    endTime: bigint;
    outcome: number;
    totalOptionAShares: bigint;
    totalOptionBShares: bigint;
    resolved: boolean;
}

// Interface for the shares balance
interface SharesBalance {
    optionAShares: bigint;
    optionBShares: bigint;
}

// Function to generate fake market data based on index
const generateFakeMarketData = (index: number) => {
    const questions = [
        "What is the capital of France?",
        "Who will win the next election?",
        "Will it rain tomorrow?",
        "What is the population of New York?",
    ];

    const options = [
        ["Paris", "Berlin"],
        ["Candidate A", "Candidate B"],
        ["Yes", "No"],
        ["More than 8 million", "Less than 8 million"],
    ];

    const isExpired = index % 2 === 0; // 每三个市场中有一个是过期的
    const isResolved = index % 3 === 0; // 每三个市场中有一个是已解决的

    return {
        marketData:
            [questions[index % questions.length],
            options[index % options.length][0],
            options[index % options.length][1],
            BigInt(Math.floor(Date.now()/1000) + (!isExpired ? 3600 : -3600)), // Some markets are active, some are expired
            index % 2,
            BigInt(100*1e18 + index * 20*1e18),
            BigInt(100*1e18 + index * 5*1e18),
            isResolved]
    };
};

export function MarketCard({ index, filter }: MarketCardProps) {
    // Get the active account
    const account = useActiveAccount();

    // Get the market data
    // const { data: marketData, isLoading: isLoadingMarketData } = useReadContract({
    //     contract,
    //     method: "function getMarketInfo(uint256 _marketId) view returns (string question, string optionA, string optionB, uint256 endTime, uint8 outcome, uint256 totalOptionAShares, uint256 totalOptionBShares, bool resolved)",
    //     params: [BigInt(index)]
    // });
    // wait for the contract to be deployed
    const { marketData } = generateFakeMarketData(index);
    // const marketData = [
    //     "What is the capital of France?", 
    //     "Paris", 
    //     "Berlin", 
    //     BigInt(1731095200), 
    //     0, 
    //     BigInt(100), 
    //     BigInt(100), 
    //     false
    // ];
    const isLoadingMarketData = false;

    // Parse the market data
    const market: Market | undefined = marketData ? {
        question: marketData[0],
        optionA: marketData[1],
        optionB: marketData[2],
        endTime: marketData[3],
        outcome: marketData[4],
        totalOptionAShares: marketData[5],
        totalOptionBShares: marketData[6],
        resolved: marketData[7]
    } : undefined;

    // Get the shares balance
    // const { data: sharesBalanceData } = useReadContract({
    //     contract,
    //     method: "function getSharesBalance(uint256 _marketId, address _user) view returns (uint256 optionAShares, uint256 optionBShares)",
    //     params: [BigInt(index), account?.address as string]
    // });
    // wait for the contract to be deployed
    const sharesBalanceData = [BigInt(15*1e18), BigInt(2*1e18)];

    // Parse the shares balance
    const sharesBalance: SharesBalance | undefined = sharesBalanceData ? {
        optionAShares: sharesBalanceData[0],
        optionBShares: sharesBalanceData[1]
    } : undefined;

    // Check if the market is expired
    const isExpired = new Date(Number(market?.endTime) * 1000) < new Date();
    // Check if the market is resolved
    const isResolved = market?.resolved;

    // Check if the market should be shown
    const shouldShow = () => {
        if (!market) return false;

        switch (filter) {
            case 'active':
                return !isExpired;
            case 'pending':
                return isExpired && !isResolved;
            case 'resolved':
                return isExpired && isResolved;
            default:
                return true;
        }
    };

    // If the market should not be shown, return null
    if (!shouldShow()) {
        return null;
    }

    return (
        <Card key={index} className="flex flex-col">
            {isLoadingMarketData ? (
                <MarketCardSkeleton />
            ) : (
                <>
                    <CardHeader>
                        {market && <MarketTime endTime={market.endTime} />}
                        <CardTitle>{market?.question}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {market && (
                            <MarketProgress
                                optionA={market.optionA}
                                optionB={market.optionB}
                                totalOptionAShares={market.totalOptionAShares}
                                totalOptionBShares={market.totalOptionBShares}
                            />
                        )}
                        {new Date(Number(market?.endTime) * 1000) < new Date() ? (
                            market?.resolved ? (
                                <MarketResolved
                                    marketId={index}
                                    outcome={market.outcome}
                                    optionA={market.optionA}
                                    optionB={market.optionB}
                                />
                            ) : (
                                <MarketPending />
                            )
                        ) : (
                            <MarketBuyInterface
                                marketId={index}
                                market={market!}
                            />
                        )}
                    </CardContent>
                    <CardFooter>
                        {market && sharesBalance && (
                            <MarketSharesDisplay
                                market={market}
                                sharesBalance={sharesBalance}
                            />
                        )}
                    </CardFooter>
                </>
            )}
        </Card>
    )
}