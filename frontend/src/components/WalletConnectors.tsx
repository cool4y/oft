"use client";

import { truncateAddress } from "@/lib/utils";

interface WalletConnectorsProps {
  solanaAddress: string | null;
  evmAddress: string | null;
  isEvmCorrectChain: boolean;
  onConnectSolana: () => void;
  onDisconnectSolana: () => void;
  onConnectEvm: () => void;
  onDisconnectEvm: () => void;
  onSwitchChain: () => void;
  isEvmConnecting: boolean;
  isSolanaConnecting: boolean;
}

export default function WalletConnectors({
  solanaAddress,
  evmAddress,
  isEvmCorrectChain,
  onConnectSolana,
  onDisconnectSolana,
  onConnectEvm,
  onDisconnectEvm,
  onSwitchChain,
  isEvmConnecting,
  isSolanaConnecting,
}: WalletConnectorsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {/* Solana Wallet */}
      <div className="gradient-border rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-green-400 flex items-center justify-center text-sm font-bold">
            S
          </div>
          <div>
            <h3 className="font-semibold text-white">Solana Devnet</h3>
            <p className="text-xs text-gray-400">Phantom Wallet</p>
          </div>
        </div>

        {solanaAddress ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-sm text-gray-300 font-mono">
                {truncateAddress(solanaAddress, 6)}
              </span>
            </div>
            <button
              onClick={onDisconnectSolana}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={onConnectSolana}
            disabled={isSolanaConnecting}
            className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-green-500 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSolanaConnecting ? "Connecting..." : "Connect Phantom"}
          </button>
        )}
      </div>

      {/* EVM Wallet */}
      <div className="gradient-border rounded-xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-sm font-bold">
            B
          </div>
          <div>
            <h3 className="font-semibold text-white">Base Sepolia</h3>
            <p className="text-xs text-gray-400">MetaMask / EVM Wallet</p>
          </div>
        </div>

        {evmAddress ? (
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${isEvmCorrectChain ? "bg-green-400" : "bg-yellow-400"}`}
                ></div>
                <span className="text-sm text-gray-300 font-mono">
                  {truncateAddress(evmAddress)}
                </span>
              </div>
              <button
                onClick={onDisconnectEvm}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors"
              >
                Disconnect
              </button>
            </div>
            {!isEvmCorrectChain && (
              <button
                onClick={onSwitchChain}
                className="w-full mt-3 py-2 px-4 rounded-lg bg-yellow-600/20 border border-yellow-600/30 text-yellow-400 text-xs hover:bg-yellow-600/30 transition-colors"
              >
                Switch to Base Sepolia
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={onConnectEvm}
            disabled={isEvmConnecting}
            className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-blue-600 to-blue-800 text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isEvmConnecting ? "Connecting..." : "Connect MetaMask"}
          </button>
        )}
      </div>
    </div>
  );
}
