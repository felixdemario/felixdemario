/* Günlüğüm — her gün bir sayfa: günlük, okunan sayfa ve okuma notları.
   Tüm veriler yalnızca bu cihazda (localStorage) tutulur. */
(() => {
  "use strict";

  /* ================= yardımcılar ================= */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const fmt = (n) => Math.round(n).toLocaleString("tr-TR");
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
  const AYK = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  const GUNLER = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];
  const GK = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  const MOODS = [null, "Zor", "Durgun", "İdare eder", "İyi", "Harika"];

  const pad = (n) => String(n).padStart(2, "0");
  const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
  const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const dow = (d) => (d.getDay() + 6) % 7; // 0 = Pazartesi
  const weekStart = (d) => addDays(d, -dow(d));
  const daysBetween = (a, b) => Math.round((b - a) / 864e5);
  const longDate = (d) => `${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()}`;
  const words = (s) => (s || "").trim().split(/\s+/).filter(Boolean).length;

  /* ================= ikonlar ================= */
  const P = {
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    cal: '<rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    book: '<path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6.5A2.5 2.5 0 0 0 4 21.5"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H19"/><path d="M9 7h6"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
    flame: '<path d="M12 22c4 0 7-2.7 7-6.8 0-3.1-2-5.4-3.4-7-.4 1.7-1.3 2.9-2.6 3.4.3-3.7-1.2-6.8-4-8.6.2 3-1.4 5-3 6.7C4.7 11.3 5 13 5 15.2 5 19.3 8 22 12 22Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    left: '<path d="m15 18-6-6 6-6"/>',
    right: '<path d="m9 18 6-6-6-6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    trash: '<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>',
    down: '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>',
    up: '<path d="M12 15V3M7 8l5-5 5 5M5 21h14"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    palette: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18M12 3a9 9 0 0 1 0 18"/>',
    text: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    edit: '<path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4Z"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9Z"/>',
    del: '<path d="M21 5H8l-6 7 6 7h13a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1Z"/><path d="m17 9-6 6M11 9l6 6"/>',
    quote: '<path d="M7 7h4v4c0 3-1.5 5-4 6M15 7h4v4c0 3-1.5 5-4 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  };
  const ic = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;
  const MOUTH = { 1: "M8 16.6q4-3.2 8 0", 2: "M8.2 16q3.8-1.4 7.6 0", 3: "M8.3 15.3h7.4", 4: "M8 14.4q4 3.2 8 0", 5: "M7.4 13.6q4.6 5 9.2 0Z" };
  const face = (m) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.6"/><circle cx="9" cy="10" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1.1" fill="currentColor" stroke="none"/><path d="${MOUTH[m]}" ${m === 5 ? 'fill="currentColor"' : ""}/></svg>`;
  const moodColor = (m) => `var(--m${m})`;

  /* ================= veri ================= */
  const KEY = "gunlugum.v1";
  const blank = () => ({ v: 1, settings: { name: "", goal: 20, theme: "system", pin: "", onboarded: false }, books: [], activeBook: null, days: {} });
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY));
      if (d && typeof d.days === "object") {
        const b = blank();
        return { ...b, ...d, settings: { ...b.settings, ...d.settings }, books: Array.isArray(d.books) ? d.books : [] };
      }
    } catch (e) { /* bozuk veri: boş başla */ }
    return blank();
  }
  let S = load();
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); return true; }
    catch (e) { toast("Kaydedilemedi — depolama dolu olabilir"); return false; }
  }

  const entry = (k) => S.days[k] || null;
  const isActive = (e) => !!e && (!!(e.text || "").trim() || !!(e.notes || "").trim() || e.pages > 0);
  const hasWriting = (e) => !!e && !!(e.text || "").trim();
  function setEntry(k, patch) {
    const e = { text: "", notes: "", pages: 0, mood: 0, bookId: null, ...S.days[k], ...patch, updatedAt: Date.now() };
    if (!isActive(e) && !e.mood) delete S.days[k];
    else S.days[k] = e;
    save();
  }

  const book = (id) => S.books.find((b) => b.id === id) || null;
  function bookRead(id) {
    let s = 0;
    for (const k in S.days) if (S.days[k].bookId === id) s += S.days[k].pages || 0;
    return s;
  }
  function bookProgress(b) {
    const done = clamp((b.start || 0) + bookRead(b.id), 0, b.total || Infinity);
    const pct = b.total ? clamp(done / b.total, 0, 1) : 0;
    return { done, pct, left: b.total ? Math.max(0, b.total - done) : 0 };
  }
  const COVERS = [["#6b2f1f", "#3e1a11"], ["#22413a", "#11241f"], ["#2b3556", "#161c33"], ["#7a5a2a", "#47321a"], ["#4b2a46", "#2a1627"], ["#3f4a2a", "#222917"], ["#8a3b2e", "#4e1d16"], ["#2e4a5c", "#182a36"]];
  function coverHTML(b, cls = "") {
    if (!b) return `<span class="cover empty ${cls}">${ic("plus")}</span>`;
    let h = 0; for (const c of b.title) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const [c1, c2] = COVERS[h % COVERS.length];
    const ini = b.title.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toLocaleUpperCase("tr-TR");
    return `<span class="cover ${cls}" style="--c1:${c1};--c2:${c2}">${esc(ini)}</span>`;
  }
  // Son 21 günün okuma hızına göre tahmini bitiş
  function pace() {
    const t = today(); let s = 0, n = 0;
    for (let i = 0; i < 21; i++) { const e = entry(keyOf(addDays(t, -i))); if (e && e.pages > 0) { s += e.pages; n++; } }
    return n ? s / 21 : 0;
  }

  function streak() {
    let d = today();
    if (!isActive(entry(keyOf(d)))) d = addDays(d, -1);
    let n = 0;
    while (isActive(entry(keyOf(d)))) { n++; d = addDays(d, -1); }
    return n;
  }
  function longest(from, to) {
    let best = 0, cur = 0;
    for (let d = new Date(from); d <= to; d = addDays(d, 1)) {
      if (isActive(entry(keyOf(d)))) { cur++; if (cur > best) best = cur; } else cur = 0;
    }
    return best;
  }

  /* Gün için yazma önerileri: boş sayfada yer tutucu olarak döner */
  const PROMPTS = [
    "Bugün seni en çok ne gülümsetti?", "Bugün öğrendiğin küçük bir şey neydi?", "Bugünü tek bir kelimeyle anlatsan…",
    "Kime teşekkür etmek isterdin, neden?", "Bugün seni ne yordu, ne dinlendirdi?", "Yarın kendine ne hatırlatmak istersin?",
    "Bugün okuduklarından aklında kalan cümle hangisi?", "Bugün neyi farklı yapardın?", "Bugün kendinle gurur duyduğun an…",
    "Bugün hangi düşünce kafanı en çok meşgul etti?", "Bugün fark ettiğin güzel bir ayrıntı…", "Bugün bir şeyi bıraksaydın, ne olurdu?",
    "Bugünün sesi, kokusu, rengi neydi?", "Bugün kime iyi geldin, kim sana iyi geldi?", "Şu an içinden geçenleri olduğu gibi yaz…",
  ];
  const promptFor = (k) => { let h = 0; for (const c of k) h = (h * 33 + c.charCodeAt(0)) >>> 0; return PROMPTS[h % PROMPTS.length]; };
  function greeting() {
    const h = new Date().getHours();
    return h < 5 ? "İyi geceler" : h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : h < 22 ? "İyi akşamlar" : "İyi geceler";
  }

  /* ================= tema ================= */
  const mqDark = matchMedia("(prefers-color-scheme: dark)");
  const isDark = () => S.settings.theme === "dark" || (S.settings.theme === "system" && mqDark.matches);
  function applyTheme() {
    const t = S.settings.theme;
    if (t === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.setAttribute("data-theme", t);
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    $$('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", bg));
    const tb = $("#t-theme"); if (tb) tb.innerHTML = ic(isDark() ? "sun" : "moon");
  }
  mqDark.addEventListener?.("change", () => { applyTheme(); renderAll(); });

  /* ================= genel arayüz ================= */
  let toastT;
  function toast(msg) {
    const t = $("#toast"); t.textContent = msg; t.classList.add("on");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 2400);
  }

  // Alt pencere: açılır, kapanır; içerik verilen fonksiyonla çizilir
  let sheetStack = [];
  function openSheet(title, build, opts = {}) {
    const scrim = document.createElement("div"); scrim.className = "scrim";
    const el = document.createElement("div"); el.className = "sheet"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", title);
    el.innerHTML = `<div class="grab"></div><div class="sh-head"><h2>${esc(title)}</h2><button class="iconbtn" data-close aria-label="Kapat">${ic("x")}</button></div><div class="sh-body"></div>`;
    document.body.append(scrim, el);
    const ctx = { el, body: $(".sh-body", el), close: () => close(), rebuild: () => { ctx.body.innerHTML = ""; build(ctx); } };
    function close() {
      el.classList.remove("on"); scrim.classList.remove("on");
      sheetStack = sheetStack.filter((s) => s !== ctx);
      setTimeout(() => { el.remove(); scrim.remove(); }, 320);
      opts.onClose && opts.onClose();
    }
    scrim.onclick = close;
    $("[data-close]", el).onclick = close;
    // aşağı kaydırarak kapat
    let y0 = null;
    $(".grab", el).parentElement.addEventListener("touchstart", (e) => { if (e.target.closest(".sh-body")) return; y0 = e.touches[0].clientY; }, { passive: true });
    el.addEventListener("touchend", (e) => { if (y0 != null && e.changedTouches[0].clientY - y0 > 70) close(); y0 = null; });
    build(ctx);
    sheetStack.push(ctx);
    requestAnimationFrame(() => requestAnimationFrame(() => { el.classList.add("on"); scrim.classList.add("on"); }));
    return ctx;
  }
  const closeAllSheets = () => [...sheetStack].forEach((s) => s.close());

  function confirmSheet(title, text, okLabel, onOk) {
    openSheet(title, (c) => {
      c.body.innerHTML = `<p class="muted">${esc(text)}</p><div class="btnrow"><button class="btn ghost" data-n>Vazgeç</button><button class="btn danger" data-y>${esc(okLabel)}</button></div>`;
      $("[data-n]", c.body).onclick = c.close;
      $("[data-y]", c.body).onclick = () => { c.close(); onOk(); };
    });
  }

  /* ================= sekmeler ================= */
  let tab = "today";
  const TABS = { today: ["pen", "Bugün"], cal: ["cal", "Takvim"], books: ["book", "Kitaplar"], rep: ["chart", "Rapor"] };
  $$("#tabs .tab").forEach((b) => {
    const [i, l] = TABS[b.dataset.s];
    b.innerHTML = `${ic(i)}<span>${l}</span>`;
    b.onclick = () => go(b.dataset.s);
  });
  function go(s) {
    tab = s;
    $$("#tabs .tab").forEach((b) => b.classList.toggle("on", b.dataset.s === s));
    $$(".screen").forEach((el) => el.classList.toggle("on", el.id === "s-" + s));
    renderTab();
  }
  function renderTab() {
    if (tab === "today") renderToday();
    else if (tab === "cal") renderCal();
    else if (tab === "books") renderBooks();
    else renderReport();
  }
  const renderAll = renderTab;

  /* ================= BUGÜN ================= */
  let sel = keyOf(today());
  let field = "text";

  $("#t-settings").innerHTML = ic("gear");
  $("#t-minus").innerHTML = ic("minus");
  $("#t-plus").innerHTML = ic("plus");
  $("#t-saved").innerHTML = ic("check") + "Kaydedildi";

  function renderToday() {
    const d = parse(sel), t = today(), e = entry(sel) || {};
    const diff = daysBetween(d, t);
    $("#t-eyebrow").textContent = diff === 0 ? `${GUNLER[dow(d)]} · ${greeting()}${S.settings.name ? ", " + S.settings.name : ""}`
      : diff === 1 ? `Dün · ${GUNLER[dow(d)]}` : `${GUNLER[dow(d)]} · ${d.getFullYear()}`;
    $("#t-date").innerHTML = `${d.getDate()} <em>${AYLAR[d.getMonth()]}</em>`;
    const st = streak();
    const sb = $("#t-streak");
    sb.innerHTML = `${ic("flame")}<span class="num">${st}</span>`;
    sb.classList.toggle("hot", isActive(entry(keyOf(t))) && st > 0);

    // hafta şeridi
    const ws = weekStart(d);
    $("#t-week").innerHTML = Array.from({ length: 7 }, (_, i) => {
      const x = addDays(ws, i), k = keyOf(x);
      const cls = [k === sel && "sel", k === keyOf(t) && "today", isActive(entry(k)) && "done"].filter(Boolean).join(" ");
      return `<button class="wd ${cls}" data-k="${k}" ${x > t ? "disabled" : ""}><small>${GK[i]}</small><b>${x.getDate()}</b><i></i></button>`;
    }).join("");

    // ruh hâli
    $("#t-moods").innerHTML = [1, 2, 3, 4, 5].map((m) =>
      `<button class="mood ${e.mood === m ? "on" : ""}" data-m="${m}" style="--mc:${moodColor(m)}" aria-label="${MOODS[m]}" title="${MOODS[m]}">${face(m)}</button>`).join("");

    // editör
    $$("#t-seg button").forEach((b) => {
      b.classList.toggle("on", b.dataset.k === field);
      const has = b.dataset.k === "notes" && (e.notes || "").trim();
      b.innerHTML = (b.dataset.k === "text" ? "Günlük" : "Okuma notları") + (has && field !== "notes" ? '<span class="dot"></span>' : "");
    });
    const ta = $("#t-page");
    if (document.activeElement !== ta) ta.value = e[field] || "";
    const bk = book(e.bookId ?? (diff === 0 || !e.pages ? S.activeBook : null));
    ta.placeholder = field === "text" ? promptFor(sel) : bk ? `“${bk.title}” hakkında notların, altını çizdiğin cümleler…` : "Okuduklarından notlar, alıntılar, düşünceler…";
    updateWords();

    renderReading();
  }

  function currentBookId() {
    const e = entry(sel);
    if (e && e.bookId !== undefined && (e.pages > 0 || (e.notes || "").trim())) return e.bookId;
    const ab = book(S.activeBook);
    return ab && !ab.finishedAt ? ab.id : null;
  }

  function renderReading() {
    const e = entry(sel) || {}, b = book(currentBookId());
    const p = b ? bookProgress(b) : null;
    $("#t-book").innerHTML = coverHTML(b) + `<span class="t"><b>${b ? esc(b.title) : "Kitap seç"}</b><small>${b
      ? (b.total ? `s. ${fmt(p.done)} / ${fmt(b.total)} · %${Math.round(p.pct * 100)}` : esc(b.author || "Okunuyor"))
      : "Ne okuyorsun? Dokun ve ekle"}</small></span>`;
    const pages = e.pages || 0, goal = S.settings.goal || 20;
    const inp = $("#t-pages");
    if (document.activeElement !== inp) inp.value = pages || "";
    inp.placeholder = "0";
    const r = clamp(pages / goal, 0, 1);
    $("#t-ring .val").style.strokeDashoffset = String(157.08 * (1 - r));
    $("#t-ring").classList.toggle("full", pages >= goal);
    $("#t-ring small").textContent = pages >= goal ? "✓" : `/ ${goal}`;
  }

  function updateWords() {
    const e = entry(sel) || {};
    const w = words(e.text) + words(e.notes);
    $("#t-words").textContent = w ? `${fmt(w)} kelime` : "";
  }

  let savedT;
  function flashSaved() {
    const s = $("#t-saved"); s.classList.add("on");
    clearTimeout(savedT); savedT = setTimeout(() => s.classList.remove("on"), 1400);
  }

  // olaylar
  $("#t-week").addEventListener("click", (ev) => {
    const b = ev.target.closest(".wd"); if (!b || b.disabled) return;
    sel = b.dataset.k; renderToday();
  });
  // hafta şeridini kaydırarak önceki / sonraki hafta
  (() => {
    let x0 = null;
    const w = $("#t-week");
    w.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    w.addEventListener("touchend", (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) < 50) return;
      let d = addDays(parse(sel), dx < 0 ? 7 : -7);
      if (d > today()) d = today();
      sel = keyOf(d); renderToday();
    });
  })();
  $("#t-date").onclick = () => { calMonth = new Date(parse(sel).getFullYear(), parse(sel).getMonth(), 1); calSel = sel; go("cal"); };
  $("#t-streak").onclick = () => {
    const st = streak(), y = today().getFullYear();
    toast(st ? `${st} gündür aralıksız yazıyorsun · ${y} en uzun: ${longest(new Date(y, 0, 1), today())} gün` : "Bugün yaz, serin başlasın ✨");
  };
  $("#t-theme").onclick = () => { S.settings.theme = isDark() ? "light" : "dark"; save(); applyTheme(); renderAll(); };
  $("#t-settings").onclick = openSettings;
  $("#t-moods").addEventListener("click", (ev) => {
    const b = ev.target.closest(".mood"); if (!b) return;
    const m = +b.dataset.m, e = entry(sel) || {};
    setEntry(sel, { mood: e.mood === m ? 0 : m });
    renderToday(); flashSaved();
  });
  $("#t-seg").addEventListener("click", (ev) => {
    const b = ev.target.closest("button"); if (!b) return;
    field = b.dataset.k; renderToday();
  });
  let typeT;
  $("#t-page").addEventListener("input", (ev) => {
    const v = ev.target.value;
    clearTimeout(typeT);
    typeT = setTimeout(() => {
      const patch = { [field]: v };
      if (field === "notes" && !(entry(sel) || {}).bookId) patch.bookId = currentBookId();
      setEntry(sel, patch); updateWords(); flashSaved();
      // hafta şeridindeki noktayı güncelle
      const wd = $(`#t-week .wd[data-k="${sel}"]`); if (wd) wd.classList.toggle("done", isActive(entry(sel)));
    }, 350);
  });
  $("#t-page").addEventListener("focus", () => document.body.classList.add("typing"));
  $("#t-page").addEventListener("blur", () => {
    clearTimeout(typeT);
    const v = $("#t-page").value, e = entry(sel) || {};
    if ((e[field] || "") !== v) { setEntry(sel, { [field]: v }); flashSaved(); }
    setTimeout(() => { if (document.activeElement !== $("#t-page")) { document.body.classList.remove("typing"); renderToday(); } }, 60);
  });
  $("#t-done").addEventListener("pointerdown", (e) => { e.preventDefault(); $("#t-page").blur(); });

  function setPages(n) {
    n = clamp(Math.round(+n || 0), 0, 9999);
    const e = entry(sel) || {}, bid = currentBookId();
    const before = book(bid) ? bookProgress(book(bid)).done : 0;
    const wasGoal = (e.pages || 0) >= S.settings.goal;
    setEntry(sel, { pages: n, bookId: n > 0 ? bid : e.notes ? bid : null });
    renderToday(); flashSaved();
    if (!wasGoal && n >= S.settings.goal) toast("Günlük hedefini tamamladın 🎯");
    const b = book(bid);
    if (b && b.total && !b.finishedAt) {
      const p = bookProgress(b);
      if (p.done >= b.total && before < b.total) finishBook(b, sel);
    }
  }
  $("#t-plus").onclick = () => setPages(((entry(sel) || {}).pages || 0) + 1);
  $("#t-minus").onclick = () => setPages(((entry(sel) || {}).pages || 0) - 1);
  // basılı tutunca hızlı artır
  ["#t-plus", "#t-minus"].forEach((id) => {
    let iv, to;
    const stop = () => { clearTimeout(to); clearInterval(iv); };
    $(id).addEventListener("pointerdown", () => {
      to = setTimeout(() => { iv = setInterval(() => $(id).click(), 90); }, 450);
    });
    ["pointerup", "pointerleave", "pointercancel"].forEach((ev) => $(id).addEventListener(ev, stop));
  });
  $("#t-pages").addEventListener("change", (e) => setPages(e.target.value));
  $("#t-pages").addEventListener("focus", (e) => e.target.select());
  $("#t-pages").addEventListener("keydown", (e) => { if (e.key === "Enter") e.target.blur(); });
  $("#t-book").onclick = () => openBookPicker();

  function finishBook(b, k) {
    b.finishedAt = k; if (S.activeBook === b.id) {
      const next = S.books.find((x) => !x.finishedAt && x.id !== b.id);
      S.activeBook = next ? next.id : null;
    }
    save(); renderAll();
    openSheet("Tebrikler!", (c) => {
      const days = Object.values(S.days).filter((e) => e.bookId === b.id && e.pages > 0).length;
      c.body.innerHTML = `<div style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px;padding:6px 0 4px">
        <div class="celebrate">📚</div>
        ${coverHTML(b, "big")}
        <h3 class="serif" style="font-size:22px">“${esc(b.title)}” bitti</h3>
        <p class="muted">${fmt(b.total)} sayfa · ${days} günde okudun. Kitaplığına eklendi.</p></div>
        <button class="btn acc wide" data-ok>Harika</button>`;
      $("[data-ok]", c.body).onclick = c.close;
    });
  }

  /* ================= kitap seçici & kitap formu ================= */
  function openBookPicker() {
    openSheet("Ne okuyorsun?", (c) => {
      const cur = currentBookId();
      const reading = S.books.filter((b) => !b.finishedAt);
      c.body.innerHTML = `<div class="pick-list">${reading.map((b) => {
        const p = bookProgress(b);
        return `<button class="pick ${b.id === cur ? "on" : ""}" data-id="${b.id}">${coverHTML(b)}<span class="t"><b>${esc(b.title)}</b><small>${esc(b.author || "")}${b.total ? `${b.author ? " · " : ""}%${Math.round(p.pct * 100)}` : ""}</small></span>${b.id === cur ? ic("check", "ok") : ""}</button>`;
      }).join("")}
      <button class="pick" data-id="">${coverHTML(null)}<span class="t"><b>Kitapsız kaydet</b><small>Sadece sayfa sayısı</small></span>${cur == null ? ic("check", "ok") : ""}</button></div>
      <button class="btn acc wide" data-new>${ic("plus")}Yeni kitap ekle</button>`;
      $$(".pick", c.body).forEach((p) => p.onclick = () => {
        const id = p.dataset.id || null;
        const e = entry(sel);
        if (e && (e.pages > 0 || (e.notes || "").trim())) setEntry(sel, { bookId: id });
        if (id) S.activeBook = id; save();
        c.close(); renderToday();
      });
      $("[data-new]", c.body).onclick = () => { c.close(); openBookForm(null, (b) => { const e = entry(sel); if (e && e.pages > 0) setEntry(sel, { bookId: b.id }); renderToday(); }); };
    });
  }

  function openBookForm(b, after) {
    const isNew = !b;
    openSheet(isNew ? "Yeni kitap" : "Kitabı düzenle", (c) => {
      c.body.innerHTML = `
        <div class="field"><label>Kitap adı</label><input class="inp" id="f-title" maxlength="120" value="${esc(b?.title)}" placeholder="Örn. Kürk Mantolu Madonna" autocomplete="off"></div>
        <div class="field"><label>Yazar</label><input class="inp" id="f-author" maxlength="80" value="${esc(b?.author)}" placeholder="Örn. Sabahattin Ali" autocomplete="off"></div>
        <div class="row2">
          <div class="field"><label>Toplam sayfa</label><input class="inp" id="f-total" type="number" inputmode="numeric" min="1" value="${b?.total || ""}" placeholder="160"></div>
          <div class="field"><label>Şu an kaçıncı sayfadasın?</label><input class="inp" id="f-start" type="number" inputmode="numeric" min="0" value="${b?.start || ""}" placeholder="0"></div>
        </div>
        <button class="btn acc wide" id="f-save">${ic("check")}${isNew ? "Kitaplığa ekle" : "Kaydet"}</button>`;
      if (isNew) setTimeout(() => $("#f-title", c.body).focus(), 350);
      $("#f-save", c.body).onclick = () => {
        const title = $("#f-title", c.body).value.trim();
        if (!title) { $("#f-title", c.body).focus(); toast("Kitap adını yaz"); return; }
        const data = { title, author: $("#f-author", c.body).value.trim(), total: Math.max(0, parseInt($("#f-total", c.body).value) || 0), start: Math.max(0, parseInt($("#f-start", c.body).value) || 0) };
        if (isNew) { b = { id: uid(), createdAt: keyOf(today()), finishedAt: null, ...data }; S.books.unshift(b); S.activeBook = b.id; }
        else Object.assign(b, data);
        save(); c.close(); toast(isNew ? "Kitaplığa eklendi" : "Kaydedildi");
        after ? after(b) : renderAll();
      };
    });
  }

  function openBookDetail(b) {
    openSheet("Kitap", (c) => {
      const p = bookProgress(b);
      const logs = Object.keys(S.days).filter((k) => S.days[k].bookId === b.id).sort();
      const readDays = logs.filter((k) => S.days[k].pages > 0);
      const notes = logs.filter((k) => (S.days[k].notes || "").trim()).reverse();
      const sp = pace();
      const eta = !b.finishedAt && b.total && sp > 0 ? addDays(today(), Math.ceil(p.left / sp)) : null;
      c.body.innerHTML = `
        <div class="bd-top">${coverHTML(b)}<div style="min-width:0"><h3>${esc(b.title)}</h3><p>${esc(b.author || "Yazar belirtilmedi")}</p>
          ${b.total ? `<div class="bar"><i style="width:${p.pct * 100}%"></i></div><p>${fmt(p.done)} / ${fmt(b.total)} sayfa · %${Math.round(p.pct * 100)}</p>` : ""}</div></div>
        <div class="stats3">
          <div><b>${readDays.length}</b><small>okuma günü</small></div>
          <div><b>${readDays.length ? fmt(bookRead(b.id) / readDays.length) : "–"}</b><small>sayfa / gün</small></div>
          <div><b>${b.finishedAt ? "✓" : eta ? `${eta.getDate()} ${AYK[eta.getMonth()]}` : "–"}</b><small>${b.finishedAt ? "bitti · " + (() => { const d = parse(b.finishedAt); return `${d.getDate()} ${AYK[d.getMonth()]}`; })() : "tahmini bitiş"}</small></div>
        </div>
        <div class="btnrow">
          ${b.finishedAt ? `<button class="btn ghost sm" data-a="unfinish">Tekrar okuyorum</button>` : `<button class="btn ghost sm" data-a="active">${S.activeBook === b.id ? "✓ Şu an okunan" : "Şu an bunu okuyorum"}</button><button class="btn ghost sm" data-a="finish">Bitirdim</button>`}
        </div>
        ${notes.length ? `<div class="sec-t">Okuma notları · ${notes.length}</div>${notes.map((k) => { const d = parse(k); return `<button class="note" data-k="${k}"><small>${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()}</small><p>${esc(S.days[k].notes.trim())}</p></button>`; }).join("")}` : `<p class="muted" style="font-size:13px;text-align:center">Bu kitap için henüz not yok. Bugün ekranındaki “Okuma notları” sekmesinden ekleyebilirsin.</p>`}
        <div class="btnrow"><button class="btn ghost" data-a="edit">${ic("edit")}Düzenle</button><button class="btn danger" data-a="del">${ic("trash")}Sil</button></div>`;
      $$("[data-a]", c.body).forEach((x) => x.onclick = () => {
        const a = x.dataset.a;
        if (a === "edit") { c.close(); openBookForm(b); }
        else if (a === "del") confirmSheet("Kitap silinsin mi?", "Kitap kitaplıktan kalkar. Günlüklerin ve okuduğun sayfa kayıtları silinmez.", "Sil", () => {
          S.books = S.books.filter((x) => x.id !== b.id); if (S.activeBook === b.id) S.activeBook = null;
          for (const k in S.days) if (S.days[k].bookId === b.id) S.days[k].bookId = null;
          save(); c.close(); renderAll(); toast("Kitap silindi");
        });
        else if (a === "active") { S.activeBook = b.id; save(); c.rebuild(); renderAll(); }
        else if (a === "finish") { b.finishedAt = keyOf(today()); if (S.activeBook === b.id) S.activeBook = null; save(); c.rebuild(); renderAll(); toast("Tebrikler, bir kitap daha bitti 📚"); }
        else if (a === "unfinish") { b.finishedAt = null; S.activeBook = b.id; save(); c.rebuild(); renderAll(); }
      });
      $$(".note", c.body).forEach((n) => n.onclick = () => { closeAllSheets(); openDay(n.dataset.k, "notes"); });
    });
  }

  /* ================= TAKVİM ================= */
  let calMonth = new Date(today().getFullYear(), today().getMonth(), 1);
  let calSel = keyOf(today());
  $("#c-search").innerHTML = ic("search");
  $("#c-prev").innerHTML = ic("left");
  $("#c-next").innerHTML = ic("right");
  $("#c-wh").innerHTML = GK.map((g) => `<span>${g}</span>`).join("");

  function heatClass(p) {
    const g = S.settings.goal || 20;
    if (!p) return "";
    const r = p / g;
    return r < 0.34 ? "h1" : r < 0.75 ? "h2" : r < 1.25 ? "h3" : "h4";
  }

  function renderCal() {
    const t = today(), y = calMonth.getFullYear(), m = calMonth.getMonth();
    $("#c-title").innerHTML = `${AYLAR[m]} <span>${y}</span>`;
    const first = new Date(y, m, 1), last = new Date(y, m + 1, 0);
    const start = weekStart(first);
    const rows = Math.ceil((dow(first) + last.getDate()) / 7);
    let html = "";
    for (let i = 0; i < rows * 7; i++) {
      const d = addDays(start, i), k = keyOf(d), e = entry(k);
      const hc = heatClass(e?.pages);
      const cls = [d.getMonth() !== m && "out", d > t && "fut", k === keyOf(t) && "today", k === calSel && "sel", hc].filter(Boolean).join(" ");
      const style = hc ? `--hc:var(--heat${hc[1]});` : "";
      const dot = hasWriting(e) || e?.mood ? `<i style="--mc:${e?.mood ? moodColor(e.mood) : "var(--ink2)"}"></i>` : "";
      html += `<button class="cd ${cls}" data-k="${k}" style="${style}">${d.getDate()}${dot}</button>`;
    }
    $("#c-grid").innerHTML = html;
    $("#c-next").disabled = new Date(y, m + 1, 1) > t;
    $("#c-next").style.opacity = $("#c-next").disabled ? .35 : 1;
    // ay özeti
    let pages = 0, wrote = 0;
    for (let d = new Date(first); d <= last; d = addDays(d, 1)) { const e = entry(keyOf(d)); if (e) { pages += e.pages || 0; if (hasWriting(e)) wrote++; } }
    $("#c-stat").innerHTML = `<span><b>${fmt(pages)}</b> sayfa</span><span><b>${wrote}</b> gün yazıldı</span>`;
    renderPreview();
  }

  function renderPreview() {
    const d = parse(calSel), e = entry(calSel), t = today();
    const pv = $("#c-preview");
    const head = `<div class="pv-head"><div><h3>${d.getDate()} ${AYLAR[d.getMonth()]}</h3><p>${GUNLER[dow(d)]} · ${d.getFullYear()}</p></div>`;
    // bir yıl / bir ay önce bugün
    const ago = (() => {
      const y1 = new Date(d.getFullYear() - 1, d.getMonth(), d.getDate());
      if (hasWriting(entry(keyOf(y1)))) return [keyOf(y1), "Geçen yıl bu gün"];
      const m1 = new Date(d.getFullYear(), d.getMonth() - 1, d.getDate());
      if (m1.getDate() === d.getDate() && hasWriting(entry(keyOf(m1)))) return [keyOf(m1), "Geçen ay bu gün"];
      return null;
    })();
    const otd = ago ? `<div class="otd">${ic("clock")}<span>${ago[1]} de yazmışsın.</span><button data-go="${ago[0]}">Oku</button></div>` : "";
    if (!isActive(e) && !e?.mood) {
      pv.innerHTML = `${head}</div><div class="pv-empty"><span class="serif">${d > t ? "Bu gün henüz gelmedi." : "Bu sayfa boş."}</span>${d > t ? "" : `<button class="btn acc" data-edit>${ic("pen")}${calSel === keyOf(t) ? "Bugünü yaz" : "Bu güne yaz"}</button>`}</div>${otd}`;
    } else {
      const b = book(e.bookId);
      const tags = [
        e.mood ? `<span class="tag" style="color:${moodColor(e.mood)}">${face(e.mood)}<span style="color:var(--ink2)">${MOODS[e.mood]}</span></span>` : "",
        e.pages ? `<span class="tag">${ic("book")}<span>${e.pages} sayfa${b ? " · " + esc(b.title) : ""}</span></span>` : "",
        words(e.text) ? `<span class="tag">${ic("text")}<span>${words(e.text)} kelime</span></span>` : "",
      ].join("");
      const body = [(e.text || "").trim() && `<h4>Günlük</h4>${esc(e.text.trim())}`, (e.notes || "").trim() && `<h4>Okuma notları</h4>${esc(e.notes.trim())}`].filter(Boolean).join("\n");
      pv.innerHTML = `${head}<button class="btn sm ghost" data-edit>${ic("edit")}Düzenle</button></div><div class="pv-tags">${tags}</div><div class="pv-body">${body || '<span class="muted" style="font-style:italic">Yazı yok.</span>'}</div>${otd}`;
    }
    const ed = $("[data-edit]", pv); if (ed) ed.onclick = () => openDay(calSel);
    const gg = $("[data-go]", pv); if (gg) gg.onclick = () => { calSel = gg.dataset.go; const x = parse(calSel); calMonth = new Date(x.getFullYear(), x.getMonth(), 1); renderCal(); };
  }

  function openDay(k, f) {
    sel = k; field = f || "text"; go("today");
  }

  $("#c-grid").addEventListener("click", (ev) => {
    const b = ev.target.closest(".cd"); if (!b) return;
    calSel = b.dataset.k;
    const d = parse(calSel);
    if (d.getMonth() !== calMonth.getMonth()) calMonth = new Date(d.getFullYear(), d.getMonth(), 1);
    renderCal();
  });
  $("#c-prev").onclick = () => { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1); renderCal(); };
  $("#c-next").onclick = () => { if (!$("#c-next").disabled) { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1); renderCal(); } };
  (() => { // takvimi kaydırarak ay değiştir
    let x0 = null; const g = $("#c-grid");
    g.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    g.addEventListener("touchend", (e) => {
      if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) (dx < 0 ? $("#c-next") : $("#c-prev")).click();
    });
  })();
  $("#c-search").onclick = openSearch;

  function openSearch() {
    openSheet("Ara", (c) => {
      c.body.innerHTML = `<div class="search-wrap">${ic("search")}<input class="inp" id="q" type="search" placeholder="Günlüklerde, notlarda, kitaplarda…" autocomplete="off"></div><div class="pick-list" id="qr"></div>`;
      const q = $("#q", c.body), out = $("#qr", c.body);
      const run = () => {
        const s = q.value.trim().toLocaleLowerCase("tr-TR");
        if (s.length < 2) { out.innerHTML = `<p class="muted" style="text-align:center;font-size:13px;padding:10px">${Object.keys(S.days).length} günlük kayıt içinde ara.</p>`; return; }
        const res = [];
        for (const k of Object.keys(S.days).sort().reverse()) {
          const e = S.days[k], b = book(e.bookId);
          const hay = [e.text, e.notes, b?.title, b?.author].join("\n");
          const i = hay.toLocaleLowerCase("tr-TR").indexOf(s);
          if (i < 0) continue;
          const a = Math.max(0, i - 40);
          const snip = (a ? "…" : "") + hay.slice(a, i + s.length + 80).replace(/\n+/g, " ");
          const hi = esc(snip).replace(new RegExp(esc(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), (x) => `<mark>${x}</mark>`);
          res.push(`<button class="note" data-k="${k}"><small>${longDate(parse(k))}</small><p>${hi}</p></button>`);
          if (res.length >= 60) break;
        }
        out.innerHTML = res.join("") || `<p class="muted" style="text-align:center;padding:10px">Sonuç yok.</p>`;
        $$(".note", out).forEach((n) => n.onclick = () => { c.close(); calSel = n.dataset.k; const d = parse(calSel); calMonth = new Date(d.getFullYear(), d.getMonth(), 1); renderCal(); });
      };
      q.oninput = run; run();
      setTimeout(() => q.focus(), 350);
    });
  }

  /* ================= KİTAPLAR ================= */
  let libTab = "reading";
  $("#b-add").innerHTML = ic("plus");
  $("#b-add").onclick = () => openBookForm(null);
  $("#b-seg").addEventListener("click", (ev) => { const b = ev.target.closest("button"); if (!b) return; libTab = b.dataset.k; renderBooks(); });

  function renderBooks() {
    const year = today().getFullYear();
    const finishedThisYear = S.books.filter((b) => b.finishedAt && b.finishedAt.startsWith(year)).length;
    $("#b-eyebrow").textContent = S.books.length ? `${year} · ${finishedThisYear} kitap bitti` : "Kitaplığın";
    $$("#b-seg button").forEach((b) => b.classList.toggle("on", b.dataset.k === libTab));

    const ab = book(S.activeBook);
    const hero = $("#b-hero");
    if (ab && !ab.finishedAt) {
      const p = bookProgress(ab), sp = pace();
      const eta = ab.total && sp > 0 ? addDays(today(), Math.ceil(p.left / sp)) : null;
      hero.className = "card hero"; hero.style.cursor = "pointer";
      hero.innerHTML = `${coverHTML(ab)}<div class="info"><div class="eyebrow" style="color:var(--accent)">Şu an okuyorsun</div><h3>${esc(ab.title)}</h3><p>${esc(ab.author || "")}</p>
        ${ab.total ? `<div class="bar"><i style="width:${p.pct * 100}%"></i></div><div class="hero-stats"><span><b>%${Math.round(p.pct * 100)}</b> · ${fmt(p.left)} sayfa kaldı</span>${eta ? `<span>~${eta.getDate()} ${AYK[eta.getMonth()]}</span>` : ""}</div>` : ""}</div>`;
      hero.onclick = () => openBookDetail(ab);
    } else { hero.className = ""; hero.innerHTML = ""; hero.onclick = null; }

    const list = $("#b-list");
    if (libTab === "notes") {
      const ks = Object.keys(S.days).filter((k) => (S.days[k].notes || "").trim()).sort().reverse();
      list.innerHTML = ks.length ? ks.map((k) => { const e = S.days[k], b = book(e.bookId); return `<button class="note card" data-k="${k}"><small>${longDate(parse(k))}${b ? " · " + esc(b.title) : ""}</small><p>${esc(e.notes.trim().slice(0, 400))}${e.notes.trim().length > 400 ? "…" : ""}</p></button>`; }).join("")
        : `<div class="empty-state">${ic("quote", "big")}<span class="serif">Henüz okuma notu yok</span><span>Altını çizdiğin cümleler burada toplanacak.</span></div>`;
      $$(".note", list).forEach((n) => n.onclick = () => openDay(n.dataset.k, "notes"));
      return;
    }
    const arr = S.books.filter((b) => (libTab === "done" ? !!b.finishedAt : !b.finishedAt) && !(libTab === "reading" && b.id === S.activeBook))
      .sort((a, b) => libTab === "done" ? (b.finishedAt > a.finishedAt ? 1 : -1) : 0);
    if (!arr.length) {
      list.innerHTML = libTab === "done"
        ? `<div class="empty-state">${ic("star", "big")}<span class="serif">Bitirdiğin kitaplar burada</span><span>Sayfaları girdikçe kitap kendiliğinden biter.</span></div>`
        : ab && !ab.finishedAt ? `<div class="empty-state"><span>Sıradaki kitaplarını da ekleyebilirsin.</span><button class="btn ghost sm" data-add>${ic("plus")}Kitap ekle</button></div>`
          : `<div class="empty-state">${ic("book", "big")}<span class="serif">Kitaplığın boş</span><span>Okuduğun kitabı ekle; ilerlemeni ve tahmini bitiş tarihini takip et.</span><button class="btn acc" data-add>${ic("plus")}İlk kitabını ekle</button></div>`;
      const a = $("[data-add]", list); if (a) a.onclick = () => openBookForm(null);
      return;
    }
    list.innerHTML = arr.map((b) => {
      const p = bookProgress(b);
      const sub = b.finishedAt ? `${esc(b.author || "")}${b.author ? " · " : ""}${(() => { const d = parse(b.finishedAt); return `${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()}`; })()}` : esc(b.author || (b.total ? `${fmt(b.total)} sayfa` : ""));
      return `<button class="card li" data-id="${b.id}">${coverHTML(b)}<span class="t"><b>${esc(b.title)}</b><small>${sub}</small>${!b.finishedAt && b.total ? `<span class="bar"><i style="width:${p.pct * 100}%"></i></span>` : ""}</span>
        <span class="pct ${b.finishedAt ? "fin" : ""}">${b.finishedAt ? "✓" : b.total ? "%" + Math.round(p.pct * 100) : ""}</span></button>`;
    }).join("");
    $$(".li", list).forEach((x) => x.onclick = () => openBookDetail(book(x.dataset.id)));
  }

  /* ================= RAPOR ================= */
  let rType = "week", rAnchor = today(), rPick = null;
  $("#r-prev").innerHTML = ic("left");
  $("#r-next").innerHTML = ic("right");
  $("#r-seg").addEventListener("click", (ev) => { const b = ev.target.closest("button"); if (!b) return; rType = b.dataset.k; rAnchor = today(); rPick = null; renderReport(); });
  function shift(n) {
    const a = rAnchor;
    rAnchor = rType === "week" ? addDays(a, 7 * n) : rType === "month" ? new Date(a.getFullYear(), a.getMonth() + n, 1) : new Date(a.getFullYear() + n, 0, 1);
    rPick = null; renderReport();
  }
  $("#r-prev").onclick = () => shift(-1);
  $("#r-next").onclick = () => { if (!$("#r-next").disabled) shift(1); };
  (() => { let x0 = null; const el = $("#s-rep .chart");
    el.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener("touchend", (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 60) (dx < 0 ? $("#r-next") : $("#r-prev")).click(); });
  })();

  function range(type, a) {
    if (type === "week") { const s = weekStart(a); return [s, addDays(s, 6)]; }
    if (type === "month") return [new Date(a.getFullYear(), a.getMonth(), 1), new Date(a.getFullYear(), a.getMonth() + 1, 0)];
    return [new Date(a.getFullYear(), 0, 1), new Date(a.getFullYear(), 11, 31)];
  }
  function statsFor(from, to) {
    const t = today(), end = to < t ? to : t;
    // ilk kayıttan önceki günler “boş gün” sayılmasın
    const first = Object.keys(S.days).sort()[0];
    if (first && parse(first) > from) from = parse(first);
    const r = { pages: 0, wrote: 0, active: 0, goalDays: 0, words: 0, moods: [0, 0, 0, 0, 0, 0], elapsed: Math.max(0, daysBetween(from, end) + 1), books: {} };
    for (let d = new Date(from); d <= end; d = addDays(d, 1)) {
      const e = entry(keyOf(d)); if (!e) continue;
      r.pages += e.pages || 0;
      if (hasWriting(e)) r.wrote++;
      if (isActive(e)) r.active++;
      if ((e.pages || 0) >= S.settings.goal) r.goalDays++;
      r.words += words(e.text) + words(e.notes);
      if (e.mood) r.moods[e.mood]++;
      if (e.bookId && e.pages) r.books[e.bookId] = (r.books[e.bookId] || 0) + e.pages;
    }
    r.finished = S.books.filter((b) => b.finishedAt && b.finishedAt >= keyOf(from) && b.finishedAt <= keyOf(to)).length;
    r.longest = longest(from, end);
    return r;
  }

  function renderReport() {
    const t = today();
    $$("#r-seg button").forEach((b) => b.classList.toggle("on", b.dataset.k === rType));
    const [from, to] = range(rType, rAnchor);
    const prevA = rType === "week" ? addDays(from, -7) : rType === "month" ? new Date(from.getFullYear(), from.getMonth() - 1, 1) : new Date(from.getFullYear() - 1, 0, 1);
    const [pf, pt] = range(rType, prevA);
    const s = statsFor(from, to), ps = statsFor(pf, pt);
    const isCur = from <= t && t <= to;
    $("#r-next").disabled = to >= t; $("#r-next").style.opacity = to >= t ? .35 : 1;

    let title;
    if (rType === "week") title = isCur ? "Bu hafta" : from.getMonth() === to.getMonth() ? `${from.getDate()}–${to.getDate()} ${AYLAR[to.getMonth()]}` : `${from.getDate()} ${AYK[from.getMonth()]} – ${to.getDate()} ${AYK[to.getMonth()]}`;
    else if (rType === "month") title = `${AYLAR[from.getMonth()]} ${from.getFullYear()}`;
    else title = String(from.getFullYear());
    $("#r-title").textContent = title;

    const unit = rType === "week" ? "geçen hafta" : rType === "month" ? "geçen ay" : "geçen yıl";
    let delta = "";
    if (ps.pages > 0) { const pc = Math.round((s.pages - ps.pages) / ps.pages * 100); delta = `<span class="${pc >= 0 ? "up" : "down"}">${pc >= 0 ? "▲" : "▼"} %${Math.abs(pc)}</span> · ${unit}: ${fmt(ps.pages)}`; }
    else delta = s.pages ? "Yeni bir başlangıç" : "Henüz sayfa yok";
    const avg = s.elapsed ? s.pages / s.elapsed : 0;
    $("#r-kpis").innerHTML = `
      <div class="card kpi"><span class="eyebrow">Okunan sayfa</span><b class="num">${fmt(s.pages)}</b><p>${delta}</p></div>
      <div class="card kpi"><span class="eyebrow">Yazılan gün</span><b class="num">${s.wrote}<small>/ ${s.elapsed}</small></b><p>${s.elapsed ? `%${Math.round(s.wrote / s.elapsed * 100)} düzen` : "–"}</p></div>
      <div class="card kpi"><span class="eyebrow">Günlük ortalama</span><b class="num">${avg >= 10 ? fmt(avg) : avg.toFixed(1).replace(".", ",")}<small>sayfa</small></b><p>Hedef ${S.settings.goal} · ${s.goalDays} gün tuttu</p></div>
      <div class="card kpi"><span class="eyebrow">En uzun seri</span><b class="num">${s.longest}<small>gün</small></b><p>${isCur ? `Şu anki seri: ${streak()} gün` : `${s.active} aktif gün`}</p></div>`;

    // grafik
    let vals = [], labels = [], keys = [], tips = [];
    if (rType === "year") {
      for (let m = 0; m < 12; m++) {
        let p = 0; const last = new Date(from.getFullYear(), m + 1, 0);
        for (let d = new Date(from.getFullYear(), m, 1); d <= last; d = addDays(d, 1)) p += entry(keyOf(d))?.pages || 0;
        vals.push(p); labels.push(AYK[m]); keys.push(null);
        tips.push(`${AYLAR[m]} · ${fmt(p)} sayfa`);
      }
    } else {
      for (let d = new Date(from), i = 0; d <= to; d = addDays(d, 1), i++) {
        const p = entry(keyOf(d))?.pages || 0;
        vals.push(p); keys.push(keyOf(d));
        labels.push(rType === "week" ? GK[i] : [1, 5, 10, 15, 20, 25, 30].includes(d.getDate()) ? d.getDate() : "");
        tips.push(`${d.getDate()} ${AYLAR[d.getMonth()]} · ${p} sayfa`);
      }
    }
    const goal = S.settings.goal;
    const max = Math.max(1, ...vals, rType === "year" ? 0 : goal * 1.15);
    const gap = rType === "month" ? 3 : rType === "year" ? 7 : 10;
    const ch = $("#r-chart");
    ch.style.setProperty("--bgap", gap + "px");
    ch.innerHTML = `<div class="bars">${vals.map((v, i) => {
      const cls = [v === 0 && "zero", rType !== "year" && v >= goal && "goal", rPick === i && "pick"].filter(Boolean).join(" ");
      return `<button class="${cls}" data-i="${i}" aria-label="${tips[i]}"><i style="height:${Math.max(v ? 4 : 2, v / max * 100)}%"></i></button>`;
    }).join("")}${rType !== "year" ? `<div class="goalline" style="bottom:${goal / max * 100}%"><span>hedef ${goal}</span></div>` : ""}</div>
      <div class="xl">${labels.map((l) => `<span>${l}</span>`).join("")}</div>`;
    const yearAvg = rType === "year" ? vals.filter((v) => v).length : 0;
    $("#r-pick").textContent = rPick != null ? tips[rPick] : rType === "year" ? (yearAvg ? `aylık ort. ${fmt(s.pages / Math.max(1, yearAvg))} sayfa` : "") : (s.pages ? `toplam ${fmt(s.pages)} sayfa` : "");
    $$("#r-chart .bars button").forEach((b) => b.onclick = () => {
      const i = +b.dataset.i;
      if (rPick === i && keys[i]) { openDay(keys[i]); return; }
      if (rPick === i && rType === "year") { rType = "month"; rAnchor = new Date(from.getFullYear(), i, 1); rPick = null; renderReport(); return; }
      rPick = i; renderReport();
    });

    // ruh hâli
    const mt = s.moods.reduce((a, b) => a + b, 0);
    const mavg = mt ? s.moods.reduce((a, n, i) => a + n * i, 0) / mt : 0;
    const best = mt ? Math.round(mavg) : 0;
    $("#r-mood").innerHTML = `<div class="mrow"><span class="eyebrow">Ruh hâli</span>${mt ? `<span class="avg" style="color:${moodColor(best)}">${face(best)}<b>${MOODS[best]}</b></span>` : `<span>Henüz işaretlenmedi</span>`}</div>
      <div class="mdist">${mt ? [5, 4, 3, 2, 1].map((m) => s.moods[m] ? `<i style="width:${s.moods[m] / mt * 100}%;background:${moodColor(m)}" title="${MOODS[m]}: ${s.moods[m]}"></i>` : "").join("") : ""}</div>
      <div class="mrow">${mt ? [5, 4, 3, 2, 1].filter((m) => s.moods[m]).map((m) => `<span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${moodColor(m)};margin-right:5px"></i>${MOODS[m]} <b>${s.moods[m]}</b></span>`).slice(0, 3).join("") : `<span>Bugün ekranından gününü bir yüzle işaretle.</span>`}</div>`;

    // alt satır
    const topBook = Object.entries(s.books).sort((a, b) => b[1] - a[1])[0];
    const tb = topBook && book(topBook[0]);
    $("#r-foot").innerHTML = `
      <div><b class="num">${fmt(s.words)}</b><small>kelime yazdın</small></div>
      <div><b class="num">${s.finished}</b><small>kitap bitti</small></div>
      <div><b style="font-size:14px;line-height:1.6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${tb ? esc(tb.title) : "–"}</b><small>${tb ? `en çok · ${fmt(topBook[1])} s.` : "en çok okunan"}</small></div>`;
  }

  /* ================= AYARLAR ================= */
  function openSettings() {
    openSheet("Ayarlar", (c) => {
      const st = S.settings;
      const nDays = Object.keys(S.days).length;
      c.body.innerHTML = `
        <div class="set-group">
          <label class="set-row"><span class="l">${ic("user")}<span>Adın</span></span><input class="inp" id="s-name" style="height:38px;width:150px;text-align:right" maxlength="30" value="${esc(st.name)}" placeholder="İsteğe bağlı"></label>
          <div class="set-row"><span class="l">${ic("target")}<span>Günlük sayfa hedefi</span></span><span class="mini-step"><button class="stepbtn" data-g="-5">${ic("minus")}</button><b class="num" id="s-goal">${st.goal}</b><button class="stepbtn" data-g="5">${ic("plus")}</button></span></div>
          <div class="set-row"><span class="l">${ic("palette")}<span>Tema</span></span><div class="seg" id="s-theme"><button data-t="system">Sistem</button><button data-t="light">Açık</button><button data-t="dark">Koyu</button></div></div>
          <button class="set-row" id="s-lock"><span class="l">${ic("lock")}<span>Şifre kilidi<small>${st.pin ? "Açılışta 4 haneli şifre sorulur" : "Günlüğünü 4 haneli şifreyle koru"}</small></span></span><span class="switch ${st.pin ? "on" : ""}"></span></button>
        </div>
        <div class="sec-t">Yedekleme</div>
        <div class="set-group">
          <button class="set-row" id="s-exp"><span class="l">${ic("down")}<span>Yedek al<small>${nDays} gün · ${S.books.length} kitap · .json dosyası</small></span></span>${ic("right")}</button>
          <button class="set-row" id="s-imp"><span class="l">${ic("up")}<span>Yedeği geri yükle<small>Önceki bir yedek dosyasını seç</small></span></span>${ic("right")}</button>
          <button class="set-row" id="s-txt"><span class="l">${ic("text")}<span>Metin olarak dışa aktar<small>Tüm günlüğün, okunabilir .txt</small></span></span>${ic("right")}</button>
        </div>
        <button class="btn danger wide" id="s-wipe">${ic("trash")}Tüm verileri sil</button>
        <p class="muted" style="font-size:12px;text-align:center;line-height:1.6">Günlüğüm verilerini yalnızca bu cihazda saklar; hiçbir yere gönderilmez.<br>Telefon değiştirirken “Yedek al” ile dosyanı taşı.</p>`;
      $("#s-name", c.body).oninput = (e) => { st.name = e.target.value.trim(); save(); };
      $$("[data-g]", c.body).forEach((b) => b.onclick = () => { st.goal = clamp(st.goal + +b.dataset.g, 5, 500); $("#s-goal", c.body).textContent = st.goal; save(); });
      $$("#s-theme button", c.body).forEach((b) => { b.classList.toggle("on", b.dataset.t === st.theme); b.onclick = () => { st.theme = b.dataset.t; save(); applyTheme(); $$("#s-theme button", c.body).forEach((x) => x.classList.toggle("on", x === b)); }; });
      $("#s-lock", c.body).onclick = () => {
        if (st.pin) { st.pin = ""; save(); c.rebuild(); toast("Şifre kilidi kapatıldı"); }
        else setPinFlow(() => c.rebuild());
      };
      $("#s-exp", c.body).onclick = exportJSON;
      $("#s-imp", c.body).onclick = () => $("#importFile").click();
      $("#s-txt", c.body).onclick = exportTXT;
      $("#s-wipe", c.body).onclick = () => confirmSheet("Her şey silinsin mi?", "Tüm günlükler, notlar ve kitaplar bu cihazdan kalıcı olarak silinir. Önce yedek almanı öneririz.", "Hepsini sil", () => {
        const keepTheme = S.settings.theme;
        S = blank(); S.settings.theme = keepTheme; S.settings.onboarded = true; save();
        closeAllSheets(); sel = keyOf(today()); renderAll(); toast("Tüm veriler silindi");
      });
    }, { onClose: () => renderAll() });
  }

  function download(name, text, type) {
    const blob = new Blob([text], { type });
    const file = new File([blob], name, { type });
    if (navigator.canShare && navigator.canShare({ files: [file] }) && /iP(hone|ad|od)/.test(navigator.userAgent)) {
      navigator.share({ files: [file], title: name }).catch(() => {});
      return;
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  function exportJSON() {
    download(`gunlugum-yedek-${keyOf(today())}.json`, JSON.stringify({ app: "gunlugum", exportedAt: new Date().toISOString(), ...S }, null, 1), "application/json");
  }
  function exportTXT() {
    const lines = ["GÜNLÜĞÜM", "=".repeat(30), ""];
    for (const k of Object.keys(S.days).sort()) {
      const e = S.days[k], d = parse(k), b = book(e.bookId);
      lines.push(`${longDate(d)} · ${GUNLER[dow(d)]}`);
      const meta = [e.mood && `Ruh hâli: ${MOODS[e.mood]}`, e.pages && `${e.pages} sayfa${b ? ` (${b.title})` : ""}`].filter(Boolean).join(" · ");
      if (meta) lines.push(meta);
      if ((e.text || "").trim()) lines.push("", e.text.trim());
      if ((e.notes || "").trim()) lines.push("", "Okuma notları:", e.notes.trim());
      lines.push("", "-".repeat(30), "");
    }
    download(`gunlugum-${keyOf(today())}.txt`, lines.join("\n"), "text/plain;charset=utf-8");
  }
  $("#importFile").addEventListener("change", async (ev) => {
    const f = ev.target.files[0]; ev.target.value = "";
    if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!d || typeof d.days !== "object") throw new Error("biçim");
      const n = Object.keys(d.days).length;
      confirmSheet("Yedek yüklensin mi?", `${n} günlük kayıt ve ${(d.books || []).length} kitap bulundu. Aynı günler yedekteki hâliyle değişir, diğer kayıtların korunur.`, "Yükle", () => {
        S.days = { ...S.days, ...d.days };
        const ids = new Set(S.books.map((b) => b.id));
        for (const b of d.books || []) if (!ids.has(b.id)) S.books.push(b);
        if (!S.activeBook && d.activeBook) S.activeBook = d.activeBook;
        S.settings.onboarded = true;
        save(); closeAllSheets(); renderAll(); toast(`${n} gün geri yüklendi`);
      });
    } catch (e) { toast("Bu dosya bir Günlüğüm yedeği değil"); }
  });

  /* ================= şifre kilidi ================= */
  const hashPin = (p) => { let h = 2166136261; for (const c of "gunlugum:" + p) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); };
  function pinPad(title, sub, onDone, opts = {}) {
    const ov = $("#lock");
    let v = "";
    ov.hidden = false;
    ov.innerHTML = `<img class="logo" src="icon-192.png" alt=""><div><h1 style="font-size:28px">${title}</h1><p class="muted" style="margin-top:6px">${sub}</p></div>
      <div class="dots" id="pd">${"<i></i>".repeat(4)}</div>
      <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => `<button data-n="${n}">${n}</button>`).join("")}${opts.cancel ? `<button class="kx" data-c style="grid-column:1;font-family:var(--sans);font-size:14px">Vazgeç</button>` : ""}<button class="k0" data-n="0">0</button><button class="kx" data-x aria-label="Sil">${ic("del")}</button></div>`;
    const paint = () => $$("#pd i").forEach((d, i) => d.classList.toggle("f", i < v.length));
    ov.onclick = (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.c != null) { ov.hidden = true; return; }
      if (b.dataset.x != null) v = v.slice(0, -1);
      else if (v.length < 4) v += b.dataset.n;
      paint();
      if (v.length === 4) setTimeout(() => {
        if (onDone(v) === false) { v = ""; paint(); const pd = $("#pd"); pd.classList.remove("err"); void pd.offsetWidth; pd.classList.add("err"); }
      }, 120);
    };
    ov._key = (e) => { if (/^\d$/.test(e.key)) $(`[data-n="${e.key}"]`, ov)?.click(); else if (e.key === "Backspace") $("[data-x]", ov)?.click(); };
  }
  document.addEventListener("keydown", (e) => { const ov = $("#lock"); if (!ov.hidden && ov._key) ov._key(e); });
  function setPinFlow(after) {
    pinPad("Şifre belirle", "4 haneli bir şifre seç", (p1) => {
      pinPad("Tekrar gir", "Şifreyi doğrula", (p2) => {
        if (p1 !== p2) { toast("Şifreler uyuşmadı"); setPinFlow(after); return; }
        S.settings.pin = hashPin(p1); save(); $("#lock").hidden = true; toast("Şifre kilidi açık 🔒"); after && after();
      }, { cancel: true });
    }, { cancel: true });
  }
  function lockIfNeeded() {
    if (!S.settings.pin) return;
    pinPad("Günlüğüm", "Şifreni gir", (p) => {
      if (hashPin(p) !== S.settings.pin) return false;
      $("#lock").hidden = true; return true;
    });
  }
  let hiddenAt = 0;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) hiddenAt = Date.now();
    else {
      if (S.settings.pin && hiddenAt && Date.now() - hiddenAt > 60000 && $("#lock").hidden) lockIfNeeded();
      // gün değiştiyse bugüne dön
      if (hiddenAt && Date.now() - hiddenAt > 30 * 60000) { sel = keyOf(today()); renderAll(); }
    }
  });

  /* ================= karşılama ================= */
  function onboarding() {
    const ov = $("#ob");
    let goal = 20;
    ov.hidden = false;
    ov.innerHTML = `<img class="logo" src="icon-192.png" alt="">
      <div><h1>Günlü<em>ğüm</em></h1><p class="lead" style="margin:10px auto 0">Her gün bir sayfa yaz, okuduğunu kaydet, kendini zamanla yeniden oku.</p></div>
      <div class="ob-form">
        <div class="field"><label>Adın</label><input class="inp" id="ob-name" maxlength="30" placeholder="İsteğe bağlı" autocomplete="given-name"></div>
        <div class="field"><label>Günde kaç sayfa okumak istersin?</label><div class="goals">${[10, 20, 30, 50].map((g) => `<button data-g="${g}" class="${g === goal ? "on" : ""}">${g}</button>`).join("")}</div></div>
        <button class="btn acc wide" id="ob-go" style="height:52px;margin-top:6px">Başla</button>
      </div>`;
    $$(".goals button", ov).forEach((b) => b.onclick = () => { goal = +b.dataset.g; $$(".goals button", ov).forEach((x) => x.classList.toggle("on", x === b)); });
    $("#ob-go", ov).onclick = () => {
      S.settings.name = $("#ob-name", ov).value.trim(); S.settings.goal = goal; S.settings.onboarded = true; save();
      ov.hidden = true; renderAll();
      setTimeout(() => toast("Hoş geldin. İlk sayfan seni bekliyor ✍️"), 300);
    };
  }

  /* ================= görünür alan (klavye) ================= */
  function fitViewport() {
    const vv = window.visualViewport;
    const h = vv ? vv.height : innerHeight;
    document.documentElement.style.setProperty("--appH", h + "px");
    if (vv && vv.offsetTop) window.scrollTo(0, 0);
    // iOS ana ekran: bazı sürümlerde görünür alan ev çizgisinin üstünde bitiyor; o zaman alt güvenli alan payı gereksiz
    const standalone = navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;
    document.documentElement.classList.toggle("short-vp", standalone && innerHeight > innerWidth && screen.height - innerHeight > 20 && !document.body.classList.contains("typing"));
  }
  window.visualViewport?.addEventListener("resize", fitViewport);
  window.visualViewport?.addEventListener("scroll", fitViewport);
  addEventListener("resize", fitViewport);
  document.addEventListener("scroll", () => window.scrollTo(0, 0));

  /* ================= başlat ================= */
  applyTheme();
  fitViewport();
  renderAll();
  if (!S.settings.onboarded) onboarding();
  else lockIfNeeded();
  addEventListener("focus", () => { if (!sheetStack.length && document.activeElement?.tagName !== "TEXTAREA") renderAll(); });

  window.GUNLUGUM = { get state() { return S; }, set state(v) { S = v; save(); renderAll(); }, go, render: renderAll };
})();
