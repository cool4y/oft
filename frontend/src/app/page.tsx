"use client";

import { useState, useCallback } from "react";
import Header from "@/components/Header";
import WalletConnectors from "@/components/WalletConnectors";
import TokenBalances from "@/components/TokenBalances";
import BridgeForm from "@/components/BridgeForm";
import { useEvmWallet } from "@/hooks/useEvmWallet";
import { useTokenBalances } from "@/hooks/useTokenBalances";
import { useCrossChainSend } from "@/hooks/useCrossChainSend";

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: { toBase58: () => string } }>;
      disconnect: () => Promise<void>;
      publicKey?: { toBase58: () => string };
    };
  }
}

export default function Home() {
  // Solana wallet state
  const [solanaAddress, setSolanaAddress] = useState<string | null>(null);
  const [isSolanaConnecting, setIsSolanaConnecting] = useState(false);

  // EVM wallet
  const {
    address: evmAddress,
    signer,
    isConnecting: isEvmConnecting,
    isCorrectChain: isEvmCorrectChain,
    connect: connectEvm,
    disconnect: disconnectEvm,
    switchToBaseSepolia,
  } = useEvmWallet();

  // Token balances
  const balances = useTokenBalances(solanaAddress, evmAddress);

  // Cross-chain send
  const crossChainSend = useCrossChainSend(signer);

  // Solana wallet connect/disconnect
  const connectSolana = useCallback(async () => {
    if (typeof window === "undefined") return;
    const phantom = window.solana;
    if (!phantom?.isPhantom) {
      window.open("https://phantom.app/", "_blank");
      return;
    }
    setIsSolanaConnecting(true);
    try {
      const response = await phantom.connect();
      setSolanaAddress(response.publicKey.toBase58());
    } catch (e) {
      console.error("Phantom connect failed:", e);
    } finally {
      setIsSolanaConnecting(false);
    }
  }, []);

  const disconnectSolana = useCallback(async () => {
    if (window.solana) {
      await window.solana.disconnect();
    }
    setSolanaAddress(null);
  }, []);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Network Status Banner */}
        <div className="bg-blue-900/20 border border-blue-800/30 rounded-lg p-3 mb-6">
          <p className="text-xs text-blue-300 text-center">
            This bridge operates on <strong>Solana Devnet</strong> and{" "}
            <strong>Base Sepolia</strong> testnets. Tokens have no real value.
          </p>
        </div>

        {/* Wallet Connectors */}
        <WalletConnectors
          solanaAddress={solanaAddress}
          evmAddress={evmAddress}
          isEvmCorrectChain={isEvmCorrectChain}
          onConnectSolana={connectSolana}
          onDisconnectSolana={disconnectSolana}
          onConnectEvm={connectEvm}
          onDisconnectEvm={disconnectEvm}
          onSwitchChain={switchToBaseSepolia}
          isEvmConnecting={isEvmConnecting}
          isSolanaConnecting={isSolanaConnecting}
        />

        {/* Token Balances */}
        {(solanaAddress || evmAddress) && (
          <TokenBalances
            solanaBalance={balances.solana}
            baseSepoliaBalance={balances.baseSepolia}
            isLoading={balances.isLoading}
            onRefresh={balances.refresh}
          />
        )}

        {/* Bridge Form */}
        <BridgeForm
          solanaAddress={solanaAddress}
          evmAddress={evmAddress}
          isEvmCorrectChain={isEvmCorrectChain}
          isQuoting={crossChainSend.isQuoting}
          isSending={crossChainSend.isSending}
          quote={crossChainSend.quote}
          txHash={crossChainSend.txHash}
          lzScanUrl={crossChainSend.lzScanUrl}
          error={crossChainSend.error}
          onGetQuote={crossChainSend.getQuote}
          onSend={crossChainSend.send}
          onReset={crossChainSend.reset}
        />

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-600">
            Built with{" "}
            <a
              href="https://layerzero.network"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              LayerZero V2
            </a>
            {" | "}
            <a
              href="https://docs.layerzero.network/v2/developers/solana/oft/program"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              OFT Docs
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
