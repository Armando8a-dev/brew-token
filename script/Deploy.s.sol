// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Script.sol";
import "../src/BrewToken.sol";

contract Deploy is Script {
    function run() external {
        vm.startBroadcast();
        BrewToken brew = new BrewToken(msg.sender);
        console.log("BrewToken deployed at:", address(brew));
        vm.stopBroadcast();
    }
}
