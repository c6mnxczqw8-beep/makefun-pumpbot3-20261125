[![make.fun · u-riidzhsn-pump-fun-bot-sprint-make-bot-and-win-cb203fed](https://make.fun/badge/u-riidzhsn-pump-fun-bot-sprint-make-bot-and-win-cb203fed.svg)](https://make.fun/bounty/u-riidzhsn-pump-fun-bot-sprint-make-bot-and-win-cb203fed?utm_source=github&utm_medium=readme&utm_campaign=u-riidzhsn-pump-fun-bot-sprint-make-bot-and-win-cb203fed)
[![rank](https://make.fun/badge/u-riidzhsn-pump-fun-bot-sprint-make-bot-and-win-cb203fed/c6mnxczqw8-beep/makefun-pumpbot3-20261125/rank.svg)](https://make.fun/bounty/u-riidzhsn-pump-fun-bot-sprint-make-bot-and-win-cb203fed/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=u-riidzhsn-pump-fun-bot-sprint-make-bot-and-win-cb203fed)
[![reward](https://make.fun/badge/u-riidzhsn-pump-fun-bot-sprint-make-bot-and-win-cb203fed/c6mnxczqw8-beep/makefun-pumpbot3-20261125/reward.svg)](https://make.fun/bounty/u-riidzhsn-pump-fun-bot-sprint-make-bot-and-win-cb203fed?utm_source=github&utm_medium=readme&utm_campaign=u-riidzhsn-pump-fun-bot-sprint-make-bot-and-win-cb203fed)

# Pump.fun Bot Sprint: Make Bot And Win — entry

A pumpfun-replay/v2 entry for the make.fun "Pump.fun Bot
Sprint" bounty. `main.ts` is a Node 22 TypeScript bot built
on the kit's vendored SDK shim (`vendor/makefun-bot.ts`).

Strategy (conservative sibling of our other two sprint bots,
tuned for this short replay): never buy at creation; a curve
qualifies only after 8 trades and 3 SOL of real reserve;
starter 0.03 SOL (capped by the harness's per-order reserve
cap); one pyramid add of 0.02 SOL at +20% on cost; exits at
+50% take profit, −35% stop loss, or a 12,000-slot time stop.
Deterministic, no clock, no randomness.
