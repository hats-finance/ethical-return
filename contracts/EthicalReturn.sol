// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract EthicalReturn is ReentrancyGuard {
    error BountyPayoutFailed();
    error TipPayoutFailed();
    error OnlyBeneficiary();
    error OnlyHacker();

    uint256 public constant HUNDRED_PERCENT = 10_000;

    address public immutable hacker;
    address public immutable beneficiary;
    address public immutable tipAddress;
    uint256 public immutable bountyPercentage;
    uint256 public immutable tipPercentage;

    constructor(
        address _hacker,
        address _beneficiary,
        address _tipAddress,
        uint256 _bountyPercentage,
        uint256 _tipPercentage
    ) {
        hacker = _hacker;
        beneficiary = _beneficiary;
        tipAddress = _tipAddress;
        bountyPercentage = _bountyPercentage;
        tipPercentage = _tipPercentage;
    }

    receive() external payable {}

    function sendPayouts() external nonReentrant {
        if (msg.sender != beneficiary) {
            revert OnlyBeneficiary();
        }

        uint256 payout = address(this).balance * bountyPercentage / HUNDRED_PERCENT;
        uint256 tip = address(this).balance * tipPercentage / HUNDRED_PERCENT;

        (bool sent,) = hacker.call{value: payout}("");
        if (!sent) {
            revert BountyPayoutFailed();
        }

        (sent,) = tipAddress.call{value: tip}("");
        if (!sent) {
            revert TipPayoutFailed();
        }
        
        selfdestruct(payable(beneficiary));
    }

    function cancelAgreement() external nonReentrant {
        if (msg.sender != hacker) {
            revert OnlyHacker();
        }
        selfdestruct(payable(hacker));
    }
}
