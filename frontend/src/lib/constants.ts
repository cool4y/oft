// ============================================================
// UPDATE THESE VALUES AFTER DEPLOYMENT
// ============================================================

// Solana OFT Program ID (from `anchor keys list`)
export const SOLANA_OFT_PROGRAM_ID = "YOUR_SOLANA_OFT_PROGRAM_ID";

// Solana OFT Store address (from `lz:oft:solana:create` output)
export const SOLANA_OFT_STORE = "YOUR_SOLANA_OFT_STORE_ADDRESS";

// Solana Token Mint address (from `lz:oft:solana:create` output)
export const SOLANA_TOKEN_MINT = "YOUR_SOLANA_TOKEN_MINT";

// Base Sepolia MyOFT contract address (from `lz:deploy` output)
export const BASE_SEPOLIA_OFT_ADDRESS = "YOUR_BASE_SEPOLIA_OFT_ADDRESS";

// ============================================================
// LayerZero Endpoint IDs (do not change)
// ============================================================
export const SOLANA_DEVNET_EID = 40168;
export const BASE_SEPOLIA_EID = 40245;

// ============================================================
// Chain Configuration
// ============================================================
export const CHAINS = {
  "solana-devnet": {
    name: "Solana Devnet",
    eid: SOLANA_DEVNET_EID,
    rpcUrl: "https://api.devnet.solana.com",
    explorerUrl: "https://explorer.solana.com",
    explorerSuffix: "?cluster=devnet",
    type: "solana" as const,
    decimals: 9,
    icon: "/solana.svg",
  },
  "base-sepolia": {
    name: "Base Sepolia",
    eid: BASE_SEPOLIA_EID,
    rpcUrl: "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
    chainId: 84532,
    type: "evm" as const,
    decimals: 18,
    icon: "/base.svg",
  },
} as const;

export type ChainKey = keyof typeof CHAINS;

// LayerZero Scan
export const LZ_SCAN_TESTNET = "https://testnet.layerzeroscan.com";

// EVM OFT ABI (minimal - only functions we need)
export const OFT_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function quoteSend((uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes extraOptions, bytes composeMsg, bytes oftCmd) sendParam, bool payInLzToken) view returns ((uint256 nativeFee, uint256 lzTokenFee) messagingFee)",
  "function send((uint32 dstEid, bytes32 to, uint256 amountLD, uint256 minAmountLD, bytes extraOptions, bytes composeMsg, bytes oftCmd) sendParam, (uint256 nativeFee, uint256 lzTokenFee) fee, address refundAddress) payable returns ((bytes32 guid, uint64 nonce, uint256 fee) receipt, (uint256 amountSentLD, uint256 amountReceivedLD) oftReceipt)",
];
