# LayerZero OFT on Solana - Complete Deployment Tutorial

This tutorial walks you through deploying a **LayerZero V2 Omnichain Fungible Token (OFT)** on **Solana**, with an EVM peer on **Arbitrum Sepolia**. By the end, you will have a cross-chain token that can be sent between Solana and EVM chains.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [Project Structure](#3-project-structure)
4. [Environment Setup](#4-environment-setup)
5. [Generate Program Keypair](#5-generate-program-keypair)
6. [Build the Solana OFT Program](#6-build-the-solana-oft-program)
7. [Deploy to Solana Devnet](#7-deploy-to-solana-devnet)
8. [Create the OFT Store (Mint Token)](#8-create-the-oft-store-mint-token)
9. [Deploy EVM OFT Peer (Arbitrum Sepolia)](#9-deploy-evm-oft-peer-arbitrum-sepolia)
10. [Wire the Contracts Together](#10-wire-the-contracts-together)
11. [Send Tokens Cross-Chain](#11-send-tokens-cross-chain)
12. [Advanced Configuration](#12-advanced-configuration)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. Overview

### What is an OFT?

The **Omnichain Fungible Token (OFT)** Standard allows fungible tokens to be transferred across multiple blockchains **without asset wrapping or middlechains**. It uses a burn-and-mint mechanism:

- When you send tokens from Chain A, they are **burned** on Chain A
- LayerZero relays the message to Chain B
- Tokens are **minted** on Chain B to the recipient

### Architecture

```
┌─────────────────┐         LayerZero V2          ┌─────────────────┐
│   Solana OFT    │ ◄──── Cross-chain Messaging ──►│   EVM OFT       │
│   (SPL Token)   │         (DVN + Executor)       │   (ERC-20)      │
│                 │                                 │                 │
│  - OFT Program  │                                 │  - MyOFT.sol    │
│  - OFT Store    │                                 │  - EndpointV2   │
│  - Token Mint   │                                 │                 │
└─────────────────┘                                 └─────────────────┘
```

### Key Concepts

- **OFT Program**: The Solana on-chain program (smart contract) that handles cross-chain logic
- **OFT Store**: A PDA (Program Derived Address) account that stores OFT configuration
- **Token Mint**: The SPL Token mint that represents your fungible token on Solana
- **Peer**: The corresponding OFT contract on another chain (e.g., EVM)
- **Endpoint ID (eid)**: LayerZero's identifier for each blockchain
  - Solana Devnet: `40168`
  - Solana Mainnet: `30168`
  - Arbitrum Sepolia: `40231`

---

## 2. Prerequisites

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | >= 20.19.5 | JavaScript runtime |
| **pnpm** | latest | Package manager |
| **Rust** | 1.84.1 | Solana program compilation |
| **Solana CLI** | 2.2.20 | Solana blockchain interaction |
| **Anchor** | 0.31.1 | Solana framework |
| **Docker** | >= 28.0 | Verifiable builds |

### Install Required Tools

#### Node.js & pnpm
```bash
# Install Node.js 20+ (using nvm)
nvm install 20
nvm use 20

# Install pnpm
npm install -g pnpm
```

#### Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
rustup default 1.84.1
```

#### Solana CLI
```bash
sh -c "$(curl -sSfL https://release.anza.xyz/v2.2.20/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"

# Verify
solana --version
# Expected: solana-cli 2.2.20
```

#### Anchor
```bash
cargo install --git https://github.com/solana-foundation/anchor --tag v0.31.1 anchor-cli --locked

# Verify
anchor --version
# Expected: anchor-cli 0.31.1
```

#### Docker
Install Docker from [docker.com](https://docker.com) - needed for verifiable builds.

---

## 3. Project Structure

```
oft/
├── Anchor.toml                 # Anchor configuration for Solana programs
├── Cargo.toml                  # Rust workspace configuration
├── Cargo.lock                  # Rust dependency lock file
├── hardhat.config.ts           # Hardhat configuration for EVM contracts
├── layerzero.config.ts         # LayerZero cross-chain wiring config
├── foundry.toml                # Foundry configuration
├── package.json                # Node.js dependencies
├── rust-toolchain.toml         # Rust toolchain version
├── .env.example                # Environment variable template
│
├── programs/                   # Solana programs (Anchor/Rust)
│   ├── oft/                    # The OFT program
│   │   ├── src/
│   │   │   ├── lib.rs          # Program entry point & instruction handlers
│   │   │   ├── instructions/   # All instruction implementations
│   │   │   │   ├── init_oft.rs         # Initialize OFT Store
│   │   │   │   ├── send.rs             # Send tokens cross-chain
│   │   │   │   ├── lz_receive.rs       # Receive tokens from other chains
│   │   │   │   ├── quote_send.rs       # Quote messaging fees
│   │   │   │   ├── quote_oft.rs        # Quote OFT fees
│   │   │   │   ├── set_oft_config.rs   # Admin: update OFT config
│   │   │   │   ├── set_peer_config.rs  # Admin: set peer config
│   │   │   │   ├── set_pause.rs        # Admin: pause/unpause
│   │   │   │   └── withdraw_fee.rs     # Admin: withdraw fees
│   │   │   ├── state/          # Account data structures
│   │   │   │   ├── oft.rs      # OFT Store state
│   │   │   │   └── peer_config.rs # Peer config state
│   │   │   ├── msg_codec.rs    # Cross-chain message encoding/decoding
│   │   │   ├── compose_msg_codec.rs # Compose message codec
│   │   │   ├── errors.rs       # Custom error definitions
│   │   │   └── events.rs       # Event definitions
│   │   ├── Cargo.toml          # Program dependencies
│   │   ├── build.rs            # Build script
│   │   └── tests/              # Unit tests
│   └── endpoint-mock/          # Mock endpoint for testing
│
├── contracts/                  # EVM contracts (Solidity)
│   ├── MyOFT.sol               # EVM OFT contract
│   └── mocks/                  # Mock contracts for testing
│
├── deploy/                     # Hardhat deploy scripts
│   └── MyOFT.ts                # EVM OFT deployment script
│
├── tasks/                      # Hardhat tasks (CLI commands)
│   ├── solana/
│   │   ├── createOFT.ts        # Create Solana OFT Store
│   │   ├── createOFTAdapter.ts # Create OFT Adapter
│   │   ├── initConfig.ts       # Init Solana config accounts
│   │   ├── sendSolana.ts       # Send from Solana
│   │   ├── debug.ts            # Debug OFT state
│   │   └── ...                 # Rate limits, metadata, etc.
│   ├── common/
│   │   ├── sendOFT.ts          # Unified send task
│   │   ├── wire.ts             # Wiring helper
│   │   └── ...
│   └── evm/
│       └── sendEvm.ts          # Send from EVM
│
└── test/                       # Tests
    ├── hardhat/                # Hardhat/EVM tests
    └── foundry/                # Foundry tests
```

---

## 4. Environment Setup

### Step 4.1: Create your `.env` file

```bash
cp .env.example .env
```

### Step 4.2: Set up Solana wallet

Generate a new Solana keypair (or use your existing one):

```bash
# Generate a new keypair (saved to ~/.config/solana/id.json by default)
solana-keygen new

# Or use an existing keypair - set in .env:
# SOLANA_KEYPAIR_PATH=/path/to/your/keypair.json
```

Alternatively, set a private key directly in `.env`:

```bash
# Base58 format
SOLANA_PRIVATE_KEY=your_base58_private_key_here
```

### Step 4.3: Fund your Solana wallet

For **devnet** deployment:

```bash
# Request 5 SOL from the devnet faucet
solana airdrop 5 -u devnet

# Or visit: https://faucet.solana.com/
```

For **mainnet**, you'll need real SOL from an exchange.

### Step 4.4: Set up EVM wallet

In your `.env` file, set either:

```bash
# Option A: Mnemonic (12 or 24 words)
MNEMONIC="your twelve word mnemonic phrase goes here test test test junk"

# Option B: Private key (with 0x prefix)
PRIVATE_KEY=0xYourPrivateKeyHere
```

### Step 4.5: Fund your EVM wallet

For **Arbitrum Sepolia** (testnet):
- Get Sepolia ETH from a faucet: https://sepoliafaucet.com/
- Bridge to Arbitrum Sepolia: https://bridge.arbitrum.io/

### Step 4.6: Set RPC URLs (Optional)

If you want to use custom RPC endpoints:

```bash
RPC_URL_SOLANA_TESTNET=https://api.devnet.solana.com
RPC_URL_ARB_SEPOLIA=https://arbitrum-sepolia.gateway.tenderly.co
```

---

## 5. Generate Program Keypair

Every Solana program needs a unique keypair that determines its **Program ID** (address on-chain).

### Step 5.1: Generate the keypair

```bash
anchor keys sync -p oft
```

This will:
- Generate a keypair at `target/deploy/oft-keypair.json` (if it doesn't exist)
- Automatically update `Anchor.toml` with the new program ID

### Step 5.2: View your Program ID

```bash
anchor keys list
```

Output:
```
oft: <YOUR_OFT_PROGRAM_ID>
```

**Save this Program ID** - you'll need it in subsequent steps.

### Why deploy your own program?

Because every Solana Program has an **Upgrade Authority**, and this authority can change or modify the implementation of all child accounts. By deploying your own OFT Program, **you control the Upgrade Authority** of your token's program.

---

## 6. Build the Solana OFT Program

### Step 6.1: Verifiable Build (Recommended)

Verifiable builds ensure your deployed program matches the source code. **Requires Docker.**

```bash
# Make sure Docker is running, then:
anchor build -v -e OFT_ID=<YOUR_OFT_PROGRAM_ID>
```

Replace `<YOUR_OFT_PROGRAM_ID>` with the Program ID from Step 5.2.

The compiled program binary will be at: `target/verifiable/oft.so`

### Step 6.2: Regular Build (Alternative)

If Docker is not available:

```bash
anchor build -- --features "no-idl"
```

The binary will be at: `target/deploy/oft.so`

### What happens during build?

1. The Rust compiler compiles the OFT program code in `programs/oft/src/`
2. The `OFT_ID` environment variable is embedded into the program binary
3. The program is compiled as a Solana BPF (Berkeley Packet Filter) binary
4. The output `.so` file is ready for deployment

---

## 7. Deploy to Solana Devnet

### Step 7.1: Configure Solana CLI for devnet

```bash
solana config set --url devnet
```

### Step 7.2: Check your balance

```bash
solana balance -u devnet
```

Make sure you have at least **4 SOL** for deployment.

### Step 7.3: Deploy the program

```bash
solana program deploy \
  --program-id target/deploy/oft-keypair.json \
  target/verifiable/oft.so \
  -u devnet \
  --with-compute-unit-price 100000
```

**Parameters explained:**
- `--program-id`: Uses your generated keypair so the program gets your chosen address
- `target/verifiable/oft.so`: The compiled program binary
- `-u devnet`: Deploy to devnet (use `mainnet-beta` for production)
- `--with-compute-unit-price`: Priority fee in micro-lamports (increase if deployment is slow)

### Step 7.4: Verify deployment

```bash
solana program show <YOUR_OFT_PROGRAM_ID> -u devnet
```

You should see program details including the Upgrade Authority (your wallet).

### Step 7.5: (Optional) Verify the program

Install `solana-verify` and verify your program matches the source:

```bash
# Install solana-verify
cargo install solana-verify

# Verify against LayerZero's devtools repo
solana-verify verify-from-repo \
  --program-id <YOUR_OFT_PROGRAM_ID> \
  https://github.com/LayerZero-Labs/devtools \
  --mount-path examples/oft-solana \
  --library-name oft \
  -u devnet \
  --commit-hash <COMMIT_HASH>
```

---

## 8. Create the OFT Store (Mint Token)

The OFT Store is a PDA account that holds your token's cross-chain configuration. This step also creates the SPL Token Mint.

### Step 8.1: Create OFT with initial supply

```bash
pnpm hardhat lz:oft:solana:create \
  --eid 40168 \
  --program-id <YOUR_OFT_PROGRAM_ID> \
  --only-oft-store true \
  --amount 100000000000
```

**Parameters explained:**
- `--eid 40168`: Solana Devnet endpoint ID (use `30168` for mainnet)
- `--program-id`: Your deployed OFT program ID
- `--only-oft-store true`: OFT Store is the sole Mint Authority (no additional minters)
- `--amount 100000000000`: Initial supply = 100 tokens (with 9 decimals)

### Step 8.2: What gets created

The command creates these on-chain accounts:

| Account | Description |
|---------|-------------|
| **Token Mint** | SPL Token mint for your OFT |
| **OFT Store** | PDA storing cross-chain config |
| **Token Account** | Your initial token balance |
| **Metadata** | Token metadata (name, symbol, URI) |

### Step 8.3: Save the OFT Store address

The command outputs an **OFT Store address**. You need this for `layerzero.config.ts`.

### Step 8.4: Customize your token (optional parameters)

```bash
pnpm hardhat lz:oft:solana:create \
  --eid 40168 \
  --program-id <YOUR_OFT_PROGRAM_ID> \
  --only-oft-store true \
  --amount 1000000000000000 \
  --name "My Token" \
  --symbol "MTK" \
  --local-decimals 9 \
  --shared-decimals 6 \
  --uri "https://arweave.net/your-metadata-json" \
  --token-metadata-is-mutable true
```

**Token parameter details:**
- `--name`: Token name displayed in wallets (default: "MockOFT")
- `--symbol`: Token ticker symbol (default: "MOFT")
- `--local-decimals`: Decimal places on Solana (default: 9)
- `--shared-decimals`: Cross-chain decimal precision (default: 6). Must be <= local-decimals
- `--uri`: Link to off-chain metadata JSON
- `--amount`: Raw token amount (e.g., 1000000000 = 1 token with 9 decimals)

### Step 8.5: Update layerzero.config.ts

The OFT Store address is automatically saved to `.layerzero` directory. The config reads it via the `getOftStoreAddress()` helper. Verify it's correct:

```bash
pnpm hardhat lz:oft:solana:debug --eid 40168
```

---

## 9. Deploy EVM OFT Peer (Arbitrum Sepolia)

The EVM side uses a standard Solidity OFT contract (`contracts/MyOFT.sol`).

### Step 9.1: (Optional) Enable test minting

For testnet, edit `contracts/MyOFT.sol` and uncomment line 15:

```solidity
constructor(
    string memory _name,
    string memory _symbol,
    address _lzEndpoint,
    address _delegate
) OFT(_name, _symbol, _lzEndpoint, _delegate) Ownable(_delegate) {
    // Uncomment for testnet:
    _mint(msg.sender, 100000 * (10 ** 18));
}
```

> **Warning:** Remove this line before mainnet deployment!

### Step 9.2: Deploy to Arbitrum Sepolia

```bash
pnpm hardhat lz:deploy
```

Follow the interactive prompts:
1. Select `arbitrum-sepolia` as the network
2. Confirm the deployment

The contract address will be saved automatically by hardhat-deploy.

### Step 9.3: Verify deployment

The deployment details are saved in `deployments/arbitrum-sepolia/MyOFT.json`.

---

## 10. Wire the Contracts Together

"Wiring" connects your Solana OFT and EVM OFT so they can communicate through LayerZero.

### Step 10.1: Initialize Solana config accounts

This creates necessary on-chain config accounts for the Solana endpoint:

```bash
npx hardhat lz:oft:solana:init-config --oapp-config layerzero.config.ts
```

> **Important:** Run this every time you add a new cross-chain pathway involving Solana.

### Step 10.2: Wire the contracts

```bash
pnpm hardhat lz:oapp:wire --oapp-config layerzero.config.ts
```

This command:
1. Sets **peers** on both contracts (tells each contract about its counterpart)
2. Configures **enforced options** (gas limits and values for cross-chain messages)
3. Sets up **DVN (Decentralized Verifier Network)** configuration
4. Configures **Send/Receive libraries**

### Step 10.3: Understanding `layerzero.config.ts`

The configuration file defines:

```typescript
// The EVM contract (loaded by hardhat-deploy)
const arbitrumContract: OmniPointHardhat = {
    eid: EndpointId.ARBSEP_V2_TESTNET,  // 40231
    contractName: 'MyOFT',
}

// The Solana contract (uses OFT Store address)
const solanaContract: OmniPointHardhat = {
    eid: EndpointId.SOLANA_V2_TESTNET,   // 40168
    address: getOftStoreAddress(EndpointId.SOLANA_V2_TESTNET),
}
```

**Enforced Options** control gas allocation:

```typescript
// For messages TO Solana:
{
    msgType: 1,
    optionType: ExecutorOptionType.LZ_RECEIVE,
    gas: 200000,                    // Compute Units for lz_receive
    value: 2039280,                 // Lamports for token account rent
}

// For messages TO EVM:
{
    msgType: 1,
    optionType: ExecutorOptionType.LZ_RECEIVE,
    gas: 80000,                     // Gas for lz_receive on EVM
    value: 0,
}
```

The `value: 2039280` is the **exact rent** needed for an SPL Token account (0.00203928 SOL).

---

## 11. Send Tokens Cross-Chain

### Send from Solana to Arbitrum Sepolia

```bash
npx hardhat lz:oft:send \
  --src-eid 40168 \
  --dst-eid 40231 \
  --to 0xYourEVMAddress \
  --amount 1
```

### Send from Arbitrum Sepolia to Solana

```bash
npx hardhat lz:oft:send \
  --src-eid 40231 \
  --dst-eid 40168 \
  --to YourSolanaPublicKey \
  --amount 1
```

### Track your message

After sending, the script provides a **LayerZero Scan** link:
```
https://testnet.layerzeroscan.com/tx/<TRANSACTION_HASH>
```

You can monitor the message status:
- **Inflight**: Message sent, waiting for DVN verification
- **Verifying**: DVNs are verifying the message
- **Delivered**: Message received and executed on destination chain

---

## 12. Advanced Configuration

### 12.1: OFT Implementation Types

| Type | Mechanism | When to Use |
|------|-----------|-------------|
| **OFT** | Burn & Mint | New tokens (no existing token) |
| **OFT MABA** | Burn & Mint | Existing token, can transfer Mint Authority |
| **OFT Adapter** | Lock & Unlock | Existing token, cannot transfer Mint Authority |

#### Creating an OFT MABA (Mint-And-Burn Adapter)

For existing tokens where you **can** transfer Mint Authority:

```bash
pnpm hardhat lz:oft:solana:create \
  --eid 40168 \
  --program-id <PROGRAM_ID> \
  --mint <EXISTING_TOKEN_MINT> \
  --token-program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
```

Then transfer Mint Authority to the OFT Store.

#### Creating an OFT Adapter

For existing tokens where you **cannot** transfer Mint Authority:

```bash
pnpm hardhat lz:oft-adapter:solana:create \
  --eid 40168 \
  --program-id <PROGRAM_ID> \
  --mint <EXISTING_TOKEN_MINT> \
  --token-program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
```

### 12.2: Additional Minters

If you need to mint tokens outside of cross-chain transfers:

```bash
pnpm hardhat lz:oft:solana:create \
  --eid 40168 \
  --program-id <PROGRAM_ID> \
  --additional-minters <ADDRESS1>,<ADDRESS2> \
  --amount 100000000000
```

### 12.3: Rate Limiting

Set outbound rate limits:
```bash
pnpm hardhat lz:oft:solana:set-outbound-rate-limit \
  --eid 40168 \
  --program-id <PROGRAM_ID> \
  --limit 1000000000 \
  --window 3600
```

Set inbound rate limits:
```bash
pnpm hardhat lz:oft:solana:set-inbound-rate-limit \
  --eid 40168 \
  --program-id <PROGRAM_ID> \
  --limit 1000000000 \
  --window 3600
```

### 12.4: Multisig Wallet (Production)

For production, use a **Squads multisig** on Solana:

```bash
pnpm hardhat lz:oapp:wire \
  --oapp-config layerzero.config.ts \
  --multisig-key <SQUADS_MULTISIG_ACCOUNT>
```

### 12.5: Adding More Chains

1. Add chain config to `hardhat.config.ts`:
```typescript
networks: {
    'base-sepolia': {
        eid: EndpointId.BASESEP_V2_TESTNET,
        url: 'https://sepolia.base.org',
        accounts,
    },
}
```

2. Deploy OFT on the new chain:
```bash
pnpm hardhat lz:deploy
```

3. Update `layerzero.config.ts` with new connections

4. Re-run init-config and wire:
```bash
npx hardhat lz:oft:solana:init-config --oapp-config layerzero.config.ts
pnpm hardhat lz:oapp:wire --oapp-config layerzero.config.ts
```

---

## 13. Troubleshooting

### Common Issues

#### Build fails with version errors
Ensure exact versions:
```bash
rustup default 1.84.1
solana --version  # Should be 2.2.20
anchor --version  # Should be 0.31.1
```

#### Deployment fails - insufficient funds
```bash
solana airdrop 5 -u devnet
# If rate limited, use https://faucet.solana.com/
```

#### Deployment is slow
Increase the priority fee:
```bash
solana program deploy \
  --program-id target/deploy/oft-keypair.json \
  target/verifiable/oft.so \
  -u devnet \
  --with-compute-unit-price 500000
```

#### "Account already in use" error
Your program ID is already deployed. Either:
- Use the existing deployment, or
- Generate a new keypair: `solana-keygen new -o target/deploy/oft-keypair.json`

#### Wiring fails
Make sure you ran `init-config` before `wire`:
```bash
npx hardhat lz:oft:solana:init-config --oapp-config layerzero.config.ts
```

#### Cross-chain message stuck
Debug the OFT state:
```bash
pnpm hardhat lz:oft:solana:debug --eid 40168
```

Check LayerZero Scan for message status:
- Testnet: https://testnet.layerzeroscan.com/
- Mainnet: https://layerzeroscan.com/

### Useful Commands

```bash
# Debug OFT state
pnpm hardhat lz:oft:solana:debug --eid <SOLANA_EID>

# View all available tasks
npx hardhat --help

# Run tests
pnpm test

# Clean build artifacts
pnpm clean
```

---

## Production Deployment Checklist

Before deploying to mainnet:

- [ ] Remove test mint line from `contracts/MyOFT.sol`
- [ ] Use `--eid 30168` (Solana Mainnet) instead of `40168`
- [ ] Use `mainnet-beta` for Solana CLI commands
- [ ] Profile gas usage for `lzReceive` on all destination chains
- [ ] Set up multisig wallets (Squads on Solana, Safe on EVM)
- [ ] Configure rate limits
- [ ] Review [LayerZero Security Stack](https://docs.layerzero.network/v2/home/protocol/security-stack)
- [ ] Test thoroughly on testnets first
- [ ] Verify your program on-chain with `solana-verify`
- [ ] Audit your custom modifications (if any)

---

## Quick Reference: Endpoint IDs

| Chain | Testnet EID | Mainnet EID |
|-------|------------|-------------|
| Solana | 40168 | 30168 |
| Ethereum | 40161 | 30161 |
| Arbitrum | 40231 | 30110 |
| Base | 40245 | 30184 |
| Optimism | 40232 | 30111 |
| Polygon | 40267 | 30109 |
| Avalanche | 40206 | 30106 |
| BSC | 40202 | 30102 |

Full list: https://docs.layerzero.network/v2/developers/evm/technical-reference/deployed-contracts

---

## Resources

- [LayerZero V2 Docs](https://docs.layerzero.network/v2)
- [LayerZero Solana Getting Started](https://docs.layerzero.network/v2/developers/solana/getting-started)
- [OFT Program Docs](https://docs.layerzero.network/v2/developers/solana/oft/program)
- [OFT SDK Docs](https://docs.layerzero.network/v2/developers/solana/oft/sdk)
- [LayerZero Scan (Testnet)](https://testnet.layerzeroscan.com/)
- [LayerZero Scan (Mainnet)](https://layerzeroscan.com/)
- [Official GitHub Example](https://github.com/LayerZero-Labs/devtools/tree/main/examples/oft-solana)
