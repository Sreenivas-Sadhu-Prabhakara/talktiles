/* ============================================================
   talktiles — pure engine
   All core logic that the self-tests re-derive. NO DOM here so both
   the browser (window.TALKTILES_ENGINE) and Node tests share one copy.
   ============================================================ */

/* Load corpus constants (validation reuses the corpus field rules). */
let _corpusMod;
if (typeof module !== "undefined") {
  _corpusMod = require("./corpus.js");
}
function _corpus() {
  if (_corpusMod) return _corpusMod;
  return {
    CATEGORIES: (typeof window !== "undefined" && window.TALKTILES_CATEGORIES) || [],
    CORPUS_META: (typeof window !== "undefined" && window.TALKTILES_META) || { schemaVersion: 1 }
  };
}

const FITZ_TAGS = ["people", "action", "descriptor", "noun", "social", "question", "misc"];

/* ---- Tile field validation (shared by imports + caregiver edits) ---- */
const ID_RE = /^[a-z]+\.[a-z0-9-]+$/;
const SPEAK_RE = /^[A-Za-z][A-Za-z ',.?!-]*$/;
const PICTO_RE = /\p{Extended_Pictographic}/u;

function graphemeCount(str) {
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    const seg = new Intl.Segmenter("en", { granularity: "grapheme" });
    let n = 0;
    for (const _ of seg.segment(str)) n++;
    return n;
  }
  // Fallback for very old runtimes: spread counts code points, not clusters.
  return [...str].length;
}

function validateTile(t) {
  if (!t || typeof t !== "object") throw new Error("tile is not an object");
  if (typeof t.id !== "string" || !ID_RE.test(t.id)) throw new Error("invalid tile id: " + JSON.stringify(t.id));
  if (typeof t.emoji !== "string" || t.emoji.length === 0 || !PICTO_RE.test(t.emoji)) throw new Error("invalid emoji for " + t.id);
  if (graphemeCount(t.emoji) !== 1) throw new Error("emoji must be exactly one grapheme cluster for " + t.id);
  if (typeof t.label !== "string" || t.label.length === 0 || t.label.length > 20) throw new Error("invalid label for " + t.id);
  if (typeof t.speak !== "string" || t.speak.length === 0 || !SPEAK_RE.test(t.speak) || PICTO_RE.test(t.speak)) throw new Error("invalid speak for " + t.id);
  if (typeof t.stripText !== "string" || t.stripText.length === 0 || t.stripText.length > 20 || PICTO_RE.test(t.stripText)) throw new Error("invalid stripText for " + t.id);
  if (typeof t.category !== "string" || t.category.length === 0) throw new Error("invalid category for " + t.id);
  if (FITZ_TAGS.indexOf(t.fitz) === -1) throw new Error("invalid fitz tag for " + t.id);
  return true;
}

/* ============================================================
   composeSentence — join sentence-strip fragments into one utterance.
   Trims, collapses internal whitespace, capitalises the first letter,
   and does NOT add or duplicate terminal punctuation.
   ============================================================ */
function composeSentence(parts) {
  if (!Array.isArray(parts)) return "";
  const joined = parts
    .map((p) => (p == null ? "" : String(p)))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (joined === "") return "";
  return joined.charAt(0).toUpperCase() + joined.slice(1);
}

/* ============================================================
   filterVoices — honest voice picker.
   Default: only voices where localService === true (fully on-device).
   Zero local voices -> returns [] plus needsRemoteFallback true.
   includeRemote:true -> returns all, network voices marked remote:true.
   Never throws on odd input.
   ============================================================ */
function filterVoices(voices, opts) {
  const options = opts || {};
  const list = Array.isArray(voices) ? voices : [];
  const local = list.filter((v) => v && v.localService === true);
  if (options.includeRemote) {
    return {
      voices: list.map((v) => ({
        name: v && v.name,
        localService: !!(v && v.localService),
        remote: !(v && v.localService === true),
        _ref: v
      })),
      needsRemoteFallback: local.length === 0
    };
  }
  return {
    voices: local.map((v) => ({ name: v.name, localService: true, remote: false, _ref: v })),
    needsRemoteFallback: local.length === 0
  };
}

/* ============================================================
   Board state operations — motor-planning stable.
   A board = { categories:[{id,name,blurb}], tiles:[tile...], order:{catId:[id...]} }
   Positions are held in order[catId]; tile ids are never reindexed.
   ============================================================ */

function _catOrder(state, catId) {
  if (!state.order[catId]) state.order[catId] = [];
  return state.order[catId];
}

/* addTile — append to the END of its category so existing indices are unchanged. */
function addTile(state, tile) {
  validateTile(tile);
  if (state.tiles.some((t) => t.id === tile.id)) throw new Error("duplicate tile id: " + tile.id);
  state.tiles.push(tile);
  _catOrder(state, tile.category).push(tile.id);
  return state;
}

/* deleteTile — remove ONLY that id; no other id is reindexed or renamed. */
function deleteTile(state, id) {
  state.tiles = state.tiles.filter((t) => t.id !== id);
  for (const cat of Object.keys(state.order)) {
    state.order[cat] = state.order[cat].filter((x) => x !== id);
  }
  return state;
}

/* editTile — change label/speak/stripText/emoji/fitz in place; id + position fixed. */
function editTile(state, id, patch) {
  const t = state.tiles.find((x) => x.id === id);
  if (!t) throw new Error("no such tile: " + id);
  const next = Object.assign({}, t, patch, { id: t.id, category: t.category });
  validateTile(next);
  Object.assign(t, next);
  return state;
}

/* moveTile — the ONLY reordering path. Moves one tile to newIndex within its
   category order; every other tile keeps its relative order. */
function moveTile(state, id, newIndex) {
  const t = state.tiles.find((x) => x.id === id);
  if (!t) throw new Error("no such tile: " + id);
  const ord = _catOrder(state, t.category);
  const from = ord.indexOf(id);
  if (from === -1) throw new Error("tile not in category order: " + id);
  const clamped = Math.max(0, Math.min(newIndex, ord.length - 1));
  ord.splice(from, 1);
  ord.splice(clamped, 0, id);
  return state;
}

/* ============================================================
   Board export / import — the caregiver handoff.
   Round-trip lossless; import is all-or-nothing (no partial/corrupting imports).
   ============================================================ */
const SCHEMA_VERSION = 1;

function exportBoard(state) {
  return {
    schemaVersion: SCHEMA_VERSION,
    app: "talktiles",
    exportedAt: state.exportedAt || null,
    categories: state.categories.map((c) => ({ id: c.id, name: c.name, blurb: c.blurb || "" })),
    tiles: state.tiles.map((t) => ({
      id: t.id, emoji: t.emoji, label: t.label, speak: t.speak,
      stripText: t.stripText, category: t.category, fitz: t.fitz
    })),
    order: JSON.parse(JSON.stringify(state.order)),
    settings: JSON.parse(JSON.stringify(state.settings || {}))
  };
}

function importBoard(json) {
  let data = json;
  if (typeof json === "string") {
    try { data = JSON.parse(json); }
    catch (e) { throw new Error("Import failed: the file is not valid JSON."); }
  }
  if (!data || typeof data !== "object") throw new Error("Import failed: empty or malformed board.");
  if (data.schemaVersion !== SCHEMA_VERSION) {
    throw new Error("Import failed: missing or unsupported schemaVersion (expected " + SCHEMA_VERSION + ").");
  }
  if (!Array.isArray(data.categories)) throw new Error("Import failed: categories must be an array.");
  if (!Array.isArray(data.tiles)) throw new Error("Import failed: tiles must be an array.");
  // Validate EVERY tile before committing anything.
  const seen = new Set();
  for (const t of data.tiles) {
    validateTile(t);
    if (seen.has(t.id)) throw new Error("Import failed: duplicate tile id " + t.id + ".");
    seen.add(t.id);
  }
  const catIds = new Set(data.categories.map((c) => c && c.id));
  for (const t of data.tiles) {
    if (!catIds.has(t.category)) throw new Error("Import failed: tile " + t.id + " references unknown category " + t.category + ".");
  }
  const order = data.order && typeof data.order === "object" ? data.order : {};
  return {
    categories: data.categories.map((c) => ({ id: c.id, name: c.name, blurb: c.blurb || "" })),
    tiles: data.tiles.map((t) => ({
      id: t.id, emoji: t.emoji, label: t.label, speak: t.speak,
      stripText: t.stripText, category: t.category, fitz: t.fitz
    })),
    order: JSON.parse(JSON.stringify(order)),
    settings: data.settings && typeof data.settings === "object" ? JSON.parse(JSON.stringify(data.settings)) : {},
    exportedAt: data.exportedAt || null
  };
}

/* Build the first-run state from the shipped corpus. */
function freshState() {
  const c = _corpus();
  const CORPUS = _corpusMod ? _corpusMod.CORPUS : (typeof window !== "undefined" ? window.TALKTILES_CORPUS : []);
  const CATEGORIES = _corpusMod ? _corpusMod.CATEGORIES : (typeof window !== "undefined" ? window.TALKTILES_CATEGORIES : []);
  const order = {};
  for (const cat of CATEGORIES) order[cat.id] = [];
  for (const t of CORPUS) order[t.category].push(t.id);
  return {
    categories: CATEGORIES.map((x) => ({ id: x.id, name: x.name, blurb: x.blurb })),
    tiles: CORPUS.map((t) => Object.assign({}, t)),
    order,
    settings: { rate: 1, pitch: 1, voiceURI: null, includeRemote: false, tileSize: 1, indianGrouping: false },
    exportedAt: null
  };
}

const ENGINE = {
  composeSentence, filterVoices, validateTile, graphemeCount,
  addTile, deleteTile, editTile, moveTile,
  exportBoard, importBoard, freshState,
  FITZ_TAGS, ID_RE, SPEAK_RE, PICTO_RE, SCHEMA_VERSION
};

if (typeof module !== "undefined") module.exports = ENGINE;
if (typeof window !== "undefined") window.TALKTILES_ENGINE = ENGINE;
