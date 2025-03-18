// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

import {IERC20} from "@thirdweb-dev/contracts/eip/interface/IERC20.sol";
import {Ownable} from "@thirdweb-dev/contracts/extension/Ownable.sol";
import {ReentrancyGuard} from "@thirdweb-dev/contracts/external-deps/openzeppelin/security/ReentrancyGuard.sol";

interface ISupraSValueFeed {
    function checkPrice(
        string memory marketPair
    ) external view returns (int256 price, uint256 timestamp);
}

contract PredictionMarketCurrency is Ownable, ReentrancyGuard {
    enum MarketOutcome {
        UNRESOLVED,
        OPTION_A,
        OPTION_B
    }

    enum ComparisonOperator {
        GREATER_THAN,
        LESS_THAN,
        EQUAL
    }

    struct Market {
        string assetSymbol;
        ComparisonOperator operator;
        uint256 targetPrice;
        uint256 endTime;
        uint256 duration;
        MarketOutcome outcome;
        uint256 totalOptionAShares;
        uint256 totalOptionBShares;
        bool resolved;
        mapping(address => uint256) optionASharesBalance;
        mapping(address => uint256) optionBSharesBalance;
        mapping(address => bool) hasClaimed;
        mapping(uint256 => uint256) optionAVotesByDate;
        mapping(uint256 => uint256) optionBVotesByDate;
    }

    IERC20 public swanToken;
    ISupraSValueFeed internal sValueFeed;
    uint256 public marketCount;
    mapping(uint256 => Market) public markets;

    event MarketCreated(
        uint256 indexed marketId,
        string assetSymbol,
        ComparisonOperator operator,
        uint256 targetPrice,
        uint256 endTime
    );

    event SharesPurchased(
        uint256 indexed marketId,
        address indexed buyer,
        bool isOptionA,
        uint256 amount
    );

    event MarketResolved(uint256 indexed marketId, MarketOutcome outcome);

    event Claimed(
        uint256 indexed marketId,
        address indexed user,
        uint256 amount
    );

    constructor(address _swanToken) {
        swanToken = IERC20(_swanToken);
        sValueFeed = ISupraSValueFeed(
            0x7f003178060af3904b8b70fEa066AEE28e85043E
        );
        _setupOwner(msg.sender);
    }

    function _canSetOwner() internal view virtual override returns (bool) {
        return owner() == msg.sender;
    }

    function createMarket(
        string memory _assetSymbol,
        ComparisonOperator _operator,
        uint256 _targetPrice,
        uint256 _duration
    ) external returns (uint256) {
        require(_duration > 0, "Duration must be greater than 0");
        require(bytes(_assetSymbol).length > 0, "Asset symbol cannot be empty");

        uint256 marketId = marketCount++;
        Market storage market = markets[marketId];
        market.assetSymbol = _assetSymbol;
        market.operator = _operator;
        market.targetPrice = _targetPrice;
        market.endTime = block.timestamp + _duration;
        market.outcome = MarketOutcome.UNRESOLVED;
        market.duration = _duration;

        emit MarketCreated(
            marketId,
            _assetSymbol,
            _operator,
            _targetPrice,
            market.endTime
        );
        return marketId;
    }

    function buyShares(
        uint256 _marketId,
        bool _isOptionA,
        uint256 _amount
    ) external {
        Market storage market = markets[_marketId];
        require(market.endTime > block.timestamp, "Market has ended");
        require(_amount > 0, "Amount must be greater than 0");
        require(!market.resolved, "Market has been resolved");

        uint256 currentDate = block.timestamp / 1 days;

        require(
            swanToken.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );
        if (_isOptionA) {
            market.optionASharesBalance[msg.sender] += _amount;
            market.totalOptionAShares += _amount;
            market.optionAVotesByDate[currentDate] += _amount;
        } else {
            market.optionBSharesBalance[msg.sender] += _amount;
            market.totalOptionBShares += _amount;
            market.optionBVotesByDate[currentDate] += _amount;
        }

        emit SharesPurchased(_marketId, msg.sender, _isOptionA, _amount);
    }

    function getVotesByDate(
        uint256 _marketId,
        uint256 _date
    ) external view returns (uint256 optionAVotes, uint256 optionBVotes) {
        Market storage market = markets[_marketId];
        return (
            market.optionAVotesByDate[_date],
            market.optionBVotesByDate[_date]
        );
    }

    function getAllVotesByDate(
        uint256 _marketId
    )
        external
        view
        returns (
            uint256[] memory dates,
            uint256[] memory optionAVotes,
            uint256[] memory optionBVotes
        )
    {
        Market storage market = markets[_marketId];
        uint256 startTime = market.endTime - market.duration;
        uint256 startDate = startTime / 1 days;
        uint256 endDate = market.endTime / 1 days;
        uint256 length = endDate - startDate + 1;

        dates = new uint256[](length);
        optionAVotes = new uint256[](length);
        optionBVotes = new uint256[](length);

        for (uint256 i = 0; i < length; i++) {
            uint256 date = startDate + i;
            dates[i] = date;
            optionAVotes[i] = market.optionAVotesByDate[date];
            optionBVotes[i] = market.optionBVotesByDate[date];
        }

        return (dates, optionAVotes, optionBVotes);
    }

    function resolveMarket(uint256 _marketId, MarketOutcome _outcome) external {
        // require(msg.sender == owner(), "Only owner can resolve markets");
        Market storage market = markets[_marketId];
        require(market.endTime < block.timestamp, "Market has not ended");
        require(!market.resolved, "Market has already been resolved");
        require(
            _outcome != MarketOutcome.UNRESOLVED,
            "Outcome cannot be unresolved"
        );

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
        uint256 rewardRatio = (losingShares * 1e18) / winningShares;
        uint256 winnings = userShares + (userShares * rewardRatio) / 1e18;

        require(swanToken.transfer(msg.sender, winnings), "Transfer failed");
        market.hasClaimed[msg.sender] = true;
        emit Claimed(_marketId, msg.sender, winnings);
    }

    function getMarketInfo(
        uint256 _marketId
    )
        external
        view
        returns (
            string memory assetSymbol,
            ComparisonOperator operator,
            uint256 targetPrice,
            uint256 endTime,
            uint256 duration,
            MarketOutcome outcome,
            uint256 totalOptionAShares,
            uint256 totalOptionBShares,
            bool resolved
        )
    {
        Market storage market = markets[_marketId];
        return (
            market.assetSymbol,
            market.operator,
            market.targetPrice,
            market.endTime,
            market.duration,
            market.outcome,
            market.totalOptionAShares,
            market.totalOptionBShares,
            market.resolved
        );
    }

    function getSharesBalance(
        uint256 _marketId,
        address _user
    ) external view returns (uint256 optionAShares, uint256 optionBShares) {
        Market storage market = markets[_marketId];
        return (
            market.optionASharesBalance[_user],
            market.optionBSharesBalance[_user]
        );
    }
}
