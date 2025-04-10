const { ethers } = require("hardhat");
// This script only redeploys the PredictionMarketCandidate contract
// using the addresses of the quadratic contracts
async function main() {
  const deployerAddr = process.env.DEPLOYER_ADDRESS; // metamask account address
  const deployer = await ethers.getSigner(deployerAddr);
  console.log(`Redeploying PredictionMarketCandidate contract with account: ${deployer.address}`);
  console.log(`Account balance: ${(await deployer.provider.getBalance(deployerAddr)).toString()}\n`);
  // Addresses of quadratic contracts
  const predictionMarketNewAddr = process.env.PREDICTION_MARKET_NEW_CONTRACT_ADDRESS;
  const oracleNewAddr = process.env.PREDICTION_MARKET_CURRENCY_NEW_CONTRACT_ADDRESS;
  console.log(`PredictionMarketNew Address (Quadratic): ${predictionMarketNewAddr}`);
  console.log(`PredictionMarketCurrencyNew Address (Quadratic): ${oracleNewAddr}\n`);
  // Verify that addresses are valid
  if (!predictionMarketNewAddr || predictionMarketNewAddr === "0x0000000000000000000000000000000000000000") {
    throw new Error("The PredictionMarketNew contract address is not configured correctly.");
  }
  if (!oracleNewAddr || oracleNewAddr === "0x0000000000000000000000000000000000000000") {
    throw new Error("The PredictionMarketCurrencyNew contract address is not configured correctly.");
  }
  // Deploy the PredictionMarketCandidate contract with the quadratic contract addresses
  const PredictionMarketCandidate = await ethers.getContractFactory("PredictionMarketCandidate");
  const predictionMarketCandidate = await PredictionMarketCandidate.deploy(predictionMarketNewAddr, oracleNewAddr);
  await predictionMarketCandidate.waitForDeployment();
  const predictionMarketCandidateAddr = await predictionMarketCandidate.getAddress();
  console.log(`PredictionMarketCandidate redeployed at: ${predictionMarketCandidateAddr}`);
  console.log(`You can verify at https://kairos.kaiascope.com/account/${predictionMarketCandidateAddr}\n`);
  
  console.log("Important: Update the candidate contract address in ../frontend/src/constants/contract.ts:");
  console.log(`export const candidateContractAddress = "${predictionMarketCandidateAddr}";`);
}
// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
