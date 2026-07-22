"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const E = require("../data/engine.js");
const { CORPUS } = require("../data/corpus.js");

function tileById(id) { return CORPUS.find((t) => t.id === id); }

/* -------- composeSentence (rewritten against REAL corpus stripText, per amendment) -------- */
test("composeSentence joins stripText fragments from real corpus entries", () => {
  const want = tileById("needs.water").stripText;       // "water"
  const please = tileById("quick.please").stripText;    // "please"
  const me = tileById("people.me").stripText;           // "me"
  assert.equal(E.composeSentence([me, want, please]), "Me water please");
});

test("composeSentence: the brief's canonical fixtures", () => {
  assert.equal(E.composeSentence(["I want", "water", "please"]), "I want water please");
  assert.equal(E.composeSentence([]), "");
  assert.equal(E.composeSentence(["help!"]), "Help!"); // capitalise first letter, keep existing punctuation
});

test("composeSentence trims and collapses internal whitespace", () => {
  assert.equal(E.composeSentence(["  I   want ", "  a  drink  "]), "I want a drink");
  assert.equal(E.composeSentence(["", "  ", "water"]), "Water");
  assert.equal(E.composeSentence(["yes"]), "Yes");
});

test("composeSentence does not add or duplicate terminal punctuation", () => {
  assert.equal(E.composeSentence(["hello."]), "Hello."); // no double period
  assert.equal(E.composeSentence(["are we", "finished"]), "Are we finished"); // no auto-added '?'
});

test("composeSentence tolerates non-array / null members", () => {
  assert.equal(E.composeSentence(null), "");
  assert.equal(E.composeSentence(["water", null, "please"]), "Water please");
});

/* -------- filterVoices honesty -------- */
test("filterVoices default returns only localService voices", () => {
  const voices = [
    { name: "Google US English", localService: false },
    { name: "Samantha", localService: true }
  ];
  const r = E.filterVoices(voices);
  assert.equal(r.voices.length, 1);
  assert.equal(r.voices[0].name, "Samantha");
  assert.equal(r.voices[0].remote, false);
  assert.equal(r.needsRemoteFallback, false);
});

test("filterVoices with zero local voices returns [] plus needsRemoteFallback, never throws", () => {
  const voices = [{ name: "Google UK English", localService: false }];
  let r;
  assert.doesNotThrow(() => { r = E.filterVoices(voices); });
  assert.deepEqual(r.voices, []);
  assert.equal(r.needsRemoteFallback, true);
});

test("filterVoices includeRemote returns all, marking network voices remote:true", () => {
  const voices = [
    { name: "Google US English", localService: false },
    { name: "Samantha", localService: true }
  ];
  const r = E.filterVoices(voices, { includeRemote: true });
  assert.equal(r.voices.length, 2);
  const google = r.voices.find((v) => v.name === "Google US English");
  const sam = r.voices.find((v) => v.name === "Samantha");
  assert.equal(google.remote, true);
  assert.equal(sam.remote, false);
});

test("filterVoices tolerates garbage input", () => {
  assert.doesNotThrow(() => E.filterVoices(null));
  assert.doesNotThrow(() => E.filterVoices([null, undefined, {}]));
  assert.equal(E.filterVoices(undefined).needsRemoteFallback, true);
});

/* -------- Board round-trip -------- */
test("importBoard(exportBoard(state)) deep-equals state (tiles, order, settings)", () => {
  const s = E.freshState();
  // add a custom tile + change a setting to make the round-trip non-trivial
  E.addTile(s, { id: "needs.tissue", emoji: "🧻", label: "Tissue", speak: "I need a tissue, please.", stripText: "a tissue", category: "needs", fitz: "noun" });
  s.settings.rate = 1.2;
  s.settings.voiceURI = "Samantha";
  const exported = E.exportBoard(s);
  const round = E.importBoard(JSON.stringify(exported));
  assert.deepEqual(round.tiles, exported.tiles);
  assert.deepEqual(round.order, exported.order);
  assert.deepEqual(round.settings, exported.settings);
  assert.deepEqual(round.categories, exported.categories);
  // the custom tile survived at the END of its category
  const needsOrder = round.order.needs;
  assert.equal(needsOrder[needsOrder.length - 1], "needs.tissue");
});

test("importBoard rejects malformed JSON / missing schemaVersion / missing tiles / bad tile", () => {
  assert.throws(() => E.importBoard("{ not json"), /not valid JSON/);
  assert.throws(() => E.importBoard(JSON.stringify({ tiles: [], categories: [] })), /schemaVersion/);
  assert.throws(() => E.importBoard(JSON.stringify({ schemaVersion: 1, categories: [] })), /tiles/);
  assert.throws(() => E.importBoard(JSON.stringify({
    schemaVersion: 1,
    categories: [{ id: "needs", name: "Needs" }],
    tiles: [{ id: "needs.bad", emoji: "💧", label: "Bad", speak: "has emoji 💧", stripText: "bad", category: "needs", fitz: "noun" }]
  })), /invalid speak/);
});

test("importBoard is all-or-nothing: a later bad tile aborts the whole import", () => {
  const good = { id: "needs.ok", emoji: "💧", label: "Ok", speak: "I am okay.", stripText: "ok", category: "needs", fitz: "descriptor" };
  const bad = { id: "BAD ID", emoji: "💧", label: "Bad", speak: "Bad.", stripText: "bad", category: "needs", fitz: "noun" };
  assert.throws(() => E.importBoard(JSON.stringify({
    schemaVersion: 1, categories: [{ id: "needs", name: "Needs" }], tiles: [good, bad]
  })), /invalid tile id/);
});

/* -------- Motor-planning stability -------- */
test("addTile appends to end of category; existing indices unchanged", () => {
  const s = E.freshState();
  const before = s.order.needs.slice();
  E.addTile(s, { id: "needs.book", emoji: "📗", label: "My book", speak: "I want my book.", stripText: "my book", category: "needs", fitz: "noun" });
  const after = s.order.needs;
  assert.deepEqual(after.slice(0, before.length), before, "prior order unchanged");
  assert.equal(after[after.length - 1], "needs.book");
});

test("addTile rejects a duplicate id", () => {
  const s = E.freshState();
  assert.throws(() => E.addTile(s, { id: "needs.water", emoji: "💧", label: "Water", speak: "Water.", stripText: "water", category: "needs", fitz: "noun" }), /duplicate/);
});

test("deleteTile removes only that id without reindexing others", () => {
  const s = E.freshState();
  const before = s.order.feelings.slice();
  const target = before[3];
  E.deleteTile(s, target);
  assert.ok(!s.tiles.some((t) => t.id === target));
  assert.deepEqual(s.order.feelings, before.filter((x) => x !== target));
  // no other id changed
  for (const id of before) if (id !== target) assert.ok(s.order.feelings.includes(id));
});

test("moveTile changes exactly one tile's position (the only reordering path)", () => {
  const s = E.freshState();
  const before = s.order.food.slice();
  const moved = before[0];
  E.moveTile(s, moved, 3);
  const after = s.order.food;
  assert.equal(after.indexOf(moved), 3);
  // the multiset of ids is identical (nothing lost/added)
  assert.deepEqual(after.slice().sort(), before.slice().sort());
  // every OTHER tile kept relative order
  const beforeOthers = before.filter((x) => x !== moved);
  const afterOthers = after.filter((x) => x !== moved);
  assert.deepEqual(afterOthers, beforeOthers);
});

test("moveTile clamps out-of-range indices", () => {
  const s = E.freshState();
  const id = s.order.quick[2];
  assert.doesNotThrow(() => E.moveTile(s, id, 999));
  assert.equal(s.order.quick[s.order.quick.length - 1], id);
  assert.doesNotThrow(() => E.moveTile(s, id, -5));
  assert.equal(s.order.quick[0], id);
});

test("editTile changes fields in place; id and category are immutable", () => {
  const s = E.freshState();
  E.editTile(s, "needs.water", { label: "Cold water", speak: "I want cold water, please.", stripText: "cold water" });
  const t = s.tiles.find((x) => x.id === "needs.water");
  assert.equal(t.label, "Cold water");
  assert.equal(t.speak, "I want cold water, please.");
  // attempts to change id/category are ignored
  E.editTile(s, "needs.water", { id: "needs.hacked", category: "food" });
  assert.ok(s.tiles.find((x) => x.id === "needs.water"));
  assert.equal(s.tiles.find((x) => x.id === "needs.water").category, "needs");
});
