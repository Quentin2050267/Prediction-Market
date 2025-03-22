"use client";

import {
  ConnectButton,
  lightTheme,
  useActiveAccount,
  useSendAndConfirmTransaction,
} from "thirdweb/react";
import { prepareContractCall } from "thirdweb";
import { client } from "@/app/client";
import { kaiaTestnet } from "@/chain.config";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { tokenContract, tokenContractAddress } from "@/constants/contract";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const wallets = [
  inAppWallet({
    auth: {
      options: [
        "google",
        "email",
        "passkey",
        "phone",
        "github",
        "apple",
        "facebook",
        "line",
      ],
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"),
  createWallet("io.rabby"),
  createWallet("io.zerion.wallet"),
];

export function Header() {
  const account = useActiveAccount();
  const [isClaimLoading, setIsClaimLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const { toast } = useToast();

  const { mutateAsync: sendTransaction } = useSendAndConfirmTransaction();

  // 重置动画状态的效果
  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => {
        setShowAnimation(false);
      }, 1000); // 延长动画显示时间
      return () => clearTimeout(timer);
    }
  }, [showAnimation]);

  const handleClaimTokens = async () => {
    setIsClaimLoading(true);
    try {
      const tx = await prepareContractCall({
        contract: tokenContract,
        method: "function claim()",
        params: [],
      });

      await sendTransaction(tx);

      toast({
        title: "Tokens Claimed!",
        description:
          "Your tokens have been successfully claimed. Please refresh the page.",
        duration: 5000,
      });

      // 交易成功后，添加短暂延迟然后显示动画
      setTimeout(() => {
        setShowAnimation(true);
      }, 300);
    } catch (error) {
      console.error(error);
      toast({
        title: "Claim Failed",
        description:
          "There was an error claiming your tokens. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsClaimLoading(false);
    }
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <img src="/logo-black.svg" alt="Logo" className="h-6 w-6" />
        <h1 className="text-2xl font-bold m-0">Swan³ Prediction Market</h1>
      </div>
      <div className="items-center flex gap-2">
        {account && (
          <Button
            onClick={handleClaimTokens}
            disabled={isClaimLoading}
            variant="outline"
            className={cn(
              "relative overflow-hidden",
              showAnimation ? "border-amber-400 text-amber-600" : ""
            )}
          >
            {isClaimLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Claiming...
              </>
            ) : (
              <>
                <Gift
                  className={cn(
                    "mr-2 h-4 w-4 transition-transform duration-300",
                    showAnimation ? "scale-110" : ""
                  )}
                />
                Claim Tokens
              </>
            )}

            {/* 涟漪动画 */}
            {showAnimation && (
              <span className="absolute top-0 left-0 right-0 bottom-0 bg-amber-300/40 animate-ripple rounded-md"></span>
            )}
          </Button>
        )}
        <ConnectButton
          client={client}
          theme={lightTheme()}
          chain={kaiaTestnet}
          connectButton={{
            style: {
              fontSize: "0.75rem !important",
              height: "2.5rem !important",
            },
          }}
          detailsButton={{
            displayBalanceToken: {
              [kaiaTestnet.id]: tokenContractAddress,
            },
          }}
          wallets={wallets}
          connectModal={{ size: "wide" }}
          accountAbstraction={{
            chain: kaiaTestnet,
            sponsorGas: true,
          }}
        />
      </div>
    </div>
  );
}
