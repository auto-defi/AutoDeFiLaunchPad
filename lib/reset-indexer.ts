#!/usr/bin/env tsx
/**
 * Hedera EVM Indexer Reset (No-Op)
 *
 * This project uses Hedera EVM only. There is no on-chain "reset" step for the
 * Hedera EVM indexer. Snapshots/metrics are produced via the Next.js API:
 *   - GET /api/indexer-evm/cron       (cron/scheduled snapshot)
 *   - GET /api/indexer-evm/metrics    (on-demand metrics)
 *
 * Usage: npx tsx lib/reset-indexer.ts
 */

import { prisma } from './prisma';

async function resetToLatest() {
  console.log('⚡ Hedera EVM indexer reset: no-op.');
  console.log('👉 Use /api/indexer-evm/cron to trigger a snapshot and /api/indexer-evm/metrics for queries.');

  // Optional: show a quick DB status if Prisma is configured
  try {
    const tradeCount = await prisma.trade.count();
    const lastTrade = await prisma.trade.findFirst({ orderBy: { created_at: 'desc' } });
    console.log(`📦 Trades: ${tradeCount}`);
    if (lastTrade) {
      console.log(`🧾 Last Trade: ${lastTrade.transaction_hash?.substring(0, 12)}... at ${lastTrade.created_at.toISOString()}`);
    }
  } catch (err) {
    // Ignore if the database is not configured in this environment
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  resetToLatest().catch(console.error);
}

export { resetToLatest };
