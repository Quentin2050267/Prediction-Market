// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "thirdweb-dev/contracts@3.15.0/contracts/eip/interface/IERC20.sol";
import "thirdweb-dev/contracts@3.15.0/contracts/extension/Ownable.sol";
import "thirdweb-dev/contracts@3.15.0/contracts/extension/upgradeable/ReentrancyGuard.sol";
// import "@uniswap/v2-periphery/contracts/libraries/UniswapV2Library.sol";

import "contracts/AMM.sol";

contract PredictionMarket is Ownable, ReentrancyGuard {
    enum MarketOutcome {
        UNRESOLVED,
        OPTION_A,
        OPTION_B
    }

    struct Market {
        string question;
        uint256 endTime;
        MarketOutcome outcome;
        string optionA;
        string optionB;
        uint256 totalOptionAShares;
        uint256 totalOptionBShares;
        uint256 marketCost;  // cost fn!
        bool resolved;
        mapping(address => uint256) optionASharesBalance;
        mapping(address => uint256) optionBSharesBalance;
        mapping(address => bool) hasClaimed;
        mapping(uint256 => uint256) optionAVotesByDate; // new
        mapping(uint256 => uint256) optionBVotesByDate; // new
    }

    IERC20 public swanToken;
    uint256 public marketCount;
    AutomatedMarketMaker public AMM;
    mapping(uint256 => Market) public markets;

    event DebugBuy(uint256 marketId, address buyer, uint256 shares, uint256 totalCost, uint256 marketTotalA, uint256 marketTotalB);

    event MarketCreated(
        uint256 indexed marketId,
        string question,
        string optionA,
        string optionB,
        uint256 endTime
    );

    event SharesPurchased(
        uint256 indexed marketId,
        address indexed buyer,
        bool isOptionA,
        uint256 amount
    );

    event MarketResolved(
        uint256 indexed marketId,
        MarketOutcome outcome
    );

    event Claimed(
        uint256 indexed marketId,
        address indexed user,
        uint256 amount
    );

    constructor(address _swanToken, address _ammAddress) {
        swanToken = IERC20(_swanToken);
        _setupOwner(msg.sender);
        AMM = AutomatedMarketMaker(_ammAddress);
    }

    function _canSetOwner() internal view virtual override returns (bool) {
        return owner() == msg.sender;
    }

    function createMarket(
        string memory _question,
        string memory _optionA,
        string memory _optionB,
        uint256 _duration
    ) external returns (uint256) {
        require(msg.sender == owner(), "Only owner can create markets");
        require(_duration > 0, "Duration must be greater than 0");
        require(bytes(_question).length > 0, "Question cannot be empty");
        require(bytes(_optionA).length > 0, "Option A cannot be empty");
        require(bytes(_optionB).length > 0, "Option B cannot be empty");

        uint256 marketId = marketCount++;
        Market storage market = markets[marketId];

        market.question = _question;
        market.endTime = block.timestamp + _duration;
        market.outcome = MarketOutcome.UNRESOLVED;
        market.optionA = _optionA;
        market.optionB = _optionB;

        // init cost!!!
        market.totalOptionAShares = 0;
        market.totalOptionBShares = 0;
        uint256 initialCost = AMM.getCost(0, 0);
        // return initialCost;
        require(swanToken.transferFrom(msg.sender, address(this), initialCost), "Transfer failed");
        market.marketCost = initialCost;

        emit MarketCreated(marketId, _question, _optionA, _optionB, market.endTime);
        return marketId;
    }

    // function buyByAmount(uint256 _marketId, bool _isOptionA, uint256 _amount) external {
    //     Market storage market = markets[_marketId];
    //     require(market.endTime > block.timestamp, "Market has ended");
    //     require(_amount > 0, "Amount must be greater than 0");
    //     require(!market.resolved, "Market has been resolved");

    //     uint256 _shares = AMM.getShares(_marketId, _isOptionA, _amount);

    //     uint256 currentDate = block.timestamp / 1 days; // record date for plot

    //     // pay
    //     require(swanToken.transferFrom(msg.sender, address(this), _amount), "Transfer failed");

    //     // record
    //     if (_isOptionA) {
    //         market.optionASharesBalance[msg.sender] += _shares;
    //         market.totalOptionAShares += _shares;
    //         market.optionAVotesByDate[currentDate] += _shares;
    //     } else {
    //         market.optionBSharesBalance[msg.sender] += _shares;
    //         market.totalOptionBShares += _shares;
    //         market.optionBVotesByDate[currentDate] += _shares;
    //     }

    //     emit SharesPurchased(_marketId, msg.sender, _isOptionA, _shares);
    // }
    function buyByShares(uint256 _marketId, bool _isOptionA, uint256 _shares) external {
        Market storage market = markets[_marketId];
        require(market.totalOptionAShares > 0 && market.totalOptionBShares > 0, "Not enough liquidity!");
        require(market.endTime > block.timestamp, "Market has ended");
        require(!market.resolved, "Market has been resolved");
        require(_shares > 0, "Amount must be greater than 0");


        uint256 total_cost = AMM.getAmount(
            market.totalOptionAShares, market.totalOptionBShares, _isOptionA, _shares
        );

        uint256 currentDate = block.timestamp / 1 days;

        require(
            swanToken.transferFrom(msg.sender, address(this), total_cost),
            "Transfer failed"
        );
        if (_isOptionA) {
            market.optionASharesBalance[msg.sender] += _shares;
            market.totalOptionAShares += _shares;
            market.optionAVotesByDate[currentDate] += _shares;
        } else {
            market.optionBSharesBalance[msg.sender] += _shares;
            market.totalOptionBShares += _shares;
            market.optionBVotesByDate[currentDate] += _shares;
        }

        emit SharesPurchased(_marketId, msg.sender, _isOptionA, _shares);
        emit DebugBuy(_marketId, msg.sender, _shares, total_cost, market.totalOptionAShares, market.totalOptionBShares);

    }

    function addLiquidity(uint256 _marketId, uint256 amountA, uint256 amountB) external {
        require(amountA > 0 && amountB > 0, "Amounts must be greater than 0");

        Market storage market = markets[_marketId];

        // calculate cost
        uint256 newCost = AMM.getCost(
            market.totalOptionAShares + amountA,
            market.totalOptionBShares + amountB
        );

        uint256 deltaCost = newCost - market.marketCost;

        // update `markets`
        market.marketCost = newCost;
        market.totalOptionAShares += amountA;
        market.totalOptionBShares += amountB;

        // transfer
        require(swanToken.transferFrom(msg.sender, address(this), deltaCost), "Transfer failed");

        // call `AMM.addLiquidity()` to update `optionAShares` and `optionBShares`
        // AMM.addLiquidity(_marketId, amountA, amountB);

        // emit LiquidityAdded(_marketId, amountA, amountB);
    }

    function getMarketCost(uint256 _marketId) external view returns (uint256) {
        return markets[_marketId].marketCost;
    }


    // function buyShares(
    //     uint256 _marketId,
    //     bool _isOptionA,
    //     uint256 _amount)
    //     external {
    //     Market storage market = markets[_marketId];
    //     require(market.endTime > block.timestamp, "Market has ended");
    //     require(!market.resolved, "Market has been resolved");
    //     require(_amount > 0, "Amount must be greater than 0");

    //     // 自定义价格
    //     uint256 price = AMM.getPrice(_isOptionA, _amount);
    //     uint256 totalCost = price * _amount / 1e18;

    //     require(swanToken.transferFrom(msg.sender, address(this), totalCost), "Transfer failed");
    //     uint256 sharesReceived = AMM.getShares(_marketId, _isOptionA, _amount);

    //     if (_isOptionA) {
    //         market.optionASharesBalance[msg.sender] += sharesReceived;
    //         market.totalOptionAShares += sharesReceived;
    //     } else {
    //         market.optionBSharesBalance[msg.sender] += sharesReceived;
    //         market.totalOptionBShares += sharesReceived;
    //     }

    //     emit SharesPurchased(_marketId, msg.sender, _isOptionA, sharesReceived);
    // }

    function resolveMarket(uint256 _marketId, MarketOutcome _outcome) external {
        require(msg.sender == owner(), "Only owner can resolve markets");
        Market storage market = markets[_marketId];
        require(market.endTime < block.timestamp, "Market has not ended");
        require(!market.resolved, "Market has already been resolved");
        require(_outcome != MarketOutcome.UNRESOLVED, "Outcome cannot be unresolved");

        market.outcome = _outcome;
        market.resolved = true;

        emit MarketResolved(_marketId, _outcome);
    }

    function claimWinnings(uint256 _marketId) external {
        Market storage market = markets[_marketId];
        require(market.resolved, "Market has not been resolved");
        require(!market.hasClaimed[msg.sender], "Already claimed");

        // uint256 userShares = 0;
        // uint256 winningShares = 0;
        // uint256 losingShares = 0;
        uint256 userAmount = 0;
        uint256 winningAmount = 0;
        uint256 losingAmount = 0;

        // if (market.outcome == MarketOutcome.OPTION_A) {
        //     userShares = market.optionASharesBalance[msg.sender];
        //     winningShares = market.totalOptionAShares;
        //     losingShares = market.totalOptionBShares;
        //     market.optionASharesBalance[msg.sender] = 0;
        // } else if (market.outcome == MarketOutcome.OPTION_B) {
        //     userShares = market.optionBSharesBalance[msg.sender];
        //     winningShares = market.totalOptionBShares;
        //     losingShares = market.totalOptionAShares;
        //     market.optionBSharesBalance[msg.sender] = 0;
        // } else {
        //     revert("Market has not been resolved");
        // }
        if (market.outcome == MarketOutcome.OPTION_A) {
            userAmount = market.optionASharesBalance[msg.sender];  // 资金 amount
            winningAmount = market.totalOptionAShares;  // 总资金 amount
            losingAmount = market.totalOptionBShares;  // 总资金 amount
            market.optionASharesBalance[msg.sender] = 0;
        } else if (market.outcome == MarketOutcome.OPTION_B) {
            userAmount = market.optionBSharesBalance[msg.sender];  // 资金 amount
            winningAmount = market.totalOptionBShares;
            losingAmount = market.totalOptionAShares;
            market.optionBSharesBalance[msg.sender] = 0;
        } else {
            revert("Market has not been resolved");
        }

        require(userAmount > 0, "No winnings to claim");
        // uint256 rewardRatio = (losingShares * 1e18) / winningShares;
        // uint256 winnings = userShares + (userShares * rewardRatio) / 1e18;
        // LMSR 计算 winnings
        uint256 costBefore = AMM.getCost(winningAmount - userAmount, losingAmount);
        uint256 costAfter = AMM.getCost(winningAmount, losingAmount);
        uint256 winnings = costAfter - costBefore;

        require(swanToken.transfer(msg.sender, winnings), "Transfer failed");
        emit Claimed(_marketId, msg.sender, winnings);
    }

    function getMarketInfo(uint256 _marketId) external view returns (
        string memory question,
        uint256 endTime,
        MarketOutcome outcome,
        string memory optionA,
        string memory optionB,
        uint256 totalOptionAShares,
        uint256 totalOptionBShares,
        bool resolved
    ) {
        Market storage market = markets[_marketId];
        return (
            market.question,
            market.endTime,
            market.outcome,
            market.optionA,
            market.optionB,
            market.totalOptionAShares,
            market.totalOptionBShares,
            market.resolved
        );
    }

    function getSharesBalance(uint256 _marketId, address _user) external view returns (
        uint256 optionASharesBalance,
        uint256 optionBSharesBalance
    ) {
        Market storage market = markets[_marketId];
        return (
            market.optionASharesBalance[_user],
            market.optionBSharesBalance[_user]
        );
    }

}