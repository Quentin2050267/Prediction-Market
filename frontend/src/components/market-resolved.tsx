import { Button } from "./ui/button";
import { prepareContractCall } from "thirdweb";
import { useSendAndConfirmTransaction } from "thirdweb/react";
import { contract, oracleContract } from "@/constants/contract";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Trophy, CheckCircle } from "lucide-react";

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
      <div className="mb-2 bg-green-200 p-2 rounded-md text-center text-xs flex items-center justify-center">
        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
        Resolved: {outcome === 1 ? optionA : optionB}
      </div>
      <Button
        variant="outline"
        className="w-full cursor-pointer"
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
            <Trophy className="mr-2 h-4 w-4" />
            Claim Rewards
          </>
        ) : (
          <>No Rewards to Claim</>
        )}
      </Button>
    </div>
  );
}
