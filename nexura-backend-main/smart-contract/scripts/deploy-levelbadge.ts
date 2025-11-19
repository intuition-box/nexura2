// @ts-nocheck
const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const LevelBadge = await ethers.getContractFactory("LevelBadge");
  const name = process.env.CONTRACT_NAME || "Nexura Level Badge";
  const symbol = process.env.CONTRACT_SYMBOL || "NXLV";
  const deployed = await LevelBadge.deploy(name, symbol);
  await deployed.deployed();
  console.log("LevelBadge deployed to:", deployed.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
