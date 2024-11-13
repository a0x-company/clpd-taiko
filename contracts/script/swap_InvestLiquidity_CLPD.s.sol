// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/swap_InvestLiquidity_CLPD.sol";

contract DeployInvestCLPD is Script {
    
    function run() external {
        // Read private key from environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        // Start broadcasting the transaction
        vm.startBroadcast(deployerPrivateKey);

        // Deploy the investCLPD contract
        AeroSwapCLPD invest = new AeroSwapCLPD();

        // Log the deployed contract address
        console.log("AeroSwapCLPD contract deployed at:", address(invest));

        // Stop broadcasting
        vm.stopBroadcast();
    }
}
