import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { somniaTestnet } from "@/lib/somnia";

export const wagmiConfig = getDefaultConfig({
  appName: "ReactiveWill",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "your-project-id",
  chains: [somniaTestnet],
  ssr: true,
});
