import { client } from "@/app/client";
import { defineChain, getContract } from "thirdweb";
import { base } from "thirdweb/chains";
import { kaiaTestnet } from "@/chain.config";

export const tokenContractAddress = "0xafD6cDEb47D71D1Ff47D16209D03C2B77DeaCF6d";
export const predictionMarketContractAddress = "0x673d6FE94C7E152b94B5a18D0426D8217096bE50";
export const oracleContractAddress = "0x51DCdea689d26d3ca03C2F39ca52EbA54875E7aD";
export const candidateContractAddress = "0x324397a201BE5E31BD5f7B8201970A944dAb314D";
// Addresses for new quadratic voting contracts
export const quadraticContractAddress = "0x4d3a45Ced5d4eFBb1027a5AcF7De46a2CaD58126"; // To be updated after deployment
export const quadraticOracleContractAddress = "0x7BAf6Ebf8FeE8413A3941F6Ce15a37CebAb7f415";
export const ammContractAddress = "0xd80525F9f5C903a0fe31069DC3d57FF9a5f1E732" 
 // To be updated after deployment

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

// New quadratic voting contracts
export const quadraticContract = getContract({
    client: client,
    address: quadraticContractAddress,
    chain: kaiaTestnet
});

export const quadraticOracleContract = getContract({
    client: client,
    address: quadraticOracleContractAddress,
    chain: kaiaTestnet
});

// AMM contract
export const ammContract = getContract({
    client: client,
    address: ammContractAddress,
    chain: kaiaTestnet
});