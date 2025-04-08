const { ethers } = require("hardhat");

// Ce script redéploie uniquement le contrat PredictionMarketCandidate
// en utilisant les adresses des contrats quadratiques

async function main() {
  const deployerAddr = process.env.DEPLOYER_ADDRESS; // metamask account address
  const deployer = await ethers.getSigner(deployerAddr);

  console.log(`Redéploiement du contrat PredictionMarketCandidate avec le compte: ${deployer.address}`);
  console.log(`Solde du compte: ${(await deployer.provider.getBalance(deployerAddr)).toString()}\n`);

  // Adresses des contrats quadratiques
  const predictionMarketNewAddr = process.env.PREDICTION_MARKET_NEW_CONTRACT_ADDRESS;
  const oracleNewAddr = process.env.PREDICTION_MARKET_CURRENCY_NEW_CONTRACT_ADDRESS;

  console.log(`Adresse PredictionMarketNew (Quadratic): ${predictionMarketNewAddr}`);
  console.log(`Adresse PredictionMarketCurrencyNew (Quadratic): ${oracleNewAddr}\n`);

  // Vérifier que les adresses sont valides
  if (!predictionMarketNewAddr || predictionMarketNewAddr === "0x0000000000000000000000000000000000000000") {
    throw new Error("L'adresse du contrat PredictionMarketNew n'est pas configurée correctement.");
  }

  if (!oracleNewAddr || oracleNewAddr === "0x0000000000000000000000000000000000000000") {
    throw new Error("L'adresse du contrat PredictionMarketCurrencyNew n'est pas configurée correctement.");
  }

  // Déployer le contrat PredictionMarketCandidate avec les adresses des contrats quadratiques
  const PredictionMarketCandidate = await ethers.getContractFactory("PredictionMarketCandidate");
  const predictionMarketCandidate = await PredictionMarketCandidate.deploy(predictionMarketNewAddr, oracleNewAddr);
  await predictionMarketCandidate.waitForDeployment();
  const predictionMarketCandidateAddr = await predictionMarketCandidate.getAddress();

  console.log(`PredictionMarketCandidate redéployé à: ${predictionMarketCandidateAddr}`);
  console.log(`Vous pouvez vérifier sur https://kairos.kaiascope.com/account/${predictionMarketCandidateAddr}\n`);
  
  console.log("Important: Mettez à jour l'adresse du contrat candidat dans ../frontend/src/constants/contract.ts:");
  console.log(`export const candidateContractAddress = "${predictionMarketCandidateAddr}";`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 