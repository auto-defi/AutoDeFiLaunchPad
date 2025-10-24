import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { EVMIndexer } from '@/lib/services/evm-indexer';
import { ethers, Contract } from 'ethers';
import tokenAbi from '@/abis/LaunchPadToken.json';
import factoryAbi from '@/abis/BondingCurveFactory.json';
import poolAbi from '@/abis/BondingCurvePool.json';

const HEDERA_RPC_URL = process.env.HEDERA_RPC_URL || 'https://testnet.hashio.io/api';
const FACTORY_ADDR = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as string | undefined;

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const tokensParam = url.searchParams.get('tokens');
    if (!tokensParam) {
      return NextResponse.json({ success: false, error: 'tokens param required (comma-separated)' }, { status: 400 });
    }
    const tokens = tokensParam.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

    const provider = new ethers.JsonRpcProvider(HEDERA_RPC_URL);
    const indexer = new EVMIndexer();
    const hbarUsd = await indexer.getHbarUsd();

    const factory = FACTORY_ADDR ? new Contract(FACTORY_ADDR, (factoryAbi as any).abi || (factoryAbi as any), provider) : null;

    const results = [] as any[];

    for (const token of tokens) {
      try {
        const poolAddr: string | null = factory ? await factory.getPool(token) : null;
        if (!poolAddr || poolAddr === ethers.ZeroAddress) {
          results.push({ token, error: 'no pool' });
          continue;
        }
        const pool = new Contract(poolAddr, (poolAbi as any).abi || (poolAbi as any), provider);
        const tok = new Contract(token, (tokenAbi as any).abi || (tokenAbi as any), provider);
        const decimals: number = Number(await tok.decimals());

        // Current price via selling 1 token
        const hbarOutWei = await pool.getPriceForSell(ethers.parseUnits('1', decimals));
        const priceHbar = parseFloat(ethers.formatEther(hbarOutWei));
        const priceUsd = priceHbar * hbarUsd;

        // 24h change using snapshots
        const now = new Date();
        const cutoff = new Date(Date.now() - 24 * 3600 * 1000);
        const [snapLatest] = await (prisma as any).tokenSnapshot.findMany({
          where: { token },
          orderBy: { createdAt: 'desc' },
          take: 1,
        });
        const snapOld = await (prisma as any).tokenSnapshot.findFirst({
          where: {
            token,
            createdAt: { lte: cutoff },
          },
          orderBy: { createdAt: 'desc' },
        });
        let change24h = 0;
        if (snapLatest && snapOld && Number(snapOld.priceUsd) > 0) {
          const cur = Number(snapLatest.priceUsd);
          const old = Number(snapOld.priceUsd);
          change24h = ((cur - old) / old) * 100;
        }

        // Market cap from totalSupply
        let marketCap = 0;
        try {
          const ts = await tok.totalSupply();
          const total = parseFloat(ethers.formatUnits(ts, decimals));
          marketCap = total * priceUsd;
        } catch {}

        // Volume 24h via logs
        let volume24hUsd = 0;
        try {
          volume24hUsd = await indexer.volume24hUsd(poolAddr, hbarUsd);
        } catch {}

        results.push({ token, pool: poolAddr, currentPrice: priceUsd, priceChange24h: change24h, marketCap, volume24hUsd, snapshotAt: now.toISOString() });
      } catch (e) {
        results.push({ token, error: 'failed', details: (e as Error).message });
      }
    }

    return NextResponse.json({ success: true, data: results });
  } catch (e) {
    console.error('metrics error', e);
    return NextResponse.json({ success: false, error: 'failed' }, { status: 500 });
  }
}

