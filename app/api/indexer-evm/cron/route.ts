import { NextResponse } from 'next/server';
import { EVMIndexer } from '@/lib/services/evm-indexer';

// GET /api/indexer-evm/cron
// Use with a cron scheduler (e.g., Vercel cron) every 5-10 minutes
export async function GET() {
  try {
    const indexer = new EVMIndexer();
    const snaps = await indexer.snapshotAllTokens();

    return NextResponse.json({
      success: true,
      count: snaps.length,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('EVM indexer cron error', e);
    return NextResponse.json({ success: false, error: 'cron failed' }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}

