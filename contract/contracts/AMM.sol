// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import { UD60x18, ud, ln, exp } from "PaulRBerg/prb-math@4.1.0/src/UD60x18.sol";

contract AutomatedMarketMaker {
    mapping(uint256 => uint256) public optionAShares;
    mapping(uint256 => uint256) public optionBShares;
    uint256 public constant PRECISION = 1e18; // precision of price
    uint256 public b = 1000 * PRECISION; // liquidity

    event LiquidityAdded(uint256 indexed marketId, uint256 amountA, uint256 amountB);
    event LiquidityRemoved(uint256 indexed marketId, uint256 amountA, uint256 amountB);


    /**
     * @dev LSMR
     */
    function getCost(uint256 qA, uint256 qB) public view returns (uint256) {
        uint256 expA = _exp(qA * PRECISION / b);
        uint256 expB = _exp(qB * PRECISION / b);
        return (b * _log(expA + expB)) / PRECISION;
    }

    /**
    * @dev  `_shares` -> get payment
    */
    function getAmount(uint256 qA, uint256 qB, bool _isOptionA, uint256 _shares) external view returns (uint256) {
        require(qA > 0 && qB > 0, "Invalid market qA/qB state");
        // uint256 qA = optionAShares[_marketId];
        // uint256 qB = optionBShares[_marketId];

        uint256 costBefore = getCost( qA, qB);
        uint256 costAfter;
        if (_isOptionA) {
            costAfter = getCost(qA + _shares, qB);
        } else {
            costAfter = getCost(qA, qB + _shares);
        }

        return costAfter - costBefore;
    }

    function getPrices(uint256 qA, uint256 qB) external view returns (uint256 priceA, uint256 priceB) {
        // NEXT unit of share
        // uint256 qA = optionAShares[_marketId];
        // uint256 qB = optionBShares[_marketId];

        uint256 exp_qA = _exp(qA * PRECISION / b);
        uint256 exp_qB = _exp(qB * PRECISION / b);

        // dominator
        uint256 S = exp_qA + exp_qB;

        // get P_A 和 P_B
        priceA = (exp_qA * PRECISION) / S;  // P_A = e^{qA/b} / S
        priceB = (exp_qB * PRECISION) / S;  // P_B = e^{qB/b} / S

        return (priceA, priceB);
    }

    /**
    * NOT USED IN CURRENT VER
    * @dev  `_amount` -> get shares
    *      formula: _amount = C(q_A + _amount, q_B) - C(q_A, q_B)
    */
    function getShares(uint256 _marketId, bool _isOptionA, uint256 _amount) external view returns (uint256) {
        uint256 qA = optionAShares[_marketId];
        uint256 qB = optionBShares[_marketId];

        uint256 expDeltaC = _exp(_amount * PRECISION / b);
        uint256 exp_qA = _exp(qA * PRECISION / b);
        uint256 exp_qB = _exp(qB * PRECISION / b);

        uint256 newExp_qA;
        if (_isOptionA) {
            newExp_qA = expDeltaC * exp_qA + (expDeltaC - 1) * exp_qB;
        } else {
            newExp_qA = expDeltaC * exp_qB + (expDeltaC - 1) * exp_qA;
        }

        // Δq_A = b * ln(newExp_qA) - qA
        uint256 deltaQ = (b * _log(newExp_qA)) / PRECISION - qA;

        return deltaQ;
    }

    function addLiquidity(uint256 _marketId, uint256 amountA, uint256 amountB) external {
        require(amountA > 0 && amountB > 0, "Amounts must be greater than 0!");

        optionAShares[_marketId] += amountA;
        optionBShares[_marketId] += amountB;

        emit LiquidityAdded(_marketId, amountA, amountB);
    }


    function removeLiquidity(uint256 _marketId, uint256 amountA, uint256 amountB) external {
        require(optionAShares[_marketId] >= amountA && optionBShares[_marketId] >= amountB, "Not enough liquidity to remove!");

        optionAShares[_marketId] -= amountA;
        optionBShares[_marketId] -= amountB;

        emit LiquidityRemoved(_marketId, amountA, amountB);
    }


    // --- math utility ---
    function _log(uint256 x) internal pure returns (uint256) {
        require(x > 0, "Log undefined for <= zero!");

        // uint256 -> UD60x18
        UD60x18 xUD = ud(x);

        UD60x18 result = ln(xUD);

        return result.unwrap();
    }
    function _exp(uint256 x) internal pure returns (uint256) {
        // uint256 -> UD60x18
        UD60x18 xUD = ud(x);

        UD60x18 result = exp(xUD);

        return result.unwrap();
    }

}
