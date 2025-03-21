import { cn } from "@/lib/utils";
import { toEther } from "thirdweb";

interface MarketProgressProps {
  optionA: string;
  optionB: string;
  totalOptionAShares: bigint;
  totalOptionBShares: bigint;
}

export function MarketProgress({
  optionA,
  optionB,
  totalOptionAShares,
  totalOptionBShares,
}: MarketProgressProps) {
  const totalShares = Number(totalOptionAShares) + Number(totalOptionBShares);
  const optionAPercentage =
    totalShares > 0 ? (Number(totalOptionAShares) / totalShares) * 100 : 50;
  const optionBPercentage = 100 - optionAPercentage;

  return (
    <div className="mb-4">
      <div className="flex justify-between mb-2">
        <span>
          <span className="font-medium text-sm text-green-700">
            {optionA}: {Math.floor(parseInt(toEther(totalOptionAShares)))}
          </span>
          {totalShares > 0 && (
            <span className="text-xs text-muted-foreground">
              {" "}
              {Math.floor(optionAPercentage)}%
            </span>
          )}
        </span>
        <span>
          <span className="font-medium text-sm text-red-700">
            {optionB}: {Math.floor(parseInt(toEther(totalOptionBShares)))}
          </span>
          {totalShares > 0 && (
            <span className="text-xs text-muted-foreground">
              {" "}
              {Math.floor(optionBPercentage)}%
            </span>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="h-2 bg-green-300 rounded-sm transition-all duration-300"
          style={{ width: `${optionAPercentage}%` }}
        ></div>
        <div
          className="h-2 bg-red-300 rounded-sm transition-all duration-300"
          style={{ width: `${optionBPercentage}%` }}
        ></div>
      </div>
    </div>
  );
}
