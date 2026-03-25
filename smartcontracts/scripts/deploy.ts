import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying as:", deployer.address);

  const WillExecutor = await ethers.getContractFactory("WillExecutor");
  const executor = await WillExecutor.deploy(ethers.ZeroAddress);
  await executor.waitForDeployment();
  const executorAddress = await executor.getAddress();

  const minInterval = process.env.MIN_INTERVAL_SECONDS
    ? BigInt(process.env.MIN_INTERVAL_SECONDS)
    : 3600n;

  const CheckInRegistry = await ethers.getContractFactory("CheckInRegistry");
  const registry = await CheckInRegistry.deploy(executorAddress, minInterval);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();

  await (await executor.setRegistry(registryAddress)).wait();

  console.log("REGISTRY_ADDRESS=", registryAddress);
  console.log("EXECUTOR_ADDRESS=", executorAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
