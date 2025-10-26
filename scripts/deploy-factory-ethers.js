/* eslint-disable no-console */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const rpc = process.env.HEDERA_RPC_URL || "https://testnet.hashio.io/api";
  const pk = process.env.HEDERA_PRIVATE_KEY;
  if (!pk) throw new Error("HEDERA_PRIVATE_KEY not set in .env");

  const provider = new ethers.JsonRpcProvider(rpc, { chainId: 296, name: "hedera-testnet" });
  const wallet = new ethers.Wallet(pk, provider);

  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "BondingCurveFactory.sol", "BondingCurveFactory.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const abi = artifact.abi;
  const bytecode = artifact.bytecode;

  console.log("Deploying from:", await wallet.getAddress());
  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  console.log("Sent tx:", contract.deploymentTransaction().hash);
  const deployed = await contract.waitForDeployment();
  const addr = await deployed.getAddress();
  console.log("BondingCurveFactory deployed at:", addr);

  const outDir = path.join(__dirname, "..", "addresses");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const outPath = path.join(outDir, "hedera-testnet.json");
  const payload = { chainId: 296, rpc, factory: addr, deployedAt: new Date().toISOString() };
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log("Saved:", outPath);
  console.log("HashScan:", `https://hashscan.io/testnet/contract/${addr}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

