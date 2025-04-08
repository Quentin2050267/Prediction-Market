import { client } from "@/app/client";
import { defineChain, getContract } from "thirdweb";
import { base } from "thirdweb/chains";
import { kaiaTestnet } from "@/chain.config";

export const tokenContractAddress = "0xB718475255960F1def588d197733979c0636d021";
export const predictionMarketContractAddress = "0x82a8b62a8E40760B0170ba4633b7B459C58BbF95";
export const oracleContractAddress = "0x1808B5b554822CD37B8334c03b010dD493C0A243";
export const candidateContractAddress = "0xaFaD481e1BBcC683c3156D4e4D6d599af1ffA0f8";
// Addresses for new quadratic voting contracts
export const quadraticContractAddress = "0x0Ca85d2dF0e2596eBA6695Bc0A535F0697EF6217"; // To be updated after deployment
export const quadraticOracleContractAddress = "0xb20CBF32a31C2695266923587E1bE6a5fFEB836F";
export const ammContractAddress = "0xD695058056630917eBDb476f713A547D7028f144" 
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