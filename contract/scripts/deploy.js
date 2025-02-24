const { ethers } = require("hardhat");

// to run the script:
//      npx hardhat run scripts/deploy.js --network kairos

async function main() {
  const deployerAddr = process.env.DEPLOYER_ADDRESS; // metamask account address
  const deployer = await ethers.getSigner(deployerAddr);

  console.log(`Deploying contracts with the account: ${deployer.address}`);
  console.log(`Account balance: ${(await deployer.provider.getBalance(deployerAddr)).toString()}`);

  // Step 1: 部署 SwanToken 合约
  const SwanToken = await ethers.getContractFactory("SwanToken");
  const swanToken = await SwanToken.deploy();
  await swanToken.waitForDeployment();  // 等待部署完成
  const swanTokenAddr = await swanToken.getAddress();

  console.log(`SwanToken deployed to: ${swanTokenAddr}`);
  console.log(`You can verify on https://kairos.kaiascope.com/account/${swanTokenAddr}`);

  // Step 2: 部署 PredictionMarket 合约，传入 SwanToken 地址
  const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
  const predictionMarket = await PredictionMarket.deploy(swanToken.getAddress());
  await predictionMarket.waitForDeployment();  // 等待部署完成
  const predictionMarketAddr = await predictionMarket.getAddress();

  console.log(`PredictionMarket deployed to: ${predictionMarketAddr}`);
  console.log(`You can verify on https://kairos.kaiascope.com/account/${predictionMarketAddr}`);

  console.log(`Congratulations! You have just successfully deployed the swan tokens and prediction market.`);
  console.log(`Please copy the SwanToken address and PredictionMarket address to ../frontend/src/constants/contracts.ts and .env`);
  // console.log(`You can verify on https://kairos.kaiascope.com/account/${sbtContract.target}`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});