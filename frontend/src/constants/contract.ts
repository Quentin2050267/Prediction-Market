import { client } from "@/app/client";
import { defineChain, getContract } from "thirdweb";
import { base } from "thirdweb/chains";
import { kaiaTestnet } from "@/chain.config";

export const predictionMarketContractAddress =
  process.env.NEXT_PUBLIC_PREDICTION_MARKET_CONTRACT_ADDRESS ;

export const tokenContractAddress =
  process.env.NEXT_PUBLIC_SWAN_TOKEN_CONTRACT_ADDRESS ;

export const oracleContractAddress =
  process.env.NEXT_PUBLIC_ORACLE_CONTRACT_ADDRESS ;

if (
  !process.env.NEXT_PUBLIC_PREDICTION_MARKET_CONTRACT_ADDRESS ||
  !process.env.NEXT_PUBLIC_SWAN_TOKEN_CONTRACT_ADDRESS ||
  !process.env.NEXT_PUBLIC_ORACLE_CONTRACT_ADDRESS
) {
  console.warn("Some contract addresses are missing in environment variables");
}

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