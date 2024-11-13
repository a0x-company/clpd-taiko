// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "forge-std/Script.sol";
import "../src/CLPD__Taiko_Helka_Bridge.sol";

contract DeployCLPD_Taiko_Helka is Script {
    // Address to receive the tokens
    address public receiver = 0xd806A01E295386ef7a7Cea0B9DA037B242622743;

    function run() external {
        // Read private key or account from environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Start broadcasting the transaction
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the CLPD contract with updated constructor parameters
        CLPD clpd = new CLPD();

        // Log the deployed contract address
        console.log("CLPD contract deployed at:", address(clpd));

        // Stop broadcasting
        vm.stopBroadcast();
    }
}