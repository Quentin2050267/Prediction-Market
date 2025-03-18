import { client } from "@/app/client";
import { defineChain, getContract } from "thirdweb";
import { base } from "thirdweb/chains";
import { kaiaTestnet } from "@/chain.config";


export const predictionMarketContractAddress = "0xd736E96C8D8ac4E93a63BdF5FeDd03621619F10A";
export const tokenContractAddress = "0x63A334F227487F6f7ED638D5b3C76d1587c31C01";
export const oracleContractAddress = "0xDa5492322495d8a45f64d8bcE930c1d8fEdbf555";

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