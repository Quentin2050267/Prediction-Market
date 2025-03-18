import { client } from "@/app/client";
import { defineChain, getContract } from "thirdweb";
import { base } from "thirdweb/chains";
import { kaiaTestnet } from "@/chain.config";


export const predictionMarketContractAddress = "0x252BD0Bd1C9d6E2D99e8e6Ec04D03c565E8A75A4";
export const tokenContractAddress = "0x4e9E68C4389ddd6120260AD66b4b525030D802D4";
export const oracleContractAddress = "0xd9d17445Ab4D766100BE238Bce71BE6584574fd3";

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