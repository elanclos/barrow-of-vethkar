# The Barrow of Vethkar

A single-file, browser-based D&D-style dungeon crawl — play solo, or host up to
three friends over a peer-to-peer connection. No build step, no server-side
game state: `index.html` is the entire game.

**Play it live:** https://barrow-of-vethkar.vercel.app/

## What it is

A deterministic rules engine (dice, hit points, inventory, death — all decided
in code, never by an AI) paired with a narrator that turns each outcome into
prose. Play by picking from 3–4 concrete choices each turn, or type what you
want to do in plain English — a small parser maps free text to the same
underlying actions.

- **Solo or multiplayer.** Host a game and read out the four-letter room
  code; up to three friends join as their own characters. The host's browser runs the rules; guests
  send intents and receive results, so a modified guest client can't cheat.
- **Four dungeons** to choose from at character creation — a barrow, a
  drowned chancel, a wood that will not stop growing, and the Sunken Reef
  (fully underwater, with teleport traps) — each with its own monsters,
  rooms, atmosphere and prize.
- **Eight classes, ten ancestries (including Triton), six backgrounds**, each
  with mechanical effects (not just flavor text) built on the SRD 5.2.1
  ruleset.
- **Levelling up.** XP earns levels; every level grants 2 ability points the
  player spends on the abilities they choose (max 20). Points can be spent
  any time — mid-fight, between turns, or on the victory screen — and never
  cost an action.
- **Favorite characters.** Save any character (name, look, level, XP and
  ability scores) to the browser and bring them into a new run; each run
  starts with the class's own kit. Every player, guests included, can
  save; saved favorites update automatically as the character progresses.
- **Status effects** (poisoned, stunned, burning and more) that last one or
  several turns, shown as chips on the turn bar.
- **Keys and locks.** Find a rusty key and a locked chest or door turns up
  ahead with treasure behind it — unless it's a mimic.
- **Cutting Words** insults are shown to every player at the table.
- **Woodcut silhouette art**, all vector and drawn in code (no image
  downloads): an animated battle scene behind the story whenever a monster
  attacks, a scene for each area as the party enters it (entrance, interiors
  and vault, tinted per dungeon), and an icon for every item — shown as a
  card when it's found and beside it in the inventory.
- **Traitor Mode** (2+ players): the host can secretly arm it. Arming it is
  silent — nobody else is told the mode is even on, and the state their
  browser receives says it was never switched on. One party member is chosen
  at random as the traitor, invisibly to everyone, even the host's own
  screen. They get secret sabotage/aid actions the rest of the party only
  ever sees as ordinary bad luck or good fortune. Once the real dungeon boss
  falls, the traitor alone is told the way is open, and chooses their own
  moment to turn — one turn later, on the last step out, or never. When they
  do, they become the true final boss under a name only they chose.
- **Table music.** Paste a YouTube link and every viewer gets their own
  embedded player with real controls; the host's pick just seeds what's
  playing for everyone.
- **Optional AI narration**, off by default and never load-bearing:
  - *Connect local AI* — talks to a model running on your own machine via
    [Ollama](https://ollama.com).
  - *Connect cloud AI* — no install required; calls this deployment's own
    `/api/narrate` function, which rewords outcomes via
    [Groq](https://console.groq.com)'s free-tier API. See
    [Cloud AI setup](#cloud-ai-setup) below to turn it on.

  Either way, the model only ever rewrites the sentence describing an
  outcome that dice and rules have already locked in — it never decides a
  hit, a roll, or a death.
- **Optional AI Dungeon Master** (cloud AI): `/api/dm` lets the model act in
  the rooms the party enters (a wandering monster, a trap, hidden loot, a
  helping hand) and judge freeform actions. It only ever chooses from fixed menus the game offers, and the
  dice still decide every outcome.
- Manual dice-rolling ceremony, sound effects, mobile-friendly layout, and
  save/load to a local file — all client-side, no account or database.

## Running it

Just open `index.html` in a browser for solo play. Multiplayer hosting and
the YouTube embed need a real `https://` origin (browsers block both from a
local `file://` page), which is what the Vercel deployment above provides —
open an issue or fork if you want to self-host elsewhere.

## Cloud AI setup

The "Connect cloud AI" button (and the AI Dungeon Master, `/api/dm`) needs one environment variable on whatever
deployment is serving the game:

| Variable | Required | Purpose |
|---|---|---|
| `GROQ_API_KEY` | yes | A free key from [console.groq.com/keys](https://console.groq.com/keys). Without it, `/api/narrate` returns a clean "not configured" response and the game falls back to built-in narration. |
| `NARRATE_CLIENT_KEY` | no | If set, `/api/narrate` and `/api/dm` only accepts requests carrying a matching `x-barrow-key` header (the client already sends the fixed value `barrow-of-vethkar`). This is a light deterrent against random bots hitting the endpoint, not real security — the value is visible in this repo's own client code. |

On Vercel: Project → Settings → Environment Variables → add `GROQ_API_KEY` →
redeploy.

## Licensing

Uses content from the SRD 5.2.1, © Wizards of the Coast, licensed under
[CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/). "Dungeons &
Dragons" and the D&D logo are trademarks of Wizards of the Coast and are not
used here.