// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main(
  hacker = process.env.HACKER,
  beneficiary = process.env.BENEFICIARY,
  tipAddress = process.env.TIP_ADDRESS,
  bountyPercentage = process.env.BOUNTY_PERCENTAGE,
  tipPercentage = process.env.TIP_PERCENTAGE,
  minimumAmount = process.env.MINIMUM_AMOUNT,
  sielnt = false
) {
  const EthicalReturn = await hre.ethers.getContractFactory("EthicalReturn");
  const ethicalReturn = await EthicalReturn.deploy(
    hacker,
    beneficiary,
    tipAddress,
    bountyPercentage,
    tipPercentage,
    minimumAmount
  );

  await ethicalReturn.deployed();

  if (!sielnt) {
    console.log(
      `EthicalReturn deployed at: ${ethicalReturn.address}`
    );
  }
  
  return ethicalReturn;
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

module.exports = { deployEthicalReturn: main };
