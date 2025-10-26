BEGIN;
UPDATE "PoolStats" SET hbar_reserves = hbar_reserves * 10000000000;
UPDATE "PoolStats" SET total_volume = total_volume * 10000000000;
UPDATE "PoolStats" SET graduation_threshold = graduation_threshold * 10000000000;
UPDATE "Trade" SET hbar_amount = hbar_amount * 10000000000;
COMMIT;

