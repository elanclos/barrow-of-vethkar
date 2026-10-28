# Feature Spec: The Roots (skill tree)

**Branch**: `feature/roots-skill-tree` · **Status**: Implemented · **Design mockup**: Claude Design canvas "Barrow Roots Skill Tree"

## Why
A skill tree that makes Barrow of Vethkar distinct. Instead of a fixed tree, players grow their own root system downward into the barrow, in any direction, so no two characters grow alike.

## User stories

### P1: Grow roots with earned points
As a player with roots to grow, I open the Roots tab, tap a bud next to any root I already have, pick a root from the list, and it grows there.

- **Given** a level 4 character with 3 roots earned and 2 grown, **when** they tap a bud and choose an available root, **then** it appears on the grid, linked to the root it grew from, and 0 roots remain.
- **Given** a bud in shallow ground, **when** the player opens it, **then** deeper roots show as locked with the reason ("Grows only at Depth or deeper").
- **Given** no roots to grow, **when** the player opens a bud, **then** every option shows as unavailable.

### P1: Roots change how the character plays
Every root is enforced by the rules engine (constitution rule 2). HP, AC, check bonuses, damage, power uses, potions, status immunity and capstones all take effect in play.

### P1: Saved characters carry over
- **Given** a favorite saved before roots existed, **when** it is loaded, **then** it has level minus 1 roots to grow, its ancestry seed root, unchanged ability scores and unchanged unspent ability points.
- **Given** an autosave or a save file from before roots existed, **when** it is loaded, **then** every character gains an empty root list and loads normally.
- **Given** a favorite whose root list could not have been earned (too many, not connected, wrong depth, missing prerequisite), **when** it is loaded, **then** the bad list is dropped and the character still loads.

### P2: Roots tab reachable any time
A Roots tab beside Adventure, with a badge showing roots to grow, opens in and out of fights without spending a turn.

### P2: Hamburger menu
The top bar keeps Music, Play with friends and the AI options (local AI, cloud AI, AI DM, narrator status). Character sheet, Roots, Dice rolls, Sound, Save, Load and Help move into a menu.

### P3: Respec
Players can uproot everything and regrow, outside of a fight.

## Rules (agreed in design)
- Roots earned = level minus 1 (max 5 at level 6).
- Ancestry seed root is free and already grown.
- The grid has 6 rows: Surface (rows 0-1), Depth (2-3), The Deep (4-5).
- A root grows only on an empty cell touching a root already grown (6 hex neighbors).
- Tier 0 roots grow anywhere, tier 1 at Depth or deeper, tier 2 (capstones) only in The Deep.
- Tier 1 roots need their branch's tier 0 root. Capstones need 2 roots in their branch and level 5.
- Rootlets (Thick Root, Listening Root) are cheap repeatable steps for reaching deeper ground.
- Each class has 3 branches (tier 0, two tier 1, a capstone). Each ancestry adds one root.

## Functional requirements
- FR-001 Each character stores `roots: [{id, r, c, f}]` (`f` = the cell it grew from).
- FR-002 Growing is an intent sent to the host, validated there, applied by `apply()`.
- FR-003 Root effects are computed from the root list, never stored as numbers.
- FR-004 Favorites save and restore roots; joins with a favorite send roots to the host.
- FR-005 Growing does not spend a turn and works mid-fight, like ability points.
- FR-006 Hamburger menu closes on outside click and on Escape.

## Success criteria
- Every pre-roots save and favorite loads (tested).
- Every root's effect is observable in a rules test.
- Invalid root lists are rejected by validation (tested).
