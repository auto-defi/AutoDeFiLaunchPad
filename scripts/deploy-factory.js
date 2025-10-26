/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import hre from "hardhat";
const { ethers } = hre;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  // Basic sanity
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 296n) {
    console.warn(`Warning: connected chainId=${network.chainId} (expected 296)`);
  }

  console.log("Deploying BondingCurveFactory...");
  const Factory = await ethers.getContractFactory("BondingCurveFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("BondingCurveFactory deployed at:", factoryAddress);

  // Persist addresses
  const outDir = path.join(__dirname, "..", "addresses");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const outPath = path.join(outDir, "hedera-testnet.json");
  const payload = { chainId: 296, rpc: process.env.HEDERA_RPC_URL || "https://testnet.hashio.io/api", factory: factoryAddress, deployedAt: new Date().toISOString() };
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log("Saved:", outPath);

  console.log("HashScan (set contract address): https://hashscan.io/testnet/contract/" + factoryAddress);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

