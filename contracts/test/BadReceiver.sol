// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.17;

import "../EthicalReturn.sol";

contract BadReceiver {
    bool public reenterPayout;
    bool public reenterCancel;

    function enableReenterPayout() external {
        reenterPayout = true;
        reenterCancel = false;
    }

    function enableReenterCancel() external {
        reenterPayout = false;
        reenterCancel = true;
    }

    receive() external payable {
        if (reenterPayout) {
            EthicalReturn(payable(msg.sender)).sendPayouts();
        } else if (reenterCancel) {
            EthicalReturn(payable(msg.sender)).cancelAgreement();
        } else {
            assert(false);
        }
    }
}
