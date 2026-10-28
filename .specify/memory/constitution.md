# Barrow of Vethkar Constitution

Derived from how the game is already built. Every feature is checked against these.

1. **Dice and rules decide, never the AI.** The rules engine settles every outcome. AI narration only rewords locked results.
2. **Every trait is real.** Nothing printed on a character is flavor text. If it is shown, the rules engine enforces it.
3. **The host is authoritative.** Guests send intents, the host validates and applies. A modified guest client must not be able to cheat.
4. **Never trust saved numbers.** Loaded progress is clamped and recomputed. A save that could not have been earned is dropped, and the character still loads.
5. **One file, no build step.** `index.html` is the game. No frameworks, no bundler.
6. **Old saves keep working.** New fields default safely so every earlier save and favorite loads.
7. **Phone first.** Every screen works at phone width with 44px touch targets.
8. **Small, verifiable patches.** Each change ships with a check that actually discriminates (a test that could fail).
