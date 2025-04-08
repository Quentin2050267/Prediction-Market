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

  // Step 2: Deploy AMM contract
  const AMM = await ethers.getContractFactory("AutomatedMarketMaker");
  const amm = await AMM.deploy();
  await amm.waitForDeployment();
  const ammAddr = await amm.getAddress();

  console.log(`AutomatedMarketMaker deployed to: ${ammAddr}`);
  console.log(`You can verify on https://kairos.kaiascope.com/account/${ammAddr} \n`);

  // Step 3: 部署 PredictionMarket 合约，传入 SwanToken 地址
  const PredictionMarket = await ethers.getContractFactory("PredictionMarket");
  const predictionMarket = await PredictionMarket.deploy(swanTokenAddr);
  await predictionMarket.waitForDeployment();  // 等待部署完成
  const predictionMarketAddr = await predictionMarket.getAddress();

  console.log(`PredictionMarket deployed to: ${predictionMarketAddr}`);
  console.log(`You can verify on https://kairos.kaiascope.com/account/${predictionMarketAddr} \n`);

  // Step 4: Deploy PredictionMarketNew contract for quadratic voting
  const PredictionMarketNew = await ethers.getContractFactory("PredictionMarketNew");
  const predictionMarketNew = await PredictionMarketNew.deploy(swanTokenAddr, ammAddr);
  await predictionMarketNew.waitForDeployment();
  const predictionMarketNewAddr = await predictionMarketNew.getAddress();

  console.log(`PredictionMarketNew (Quadratic) deployed to: ${predictionMarketNewAddr}`);
  console.log(`You can verify on https://kairos.kaiascope.com/account/${predictionMarketNewAddr} \n`);

  // Step 5: 部署 Oracle 合约
  const Oracle = await ethers.getContractFactory("PredictionMarketCurrency");
  const oracle = await Oracle.deploy(swanToken.getAddress());
  await oracle.waitForDeployment();  // 等待部署完成
  const oracleAddr = await oracle.getAddress();

  console.log(`Oracle deployed to: ${oracleAddr}`);
  console.log(`You can verify on https://kairos.kaiascope.com/account/${oracleAddr} \n`);

  // Step 6: Deploy PredictionMarketCurrencyNew contract for quadratic voting
  const OracleNew = await ethers.getContractFactory("PredictionMarketCurrencyNew");
  const oracleNew = await OracleNew.deploy(swanToken.getAddress());
  await oracleNew.waitForDeployment();
  const oracleNewAddr = await oracleNew.getAddress();

  console.log(`OracleNew (Quadratic) deployed to: ${oracleNewAddr}`);
  console.log(`You can verify on https://kairos.kaiascope.com/account/${oracleNewAddr} \n`);

  // Step 7: 部署 PredictionMarketCandidate 合约
  const PredictionMarketCandidate = await ethers.getContractFactory("PredictionMarketCandidate");
  const predictionMarketCandidate = await PredictionMarketCandidate.deploy(predictionMarketAddr, oracleAddr);
  await predictionMarketCandidate.waitForDeployment();  // 等待部署完成
  const predictionMarketCandidateAddr = await predictionMarketCandidate.getAddress();

  console.log(`PredictionMarketCandidate deployed to: ${predictionMarketCandidateAddr}`);
  console.log(`You can verify on https://kairos.kaiascope.com/account/${predictionMarketCandidateAddr} \n`);


  console.log(`Congratulations! You have just successfully deployed all the contracts!`);
  console.log(`Please copy the following addresses to ../frontend/src/constants/contract.ts and .env, respectively:`);
  console.log(`SwanToken: ${swanTokenAddr}`);
  console.log(`PredictionMarket: ${predictionMarketAddr}`);
  console.log(`PredictionMarketCurrency: ${oracleAddr}`);
  console.log(`PredictionMarketCandidate: ${predictionMarketCandidateAddr}`);
  console.log(`PredictionMarketNew (Quadratic): ${predictionMarketNewAddr}`);
  console.log(`PredictionMarketCurrencyNew (Quadratic): ${oracleNewAddr}`);
  // console.log(`You can verify on https://kairos.kaiascope.com/account/${sbtContract.target}`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});