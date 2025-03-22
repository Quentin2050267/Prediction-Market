const { ethers } = require("hardhat");

// to run the script:
//      npx hardhat run scripts/deploy.js --network kairos

async function main() {
  const deployerAddr = process.env.DEPLOYER_ADDRESS; // metamask account address
  const deployer = await ethers.getSigner(deployerAddr);

  console.log(`Deploying contracts with the account: ${deployer.address}`);
  console.log(`Account balance: ${(await deployer.provider.getBalance(deployerAddr)).toString()}\n`);

  // Step 1: 部署 SwanToken 合约
  const SwanToken = await ethers.getContractFactory("SwanToken");
  const swanToken = await SwanToken.deploy();
  await swanToken.waitForDeployment();  // 等待部署完成
  const swanTokenAddr = await swanToken.getAddress();

  console.log(`SwanToken deployed to: ${swanTokenAddr}`);
  console.log(`You can verify on https://kairos.kaiascope.com/account/${swanTokenAddr} \n`);

  // Step 2: 部署 PredictionMarket 合约，传入 SwanToken 地址
  const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
  const predictionMarket = await PredictionMarket.deploy(swanTokenAddr);
  await predictionMarket.waitForDeployment();  // 等待部署完成
  const predictionMarketAddr = await predictionMarket.getAddress();

  console.log(`PredictionMarket deployed to: ${predictionMarketAddr}`);
  console.log(`You can verify on https://kairos.kaiascope.com/account/${predictionMarketAddr} \n`);

  // Step 3: 部署 Oracle 合约
  const Oracle = await ethers.getContractFactory("PredictionMarketCurrency");
  const oracle = await Oracle.deploy(swanToken.getAddress());
  await oracle.waitForDeployment();  // 等待部署完成
  const oracleAddr = await oracle.getAddress();

  console.log(`Oracle deployed to: ${oracleAddr}`);
  console.log(`You can verify on https://kairos.kaiascope.com/account/${oracleAddr} \n`);

  // Step 4: 部署 PredictionMarketCandidate 合约
  const PredictionMarketCandidate = await ethers.getContractFactory("PredictionMarketCandidate");
  const predictionMarketCandidate = await PredictionMarketCandidate.deploy(predictionMarketAddr, oracleAddr);
  await predictionMarketCandidate.waitForDeployment();  // 等待部署完成
  const predictionMarketCandidateAddr = await predictionMarketCandidate.getAddress();

  console.log(`PredictionMarketCandidate deployed to: ${predictionMarketCandidateAddr}`);
  console.log(`You can verify on https://kairos.kaiascope.com/account/${predictionMarketCandidateAddr} \n`);


  console.log(`Congratulations! You have just successfully deployed all the contracts!`);
  console.log(`Please copy the four address to ../frontend/src/constants/contracts.ts and .env, respectively.`);
  // console.log(`You can verify on https://kairos.kaiascope.com/account/${sbtContract.target}`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});