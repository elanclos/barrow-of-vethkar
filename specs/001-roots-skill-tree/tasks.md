# Tasks: The Roots

## Phase 1: Data
- [x] T001 Add `ROOT_FX` helpers, grid geometry and `ROOTS` catalog (all 8 classes, 10 ancestries, rootlets) to `index.html`
- [x] T002 Add `rootOptions`, `validRoots`, `rootsEarned`

## Phase 2: Rules hooks (US: roots change play)
- [x] T003 `calcHpMax` / `calcAC` read hp / ac
- [x] T004 `Rules.check` reads chk.*; add `hide`, `stand` kinds
- [x] T005 `Rules.attack`: atk, dmg, fadv, crit range, stagger length, sneak dice, luck
- [x] T006 `Rules.power`: pdmg; power uses at start and on level-up
- [x] T007 `monsterTurn` dr; `apply` scrape trap, fxon fear/ward, potion heal, miss riposte
- [x] T008 `hurt` unburied; `fightStart()` with bless and luck reset

## Phase 3: Growth (US: grow roots)
- [x] T009 `grow` / `uproot` intents in `perform`, `apply` events, narrator lines
- [x] T010 Roots tab view, buds, options panel, detail panel

## Phase 4: Saves (US: carry over)
- [x] T011 Favorites snapshot + join `prog` carry roots; `applyProgress` validates
- [x] T012 `ensureTraitorField` migrates roots on every load path

## Phase 5: Menu (US: hamburger)
- [x] T013 Hamburger menu, keep Music / AI / Play with friends in the bar

## Phase 6: Verify
- [x] T014 `tests/roots.test.js`: catalog integrity, every effect observable, validation, old-save migration
