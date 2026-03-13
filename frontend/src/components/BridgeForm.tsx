"use client";

import { useState } from "react";
import { ChainKey, CHAINS, LZ_SCAN_TESTNET } from "@/lib/constants";

interface BridgeFormProps {
  solanaAddress: string | null;
  evmAddress: string | null;
  isEvmCorrectChain: boolean;
  isQuoting: boolean;
  isSending: boolean;
  quote: { nativeFee: string; lzTokenFee: string } | null;
  txHash: string | null;
  lzScanUrl: string | null;
  error: string | null;
  onGetQuote: (
    source: ChainKey,
    dest: ChainKey,
    amount: string,
    recipient: string
  ) => void;
  onSend: (
    source: ChainKey,
    dest: ChainKey,
    amount: string,
    recipient: string
  ) => void;
  onReset: () => void;
}

export default function BridgeForm({
  solanaAddress,
  evmAddress,
  isEvmCorrectChain,
  isQuoting,
  isSending,
  quote,
  txHash,
  lzScanUrl,
  error,
  onGetQuote,
  onSend,
  onReset,
}: BridgeFormProps) {
  const [sourceChain, setSourceChain] = useState<ChainKey>("base-sepolia");
  const [destChain, setDestChain] = useState<ChainKey>("solana-devnet");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");

  const swapChains = () => {
    setSourceChain(destChain);
    setDestChain(sourceChain);
    setRecipient("");
    onReset();
  };

  const handleGetQuote = () => {
    const recipientAddr =
      recipient ||
      (destChain === "solana-devnet" ? solanaAddress : evmAddress) ||
      "";
    if (!recipientAddr || !amount) return;
    onGetQuote(sourceChain, destChain, amount, recipientAddr);
  };

  const handleSend = () => {
    const recipientAddr =
      recipient ||
      (destChain === "solana-devnet" ? solanaAddress : evmAddress) ||
      "";
    if (!recipientAddr || !amount) return;
    onSend(sourceChain, destChain, amount, recipientAddr);
  };

  const isSourceWalletConnected =
    sourceChain === "solana-devnet" ? !!solanaAddress : !!evmAddress;
  const isReady =
    isSourceWalletConnected &&
    (sourceChain !== "base-sepolia" || isEvmCorrectChain) &&
    amount &&
    parseFloat(amount) > 0;

  const effectiveRecipient =
    recipient ||
    (destChain === "solana-devnet" ? solanaAddress : evmAddress) ||
    "";

  // Success state
  if (txHash) {
    return (
      <div className="gradient-border rounded-xl p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            Transaction Sent!
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Your cross-chain transfer has been initiated.
          </p>

          <div className="bg-black/30 rounded-lg p-4 mb-4 text-left">
            <p className="text-xs text-gray-500 mb-1">Transaction Hash</p>
            <p className="text-xs font-mono text-gray-300 break-all">{txHash}</p>
          </div>

          {lzScanUrl && (
            <a
              href={lzScanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 py-2.5 px-5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 transition-colors mb-3"
            >
              Track on LayerZero Scan
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}

          <button
            onClick={() => {
              onReset();
              setAmount("");
              setRecipient("");
            }}
            className="block mx-auto text-sm text-gray-400 hover:text-white transition-colors mt-2"
          >
            Send Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-border rounded-xl p-6">
      <h3 className="font-semibold text-white mb-5 text-lg">Bridge Tokens</h3>

      {/* Source Chain */}
      <div className="mb-4">
        <label className="block text-xs text-gray-400 mb-2">From</label>
        <div className="bg-black/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  sourceChain === "solana-devnet"
                    ? "bg-gradient-to-br from-purple-500 to-green-400"
                    : "bg-gradient-to-br from-blue-500 to-blue-700"
                }`}
              >
                {sourceChain === "solana-devnet" ? "S" : "B"}
              </div>
              <span className="text-sm font-medium text-white">
                {CHAINS[sourceChain].name}
              </span>
            </div>
            {!isSourceWalletConnected && (
              <span className="text-xs text-red-400">Wallet not connected</span>
            )}
          </div>
          <input
            type="number"
            placeholder="0.0"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              onReset();
            }}
            className="w-full bg-transparent text-2xl font-bold text-white outline-none placeholder-gray-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>

      {/* Swap Button */}
      <div className="flex justify-center -my-2 relative z-10">
        <button
          onClick={swapChains}
          className="w-10 h-10 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center hover:bg-gray-700 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* Destination Chain */}
      <div className="mb-4">
        <label className="block text-xs text-gray-400 mb-2">To</label>
        <div className="bg-black/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                destChain === "solana-devnet"
                  ? "bg-gradient-to-br from-purple-500 to-green-400"
                  : "bg-gradient-to-br from-blue-500 to-blue-700"
              }`}
            >
              {destChain === "solana-devnet" ? "S" : "B"}
            </div>
            <span className="text-sm font-medium text-white">
              {CHAINS[destChain].name}
            </span>
          </div>

          <input
            type="text"
            placeholder={
              destChain === "solana-devnet"
                ? solanaAddress || "Solana address (base58)"
                : evmAddress || "EVM address (0x...)"
            }
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            className="w-full bg-transparent text-sm text-gray-300 outline-none placeholder-gray-600 font-mono"
          />
          {effectiveRecipient && !recipient && (
            <p className="text-xs text-gray-500 mt-1">
              Using connected wallet address
            </p>
          )}
        </div>
      </div>

      {/* Quote Display */}
      {quote && (
        <div className="bg-black/30 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Estimated Fee</span>
            <span className="text-sm text-white font-mono">
              {parseFloat(quote.nativeFee).toFixed(6)} ETH
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-800/30 rounded-lg p-3 mb-4">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleGetQuote}
          disabled={!isReady || isQuoting}
          className="flex-1 py-3 px-4 rounded-lg bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isQuoting ? "Quoting..." : "Get Quote"}
        </button>

        <button
          onClick={handleSend}
          disabled={!isReady || isSending}
          className="flex-1 py-3 px-4 rounded-lg bg-gradient-to-r from-brand-600 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSending ? "Sending..." : "Send"}
        </button>
      </div>

      {sourceChain === "solana-devnet" && (
        <p className="text-xs text-yellow-500/80 mt-3 text-center">
          Solana -{">"} EVM sending requires a Solana wallet transaction.
          Use the CLI command for now: npx hardhat lz:oft:send --src-eid 40168 --dst-eid 40245
        </p>
      )}
    </div>
  );
}
