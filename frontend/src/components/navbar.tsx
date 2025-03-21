import React, { useState, useRef, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
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
  TrendingUpIcon,
  NewspaperIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";

interface NavbarProps {
  category: "Currency" | "General";
  setCategory: (category: "Currency" | "General") => void;
  onSearch?: (query: string, category: "Currency" | "General") => void;
}

export function Navbar({ category, setCategory, onSearch }: NavbarProps) {
  const [isCurrencyDialogOpen, setIsCurrencyDialogOpen] = useState(false);
  const [isGeneralDialogOpen, setIsGeneralDialogOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when search is expanded
  useEffect(() => {
    if (isSearchExpanded && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchExpanded]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Execute search logic
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim(), category);
    }
    // Keep search open for refinement
  };

  const handleSearchClick = () => {
    setIsSearchExpanded(true);
  };

  const handleSearchBlur = (e: React.FocusEvent) => {
    // Make sure we're not closing when clicking the search button
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (!searchQuery.trim()) {
        setIsSearchExpanded(false);
      }
    }
  };

  const handleSearchClear = () => {
    setSearchQuery("");
    if (onSearch) {
      onSearch("", category);
    }
    setIsSearchExpanded(false);
  };

  const handleCategoryChange = (newCategory: "Currency" | "General") => {
    setCategory(newCategory);
    // 如果正在搜索，切换类别后应用搜索到新类别
    if (searchQuery.trim() && onSearch) {
      onSearch(searchQuery.trim(), newCategory);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "relative flex items-center overflow-hidden transition-all duration-300 ease-in-out",
          isSearchExpanded ? "w-32 sm:w-36 md:w-40" : "w-24 md:w-28"
        )}
        onBlur={handleSearchBlur}
      >
        <div className="flex w-full">
          <form
            onSubmit={handleSearch}
            className={cn(
              "absolute inset-0 flex w-full items-center transition-opacity duration-300",
              isSearchExpanded
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            )}
          >
            <Input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search Markets`}
              className="h-8 rounded-r-none border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="h-8 rounded-l-none border-l-0 px-2"
            >
              <SearchIcon className="h-4 w-4" />
            </Button>

            {/* 当有搜索内容时，显示清除按钮 */}
            {searchQuery.trim() && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="absolute right-10 h-8 w-8 px-0"
                onClick={handleSearchClear}
              >
                <XIcon className="h-3 w-3" />
              </Button>
            )}
          </form>

          <Button
            variant="outline"
            size="sm"
            className={cn(
              "ml-0 mr-0 transition-all duration-300 whitespace-nowrap w-full",
              isSearchExpanded
                ? "opacity-0 pointer-events-none"
                : "opacity-100 pointer-events-auto"
            )}
            onClick={handleSearchClick}
          >
            <SearchIcon className="h-4 w-4" />
            <span className="ml-1 hidden md:inline">Search</span>
          </Button>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            Category:{" "}
            <Badge
              className={cn(
                "ml-1 text-xs",
                category === "Currency"
                  ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                  : "bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
              )}
            >
              {category}
            </Badge>
            <ChevronDownIcon className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            onClick={() => handleCategoryChange("Currency")}
            className="gap-2"
          >
            <DollarSignIcon className="h-4 w-4 text-green-500" />
            Currency Markets
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => handleCategoryChange("General")}
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
