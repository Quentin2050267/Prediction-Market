import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
} from "./ui/dropdown-menu";
import {
  CreateCurrencyMarketDialog,
  CreateGeneralMarketDialog,
} from "./market-create-dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  PlusIcon,
  ChevronDownIcon,
  DollarSignIcon,
  GlobeIcon,
  BarChartIcon,
  TrendingUpIcon,
  MessagesSquareIcon,
  NewspaperIcon,
} from "lucide-react";

interface NavbarProps {
  category: "Currency" | "General";
  setCategory: (category: "Currency" | "General") => void;
}

export function Navbar({ category, setCategory }: NavbarProps) {
  const [isCurrencyDialogOpen, setIsCurrencyDialogOpen] = useState(false);
  const [isGeneralDialogOpen, setIsGeneralDialogOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Category:{" "}
            <Badge variant="secondary" className="ml-1">
              {category}
            </Badge>
            <ChevronDownIcon className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            onClick={() => setCategory("Currency")}
            className="gap-2"
          >
            <DollarSignIcon className="h-4 w-4 text-green-500" />
            Currency Markets
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setCategory("General")}
            className="gap-2"
          >
            <GlobeIcon className="h-4 w-4 text-blue-500" />
            General Markets
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <PlusIcon className="mr-1 h-4 w-4" />
            <span className="hidden lg:inline">Create Market</span>
            <span className="lg:hidden">Create</span>
            <ChevronDownIcon className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            onClick={() => setIsCurrencyDialogOpen(true)}
            className="gap-2"
          >
            <TrendingUpIcon className="h-4 w-4 text-green-500" />
            Currency Forecast
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsGeneralDialogOpen(true)}
            className="gap-2"
          >
            <NewspaperIcon className="h-4 w-4 text-blue-500" />
            General Question
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateCurrencyMarketDialog
        isOpen={isCurrencyDialogOpen}
        onOpenChange={setIsCurrencyDialogOpen}
      />
      <CreateGeneralMarketDialog
        isOpen={isGeneralDialogOpen}
        onOpenChange={setIsGeneralDialogOpen}
      />
    </div>
  );
}
