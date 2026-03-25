import { defineChain } from "viem";

export const somniaTestnet = defineChain({
  id: 50312,
  name: "Somnia Testnet",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://dream-rpc.somnia.network"] },
  },
  blockExplorers: {
    default: {
      name: "Shannon Explorer",
      url: "https://shannon-explorer.somnia.network",
    },
  },
  testnet: true,
});

export const REGISTRY_ADDRESS = (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ||
  "0x7D7610C62D006e17779146F7C36cb1B3715A0DAb") as `0x${string}`;

export const EXECUTOR_ADDRESS = (process.env.NEXT_PUBLIC_EXECUTOR_ADDRESS ||
  "0x1Eb0467816CdAB46E8c3f9C159F6D4615fA05cF7") as `0x${string}`;

export const EXPLORER_URL = "https://shannon-explorer.somnia.network";

export const getExplorerTxUrl = (hash: string) =>
  `${EXPLORER_URL}/tx/${hash}`;

export const getExplorerAddressUrl = (address: string) =>
  `${EXPLORER_URL}/address/${address}`;
