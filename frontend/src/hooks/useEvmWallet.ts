"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CHAINS } from "@/lib/constants";

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}

export function useEvmWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const baseSepolia = CHAINS["base-sepolia"];

  const updateAccount = useCallback(async (ethereum: NonNullable<Window["ethereum"]>) => {
    try {
      const browserProvider = new ethers.BrowserProvider(ethereum as ethers.Eip1193Provider);
      const accounts = await browserProvider.listAccounts();
      if (accounts.length > 0) {
        const signerInstance = await browserProvider.getSigner();
        setProvider(browserProvider);
        setSigner(signerInstance);
        setAddress(await signerInstance.getAddress());
        const network = await browserProvider.getNetwork();
        setChainId(Number(network.chainId));
      }
    } catch (e) {
      console.error("Failed to update EVM account:", e);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      updateAccount(window.ethereum);

      const handleAccountsChanged = () => updateAccount(window.ethereum!);
      const handleChainChanged = () => {
        updateAccount(window.ethereum!);
      };

      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum?.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [updateAccount]);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      window.open("https://metamask.io/download/", "_blank");
      return;
    }
    setIsConnecting(true);
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      await updateAccount(window.ethereum);
    } catch (e) {
      console.error("Failed to connect EVM wallet:", e);
    } finally {
      setIsConnecting(false);
    }
  }, [updateAccount]);

  const switchToBaseSepolia = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x" + baseSepolia.chainId.toString(16) }],
      });
    } catch (switchError: unknown) {
      const err = switchError as { code?: number };
      if (err.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x" + baseSepolia.chainId.toString(16),
              chainName: baseSepolia.name,
              rpcUrls: [baseSepolia.rpcUrl],
              blockExplorerUrls: [baseSepolia.explorerUrl],
              nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            },
          ],
        });
      }
    }
  }, [baseSepolia]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
  }, []);

  const isCorrectChain = chainId === baseSepolia.chainId;

  return {
    address,
    provider,
    signer,
    chainId,
    isConnecting,
    isCorrectChain,
    connect,
    disconnect,
    switchToBaseSepolia,
  };
}
