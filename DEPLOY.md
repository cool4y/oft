# Deployment Guide - Solana Devnet + Base Sepolia

This guide provides the exact commands to deploy the OFT on both chains and run the frontend.

## Generated Wallets

**Solana Wallet:**
- Public Key: `BZ7hpFEfvqjZL6hZ4z7gY1mfrZQZnUjCnAzYPLAcPJDX`
- Keypair file: `solana-deployer.json`

**EVM Wallet:**
- Address: `0x92Afde51763404755f27eacc72A7813e3AC1f7D7`
- Private Key: already set in `.env`

---

## Step 1: Fund the Wallets

### Solana Devnet (need ~5 SOL)
```bash
solana airdrop 5 BZ7hpFEfvqjZL6hZ4z7gY1mfrZQZnUjCnAzYPLAcPJDX -u devnet
```
Or use https://faucet.solana.com/ and paste `BZ7hpFEfvqjZL6hZ4z7gY1mfrZQZnUjCnAzYPLAcPJDX`

### Base Sepolia (need ~0.05 ETH)
1. Get Sepolia ETH from https://sepoliafaucet.com/ for `0x92Afde51763404755f27eacc72A7813e3AC1f7D7`
2. Bridge to Base Sepolia at https://bridge.arbitrum.io/ or use https://www.alchemy.com/faucets/base-sepolia

---

## Step 2: Install Prerequisites (if not already installed)

```bash
# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
rustup default 1.84.1

# Solana CLI
sh -c "$(curl -sSfL https://release.anza.xyz/v2.2.20/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Anchor
cargo install --git https://github.com/solana-foundation/anchor --tag v0.31.1 anchor-cli --locked

# Verify
solana --version    # 2.2.20
anchor --version    # 0.31.1
```

---

## Step 3: Deploy Solana OFT Program

```bash
# 3a. Generate program keypair
anchor keys sync -p oft

# 3b. Get program ID
anchor keys list
# Save the "oft" program ID - you'll need it!

# 3c. Build (Docker must be running)
anchor build -v -e OFT_ID=<YOUR_OFT_PROGRAM_ID>

# 3d. Deploy
solana program deploy \
  --program-id target/deploy/oft-keypair.json \
  target/verifiable/oft.so \
  -u devnet \
  --with-compute-unit-price 100000
```

---

## Step 4: Create Solana OFT Store

```bash
pnpm hardhat lz:oft:solana:create \
  --eid 40168 \
  --program-id <YOUR_OFT_PROGRAM_ID> \
  --only-oft-store true \
  --amount 100000000000 \
  --name "MyOFT" \
  --symbol "MOFT"
```

Save the output:
- **OFT Store address** - needed for `layerzero.config.ts` and frontend
- **Token Mint address** - needed for frontend

---

## Step 5: Deploy EVM OFT to Base Sepolia

```bash
# Compile
npx hardhat compile

# Deploy
pnpm hardhat lz:deploy
# Select "base-sepolia" when prompted
```

Save the **MyOFT contract address** from the output.

---

## Step 6: Wire the Contracts

```bash
# Initialize Solana config accounts
npx hardhat lz:oft:solana:init-config --oapp-config layerzero.config.ts

# Wire contracts together (sets peers, enforced options, DVNs)
pnpm hardhat lz:oapp:wire --oapp-config layerzero.config.ts
```

---

## Step 7: Test Cross-Chain Send

```bash
# Base Sepolia -> Solana Devnet
npx hardhat lz:oft:send \
  --src-eid 40245 \
  --dst-eid 40168 \
  --to BZ7hpFEfvqjZL6hZ4z7gY1mfrZQZnUjCnAzYPLAcPJDX \
  --amount 1

# Solana Devnet -> Base Sepolia
npx hardhat lz:oft:send \
  --src-eid 40168 \
  --dst-eid 40245 \
  --to 0x92Afde51763404755f27eacc72A7813e3AC1f7D7 \
  --amount 1
```

Track at: https://testnet.layerzeroscan.com/

---

## Step 8: Update Frontend Config

Edit `frontend/src/lib/constants.ts` with your deployed addresses:

```typescript
export const SOLANA_OFT_PROGRAM_ID = "<YOUR_PROGRAM_ID>";
export const SOLANA_OFT_STORE = "<YOUR_OFT_STORE_ADDRESS>";
export const SOLANA_TOKEN_MINT = "<YOUR_TOKEN_MINT>";
export const BASE_SEPOLIA_OFT_ADDRESS = "<YOUR_BASE_SEPOLIA_CONTRACT>";
```

---

## Step 9: Run the Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Open http://localhost:3000 in your browser.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `solana airdrop` rate limited | Use https://faucet.solana.com/ instead |
| Hardhat can't download compiler | Check internet connection / proxy settings |
| Deployment slow | Increase `--with-compute-unit-price` to 500000+ |
| Wiring fails | Run `init-config` first, then `wire` |
| "insufficient funds" | Fund wallets with more testnet tokens |
