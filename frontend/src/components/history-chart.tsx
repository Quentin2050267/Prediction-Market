import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from './ui/chart';
import { useReadContract } from 'thirdweb/react';
import { contract, oracleContract } from '@/constants/contract';
import { toEther } from "thirdweb";

interface VoteChartProps {
    index: number;
    title: string;
    category: 'Currency' | 'General';
}

interface VoteData {
    date: string;
    yes: number;
    no: number;
}

export function VoteChart({ index, title, category }: VoteChartProps) {
    const [voteData, setVoteData] = useState<VoteData[]>([]);
    const [optionALabel, setOptionALabel] = useState<string>('Option A');
    const [optionBLabel, setOptionBLabel] = useState<string>('Option B');
    const [chartConfig, setChartConfig] = useState({
        yes: { label: 'Yes', color: '#00ff00' },
        no: { label: 'No', color: '#ff0000' },
    });

    const contractToUse = category === 'Currency' ? oracleContract : contract;
    const methodToUse = category === 'Currency' ? 
        "function getMarketInfo(uint256 _marketId) view returns (string assetSymbol, uint8 operator, uint256 targetPrice, uint256 endTime, uint256 duration, uint8 outcome, uint256 totalOptionAShares, uint256 totalOptionBShares, bool resolved)" 
        : 
        "function getMarketInfo(uint256 _marketId) view returns (string question, uint256 endTime, uint256 duration, uint8 outcome, string optionA, string optionB, uint256 totalOptionAShares, uint256 totalOptionBShares, bool resolved)";

    // 读取市场信息
    const { data: marketData } = useReadContract({
        contract: contractToUse,
        method: methodToUse,
        params: [BigInt(index)]
    });

    useEffect(() => {
        if (!marketData) return;

        const market = category === 'Currency' ? {
            endTime: marketData[3],
            duration: marketData[4],
            optionA: 'Yes',
            optionB: 'No'
        } : {
            endTime: marketData[1],
            duration: marketData[2],
            optionA: marketData[4],
            optionB: marketData[5]
        };

        setOptionALabel(market.optionA);
        setOptionBLabel(market.optionB);

        setChartConfig({
            yes: { label: market.optionA, color: '#00ff00' },
            no: { label: market.optionB, color: '#ff0000' },
        });
    }, [marketData, category]);

    // 计算时间范围
    const endTime = marketData ? Number(category === 'Currency' ? marketData[3] : marketData[1]) : 0;
    const duration = marketData ? Number(category === 'Currency' ? marketData[4] : marketData[2]) : 0;
    const startTime = endTime - duration;

    // **批量读取投票数据**
    const voteResults = Array.from({ length: (endTime - startTime) / 86400 + 1 }, (_, i) => {
        const timestamp = startTime + i * 86400;
        const date = Math.floor(timestamp / 86400);

        return useReadContract({
            contract: contractToUse,
            method: "function getVotesByDate(uint256 _marketId, uint256 _date) view returns (uint256 optionAVotes, uint256 optionBVotes)",
            params: [BigInt(index), BigInt(date)]
        });
    });

    // 监听 `voteResults` 并更新 `voteData`
    useEffect(() => {
        if (!voteResults.length) return;

        const votes: VoteData[] = voteResults.map(({ data }, i) => {
            const timestamp = startTime + i * 86400;
            return {
                date: new Date(timestamp * 1000).toLocaleDateString(),
                yes: data ? parseInt(toEther(data[0])) : 0,
                no: data ? parseInt(toEther(data[1]))  : 0
            };
        });

        // // 人为添加一些投票数据
        // votes.push(
        //     { date: '2025-03-01', yes: 50, no: 30 },
        //     { date: '2025-03-02', yes: 60, no: 40 },
        //     { date: '2025-03-03', yes: 70, no: 50 }
        // );

        setVoteData(votes);
    }, [index, startTime]);

    return (
        <div className="w-full h-96 mb-12">
            {title && <h2 className="text-center text-xl font-semibold mb-4">{title}</h2>}
            <ChartContainer config={chartConfig} className="w-full h-full">
                <LineChart data={voteData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} verticalAlign="top" />
                    <Line type="monotone" dataKey="yes" stroke={chartConfig.yes.color} name={optionALabel} />
                    <Line type="monotone" dataKey="no" stroke={chartConfig.no.color} name={optionBLabel} />
                </LineChart>
            </ChartContainer>
        </div>
    );
}