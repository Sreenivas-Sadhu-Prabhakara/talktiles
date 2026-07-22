"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const E = require("../data/engine.js");

/* Deterministic PRNG so a failure is reproducible (cyrb53 seed -> mulberry32). */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

test("property: composeSentence output has no leading/trailing/double spaces (5000 seeds)", () => {
  const rnd = mulberry32(0x1a2b3c4d);
  const words = ["I want", "water", "please", "the", "my", "help", "  ", "", "again", "now", " food "];
  for (let i = 0; i < 5000; i++) {
    const n = Math.floor(rnd() * 6);
    const parts = [];
    for (let j = 0; j < n; j++) parts.push(words[Math.floor(rnd() * words.length)]);
    const out = E.composeSentence(parts);
    assert.ok(!/\s\s/.test(out), `double space in "${out}"`);
    assert.ok(out === out.trim(), `untrimmed "${out}"`);
    // capitalisation invariant: first char is never lowercase a-z
    if (out.length > 0) assert.ok(!/^[a-z]/.test(out), `not capitalised "${out}"`);
  }
});

test("property: board round-trip is lossless under random add/delete/move (2000 seeds)", () => {
  const rnd = mulberry32(0x51ed7007);
  for (let seed = 0; seed < 2000; seed++) {
    const s = E.freshState();
    const ops = Math.floor(rnd() * 8);
    let custom = 0;
    for (let k = 0; k < ops; k++) {
      const cats = s.categories.map((c) => c.id);
      const cat = cats[Math.floor(rnd() * cats.length)];
      const pick = rnd();
      if (pick < 0.5) {
        const id = cat + ".x" + (custom++) + "z"; // unique, matches /^[a-z]+\.[a-z0-9-]+$/
        try { E.addTile(s, { id, emoji: "😀", label: "T" + custom, speak: "I am testing.", stripText: "test", category: cat, fitz: "misc" }); } catch (_) {}
      } else if (pick < 0.75 && s.order[cat].length > 1) {
        E.deleteTile(s, s.order[cat][Math.floor(rnd() * s.order[cat].length)]);
      } else if (s.order[cat].length > 1) {
        const id = s.order[cat][Math.floor(rnd() * s.order[cat].length)];
        E.moveTile(s, id, Math.floor(rnd() * (s.order[cat].length + 2)) - 1);
      }
    }
    const exported = E.exportBoard(s);
    const round = E.importBoard(JSON.stringify(exported));
    assert.deepEqual(round.tiles, exported.tiles, `seed ${seed} tiles`);
    assert.deepEqual(round.order, exported.order, `seed ${seed} order`);
    // invariant: order arrays reference exactly the set of tile ids in that category
    for (const cat of round.categories.map((c) => c.id)) {
      const inOrder = (round.order[cat] || []).slice().sort();
      const inTiles = round.tiles.filter((t) => t.category === cat).map((t) => t.id).sort();
      assert.deepEqual(inOrder, inTiles, `seed ${seed} cat ${cat}: order set === tile set`);
    }
  }
});
