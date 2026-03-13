"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token";
import {
  CHAINS,
  BASE_SEPOLIA_OFT_ADDRESS,
  SOLANA_TOKEN_MINT,
  OFT_ABI,
} from "@/lib/constants";

interface TokenBalances {
  solana: string;
  baseSepolia: string;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useTokenBalances(
  solanaAddress: string | null,
  evmAddress: string | null
): TokenBalances {
  const [solana, setSolana] = useState("0");
  const [baseSepolia, setBaseSepolia] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalances = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch Solana balance
      if (solanaAddress && SOLANA_TOKEN_MINT !== "YOUR_SOLANA_TOKEN_MINT") {
        try {
          const connection = new Connection(CHAINS["solana-devnet"].rpcUrl, "confirmed");
          const mint = new PublicKey(SOLANA_TOKEN_MINT);
          const owner = new PublicKey(solanaAddress);
          const ata = await getAssociatedTokenAddress(mint, owner);
          const account = await getAccount(connection, ata);
          setSolana(account.amount.toString());
        } catch {
          setSolana("0");
        }
      }

      // Fetch Base Sepolia balance
      if (evmAddress && BASE_SEPOLIA_OFT_ADDRESS !== "YOUR_BASE_SEPOLIA_OFT_ADDRESS") {
        try {
          const provider = new ethers.JsonRpcProvider(CHAINS["base-sepolia"].rpcUrl);
          const contract = new ethers.Contract(BASE_SEPOLIA_OFT_ADDRESS, OFT_ABI, provider);
          const balance = await contract.balanceOf(evmAddress);
          setBaseSepolia(balance.toString());
        } catch {
          setBaseSepolia("0");
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch balances");
    } finally {
      setIsLoading(false);
    }
  }, [solanaAddress, evmAddress]);

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 15000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  return { solana, baseSepolia, isLoading, error, refresh: fetchBalances };
}
