import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ethers, Contract } from 'ethers';
import tokenAbi from '@/abis/LaunchPadToken.json';

async function onChainFallback(address: string) {
  try {
    const HEDERA_RPC_URL = process.env.HEDERA_RPC_URL || 'https://testnet.hashio.io/api';
    const provider = new ethers.JsonRpcProvider(HEDERA_RPC_URL);
    const token = new Contract(address, (tokenAbi as any).abi || (tokenAbi as any), provider);
    const [name, symbol, decimals] = await Promise.all([
      token.name(),
      token.symbol(),
      token.decimals(),
    ]);
    return {
      address,
      name,
      symbol,
      creator: '',
      decimals: Number(decimals),
      max_supply: null,
      icon_uri: null,
      project_uri: null,
      mint_fee_per_unit: '0',
      created_at: new Date().toISOString(),
      pool_stats: null,
      trades: [],
      volume_24h: 0,
      trade_count_24h: 0,
    };
  } catch (e) {
    return null;
  }
}

// GET /api/tokens/:address - Token detail + recent trades
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params;

    const token = await prisma.fA.findUnique({
      where: { address },
      include: {
        pool_stats: true,
        trades: {
          orderBy: { created_at: 'desc' },
          take: 50,
          select: {
            id: true,
            transaction_hash: true,
            user_address: true,
            hbar_amount: true,
            token_amount: true,
            price_per_token: true,
            created_at: true
          }
        }
      }
    });

    if (!token) {
      const oc = await onChainFallback(address);
      if (oc) {
        return NextResponse.json({ success: true, data: oc, source: 'on-chain' });
      }
      return NextResponse.json({
        success: false,
        error: 'Token not found'
      }, { status: 404 });
    }

    // Calculate 24h volume for this token
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const volume24h = await prisma.trade.aggregate({
      where: {
        fa_address: address,
        created_at: {
          gte: twentyFourHoursAgo
        }
      },
      _sum: {
        hbar_amount: true
      },
      _count: true
    });

    return NextResponse.json({
      success: true,
      data: {
        ...token,
        volume_24h: volume24h._sum.hbar_amount || 0,
        trade_count_24h: volume24h._count || 0
      }
    });
  } catch (error) {
    console.warn('DB token detail fetch failed, trying on-chain fallback');
    try {
      const { address } = await params;
      const oc = await onChainFallback(address);
      if (oc) return NextResponse.json({ success: true, data: oc, source: 'on-chain' });
    } catch {}
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch token details'
    }, { status: 500 });
  }
}
