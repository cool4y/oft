"use client";

import { formatTokenAmount } from "@/lib/utils";
import { CHAINS } from "@/lib/constants";

interface TokenBalancesProps {
  solanaBalance: string;
  baseSepoliaBalance: string;
  isLoading: boolean;
  onRefresh: () => void;
}

export default function TokenBalances({
  solanaBalance,
  baseSepoliaBalance,
  isLoading,
  onRefresh,
}: TokenBalancesProps) {
  return (
    <div className="gradient-border rounded-xl p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">Token Balances</h3>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-black/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-green-400 flex items-center justify-center text-[10px] font-bold">
              S
            </div>
            <span className="text-sm text-gray-400">Solana Devnet</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatTokenAmount(solanaBalance, CHAINS["solana-devnet"].decimals)}
          </p>
          <p className="text-xs text-gray-500 mt-1">OFT Tokens</p>
        </div>

        <div className="bg-black/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-[10px] font-bold">
              B
            </div>
            <span className="text-sm text-gray-400">Base Sepolia</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {formatTokenAmount(baseSepoliaBalance, CHAINS["base-sepolia"].decimals)}
          </p>
          <p className="text-xs text-gray-500 mt-1">OFT Tokens</p>
        </div>
      </div>
    </div>
  );
}
