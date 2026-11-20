# Peckish

A daily ordering puzzle. Play it here: https://darrock712.github.io/pecking-order/

<img src="docs/start.png" alt="Peckish start screen: five birds on a wire, smallest to largest, above today's three rounds and a Play button" width="420">

You get three rounds a day, same as everyone else. Each round gives you five things and a rule like "weakest to strongest bite" or "oldest to newest", and you drag them into order. If your first try is wrong you get told "not quite", you can check two tiles, and then you lock in a final answer. The reveal shows bars for the real values so you can see how far off you were. A day takes about a minute. There's no account, it all runs in the browser.

I made this to have a small finished thing I could actually show people, not another tutorial project.

## Stack

React 19 and TypeScript (strict), built with Vite and plain CSS. Tests are Vitest (228 of them, mostly game rules, date math, save loading and the puzzle data). Linting is oxlint. GitHub Actions runs lint, tests and build on every push and deploys to GitHub Pages.

It's also a PWA, so you can add it to your home screen and it works offline. The share card is drawn on a canvas and sent through the Web Share API, sounds are made with Web Audio, and phones get a little vibration. There's no backend. Progress is saved in `localStorage`.

## How it's put together

The game rules live in `src/game/` as plain functions with no React in them: picking the day's puzzle, the seeded shuffle, scoring, stats and reading saves. The UI just calls those, which made them easy to test on their own.

Each set is stored already in the right order, so a tile is correct when its index matches its slot. That kept scoring short and made bad content easy to spot.

The puzzle number comes from your local date, converted to UTC midnight before doing the subtraction. My first version just counted days since launch and it broke on daylight saving, skipping or repeating a day.

The puzzle data gets tested too. Every set needs five different items in rising order, gaps big enough to be fair, a teaser line, and a partner set for hard mode. If someone adds a bad set, the build fails.

I don't trust anything read back from storage. Old saves, half-written saves and hand-edited ones get rebuilt field by field, so they can't crash the game or fake a score. Your first try and used checks are saved right away, so reloading doesn't give you a fresh attempt.

For accessibility, tiles keep the same DOM order and move with CSS, so keyboard focus doesn't jump around while you reorder. Drag, tap-to-swap and arrow keys all work, screen readers get labels and announcements, and reduced motion is respected.

Sharing doesn't spoil anything: it's an emoji grid plus a PNG card. Phones open the share sheet, desktops copy the text, and there's a "Save image" button for the card.

## Features

- Three rounds a day: a warm-up, a harder one, and a twist
- Two tries per round, with two tile checks in between
- A rank that starts as an egg, cracks as you earn points and hatches into the next bird when you rank up
- Mixed-bag rounds every other day from day 5: five things in five different units, ranked by the plain number
- Hard mode hides the rule and only shows one solved example
- Streaks count days you played, not days you won
- Practice rounds and an archive of past days (neither counts toward stats)
- Light and dark themes, installable, works offline

## Scoring

| | Points |
|---|---|
| Tile in the right slot | 6 |
| Tile fixed on the second try | 4 |
| Tile one place off | 3 |
| Perfect round (right first time) | +3 |
| Perfect day | +1 |

A round is worth up to 33, so a perfect day comes out to exactly 100.

## Privacy and security

No account, no analytics, no cookies. Everything stays in your browser.

The font is self-hosted so nothing loads from another site, which lets the CSP be `'self'` only. Two open tabs stay in sync through the `storage` event, and each write is tagged with its round so an old tab can't overwrite a newer one.

In CI every action is pinned to a commit SHA, the workflow doesn't keep a token around, and high-severity `npm audit` findings fail the build. Dependabot watches npm and the actions.

GitHub Pages can't set response headers, so `frame-ancestors` and HSTS would need a host like Cloudflare Pages or Netlify.

## Running it

Needs Node 22+.

```bash
npm install
npm run dev      # dev server (add ?day=N to jump to a puzzle)
npm test         # unit tests + content checks
npm run lint
npm run build    # production build in dist/
npm run og       # rebuild public/og.png from public/og.svg (needs local Chrome or Edge)
```

```
src/
  game/         rules, no React: daily puzzle, scoring, stats, save parsing
  data/         puzzle content and its tests
  components/   Home, Round (arrange, checks, reveal), RankCard + Egg, Summary, help dialog
  lib/          number formatting, share card, sound and haptics
scripts/        og image generator
```

## Things I learned

Daylight saving will break a naive day counter. Content needs tests just as much as code does here, since the puzzles are the whole product. Testing at phone width caught tap targets that were too small and a dialog that lost keyboard focus on Escape. Safari only opens the share sheet straight from a tap, so the share card has to be drawn ahead of time instead of when you press the button. And I left out anything that needs a server rather than half-building it (see Later).

## Content

There are 156 sets, enough for 52 days before it loops. They come from two decks, 120 classic sets and 36 "fun stats" sets (snack serving sizes, YouTube subscribers, bite force, LEGO piece counts, caffeine, sugar, spice, world records), dealt alternately. `npm test` checks that every set has five unique items in rising order, gaps of at least 8% (or 3 years / 5 degrees), a short teaser and a hard-mode partner.

### Mixed-bag sources

The twelve mixed-bag sets are in `src/data/mixed.ts`. Tests require five different units per set and at least a 20% gap between neighbours. Checked online in November 2026: Big Mac 580 kcal (mcdonalds.com US product page), LEGO Titanic 9,090 and LEGO Eiffel Tower 10,001 pieces (Brick Fanatics), Bohemian Rhapsody 5:55 (Radio X), Bugatti Chiron limited to 261 mph (Motor Authority), male hippo about 3,400 lb (San Diego Zoo fact sheet), General Sherman 274.9 ft (NPS figure via Wikipedia), Boeing 747-400 cruise about 567 mph, ostrich egg about 2,000 kcal, hummingbird heart up to about 1,200 beats a minute in flight, Golden Gate Bridge towers 746 ft above the water (goldengate.org).

Not checked against a source (well-known values I wrote from memory): the rest of the mixed deck, including the Great Pyramid's current height, cheetah, greyhound, Concorde and ISS speeds, giraffe height, T. rex length, blue whale weight, Titanic length, Everest and Eiffel Tower heights, and the counts (keys, bones, teeth, stitches, tiles, floors).

### Fun stats sources

Checked against sources in November 2026. Fuzzy numbers show as "about" in the game, and the gaps are wide enough that a small correction won't flip the order.

- Serving sizes: US Nutrition Facts labels as listed by grocers (Goldfish 55 pieces, Cheez-It 27, Triscuit 6, Ritz 5, Doritos about 12, Lay's about 15). These change with bag size, and listings for Lay's and Pringles disagree by a few chips.
- YouTube subscribers: Soundstripe, HypeAuditor and Tubefilter charts, October 2026 (MrBeast about 520 million, T-Series 316 million, Cocomelon about 200 million). These go out of date fastest, so recheck every few months.
- Bite force: Field & Stream and BBC Science Focus lists. Only the crocodile number was measured directly; the rest are estimates.
- LEGO piece counts: Brick Fanatics "biggest LEGO sets" list.
- Caffeine: CSPI caffeine chart. Scoville: Guinness for Pepper X and Carolina Reaper, typical mid-range values for the rest.
- World records, rechecked November 2026: marathon 1:59:30 (Sabastian Sawe, London 2026, ratified by World Athletics), Rubik's Cube single 2.51 s (Xuanyi Geng, October 2026, from news reports of the WCA result), heaviest pumpkin 1,431.5 kg (Ron Wallace, October 2026, Guinness). Reese's Pieces serving of 51 pieces is from Hershey's SmartLabel.
- Fastest baseball pitch: 105.8 mph (170.3 km/h), Aroldis Chapman, 2010, per Guinness. Some lists use the first radar reading of 105.1 mph.
- Not checked (from memory): Hershey's Kisses serving count, fruit sugar, McDonald's calories (I couldn't find McDonald's own per-item numbers), trophy weights, the other sport speed records, and part counts for a piano, car and 747.

Three classic-deck sets were also checked in November 2026:

- Blue whale heart rate: 4 to 8 beats a minute on a dive and as low as 2, but 25 to 37 at the surface (Goldbogen et al., PNAS 2019). The item now says "on a dive".
- Kiwi and emu eggs: brown kiwi about 440 g, emu 500 to 700 g, so the order holds.
- The height set used to have an ostrich at 2.5 m. Big males get to about 2.8 m, taller than the tallest man (2.72 m), so I swapped it for a standard door (2.03 m).

The rest of the classic deck is from general knowledge. I reread it in November 2026 and didn't find a wrong order, but it hasn't been checked against sources. These are the ones worth verifying, because sources vary or the number is an estimate:

- Weight of a cumulus cloud (~500 tonnes) and of the Eiffel Tower (10,100 tonnes including non-metal parts)
- Animal top speeds: black mamba, grizzly bear, house cat, mallard, dragonfly, swift, hippo
- Mantis shrimp punch and trap-jaw ant bite speeds
- Elephant sleep (2 h, from one study of wild elephants)
- Lifespans: queen termite, Greenland shark, bowhead whale, macaw
- Estimated counts: trees, ants, chickens, stars in the Milky Way, languages in Papua New Guinea, bones in a newborn
- Lion's mane jellyfish and bootlace worm lengths
- Khmer alphabet letter count (depends on what you count)
- Populations (2020s figures, these drift)
- Taste bud counts, scallop and box jellyfish eye counts, density of fresh snow
- Records: oldest dog, cat and goldfish; deepest whale and scuba dives; the 1958 Lituya Bay wave (524 m is the run-up height on the hillside)
- Great Wall length (21,196 km is the official survey including all branches)

## Deploying

GitHub Pages: the workflow is included. Push to GitHub, then under Settings → Pages set Source to GitHub Actions. Every push to `main` runs lint, tests and build, then publishes `dist/`.

Vercel: import the repo. The defaults (`npm run build`, output `dist`) work as-is.

The build uses a relative base path, so it works at a domain root or under `/<repo-name>/`.

### Custom domain (peckish.io)

Not set up yet. Once the domain is registered:

1. Add `public/CNAME` with the single line `peckish.io` and push.
2. At the registrar, add four `A` records for `@`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`, and a `CNAME` for `www` pointing at `darrock712.github.io`.
3. Under Settings → Pages, enter `peckish.io` as the custom domain, wait for the DNS check, then tick Enforce HTTPS.

Saves are stored per site address, so streaks from the `github.io` address won't carry over to the new domain.

## Later

These need a server, so I left them out for now:

- "You beat X% of players today" and "only 12% got round 3 perfect". One serverless function and a key-value store would cover it: `POST /result {day, hard, scores[3]}` bumps per-day histogram buckets and `GET /stats/:day` returns them. No accounts, one submission per browser, enforced loosely with a local flag.
- More puzzles. 52 days is a start, and the content tests make adding sets safe.
