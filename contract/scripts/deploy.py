from brownie import BettingToken, PredictionMarket, accounts, chain

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
    prediction_market = PredictionMarket.deploy(betting_token.address, {'from': owner})
    amm = AMM.deploy(betting_token.address, {'from': owner})
    print(f"✅ PredictionMarket deployed at {prediction_market.address}\n")
    print(f"✅ AutomatedMarketMaker deployed at {amm.address}\n")

    # 3️⃣ 测试 - Mint 代币给用户
    mint_amount = 10_000 * 10 ** betting_token.decimals()
    print(f"💰 Minting {mint_amount} BTT to user1...")
    betting_token.mint(user1, mint_amount, {'from': owner})
    print(f"✅ user1 BTT balance: {betting_token.balanceOf(user1)}\n")

    # 4️⃣ 测试 - 授权 PredictionMarket 代币操作
    print(f"🔗 Approving PredictionMarket to spend {mint_amount} BTT from user1...")
    betting_token.approve(prediction_market.address, mint_amount, {'from': user1})
    print("✅ Approval successful\n")

    # 创建市场
    print("📊 Creating a new Prediction Market...")
    tx = prediction_market.createMarket(
        "Will BTC price exceed $100,000?",
        "Yes",
        "No",
        60 * 60 * 24,  # 市场持续 1 天
        {'from': owner}
    )

    # 获取 market_id
    market_id = tx.return_value  # ✅ 获取正确的 market_id
    print(f"✅ Market Created with ID: {market_id}\n")

    # 购买股份
    print("🎟️ User1 buying shares for 'Yes' option...")
    prediction_market.buyShares(market_id, True, 1000 * 10 ** betting_token.decimals(), {'from': user1})
    print(f"✅ user1 Shares Purchased\n")


    # 7️⃣ 解析市场（模拟市场结束）
    print("📢 Resolving market (Outcome: Yes)...")
    # 快进时间，跳过市场结束时间
    chain.sleep(60 * 60 * 24)  # 跳过 1 天
    chain.mine(1)  # 生成一个区块，使时间生效
    prediction_market.resolveMarket(market_id, 1, {'from': owner})  # 1 代表 OPTION_A
    print(f"✅ Market Resolved\n")

    # 8️⃣ 领取奖金
    print("💰 Claiming winnings...")
    prediction_market.claimWinnings(market_id, {'from': user1})
    print(f"✅ user1 BTT balance after claiming: {betting_token.balanceOf(user1)}\n")

    print("🎉 Deployment & Tests Completed!")
