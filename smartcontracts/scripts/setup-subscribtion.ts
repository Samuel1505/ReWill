import { createWalletClient, createPublicClient, defineChain, http, parseGwei } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { SDK } from "@somnia-chain/reactivity";
import * as dotenv from "dotenv";

dotenv.config();

const somniaTestnet = defineChain({
  id: 50312,
  name: "Somnia Testnet",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.SOMNIA_RPC_URL || "https://dream-rpc.somnia.network"] },
  },
});

async function main() {
  const privateKey = process.env.PRIVATE_KEY as `0x${string}` | undefined;
  const registryAddress = process.env.REGISTRY_ADDRESS as `0x${string}` | undefined;
  const executorAddress = process.env.EXECUTOR_ADDRESS as `0x${string}` | undefined;

  if (!privateKey || !registryAddress || !executorAddress) {
    throw new Error("Set PRIVATE_KEY, REGISTRY_ADDRESS, EXECUTOR_ADDRESS in .env");
  }

  const account = privateKeyToAccount(privateKey);
  const publicClient = createPublicClient({
    chain: somniaTestnet,
    transport: http(),
  });
  const walletClient = createWalletClient({
    account,
    chain: somniaTestnet,
    transport: http(),
  });

  const sdk = new SDK({ public: publicClient, wallet: walletClient });

  const balance = await publicClient.getBalance({ address: account.address });
  console.log(`Deployer balance: ${balance} wei`);
  console.log("Recommended minimum before subscriptions: >= 32 STT");

  const checkInTopic =
    "0x503cfdccfcf030f53efcd57272a4f0f47472f4be2fca591f9351e2055548dce0" as `0x${string}`;
  const onCheckinSelector = "0x56d8434a" as `0x${string}`;
  const onCronSelector = "0x147f4f68" as `0x${string}`;

  const eventTx = await sdk.createSoliditySubscription({
    handlerContractAddress: executorAddress,
    handlerFunctionSelector: onCheckinSelector,
    emitter: registryAddress,
    eventTopics: [checkInTopic],
    isGuaranteed: true,
    isCoalesced: false,
    gasLimit: 300_000n,
    priorityFeePerGas: parseGwei("2"),
    maxFeePerGas: parseGwei("10"),
  });
  console.log("Event subscription tx:", eventTx);

  const cronTx = await sdk.createCronSoliditySubscription({
    handlerContractAddress: executorAddress,
    handlerFunctionSelector: onCronSelector,
    intervalBlocks: 600n,
    isGuaranteed: true,
    gasLimit: 500_000n,
    priorityFeePerGas: parseGwei("2"),
    maxFeePerGas: parseGwei("10"),
  });
  console.log("Cron subscription tx:", cronTx);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
