// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import "../lib/openzeppelin-contracts/contracts/token/ERC20/ERC20.sol";
import "../lib/openzeppelin-contracts/contracts/access/Ownable.sol";

/// @title BrewToken
/// @notice Loyalty points token for a coffee shop.
///         Owner awards BREW to customers; customers redeem BREW for rewards.
contract BrewToken is ERC20, Ownable {

    // ─── CONSTANTS ────────────────────────────────────────────────────
    // Tier thresholds (in BREW, 18 decimals)
    uint256 public constant SILVER_THRESHOLD = 100 * 1e18;
    uint256 public constant GOLD_THRESHOLD   = 500 * 1e18;

    // Redemption: burning 10 BREW = 1 reward claimed
    uint256 public constant REDEEM_COST = 10 * 1e18;

    // ─── EVENTS ───────────────────────────────────────────────────────
    event PointsAwarded(address indexed customer, uint256 amount);
    event PointsRedeemed(address indexed customer, uint256 brewBurned, uint256 rewardsCount);

    // ─── CONSTRUCTOR ──────────────────────────────────────────────────
    constructor(address owner_) ERC20("BrewToken", "BREW") Ownable(owner_) {}

    // ─── OWNER FUNCTIONS ──────────────────────────────────────────────

    /// @notice Award BREW points to a customer (e.g. after a purchase).
    /// @param customer_ Wallet address of the customer.
    /// @param amount_   Amount of BREW to mint (use 1e18 per point).
    function awardPoints(address customer_, uint256 amount_) external onlyOwner {
        require(customer_ != address(0), "Invalid address");
        require(amount_ > 0, "Amount must be positive");
        _mint(customer_, amount_);
        emit PointsAwarded(customer_, amount_);
    }

    // ─── CUSTOMER FUNCTIONS ───────────────────────────────────────────

    /// @notice Redeem BREW points for rewards. Burns REDEEM_COST per reward.
    /// @param rewardsCount_ How many rewards to claim.
    function redeem(uint256 rewardsCount_) external {
        require(rewardsCount_ > 0, "Must redeem at least 1");
        uint256 totalCost = REDEEM_COST * rewardsCount_;
        require(balanceOf(msg.sender) >= totalCost, "Insufficient BREW balance");

        _burn(msg.sender, totalCost);
        emit PointsRedeemed(msg.sender, totalCost, rewardsCount_);
    }

    // ─── VIEW FUNCTIONS ───────────────────────────────────────────────

    /// @notice Returns the loyalty tier of a customer based on their BREW balance.
    /// @return "Gold", "Silver", or "Bronze"
    function getTier(address customer_) external view returns (string memory) {
        uint256 balance_ = balanceOf(customer_);
        if (balance_ >= GOLD_THRESHOLD)   return "Gold";
        if (balance_ >= SILVER_THRESHOLD) return "Silver";
        return "Bronze";
    }
}
