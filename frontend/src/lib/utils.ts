import { ethers } from "ethers";

/**
 * Format a token amount from raw units to human-readable
 */
export function formatTokenAmount(
  amount: bigint | string,
  decimals: number,
  displayDecimals: number = 4
): string {
  const formatted = ethers.formatUnits(amount.toString(), decimals);
  const num = parseFloat(formatted);
  if (num === 0) return "0";
  if (num < 0.0001) return "< 0.0001";
  return num.toFixed(displayDecimals);
}

/**
 * Parse a human-readable amount to raw units
 */
export function parseTokenAmount(amount: string, decimals: number): bigint {
  return ethers.parseUnits(amount, decimals);
}

/**
 * Convert an address to bytes32 (for LayerZero peer addressing)
 */
export function addressToBytes32(address: string): string {
  // Pad EVM address (20 bytes) to 32 bytes
  if (address.startsWith("0x")) {
    return ethers.zeroPadValue(address, 32);
  }
  // For Solana, convert base58 to bytes32
  return address;
}

/**
 * Truncate an address for display
 */
export function truncateAddress(address: string, chars: number = 4): string {
  if (!address) return "";
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Convert Solana public key to bytes32 hex for LayerZero
 */
export function solanaAddressToBytes32(base58Address: string): string {
  // We need to decode base58 to get 32 bytes, then hex encode
  const bs58Chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let result = BigInt(0);
  for (const char of base58Address) {
    result = result * BigInt(58) + BigInt(bs58Chars.indexOf(char));
  }
  const hex = result.toString(16).padStart(64, "0");
  return "0x" + hex;
}
