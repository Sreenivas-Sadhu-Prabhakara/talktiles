"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { CORPUS, CATEGORIES, FITZ, QUICK_BAR, CORPUS_META } = require("../data/corpus.js");
const E = require("../data/engine.js");

const ID_RE = /^[a-z]+\.[a-z0-9-]+$/;
const SPEAK_RE = /^[A-Za-z][A-Za-z ',.?!-]*$/;
const PICTO = /\p{Extended_Pictographic}/u;
const CAT_IDS = CATEGORIES.map((c) => c.id);

test("exactly 10 categories, each with exactly 12 tiles (120 total)", () => {
  assert.equal(CATEGORIES.length, 10);
  assert.equal(CORPUS.length, 120);
  for (const cat of CATEGORIES) {
    const n = CORPUS.filter((t) => t.category === cat.id).length;
    assert.equal(n, 12, `category ${cat.id} should have 12 tiles, has ${n}`);
  }
});

test("all ids unique dotted slugs matching the id pattern", () => {
  const ids = CORPUS.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length, "ids must be unique");
  for (const id of ids) assert.ok(ID_RE.test(id), `id ${id} must match ${ID_RE}`);
  // the category prefix of every id is a real category
  for (const t of CORPUS) {
    const prefix = t.id.split(".")[0];
    assert.ok(CAT_IDS.includes(prefix), `id prefix ${prefix} for ${t.id} must be a category`);
  }
});

test("every tile has non-empty emoji, label <=20, non-empty speak, valid category", () => {
  for (const t of CORPUS) {
    assert.ok(t.emoji && t.emoji.length > 0, `${t.id} emoji`);
    assert.ok(typeof t.label === "string" && t.label.length > 0 && t.label.length <= 20, `${t.id} label length ${t.label.length}`);
    assert.ok(typeof t.speak === "string" && t.speak.length > 0, `${t.id} speak`);
    assert.ok(CAT_IDS.includes(t.category), `${t.id} category ${t.category}`);
  }
});

test("speak strings are TTS-clean (no pictographs, ASCII+basic punctuation only)", () => {
  for (const t of CORPUS) {
    assert.ok(!PICTO.test(t.speak), `${t.id} speak contains a pictograph: ${t.speak}`);
    assert.ok(SPEAK_RE.test(t.speak), `${t.id} speak fails the ASCII-clean pattern: ${t.speak}`);
  }
});

test("stripText fields are <=20 chars, ASCII-clean, no pictographs (amendment)", () => {
  for (const t of CORPUS) {
    assert.ok(typeof t.stripText === "string" && t.stripText.length > 0, `${t.id} stripText present`);
    assert.ok(t.stripText.length <= 20, `${t.id} stripText <=20 (${t.stripText.length}): ${t.stripText}`);
    assert.ok(!PICTO.test(t.stripText), `${t.id} stripText has a pictograph: ${t.stripText}`);
    // ASCII printable only
    assert.ok(/^[\x20-\x7E]+$/.test(t.stripText), `${t.id} stripText not plain ASCII: ${t.stripText}`);
  }
});

test("emoji validity: exactly one grapheme cluster and Extended_Pictographic", () => {
  const seg = new Intl.Segmenter("en", { granularity: "grapheme" });
  for (const t of CORPUS) {
    let n = 0;
    for (const _ of seg.segment(t.emoji)) n++;
    assert.equal(n, 1, `${t.id} emoji "${t.emoji}" must be exactly one grapheme cluster (got ${n})`);
    assert.ok(PICTO.test(t.emoji), `${t.id} emoji "${t.emoji}" must be Extended_Pictographic`);
  }
});

test("Fitzgerald tags: all valid; category spot-mappings hold", () => {
  const valid = new Set(["people", "action", "descriptor", "noun", "social", "question", "misc"]);
  for (const t of CORPUS) assert.ok(valid.has(t.fitz), `${t.id} fitz ${t.fitz}`);
  // spot rules from the brief
  for (const t of CORPUS.filter((x) => x.category === "people")) assert.equal(t.fitz, "people", `${t.id} People->people`);
  for (const t of CORPUS.filter((x) => x.category === "actions")) assert.equal(t.fitz, "action", `${t.id} Actions->action`);
  for (const t of CORPUS.filter((x) => x.category === "questions")) assert.equal(t.fitz, "question", `${t.id} Questions->question`);
  // FITZ color map covers exactly the tag set
  assert.deepEqual(Object.keys(FITZ).sort(), [...valid].sort());
});

test("no speak phrase gives advice — every phrase is first-person or a bare social token", () => {
  // Heuristic guard: advice/imperatives aimed at the user would start with
  // 'You should', 'Take', 'Do not forget' etc. Our phrases are the user speaking.
  for (const t of CORPUS) {
    assert.ok(!/^You should\b/i.test(t.speak), `${t.id} looks like advice: ${t.speak}`);
    assert.ok(!/\bmg\b|\bdose\b|\btablets?\b/i.test(t.speak), `${t.id} must not mention dosing: ${t.speak}`);
  }
});

test("QUICK_BAR references the six pinned tiles, all present in corpus", () => {
  assert.deepEqual(QUICK_BAR, ["quick.yes", "quick.no", "quick.help", "quick.stop", "quick.wait", "quick.more"]);
  for (const id of QUICK_BAR) assert.ok(CORPUS.some((t) => t.id === id), `quick-bar tile ${id} exists`);
});

test("corpus meta is schema v1 with an ISO as_of date", () => {
  assert.equal(CORPUS_META.schemaVersion, 1);
  assert.match(CORPUS_META.as_of, /^\d{4}-\d{2}-\d{2}$/);
});

test("the whole corpus passes engine tile validation", () => {
  for (const t of CORPUS) assert.doesNotThrow(() => E.validateTile(t), `${t.id} must validate`);
});
