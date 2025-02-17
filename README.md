# Web3-Prediction-Market
It is a baseline for our prediction market wen3 dapp. One problem here is it needs some gas fee to depoly(?) the smart contract on the thirdweb thus needing to actually be connected to the wallet which has some crypto in it. So this version only uses mock data as shown in the frontend. There is no token transaction for now. I have applied for the support for free development, hope it will be approved. 🤞

## Implementation

### Prerequisites

- Node.js (mine is 20.17.0)
- npm (mine is 10.8.2)
- Metamask
- Thirdweb

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
    npm run deploy -- -k <your-secret-key> # should go to thirdweb and create one
    ```

    ```bash
    cd ../
    cd frontend
    npm install
    ```

3. Run the development server:
    ```bash
    npm run dev
    ```
## Glimpse
<img width="1470" alt="image" src="https://github.com/user-attachments/assets/f5aa7e17-9b78-4714-bed8-96102c8ab1dc" />

<img width="1470" alt="image" src="https://github.com/user-attachments/assets/7a98e5fc-4c4c-4abe-bf06-b029599e7a60" />

