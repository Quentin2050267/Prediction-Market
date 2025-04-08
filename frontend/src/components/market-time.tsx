import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Clock, AlertTriangle, CheckCircle, HourglassIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MarketTimeProps {
  endTime: bigint;
  category: "Currency" | "General";
  isResolved: boolean;
  className?: string;
}

interface TimeLeft {
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  total: number;
}

const formatDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const calculateTimeLeft = (endTime: number): TimeLeft => {
  const difference = endTime - new Date().getTime();

  if (difference <= 0) {
    return { total: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
    total: difference,
  };
};

// Get the most significant time unit for display
const getMainTimeDisplay = (
  timeLeft: TimeLeft
): { value: number; unit: string } => {
  if (!timeLeft.total) return { value: 0, unit: "s" };

  if (timeLeft.days && timeLeft.days > 0) {
    return { value: timeLeft.days, unit: "d" };
  }
  if (timeLeft.hours && timeLeft.hours > 0) {
    return { value: timeLeft.hours, unit: "h" };
  }
  if (timeLeft.minutes && timeLeft.minutes > 0) {
    return { value: timeLeft.minutes, unit: "m" };
  }
  return { value: timeLeft.seconds || 0, unit: "s" };
};

export function MarketTime({
  endTime,
  category,
  isResolved,
  className,
}: MarketTimeProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(
    calculateTimeLeft(Number(endTime) * 1000)
  );
  const [resolveTimeLeft, setResolveTimeLeft] = useState<TimeLeft>(
    calculateTimeLeft(Number(endTime) * 1000 + 60 * 1000)
  );

  const endTimeMs = Number(endTime) * 1000;
  const isEnded = endTimeMs < new Date().getTime();
  const formattedEndDate = formatDate(endTimeMs);

  // Get the primary time display
  const mainTimeDisplay = getMainTimeDisplay(timeLeft);
  const resolveMainTimeDisplay = getMainTimeDisplay(resolveTimeLeft);

  // Calculate urgency level for color coding
  const getUrgencyColor = (timeLeft: TimeLeft): string => {
    if (!timeLeft.total) return "bg-red-100 border-red-200 text-red-700";

    if (timeLeft.days && timeLeft.days > 2)
      return "bg-green-50 border-green-200 text-green-700";
    if (
      (timeLeft.days && timeLeft.days > 0) ||
      (timeLeft.hours && timeLeft.hours > 12)
    )
      return "bg-blue-50 border-blue-200 text-blue-700";
    if (timeLeft.hours && timeLeft.hours > 1)
      return "bg-yellow-50 border-yellow-200 text-yellow-700";

    return "bg-orange-50 border-orange-200 text-orange-700";
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft(Number(endTime) * 1000));
      setResolveTimeLeft(calculateTimeLeft(Number(endTime) * 1000 + 60 * 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  // Format detailed time display
  const formatDetailedTime = (time: TimeLeft): string => {
    if (!time.total) return "Ended";

    const parts = [];
    if (time.days) parts.push(`${time.days}d`);
    if (time.hours) parts.push(`${time.hours}h`);
    if (time.minutes) parts.push(`${time.minutes}m`);
    if (time.seconds) parts.push(`${time.seconds}s`);

    return parts.join(" ");
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <TooltipProvider>
        {isResolved ? (
          <Badge
            variant="outline"
            className="bg-green-50 border-green-200 text-green-700 flex items-center gap-1 py-1 h-auto"
          >
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Resolved</span>
          </Badge>
        ) : isEnded ? (
          <div className="flex gap-2 items-center">
            <Badge
              variant="outline"
              className="bg-red-50 border-red-200 text-red-700 flex items-center gap-1 py-1 h-auto"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Ended</span>
            </Badge>

            {category === "Currency" && !isResolved && (
              <Tooltip>
                <TooltipTrigger>
                  <Badge
                    variant="outline"
                    className={cn(
                      "flex items-center gap-1 py-1 h-auto",
                      getUrgencyColor(resolveTimeLeft)
                    )}
                  >
                    <HourglassIcon className="h-3.5 w-3.5" />
                    <span>
                      Resolves in {resolveMainTimeDisplay.value}
                      {resolveMainTimeDisplay.unit}
                    </span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  <p>
                    Time to resolution: {formatDetailedTime(resolveTimeLeft)}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    End time: {formattedEndDate}
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        ) : (
          <Tooltip>
            <TooltipTrigger>
              <Badge
                variant="outline"
                className={cn(
                  "flex items-center gap-1 py-1 h-auto",
                  getUrgencyColor(timeLeft)
                )}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Ends in {mainTimeDisplay.value}
                  {mainTimeDisplay.unit}
                </span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p>Time remaining: {formatDetailedTime(timeLeft)}</p>
              <p className="text-muted-foreground mt-1">
                End time: {formattedEndDate}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </TooltipProvider>
    </div>
  );
}
