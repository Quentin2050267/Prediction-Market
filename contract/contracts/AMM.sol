// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;


contract AutomatedMarketMaker {
    mapping(uint256 => uint256) public optionAShares;
    mapping(uint256 => uint256) public optionBShares; 
    uint256 public constant PRECISION = 1e18; // 价格计算精度
    uint256 public b = 100 * PRECISION; // 流动性参数

    event LiquidityAdded(uint256 indexed marketId, uint256 amountA, uint256 amountB);
    event LiquidityRemoved(uint256 indexed marketId, uint256 amountA, uint256 amountB);
    event SharesPurchased(uint256 indexed marketId, address indexed buyer, bool isOptionA, uint256 amount, uint256 price);


    /** 
     * @dev LSMR
     */
    function getCost(uint256 _marketId, uint256 qA, uint256 qB) public view returns (uint256) {
        uint256 expA = _exp(qA * PRECISION / b);
        uint256 expB = _exp(qB * PRECISION / b);
        return (b * _log(expA + expB)) / PRECISION;
    }
    
    function getPrice(uint256 _marketId, bool _isOptionA, uint256 _amount) external view returns (uint256) {
        uint256 qA = optionAShares[_marketId];
        uint256 qB = optionBShares[_marketId];

        uint256 costBefore = getCost(_marketId, qA, qB);
        uint256 costAfter;
        if (_isOptionA) {
            costAfter = getCost(_marketId, qA + _amount, qB);
        } else {
            costAfter = getCost(_marketId, qA, qB + _amount);
        }

        return costAfter - costBefore;
    }
    
    /**
    * @dev 计算用户购买 `_amount` 份额时能获得多少 shares
    *      公式: shares = C(q_A + _amount, q_B) - C(q_A, q_B)
    */
    function getShares(uint256 _marketId, bool _isOptionA, uint256 _amount) external view returns (uint256) {
        uint256 qA = optionAShares[_marketId];
        uint256 qB = optionBShares[_marketId];

        uint256 costBefore = getCost(_marketId, qA, qB);
        uint256 costAfter;
        if (_isOptionA) {
            costAfter = getCost(_marketId, qA + _amount, qB);
        } else {
            costAfter = getCost(_marketId, qA, qB + _amount);
        }

        return costAfter - costBefore; // cost paid by user
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
        require(x > 0, "Log undefined for zero!");

        uint256 result = 0;
        while (x >= 2 * 1e18) {
            x /= 2;
            result += 693147180000000000; // approx. log(2) * 1e18
        }

        uint256 y = (x - 1e18) * 1e18 / (x + 1e18);
        uint256 y2 = (y * y) / 1e18;

        uint256 term = y;
        for (uint8 i = 1; i < 10; i += 2) {
            result += (term / i);
            term = (term * y2) / 1e18;
        }

        return 2 * result;
    }
    function _exp(uint256 x) internal pure returns (uint256) {
        uint256 result = PRECISION;
        uint256 term = PRECISION;

        for (uint8 i = 1; i < 10; i++) {
            term = (term * x) / (i * PRECISION);
            result += term;
        }
        return result;
    }

}
