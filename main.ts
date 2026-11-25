// Kinako paper-trading bot #3 for the pump.fun replay (agent-fun/replay/v2).
//
// Strategy variant for the short bot sprint (the conservative sibling of our
// two other sprint bots): on a short tape there is no time to recover from
// early graves, so this bot is picky -- a curve qualifies only after 8 trades
// and 3 SOL of real reserve -- takes a small 0.03 SOL starter, pyramids once
// at +20%, and banks profits early at +50% with a tight -35% stop and a
// 12,000-slot time stop. The aim on a short replay is not the moonshot; it is
// finishing above holding cash with as few funerals as possible. Still no
// buys at creation, still one starter per mint, still fully deterministic:
// decisions depend only on the batch stream. Layout follows the kit's
// baselines: main.ts at the root, the SDK shim vendored beside it
// (vendor/makefun-bot.ts, a copy of sdk/ts).

import { LAMPORTS_PER_SOL, runBot, type OrderInput } from './vendor/makefun-bot.ts';

const MIN_TRADES = 8;
const MIN_REAL_LAMPORTS = LAMPORTS_PER_SOL * 3n; // 3 SOL of real reserve
const MIN_BUY_LAMPORTS = LAMPORTS_PER_SOL / 200n; // 0.005 SOL
const STAKE_LAMPORTS = (LAMPORTS_PER_SOL * 3n) / 100n; // 0.03 SOL starter
const ADD_LAMPORTS = LAMPORTS_PER_SOL / 50n; // 0.02 SOL pyramid add
const MAX_SLIPPAGE_BPS = 10_000;
// Exits, as multiples of cost in percent: sell at >= 150% (take profit),
// <= 65% (stop loss), or after TIMEOUT_SLOTS whatever the price. On a short
// tape, banking +50% beats dreaming about +150%. A curve that completes is
// closed by the replay itself.
const TAKE_PROFIT_PCT = 150n;
const STOP_LOSS_PCT = 65n;
const PYRAMID_AT_PCT = 120n;
const TIMEOUT_SLOTS = 12_000;

/** Mints created and not yet given a starter decision. */
const watch = new Set<string>();
/** Slot at which each held mint was first bought. */
const boughtSlot = new Map<string, number>();
/** Mints that already used their one pyramid add. */
const pyramided = new Set<string>();

/** Current mark-to-market value of a holding, in lamports (0 when unknown). */
function valueOf(state: any, mint: string): bigint {
  const h = state.positions.get(mint);
  const c = state.curves.get(mint);
  if (h === undefined || c === undefined || c.virtual_token_reserves === 0n) return 0n;
  return (h.token_amount * c.virtual_quote_reserves) / c.virtual_token_reserves;
}

await runBot({
  onBatch(state, batch) {
    const { caps } = state.hello;
    const tx = state.txFeeLamports();
    let free = state.freeCashLamports();
    const orders: OrderInput[] = [];

    for (const e of batch.events) {
      if (e.event === 'CreateEvent') watch.add(e.mint);
    }

    // --- exits and pyramid adds on held positions -------------------------
    for (const [mint, h] of state.positions) {
      const curve = state.curves.get(mint);
      if (curve === undefined || curve.complete) continue;
      const value = valueOf(state, mint);
      const cost = h.cost_lamports;
      if (cost === 0n) continue;
      const pct = (value * 100n) / cost;
      const age = boughtSlot.has(mint) ? state.slot - boughtSlot.get(mint)! : 0;
      if (pct >= TAKE_PROFIT_PCT || pct <= STOP_LOSS_PCT || age > TIMEOUT_SLOTS) {
        orders.push({ side: 'sell', mint, token_amount: h.token_amount, max_slippage_bps: MAX_SLIPPAGE_BPS });
        boughtSlot.delete(mint);
        pyramided.delete(mint);
        continue;
      }
      if (pct >= PYRAMID_AT_PCT && !pyramided.has(mint)) {
        const cap = state.maxBuyLamports(mint);
        const amount = cap < ADD_LAMPORTS ? cap : ADD_LAMPORTS;
        if (amount >= MIN_BUY_LAMPORTS && free >= amount + tx && orders.length < caps.max_orders_per_batch) {
          orders.push({ side: 'buy', mint, quote_lamports: amount, max_slippage_bps: MAX_SLIPPAGE_BPS });
          free -= amount + tx;
          pyramided.add(mint);
        }
      }
    }

    // --- starter buys on watched curves that have shown life --------------
    let slots = caps.max_open_positions - state.committedPositionCount();
    for (const mint of watch) {
      if (orders.length >= caps.max_orders_per_batch || slots <= 0) break;
      if (state.positions.has(mint)) { watch.delete(mint); continue; }
      const curve = state.curves.get(mint);
      if (curve === undefined) continue;
      if (curve.complete) { watch.delete(mint); continue; }
      if (curve.trades < MIN_TRADES || curve.real_quote_reserves < MIN_REAL_LAMPORTS) continue;
      const cap = state.maxBuyLamports(mint);
      if (cap < MIN_BUY_LAMPORTS) continue;
      watch.delete(mint); // decided: one starter per mint, win or lose
      const amount = cap < STAKE_LAMPORTS ? cap : STAKE_LAMPORTS;
      if (free < amount + tx) continue;
      orders.push({ side: 'buy', mint, quote_lamports: amount, max_slippage_bps: MAX_SLIPPAGE_BPS });
      free -= amount + tx;
      slots -= 1;
      boughtSlot.set(mint, state.slot);
    }

    return orders;
  },
});
