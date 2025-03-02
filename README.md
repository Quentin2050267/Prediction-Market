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

5. Deploy the prediction market contract, Swan Token (SWT) contract and Oracle contract:
    ```bash
    npx hardhat run scripts/deploy.js --network kairos
    ```
    **Please copy the addresses of these contracts and paste them into `../frontend/src/constants/contracts.ts` and `.env` file.**
    ```bash
    PREDICTION_MARKET_CONTRACT_ADDRESS= "0x..."
    SWAN_TOKEN_CONTRACT_ADDRESS= "0x..."
    ORACLE_CONTRACT_ADDRESS= "0x..."
    ```

    There should be 6 entries in `.env`.
  <img width="627" alt="image" src="https://github.com/user-attachments/assets/f8ffefe0-f848-45e1-be08-7318430bec6a" />


7. Configure `.env` file in the frontend directory:
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
    <img width="445" alt="image" src="https://github.com/user-attachments/assets/1f5a6e3c-d486-4af7-965f-13c061f3c775" />


### Run the development server

1. Start the development server:
    ```bash
    npm run dev
    ```

## Glimpse
![image](https://github.com/user-attachments/assets/f5aa7e17-9b78-4714-bed8-96102c8ab1dc)

<img width="1470" alt="image" src="https://github.com/user-attachments/assets/143a10ba-c851-472e-9a81-4954db2a5044" />
<img width="1470" alt="image" src="https://github.com/user-attachments/assets/cbff27d7-ee41-402e-85c2-75955b8023c6" />


