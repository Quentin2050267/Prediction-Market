// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// 通用预测市场合约接口
interface IPredictionMarket {
    function createMarket(
        string memory question,
        string memory optionA,
        string memory optionB,
        uint256 duration
    ) external returns (uint256);
}

// 货币预测市场合约接口
interface IPredictionMarketCurrency {
    function createMarket(
        string memory assetSymbol,
        uint8 operator,
        uint256 targetPrice,
        uint256 duration
    ) external returns (uint256);
}

/**
 * @title PredictionMarketCandidate
 * @dev 管理预测市场的候选池，包括提案创建、投票和市场发布
 */
contract PredictionMarketCandidate {
    // 市场类型枚举
    enum MarketType {
        Currency,
        General
    }

    // 比较运算符枚举 (用于货币市场)
    enum ComparisonOperator {
        GreaterThan,
        LessThan,
        Equal
    }

    // 市场状态枚举
    enum MarketStatus {
        Pending,
        Approved,
        Rejected
    }

    // 候选市场结构
    struct MarketCandidate {
        uint256 id; // 市场ID
        address creator; // 创建者地址
        MarketType marketType; // 市场类型
        string title; // 市场标题
        uint256 creationTime; // 创建时间
        uint256 votingEndTime; // 投票结束时间
        uint256 supportVotes; // 支持票数
        uint256 againstVotes; // 反对票数
        uint256 requiredVotes; // 所需票数阈值
        MarketStatus status; // 市场状态
        // 货币市场特有字段
        string assetSymbol; // 资产符号 (例如 "BTC/USD")
        ComparisonOperator operator; // 比较运算符
        uint256 targetPrice; // 目标价格 (乘以 10^8)
        // 通用市场特有字段
        string question; // 问题
        string optionA; // 选项A
        string optionB; // 选项B
        // 市场参数
        uint256 resolutionTime; // 结算时间
        // 发布信息
        bool isPublished; // 是否已发布
        uint256 publishedMarketId; // 发布后的市场ID
    }

    // 投票记录结构
    struct Vote {
        bool hasVoted; // 是否已投票
        bool support; // 是否支持
    }

    // 市场计数器
    uint256 private _nextMarketId = 0;

    // 通用预测市场合约地址
    address public predictionMarketAddress;

    // 货币预测市场合约地址
    address public predictionMarketCurrencyAddress;

    // 存储所有候选市场
    mapping(uint256 => MarketCandidate) public marketCandidates;

    // 存储用户对每个市场的投票
    mapping(uint256 => mapping(address => Vote)) public marketVotes;

    // 存储用户创建的市场ID列表
    mapping(address => uint256[]) public userMarkets;

    // 存储所有待定市场的ID列表
    uint256[] public pendingMarketIds;

    // 存储已批准但未发布的市场ID列表
    uint256[] public approvedMarketIds;

    // 事件
    event MarketCandidateCreated(
        uint256 indexed marketId,
        address indexed creator,
        MarketType marketType,
        string title
    );
    event MarketVoted(
        uint256 indexed marketId,
        address indexed voter,
        bool support
    );
    event MarketStatusChanged(uint256 indexed marketId, MarketStatus newStatus);
    event MarketPublished(
        uint256 indexed candidateId,
        uint256 indexed publishedMarketId,
        address indexed marketContract
    );

    // 配置参数
    uint256 public votingPeriod = 7 days; // 默认投票期为7天
    // uint256 public defaultRequiredVotes = 100; // 默认所需票数
    uint256 public defaultRequiredVotes = 2; // 为了演示只需要2票

    /**
     * @dev 构造函数，初始化主预测市场合约地址
     * @param _generalMarketAddress 通用预测市场合约地址
     * @param _currencyMarketAddress 货币预测市场合约地址
     */
    constructor(address _generalMarketAddress, address _currencyMarketAddress) {
        require(
            _generalMarketAddress != address(0),
            "Invalid general market address"
        );
        require(
            _currencyMarketAddress != address(0),
            "Invalid currency market address"
        );

        predictionMarketAddress = _generalMarketAddress;
        predictionMarketCurrencyAddress = _currencyMarketAddress;
    }

    /**
     * @dev 创建货币市场候选
     */
    function createCurrencyMarketCandidate(
        string memory _title,
        string memory _assetSymbol,
        ComparisonOperator _operator,
        uint256 _targetPrice,
        uint256 _resolutionTime
    ) external returns (uint256) {
        require(
            _resolutionTime > block.timestamp,
            "Resolution time must be in the future"
        );

        uint256 marketId = _nextMarketId++;
        uint256 votingEnd = block.timestamp + votingPeriod;

        MarketCandidate storage market = marketCandidates[marketId];
        market.id = marketId;
        market.creator = msg.sender;
        market.marketType = MarketType.Currency;
        market.title = _title;
        market.creationTime = block.timestamp;
        market.votingEndTime = votingEnd;
        market.supportVotes = 0;
        market.againstVotes = 0;
        market.requiredVotes = defaultRequiredVotes;
        market.status = MarketStatus.Pending;

        // 货币市场特有信息
        market.assetSymbol = _assetSymbol;
        market.operator = _operator;
        market.targetPrice = _targetPrice;

        market.resolutionTime = _resolutionTime;
        market.isPublished = false;
        market.publishedMarketId = 0;

        // 添加到用户的市场列表
        userMarkets[msg.sender].push(marketId);

        // 添加到待定市场列表
        pendingMarketIds.push(marketId);

        emit MarketCandidateCreated(
            marketId,
            msg.sender,
            MarketType.Currency,
            _title
        );

        return marketId;
    }

    /**
     * @dev 创建通用市场候选
     */
    function createGeneralMarketCandidate(
        string memory _title,
        string memory _question,
        string memory _optionA,
        string memory _optionB,
        uint256 _resolutionTime
    ) external returns (uint256) {
        require(
            _resolutionTime > block.timestamp,
            "Resolution time must be in the future"
        );

        uint256 marketId = _nextMarketId++;
        uint256 votingEnd = block.timestamp + votingPeriod;

        MarketCandidate storage market = marketCandidates[marketId];
        market.id = marketId;
        market.creator = msg.sender;
        market.marketType = MarketType.General;
        market.title = _title;
        market.creationTime = block.timestamp;
        market.votingEndTime = votingEnd;
        market.supportVotes = 0;
        market.againstVotes = 0;
        market.requiredVotes = defaultRequiredVotes;
        market.status = MarketStatus.Pending;

        // 通用市场特有信息
        market.question = _question;
        market.optionA = _optionA;
        market.optionB = _optionB;

        market.resolutionTime = _resolutionTime;
        market.isPublished = false;
        market.publishedMarketId = 0;

        // 添加到用户的市场列表
        userMarkets[msg.sender].push(marketId);

        // 添加到待定市场列表
        pendingMarketIds.push(marketId);

        emit MarketCandidateCreated(
            marketId,
            msg.sender,
            MarketType.General,
            _title
        );

        return marketId;
    }

    /**
     * @dev 对候选市场进行投票
     */
    function voteMarket(uint256 marketId, bool support) external {
        MarketCandidate storage market = marketCandidates[marketId];
        require(market.id >= 0, "Market does not exist");
        require(market.status == MarketStatus.Pending, "Market is not pending");
        require(block.timestamp < market.votingEndTime, "Voting period ended");

        Vote storage userVote = marketVotes[marketId][msg.sender];

        // 如果用户已经投票，则撤销先前的投票
        if (userVote.hasVoted) {
            if (userVote.support) {
                market.supportVotes--;
            } else {
                market.againstVotes--;
            }
        }

        // 记录新的投票
        if (support) {
            market.supportVotes++;
            userVote.support = true;
        } else {
            market.againstVotes++;
            userVote.support = false;
        }

        userVote.hasVoted = true;

        emit MarketVoted(marketId, msg.sender, support);

        // 检查是否达到所需票数
        if (market.supportVotes + market.againstVotes >= market.requiredVotes) {
            // 如果支持票多于反对票，则批准市场
            if (market.supportVotes > market.againstVotes) {
                market.status = MarketStatus.Approved;

                // 添加到已批准但未发布的市场列表
                approvedMarketIds.push(marketId);

                // 尝试发布市场
                if (
                    (market.marketType == MarketType.General &&
                        predictionMarketAddress != address(0)) ||
                    (market.marketType == MarketType.Currency &&
                        predictionMarketCurrencyAddress != address(0))
                ) {
                    tryPublishMarket(marketId);
                }
            } else {
                market.status = MarketStatus.Rejected;
            }

            emit MarketStatusChanged(marketId, market.status);

            // 从待定列表中移除
            _removePendingMarket(marketId);
        }
    }

    /**
     * @dev 从待定市场列表中移除市场
     */
    function _removePendingMarket(uint256 marketId) internal {
        for (uint256 i = 0; i < pendingMarketIds.length; i++) {
            if (pendingMarketIds[i] == marketId) {
                // 将最后一个元素移到当前位置，然后删除最后一个元素
                pendingMarketIds[i] = pendingMarketIds[
                    pendingMarketIds.length - 1
                ];
                pendingMarketIds.pop();
                break;
            }
        }
    }

    /**
     * @dev 从已批准市场列表中移除市场
     */
    function _removeApprovedMarket(uint256 marketId) internal {
        for (uint256 i = 0; i < approvedMarketIds.length; i++) {
            if (approvedMarketIds[i] == marketId) {
                // 将最后一个元素移到当前位置，然后删除最后一个元素
                approvedMarketIds[i] = approvedMarketIds[
                    approvedMarketIds.length - 1
                ];
                approvedMarketIds.pop();
                break;
            }
        }
    }

    /**
     * @dev 处理已过期的投票
     * 任何人都可以调用此函数来处理已过期但状态仍为待定的市场
     */
    function processExpiredVotings(uint256 marketId) external {
        MarketCandidate storage market = marketCandidates[marketId];
        require(market.id >= 0, "Market does not exist");
        require(market.status == MarketStatus.Pending, "Market is not pending");
        require(
            block.timestamp >= market.votingEndTime,
            "Voting period not ended yet"
        );

        // 如果支持票多于反对票，则批准市场
        if (market.supportVotes > market.againstVotes) {
            market.status = MarketStatus.Approved;

            // 添加到已批准但未发布的市场列表
            approvedMarketIds.push(marketId);

            // 尝试发布市场
            if (
                (market.marketType == MarketType.General &&
                    predictionMarketAddress != address(0)) ||
                (market.marketType == MarketType.Currency &&
                    predictionMarketCurrencyAddress != address(0))
            ) {
                tryPublishMarket(marketId);
            }
        } else {
            market.status = MarketStatus.Rejected;
        }

        emit MarketStatusChanged(marketId, market.status);

        // 从待定列表中移除
        _removePendingMarket(marketId);
    }

    /**
     * @dev 尝试发布已批准的市场
     */
    function tryPublishMarket(uint256 marketId) public {
        MarketCandidate storage market = marketCandidates[marketId];
        require(market.id >= 0, "Market does not exist");
        require(market.status == MarketStatus.Approved, "Market not approved");
        require(!market.isPublished, "Market already published");
        require(
            market.resolutionTime > block.timestamp,
            "Resolution time passed"
        );

        if (market.marketType == MarketType.Currency) {
            require(
                predictionMarketCurrencyAddress != address(0),
                "Currency market contract not set"
            );
        } else {
            require(
                predictionMarketAddress != address(0),
                "General market contract not set"
            );
        }

        // 计算时长
        uint256 duration = market.resolutionTime - block.timestamp;

        // 根据市场类型发布
        uint256 publishedId;
        if (market.marketType == MarketType.Currency) {
            IPredictionMarketCurrency currencyMarket = IPredictionMarketCurrency(
                    predictionMarketCurrencyAddress
                );
            publishedId = currencyMarket.createMarket(
                market.assetSymbol,
                uint8(market.operator),
                market.targetPrice,
                duration
            );

            // 触发市场发布事件
            emit MarketPublished(
                marketId,
                publishedId,
                predictionMarketCurrencyAddress
            );
        } else {
            IPredictionMarket generalMarket = IPredictionMarket(
                predictionMarketAddress
            );
            publishedId = generalMarket.createMarket(
                market.question,
                market.optionA,
                market.optionB,
                duration
            );

            // 触发市场发布事件
            emit MarketPublished(
                marketId,
                publishedId,
                predictionMarketAddress
            );
        }

        // 更新发布状态
        market.isPublished = true;
        market.publishedMarketId = publishedId;

        // 从已批准但未发布的市场列表中移除
        _removeApprovedMarket(marketId);
    }

    /**
     * @dev 获取待定市场的总数
     */
    function getPendingMarketsCount() external view returns (uint256) {
        return pendingMarketIds.length;
    }

    /**
     * @dev 获取已批准但未发布市场的总数
     */
    function getApprovedMarketsCount() external view returns (uint256) {
        return approvedMarketIds.length;
    }

    /**
     * @dev 获取待定市场的分页列表
     */
    function getPendingMarkets(
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory marketIds, uint256 total) {
        total = pendingMarketIds.length;

        if (offset >= total) {
            return (new uint256[](0), total);
        }

        // 计算实际限制
        uint256 actualLimit = (offset + limit > total)
            ? (total - offset)
            : limit;
        marketIds = new uint256[](actualLimit);

        for (uint256 i = 0; i < actualLimit; i++) {
            marketIds[i] = pendingMarketIds[offset + i];
        }

        return (marketIds, total);
    }

    /**
     * @dev 获取已批准但未发布市场的分页列表
     */
    function getApprovedMarkets(
        uint256 offset,
        uint256 limit
    ) external view returns (uint256[] memory marketIds, uint256 total) {
        total = approvedMarketIds.length;

        if (offset >= total) {
            return (new uint256[](0), total);
        }

        // 计算实际限制
        uint256 actualLimit = (offset + limit > total)
            ? (total - offset)
            : limit;
        marketIds = new uint256[](actualLimit);

        for (uint256 i = 0; i < actualLimit; i++) {
            marketIds[i] = approvedMarketIds[offset + i];
        }

        return (marketIds, total);
    }

    /**
     * @dev 获取市场详细信息
     */
    function getMarketDetails(
        uint256 marketId
    )
        external
        view
        returns (
            uint256 id,
            address creator,
            MarketType marketType,
            string memory title,
            uint256 creationTime,
            uint256 votingEndTime,
            uint256 supportVotes,
            uint256 againstVotes,
            uint256 requiredVotes,
            MarketStatus status,
            uint256 resolutionTime,
            bool isPublished,
            uint256 publishedMarketId
        )
    {
        MarketCandidate storage market = marketCandidates[marketId];
        require(market.id >= 0, "Market does not exist");

        return (
            market.id,
            market.creator,
            market.marketType,
            market.title,
            market.creationTime,
            market.votingEndTime,
            market.supportVotes,
            market.againstVotes,
            market.requiredVotes,
            market.status,
            market.resolutionTime,
            market.isPublished,
            market.publishedMarketId
        );
    }

    // /**
    //  * @dev 获取货币市场的特有信息
    //  */
    // function getCurrencyMarketDetails(
    //     uint256 marketId
    // )
    //     external
    //     view
    //     returns (
    //         string memory assetSymbol,
    //         ComparisonOperator operator,
    //         uint256 targetPrice
    //     )
    // {
    //     MarketCandidate storage market = marketCandidates[marketId];
    //     require(market.id > 0, "Market does not exist");
    //     require(
    //         market.marketType == MarketType.Currency,
    //         "Not a currency market"
    //     );

    //     return (market.assetSymbol, market.operator, market.targetPrice);
    // }

    // /**
    //  * @dev 获取通用市场的特有信息
    //  */
    // function getGeneralMarketDetails(
    //     uint256 marketId
    // )
    //     external
    //     view
    //     returns (
    //         string memory question,
    //         string memory optionA,
    //         string memory optionB
    //     )
    // {
    //     MarketCandidate storage market = marketCandidates[marketId];
    //     require(market.id > 0, "Market does not exist");
    //     require(
    //         market.marketType == MarketType.General,
    //         "Not a general market"
    //     );

    //     return (market.question, market.optionA, market.optionB);
    // }

    /**
     * @dev 获取用户对特定市场的投票信息
     */
    function getUserVote(
        uint256 marketId,
        address user
    ) external view returns (bool hasVoted, bool support) {
        Vote storage vote = marketVotes[marketId][user];
        return (vote.hasVoted, vote.support);
    }

    /**
     * @dev 获取用户创建的市场列表
     */
    function getUserMarkets(
        address user
    ) external view returns (uint256[] memory) {
        return userMarkets[user];
    }

    /**
     * @dev 管理员设置投票期限
     */
    function setVotingPeriod(uint256 newVotingPeriod) external {
        // 应该添加访问控制（如 onlyOwner）
        votingPeriod = newVotingPeriod;
    }

    /**
     * @dev 管理员设置默认所需票数
     */
    function setDefaultRequiredVotes(uint256 newRequiredVotes) external {
        // 应该添加访问控制（如 onlyOwner）
        defaultRequiredVotes = newRequiredVotes;
    }
}
