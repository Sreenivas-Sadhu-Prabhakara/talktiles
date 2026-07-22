/* ============================================================
   talktiles — app.js
   All DOM wiring. Pure logic lives in data/engine.js; corpus in data/corpus.js.
   CSP: no inline handlers, no network — everything is addEventListener + localStorage.
   ============================================================ */
(function () {
  "use strict";

  var E = window.TALKTILES_ENGINE;
  var FITZ = window.TALKTILES_FITZ;
  var QUICK_BAR = window.TALKTILES_QUICK_BAR;
  var LS_KEY = "talktiles.board.v1";
  var LS_STRIP = "talktiles.strip.v1";

  // --------- state ---------
  var state = load() || E.freshState();
  var stripIds = loadStrip();       // array of tile ids currently on the sentence strip
  var stripMode = false;
  var careMode = false;
  var editingId = null;
  var editEmoji = "🙂";
  var voices = [];
  var pressTimer = null;
  var audioUnlocked = false;

  // --------- persistence ---------
  function save() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(E.exportBoard(state))); } catch (e) {}
  }
  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      return E.importBoard(raw);
    } catch (e) { return null; }
  }
  function saveStrip() {
    try { localStorage.setItem(LS_STRIP, JSON.stringify(stripIds)); } catch (e) {}
  }
  function loadStrip() {
    try {
      var raw = localStorage.getItem(LS_STRIP);
      var arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }

  function tile(id) {
    for (var i = 0; i < state.tiles.length; i++) if (state.tiles[i].id === id) return state.tiles[i];
    return null;
  }

  // --------- speech ---------
  function loadVoices() { voices = (window.speechSynthesis && window.speechSynthesis.getVoices()) || []; }
  function currentVoiceObj() {
    var uri = state.settings.voiceURI;
    if (!uri) return null;
    for (var i = 0; i < voices.length; i++) if (voices[i].voiceURI === uri || voices[i].name === uri) return voices[i];
    return null;
  }
  function speak(text) {
    if (!text) return;
    if (!("speechSynthesis" in window)) { toast("This browser has no speech synthesis."); return; }
    audioUnlocked = true;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      var v = currentVoiceObj();
      if (v) u.voice = v;
      u.rate = clampNum(state.settings.rate, 0.5, 1.6, 1);
      u.pitch = clampNum(state.settings.pitch, 0.5, 1.6, 1);
      u.lang = (v && v.lang) || "en-US";
      window.speechSynthesis.speak(u);
    } catch (e) { toast("Could not speak — no voice available."); }
  }
  function clampNum(n, lo, hi, dflt) {
    n = parseFloat(n); if (isNaN(n)) return dflt; return Math.max(lo, Math.min(hi, n));
  }

  // --------- rendering ---------
  var $ = function (id) { return document.getElementById(id); };
  var elBoard = $("categories");
  var elQuick = $("quickbar");
  var elStrip = $("strip");
  var elStripTiles = $("stripTiles");

  function tileButton(t, opts) {
    opts = opts || {};
    var b = document.createElement("button");
    b.type = "button";
    b.className = "tile fitz-" + t.fitz + (opts.quick ? " tile--quick" : "");
    b.setAttribute("data-id", t.id);
    b.setAttribute("aria-label", t.label + " — says: " + t.speak);
    b.style.touchAction = "manipulation";

    var arc = document.createElement("span");
    arc.className = "tile__arcs"; arc.setAttribute("aria-hidden", "true");
    arc.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15 6a6 6 0 0 1 0 12"/><path d="M17.5 3.5a10 10 0 0 1 0 17"/><path d="M20 1a14 14 0 0 1 0 22"/></svg>';

    var emo = document.createElement("span");
    emo.className = "tile__emoji"; emo.textContent = t.emoji;

    var lab = document.createElement("span");
    lab.className = "tile__label"; lab.textContent = t.label;

    b.appendChild(arc); b.appendChild(emo); b.appendChild(lab);
    return b;
  }

  function renderQuick() {
    elQuick.innerHTML = "";
    for (var i = 0; i < QUICK_BAR.length; i++) {
      var t = tile(QUICK_BAR[i]);
      if (!t) continue;
      elQuick.appendChild(tileButton(t, { quick: true }));
    }
  }

  function renderBoard() {
    elBoard.innerHTML = "";
    for (var c = 0; c < state.categories.length; c++) {
      var cat = state.categories[c];
      var sec = document.createElement("section");
      sec.className = "cat";
      sec.setAttribute("aria-labelledby", "cat-" + cat.id);

      var head = document.createElement("div");
      head.className = "cat__head";
      var h = document.createElement("h2");
      h.className = "cat__title"; h.id = "cat-" + cat.id; h.textContent = cat.name;
      var blurb = document.createElement("span");
      blurb.className = "cat__blurb"; blurb.textContent = cat.blurb || "";
      head.appendChild(h); head.appendChild(blurb);

      if (careMode) {
        var addBtn = document.createElement("button");
        addBtn.type = "button"; addBtn.className = "btn btn--ghost btn--sm";
        addBtn.textContent = "＋ Add tile"; addBtn.setAttribute("data-add-cat", cat.id);
        head.appendChild(addBtn);
      }
      sec.appendChild(head);

      var grid = document.createElement("div");
      grid.className = "cat__grid tsz-" + (state.settings.tileSize | 0);
      grid.setAttribute("role", "grid");
      var order = state.order[cat.id] || [];
      for (var k = 0; k < order.length; k++) {
        var t = tile(order[k]);
        if (!t) continue;
        var wrap = document.createElement("div");
        wrap.className = "tilewrap"; wrap.setAttribute("role", "gridcell");
        var btn = tileButton(t);
        wrap.appendChild(btn);
        if (careMode) {
          var tools = document.createElement("div");
          tools.className = "tilewrap__tools";
          tools.innerHTML =
            '<button type="button" class="minibtn" data-edit="' + t.id + '" title="Edit">✎</button>' +
            '<button type="button" class="minibtn" data-move="' + t.id + '" data-dir="-1" title="Move left">◄</button>' +
            '<button type="button" class="minibtn" data-move="' + t.id + '" data-dir="1" title="Move right">►</button>';
          wrap.appendChild(tools);
        }
        grid.appendChild(wrap);
      }
      sec.appendChild(grid);
      elBoard.appendChild(sec);
    }
  }

  function renderStrip() {
    elStrip.hidden = !stripMode;
    $("stripModeBtn").setAttribute("aria-pressed", String(stripMode));
    if (!stripMode) return;
    elStripTiles.innerHTML = "";
    if (stripIds.length === 0) {
      var ph = document.createElement("span");
      ph.className = "strip__placeholder";
      ph.textContent = "Tap tiles to build a sentence…";
      elStripTiles.appendChild(ph);
      return;
    }
    for (var i = 0; i < stripIds.length; i++) {
      var t = tile(stripIds[i]);
      if (!t) continue;
      var chip = document.createElement("span");
      chip.className = "chip fitz-" + t.fitz;
      chip.textContent = t.emoji + " " + t.stripText;
      elStripTiles.appendChild(chip);
    }
  }

  function currentSentence() {
    var parts = [];
    for (var i = 0; i < stripIds.length; i++) {
      var t = tile(stripIds[i]); if (t) parts.push(t.stripText);
    }
    return E.composeSentence(parts);
  }

  // --------- tile activation ---------
  function activateTile(id, btn) {
    var t = tile(id); if (!t) return;
    if (careMode) { openEditor(id); return; }
    if (stripMode) {
      stripIds.push(id); saveStrip(); renderStrip();
      pulse(btn);
      return;
    }
    speak(t.speak);
    pulse(btn);
  }

  function pulse(btn) {
    if (!btn) return;
    btn.classList.remove("is-speaking");
    // reflow so the animation restarts even on rapid taps
    void btn.offsetWidth;
    btn.classList.add("is-speaking");
    window.setTimeout(function () { btn.classList.remove("is-speaking"); }, 650);
  }

  // event delegation for all tile taps (quick bar + board)
  function onBoardClick(e) {
    var btn = e.target.closest ? e.target.closest("button") : null;
    if (!btn) return;
    if (btn.hasAttribute("data-id")) { activateTile(btn.getAttribute("data-id"), btn); return; }
    if (btn.hasAttribute("data-edit")) { openEditor(btn.getAttribute("data-edit")); return; }
    if (btn.hasAttribute("data-add-cat")) { openEditor(null, btn.getAttribute("data-add-cat")); return; }
    if (btn.hasAttribute("data-move")) {
      var id = btn.getAttribute("data-move");
      var dir = parseInt(btn.getAttribute("data-dir"), 10);
      var t = tile(id); if (!t) return;
      var ord = state.order[t.category];
      var idx = ord.indexOf(id);
      E.moveTile(state, id, idx + dir);
      save(); renderBoard(); flagEdited();
      return;
    }
  }

  // keyboard: arrow-key grid nav + Enter/Space to activate
  function onBoardKey(e) {
    var btn = document.activeElement;
    if (!btn || !btn.classList || !btn.classList.contains("tile")) return;
    var grid = btn.closest(".cat__grid, .quickbar");
    if (!grid) return;
    var tiles = Array.prototype.slice.call(grid.querySelectorAll(".tile"));
    var i = tiles.indexOf(btn);
    var cols = getComputedCols(grid);
    var next = -1;
    if (e.key === "ArrowRight") next = i + 1;
    else if (e.key === "ArrowLeft") next = i - 1;
    else if (e.key === "ArrowDown") next = i + cols;
    else if (e.key === "ArrowUp") next = i - cols;
    else return;
    if (next >= 0 && next < tiles.length) { tiles[next].focus(); e.preventDefault(); }
  }
  function getComputedCols(grid) {
    var style = window.getComputedStyle(grid);
    var t = style.getPropertyValue("grid-template-columns");
    var n = t ? t.split(" ").filter(function (x) { return x.trim(); }).length : 1;
    return Math.max(1, n);
  }

  // --------- caregiver mode (long-press gear + confirm) ---------
  function startCarePress() {
    pressTimer = window.setTimeout(function () {
      if (careMode) { exitCare(); return; }
      if (window.confirm("Enter Caregiver mode to edit tiles? Tap a tile to edit it.")) enterCare();
    }, 650);
  }
  function cancelCarePress() { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } }
  function enterCare() {
    careMode = true; stripMode = false;
    $("carebar").hidden = false;
    $("caregiverBtn").setAttribute("aria-pressed", "true");
    renderStrip(); renderBoard();
  }
  function exitCare() {
    careMode = false;
    $("carebar").hidden = true;
    $("caregiverBtn").setAttribute("aria-pressed", "false");
    renderBoard();
  }

  // --------- tile editor ---------
  var EMOJI_PICKER = ["🙂","😀","😢","😠","😨","😴","💧","🍽️","🍎","☕","🍵","💊","🛏️","👓","📱","💡","🔥","❄️","🔌","👕","🧻","🏠","🌳","🚗","🏥","🏫","💼","🚶","🪑","🛌","🚿","📖","📺","🎵","🎲","👩","👨","🧒","👶","👪","🤝","🙋","👉","❓","👍","👋","🙏","💖","❤️","🚑","🩺","🥤","🍞","🍲","🍚","🍪","🌙","🌅","🥳","📍"];

  function openEditor(id, catForNew) {
    editingId = id;
    var t = id ? tile(id) : null;
    $("editTitle").textContent = id ? "Edit tile" : "New tile";
    $("editLabel").value = t ? t.label : "";
    $("editSpeak").value = t ? t.speak : "";
    $("editStrip").value = t ? t.stripText : "";
    editEmoji = t ? t.emoji : "🙂";
    $("emojiCurrent").textContent = editEmoji;
    $("deleteTileBtn").style.display = id ? "" : "none";
    $("editErr").textContent = "";
    var fitzSel = $("editFitz");
    fitzSel.innerHTML = "";
    Object.keys(FITZ).forEach(function (k) {
      var o = document.createElement("option"); o.value = k; o.textContent = FITZ[k].label;
      if (t && t.fitz === k) o.selected = true;
      fitzSel.appendChild(o);
    });
    var grid = $("emojiGrid"); grid.innerHTML = "";
    EMOJI_PICKER.forEach(function (em) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "emojigrid__b" + (em === editEmoji ? " is-sel" : "");
      b.textContent = em; b.setAttribute("data-emoji", em);
      grid.appendChild(b);
    });
    editModalNewCat = catForNew || (t ? t.category : null);
    openModal("edit");
  }
  var editModalNewCat = null;

  function saveTile() {
    var label = $("editLabel").value.trim();
    var speak = $("editSpeak").value.trim();
    var strip = $("editStrip").value.trim();
    var fitz = $("editFitz").value;
    try {
      if (editingId) {
        E.editTile(state, editingId, { label: label, speak: speak, stripText: strip, emoji: editEmoji, fitz: fitz });
      } else {
        var cat = editModalNewCat || state.categories[0].id;
        var newId = cat + ".custom-" + Date.now().toString(36);
        E.addTile(state, { id: newId, emoji: editEmoji, label: label, speak: speak, stripText: strip, category: cat, fitz: fitz });
      }
    } catch (err) {
      $("editErr").textContent = friendlyErr(err.message);
      return;
    }
    save(); closeModal("edit"); renderBoard(); renderQuick(); flagEdited();
    toast(editingId ? "Tile saved." : "Tile added.");
  }
  function friendlyErr(msg) {
    if (/label/.test(msg)) return "The label must be 1–20 characters.";
    if (/speak/.test(msg)) return "The spoken phrase must use plain letters and basic punctuation only (no emoji).";
    if (/stripText/.test(msg)) return "The short sentence word must be 1–20 plain characters.";
    if (/emoji/.test(msg)) return "Please pick exactly one emoji.";
    return "Please check the fields: " + msg;
  }
  function deleteCurrentTile() {
    if (!editingId) return;
    if (!window.confirm("Delete this tile? Saved boards that reference it will lose it.")) return;
    E.deleteTile(state, editingId);
    save(); closeModal("edit"); renderBoard(); renderQuick(); flagEdited();
    toast("Tile deleted.");
  }

  // --------- settings ---------
  function refreshVoiceList() {
    loadVoices();
    var include = !!state.settings.includeRemote;
    var res = E.filterVoices(voices, { includeRemote: include });
    var sel = $("voiceSel");
    sel.innerHTML = "";
    if (res.voices.length === 0) {
      var o = document.createElement("option"); o.textContent = "(no voices available on this device)";
      o.value = ""; sel.appendChild(o);
    }
    res.voices.forEach(function (v) {
      var o = document.createElement("option");
      var ref = v._ref || {};
      o.value = ref.voiceURI || ref.name || v.name;
      o.textContent = v.name + (v.remote ? "  · remote" : "  · on-device") + (ref.lang ? "  (" + ref.lang + ")" : "");
      if (state.settings.voiceURI && (o.value === state.settings.voiceURI)) o.selected = true;
      sel.appendChild(o);
    });
    var hint = $("voiceHint");
    if (res.needsRemoteFallback && !include) {
      hint.textContent = "This device has no fully on-device voice. Tick “Show remote voices” to use a vendor-hosted one (its audio is generated by your browser vendor's servers).";
    } else if (include) {
      hint.textContent = "Remote voices are generated by your browser vendor's servers, not on your device.";
    } else {
      hint.textContent = "Showing only voices that run entirely on your device.";
    }
    $("remoteToggle").checked = include;
  }

  // --------- export / import / print ---------
  function exportJSON() {
    var payload = E.exportBoard(state);
    payload.exportedAt = new Date().toISOString();
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url; a.download = "talktiles-board.json";
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    window.setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    clearNag();
    toast("Board exported.");
  }
  function importJSONFile(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var next = E.importBoard(String(reader.result));
        // keep any settings not present in the imported file
        next.settings = Object.assign({ rate: 1, pitch: 1, voiceURI: null, includeRemote: false, tileSize: 1 }, next.settings || {});
        state = next;
        stripIds = stripIds.filter(function (id) { return !!tile(id); });
        save(); saveStrip();
        renderQuick(); renderBoard(); renderStrip();
        $("importMsg").textContent = "Board imported successfully.";
        toast("Board imported.");
      } catch (err) {
        $("importMsg").textContent = err.message;
      }
    };
    reader.onerror = function () { $("importMsg").textContent = "Could not read that file."; };
    reader.readAsText(file);
  }

  // --------- edit nag ---------
  var nagDismissed = false;
  function flagEdited() { if (!nagDismissed) $("nag").hidden = false; }
  function clearNag() { $("nag").hidden = true; }

  // --------- toast + modals ---------
  var toastTimer = null;
  function toast(msg) {
    var el = $("toast"); el.textContent = msg; el.hidden = false; el.classList.add("show");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { el.classList.remove("show"); el.hidden = true; }, 2200);
  }
  function openModal(which) {
    var m = which === "settings" ? $("settingsModal") : $("editModal");
    m.hidden = false; document.body.classList.add("modal-open");
    var focusable = m.querySelector("button, [href], input, select, textarea");
    if (focusable) focusable.focus();
  }
  function closeModal(which) {
    var m = which === "settings" ? $("settingsModal") : $("editModal");
    m.hidden = true;
    if ($("settingsModal").hidden && $("editModal").hidden) document.body.classList.remove("modal-open");
  }

  // ============================================================
  // WIRE UP
  // ============================================================
  function init() {
    renderQuick(); renderBoard(); renderStrip();
    refreshVoiceList();
    // reflect saved settings into controls
    $("rate").value = state.settings.rate; $("rateVal").textContent = Number(state.settings.rate).toFixed(1);
    $("pitch").value = state.settings.pitch; $("pitchVal").textContent = Number(state.settings.pitch).toFixed(1);
    var tsz = document.querySelector('input[name="tileSize"][value="' + (state.settings.tileSize | 0) + '"]');
    if (tsz) tsz.checked = true;

    // tile taps (delegated)
    elQuick.addEventListener("click", onBoardClick);
    elBoard.addEventListener("click", onBoardClick);
    document.addEventListener("keydown", onBoardKey);

    // sentence strip
    $("stripModeBtn").addEventListener("click", function () {
      stripMode = !stripMode; if (stripMode) careMode && exitCare(); renderStrip();
    });
    $("speakStripBtn").addEventListener("click", function () { speak(currentSentence()); });
    $("backspaceBtn").addEventListener("click", function () { stripIds.pop(); saveStrip(); renderStrip(); });
    $("clearStripBtn").addEventListener("click", function () { stripIds = []; saveStrip(); renderStrip(); });

    // caregiver long-press
    var gear = $("caregiverBtn");
    gear.addEventListener("mousedown", startCarePress);
    gear.addEventListener("touchstart", startCarePress, { passive: true });
    gear.addEventListener("mouseup", cancelCarePress);
    gear.addEventListener("mouseleave", cancelCarePress);
    gear.addEventListener("touchend", cancelCarePress);
    gear.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (careMode) exitCare();
        else if (window.confirm("Enter Caregiver mode to edit tiles?")) enterCare();
      }
    });
    $("exitCareBtn").addEventListener("click", exitCare);

    // settings modal
    $("settingsBtn").addEventListener("click", function () { refreshVoiceList(); openModal("settings"); });
    $("remoteToggle").addEventListener("change", function () {
      state.settings.includeRemote = this.checked; save(); refreshVoiceList();
    });
    $("voiceSel").addEventListener("change", function () { state.settings.voiceURI = this.value || null; save(); });
    $("rate").addEventListener("input", function () { state.settings.rate = parseFloat(this.value); $("rateVal").textContent = Number(this.value).toFixed(1); save(); });
    $("pitch").addEventListener("input", function () { state.settings.pitch = parseFloat(this.value); $("pitchVal").textContent = Number(this.value).toFixed(1); save(); });
    Array.prototype.forEach.call(document.querySelectorAll('input[name="tileSize"]'), function (r) {
      r.addEventListener("change", function () { state.settings.tileSize = parseInt(this.value, 10) | 0; save(); renderBoard(); });
    });
    $("testSpeakBtn").addEventListener("click", function () { speak("Hello, this is how I sound."); });

    // export / import / print
    $("exportBtn").addEventListener("click", exportJSON);
    $("nagExportBtn").addEventListener("click", exportJSON);
    $("nagDismissBtn").addEventListener("click", function () { nagDismissed = true; clearNag(); });
    $("importBtn").addEventListener("click", function () { $("importFile").click(); });
    $("importFile").addEventListener("change", function () { if (this.files && this.files[0]) importJSONFile(this.files[0]); this.value = ""; });
    $("printBtn").addEventListener("click", function () { closeModal("settings"); window.print(); });
    $("resetBtn").addEventListener("click", function () {
      if (!window.confirm("Reset to the starter board? This erases your custom tiles in this browser.")) return;
      state = E.freshState(); stripIds = []; save(); saveStrip();
      renderQuick(); renderBoard(); renderStrip(); refreshVoiceList();
      closeModal("settings"); toast("Reset to the starter board.");
    });

    // editor modal
    $("emojiGrid").addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("[data-emoji]") : null;
      if (!b) return;
      editEmoji = b.getAttribute("data-emoji");
      $("emojiCurrent").textContent = editEmoji;
      Array.prototype.forEach.call(this.querySelectorAll(".emojigrid__b"), function (x) { x.classList.remove("is-sel"); });
      b.classList.add("is-sel");
    });
    $("saveTileBtn").addEventListener("click", saveTile);
    $("deleteTileBtn").addEventListener("click", deleteCurrentTile);

    // modal close (scrim + x + Escape)
    document.addEventListener("click", function (e) {
      var c = e.target.getAttribute && e.target.getAttribute("data-close");
      if (c) closeModal(c);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") { closeModal("settings"); closeModal("edit"); }
    });

    // voices load asynchronously in most browsers
    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = function () { refreshVoiceList(); };
    }

    // iOS audio unlock note
    if (!("speechSynthesis" in window)) {
      toast("This browser cannot speak. Tiles still show but won't read aloud.");
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
