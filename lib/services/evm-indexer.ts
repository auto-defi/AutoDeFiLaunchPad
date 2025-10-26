import { ethers, Contract, JsonRpcProvider, Log } from "ethers";
import { prisma } from "@/lib/prisma";
import factoryAbi from "@/abis/BondingCurveFactory.json";
import poolAbi from "@/abis/BondingCurvePool.json";
import tokenAbi from "@/abis/LaunchPadToken.json";

const FACTORY_ADDR = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as string | undefined;
const HEDERA_RPC_URL = process.env.HEDERA_RPC_URL || "https://testnet.hashio.io/api";

export type SnapshotResult = {
  token: string;
  pool: string;
  priceUsd: number;
  priceHbar: number;
  hbarPriceUsd: number;
  reservesHbar?: number;
  reservesToken?: number;
  blockNumber: number;
  blockTime: Date;
};

export class EVMIndexer {
  provider: JsonRpcProvider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(HEDERA_RPC_URL);
  }

  async getHbarUsd(): Promise<number> {
    try {
      const resp = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=hedera-hashgraph&vs_currencies=usd"
      );
      const data = await resp.json();
      return data?.["hedera-hashgraph"]?.usd || 0;
    } catch {
      return 0;
    }
  }

  async getFactory(): Promise<Contract | null> {
    if (!FACTORY_ADDR) return null;
    return new Contract(
      FACTORY_ADDR,
      (factoryAbi as any).abi || (factoryAbi as any),
      this.provider
    );
  }

  async discoverTokens(): Promise<string[]> {
    const factory = await this.getFactory();
    if (!factory) return [];
    try {
      const len = Number(await factory.allTokensLength());
      const addrs: string[] = [];
      for (let i = 0; i < len; i++) addrs.push(await factory.allTokens(i));
      return addrs;
    } catch {
      return [];
    }
  }

  async getPoolForToken(tokenAddr: string): Promise<string | null> {
    const factory = await this.getFactory();
    if (!factory) return null;
    try {
      const pool = await factory.getPool(tokenAddr);
      if (!pool || pool === ethers.ZeroAddress) return null;
      return pool as string;
    } catch {
      return null;
    }
  }

  async snapshotToken(tokenAddr: string, hbarPriceUsd: number): Promise<SnapshotResult | null> {
    const poolAddr = await this.getPoolForToken(tokenAddr);
    if (!poolAddr) return null;

    const pool = new Contract(poolAddr, (poolAbi as any).abi || (poolAbi as any), this.provider);
    const token = new Contract(tokenAddr, (tokenAbi as any).abi || (tokenAbi as any), this.provider);

    const decimals: number = Number(await token.decimals());

    const [blockNumber, block] = await Promise.all([
      this.provider.getBlockNumber(),
      this.provider.getBlock("latest"),
    ]);

    // price via selling 1 token
    const unitIn = ethers.parseUnits("1", decimals);
    const hbarOutWei = await pool.getPriceForSell(unitIn);
    const priceHbarPerToken = parseFloat(ethers.formatEther(hbarOutWei));
    const priceUsd = priceHbarPerToken * hbarPriceUsd;

    // reserves (optional)
    let reservesHbar: number | undefined;
    let reservesToken: number | undefined;
    try {
      const [hR, tR] = await pool.reserves();
      reservesHbar = parseFloat(ethers.formatEther(hR));
      reservesToken = parseFloat(ethers.formatUnits(tR, decimals));
    } catch {}

    // Persist snapshot
    try {
      await (prisma as any).tokenSnapshot.create({
        data: {
          token: tokenAddr.toLowerCase(),
          pool: poolAddr.toLowerCase(),
          priceUsd,
          priceHbar: priceHbarPerToken,
          hbarPriceUsd,
          reservesHbar,
          reservesToken,
          blockNumber,
          blockTime: new Date((block?.timestamp || Math.floor(Date.now() / 1000)) * 1000),
        },
      });
    } catch (e) {
      console.warn("TokenSnapshot insert failed", tokenAddr, e);
    }

    return {
      token: tokenAddr,
      pool: poolAddr,
      priceUsd,
      priceHbar: priceHbarPerToken,
      hbarPriceUsd,
      reservesHbar,
      reservesToken,
      blockNumber,
      blockTime: new Date((block?.timestamp || Math.floor(Date.now() / 1000)) * 1000),
    };
  }

  async snapshotAllTokens(): Promise<SnapshotResult[]> {
    const results: SnapshotResult[] = [];
    const tokens = await this.discoverTokens();
    if (tokens.length === 0) return results;
    const hbarUsd = await this.getHbarUsd();

    for (const t of tokens) {
      try {
        const snap = await this.snapshotToken(t, hbarUsd);
        if (snap) results.push(snap);
      } catch (e) {
        console.warn("snapshot failed", t, e);
      }
    }
    // prune old snapshots (> 72h)
    try {
      const cutoff = new Date(Date.now() - 72 * 3600 * 1000);
      await (prisma as any).tokenSnapshot.deleteMany({ where: { createdAt: { lt: cutoff } } });
    } catch {}

    return results;
  }

  async findFromBlock24h(): Promise<number> {
    const latest = await this.provider.getBlockNumber();
    const latestBlk = await this.provider.getBlock(latest);
    const targetTs = (latestBlk?.timestamp || Math.floor(Date.now() / 1000)) - 24 * 3600;
    let lo = 0;
    let hi = latest;
    let ans = 0;
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2);
      const b = await this.provider.getBlock(mid);
      const ts = b?.timestamp || 0;
      if (ts >= targetTs) {
        ans = mid;
        hi = mid - 1;
      } else {
        lo = mid + 1;
      }
    }
    return ans;
  }

  async volume24hUsd(poolAddr: string, hbarUsd: number): Promise<number> {
    const fromBlock = await this.findFromBlock24h();
    const latest = await this.provider.getBlockNumber();
    const iface = new Contract(poolAddr, (poolAbi as any).abi || (poolAbi as any), this.provider).interface;
    const topicBought = ethers.id("Bought(address,uint256,uint256)");
    const topicSold = ethers.id("Sold(address,uint256,uint256)");

    let sumHbar = 0;
    const step = 2500;
    for (let start = fromBlock; start <= latest; start += step + 1) {
      const end = Math.min(latest, start + step);
      const [logsB, logsS] = await Promise.all([
        this.provider.getLogs({ address: poolAddr, fromBlock: start, toBlock: end, topics: [topicBought] }),
        this.provider.getLogs({ address: poolAddr, fromBlock: start, toBlock: end, topics: [topicSold] }),
      ]);
      const logs = [...logsB, ...logsS] as Log[];
      for (const log of logs) {
        try {
          const parsed = iface.parseLog(log as any);
          if (parsed?.name === "Bought") {
            const hIn = parsed.args?.[1];
            sumHbar += parseFloat(ethers.formatEther(hIn));
          } else if (parsed?.name === "Sold") {
            const hOut = parsed.args?.[2];
            sumHbar += parseFloat(ethers.formatEther(hOut));
          }
        } catch {}
      }
    }
    return sumHbar * hbarUsd;
  }
}

