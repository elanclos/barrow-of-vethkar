// Headless checks for the Roots skill tree.
// Run:  npm i --no-save jsdom && node tests/roots.test.js
// Every check here can fail: each effect is compared against an otherwise
// identical character without the root, with the dice fixed.
const fs = require("fs"), path = require("path");
const { JSDOM } = require("jsdom");

const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const dom = new JSDOM(html, { runScripts: "dangerously", pretendToBeVisual: true, url: "https://barrow.test/" });
const w = dom.window, E = (code) => w.eval(code);

let pass = 0, fail = 0;
function ok(cond, name){ if(cond){ pass++; } else { fail++; console.log("FAIL:", name); } }
function eq(a, b, name){ ok(JSON.stringify(a) === JSON.stringify(b), `${name} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// A fixed character, no dice involved in its stats.
E(`globalThis.__mk = (cls, anc, lvl, roots) => {
  const pc = newPC("Test", cls, anc||"Human", "Soldier");
  pc.ab = {str:14, dex:14, con:14, int:12, wis:12, cha:12};
  return applyProgress(pc, {lvl, xp:XP_NEED[lvl-1], ab:pc.ab, asi:0, roots});
};
globalThis.__world = (pcs) => { S = newWorld(pcs[0], "barrow"); pcs.slice(1).forEach(p=>S.party.push(p)); S.me = 0; return S; };`);

// ---- catalog ----
const cat = E(`(() => {
  const out = {};
  for (const c of Object.keys(CLASSES)) {
    const br = Object.values(ROOT_BRANCHES).filter(b => b.cls === c);
    out[c] = br.map(b => Object.values(ROOTS).filter(r => r.br === c + ":" + b.key).map(r => r.t).join(""));
  }
  return out;
})()`);
for (const [c, tiers] of Object.entries(cat)) eq(tiers, ["0112", "0112", "0112"], `${c} has 3 branches of tiers 0,1,1,2`);
ok(E(`Object.keys(ANCESTRIES).every(a => Object.values(ROOTS).some(r => r.anc === a))`), "every ancestry has a root");
ok(E(`Object.values(ROOTS).every(d => rootText(d, "Fighter").length > 0)`), "every root describes itself from its effects");
const KNOWN = ["hp","ac","dmg","atk","dr","trap","uses","pdmg","pots","heal","sneak","chk","fadv","fear","ward","ripo","crit","stag","unbur","bless","luck"];
ok(E(`Object.values(ROOTS).every(d => Object.keys(d.fx).every(k => ${JSON.stringify(KNOWN)}.includes(k)))`), "every effect key is one the engine reads");

// ---- old saves translate ----
E(`globalThis.__old = newPC("Old", "Fighter", "Dwarf", "Soldier");`);
E(`__old.ab = {str:16, dex:11, con:15, int:9, wis:12, cha:10};`);
E(`applyProgress(__old, {lvl:4, xp:820, ab:{str:16, dex:11, con:15, int:9, wis:12, cha:10}, asi:1});`);  // pre-roots favorite
eq(E(`rootsOf(__old)`), [], "pre-roots favorite loads with no roots grown");
eq(E(`rootsLeft(__old)`), 3, "level 4 favorite has 3 roots to grow");
eq(E(`__old.asi`), 1, "unspent ability points kept");
eq(E(`__old.ab.str`), 16, "ability scores kept");
E(`globalThis.__st = {party:[{name:"A", cls:"Rogue", anc:"Elf", lvl:3, ab:{str:10,dex:16,con:12,int:10,wis:10,cha:10}, hp:20, hpMax:20, power:{name:"Sneak Attack",uses:99}}], journal:[], flags:{}};`);
E(`ensureTraitorField(__st)`);
eq(E(`__st.party[0].roots`), [], "pre-roots autosave / save file gains an empty root list");

// ---- validation: replayed, never trusted ----
const good = [{id:"figh.steel0", r:1, c:3, f:"0,4"}, {id:"earth.thick", r:2, c:3, f:"1,3"}, {id:"figh.steel1", r:3, c:3, f:"2,3"}];
eq(E(`validRoots(__mk("Fighter","Human",4), ${JSON.stringify(good)}).length`), 3, "a legal path is kept");
eq(E(`validRoots(__mk("Fighter","Human",3), ${JSON.stringify(good)}).length`), 0, "more roots than earned: dropped");
eq(E(`validRoots(__mk("Fighter","Human",4), [{id:"figh.steel0", r:3, c:3, f:"2,3"}]).length`), 0, "a root touching nothing: dropped");
eq(E(`validRoots(__mk("Fighter","Human",4), [{id:"figh.steel0", r:1, c:3}, {id:"figh.steel1", r:1, c:2}]).length`), 0, "tier 1 at the Surface: dropped");
eq(E(`validRoots(__mk("Fighter","Human",4), [{id:"rogu.knives0", r:1, c:3}]).length`), 0, "another class's root: dropped");
eq(E(`validRoots(__mk("Fighter","Human",4), [{id:"earth.thick", r:1, c:3}, {id:"figh.steel1", r:2, c:3}]).length`), 0, "tier 1 without its tier 0: dropped");
const capPath = [{id:"figh.steel0", r:1, c:3}, {id:"figh.steel1", r:2, c:3}, {id:"earth.thick", r:3, c:3}, {id:"figh.steel3", r:4, c:3}];
eq(E(`validRoots(__mk("Fighter","Human",5), ${JSON.stringify(capPath)}).length`), 4, "level 5 can reach a capstone in The Deep");
eq(E(`validRoots(__mk("Fighter","Human",4), ${JSON.stringify(capPath.slice(0,3).concat([{id:"figh.steel3", r:3, c:2}]))}).length`), 0, "capstone above The Deep: dropped");
eq(E(`validRoots(__mk("Fighter","Human",6), [{id:"earth.thick",r:1,c:3},{id:"earth.thick",r:1,c:4},{id:"earth.thick",r:0,c:3},{id:"earth.thick",r:0,c:5},{id:"earth.thick",r:1,c:2}]).length`), 5, "rootlets repeat");
eq(E(`validRoots(__mk("Fighter","Human",6), [{id:"figh.steel0",r:1,c:3},{id:"figh.steel0",r:1,c:4}]).length`), 0, "a normal root only once");

// ---- effects: each against an identical character without the root ----
eq(E(`calcHpMax(__mk("Fighter","Human",2,[{id:"earth.thick",r:1,c:3}])) - calcHpMax(__mk("Fighter","Human",2))`), 3, "Thick Root +3 max hp");
eq(E(`calcAC(__mk("Fighter","Human",2,[{id:"figh.bulwark0",r:1,c:3}])) - calcAC(__mk("Fighter","Human",2))`), 1, "Shield Wall +1 AC");
eq(E(`calcAC(__mk("Rogue","Human",3,[{id:"rogu.shadow0",r:1,c:3},{id:"rogu.shadow1",r:2,c:3}])) - calcAC(__mk("Rogue","Human",3))`), 1, "Dodge +1 AC on the Rogue's own formula");
eq(E(`__mk("Fighter","Human",2,[{id:"figh.bulwark0",r:1,c:3}]).ac`), 17, "loaded favorite AC is recomputed with roots");

// fixed dice from here on
E(`globalThis.__fix = (v) => { R.d = () => v; R.parse = (f) => { const m=String(f).match(/(\\d+)d(\\d+)([+-]\\d+)?/); return m ? (+m[1])*(+m[2])+(+(m[3]||0)) : +f; }; R.dice = (n, s) => n*s; };`);
E(`__fix(10)`);
E(`__world([__mk("Fighter","Human",2), __mk("Fighter","Human",2,[{id:"figh.warlord0",r:1,c:3}])]);`);
// check bonuses (Read the Field needs depth; use Rogue Sharp Eyes / Fast Talk instead)
E(`__world([__mk("Rogue","Human",2), __mk("Rogue","Human",2,[{id:"rogu.fortune0",r:1,c:3}])]);`);
eq(E(`Rules.check(1,"wis",12,false,"search").b - Rules.check(0,"wis",12,false,"search").b`), 2, "Sharp Eyes +2 on searching");
eq(E(`Rules.check(1,"wis",12,false,"talk").b - Rules.check(0,"wis",12,false,"talk").b`), 0, "Sharp Eyes does not leak into talking");
E(`__world([__mk("Halfling" in CLASSES ? "Fighter" : "Fighter","Halfling",2), __mk("Fighter","Halfling",2,[{id:"anc.halfling",r:1,c:3}])]);`);
eq(E(`Rules.check(1,"dex",12,true,"hide").b - Rules.check(0,"dex",12,true,"hide").b`), 2, "Nimble Escape +2 hiding (hide is a real check kind)");
E(`__world([__mk("Fighter","Human",2), __mk("Fighter","Human",2,[{id:"anc.human",r:1,c:3}])]);`);
eq(E(`Rules.lastStand(1).b - Rules.lastStand(0).b`), 3, "Stubborn +3 on a last stand");

// attacks
E(`__world([__mk("Fighter","Human",2), __mk("Fighter","Human",2,[{id:"figh.steel0",r:1,c:3}])]); S.fight = spawn("rat"); S.fight.ac = 5; S.fight.hp = 999; S.round = 2;`);
eq(E(`Rules.attack(1, S.fight)[0].dmg - Rules.attack(0, S.fight)[0].dmg`), 1, "Hewing Edge +1 weapon damage");
E(`__world([__mk("Fighter","Human",5), __mk("Fighter","Human",5,${JSON.stringify(capPath)})]); S.fight = spawn("rat"); S.fight.ac = 5; S.fight.hp = 999; S.round = 2; __fix(19);`);
eq(E(`[Rules.attack(0, S.fight)[0].crit, Rules.attack(1, S.fight)[0].crit]`), [false, true], "Sunder the Dead crits on 19");
eq(E(`Rules.attack(1, S.fight).find(e=>e.t==="fxon").turns`), 2, "Sunder the Dead staggers for two turns");
E(`__fix(10); S.round = 1;`);
eq(E(`[Rules.attack(0, S.fight)[0].adv, Rules.attack(1, S.fight)[0].adv]`), [false, true], "Opening Cut: advantage in round 1");
E(`S.round = 2;`);
eq(E(`Rules.attack(1, S.fight)[0].adv`), false, "Opening Cut: no advantage after round 1");
E(`__world([__mk("Rogue","Human",3), __mk("Rogue","Human",3,[{id:"rogu.knives0",r:1,c:3},{id:"rogu.knives1",r:2,c:3}])]); S.fight = spawn("rat"); S.fight.ac = 5; S.fight.hp = 999; S.round = 1;`);
eq(E(`Rules.attack(1, S.fight)[0].sneak - Rules.attack(0, S.fight)[0].sneak`), 6, "Twist the Knife: Sneak Attack +1d6");
eq(E(`Rules.attack(1, S.fight)[0].b - Rules.attack(0, S.fight)[0].b`), 1, "Quick Blade +1 to hit");
E(`__fix(1);`);
eq(E(`(()=>{ const p=__mk("Rogue","Human",6,[{id:"rogu.fortune0",r:1,c:3},{id:"rogu.fortune1",r:2,c:3},{id:"earth.thick",r:3,c:3},{id:"rogu.fortune3",r:4,c:3}]); __world([p]); S.fight=spawn("rat"); S.fight.hp=999; let n=0; R.d=()=>(++n===1?1:15); return Rules.attack(0,S.fight)[0].lucky; })()`), true, "Charmed Life rerolls a 1");

// power
E(`__fix(4); __world([__mk("Wizard","Human",2), __mk("Wizard","Human",2,[{id:"wiza.evoke0",r:1,c:3}])]); S.fight = spawn("rat"); S.fight.hp = 999;`);
eq(E(`Rules.power(1, S.fight).find(e=>e.t==="hit").dmg - Rules.power(0, S.fight).find(e=>e.t==="hit").dmg`), 2, "Sharpened Will: Magic Missile +2");
eq(E(`__mk("Wizard","Human",3,[{id:"wiza.evoke0",r:1,c:3},{id:"wiza.evoke1",r:2,c:3}]).power.uses - __mk("Wizard","Human",3).power.uses`), 1, "Deep Reserves +1 power use");

// monster hits, statuses, potions
E(`__fix(15); __world([__mk("Ranger","Human",2), __mk("Ranger","Human",2,[{id:"rang.wild0",r:1,c:3}])]); S.fight = spawn("skeleton"); S.fight.atk = 30;`);
E(`globalThis.__dealt = (i) => { const ev = Rules.monsterTurn({...S.fight, atks:1}); return ev; };`);
E(`S.party[0].down = true;`); const hitWith = E(`__dealt().find(e=>e.t==="hit").dmg`);
E(`S.party[0].down = false; S.party[1].down = true;`); const hitWithout = E(`__dealt().find(e=>e.t==="hit").dmg`);
eq(hitWithout - hitWith, 1, "Weathered: blows land 1 less");
E(`__world([__mk("Fighter","Human",3,[{id:"figh.bulwark0",r:1,c:3},{id:"figh.bulwark1",r:2,c:3}])]); S.fight = spawn("rat");`);
E(`apply([{t:"fxon", vs:0, fx:"frightened", turns:3}]);`);
ok(!E(`hasFx(S.party[0], "frightened")`), "Hold the Line: cannot be frightened");
E(`apply([{t:"fxon", vs:0, fx:"poisoned", turns:3}]);`);
ok(E(`hasFx(S.party[0], "poisoned")`), "Hold the Line does not stop poison");
E(`__world([__mk("Fighter","Human",2,[{id:"figh.warlord0",r:1,c:3}])]); S.party[0].hp = 1; S.party[0].potions = 1;`);
eq(E(`apply([{t:"potion", src:0, amt:5}])[0].amt`), 7, "Field Dressing: potions heal +2");
E(`__world([__mk("Fighter","Human",5,[{id:"figh.bulwark0",r:1,c:3},{id:"figh.bulwark1",r:2,c:3},{id:"earth.thick",r:3,c:3},{id:"figh.bulwark3",r:4,c:3}])]);`);
E(`S.party[0].hp = 5; hurt(0, 50);`);
eq(E(`[S.party[0].hp, S.party[0].down]`), [1, false], "Unburied: the killing blow leaves 1 hp");
E(`hurt(0, 50);`);
eq(E(`S.party[0].down`), true, "Unburied: only once per run");
E(`__world([__mk("Fighter","Human",3,[{id:"figh.steel0",r:1,c:3},{id:"figh.steel2",r:2,c:3}])]); S.fight = spawn("rat");`);
E(`apply([{t:"miss", src:"mob", vs:0}]);`);
eq(E(`S.party[0].edge`), true, "Riposte: a monster's miss gives advantage");
E(`__world([__mk("Fighter","Human",6,[{id:"figh.warlord0",r:1,c:3},{id:"figh.warlord1",r:2,c:3},{id:"earth.thick",r:3,c:3},{id:"figh.warlord3",r:4,c:3}]), __mk("Cleric","Human",2)]); fightStart();`);
eq(E(`[hasFx(S.party[0],"blessed"), hasFx(S.party[1],"blessed")]`), [true, true], "Sable Standard blesses the whole party at a fight's start");
E(`__world([__mk("Fighter","Human",2), __mk("Cleric","Human",2)]); fightStart();`);
eq(E(`hasFx(S.party[0],"blessed")`), false, "no bless without the root");

// ---- growing through the real turn path ----
E(`Net.mode = "solo"; __world([__mk("Fighter","Dwarf",4)]); G.busy = false;`);
E(`G.perform(0, "grow", null, {id:"figh.bulwark0", r:1, c:3});`);
eq(E(`[rootsOf(S.party[0]).length, rootsLeft(S.party[0]), S.party[0].ac]`), [1, 2, 17], "grow: root added, point spent, AC refreshed");
E(`G.perform(0, "grow", null, {id:"figh.bulwark1", r:1, c:2});`);
eq(E(`rootsOf(S.party[0]).length`), 1, "grow: tier 1 at the Surface refused by the host");
E(`G.perform(0, "grow", null, {id:"figh.warlord2", r:2, c:3});`);
eq(E(`rootsOf(S.party[0]).length`), 1, "grow: tier 1 without its branch refused");
const potsBefore = E(`S.party[0].potions`);
E(`G.perform(0, "grow", null, {id:"anc.dwarf", r:1, c:4});`);
eq(E(`rootsLeft(S.party[0])`), 1, "grow: ancestry root");
E(`G.perform(0, "grow", null, {id:"earth.thick", r:0, c:3});`);
E(`G.perform(0, "grow", null, {id:"earth.thick", r:0, c:5});`);
eq(E(`rootsOf(S.party[0]).length`), 3, "grow: refused once no roots are left");
E(`G.perform(0, "uproot");`);
eq(E(`[rootsOf(S.party[0]).length, S.party[0].ac, S.party[0].uprooted]`), [0, 16, true], "uproot: everything back, stats recomputed");
E(`G.perform(0, "grow", null, {id:"figh.bulwark0", r:1, c:3}); G.perform(0, "uproot");`);
eq(E(`rootsOf(S.party[0]).length`), 1, "uproot: only once per run");
eq(E(`S.party[0].potions`), potsBefore, "potions unchanged by grow/uproot without a potion root");
E(`__world([__mk("Rogue","Human",3)]); const p0 = S.party[0].potions; G.perform(0, "grow", null, {id:"rogu.fortune0", r:1, c:3}); G.perform(0, "grow", null, {id:"rogu.fortune1", r:2, c:3}); globalThis.__pd = S.party[0].potions - p0;`);
eq(E(`__pd`), 1, "Light Fingers: +1 potion when grown");

// ---- favorites round trip ----
E(`__world([__mk("Fighter","Dwarf",4,[{id:"figh.bulwark0",r:1,c:3}])]); globalThis.__snap = Favorites.snapshot(S.party[0]);`);
eq(E(`__snap.roots.length`), 1, "favorite snapshot carries roots");
eq(E(`Favorites.build(__snap).ac`), 17, "favorite rebuild restores roots and their effects");

// ---- UI renders ----
E(`__world([__mk("Fighter","Dwarf",4,[{id:"figh.bulwark0",r:1,c:3}])]); sync(); G.tab("roots");`);
ok(E(`document.getElementById("log").hidden && !document.getElementById("rootsview").hidden`), "Roots tab swaps the view");
ok(E(`document.querySelectorAll("#rootsview .rnode").length >= 4`), "Roots grid draws roots and buds");
eq(E(`document.getElementById("rootbadge").textContent`), "2", "Roots badge shows roots to grow");
E(`G.tab("adv")`);
ok(E(`!document.getElementById("log").hidden`), "Adventure tab restores the log");
ok(E(`!!document.querySelector("#menu #dicebtn") && !!document.querySelector("#top #musicbtn") && !!document.querySelector("#top #mpbtn")`), "menu holds Dice; Music and Play with friends stay in the bar");

console.log(`roots: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
