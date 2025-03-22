import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { useSendAndConfirmTransaction } from "thirdweb/react";
import { useToast } from "@/hooks/use-toast";
import { prepareContractCall } from "thirdweb";
import { candidateContract } from "@/constants/contract";
import { Loader2, CalendarIcon } from "lucide-react";
import { priceFeedIds, getPriceFeedId } from "@/pricefeed/priceFeedIds";
import { HermesClient } from "@pythnetwork/hermes-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";

interface CreateCurrencyMarketDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function CreateCurrencyMarketDialog({
  isOpen,
  onOpenChange,
}: CreateCurrencyMarketDialogProps) {
  const [title, setTitle] = useState("");
  const [assetSymbol, setAssetSymbol] = useState("");
  const [condition, setCondition] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [summary, setSummary] = useState("");
  const { mutateAsync: mutateTransaction } = useSendAndConfirmTransaction();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [baseCurrency, setBaseCurrency] = useState("");
  const [quoteCurrency, setQuoteCurrency] = useState("");

  useEffect(() => {
    if (assetSymbol && condition && targetPrice && date) {
      const assetSymbols = assetSymbol?.split("/");
      const marketSymbol = assetSymbols ? assetSymbols[0].toUpperCase() : "";
      const quoteSymbol = assetSymbols ? assetSymbols[1].toUpperCase() : "";
      setSummary(
        `You are creating a market where 1 ${marketSymbol} ${condition} ${targetPrice} ${quoteSymbol} by ${date.toLocaleString()}`
      );
    } else {
      setSummary("");
    }
  }, [assetSymbol, condition, targetPrice, date]);

  useEffect(() => {
    if (assetSymbol) {
      const assetSymbols = assetSymbol?.split("/");
      const marketSymbol = assetSymbols ? assetSymbols[0].toUpperCase() : "";
      const quoteSymbol = assetSymbols ? assetSymbols[1].toUpperCase() : "";
      const conditionText =
        condition === ">" ? "above" : condition === "<" ? "below" : "equal to";

      if (condition && targetPrice) {
        setTitle(
          `Will 1 ${marketSymbol} ${condition} ${targetPrice} ${quoteSymbol}?`
        );
      }
    }
  }, [assetSymbol, condition, targetPrice, title]);

  useEffect(() => {
    const fetchPrice = async () => {
      if (assetSymbol) {
        const connection = new HermesClient("https://hermes.pyth.network", {});
        const priceFeedId = getPriceFeedId(assetSymbol);
        const price = await connection.getLatestPriceUpdates([priceFeedId]);
        const priceValue = price ? price.parsed[0].price.price / 10 ** 8 : 0;
        setCurrentPrice(priceValue);
        const assetSymbols = assetSymbol?.split("/");
        setBaseCurrency(assetSymbols ? assetSymbols[0].toUpperCase() : "");
        setQuoteCurrency(assetSymbols ? assetSymbols[1].toUpperCase() : "");
      }
    };

    fetchPrice();
  }, [assetSymbol]);

  const resetForm = () => {
    setTitle("");
    setAssetSymbol("");
    setCondition("");
    setTargetPrice("");
    setDate(undefined);
  };

  const handleCreateMarket = async () => {
    if (!date || !title) return;

    const resolutionTime = Math.floor(date.getTime() / 1000);
    const num_condition = condition === ">" ? 0 : condition === "<" ? 1 : 2;
    setIsCreating(true);
    try {
      const tx = await prepareContractCall({
        contract: candidateContract,
        method:
          "function createCurrencyMarketCandidate(string _title, string _assetSymbol, uint8 _operator, uint256 _targetPrice, uint256 _resolutionTime) returns (uint256)",
        params: [
          title,
          assetSymbol,
          num_condition,
          BigInt(Math.floor(parseFloat(targetPrice) * 10 ** 8)),
          BigInt(resolutionTime),
        ],
      });
      await mutateTransaction(tx);

      // Show success toast
      toast({
        title: "Market Candidate Created",
        description:
          "Your market has been submitted to the candidate pool. It will be published after receiving enough votes.",
        duration: 5000, // 5 seconds
      });
    } catch (error) {
      console.error(error);
      // Optionally show error toast
      toast({
        title: "Create Market Error",
        description: "There was an error creating the market candidate.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }

    resetForm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) resetForm();
        onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Currency Market</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new currency market. The market will
            go to the candidate pool before release.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Market Title</Label>
            <Input
              id="title"
              type="text"
              placeholder="e.g., Will 1 BTC > 50000 USD? (Automatically Populate)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="assetSymbol">Asset Symbol</Label>
            <Select value={assetSymbol} onValueChange={setAssetSymbol}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Asset Symbol" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Available Pairs</SelectLabel>
                  {Object.keys(priceFeedIds).map((symbol) => (
                    <SelectItem key={symbol} value={symbol}>
                      {symbol}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {currentPrice !== null && (
              <p className="text-sm text-muted-foreground">
                Current Price: 1 {baseCurrency} = {currentPrice.toFixed(8)}{" "}
                {quoteCurrency}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="condition">Condition</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Comparison</SelectLabel>
                  <SelectItem value=">">Greater than (&gt;)</SelectItem>
                  <SelectItem value="<">Less than (&lt;)</SelectItem>
                  <SelectItem value="=">Equal to (=)</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="targetPrice">Target Price</Label>
            <Input
              id="targetPrice"
              type="number"
              placeholder="e.g., 50000"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Market Resolution Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {summary && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">{summary}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={handleCreateMarket}
            disabled={
              !title ||
              !assetSymbol ||
              !condition ||
              !targetPrice ||
              !date ||
              isCreating
            }
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit to Candidate Pool"
            )}
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CreateGeneralMarketDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function CreateGeneralMarketDialog({
  isOpen,
  onOpenChange,
}: CreateGeneralMarketDialogProps) {
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [summary, setSummary] = useState("");
  const { mutateAsync: mutateTransaction } = useSendAndConfirmTransaction();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (question && optionA && optionB && date) {
      setSummary(
        `You are creating a market with the question: "${question}" and options: "${optionA}" and "${optionB}" by ${date.toLocaleString()}`
      );
    } else {
      setSummary("");
    }
  }, [question, optionA, optionB, date]);

  useEffect(() => {
    if (question && !title) {
      setTitle(question);
    }
  }, [question, title]);

  const resetForm = () => {
    setTitle("");
    setQuestion("");
    setOptionA("");
    setOptionB("");
    setDate(undefined);
  };

  const handleCreateMarket = async () => {
    if (!date || !title) return;

    const resolutionTime = Math.floor(date.getTime() / 1000);
    setIsCreating(true);
    try {
      const tx = await prepareContractCall({
        contract: candidateContract,
        method:
          "function createGeneralMarketCandidate(string _title, string _question, string _optionA, string _optionB, uint256 _resolutionTime) returns (uint256)",
        params: [title, question, optionA, optionB, BigInt(resolutionTime)],
      });
      await mutateTransaction(tx);

      // Show success toast
      toast({
        title: "Market Candidate Created",
        description:
          "Your market has been submitted to the candidate pool. It will be published after receiving enough votes.",
        duration: 5000, // 5 seconds
      });
    } catch (error) {
      console.error(error);
      // Optionally show error toast
      toast({
        title: "Create Market Error",
        description: "There was an error creating the market candidate.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }

    resetForm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) resetForm();
        onOpenChange(open);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create General Market</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new general market. The market will
            go to the candidate pool before release.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Market Title</Label>
            <Input
              id="title"
              type="text"
              placeholder="e.g., Will it rain tomorrow? (Automatically Populate)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="question">Question</Label>
            <Input
              id="question"
              type="text"
              placeholder="e.g., Will it rain tomorrow?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="optionA">Option A</Label>
            <Input
              id="optionA"
              type="text"
              placeholder="e.g., Yes"
              value={optionA}
              onChange={(e) => setOptionA(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="optionB">Option B</Label>
            <Input
              id="optionB"
              type="text"
              placeholder="e.g., No"
              value={optionB}
              onChange={(e) => setOptionB(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Market Resolution Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {summary && (
            <div className="rounded-md bg-muted p-3">
              <p className="text-sm text-muted-foreground">{summary}</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={handleCreateMarket}
            disabled={
              !title || !question || !optionA || !optionB || !date || isCreating
            }
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit to Candidate Pool"
            )}
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
