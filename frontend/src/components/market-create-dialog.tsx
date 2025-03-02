import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from './ui/dialog';
import { Button } from "./ui/button";
import { useActiveAccount, useSendAndConfirmTransaction } from "thirdweb/react";
import { useToast } from "@/hooks/use-toast"
import { prepareContractCall, readContract, toWei } from "thirdweb";
import { contract, oracleContract } from "@/constants/contract";
import { Loader2 } from "lucide-react";

interface CreateCurrencyMarketDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function CreateCurrencyMarketDialog({ isOpen, onOpenChange }: CreateCurrencyMarketDialogProps) {
    const [baseCurrency, setBaseCurrency] = useState('');
    const [quoteCurrency, setQuoteCurrency] = useState('');
    const [condition, setCondition] = useState('');
    const [targetPrice, setTargetPrice] = useState('');
    const [date, setDate] = useState('');
    const [summary, setSummary] = useState('');
    const { mutateAsync: mutateTransaction } = useSendAndConfirmTransaction();
    const { toast } = useToast()
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (baseCurrency && quoteCurrency && condition && targetPrice && date) {
            setSummary(`You are creating a market where 1 ${baseCurrency} ${condition} ${targetPrice} ${quoteCurrency} by ${new Date(date).toLocaleString()}`);
        } else {
            setSummary('');
        }
    }, [baseCurrency, quoteCurrency, condition, targetPrice, date]);

    const handleCreateMarket = async () => {
        const duration = Math.floor(new Date(date).getTime() / 1000) - Math.floor(Date.now() / 1000);
        const assetSymbol = (baseCurrency + '_' + quoteCurrency).toLowerCase();
        const num_condition = condition === '>' ? 1 : condition === '<' ? 2 : 3;
        setIsCreating(true);
        try {
            const tx = await prepareContractCall({
                contract: oracleContract,
                method: "function createMarket(string _assetSymbol, uint8 _operator, uint256 _targetPrice, uint256 _duration) returns (uint256)",
                params: [assetSymbol, num_condition, toWei(targetPrice), BigInt(duration)],
            });
            await mutateTransaction(tx);

            // Show success toast
            toast({
                title: "Market Created",
                description: "Your market has been created successfully",
                duration: 5000, // 5 seconds
            })

        } catch (error) {
            console.error(error);
            // Optionally show error toast
            toast({
                title: "Create Market Error",
                description: "There was an error creating the market",
                variant: "destructive",
            })
        } finally {
            setIsCreating(false);
        }

        setBaseCurrency('');
        setQuoteCurrency('');
        setCondition('');
        setTargetPrice('');
        setDate('');
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Currency Market</DialogTitle>
                    <DialogDescription>
                        Fill in the details to create a new currency market.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Base Currency:</label>
                        <select
                            className="w-full p-2 border rounded"
                            value={baseCurrency}
                            onChange={(e) => setBaseCurrency(e.target.value)}
                        >
                            <option value="">Select Base Currency</option>
                            <option value="BTC">BTC</option>
                            <option value="ETH">ETH</option>
                            <option value="LINK">LINK</option>
                            <option value="DOGE">DOGE</option>
                            <option value="BCH">BCH</option>
                            <option value="AVAX">AVAX</option>
                            <option value="DOT">DOT</option>
                            <option value="AAVE">AAVE</option>
                            <option value="UNI">UNI</option>
                            <option value="LTC">LTC</option>
                            <option value="SOL">SOL</option>
                            <option value="MKR">MKR</option>
                            <option value="COMP">COMP</option>
                            <option value="SUSHI">SUSHI</option>
                            <option value="XRP">XRP</option>
                            <option value="TRX">TRX</option>
                            <option value="ADA">ADA</option>
                            <option value="ATOM">ATOM</option>
                            <option value="BAT">BAT</option>
                            <option value="SNX">SNX</option>
                            <option value="FIL">FIL</option>
                            <option value="EOS">EOS</option>
                            <option value="ETC">ETC</option>
                            <option value="ALGO">ALGO</option>
                            <option value="CRV">CRV</option>
                            <option value="ENJ">ENJ</option>
                            <option value="MANA">MANA</option>
                            <option value="XTZ">XTZ</option>
                            <option value="OMG">OMG</option>
                            <option value="REN">REN</option>
                            <option value="XLM">XLM</option>
                            <option value="RSR">RSR</option>
                            <option value="NEO">NEO</option>
                            {/* 添加其他基础货币 */}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Quote Currency:</label>
                        <select
                            className="w-full p-2 border rounded"
                            value={quoteCurrency}
                            onChange={(e) => setQuoteCurrency(e.target.value)}
                        >
                            <option value="">Select Quote Currency</option>
                            {/* for now only support USDT Oracle query 😿 */}
                            <option value="USDT">USDT</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Condition:</label>
                        <select
                            className="w-full p-2 border rounded"
                            value={condition}
                            onChange={(e) => setCondition(e.target.value)}
                        >
                            <option value="">Select Condition</option>
                            <option value=">">{'>'}</option>
                            <option value="<">{'<'}</option>
                            <option value="=">{'='}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Target Price:</label>
                        <input
                            type="number"
                            placeholder="e.g., 50000"
                            className="w-full p-2 border rounded"
                            value={targetPrice}
                            onChange={(e) => setTargetPrice(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">On:</label>
                        <input
                            type="datetime-local"
                            className="w-full p-2 border rounded"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                    {summary && (
                        <div className="text-sm text-gray-700">
                            {summary}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={handleCreateMarket} disabled={!baseCurrency || !quoteCurrency || !condition || !targetPrice || !date || isCreating}>
                        {isCreating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create'
                        )}
                    </Button>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}



interface CreateGeneralMarketDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
}

export function CreateGeneralMarketDialog({ isOpen, onOpenChange }: CreateGeneralMarketDialogProps) {
    const [question, setQuestion] = useState('');
    const [optionA, setOptionA] = useState('');
    const [optionB, setOptionB] = useState('');
    const [date, setDate] = useState('');
    const [summary, setSummary] = useState('');
    const { mutateAsync: mutateTransaction } = useSendAndConfirmTransaction();
    const { toast } = useToast()
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        if (question && optionA && optionB && date) {
            setSummary(`You are creating a market with the question: "${question}" and options: "${optionA}" and "${optionB}" by ${new Date(date).toLocaleString()}`);
        } else {
            setSummary('');
        }
    }, [question, optionA, optionB, date]);

    const handleCreateMarket = async () => {
        const duration = Math.floor(new Date(date).getTime() / 1000) - Math.floor(Date.now() / 1000);
        setIsCreating(true);
        try {
            const tx = await prepareContractCall({
                contract: contract,
                method: "function createMarket(string _question, string _optionA, string _optionB, uint256 _duration) returns (uint256)",
                params: [question, optionA, optionB, BigInt(duration)],
            });
            await mutateTransaction(tx);

            // Show success toast
            toast({
                title: "Market Created",
                description: "Your market has been created successfully",
                duration: 5000, // 5 seconds
            })

        } catch (error) {
            console.error(error);
            // Optionally show error toast
            toast({
                title: "Create Market Error",
                description: "There was an error creating the market",
                variant: "destructive",
            })
        } finally {
            setIsCreating(false);
        }

        setQuestion('');
        setOptionA('');
        setOptionB('');
        setDate('');
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create General Market</DialogTitle>
                    <DialogDescription>
                        Fill in the details to create a new general market.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Question:</label>
                        <input
                            type="text"
                            placeholder="e.g., Will it rain tomorrow?"
                            className="w-full p-2 border rounded"
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Option A:</label>
                        <input
                            type="text"
                            placeholder="e.g., Yes"
                            className="w-full p-2 border rounded"
                            value={optionA}
                            onChange={(e) => setOptionA(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Option B:</label>
                        <input
                            type="text"
                            placeholder="e.g., No"
                            className="w-full p-2 border rounded"
                            value={optionB}
                            onChange={(e) => setOptionB(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">On:</label>
                        <input
                            type="datetime-local"
                            className="w-full p-2 border rounded"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                    {summary && (
                        <div className="text-sm text-gray-700">
                            {summary}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button onClick={handleCreateMarket} disabled={!question || !optionA || !optionB || !date || isCreating}>
                        {isCreating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create'
                        )}
                    </Button>
                    <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}