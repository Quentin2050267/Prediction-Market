# Web3-Prediction-Market
It is a baseline for our prediction market wen3 dapp. **It is now fully connected into Kaia Testnet.**

## Implementation

### Prerequisites

- Node.js (mine is 20.17.0)
- npm (mine is 10.8.2)
- Metamask 
- Thirdweb
- Go to https://www.kaia.io/faucet and claim some test tokens yourself every 24h with Metamask wallet address.

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
    Go to [Thirdweb](http://www.thirdweb.com/) and create a secret key. You need to write down two things in this website, one is **your-secret-key** and the other is the **client id**. Replace `<your-secret-key>` with the actual key you created.


    ``` bash
    npm run deploy -- -k <your-secret-key> 
    ```
    
    Write `DEPLOYER_ADDRESS= "your_metamask_wallet_address"` into `.env` under dir contract.
    Write `KAIROS_TESTNET_URL= "https://public-en-kairos.node.kaia.io"` into `.env` under dir contract.
    Write `PRIVATE_KEY= "your_metamask_wallet_private_key"` into `.env` under dir contract.

    Deploy the prediction market contract and our own swan token(SWT) contract.
    ``` bash
    npx hardhat run scripts/deploy.js --network kairos 
    ```
    **Please copy the addresses of these two contract and paste into ../frontend/src/constants/contracts.ts and .env**

    Your .env should look like follows:

    ```bash
    cd ../
    cd frontend
    npm install
    touch .env
    ```
    
    Write
    NEXT_PUBLIC_THIRDWEB_CLIENT_ID="client_id_in_thirdweb"
    THIRDWEB_SECRET_KEY="secret_key_in_thirdweb"
    KAIROS_TESTNET_URL= "https://public-en-kairos.node.kaia.io"
    into the `.env` under dir frontend. (Not the same .`env` stated above)

3. Run the development server:
    ```bash
    npm run dev
    ```
## Glimpse
<img width="1470" alt="image" src="https://github.com/user-attachments/assets/f5aa7e17-9b78-4714-bed8-96102c8ab1dc" />

<img width="1470" alt="image" src="https://github.com/user-attachments/assets/7a98e5fc-4c4c-4abe-bf06-b029599e7a60" />

