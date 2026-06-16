// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "forge-std/Test.sol";
import "../src/BrewToken.sol";

contract BrewTokenTest is Test {

    BrewToken brew;

    address owner   = makeAddr("owner");   // the coffee shop
    address alice   = makeAddr("alice");
    address bob     = makeAddr("bob");

    function setUp() public {
        vm.prank(owner);
        brew = new BrewToken(owner);
    }

    // ─── awardPoints ──────────────────────────────────────────────────

    function test_AwardPoints_MintsCorrectBalance() public {
        vm.prank(owner);
        brew.awardPoints(alice, 50 * 1e18);
        assertEq(brew.balanceOf(alice), 50 * 1e18);
    }

    function test_AwardPoints_EmitsEvent() public {
        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit BrewToken.PointsAwarded(alice, 50 * 1e18);
        brew.awardPoints(alice, 50 * 1e18);
    }

    function test_AwardPoints_Reverts_NotOwner() public {
        vm.prank(alice);
        vm.expectRevert();
        brew.awardPoints(bob, 10 * 1e18);
    }

    function test_AwardPoints_Reverts_ZeroAmount() public {
        vm.prank(owner);
        vm.expectRevert("Amount must be positive");
        brew.awardPoints(alice, 0);
    }

    function test_AwardPoints_Reverts_ZeroAddress() public {
        vm.prank(owner);
        vm.expectRevert("Invalid address");
        brew.awardPoints(address(0), 10 * 1e18);
    }

    // ─── redeem ───────────────────────────────────────────────────────

    function test_Redeem_BurnsCorrectAmount() public {
        vm.prank(owner);
        brew.awardPoints(alice, 50 * 1e18);

        vm.prank(alice);
        brew.redeem(3); // 3 rewards × 10 BREW = 30 BREW burned

        assertEq(brew.balanceOf(alice), 20 * 1e18);
    }

    function test_Redeem_EmitsEvent() public {
        vm.prank(owner);
        brew.awardPoints(alice, 50 * 1e18);

        vm.prank(alice);
        vm.expectEmit(true, false, false, true);
        emit BrewToken.PointsRedeemed(alice, 10 * 1e18, 1);
        brew.redeem(1);
    }

    function test_Redeem_Reverts_InsufficientBalance() public {
        vm.prank(owner);
        brew.awardPoints(alice, 5 * 1e18); // less than REDEEM_COST

        vm.prank(alice);
        vm.expectRevert("Insufficient BREW balance");
        brew.redeem(1);
    }

    function test_Redeem_Reverts_ZeroRewards() public {
        vm.prank(alice);
        vm.expectRevert("Must redeem at least 1");
        brew.redeem(0);
    }

    // ─── getTier ──────────────────────────────────────────────────────

    function test_GetTier_Bronze() public {
        vm.prank(owner);
        brew.awardPoints(alice, 50 * 1e18); // below 100
        assertEq(brew.getTier(alice), "Bronze");
    }

    function test_GetTier_Silver() public {
        vm.prank(owner);
        brew.awardPoints(alice, 100 * 1e18); // exactly 100
        assertEq(brew.getTier(alice), "Silver");
    }

    function test_GetTier_Gold() public {
        vm.prank(owner);
        brew.awardPoints(alice, 500 * 1e18); // exactly 500
        assertEq(brew.getTier(alice), "Gold");
    }

    function test_GetTier_DropsAfterRedeem() public {
        vm.prank(owner);
        brew.awardPoints(alice, 100 * 1e18); // Silver

        vm.prank(alice);
        brew.redeem(1); // burns 10 BREW → 90 BREW left → Bronze

        assertEq(brew.getTier(alice), "Bronze");
    }

    // ─── ERC20 basics ─────────────────────────────────────────────────

    function test_TokenNameAndSymbol() public view {
        assertEq(brew.name(),   "BrewToken");
        assertEq(brew.symbol(), "BREW");
    }

    function test_Transfer_BetweenCustomers() public {
        vm.prank(owner);
        brew.awardPoints(alice, 50 * 1e18);

        vm.prank(alice);
        brew.transfer(bob, 20 * 1e18);

        assertEq(brew.balanceOf(alice), 30 * 1e18);
        assertEq(brew.balanceOf(bob),   20 * 1e18);
    }
}
