"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BrowserProvider, Eip1193Provider, JsonRpcSigner } from "ethers";

interface EVMWalletContextValue {
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  account: string | null;
  chainId: number | null;
  connected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToHedera: () => Promise<void>;
}

const EVMWalletContext = createContext<EVMWalletContextValue | undefined>(undefined);

const HEDERA_CHAIN_ID_DEC = 296; // 0x128
const HEDERA_CHAIN_ID_HEX = "0x128";
const HEDERA_PARAMS = {
  chainId: HEDERA_CHAIN_ID_HEX,
  chainName: "Hedera Testnet (EVM)",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  rpcUrls: ["https://testnet.hashio.io/api"],
  blockExplorerUrls: ["https://hashscan.io/testnet"],
};

export function EVMWalletProvider({ children }: { children: React.ReactNode }) {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);

  const connected = useMemo(() => !!account, [account]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const eth = (window as any).ethereum as Eip1193Provider | undefined;
    if (!eth) return;

    const onAccountsChanged = (accs: string[]) => {
      setAccount(accs && accs.length > 0 ? accs[0] : null);
    };
    const onChainChanged = (cidHex: string) => {
      try {
        setChainId(parseInt(cidHex, 16));
      } catch {
        setChainId(null);
      }
    };

    (eth as any).on?.("accountsChanged", onAccountsChanged);
    (eth as any).on?.("chainChanged", onChainChanged);
    return () => {
      (eth as any).removeListener?.("accountsChanged", onAccountsChanged);
      (eth as any).removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  const ensureProvider = async () => {
    if (provider) return provider;
    if (typeof window === "undefined" || !(window as any).ethereum) {
      throw new Error("No EVM wallet found. Please install MetaMask.");
    }
    const eth = (window as any).ethereum as Eip1193Provider;
    const prov = new BrowserProvider(eth);
    setProvider(prov);
    return prov;
  };

  const switchToHedera = async () => {
    const eth = (window as any).ethereum as any;
    if (!eth) throw new Error("No EVM wallet available");
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: HEDERA_CHAIN_ID_HEX }] });
    } catch (switchErr: any) {
      // 4902 = Unrecognized chain
      if (switchErr?.code === 4902 || /Unrecognized chain/i.test(String(switchErr?.message || ""))) {
        await eth.request({ method: "wallet_addEthereumChain", params: [HEDERA_PARAMS] });
      } else {
        throw switchErr;
      }
    }
    setChainId(HEDERA_CHAIN_ID_DEC);
  };

  const connect = async () => {
    const prov = await ensureProvider();
    const eth = (window as any).ethereum as any;
    // Request accounts first to trigger connection prompt
    const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
    setAccount(accounts && accounts.length > 0 ? accounts[0] : null);

    // Ensure correct network
    await switchToHedera();

    const s = await prov.getSigner();
    setSigner(s);

    const net = await prov.getNetwork();
    setChainId(Number(net.chainId));
  };

  const disconnect = () => {
    // For EIP-1193 there is no standardized programmatic disconnect.
    // We reset local state.
    setSigner(null);
    setAccount(null);
  };

  const value: EVMWalletContextValue = {
    provider,
    signer,
    account,
    chainId,
    connected,
    connect,
    disconnect,
    switchToHedera,
  };

  return <EVMWalletContext.Provider value={value}>{children}</EVMWalletContext.Provider>;
}

export function useEVMWallet() {
  const ctx = useContext(EVMWalletContext);
  if (!ctx) throw new Error("useEVMWallet must be used within EVMWalletProvider");
  return ctx;
}

