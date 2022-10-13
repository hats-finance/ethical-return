// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {

  const accounts = await ethers.getSigners();

  const hacker = accounts[1].address;
  const beneficiary = accounts[2].address;
  const bountyPercentage = 4000;

  const EthicalReturn = await hre.ethers.getContractFactory("EthicalReturn");
  const ethicalReturn = await EthicalReturn.deploy(hacker, beneficiary, bountyPercentage);

  await ethicalReturn.deployed();

  console.log(
    `EthicalReturn deployed at: ${ethicalReturn.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
