from brownie import BettingToken, PredictionMarket, AutomatedMarketMaker, accounts, chain

def main():
    # 获取第一个账户作为合约所有者
    owner = accounts[0]
    user1 = accounts[1]
    user2 = accounts[2]

    # 1️⃣ 部署 BettingToken
    print("\n🚀 Deploying BettingToken...")
    betting_token = BettingToken.deploy(owner, {'from': owner})
    print(f"✅ BettingToken deployed at {betting_token.address}\n")

    # 2️⃣ 部署 PredictionMarket，传入 BettingToken 地址
    print("🚀 Deploying PredictionMarket...")
    amm = AutomatedMarketMaker.deploy({ 'from': owner })
    prediction_market = PredictionMarket.deploy(
        betting_token.address, 
        amm.address,  
        {'from': owner}
    )
    print(f"✅ PredictionMarket deployed at {prediction_market.address}\n")
    print(f"✅ AutomatedMarketMaker deployed at {amm.address}\n")

    # 3️⃣ 测试 - Mint 代币给用户
    mint_amount = 10_000 * 10 ** betting_token.decimals()
    print(f"💰 Minting {mint_amount} BTT to user1...")
    betting_token.mint(user1, mint_amount, {'from': owner})
    print(f"✅ user1 BTT balance: {betting_token.balanceOf(user1)}\n")

    # 4️⃣ 授权 PredictionMarket & AMM 操作代币
    print(f"🔗 Approving PredictionMarket & AMM to spend {mint_amount} BTT from user1...")
    betting_token.approve(prediction_market.address, mint_amount, {'from': user1})
    betting_token.approve(amm.address, mint_amount, {'from': user1})  # ✅ 允许 AMM 代币转账
    print("✅ Approval successful\n")

    # 5️⃣ 创建市场
    print("📊 Creating a new Prediction Market...")
    tx = prediction_market.createMarket(
        "Will BTC price exceed $100,000?",
        "Yes",
        "No",
        60 * 60 * 24,  # 市场持续 1 天
        {'from': owner}
    )

    # 获取 market_id
    market_id = tx.return_value  # ✅ 获取 market_id
    print(f"✅ Market Created with ID: {market_id}\n")

    # 6️⃣ **提供 AMM 流动性**
    print("💦 Adding Liquidity to AMM...")
    liquidity_A = 5000 * 10 ** betting_token.decimals()
    liquidity_B = 5000 * 10 ** betting_token.decimals()
    amm.addLiquidity(market_id, liquidity_A, liquidity_B, {'from': owner})
    print(f"✅ Liquidity Added: {liquidity_A} for 'Yes', {liquidity_B} for 'No'\n")

    # 7️⃣ **检查 AMM 的价格计算**
    print("📈 Checking AMM Prices...")
    price_A = amm.getPrice(market_id, True, 1000 * 10 ** betting_token.decimals())  # 买入 1000 Yes 份额
    price_B = amm.getPrice(market_id, False, 1000 * 10 ** betting_token.decimals())  # 买入 1000 No 份额
    print(f"✅ AMM Price for 'Yes': {price_A}")
    print(f"✅ AMM Price for 'No': {price_B}\n")

    # 8️⃣ 购买股份
    buy_amount = 1000 * 10 ** betting_token.decimals()  # 用户花 1000 BTT 购买股份
    print("🎟️ User1 buying shares for 'Yes' option with amount...")

    market_info = prediction_market.getMarketInfo(market_id)
    market_end_time = market_info[1]
    print(f"📅 Market End Time: {market_end_time}")
    print(f"⏳ Current block.timestamp BEFORE buying: {chain.time()}")
    if chain.time() >= market_end_time:
        print("🚨 Market already ended, cannot buy shares!")
        return

    prediction_market.buyByAmount(market_id, True, buy_amount, {'from': user1})
    print(f"✅ user1 Shares Purchased (by amount {buy_amount} BTT)\n")

    # 9️⃣ 解析市场（模拟市场结束）
    print("📢 Resolving market (Outcome: Yes)...")

    market_info = prediction_market.getMarketInfo(market_id)
    print(f"📅 Market endTime: {market_info[1]} | Current block.timestamp: {chain.time()}")

    # 快进时间，跳过市场结束时间
    chain.sleep(60 * 60 * 24)  # 跳过 1 天
    chain.mine(2)  # 生成一个区块，使block.timestamp 严格大于 market.endTime

    market_info = prediction_market.getMarketInfo(market_id)
    print(f"⏳ After sleeping: Market endTime: {market_info[1]} | Current block.timestamp: {chain.time()}")


    prediction_market.resolveMarket(market_id, 1, {'from': owner})  # 1 代表 OPTION_A
    print(f"✅ Market Resolved\n")

    # 🔟 领取奖金
    print("💰 Claiming winnings...")
    prediction_market.claimWinnings(market_id, {'from': user1})
    print(f"✅ user1 BTT balance after claiming: {betting_token.balanceOf(user1)}\n")

    print("🎉 Deployment & AMM Tests Completed!")

