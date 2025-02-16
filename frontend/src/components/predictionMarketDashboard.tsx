'use client'

import { useReadContract } from 'thirdweb/react'
// import { contract } from '@/constants/contract'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MarketCard } from './marketCard'
import { Navbar } from "./navbar"
import { MarketCardSkeleton } from "./market-card-skeleton"
import { Footer } from "./footer"

// for testing the charts
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
const stockData = [
    { date: '2025-02-01', close: 150, open: 145 },
    { date: '2025-02-02', close: 155, open: 150 },
    { date: '2025-02-03', close: 160, open: 155 },
    { date: '2025-02-04', close: 158, open: 160 },
    { date: '2025-02-05', close: 162, open: 158 },
    { date: '2025-02-06', close: 165, open: 162 },
    { date: '2025-02-07', close: 170, open: 165 },
];

export default function PredictionMarketDashboard() {
    // wait for the contract to be deployed
    // const { data: marketCount, isLoading: isLoadingMarketCount } = useReadContract({
    //     contract,
    //     method: "function marketCount() view returns (uint256)",
    //     params: []
    // }); 
    const marketCount = 12;
    const isLoadingMarketCount = false;

    // Show 6 skeleton cards while loading
    const skeletonCards = Array.from({ length: 6 }, (_, i) => (
        <MarketCardSkeleton key={`skeleton-${i}`} />
    ));

    return (
        <div className="min-h-screen flex flex-col">
            <div className="flex-grow container mx-auto p-4">
                <Navbar />
                <div style={{ width: '100%', height: 300 }}>
                    {/* <img 
                        src="https://placehold.co/800x300" 
                        alt="Placeholder Banner" 
                        className="w-full h-auto rounded-lg" 
                    /> */}
                    <ResponsiveContainer>
                        <LineChart data={stockData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            {/* <Legend /> */}
                            <Line type="monotone" dataKey="close" stroke="#ff0000" /> {/* 红色表示收盘价 */}
                            <Line type="monotone" dataKey="open" stroke="#00ff00" /> {/* 绿色表示开盘价 */}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <Tabs defaultValue="active" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="active">Active</TabsTrigger>
                        <TabsTrigger value="pending">Pending Resolution</TabsTrigger>
                        <TabsTrigger value="resolved">Resolved</TabsTrigger>
                    </TabsList>

                    {isLoadingMarketCount ? (
                        <TabsContent value="active" className="mt-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {skeletonCards}
                            </div>
                        </TabsContent>
                    ) : (
                        <>
                            <TabsContent value="active">
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {Array.from({ length: Number(marketCount) }, (_, index) => (
                                        <MarketCard
                                            key={index}
                                            index={index}
                                            filter="active"
                                        />
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="pending">
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {Array.from({ length: Number(marketCount) }, (_, index) => (
                                        <MarketCard
                                            key={index}
                                            index={index}
                                            filter="pending"
                                        />
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="resolved">
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {Array.from({ length: Number(marketCount) }, (_, index) => (
                                        <MarketCard
                                            key={index}
                                            index={index}
                                            filter="resolved"
                                        />
                                    ))}
                                </div>
                            </TabsContent>
                        </>
                    )}
                </Tabs>
            </div>
            <Footer />
        </div>
    );
}