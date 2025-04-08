import { Button } from "./ui/button";
import { prepareContractCall } from "thirdweb";
import { useSendAndConfirmTransaction } from "thirdweb/react";
import { contract, oracleContract } from "@/constants/contract";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Trophy, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketResolvedProps {
  marketId: number;
  outcome: number;
  optionA: string;
  optionB: string;
  category: "Currency" | "General";
  canClaim: boolean;
}

export function MarketResolved({
  marketId,
  outcome,
  optionA,
  optionB,
  category,
  canClaim,
}: MarketResolvedProps) {
  const { mutateAsync: mutateTransaction } = useSendAndConfirmTransaction();

  const contractToUse = category === "Currency" ? oracleContract : contract;
  const [isClaimLoading, setIsClaimLoading] = useState(false);
  const { toast } = useToast();

  const isOptionA = outcome === 1;

  const handleClaimRewards = async () => {
    setIsClaimLoading(true);
    try {
      const tx = await prepareContractCall({
        contract: contractToUse,
        method: "function claimWinnings(uint256 _marketId)",
        params: [BigInt(marketId)],
      });

      await mutateTransaction(tx);
      toast({
        title: "Rewards Claimed",
        description:
          "Your rewards have been claimed successfully, please refresh the page and check your wallet balance.",
        duration: 5000, // 5 seconds
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Rewards Claim Failed",
        description: "An error occurred while claiming rewards.",
        variant: "destructive",
      });
    } finally {
      setIsClaimLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          "mb-2 p-2 rounded-md text-center text-xs flex items-center justify-center",
          isOptionA
            ? "bg-green-600/30 text-green-900 "
            : "bg-red-600/30 text-red-900 "
        )}
      >
        <CheckCircle
          className={cn(
            "mr-1 h-4 w-4",
            isOptionA ? "text-green-700" : "text-red-700"
          )}
        />
        Resolved: {isOptionA ? optionA : optionB}
      </div>
      <Button
        variant="outline"
        className={cn(
          "w-full cursor-pointer",
          canClaim &&
            "border-2 border-yellow-500 bg-yellow-600/30 text-yellow-900 hover:bg-yellow-700/50 hover:text-black"
        )}
        onClick={handleClaimRewards}
        disabled={isClaimLoading || !canClaim}
      >
        {isClaimLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Claiming...
          </>
        ) : canClaim ? (
          <>
            <Trophy className="mr-2 h-4 w-4 text-yellow-700" />
            Claim Rewards
          </>
        ) : (
          <>No Rewards to Claim</>
        )}
      </Button>
    </div>
  );
}
