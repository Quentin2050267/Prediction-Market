# Web3-Prediction-Market
It is a baseline for our prediction market Web3 dapp. **It is now fully connected into Kaia Testnet.**

## Implementation

### Prerequisites

- Node.js (version 20.17.0)
- npm (version 10.8.2)
- Metamask 
- Thirdweb
- Go to [Kaia Faucet](https://www.kaia.io/faucet) and claim some test tokens yourself every 24h with Metamask wallet address.

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/Quentin2050267/Prediction-Market.git
    cd Prediction-Market
    ```

2. Install dependencies:
    ```bash
    cd contract
    npm install
    touch .env
    ```

3. Create Thirdweb secret key:
    - Go to [Thirdweb](http://www.thirdweb.com/) and create a secret key.
    - Write down two things: **your-secret-key** and **client id**.
    - Replace `<your-secret-key>` with the actual key you created.

    ```bash
    npm run deploy -- -k <your-secret-key>
    ```

4. Configure `.env` file in the contract directory:
    ```bash
    DEPLOYER_ADDRESS="your_metamask_wallet_address"
    KAIROS_TESTNET_URL="https://public-en-kairos.node.kaia.io"
    PRIVATE_KEY="your_metamask_wallet_private_key"
    ```

5. Deploy the prediction market contract and Swan Token (SWT) contract:
    ```bash
    npx hardhat run scripts/deploy.js --network kairos
    ```
    **Please copy the addresses of these two contracts and paste them into `../frontend/src/constants/contracts.ts` and `.env` file.**
    ```bash
    PREDICTION_MARKET_CONTRACT_ADDRESS= "0x..."
    SWAN_TOKEN_CONTRACT_ADDRESS= "0x..."
    ```

    There should be 5 entries in `.env`.
6. Configure `.env` file in the frontend directory:
    ```bash
    cd ../frontend
    npm install
    touch .env
    ```
    Write the following into the `.env` file:
    ```bash
    NEXT_PUBLIC_THIRDWEB_CLIENT_ID="client_id_in_thirdweb"
    THIRDWEB_SECRET_KEY="secret_key_in_thirdweb"
    KAIROS_TESTNET_URL="https://public-en-kairos.node.kaia.io"
    ```

### Run the development server

1. Start the development server:
    ```bash
    npm run dev
    ```

## Glimpse
![image](https://github.com/user-attachments/assets/f5aa7e17-9b78-4714-bed8-96102c8ab1dc)

![image](https://github.com/user-attachments/assets/7a98e5fc-4c4c-4abe-bf06-b029599e7a60)