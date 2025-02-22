// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract AutomatedMarketMaker {
    mapping(uint256 => uint256) public optionAPool;
    mapping(uint256 => uint256) public optionBPool; 
    uint256 public constant PRECISION = 1e18; // 价格计算精度
    uint256 public b = 100 * PRECISION; // 流动性参数

    event LiquidityAdded(uint256 indexed marketId, uint256 amountA, uint256 amountB);
    event LiquidityRemoved(uint256 indexed marketId, uint256 amountA, uint256 amountB);
    event SharesPurchased(uint256 indexed marketId, address indexed buyer, bool isOptionA, uint256 amount, uint256 price);


    /** 
     * @dev LSMR
     */
    function getCost(uint256 _marketId, uint256 qA, uint256 qB) public view returns (uint256) {
        uint256 expA = exp(qA * PRECISION / b);
        uint256 expB = exp(qB * PRECISION / b);
        return (b * log(expA + expB)) / PRECISION;
    }
    
    function getPrice(uint256 _marketId, bool _isOptionA, uint256 _amount) external view returns (uint256) {
        uint256 poolX = _isOptionA ? optionAPool[_marketId] : optionBPool[_marketId];
        uint256 poolY = _isOptionA ? optionBPool[_marketId] : optionAPool[_marketId]; // counterpart

        require(poolX > 0 && poolY > 0, "Market does not exist or no liquidity!");

        // 计算购买 `_amount` 份额后，新池子的数量
        uint256 newPoolX = poolX + _amount;
        uint256 newPoolY = totalLiquidity[_marketId] / newPoolX; // x * y = k 保持不变

        return (poolY - newPoolY);
    };
    
    function getShares(uint256 _marketId, bool _isOptionA, uint256 _amount) external view returns (uint256) {
        uint256 poolX = _isOptionA ? optionAPool[_marketId] : optionBPool[_marketId];

        require(poolX > 0, "No liquidity!");

        return (_amount * PRECISION) / poolX;
    };
    
    function addLiquidity(uint256 _marketId, uint256 amountA, uint256 amountB) external;
    
    function removeLiquidity(uint256 _marketId, uint256 amountA, uint256 amountB) external;
}
