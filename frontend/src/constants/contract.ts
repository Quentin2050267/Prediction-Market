import { client } from "@/app/client";
import { defineChain, getContract } from "thirdweb";
import { base } from "thirdweb/chains";
import { kaiaTestnet } from "@/chain.config";

export const predictionMarketContractAddress = "0xC5eee3Ab97335f82525744b213C4EE0C225D7416";
export const tokenContractAddress = "0xF7609143B2dc6E7c85B2b6309B58f0Ec56D9C415";
export const oracleContractAddress = "0x44001e0C60e8240B10A18664ecCc3Ea3ea5a0C6A";
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

export const oracleContract = getContract({
    client: client,
    // chain: base,
    address: oracleContractAddress,
    chain: kaiaTestnet
});