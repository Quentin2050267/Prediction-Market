// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import "thirdweb-dev/contracts@3.15.0/contracts/eip/interface/IERC20.sol";
import "thirdweb-dev/contracts@3.15.0/contracts/extension/Ownable.sol";
import "thirdweb-dev/contracts@3.15.0/contracts/extension/upgradeable/ReentrancyGuard.sol";
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
        bool resolved;
        mapping(address => uint256) optionASharesBalance;
        mapping(address => uint256) optionBSharesBalance;
        mapping(address => bool) hasClaimed;
    }

    IERC20 public bettingToken;
    uint256 public marketCount;
    AutomatedMarketMaker public AMM;
    mapping(uint256 => Market) public markets;

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

    constructor(address _bettingToken, address _ammAddress) {
        bettingToken = IERC20(_bettingToken);
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

        emit MarketCreated(marketId, _question, _optionA, _optionB, market.endTime);
        return marketId;
    }

    function buyShares(
        uint256 _marketId, 
        bool _isOptionA, 
        uint256 _amount) 
        external {
        Market storage market = markets[_marketId];
        require(market.endTime > block.timestamp, "Market has ended");
        require(_amount > 0, "Amount must be greater than 0");
        require(!market.resolved, "Market has been resolved");

        // 自定义价格
        uint256 price = AMM.getPrice(_marketId, _isOptionA, _amount);
        uint256 totalCost = price * _amount / 1e18;

        require(bettingToken.transferFrom(msg.sender, address(this), totalCost), "Transfer failed");
        uint256 sharesReceived = AMM.getShares(_marketId, _isOptionA, _amount);

        if (_isOptionA) {
            market.optionASharesBalance[msg.sender] += sharesReceived;
            market.totalOptionAShares += sharesReceived;
        } else {
            market.optionBSharesBalance[msg.sender] += sharesReceived;
            market.totalOptionBShares += sharesReceived;
        }

        emit SharesPurchased(_marketId, msg.sender, _isOptionA, sharesReceived);
    }

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

        uint256 userShares = 0;
        uint256 winningShares = 0;
        uint256 losingShares = 0;

        if (market.outcome == MarketOutcome.OPTION_A) {
            userShares = market.optionASharesBalance[msg.sender];
            winningShares = market.totalOptionAShares;
            losingShares = market.totalOptionBShares;
            market.optionASharesBalance[msg.sender] = 0;
        } else if (market.outcome == MarketOutcome.OPTION_B) {
            userShares = market.optionBSharesBalance[msg.sender];
            winningShares = market.totalOptionBShares;
            losingShares = market.totalOptionAShares;
            market.optionBSharesBalance[msg.sender] = 0;
        } else {
            revert("Market has not been resolved");
        }

        require(userShares > 0, "No winnings to claim");
        uint256 rewardRatio = (losingShares*1e18) / winningShares;
        uint256 winnings = userShares + (userShares * rewardRatio) / 1e18;

        require(bettingToken.transfer(msg.sender, winnings), "Transfer failed");
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
        uint256 optionAShares,
        uint256 optionBShares
    ) {
        Market storage market = markets[_marketId];
        return (
            market.optionASharesBalance[_user],
            market.optionBSharesBalance[_user]
        );
    }
}