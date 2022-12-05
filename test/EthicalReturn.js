const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("EthicalReturn", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployEthicalReturnFixture() {
    const bountyAmount = ethers.utils.parseEther("1.0");
    const bountyPercentage = 4_000; // 40%

    // Contracts are deployed using the first signer/account by default
    const [owner, hacker, beneficiary] = await ethers.getSigners();

    const EthicalReturn = await ethers.getContractFactory("EthicalReturn");
    const ethicalReturn = await EthicalReturn.deploy(hacker, beneficiary, bountyPercentage);
    await owner.sendTransaction({
      to: ethicalReturn.address,
      value: bountyAmount, // Sends exactly 1.0 ether
    });

    return { ethicalReturn, owner, hacker, beneficiary, bountyAmount, bountyPercentage };
  }

  describe("Deployment", function () {
    it("Should set the right hacker, beneficiary, and bounty percentage", async function () {
      const { ethicalReturn, hacker, beneficiary, bountyPercentage } = await loadFixture(deployEthicalReturnFixture);

      expect(await ethicalReturn.hacker()).to.equal(hacker.address);
      expect(await ethicalReturn.beneficiary()).to.equal(beneficiary.address);
      expect(await ethicalReturn.bountyPercentage()).to.equal(bountyPercentage);
    });
  });

  describe("Cancel Agreement", function () {
    describe("Only hacker can cancel the agreement", function () {
      it("Should revert with the right error if called too soon", async function () {
        const { lock } = await loadFixture(deployOneYearLockFixture);

        await expect(lock.withdraw()).to.be.revertedWith(
          "You can't withdraw yet"
        );
      });

      it("Should revert with the right error if called from another account", async function () {
        const { lock, unlockTime, otherAccount } = await loadFixture(
          deployOneYearLockFixture
        );

        // We can increase the time in Hardhat Network
        await time.increaseTo(unlockTime);

        // We use lock.connect() to send a transaction from another account
        await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
          "You aren't the owner"
        );
      });

      it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
        const { lock, unlockTime } = await loadFixture(
          deployOneYearLockFixture
        );

        // Transactions are sent using the first signer by default
        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).not.to.be.reverted;
      });
    });

    describe("Events", function () {
      it("Should emit an event on withdrawals", async function () {
        const { lock, unlockTime, lockedAmount } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        await expect(lock.withdraw())
          .to.emit(lock, "Withdrawal")
          .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
      });
    });

    describe("Transfers", function () {
      it("Should transfer the funds to the owner", async function () {
        const { lock, unlockTime, lockedAmount, owner } = await loadFixture(
          deployOneYearLockFixture
        );

        await time.increaseTo(unlockTime);

        await expect(lock.withdraw()).to.changeEtherBalances(
          [owner, lock],
          [lockedAmount, -lockedAmount]
        );
      });
    });
  });
});
