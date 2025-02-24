import { client } from "@/app/client";
import { defineChain, getContract } from "thirdweb";
import { base } from "thirdweb/chains";
import { kaiaTestnet } from "@/chain.config";

export const predictionMarketContractAddress = "0xB53CDaa2648a563A0d3A38568378CC1e009a08f3";
export const tokenContractAddress = "0xc9C5A7Bc9E43137E235252dA956bb9BDDD6b3C87";
// please go to https://kairos.kaiascope.com to get the contract address

export const contract = getContract({
    client: client,
    // chain: base,
    address: predictionMarketContractAddress,
    chain: kaiaTestnet
});

export const tokenContract = getContract({
    client: client,
    // chain: base,
    address: tokenContractAddress,
    chain: kaiaTestnet
});