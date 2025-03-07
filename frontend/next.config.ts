import type { NextConfig } from "next";
import path from "path";
import dotenv from "dotenv";

// load outter .env
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_PREDICTION_MARKET_CONTRACT_ADDRESS:
      process.env.NEXT_PUBLIC_PREDICTION_MARKET_CONTRACT_ADDRESS,
      NEXT_PUBLIC_SWAN_TOKEN_CONTRACT_ADDRESS:
      process.env.NEXT_PUBLIC_SWAN_TOKEN_CONTRACT_ADDRESS,
    NEXT_PUBLIC_ORACLE_CONTRACT_ADDRESS:
      process.env.NEXT_PUBLIC_ORACLE_CONTRACT_ADDRESS,
  },
  /* config options here */
};

export default nextConfig;
