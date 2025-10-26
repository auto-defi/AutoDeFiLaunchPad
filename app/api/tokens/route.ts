import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ethers, Contract } from 'ethers';
import factoryAbi from '@/abis/BondingCurveFactory.json';
import tokenAbi from '@/abis/LaunchPadToken.json';

async function fetchOnChainFallback() {
  try {
    const FACTORY_ADDR = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as string | undefined;
    const HEDERA_RPC_URL = process.env.HEDERA_RPC_URL || 'https://testnet.hashio.io/api';
    if (!FACTORY_ADDR) return [];

    const provider = new ethers.JsonRpcProvider(HEDERA_RPC_URL);
    const factory = new Contract(FACTORY_ADDR, (factoryAbi as any).abi || (factoryAbi as any), provider);
    const len = Number(await factory.allTokensLength());

    const limit = Math.min(len, 100);
    const tokens: any[] = [];
    for (let i = 0; i < limit; i++) {
      try {
        const addr = await factory.allTokens(i);
        const token = new Contract(addr, (tokenAbi as any).abi || (tokenAbi as any), provider);
        const [name, symbol, decimals] = await Promise.all([
          token.name(),
          token.symbol(),
          token.decimals(),
        ]);
        tokens.push({
          address: addr,
          name,
          symbol,
          creator: '',
          decimals: Number(decimals),
          icon_uri: '',
          project_uri: '',
          pool_stats: {
            hbar_reserves: '0',
            total_volume: '0',
            trade_count: 0,
            is_graduated: false,
          },
          _count: { trades: 0 },
        });
      } catch (e) {
        // skip bad token
      }
    }
    return tokens;
  } catch {
    return [];
  }
}

// GET /api/tokens - List all tokens
export async function GET() {
  try {
    const tokens = await prisma.fA.findMany({
      include: {
        pool_stats: true,
        _count: {
          select: { trades: true }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      data: tokens
    });
  } catch (error) {
    console.warn('DB tokens fetch failed, using on-chain fallback:', (error as Error).message);
    const fallback = await fetchOnChainFallback();
    return NextResponse.json({ success: true, data: fallback, source: 'on-chain' });
  }
}
