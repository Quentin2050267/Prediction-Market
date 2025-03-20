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
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { tokenContract, tokenContractAddress } from "@/constants/contract";

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

interface NavbarProps {
  toggleSidebar: () => void;
}

export function Navbar({ toggleSidebar }: NavbarProps) {
  const account = useActiveAccount();
  const [isClaimLoading, setIsClaimLoading] = useState(false);
  const { toast } = useToast();

  const { mutateAsync: sendTransaction } = useSendAndConfirmTransaction();

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
        <img src="/logo-black.svg" alt="Logo" className="h-8 w-8" />
        <h1 className="text-2xl font-bold m-0">Swan³ Prediction Market</h1>
      </div>
      <div className="items-center flex gap-2">
        <Button onClick={toggleSidebar} variant="outline">
          Release Pool
        </Button>
        {account && (
          <Button
            onClick={handleClaimTokens}
            disabled={isClaimLoading}
            variant="outline"
          >
            {isClaimLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Claiming...
              </>
            ) : (
              "Claim Tokens"
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
