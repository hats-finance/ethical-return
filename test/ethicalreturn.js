const { expect } = require("chai");
const { deployEthicalReturn } = require("../scripts/deploy.js");
const HUNDRED_PERCENT = 10000;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

describe("Ethical Return", () => {
    it("Deployment should init correctly", async () => {
        const [hacker, beneficiary, tipAddress] = await ethers.getSigners();
        const bountyPercentage = 4900;
        const tipPercentage = 100;
        const minimumAmount = ethers.utils.parseEther("100");
        let ethicalReturn = await deployEthicalReturn(
            hacker.address,
            beneficiary.address,
            tipAddress.address,
            bountyPercentage,
            tipPercentage,
            minimumAmount,
            true
        );

        expect(await ethicalReturn.hacker()).to.equal(hacker.address);
        expect(await ethicalReturn.beneficiary()).to.equal(beneficiary.address);
        expect(await ethicalReturn.tipAddress()).to.equal(tipAddress.address);
        expect(await ethicalReturn.bountyPercentage()).to.equal(bountyPercentage);
        expect(await ethicalReturn.tipPercentage()).to.equal(tipPercentage);
        expect(await ethicalReturn.minimumAmount()).to.equal(minimumAmount);
    });

    it("Deposit should set hacker address", async () => {
        const EthicalReturn = await ethers.getContractFactory("EthicalReturn");
        const [hacker, beneficiary, tipAddress] = await ethers.getSigners();
        const bountyPercentage = 4900;
        const tipPercentage = 100;
        const minimumAmount = ethers.utils.parseEther("100");
        let ethicalReturn = await deployEthicalReturn(
            ZERO_ADDRESS,
            beneficiary.address,
            tipAddress.address,
            bountyPercentage,
            tipPercentage,
            minimumAmount,
            true
        );

        expect(await ethicalReturn.hacker()).to.equal(ZERO_ADDRESS);

        await expect(ethicalReturn.connect(hacker).deposit(ZERO_ADDRESS, {
            value: minimumAmount
        })).to.be.revertedWithCustomError(EthicalReturn, "InvalidHacker");
        
        await ethicalReturn.connect(hacker).deposit(hacker.address, {
            value: minimumAmount
        });

        expect(await ethicalReturn.hacker()).to.equal(hacker.address);

        await expect(ethicalReturn.connect(hacker).deposit(beneficiary.address, {
            value: minimumAmount
        })).to.be.revertedWithCustomError(EthicalReturn, "AlreadyDeposited");

        ethicalReturn = await deployEthicalReturn(
            hacker.address,
            beneficiary.address,
            tipAddress.address,
            bountyPercentage,
            tipPercentage,
            minimumAmount,
            true
        );

        expect(await ethicalReturn.hacker()).to.equal(hacker.address);

        await expect(ethicalReturn.connect(hacker).deposit(beneficiary.address, {
            value: minimumAmount
        })).to.be.revertedWithCustomError(EthicalReturn, "AlreadyDeposited");
    });

    it("Deposit must be at least minimum amount", async () => {
        const EthicalReturn = await ethers.getContractFactory("EthicalReturn");
        const [hacker, beneficiary, tipAddress] = await ethers.getSigners();
        const bountyPercentage = 4900;
        const tipPercentage = 100;
        const minimumAmount = ethers.utils.parseEther("100");
        let ethicalReturn = await deployEthicalReturn(
            ZERO_ADDRESS,
            beneficiary.address,
            tipAddress.address,
            bountyPercentage,
            tipPercentage,
            minimumAmount,
            true
        );

        expect(await ethicalReturn.hacker()).to.equal(ZERO_ADDRESS);

        await expect(ethicalReturn.connect(hacker).deposit(hacker.address, {
            value: ethers.utils.parseEther("99.9")
        })).to.be.revertedWithCustomError(EthicalReturn, "MustDepositMinimumAmount");
        
        await ethicalReturn.connect(hacker).deposit(hacker.address, {
            value: ethers.utils.parseEther("200")
        });

        expect(await ethicalReturn.hacker()).to.equal(hacker.address);
    });

    it("Can depoist only to hacker if set", async () => {
        const EthicalReturn = await ethers.getContractFactory("EthicalReturn");
        const [hacker, beneficiary, tipAddress] = await ethers.getSigners();
        const bountyPercentage = 4900;
        const tipPercentage = 100;
        const minimumAmount = ethers.utils.parseEther("100");
        let ethicalReturn = await deployEthicalReturn(
            ZERO_ADDRESS,
            beneficiary.address,
            tipAddress.address,
            bountyPercentage,
            tipPercentage,
            minimumAmount,
            true
        );

        expect(await ethicalReturn.hacker()).to.equal(ZERO_ADDRESS);
        
        await ethicalReturn.connect(hacker).deposit(hacker.address, {
            value: minimumAmount
        });

        expect(await ethicalReturn.hacker()).to.equal(hacker.address);

        await expect(ethicalReturn.connect(hacker).deposit(beneficiary.address, {
            value: minimumAmount
        })).to.be.revertedWithCustomError(EthicalReturn, "AlreadyDeposited");

        await ethicalReturn.connect(hacker).deposit(hacker.address, {
            value: ethers.utils.parseEther("99")
        });

        expect(await ethers.provider.getBalance(ethicalReturn.address)).to.equal(ethers.utils.parseEther("199"));
    });

    it("Can send eth only if hacker is set", async () => {
        const EthicalReturn = await ethers.getContractFactory("EthicalReturn");
        const [hacker, beneficiary, tipAddress] = await ethers.getSigners();
        const bountyPercentage = 4900;
        const tipPercentage = 100;
        const minimumAmount = ethers.utils.parseEther("100");
        let ethicalReturn = await deployEthicalReturn(
            ZERO_ADDRESS,
            beneficiary.address,
            tipAddress.address,
            bountyPercentage,
            tipPercentage,
            minimumAmount,
            true
        );

        expect(await ethicalReturn.hacker()).to.equal(ZERO_ADDRESS);

        await expect(hacker.sendTransaction({
            to: ethicalReturn.address,
            value: minimumAmount
        })).to.be.revertedWithCustomError(EthicalReturn, "MustHaveHackerBeforeDeposit");
        
        await ethicalReturn.connect(hacker).deposit(hacker.address, {
            value: minimumAmount
        });

        expect(await ethicalReturn.hacker()).to.equal(hacker.address);

        await hacker.sendTransaction({
            to: ethicalReturn.address,
            value: minimumAmount
        });

        expect(await ethers.provider.getBalance(ethicalReturn.address)).to.equal(ethers.utils.parseEther("200"));
    });

    it("Deployment with more than 100% distribution should fail", async () => {    
        const EthicalReturn = await ethers.getContractFactory("EthicalReturn");
        const [hacker, beneficiary, tipAddress] = await ethers.getSigners();
        let bountyPercentage = HUNDRED_PERCENT - 1;
        let tipPercentage = 2;
        const minimumAmount = ethers.utils.parseEther("100");
        
        await expect(deployEthicalReturn(
            hacker.address,
            beneficiary.address,
            tipAddress.address,
            bountyPercentage,
            tipPercentage,
            minimumAmount,
            true
        )).to.be.revertedWithCustomError(EthicalReturn, "InvalidDistribution");

        bountyPercentage = HUNDRED_PERCENT + 1;
        tipPercentage = 0;

        await expect(deployEthicalReturn(
            hacker.address,
            beneficiary.address,
            tipAddress.address,
            bountyPercentage,
            tipPercentage,
            minimumAmount,
            true
        )).to.be.revertedWithCustomError(EthicalReturn, "InvalidDistribution");

        bountyPercentage = 0;
        tipPercentage = HUNDRED_PERCENT + 1;

        await expect(deployEthicalReturn(
            hacker.address,
            beneficiary.address,
            tipAddress.address,
            bountyPercentage,
            tipPercentage,
            minimumAmount,
            true
        )).to.be.revertedWithCustomError(EthicalReturn, "InvalidDistribution");
    });

    it("Cancel agreement", async () => {
        const EthicalReturn = await ethers.getContractFactory("EthicalReturn");
        const [hacker, beneficiary, tipAddress] = await ethers.getSigners();
        const bountyPercentage = 4900;
        const tipPercentage = 100;
        const minimumAmount = ethers.utils.parseEther("100");
        let ethicalReturn = await deployEthicalReturn(
            ZERO_ADDRESS,
            beneficiary.address,
            tipAddress.address,
            bountyPercentage,
            tipPercentage,
            minimumAmount,
            true
        );

        const totalAmount = ethers.utils.parseEther("100");

        await ethicalReturn.connect(hacker).deposit(hacker.address, {
            value: totalAmount
        });

        let hackerBalance = await ethers.provider.getBalance(hacker.address);

        expect(await ethers.provider.getBalance(ethicalReturn.address)).to.equal(totalAmount);
        expect(await ethers.provider.getCode(ethicalReturn.address)).to.not.equal("0x");

        await expect(
            ethicalReturn.connect(beneficiary).cancelAgreement()
        ).to.be.revertedWithCustomError(EthicalReturn, "OnlyHacker");

        let tx = await ethicalReturn.connect(hacker).cancelAgreement();
        let txGasCost = tx.gasPrice.mul((await tx.wait()).gasUsed);

        expect(await ethers.provider.getBalance(ethicalReturn.address)).to.equal(0);
        expect(await ethers.provider.getBalance(hacker.address)).to.equal(hackerBalance.add(totalAmount).sub(txGasCost));
        expect(await ethers.provider.getCode(ethicalReturn.address)).to.equal("0x");
    });

    it("Send payouts", async () => {
        const EthicalReturn = await ethers.getContractFactory("EthicalReturn");
        const [hacker, beneficiary, tipAddress] = await ethers.getSigners();
        const bountyPercentage = 4900;
        const tipPercentage = 100;
        const beneficiaryPercentage = HUNDRED_PERCENT - bountyPercentage - tipPercentage;
        const minimumAmount = ethers.utils.parseEther("100");
        let ethicalReturn = await deployEthicalReturn(
            ZERO_ADDRESS,
            beneficiary.address,
            tipAddress.address,
            bountyPercentage,
            tipPercentage,
            minimumAmount,
            true
        );

        await expect(
            ethicalReturn.connect(beneficiary).sendPayouts()
        ).to.be.revertedWithCustomError(EthicalReturn, "NotMinimumAmount");

        const totalAmount = ethers.utils.parseEther("100");

        await ethicalReturn.connect(hacker).deposit(hacker.address, {
            value: totalAmount
        });

        await expect(
            ethicalReturn.connect(tipAddress).sendPayouts()
        ).to.be.revertedWithCustomError(EthicalReturn, "OnlyBeneficiary");
        
        let hackerBalance = await ethers.provider.getBalance(hacker.address);
        let beneficiaryBalance = await ethers.provider.getBalance(beneficiary.address);
        let tipAddressBalance = await ethers.provider.getBalance(tipAddress.address);

        expect(await ethers.provider.getBalance(ethicalReturn.address)).to.equal(totalAmount);
        expect(await ethers.provider.getCode(ethicalReturn.address)).to.not.equal("0x");

        let tx = await ethicalReturn.connect(beneficiary).sendPayouts();
        let txGasCost = tx.gasPrice.mul((await tx.wait()).gasUsed);

        expect(await ethers.provider.getBalance(ethicalReturn.address)).to.equal(0);
        expect(await ethers.provider.getBalance(hacker.address)).to.equal(
            hackerBalance.add(totalAmount.mul(bountyPercentage).div(HUNDRED_PERCENT))
        );
        expect(await ethers.provider.getBalance(beneficiary.address)).to.equal(
            beneficiaryBalance.add(totalAmount.mul(beneficiaryPercentage).div(HUNDRED_PERCENT)).sub(txGasCost)
        );
        expect(await ethers.provider.getBalance(tipAddress.address)).to.equal(
            tipAddressBalance.add(totalAmount.mul(tipPercentage).div(HUNDRED_PERCENT))
        );
        expect(await ethers.provider.getCode(ethicalReturn.address)).to.equal("0x");
    });

    it("Send payouts payment failed should revert", async () => {
        const EthicalReturn = await ethers.getContractFactory("EthicalReturn");
        const BadReceiver = await ethers.getContractFactory("BadReceiver");
        const badReceiver = await BadReceiver.deploy();
        await badReceiver.deployed();
        const [hacker, beneficiary, tipAddress] = await ethers.getSigners();
        const bountyPercentage = 4900;
        const tipPercentage = 100;
        const minimumAmount = ethers.utils.parseEther("100");
        let ethicalReturn = await deployEthicalReturn(
            ZERO_ADDRESS,
            beneficiary.address,
            tipAddress.address,
            bountyPercentage,
            tipPercentage,
            minimumAmount,
            true
        );

        const totalAmount = ethers.utils.parseEther("100");

        await ethicalReturn.connect(hacker).deposit(badReceiver.address, {
            value: totalAmount
        });

        await expect(
            ethicalReturn.connect(beneficiary).sendPayouts()
        ).to.be.revertedWithCustomError(EthicalReturn, "BountyPayoutFailed");

        ethicalReturn = await deployEthicalReturn(
            ZERO_ADDRESS,
            beneficiary.address,
            badReceiver.address,
            bountyPercentage,
            tipPercentage,
            minimumAmount,
            true
        );

        await ethicalReturn.connect(hacker).deposit(hacker.address, {
            value: totalAmount
        });

        await expect(
            ethicalReturn.connect(beneficiary).sendPayouts()
        ).to.be.revertedWithCustomError(EthicalReturn, "TipPayoutFailed");
    });

    it("Send payouts payment reentrancy should revert", async () => {
        const EthicalReturn = await ethers.getContractFactory("EthicalReturn");
        const BadReceiver = await ethers.getContractFactory("BadReceiver");
        const badReceiver = await BadReceiver.deploy();
        await badReceiver.deployed();
        const [hacker, beneficiary, tipAddress] = await ethers.getSigners();
        const bountyPercentage = 4900;
        const tipPercentage = 100;
        const minimumAmount = ethers.utils.parseEther("100");
        let ethicalReturn = await deployEthicalReturn(
            ZERO_ADDRESS,
            beneficiary.address,
            tipAddress.address,
            bountyPercentage,
            tipPercentage,
            minimumAmount,
            true
        );

        const totalAmount = ethers.utils.parseEther("100");

        await ethicalReturn.connect(hacker).deposit(badReceiver.address, {
            value: totalAmount
        });

        await badReceiver.enableReenterPayout();

        await expect(
            ethicalReturn.connect(beneficiary).sendPayouts()
        ).to.be.revertedWithCustomError(EthicalReturn, "BountyPayoutFailed");

        await badReceiver.enableReenterCancel();

        await expect(
            ethicalReturn.connect(beneficiary).sendPayouts()
        ).to.be.revertedWithCustomError(EthicalReturn, "BountyPayoutFailed");
    });
    
    it("Sweep tokens", async () => {
        const EthicalReturn = await ethers.getContractFactory("EthicalReturn");
        const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
        const erc20Mock = await ERC20Mock.deploy();
        await erc20Mock.deployed();
        const [hacker, beneficiary, tipAddress] = await ethers.getSigners();
        const bountyPercentage = 4900;
        const tipPercentage = 100;
        const minimumAmount = ethers.utils.parseEther("100");
        let ethicalReturn = await deployEthicalReturn(
            hacker.address,
            beneficiary.address,
            tipAddress.address,
            bountyPercentage,
            tipPercentage,
            minimumAmount,
            true
        );

        await erc20Mock.mint(ethicalReturn.address, 10);

        expect(await erc20Mock.balanceOf(ethicalReturn.address)).to.equal(10);
        expect(await erc20Mock.balanceOf(beneficiary.address)).to.equal(0);

        await expect(
            ethicalReturn.connect(hacker).sweepToken(erc20Mock.address, 10)
        ).to.be.revertedWithCustomError(EthicalReturn, "OnlyBeneficiary");

        await ethicalReturn.connect(beneficiary).sweepToken(erc20Mock.address, 10);

        expect(await erc20Mock.balanceOf(ethicalReturn.address)).to.equal(0);
        expect(await erc20Mock.balanceOf(beneficiary.address)).to.equal(10);
    });
});
