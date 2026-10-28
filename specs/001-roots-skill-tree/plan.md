# Plan: The Roots

**Stack**: unchanged. Vanilla JS in the single `index.html`, PeerJS multiplayer, Vercel static hosting.

## Data
- `ROOT_FX` effect keys, each read at one hook point:
  `hp, ac, dmg, atk, dr, trap, uses, pdmg, pots, heal, sneak` (numbers),
  `chk:{search, talk, flee, pray, oracle, hide, stand}`,
  `fadv, fear, ward, ripo, crit, stag, unbur, bless, luck` (flags).
- `ROOTS` catalog: rootlets, one root per ancestry, 4 roots x 3 branches per class.
- `pc.roots = [{id, r, c, f}]`. Ancestry seed sits at `0,4` and is implicit (never stored).

## Functions
- `rootsOf(pc)`, `RX(pc, key)`, `rootChk(pc, kind)`: effect lookups.
- `rootOptions(pc, r, c)`: what may grow in a cell and why not.
- `validRoots(pc, list)`: replays a list from scratch through the same growth rules; returns the list or `[]`.
- `rootsEarned(pc) = lvl - 1`.

## Hooks into existing code
| Hook | Root keys |
|---|---|
| `calcHpMax`, `calcAC` | hp, ac |
| `Rules.check` | chk.* (adds `hide` and `stand` kinds) |
| `Rules.attack` | atk, dmg, fadv, crit, stag, sneak, luck |
| `Rules.power` | pdmg |
| `Rules.monsterTurn` | dr |
| `apply()` scrape / fxon / potion / miss | trap, fear+ward, heal, ripo |
| `hurt()` | unbur (once per run) |
| `fightStart()` (replaces 4 copies of the fight-start reset) | bless, luck reset |
| `newPC` / `applyProgress` / `levelUp` / grow event | uses, pots, hp, ac refresh |

## Network and saves
- New intent `grow` (and `uproot`) handled before the busy lock, like `asi`.
- `apply` event `grow` mutates; Narrator line for it.
- `ensureTraitorField` also normalizes roots, so autosave, file load and guest state all migrate.
- Favorites snapshot and join `prog` carry `roots`; `applyProgress` validates them.

## UI
- Tabs `Adventure | Roots` at the top of `#main`. Roots view is an SVG hex grid (viewBox, scales to phone) plus a detail panel.
- `#top` gets a hamburger menu; Dice, Sound, Save, Load, Help, Sheet and Roots move in.

## Testing
Node harness that extracts the script, stubs the DOM and runs rules checks (see `tests/roots.test.js`).
