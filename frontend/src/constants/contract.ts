import { client } from "@/app/client";
import { defineChain, getContract } from "thirdweb";
import { base } from "thirdweb/chains";
import { kaiaTestnet } from "@/chain.config";

export const tokenContractAddress = "0xA35a527ba1db125E5219C03d8Ae60bA7CcC54b60";
export const predictionMarketContractAddress = "0xb86C41D50fB94dCE0b04fA4c833750d3b1fa18Ae";
export const oracleContractAddress = "0x8a78F4443Fa7e9BfC35B0780608f8923E488eee6";
export const candidateContractAddress = "0x50Cd7231A677b06a5b799922D313f38f50fF2D58";

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

export const oracleContract = getContract({
    client: client,
    // chain: base,
    address: oracleContractAddress,
    chain: kaiaTestnet
});

export const candidateContract = getContract({
    client: client,
    // chain: base,
    address: candidateContractAddress,
    chain: kaiaTestnet
});