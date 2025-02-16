import { client } from "@/app/client";
import { defineChain, getContract } from "thirdweb";
import { base } from "thirdweb/chains";

export const predictionMarketContractAddress = "";
export const tokenContractAddress = "";
// please go to thirdweb.io to get the contract address
export const contract = getContract({
    client: client,
    chain: base,
    address: predictionMarketContractAddress,
    // chain: defineChain({})
});

export const tokenContract = getContract({
    client: client,
    chain: base,
    address: tokenContractAddress,
});