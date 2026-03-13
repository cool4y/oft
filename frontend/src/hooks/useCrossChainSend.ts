"use client";

import { useState, useCallback } from "react";
import { ethers } from "ethers";
import {
  CHAINS,
  BASE_SEPOLIA_OFT_ADDRESS,
  SOLANA_DEVNET_EID,
  BASE_SEPOLIA_EID,
  OFT_ABI,
  LZ_SCAN_TESTNET,
} from "@/lib/constants";
import { parseTokenAmount, solanaAddressToBytes32 } from "@/lib/utils";
import { ChainKey } from "@/lib/constants";

interface SendState {
  isQuoting: boolean;
  isSending: boolean;
  quote: { nativeFee: string; lzTokenFee: string } | null;
  txHash: string | null;
  lzScanUrl: string | null;
  error: string | null;
}

export function useCrossChainSend(
  signer: ethers.Signer | null,
) {
  const [state, setState] = useState<SendState>({
    isQuoting: false,
    isSending: false,
    quote: null,
    txHash: null,
    lzScanUrl: null,
    error: null,
  });

  const getQuote = useCallback(
    async (
      sourceChain: ChainKey,
      destChain: ChainKey,
      amount: string,
      recipientAddress: string
    ) => {
      setState((prev) => ({ ...prev, isQuoting: true, error: null, quote: null }));

      try {
        if (sourceChain === "base-sepolia" && destChain === "solana-devnet") {
          if (!signer) throw new Error("EVM wallet not connected");

          const contract = new ethers.Contract(BASE_SEPOLIA_OFT_ADDRESS, OFT_ABI, signer);
          const amountLD = parseTokenAmount(amount, CHAINS["base-sepolia"].decimals);

          // Convert Solana address to bytes32
          const toBytes32 = solanaAddressToBytes32(recipientAddress);

          const sendParam = {
            dstEid: SOLANA_DEVNET_EID,
            to: toBytes32,
            amountLD: amountLD,
            minAmountLD: (amountLD * BigInt(99)) / BigInt(100), // 1% slippage
            extraOptions: "0x",
            composeMsg: "0x",
            oftCmd: "0x",
          };

          const [nativeFee, lzTokenFee] = await contract.quoteSend(sendParam, false);

          setState((prev) => ({
            ...prev,
            isQuoting: false,
            quote: {
              nativeFee: ethers.formatEther(nativeFee),
              lzTokenFee: ethers.formatEther(lzTokenFee),
            },
          }));

          return { nativeFee, lzTokenFee };
        }

        // Solana -> EVM sending would use the Solana SDK
        throw new Error("Solana -> EVM sending via frontend requires @layerzerolabs/oft-v2-solana-sdk. Use the CLI task for now.");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Quote failed";
        setState((prev) => ({ ...prev, isQuoting: false, error: msg }));
        return null;
      }
    },
    [signer]
  );

  const send = useCallback(
    async (
      sourceChain: ChainKey,
      destChain: ChainKey,
      amount: string,
      recipientAddress: string
    ) => {
      setState((prev) => ({ ...prev, isSending: true, error: null, txHash: null, lzScanUrl: null }));

      try {
        if (sourceChain === "base-sepolia" && destChain === "solana-devnet") {
          if (!signer) throw new Error("EVM wallet not connected");

          const contract = new ethers.Contract(BASE_SEPOLIA_OFT_ADDRESS, OFT_ABI, signer);
          const amountLD = parseTokenAmount(amount, CHAINS["base-sepolia"].decimals);
          const toBytes32 = solanaAddressToBytes32(recipientAddress);

          const sendParam = {
            dstEid: SOLANA_DEVNET_EID,
            to: toBytes32,
            amountLD: amountLD,
            minAmountLD: (amountLD * BigInt(99)) / BigInt(100),
            extraOptions: "0x",
            composeMsg: "0x",
            oftCmd: "0x",
          };

          // Get quote first
          const [nativeFee, lzTokenFee] = await contract.quoteSend(sendParam, false);

          const fee = { nativeFee, lzTokenFee };
          const refundAddress = await signer.getAddress();

          const tx = await contract.send(sendParam, fee, refundAddress, {
            value: nativeFee,
          });

          const receipt = await tx.wait();

          setState((prev) => ({
            ...prev,
            isSending: false,
            txHash: receipt.hash,
            lzScanUrl: `${LZ_SCAN_TESTNET}/tx/${receipt.hash}`,
          }));

          return receipt.hash;
        }

        throw new Error("Solana -> EVM sending via frontend requires the Solana SDK. Use the CLI task for now.");
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Send failed";
        setState((prev) => ({ ...prev, isSending: false, error: msg }));
        return null;
      }
    },
    [signer]
  );

  const reset = useCallback(() => {
    setState({
      isQuoting: false,
      isSending: false,
      quote: null,
      txHash: null,
      lzScanUrl: null,
      error: null,
    });
  }, []);

  return { ...state, getQuote, send, reset };
}
