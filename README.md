# Pecking Order

**Play it: https://darrock712.github.io/pecking-order/**

A daily ordering puzzle. Each day everyone gets the same three rounds: five things and a rule ("lightest → heaviest", "oldest → newest"). Put them in order, lock it in, and watch the answer resolve one tile at a time. Every round ends on a fact that is meant to make you say "wait, really?".

It takes about a minute a day, runs entirely in the browser, and needs no account.

## Features

- **Three rounds a day**: a warm-up, a trickier one, and a twist round built around something counterintuitive.
- **One attempt per round**, so the reveal matters. Tiles flip green (right spot), amber (one place off) or red, with the real value beside each.
- **The reveal shows scale**: each tile grows a bar for its value, then every tile slides to where it really belongs, so you see how wrong (or right) you were at a glance.
- **Near misses are named**: "one swap away" rather than a bare score.
- **Hard mode** hides the rule. You get one solved example set and have to work out what the order means before arranging your own.
- **Streak that counts days played**, not days won. A low score never breaks it.
- **Spoiler-free sharing**: an emoji grid plus a teaser line.
- **Progress at a glance**: round pips with a running score, and a meter comparing today with your average.
- **Practice rounds** and an **archive** of past days, neither of which affects stats.
- Drag, tap-to-swap, or arrow keys; screen-reader labels and live announcements; light and dark themes; reduced-motion support; installable and playable offline.

## Scoring

| | Points |
|---|---|
| Item in the right spot | 6 |
| Item one place off | 3 |
| Perfect round bonus | 3 |
| Perfect day bonus | 1 |

A round is worth up to 33, so three perfect rounds plus the day bonus make exactly 100.

## Run it

```bash
npm install
npm run dev      # local dev server
npm test         # unit tests + content validation
npm run lint
npm run build    # production build in dist/
```

## How it is built

React + TypeScript + Vite, plain CSS, no backend. Progress is stored in `localStorage`.

```
src/
  game/         pure functions, no React, fully unit tested
    daily.ts      puzzle number from the local date, set selection, seeded shuffle, hard-mode example
    scoring.ts    marks, points, verdicts, share text
    stats.ts      streak and totals
    storage.ts    localStorage with safe fallbacks
  data/
    sets.ts       the puzzle content
    sets.test.ts  content rules, enforced in CI
  components/   Round (arrange + reveal), Summary, visual effects
  lib/          number formatting, bar scaling, synthesised sound and haptics
```

Design decisions worth knowing:

- **Sets are stored in their correct order.** An item is right when its index equals its position, which keeps scoring to a few lines and makes content errors easy to spot in review.
- **The puzzle number comes from the player's local calendar date**, projected onto UTC midnight before subtracting, so daylight-saving changes can never skip or repeat a day.
- **The starting shuffle is seeded by the day**, so every player sees the same starting order. It never starts with more than one item already in place.
- **Tiles keep a stable DOM order and move with CSS**, so focus is never lost while reordering with the keyboard.
- **The service worker is network-first**, so fixes and new puzzles arrive immediately and the cache is only a fallback when offline.

## Content

156 sets, enough for 52 days; after that the cycle repeats. They come from two decks: 120 classic sets and 36 "fun stats" sets (snack serving sizes, YouTube subscribers, bite force, LEGO piece counts, caffeine, sugar, spice, world records). The decks are dealt alternately, so a fun-stats day turns up every other day. `npm test` checks that every set has five unique items in rising order, values far enough apart to be a fair question (at least 8% apart, or 3 years / 5 degrees), a surprise line, a short teaser, and a same-rule partner for hard mode.

### Fun stats sources

The fun-stats deck was checked against sources in November 2026. Soft numbers are shown as "about" in the game, and every set keeps wide gaps so a small change cannot flip the order.

- Serving sizes: US Nutrition Facts labels as listed by grocers (Goldfish 55 pieces, Cheez-It 27, Triscuit 6, Ritz 5, Doritos about 12, Lay's about 15). Counts shift by bag size and over time; Lay's and Pringles listings disagree by a few chips.
- YouTube subscribers: Soundstripe, HypeAuditor and Tubefilter charts, October 2026 (MrBeast about 520 million, T-Series 316 million, Cocomelon about 200 million). These go stale fastest; recheck every few months.
- Bite force: Field & Stream and BBC Science Focus lists. Only the crocodile figure was measured directly; the rest are estimates.
- LEGO piece counts: Brick Fanatics "biggest LEGO sets" list.
- Caffeine: CSPI caffeine chart. Scoville: Guinness for Pepper X and Carolina Reaper, typical mid-range values for the rest.
- Not checked against a source (written from memory): candy serving counts for Hershey's Kisses and Reese's Pieces, fruit sugar, McDonald's calories, trophy weights, sport speed records, part counts for a piano, car and 747.

The classic deck's figures were written from general knowledge and have not been checked against sources. Most are textbook values. These are the ones to verify before sharing widely, because sources vary or the number is an estimate:

- Weight of a cumulus cloud (~500 tonnes) and of the Eiffel Tower (10,100 tonnes including non-metal parts)
- Animal top speeds: black mamba, grizzly bear, house cat, mallard, dragonfly, swift, hippo
- Mantis shrimp punch and trap-jaw ant bite speeds
- Elephant sleep (2 h, from one study of wild elephants); blue whale heart rate (as low as 2, typically quoted 8–10)
- Lifespans: queen termite, Greenland shark, bowhead whale, macaw
- Counts that are estimates: trees, ants, chickens, stars in the Milky Way, languages in Papua New Guinea, bones in a newborn
- Kiwi and emu egg weights; lion's mane jellyfish and bootlace worm lengths
- Khmer alphabet letter count (depends on what is counted)
- Populations (2020s figures; these drift)
- Taste bud counts, scallop and box jellyfish eye counts, density of fresh snow
- Records: oldest dog, cat and goldfish; deepest whale and scuba dives; the 1958 Lituya Bay wave (524 m is the run-up height on the hillside)
- Great Wall length (21,196 km is the official survey including all branches)

## Deploy

**GitHub Pages** (workflow included): push to a GitHub repository, then in *Settings → Pages* set *Source* to **GitHub Actions**. Every push to `main` runs lint, tests and build, then publishes `dist/`.

**Vercel**: import the repository. The defaults (`npm run build`, output `dist`) work as they are.

The build uses a relative base path, so it works at a domain root or under `/<repo-name>/` without changes.

## Later

Not built, on purpose, because it needs a server:

- "You beat X% of players today" and "only 12% got round 3 perfect". A single serverless function with a key-value store would do: `POST /result {day, hard, scores[3]}` increments per-day histogram buckets, `GET /stats/:day` returns them. No accounts; one submission per browser, enforced loosely with a local flag.
- More content. 52 days is a starting point, and the validation tests make adding sets safe.
