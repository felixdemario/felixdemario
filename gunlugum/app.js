/* Okuma Günlüğü — her gün bir sayfa: günlük, okunan sayfa ve okuma notları.
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
    camera: '<path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h1.8l1.4-2h6.6l1.4 2h1.8A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5Z"/><circle cx="12" cy="13" r="3.6"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>',
    scan: '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16"/><path d="M8 8v8M11 8v8M13.5 8v8M16 8v8"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
  };
  const ic = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${P[n]}</svg>`;
  const MOUTH = { 1: "M8 16.6q4-3.2 8 0", 2: "M8.2 16q3.8-1.4 7.6 0", 3: "M8.3 15.3h7.4", 4: "M8 14.4q4 3.2 8 0", 5: "M7.4 13.6q4.6 5 9.2 0Z" };
  const face = (m) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9.6"/><circle cx="9" cy="10" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1.1" fill="currentColor" stroke="none"/><path d="${MOUTH[m]}" ${m === 5 ? 'fill="currentColor"' : ""}/></svg>`;
  const moodColor = (m) => `var(--m${m})`;

  /* ================= veri ================= */
  const KEY = "gunlugum.v1";
  const DEFAULT_TYPES = () => [
    { id: "kitap", name: "Kitap", emoji: "📖" },
    { id: "gazete", name: "Gazete", emoji: "📰" },
    { id: "dergi", name: "Dergi", emoji: "🗞️" },
    { id: "kose", name: "Köşe yazısı", emoji: "✍️" },
    { id: "makale", name: "Makale", emoji: "📄" },
  ];
  const blank = () => ({ v: 2, settings: { name: "", goal: 20, bookGoal: 12, theme: "system", pin: "", onboarded: false, plan: "plus", admin: true }, types: DEFAULT_TYPES(), books: [], activeBook: null, days: {} });
  // Eski kayıtları yeni yapıya taşır: bir günde birden çok okuma (reads) ve okuma türleri
  function migrate(d) {
    if (!Array.isArray(d.types) || !d.types.length) d.types = DEFAULT_TYPES();
    if (!d.types.some((t) => t.id === "kitap")) d.types.unshift(DEFAULT_TYPES()[0]);
    for (const b of d.books) if (!d.types.some((t) => t.id === b.type)) b.type = "kitap";
    for (const k in d.days) {
      const e = d.days[k];
      if (!Array.isArray(e.reads)) e.reads = e.pages > 0 ? [{ id: e.bookId || null, pages: e.pages }] : [];
      if (e.noteId === undefined) e.noteId = (e.notes || "").trim() ? e.bookId || null : null;
      e.pages = e.reads.reduce((a, r) => a + (r.pages || 0), 0);
    }
    if (!d.settings.since) d.settings.since = Date.now();
    // şimdilik herkes Plus (yönetici); ödeme altyapısı gelince ücretsiz başlar
    if (!d.settings.plan) { d.settings.plan = "plus"; d.settings.admin = true; }
    d.v = 2;
    return d;
  }
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(KEY));
      if (d && typeof d.days === "object") {
        const b = blank();
        return migrate({ ...b, ...d, settings: { ...b.settings, ...d.settings }, books: Array.isArray(d.books) ? d.books : [] });
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
  const reads = (e) => (e && e.reads) || [];
  const readOn = (e, id) => reads(e).filter((r) => r.id === id).reduce((a, r) => a + r.pages, 0);
  const isActive = (e) => !!e && (!!(e.text || "").trim() || !!(e.notes || "").trim() || e.pages > 0 || e.min > 0);
  const minOn = (e, id) => reads(e).filter((r) => r.id === id).reduce((a, r) => a + (r.min || 0), 0);
  const fmtMin = (m) => m < 60 ? `${Math.round(m)} dk` : `${Math.floor(m / 60)} sa${m % 60 ? " " + Math.round(m % 60) + " dk" : ""}`;
  const tagsOf = (t) => [...new Set(((t || "").match(/#[\p{L}\p{N}_]+/gu) || []).map((x) => x.toLocaleLowerCase("tr-TR")))];
  const hasWriting = (e) => !!e && !!(e.text || "").trim();
  function setEntry(k, patch) {
    const e = { text: "", notes: "", reads: [], mood: 0, noteId: null, ...S.days[k], ...patch, updatedAt: Date.now() };
    e.reads = e.reads.filter((r) => r.pages > 0 || r.min > 0);
    e.pages = e.reads.reduce((a, r) => a + r.pages, 0);
    e.min = e.reads.reduce((a, r) => a + (r.min || 0), 0);
    e.bookId = e.reads.length ? e.reads[0].id : null;
    if (!isActive(e) && !e.mood) delete S.days[k];
    else S.days[k] = e;
    save();
  }
  // Bir günde bir okumanın sayfa sayısını yazar (aynı gün başka okumalar korunur)
  function setRead(k, id, pages) {
    const rs = reads(entry(k)).map((r) => ({ ...r }));
    const i = rs.findIndex((r) => r.id === id);
    if (i >= 0) rs[i].pages = pages; else rs.push({ id, pages });
    setEntry(k, { reads: rs });
  }
  function addMinutes(k, id, min) {
    const rs = reads(entry(k)).map((r) => ({ ...r }));
    const i = rs.findIndex((r) => r.id === id);
    if (i >= 0) rs[i].min = (rs[i].min || 0) + min; else rs.push({ id, pages: 0, min });
    setEntry(k, { reads: rs });
  }
  // bitmiş tarih: içe aktarılan eski okumalarda tarih olmayabilir ("eski")
  const finDate = (b) => (b && /^\d{4}-\d{2}-\d{2}$/.test(b.finishedAt || "") ? parse(b.finishedAt) : null);

  const book = (id) => S.books.find((b) => b.id === id) || null;
  const typeOf = (b) => S.types.find((t) => t.id === b?.type) || S.types[0];
  const isBook = (b) => !!b && b.type === "kitap";
  function bookRead(id) {
    let s = 0;
    for (const k in S.days) s += readOn(S.days[k], id);
    return s;
  }
  const readDaysOf = (id) => Object.keys(S.days).filter((k) => readOn(S.days[k], id) > 0).sort();
  function bookProgress(b) {
    const done = clamp((b.start || 0) + bookRead(b.id), 0, b.total || Infinity);
    const pct = b.total ? clamp(done / b.total, 0, 1) : 0;
    return { done, pct, left: b.total ? Math.max(0, b.total - done) : 0 };
  }
  const COVERS = [["#6b2f1f", "#3e1a11"], ["#22413a", "#11241f"], ["#2b3556", "#161c33"], ["#7a5a2a", "#47321a"], ["#4b2a46", "#2a1627"], ["#3f4a2a", "#222917"], ["#8a3b2e", "#4e1d16"], ["#2e4a5c", "#182a36"]];
  function coverHTML(b, cls = "") {
    if (!b) return `<span class="cover empty ${cls}">${ic("plus")}</span>`;
    let h = 0; for (const c of b.title || "") h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const [c1, c2] = COVERS[h % COVERS.length];
    const label = isBook(b) ? esc((b.title || "").trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toLocaleUpperCase("tr-TR")) : `<span class="emo">${esc(typeOf(b).emoji)}</span>`;
    const img = b.cover ? `<img src="${esc(b.cover)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : "";
    return `<span class="cover ${cls}" style="--c1:${c1};--c2:${c2}">${label}${img}</span>`;
  }
  // Son 21 günün okuma hızı (bir okuma için ya da tümü)
  function pace(id) {
    const t = today(); let s = 0;
    for (let i = 0; i < 21; i++) { const e = entry(keyOf(addDays(t, -i))); s += id ? readOn(e, id) : (e?.pages || 0); }
    return s / 21;
  }

  /* Kitap arama: Google Books (birkaç farklı sorgu) + Open Library; sonuçlar sorguya benzerliğe göre sıralanır */
  const gkey = () => (S.settings.gkey ? `&key=${encodeURIComponent(S.settings.gkey)}` : "");
  const gCover = (v) => (v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail || "").replace(/^http:/, "https:").replace("&edge=curl", "");
  let gLimited = false;
  async function gSearch(q, extra = "") {
    try {
      const r = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=20&printType=books${extra}${gkey()}`);
      if (r.status === 429 || r.status === 403) { gLimited = true; return []; }
      if (!r.ok) return [];
      gLimited = false;
      const d = await r.json();
      return (d.items || []).map((it) => it.volumeInfo || {}).filter((v) => v.title).map((v) => ({
        title: v.title, author: (v.authors || []).join(", "), pages: v.pageCount || 0, year: (v.publishedDate || "").slice(0, 4), cover: gCover(v) }));
    } catch (e) { return []; }
  }
  async function olSearch(params) {
    try {
      const r = await fetch(`https://openlibrary.org/search.json?${params}&limit=20&fields=title,author_name,number_of_pages_median,cover_i,first_publish_year`);
      if (!r.ok) return [];
      const d = await r.json();
      return (d.docs || []).map((x) => ({ title: x.title, author: (x.author_name || []).slice(0, 2).join(", "), pages: x.number_of_pages_median || 0,
        year: x.first_publish_year ? String(x.first_publish_year) : "", cover: x.cover_i ? `https://covers.openlibrary.org/b/id/${x.cover_i}-M.jpg` : "" }));
    } catch (e) { return []; }
  }
  const norm = (t) => (t || "").toLocaleLowerCase("tr-TR").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/ı/g, "i").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
  async function searchBooks(q) {
    q = q.trim();
    const words = q.split(/\s+/), digits = q.replace(/[\s-]/g, "");
    let out = [];
    if (/^\d{9}[\dXx]$|^\d{13}$/.test(digits)) { const r = await lookupISBN(digits); if (r.title) out.push({ ...r, pages: r.total || 0 }); }
    out.push(...(await Promise.all([gSearch(q), olSearch(`q=${encodeURIComponent(q)}`)])).flat());
    // az sonuç: yazar adı, başlık ve Türkçe kaynaklarla yeniden dene
    if (out.length < 8) {
      const more = [gSearch(q, "&langRestrict=tr"), gSearch(`intitle:${q}`)];
      if (words.length >= 2) more.push(gSearch(`inauthor:${q}`), olSearch(`author=${encodeURIComponent(q)}`), gSearch(`inauthor:${words.slice(0, 2).join(" ")} ${words.slice(2).join(" ")}`.trim()));
      out.push(...(await Promise.all(more)).flat());
    }
    const seen = new Map();
    for (const x of out) {
      const k = norm(x.title) + "|" + norm(x.author).split(" ").slice(-1)[0];
      const prev = seen.get(k);
      if (!prev) seen.set(k, { ...x });
      else { if (!prev.cover && x.cover) prev.cover = x.cover; if (!prev.pages && x.pages) prev.pages = x.pages; if (!prev.year && x.year) prev.year = x.year; }
    }
    const qt = norm(q).split(" ").filter((w) => w.length > 1);
    const score = (x) => { const hay = norm(x.title + " " + x.author); return qt.filter((w) => hay.includes(w)).length / Math.max(1, qt.length) * 10 + (x.cover ? 1 : 0) + (x.pages ? 0.3 : 0); };
    return [...seen.values()].map((x) => ({ x, s: score(x) })).sort((a, b) => b.s - a.s).map((r) => r.x);
  }
  // Kapağı olmayan kitaplar için bir kez kendiliğinden kapak arar
  async function autoCover(b) {
    if (!b || b.cover || !isBook(b) || b.coverTried || !navigator.onLine) return;
    b.coverTried = true; save();
    const hit = (await searchBooks(`${b.title} ${b.author || ""}`.trim())).find((r) => r.cover);
    if (hit && book(b.id)) { b.cover = hit.cover; save(); renderAll(); }
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
  const TABS = { today: ["pen", "Bugün"], cal: ["cal", "Takvim"], books: ["book", "Kütüphane"], rep: ["chart", "Rapor"] };
  $$("#tabs .tab").forEach((b) => {
    const [i, l] = TABS[b.dataset.s];
    b.innerHTML = `${ic(i)}<span>${l}</span>`;
    b.onclick = () => go(b.dataset.s);
  });
  const ORDER = ["today", "cal", "books", "rep"];
  function go(s) {
    $$(".bpage, .pull").forEach((x) => x.remove()); $$(".spine, .dk, .paper").forEach((x) => (x.style.visibility = ""));
    const dir = Math.sign(ORDER.indexOf(s) - ORDER.indexOf(tab)) || 0;
    $$(".screen").forEach((el) => { if (el.id === "s-" + s) el.style.setProperty("--dx", dir * 26 + "px"); else if (el.classList.contains("on")) el.style.setProperty("--dx", -dir * 26 + "px"); });
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
  $("#t-saved").innerHTML = ic("check") + "<span>Kaydedildi</span>";
  $("#t-ocr").innerHTML = ic("camera"); $("#t-voice").innerHTML = ic("mic");
  $("#t-ocr").onclick = () => openOCR();
  $("#t-voice").onclick = () => toggleVoice();

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
    if (document.activeElement !== ta && !rec) ta.value = e[field] || "";
    $("#t-ocr").style.display = field === "notes" ? "" : "none";
    const bk = book(e.noteId ?? currentBookId());
    ta.placeholder = field === "text" ? promptFor(sel) : bk ? `“${bk.title}” hakkında notların, altını çizdiğin cümleler…` : "Okuduklarından notlar, alıntılar, düşünceler…";
    updateWords();

    renderReading();
  }

  // Bugün ekranında sayfa sayacının bağlı olduğu okuma
  let pick = { k: null, id: null };
  function currentBookId() {
    if (pick.k === sel) return pick.id;
    const rs = reads(entry(sel)), ab = book(S.activeBook);
    if (ab && rs.some((r) => r.id === ab.id)) return ab.id;
    if (rs.length) return rs[rs.length - 1].id;
    return ab && !ab.finishedAt ? ab.id : null;
  }

  function renderReading() {
    const e = entry(sel) || {}, id = currentBookId(), b = book(id);
    const rs = reads(e), total = e.pages || 0, mine = readOn(e, id);
    const many = rs.length > 1 || (rs.length === 1 && rs[0].id !== id);
    let sub;
    if (many) sub = `Bugün ${rs.length} okuma · ${fmt(total)} sayfa`;
    else if (b) { const p = bookProgress(b); sub = b.total ? `s. ${fmt(p.done)} / ${fmt(b.total)} · %${Math.round(p.pct * 100)}` : `${typeOf(b).emoji} ${esc(b.author || typeOf(b).name)}`; }
    else sub = "Ne okuyorsun? Dokun ve seç";
    const mm = minOn(e, id); if (mm && b && !many) sub += ` · ${fmtMin(mm)}`;
    $("#t-book").innerHTML = coverHTML(b) + `<span class="t"><b>${b ? esc(b.title) : id === null && mine ? "Diğer" : "Okuma seç"}</b><small>${sub}</small></span>`;
    const goal = S.settings.goal || 20;
    const inp = $("#t-pages");
    if (document.activeElement !== inp) inp.value = mine || "";
    inp.placeholder = "0";
    const r = clamp(total / goal, 0, 1);
    $("#t-ring .val").style.strokeDashoffset = String(157.08 * (1 - r));
    $("#t-ring").classList.toggle("full", total >= goal);
    $("#t-ring small").textContent = total >= goal ? "✓" : `/ ${goal}`;
    renderTimer();
  }

  /* ---------- okuma süresi (kronometre) ---------- */
  let timerIv;
  function renderTimer() {
    const btn = $("#t-timer"), t = S.timer;
    clearInterval(timerIv);
    if (!t) { btn.classList.remove("run"); btn.innerHTML = ic("clock"); btn.setAttribute("aria-label", "Okuma süresini başlat"); return; }
    const draw = () => {
      const sec = Math.max(0, Math.floor((Date.now() - t.start) / 1000));
      const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, ss = sec % 60;
      btn.textContent = h ? `${h}:${pad(m)}:${pad(ss)}` : `${pad(m)}:${pad(ss)}`;
    };
    btn.classList.add("run"); btn.setAttribute("aria-label", "Okuma süresini durdur"); draw();
    timerIv = setInterval(draw, 1000);
  }
  $("#t-timer").onclick = () => {
    if (!S.timer) {
      S.timer = { start: Date.now(), id: currentBookId(), k: sel }; save(); renderTimer();
      const b = book(S.timer.id);
      toast(`Süre başladı${b ? " · " + b.title : ""} ⏱`);
      return;
    }
    const t = S.timer, min = Math.max(1, Math.round((Date.now() - t.start) / 60000));
    const done = () => {
      S.timer = null; (S.sessions = S.sessions || []).push({ k: t.k, id: t.id, start: t.start, min }); if (S.sessions.length > 3000) S.sessions.splice(0, S.sessions.length - 3000);
      addMinutes(t.k, t.id, min);
      sel = t.k; pick = { k: t.k, id: t.id }; renderToday(); flashSaved();
      toast(`${fmtMin(min)} okuma kaydedildi — sayfa sayısını da gir`);
    };
    if (min > 240) confirmSheet("Süre uzun görünüyor", `Kronometre ${fmtMin(min)} çalışmış. Yine de kaydedilsin mi?`, "Kaydet", done);
    else done();
  };

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
  $("#t-streak").onclick = () => openGoals();

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
  // yazılanı kaydeder; okuma notu ilk yazıldığında o an okunan kitaba bağlanır
  function saveField(v) {
    const patch = { [field]: v };
    if (field === "notes" && !(entry(sel) || {}).noteId) patch.noteId = currentBookId();
    setEntry(sel, patch);
  }
  $("#t-page").addEventListener("input", (ev) => {
    const v = ev.target.value;
    clearTimeout(typeT);
    typeT = setTimeout(() => {
      saveField(v); updateWords(); flashSaved();
      // hafta şeridindeki noktayı güncelle
      const wd = $(`#t-week .wd[data-k="${sel}"]`); if (wd) wd.classList.toggle("done", isActive(entry(sel)));
    }, 350);
  });
  $("#t-page").addEventListener("focus", () => { document.body.classList.add("typing"); fitViewport(); });
  $("#t-page").addEventListener("blur", () => {
    clearTimeout(typeT);
    const v = $("#t-page").value, e = entry(sel) || {};
    if ((e[field] || "") !== v) { saveField(v); flashSaved(); }
    setTimeout(() => { if (document.activeElement !== $("#t-page")) { document.body.classList.remove("typing"); fitViewport(); renderToday(); } }, 60);
  });
  $("#t-done").addEventListener("pointerdown", (e) => { e.preventDefault(); $("#t-page").blur(); });

  function setPages(n) {
    n = clamp(Math.round(+n || 0), 0, 9999);
    const e = entry(sel) || {}, id = currentBookId(), b = book(id);
    const before = b ? bookProgress(b).done : 0;
    const wasGoal = (e.pages || 0) >= S.settings.goal;
    setRead(sel, id, n); pick = { k: sel, id };
    renderToday(); flashSaved();
    if (!wasGoal && ((entry(sel) || {}).pages || 0) >= S.settings.goal) toast("Günlük hedefini tamamladın 🎯");
    if (b && b.total && !b.finishedAt) {
      const p = bookProgress(b);
      if (p.done >= b.total && before < b.total) finishBook(b, sel);
    }
  }
  const myPages = () => readOn(entry(sel), currentBookId());
  $("#t-plus").onclick = () => setPages(myPages() + 1);
  $("#t-minus").onclick = () => setPages(myPages() - 1);
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

  // 1–5 yıldız; dokununca puan verir
  const starsHTML = (v, id = "") => `<div class="stars" ${id ? `id="${id}"` : ""}>${[1, 2, 3, 4, 5].map((n) => `<button data-v="${n}" class="${n <= (v || 0) ? "on" : ""}" aria-label="${n} yıldız">★</button>`).join("")}</div>`;
  function bindStars(root, b, after) {
    $$(".stars button", root).forEach((x) => x.onclick = () => {
      const v = +x.dataset.v; b.rating = b.rating === v ? 0 : v; save();
      $$(".stars button", root).forEach((y) => y.classList.toggle("on", +y.dataset.v <= b.rating));
      x.animate([{ transform: "scale(1.5)" }, { transform: "scale(1)" }], { duration: 300, easing: "cubic-bezier(.2,.8,.2,1)" });
      after && after();
    });
  }
  function finishBook(b, k) {
    b.finishedAt = k; if (S.activeBook === b.id) {
      const next = S.books.find((x) => !x.finishedAt && x.id !== b.id);
      S.activeBook = next ? next.id : null;
    }
    save(); renderAll();
    openSheet("Tebrikler!", (c) => {
      const days = readDaysOf(b.id).length;
      c.body.innerHTML = `<div style="text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px;padding:6px 0 4px">
        <div class="celebrate">📚</div>
        ${coverHTML(b, "big")}
        <h3 class="serif" style="font-size:22px">“${esc(b.title)}” bitti</h3>
        <p class="muted">${fmt(b.total)} sayfa · ${days} günde okudun.${isBook(b) ? " “Okuduklarım” rafına kondu." : ""}</p>
        <p class="muted" style="font-size:13px">Nasıldı?</p>${starsHTML(b.rating)}</div>
        <textarea class="inp imp-ta" id="fb-rev" style="height:96px" placeholder="Birkaç cümleyle kendi yorumun (isteğe bağlı)">${esc(b.review || "")}</textarea>
        <button class="btn acc wide" data-ok>Kaydet</button>`;
      bindStars(c.body, b);
      $("[data-ok]", c.body).onclick = () => { b.review = $("#fb-rev", c.body).value.trim(); save(); c.close(); renderAll(); };
    });
  }

  /* ================= okuma seçici & okuma formu ================= */
  function openBookPicker() {
    openSheet("Ne okuyorsun?", (c) => {
      const cur = currentBookId(), e = entry(sel);
      const list = S.books.filter((b) => !b.finishedAt || readOn(e, b.id) > 0).sort((a, b) => (a.want ? 1 : 0) - (b.want ? 1 : 0));
      const row = (b) => {
        const id = b ? b.id : null, on = id === cur, td = readOn(e, id);
        const sub = b ? [`${typeOf(b).emoji} ${typeOf(b).name}`, b.author, b.want ? "okunacak" : b.total ? `%${Math.round(bookProgress(b).pct * 100)}` : ""].filter(Boolean).join(" · ") : "Başlıksız, sadece sayfa sayısı";
        return `<button class="pick ${on ? "on" : ""}" data-id="${id ?? ""}">${coverHTML(b)}<span class="t"><b>${b ? esc(b.title) : "Diğer"}</b><small>${esc(sub)}${td ? ` · bugün ${td} s.` : ""}</small></span>${on ? ic("check", "ok") : ""}</button>`;
      };
      c.body.innerHTML = `<p class="muted" style="font-size:13px;margin-top:-6px">Gün içinde birden çok şey okuduysan her birini seçip sayfasını ayrı gir.</p>
        <div class="pick-list">${list.map(row).join("")}${row(null)}</div>
        <button class="btn acc wide" data-new>${ic("plus")}Yeni okuma ekle</button>`;
      $$(".pick", c.body).forEach((p) => p.onclick = () => {
        const id = p.dataset.id || null;
        pick = { k: sel, id };
        if (id) { S.activeBook = id; book(id).want = false; }
        save(); c.close(); renderToday();
      });
      $("[data-new]", c.body).onclick = () => { c.close(); openBookForm(null, (b) => { pick = { k: sel, id: b.id }; renderAll(); }); };
    });
  }

  const FORM_TEXT = {
    kitap: ["Kitap adı", "Örn. Kürk Mantolu Madonna", "Yazar", "Örn. Sabahattin Ali"],
    gazete: ["Gazete adı", "Örn. Cumhuriyet", "Bölüm / ek", "İsteğe bağlı"],
    dergi: ["Dergi adı", "Örn. National Geographic", "Sayı", "Örn. Ekim 2026"],
    kose: ["Yazar / köşe adı", "Örn. yazarın adı", "Yayın", "Örn. gazete adı"],
    makale: ["Makale başlığı", "Başlık", "Yazar / kaynak", "İsteğe bağlı"],
  };
  function openBookForm(b, after, preset) {
    const isNew = !b;
    const d = { type: b?.type || (libType !== "all" && S.types.some((t) => t.id === libType) ? libType : "kitap"), title: b?.title || "", author: b?.author || "", total: b?.total || "", start: b?.start || "", cover: b?.cover || "",
      status: b ? (b.finishedAt ? "done" : b.want ? "want" : "reading") : libTab === "want" ? "want" : libTab === "done" ? "done" : "reading" };
    if (preset) for (const k of ["type", "title", "author", "total", "cover"]) if (preset[k]) d[k] = preset[k];
    let q = "", results = [], searching = false, seq = 0, qt;
    openSheet(isNew ? "Yeni okuma" : "Düzenle", (c) => {
      const f = (id) => $(id, c.body);
      const sync = () => { if (!f("#f-title")) return; d.title = f("#f-title").value; d.author = f("#f-author").value; d.total = f("#f-total").value; d.start = f("#f-start").value; };
      const drawResults = () => {
        const out = f("#f-res"); if (!out) return;
        if (searching) { out.innerHTML = `<p class="muted sr-msg">Aranıyor…</p>`; return; }
        if (q.trim().length < 2) { out.innerHTML = ""; return; }
        const tail = `<div class="sr-help">${gLimited ? `<p>Google kitap aramasının ücretsiz günlük kotası dolu; sonuçlar eksik olabilir. <b>Ayarlar → Kitap arama anahtarı</b> ile ücretsiz anahtar ekleyebilirsin.</p>` : ""}<p>Bulamadın mı? Adını aşağıya yaz; kapak için <a href="https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q + " kitap kapağı")}" target="_blank" rel="noopener">internette kapağı ara</a>, resmi kaydedip “Kapak fotoğrafı”ndan seç.</p></div>`;
        if (!results.length) { out.innerHTML = `<p class="muted sr-msg">${navigator.onLine ? "Bulunamadı." : "İnternet yok."}</p>${tail}`; return; }
        out.innerHTML = results.slice(0, 10).map((r, i) => `<button class="pick sr" data-i="${i}">${coverHTML({ title: r.title, type: "kitap", cover: r.cover })}<span class="t"><b>${esc(r.title)}</b><small>${esc([r.author, r.year, r.pages ? r.pages + " s." : ""].filter(Boolean).join(" · "))}</small></span></button>`).join("") + tail;
        $$(".sr", out).forEach((x) => x.onclick = () => {
          const r = results[+x.dataset.i]; sync();
          Object.assign(d, { title: r.title, author: r.author, cover: r.cover, total: r.pages || d.total });
          q = ""; results = []; draw();
        });
      };
      const draw = () => {
        const tx = FORM_TEXT[d.type] || ["Ad", "Ne okuyorsun?", "Yazar / kaynak", "İsteğe bağlı"];
        const bk = d.type === "kitap";
        c.body.innerHTML = `
          <div class="typechips">${S.types.map((t) => `<button class="tchip ${t.id === d.type ? "on" : ""}" data-t="${t.id}">${esc(t.emoji)} ${esc(t.name)}</button>`).join("")}</div>
          ${bk ? `<div class="row-i"><div class="search-wrap" style="flex:1">${ic("search")}<input class="inp" id="f-q" type="search" value="${esc(q)}" placeholder="Kitap ara: ad, yazar ya da ISBN" autocomplete="off" enterkeyhint="search"></div><button class="iconbtn big" id="f-cov" aria-label="Kapağın fotoğrafından bul">${ic("camera")}</button><button class="iconbtn big" id="f-scan" aria-label="Barkod okut">${ic("scan")}</button></div><div class="pick-list" id="f-res"></div>` : ""}
          <div class="cover-prev">${d.cover ? coverHTML({ ...d }) : `<span class="cover empty">${ic("camera")}</span>`}<span class="muted">${d.cover ? "Kapak" : "Kapak yok"}</span><button class="btn ghost sm" id="f-photo">${ic("camera")}Kapak fotoğrafı</button>${d.cover ? `<button class="btn ghost sm" id="f-nocover">Kaldır</button>` : ""}</div>
          <div class="field"><label>${tx[0]}</label><input class="inp" id="f-title" maxlength="120" value="${esc(d.title)}" placeholder="${tx[1]}" autocomplete="off"></div>
          <div class="field"><label>${tx[2]}</label><input class="inp" id="f-author" maxlength="80" value="${esc(d.author)}" placeholder="${tx[3]}" autocomplete="off"></div>
          <div class="row2">
            <div class="field"><label>Toplam sayfa${bk ? "" : " (isteğe bağlı)"}</label><input class="inp" id="f-total" type="number" inputmode="numeric" min="1" value="${d.total}" placeholder="${bk ? "160" : "–"}"></div>
            <div class="field"><label>Kaçıncı sayfadasın?</label><input class="inp" id="f-start" type="number" inputmode="numeric" min="0" value="${d.start}" placeholder="0"></div>
          </div>
          <div class="field"><label>Durum</label><div class="seg" id="f-status">${[["reading", "Okuyorum"], ["want", "Okuyacağım"], ["done", "Okudum"]].map(([k, l]) => `<button data-s="${k}" class="${d.status === k ? "on" : ""}">${l}</button>`).join("")}</div></div>
          <button class="btn acc wide" id="f-save">${ic("check")}${isNew ? "Ekle" : "Kaydet"}</button>`;
        drawResults();
        $$("#f-status button", c.body).forEach((x) => x.onclick = () => { d.status = x.dataset.s; $$("#f-status button", c.body).forEach((y) => y.classList.toggle("on", y === x)); });
        $$(".tchip", c.body).forEach((x) => x.onclick = () => { sync(); d.type = x.dataset.t; draw(); });
        const qi = f("#f-q");
        if (qi) qi.oninput = () => {
          q = qi.value; clearTimeout(qt);
          if (q.trim().length < 2) { searching = false; results = []; drawResults(); return; }
          searching = true; drawResults();
          const my = ++seq;
          qt = setTimeout(async () => { const r = await searchBooks(q.trim()); if (my !== seq) return; results = r; searching = false; drawResults(); }, 450);
        };
        const nc = f("#f-nocover"); if (nc) nc.onclick = () => { sync(); d.cover = ""; draw(); };
        f("#f-photo").onclick = async () => { const file = await pickFile("image/*"); if (!file) return; sync(); d.cover = await imageToDataURL(file, 240, 360, 0.8); draw(); };
        const cv = f("#f-cov"); if (cv) cv.onclick = async () => {
          const file = await pickFile("image/*"); if (!file) return;
          sync(); const qi2 = f("#f-q"); qi2.value = ""; qi2.placeholder = "Kapak okunuyor…";
          try { const qq = await coverQuery(file); if (!qq) { toast("Kapakta yazı okunamadı — adını yazabilirsin"); qi2.placeholder = "Kitap ara: ad, yazar ya da ISBN"; return; } qi2.value = qq; qi2.oninput(); }
          catch (e) { toast("Kapak okunamadı"); }
        };
        const sc = f("#f-scan"); if (sc) sc.onclick = () => openScanner((info) => { sync(); for (const k of ["title", "author", "total", "cover"]) if (info[k]) d[k] = info[k]; q = ""; results = []; draw(); });
        f("#f-save").onclick = () => {
          sync();
          const title = d.title.trim();
          if (!title) { f("#f-title").focus(); toast("Adını yaz"); return; }
          const data = { type: d.type, title, author: d.author.trim(), total: Math.max(0, parseInt(d.total) || 0), start: Math.max(0, parseInt(d.start) || 0), cover: d.cover };
          data.want = d.status === "want";
          data.finishedAt = d.status === "done" ? (b?.finishedAt || keyOf(today())) : null;
          if (isNew) { b = { id: uid(), createdAt: keyOf(today()), ...data, coverTried: !!data.cover }; S.books.unshift(b); }
          else { if (data.title !== b.title || data.author !== b.author) b.coverTried = !!data.cover; Object.assign(b, data); }
          if (d.status === "reading") S.activeBook = b.id;
          else if (S.activeBook === b.id) S.activeBook = null;
          save(); c.close(); toast(isNew ? "Eklendi" : "Kaydedildi");
          autoCover(b);
          after ? after(b) : renderAll();
        };
      };
      draw();
    });
  }

  function openBookDetail(b) { openBookPage(b, null); }
  function buildDetail(c, b) {
    {
      const p = bookProgress(b), tp = typeOf(b);
      const readDays = readDaysOf(b.id), sum = bookRead(b.id);
      const notes = Object.keys(S.days).filter((k) => S.days[k].noteId === b.id && (S.days[k].notes || "").trim()).sort().reverse();
      const sp = pace(b.id) || pace();
      const eta = !b.finishedAt && b.total && sp > 0 ? addDays(today(), Math.ceil(p.left / sp)) : null;
      const fin = finDate(b);
      c.body.innerHTML = `
        <div class="bd-top">${coverHTML(b)}<div style="min-width:0"><h3>${esc(b.title)}</h3><p>${esc(b.author || "")}${b.author ? " · " : ""}${esc(tp.emoji)} ${esc(tp.name)}</p>
          ${b.total ? `<div class="bar"><i style="width:${p.pct * 100}%"></i></div><p>${fmt(p.done)} / ${fmt(b.total)} sayfa · %${Math.round(p.pct * 100)}</p>` : ""}
          ${isBook(b) ? starsHTML(b.rating) : ""}${b.digital ? `<p class="dig">${ic("book")}${b.digital.toUpperCase()} · dijital kitap</p>` : ""}</div></div>
        ${b.digital ? `<button class="btn acc wide" data-a="read">${ic("book")}Kitabı aç ve oku ${plusB("reader")}</button>` : ""}
        <div class="stats3">
          <div><b>${readDays.length}</b><small>okuma günü</small></div>
          <div><b>${b.total ? (readDays.length ? fmt(sum / readDays.length) : "–") : fmt(sum)}</b><small>${b.total ? "sayfa / gün" : "sayfa okundu"}</small></div>
          <div><b>${b.finishedAt ? "✓" : eta ? `${eta.getDate()} ${AYK[eta.getMonth()]}` : "–"}</b><small>${fin ? `bitti · ${fin.getDate()} ${AYK[fin.getMonth()]} ${fin.getFullYear()}` : b.finishedAt ? "okundu" : b.want ? "okunacak" : "tahmini bitiş"}</small></div>
        </div>
        <div class="btnrow">
          ${b.finishedAt ? `<button class="btn ghost sm" data-a="unfinish">Tekrar okuyorum</button>` : b.want ? `<button class="btn acc sm" data-a="start">Okumaya başla</button>` : `<button class="btn ghost sm" data-a="active">${S.activeBook === b.id ? "✓ Şu an okunan" : "Şu an bunu okuyorum"}</button><button class="btn ghost sm" data-a="finish">${isBook(b) ? "Bitirdim" : "Bitti / arşivle"}</button>`}
        </div>
        ${isBook(b) && (b.finishedAt || b.review) ? `<div class="field"><label>Yorumun</label><textarea class="inp imp-ta" id="bd-rev" style="height:84px" placeholder="Kitap hakkında birkaç cümle…">${esc(b.review || "")}</textarea></div>` : ""}
        ${notes.length ? `<div class="sec-t">Okuma notları · ${notes.length}</div>${notes.map((k) => `<button class="note" data-k="${k}"><small>${longDate(parse(k))}</small><p>${esc(S.days[k].notes.trim())}</p></button>`).join("")}` : `<p class="muted" style="font-size:13px;text-align:center">Henüz not yok. Bugün ekranındaki “Okuma notları” sekmesinden ekleyebilirsin.</p>`}
        ${isBook(b) && !b.digital ? `<button class="btn ghost wide" data-a="file">${ic("file")}Dijital kopyasını ekle (EPUB/PDF) ${plusB("reader")}</button>` : ""}
        <div class="btnrow"><button class="btn ghost" data-a="edit">${ic("edit")}Düzenle</button><button class="btn danger" data-a="del">${ic("trash")}Sil</button></div>`;
      bindStars(c.body, b, renderAll);
      const rv = $("#bd-rev", c.body); if (rv) rv.oninput = () => { b.review = rv.value.trim(); save(); };
      $$("[data-a]", c.body).forEach((x) => x.onclick = () => {
        const a = x.dataset.a;
        if (a === "read") { c.close(); openReader(b); return; }
        if (a === "file") { c.close(); pickDigital(b); return; }
        if (a === "edit") { c.close(); openBookForm(b); }
        else if (a === "del") confirmSheet("Silinsin mi?", "Okuma listenden kalkar. Günlüklerin ve sayfa kayıtların silinmez (“Diğer” olarak kalır).", "Sil", () => {
          S.books = S.books.filter((x) => x.id !== b.id); if (S.activeBook === b.id) S.activeBook = null;
          if (b.digital) { idb.del(b.id).catch(() => {}); idb.del(b.id + ":loc").catch(() => {}); }
          for (const k of Object.keys(S.days)) {
            const e = S.days[k];
            if (reads(e).some((r) => r.id === b.id) || e.noteId === b.id)
              setEntry(k, { reads: reads(e).map((r) => (r.id === b.id ? { ...r, id: null } : r)), noteId: e.noteId === b.id ? null : e.noteId });
          }
          save(); c.close(); renderAll(); toast("Silindi");
        });
        else if (a === "active") { S.activeBook = b.id; save(); c.rebuild(); renderAll(); }
        else if (a === "finish") { b.finishedAt = keyOf(today()); if (S.activeBook === b.id) S.activeBook = null; save(); c.rebuild(); renderAll(); toast(isBook(b) ? "Tebrikler, bir kitap daha bitti 📚" : "Arşivlendi"); }
        else if (a === "unfinish") { b.finishedAt = null; b.want = false; S.activeBook = b.id; save(); c.rebuild(); renderAll(); }
        else if (a === "start") { b.want = false; S.activeBook = b.id; save(); c.rebuild(); renderAll(); toast("İyi okumalar 📖"); }
      });
      $$(".note", c.body).forEach((n) => n.onclick = () => { c.close(); closeAllSheets(); openDay(n.dataset.k, "notes"); });
    }
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
      const tags = [
        e.mood ? `<span class="tag" style="color:${moodColor(e.mood)}">${face(e.mood)}<span style="color:var(--ink2)">${MOODS[e.mood]}</span></span>` : "",
        ...reads(e).map((r) => { const rb = book(r.id); return `<span class="tag">${rb ? `<span class="emo">${esc(typeOf(rb).emoji)}</span>` : ic("book")}<span>${r.pages ? r.pages + " s." : ""}${r.min ? (r.pages ? " · " : "") + fmtMin(r.min) : ""}${rb ? " · " + esc(rb.title) : ""}</span></span>`; }),
        ...tagsOf(e.text + " " + e.notes).map((tg) => `<button class="tag ht" data-tag="${esc(tg)}"><span>${esc(tg)}</span></button>`),
        words(e.text) ? `<span class="tag">${ic("text")}<span>${words(e.text)} kelime</span></span>` : "",
      ].join("");
      const body = [(e.text || "").trim() && `<h4>Günlük</h4>${esc(e.text.trim())}`, (e.notes || "").trim() && `<h4>Okuma notları</h4>${esc(e.notes.trim())}`].filter(Boolean).join("\n");
      pv.innerHTML = `${head}<div class="actions"><button class="iconbtn" data-share aria-label="Paylaş">${ic("up")}</button><button class="btn sm ghost" data-edit>${ic("edit")}Düzenle</button></div></div><div class="pv-tags">${tags}</div><div class="pv-body">${body || '<span class="muted" style="font-style:italic">Yazı yok.</span>'}</div>${otd}`;
    }
    const ed = $("[data-edit]", pv); if (ed) ed.onclick = () => openDay(calSel);
    const sh = $("[data-share]", pv); if (sh) sh.onclick = () => openShare(hasWriting(e) || !(e.notes || "").trim() ? "day" : "quote", { k: calSel });
    $$("[data-tag]", pv).forEach((x) => x.onclick = () => openSearch(x.dataset.tag));
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
  $("#c-search").onclick = () => openSearch();

  function openSearch(initial) {
    openSheet("Ara", (c) => {
      c.body.innerHTML = `<div class="search-wrap">${ic("search")}<input class="inp" id="q" type="search" placeholder="Günlüklerde, notlarda, kitaplarda…" autocomplete="off"></div><div class="pick-list" id="qr"></div>`;
      const q = $("#q", c.body), out = $("#qr", c.body);
      const run = () => {
        const s = q.value.trim().toLocaleLowerCase("tr-TR");
        if (s.length < 2) {
          const all = {};
          for (const k in S.days) for (const tg of tagsOf(S.days[k].text + " " + S.days[k].notes)) all[tg] = (all[tg] || 0) + 1;
          const tg = Object.entries(all).sort((a, b) => b[1] - a[1]).slice(0, 30);
          out.innerHTML = `<p class="muted" style="text-align:center;font-size:13px;padding:6px 10px">${Object.keys(S.days).length} günlük kayıt içinde ara.${tg.length ? "" : " Yazarken <b>#etiket</b> kullanırsan (#iş, #aile) günlerini buradan bulursun."}</p>${tg.length ? `<div class="pv-tags" style="justify-content:center">${tg.map(([t, n]) => `<button class="tag ht" data-tag="${esc(t)}"><span>${esc(t)} · ${n}</span></button>`).join("")}</div>` : ""}`;
          $$("[data-tag]", out).forEach((x) => x.onclick = () => { q.value = x.dataset.tag; run(); });
          return;
        }
        const res = [];
        for (const k of Object.keys(S.days).sort().reverse()) {
          const e = S.days[k];
          const hay = [e.text, e.notes, ...reads(e).map((r) => { const b = book(r.id); return b ? `${b.title} ${b.author || ""}` : ""; })].join("\n");
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
      if (initial) q.value = initial;
      q.oninput = run; run();
    });
  }

  /* ================= KÜTÜPHANE ================= */
  let libTab = "all", libType = "all";
  $("#b-add").innerHTML = ic("plus");
  $("#b-add").onclick = () => openAddMenu();
  $("#b-import").innerHTML = ic("down");
  $("#b-import").onclick = () => openImport();
  $("#b-types").addEventListener("click", (ev) => { const b = ev.target.closest(".tchip"); if (!b || b.dataset.t === libType) return; libType = b.dataset.t; renderBooks(true); });
  $("#b-filter").addEventListener("click", (ev) => { const b = ev.target.closest(".tchip"); if (!b || b.dataset.k === libTab) return; libTab = b.dataset.k; renderBooks(true); });

  const inType = (b) => libType === "all" || b.type === libType;
  const isReading = (b) => !b.finishedAt && !b.want;
  function renderBooks(animate) {
    const year = today().getFullYear();
    const finishedThisYear = S.books.filter((b) => isBook(b) && (b.finishedAt || "").startsWith(year)).length;
    // yıllık kitap hedefi: kalan kitaplar kalan aylara bölünür
    const bg = S.settings.bookGoal || 12, left = bg - finishedThisYear, monthsLeft = 12 - today().getMonth();
    $("#b-eyebrow").textContent = !S.books.length ? `${year} hedefi · ${bg} kitap`
      : `${year} · ${finishedThisYear} / ${bg} kitap${left <= 0 ? " · hedef tamam ✓" : ` · ayda ~${Math.ceil(left / monthsLeft)}`}`;
    // durum süzgeci
    const pool = S.books.filter(inType);
    const nNotes = Object.keys(S.days).filter((k) => (S.days[k].notes || "").trim()).length;
    const F = [["all", "Tümü", pool.length], ["reading", "Okunuyor", pool.filter(isReading).length], ["want", "Okunacak", pool.filter((b) => !b.finishedAt && b.want).length], ["done", "Okundu", pool.filter((b) => b.finishedAt).length], ["notes", "Notlar", nNotes]];
    $("#b-filter").innerHTML = F.map(([k, l, n]) => `<button class="tchip ${libTab === k ? "on" : ""}" data-k="${k}">${l}${n ? `<span class="cnt">${n}</span>` : ""}</button>`).join("");
    // tür süzgeci
    const used = S.types.filter((t) => S.books.some((b) => b.type === t.id));
    if (libType !== "all" && !used.some((t) => t.id === libType)) libType = "all";
    $("#b-types").innerHTML = used.length > 1 && libTab !== "notes" ? `<button class="tchip sm ${libType === "all" ? "on" : ""}" data-t="all">Tüm türler</button>${used.map((t) => `<button class="tchip sm ${libType === t.id ? "on" : ""}" data-t="${t.id}">${esc(t.emoji)} ${esc(t.name)}</button>`).join("")}` : "";
    S.books.forEach(autoCover);
    const list = $("#b-list");
    const wasDesk = !!$(".desk", list);
    renderReadDesk();
    if (libTab === "notes") { renderDesk(list); list.scrollTop = 0; }
    else { if (wasDesk) list.innerHTML = ""; renderShelves(list, animate && !wasDesk); }
  }

  /* ---------- raflar ---------- */
  // sırt renkleri: [üst, alt, yazı]
  const SPINES = [["#6e2a1c", "#4a1a10", "#f3dfc0"], ["#1f4a3f", "#11302a", "#efe3c8"], ["#22305a", "#141c38", "#f1e6cc"], ["#8a6a2e", "#5c4519", "#fff3d8"], ["#5a2b4f", "#371830", "#f6e2ea"],
    ["#3e4a2a", "#262f18", "#efe9cf"], ["#9c3b28", "#6a2416", "#fbe8d2"], ["#2f5265", "#1a3341", "#e8f0f3"], ["#d9c8a5", "#bfa978", "#3a2c18"], ["#c9a24d", "#9c7a2c", "#2a1d08"],
    ["#2b2b2e", "#161618", "#e8d6a8"], ["#b6684d", "#8b4a33", "#fff1e4"], ["#5f7a6a", "#3f5649", "#f3f1e6"], ["#7d1e2e", "#52121c", "#f2d8a6"], ["#e4ddcf", "#cfc4ae", "#5a2a1a"]];
  function coverColors(b) {
    let h = 0; for (const c of (b.title || "") + (b.author || "")) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const sp = SPINES[h % SPINES.length];
    return { h, c: [sp[0], sp[1]], ink: sp[2], style: (h >>> 4) % 4 };
  }
  const spineInner = (b, au, w) => `<span class="sp-top">${b.rating && w >= 16 ? "★".repeat(b.rating) : ""}</span><span class="sp-t">${esc(b.title)}</span><span class="sp-a">${w >= 18 ? esc(au.slice(0, Math.max(3, Math.floor(w / 5)))) : ""}</span>`;
  // sırt kalınlığı sayfa sayısıyla doğru orantılı (yaklaşık 14 sayfa = 1 px)
  const spineW = (b) => clamp(Math.round(5 + (b.total || 240) / 14), 9, 104);
  const spineH = (b) => 100 + (coverColors(b).h % 6) * 6;
  function spineHTML(b) {
    const { c: [c1, c2], ink, style } = coverColors(b), w = spineW(b);
    const au = (b.author || "").split(",")[0].trim().split(/\s+/).pop() || "";
    return `<button class="spine s${style}${w < 16 ? " thin" : ""}" data-id="${b.id}" style="width:${w}px;height:${spineH(b)}px;--c1:${c1};--c2:${c2};--ink:${ink}" aria-label="${esc(b.title)}">${isReading(b) ? '<i class="rb"></i>' : ""}${spineInner(b, au, w)}</button>`;
  }
  // süzgece göre kitaplar: önce okunanlar, sonra okunacaklar, sonra bitenler (yeniden eskiye)
  function shelfBooks() {
    const pool = S.books.filter(inType);
    const r = pool.filter(isReading), w = pool.filter((b) => !b.finishedAt && b.want), d = pool.filter((b) => b.finishedAt).sort((a, b) => (b.finishedAt > a.finishedAt ? 1 : -1));
    return libTab === "reading" ? r : libTab === "want" ? w : libTab === "done" ? d : [...r, ...w, ...d];
  }
  // Kitaplık hep aynı: raflar ekranı doldurur, süzgeç değişince kitaplar yer değiştirir
  function renderShelves(list, animate) {
    const old = new Map();
    if (animate) $$(".spine", list).forEach((el) => old.set(el.dataset.id, { r: el.getBoundingClientRect(), html: el.outerHTML }));
    const arr = shelfBooks();
    const W = (list.clientWidth || 340) - 32;
    const rows = []; let row = [], used = 0;
    for (const b of arr) {
      const w = spineW(b) + 2;
      if (used + w > W && row.length) { rows.push(row); row = []; used = 0; }
      row.push(b); used += w;
    }
    if (row.length) rows.push(row);
    const fit = Math.max(2, Math.floor((list.clientHeight || 420) / 162));
    while (rows.length < fit) rows.push([]);
    const st = list.scrollTop;
    list.innerHTML = `<div class="bookcase">${rows.map((r) => `<div class="shelf"><div class="books">${r.map(spineHTML).join("")}</div></div>`).join("")}
      ${arr.length ? "" : `<div class="case-empty"><span class="serif">${{ all: "Kitaplığın boş", reading: "Şu an okuduğun kitap yok", want: "Okunacak kitap yok", done: "Henüz biten kitap yok" }[libTab]}</span><div class="btnrow"><button class="btn acc sm" data-add>${ic("plus")}Ekle</button><button class="btn ghost sm" data-imp>${ic("down")}İçe aktar</button></div></div>`}</div>`;
    list.scrollTop = st;
    const ad = $("[data-add]", list); if (ad) { ad.onclick = openAddMenu; $("[data-imp]", list).onclick = openImport; }
    $$(".spine", list).forEach((el) => el.onclick = () => openBookPage(book(el.dataset.id), el, "spine"));
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const ease = "cubic-bezier(.3,.75,.2,1)";
    if (!animate) { $$(".spine", list).forEach((el, i) => el.animate([{ opacity: 0, transform: "translateY(-18px)" }, { opacity: 1, transform: "none" }], { duration: 480, delay: Math.min(i, 30) * 18, easing: ease, fill: "backwards" })); return; }
    // kalanlar yeni yerine kayar, gelenler rafa iner, gidenler raftan kalkar
    let n = 0;
    $$(".spine", list).forEach((el) => {
      const o = old.get(el.dataset.id), r = el.getBoundingClientRect();
      if (o) { el.animate([{ transform: `translate(${o.r.left - r.left}px,${o.r.top - r.top}px)` }, { transform: "none" }], { duration: 560, easing: ease }); old.delete(el.dataset.id); }
      else el.animate([{ opacity: 0, transform: "translateY(-34px)" }, { opacity: 1, transform: "none" }], { duration: 460, delay: 140 + Math.min(n++, 20) * 22, easing: ease, fill: "backwards" });
    });
    for (const { r, html } of old.values()) {
      const g = document.createElement("div"); g.className = "ghost"; g.innerHTML = html;
      const el = g.firstChild; el.style.position = "fixed"; el.style.left = r.left + "px"; el.style.top = r.top + "px"; el.style.margin = "0"; el.style.zIndex = 30; el.style.pointerEvents = "none";
      document.body.append(el);
      el.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-30px) scale(.96)" }], { duration: 320, easing: "ease-in", fill: "forwards" }).finished.then(() => el.remove());
    }
  }
  // okuma masası: şu an okunanlar kapakları görünür durur
  function renderReadDesk() {
    const dk = $("#b-desk");
    dk.hidden = libTab === "notes";
    if (dk.hidden) return;
    const r = S.books.filter(isReading).sort((a, b) => (a.id === S.activeBook ? -1 : b.id === S.activeBook ? 1 : 0));
    const max = Math.max(1, Math.floor(((dk.clientWidth || 350) - 30) / 74));
    const show = r.slice(0, r.length > max ? max - 1 : max), more = r.length - show.length;
    dk.innerHTML = `<div class="dk-top"><span>Okuma masam</span>${r.length ? `<small>${r.length} kitap</small>` : ""}</div>
      <div class="dk-row">${show.map((b) => { const p = bookProgress(b); return `<button class="dk" data-id="${b.id}">${coverHTML(b, "dkc")}${b.total ? `<span class="dk-bar"><i style="width:${p.pct * 100}%"></i></span>` : ""}</button>`; }).join("")}
      ${more > 0 ? `<button class="dk more" data-more>+${more}</button>` : ""}${r.length ? "" : `<span class="dk-empty">Raftan bir kitap seç, “Okumaya başla” de; masana gelsin.</span>`}</div>`;
    $$(".dk[data-id]", dk).forEach((el) => el.onclick = () => openBookPage(book(el.dataset.id), el, "face"));
    const mo = $("[data-more]", dk); if (mo) mo.onclick = () => { libTab = "reading"; renderBooks(true); };
  }

  // Kitap sayfası: kitap raftan çekilip dönerek üstte büyür, altında bilgiler açılır
  function openBookPage(b, el, from) {
    if (!b || $(".bpage")) return;
    const appH = $("#app").getBoundingClientRect().height;
    const safeT = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--safe-t")) || 0;
    const W = Math.min(innerWidth * 0.38, 150, appH * 0.17), H = W * 1.5;
    const L = (innerWidth - W) / 2, T = safeT + 22;
    const r = el ? el.getBoundingClientRect() : null;
    const cc = coverColors(b), au = (b.author || "").split(",")[0].trim().split(/\s+/).pop() || "";
    const D = from === "spine" && r ? clamp(r.width * H / r.height, 8, W * 0.6) : clamp(spineW(b) * H / 112, 8, W * 0.45);
    const face = b.cover ? coverHTML(b, "pc") : `<span class="cover pc" style="--c1:${cc.c[0]};--c2:${cc.c[1]};color:${cc.ink}"><span class="pc-t">${esc(b.title)}</span>${b.author ? `<span class="pc-a">${esc(b.author)}</span>` : ""}</span>`;
    const ov = document.createElement("div"); ov.className = "pull bpage";
    ov.innerHTML = `<div class="pull-bg"></div><button class="iconbtn bp-x" aria-label="Kapat">${ic("x")}</button>
      <div class="b3d" style="left:${L}px;top:${T}px;width:${W}px;height:${H}px;--d:${D}px;--hw:${W / 2}px;--hh:${H / 2}px">
        <div class="f front">${face}</div><div class="f back" style="--c1:${cc.c[0]};--c2:${cc.c[1]}"></div>
        <div class="f side spine s${cc.style}" style="--c1:${cc.c[0]};--c2:${cc.c[1]};--ink:${cc.ink}">${spineInner(b, au, 30)}</div>
        <div class="f pages"></div><div class="f topp"></div></div>
      <div class="bp-panel" style="top:${T + H + 20}px"><div class="sh-body bp-body"></div></div>`;
    document.body.append(ov);
    if (el) el.style.visibility = "hidden";
    const bk = $(".b3d", ov), panel = $(".bp-panel", ov), bgEl = $(".pull-bg", ov), body = $(".bp-body", ov);
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frames;
    if (r) {
      const dx = r.left + r.width / 2 - (L + W / 2), dy = r.top + r.height / 2 - (T + H / 2), s0 = r.height / H;
      const rot0 = from === "spine" ? 90 : 0, lift = from === "spine" ? 40 : 16;
      frames = [
        { transform: `translate(${dx}px,${dy}px) scale(${s0}) rotateY(${rot0}deg)`, offset: 0 },
        { transform: `translate(${dx}px,${dy - lift}px) scale(${s0 * 1.04}) rotateY(${rot0}deg)`, offset: 0.24 },
        { transform: `translate(${dx * 0.4}px,${(dy - lift) * 0.4}px) scale(${(s0 + 1) / 2}) rotateY(${from === "spine" ? 36 : -20}deg)`, offset: 0.62 },
        { transform: "translate(0,0) scale(1) rotateY(0deg)", offset: 1 },
      ];
    } else frames = [{ transform: "translateY(30px) scale(.7) rotateY(40deg)", opacity: 0 }, { transform: "none", opacity: 1 }];
    const dur = reduce ? 1 : 820;
    bk.animate(frames, { duration: dur, easing: "cubic-bezier(.3,.7,.2,1)", fill: "both" });
    bgEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur * 0.5, fill: "both" });
    panel.animate([{ transform: "translateY(105%)" }, { transform: "none" }], { duration: reduce ? 1 : 520, delay: reduce ? 0 : dur * 0.45, easing: "cubic-bezier(.2,.9,.25,1)", fill: "both" });
    let closing = false;
    const ctx = { body, el: ov, rebuild: () => { const sc = panel.scrollTop; body.innerHTML = ""; buildDetail(ctx, b); panel.scrollTop = sc; }, close: (then) => {
      if (closing) return; closing = true;
      const still = el && el.isConnected && book(b.id);
      panel.animate([{ transform: "none" }, { transform: "translateY(105%)" }], { duration: 260, easing: "ease-in", fill: "both" });
      bgEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reduce ? 1 : 520, delay: 120, fill: "both" });
      const back = still ? [...frames].reverse().map((f) => ({ ...f, offset: f.offset == null ? undefined : 1 - f.offset })) : [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.85)" }];
      bk.animate(back, { duration: reduce ? 1 : 600, delay: 80, easing: "cubic-bezier(.5,0,.2,1)", fill: "both" })
        .finished.then(() => { if (el) el.style.visibility = ""; ov.remove(); typeof then === "function" && then(); });
    } };
    bgEl.onclick = () => ctx.close(); bk.onclick = () => ctx.close(); $(".bp-x", ov).onclick = () => ctx.close();
    buildDetail(ctx, b);
  }

  /* ---------- notlar: masa üstünde kâğıtlar ---------- */
  function renderDesk(list) {
    const ks = Object.keys(S.days).filter((k) => (S.days[k].notes || "").trim()).sort().reverse();
    if (!ks.length) {
      list.innerHTML = `<div class="desk empty"><div class="empty-state">${ic("quote", "big")}<span class="serif">Masan henüz boş</span><span>Bugün ekranındaki “Okuma notları” sekmesine yazdığın alıntılar ve düşünceler burada kâğıtlara dökülür.</span></div></div>`;
      return;
    }
    list.innerHTML = `<div class="desk">${ks.map((k, i) => {
      const e = S.days[k], b = book(e.noteId), d = parse(k);
      const rot = (((i * 37) % 9) - 4) * 0.7;
      return `<button class="paper" data-k="${k}" style="--r:${rot}deg;--i:${Math.min(i, 16)}"><span class="pin"></span><small>${d.getDate()} ${AYK[d.getMonth()]} ${d.getFullYear()}</small><span class="q">${esc(e.notes.trim().slice(0, 260))}</span>${b ? `<span class="src">— ${esc(b.title)}</span>` : ""}</button>`;
    }).join("")}</div>`;
    $(".desk", list).classList.add("enter");
    $$(".paper", list).forEach((p) => p.onclick = () => openPaper(p, p.dataset.k));
  }
  // kâğıdı masadan alıp ekrana getirir
  function openPaper(el, k) {
    const e = entry(k); if (!e) return;
    const b = book(e.noteId), d = parse(k);
    const r = el.getBoundingClientRect();
    const appH = $("#app").getBoundingClientRect().height;
    const W = Math.min(innerWidth - 40, 440), H = Math.min(appH * 0.66, 560);
    const L = (innerWidth - W) / 2, T = Math.max(30, (appH - H) / 2 - 30);
    const ov = document.createElement("div"); ov.className = "pull";
    ov.innerHTML = `<div class="pull-bg"></div>
      <div class="paper big" style="left:${L}px;top:${T}px;width:${W}px;height:${H}px"><span class="pin"></span>
        <small>${GUNLER[dow(d)]} · ${longDate(d)}</small>${b ? `<b class="src-b">${esc(b.title)}${b.author ? ` · ${esc(b.author)}` : ""}</b>` : ""}
        <div class="q">${esc(e.notes.trim())}</div>
      </div>
      <div class="pull-info" style="top:${T + H + 18}px"><div class="btnrow"><button class="btn acc sm" data-a="share">${ic("up")}Paylaş</button><button class="btn ghost sm" data-a="day">${ic("edit")}Düzenle</button></div></div>`;
    document.body.append(ov);
    el.style.visibility = "hidden";
    const pp = $(".paper.big", ov), info = $(".pull-info", ov), bgEl = $(".pull-bg", ov);
    const sx = r.width / W, sy = r.height / H, dx = r.left + r.width / 2 - (L + W / 2), dy = r.top + r.height / 2 - (T + H / 2);
    const rot = getComputedStyle(el).getPropertyValue("--r") || "0deg";
    const frames = [{ transform: `translate(${dx}px,${dy}px) scale(${sx},${sy}) rotate(${rot})` }, { transform: `translate(${dx * 0.3}px,${dy * 0.3 - 30}px) scale(${(sx + 1) / 2},${(sy + 1) / 2}) rotate(-3deg)`, offset: 0.55 }, { transform: "none" }];
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    pp.animate(frames, { duration: reduce ? 1 : 620, easing: "cubic-bezier(.3,.7,.2,1)", fill: "both" });
    bgEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380, fill: "both" });
    info.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, delay: 450, fill: "both" });
    let closing = false;
    const close = (then) => {
      if (closing) return; closing = true;
      info.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, fill: "both" });
      bgEl.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 420, fill: "both" });
      pp.animate([...frames].reverse().map((f, i) => ({ transform: f.transform, offset: [0, 0.45, 1][i] })), { duration: reduce ? 1 : 480, easing: "cubic-bezier(.5,0,.2,1)", fill: "both" })
        .finished.then(() => { el.style.visibility = ""; ov.remove(); then && then(); });
    };
    bgEl.onclick = () => close();
    $("[data-a=share]", ov).onclick = () => close(() => openShare("quote", { k }));
    $("[data-a=day]", ov).onclick = () => close(() => openDay(k, "notes"));
  }

  /* ---------- listeden içe aktarma ---------- */
  // CSV satırı ayrıştırıcı (tırnaklı alanları destekler)
  function csvRows(text, sep) {
    const rows = []; let row = [], f = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) { if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
      else if (ch === '"') q = true;
      else if (ch === sep) { row.push(f); f = ""; }
      else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(f); rows.push(row); row = []; f = ""; }
      else f += ch;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows.filter((r) => r.some((x) => x.trim()));
  }
  // Metinden kitap listesi çıkarır: Goodreads / başlıklı CSV ya da her satıra "Kitap - Yazar - sayfa"
  function parseBookList(text) {
    text = text.replace(/^﻿/, "");
    const first = text.split(/\r?\n/)[0] || "";
    const sep = first.includes("\t") ? "\t" : first.split(";").length > first.split(",").length ? ";" : ",";
    const norm = (x) => x.trim().toLocaleLowerCase("tr-TR");
    const head = csvRows(first, sep)[0]?.map(norm) || [];
    const col = (...names) => head.findIndex((h) => names.includes(h));
    const ti = col("title", "başlık", "kitap", "kitap adı", "ad", "name"), ai = col("author", "yazar", "author l-f");
    const out = [];
    if (ti >= 0 && head.length > 1) {
      const pi = col("number of pages", "pages", "sayfa", "sayfa sayısı"), shi = col("exclusive shelf", "shelf", "durum", "raf"), di = col("date read", "okuma tarihi", "bitiş");
      for (const r of csvRows(text, sep).slice(1)) {
        const title = (r[ti] || "").trim(); if (!title) continue;
        const sh = norm(r[shi] || "");
        const dr = (r[di] || "").trim().replace(/\//g, "-");
        out.push({ title, author: (r[ai] || "").trim(), pages: parseInt(r[pi]) || 0,
          status: /to-read|okunacak/.test(sh) ? "want" : /currently|okunuyor/.test(sh) ? "reading" : sh ? "done" : null,
          date: /^\d{4}-\d{2}-\d{2}$/.test(dr) ? dr : "" });
      }
      return out;
    }
    for (let line of text.split(/\r?\n/)) {
      line = line.replace(/^\s*(?:[-•*·–]|\d+[.)])\s*/, "").trim();
      if (!line) continue;
      const parts = line.split(/\s+[-–—|/]\s+|\t|;/).map((x) => x.trim()).filter(Boolean);
      const pages = parts.length > 1 && /^\d+$/.test(parts[parts.length - 1]) ? parseInt(parts.pop()) : 0;
      out.push({ title: parts[0], author: parts.slice(1).join(", "), pages, status: null, date: "" });
    }
    return out;
  }
  function openImport() {
    if (!needPlus("import")) return;
    let status = "want", lookup = true, text = "";
    openSheet("Kitapları içe aktar", (c) => {
      c.body.innerHTML = `
        <p class="muted" style="font-size:13px;margin-top:-6px">Her satıra bir kitap yaz ya da yapıştır: <b>Kitap adı - Yazar</b> (sonuna sayfa sayısı da ekleyebilirsin). Goodreads'ten indirilen CSV dosyası da olur.</p>
        <textarea class="inp imp-ta" id="im-text" placeholder="Kürk Mantolu Madonna - Sabahattin Ali&#10;Tutunamayanlar - Oğuz Atay - 724&#10;Saatleri Ayarlama Enstitüsü - Ahmet Hamdi Tanpınar"></textarea>
        <button class="btn ghost wide" id="im-file">${ic("down")}Dosyadan seç (.txt, .csv)</button>
        <div class="field"><label>Bu kitaplar…</label><div class="seg" id="im-status">${[["want", "Okuyacağım"], ["reading", "Okuyorum"], ["done", "Okudum"]].map(([k, l]) => `<button data-s="${k}" class="${k === status ? "on" : ""}">${l}</button>`).join("")}</div></div>
        <button class="set-row" id="im-look" style="padding:4px 2px"><span class="l"><span>Kapakları ve sayfa sayılarını bul<small>İnternetten, kitap kitap (biraz sürebilir)</small></span></span><span class="switch ${lookup ? "on" : ""}"></span></button>
        <button class="btn acc wide" id="im-go" disabled>İçe aktar</button>
        <input type="file" id="im-input" accept=".txt,.csv,.tsv,text/plain,text/csv" hidden>`;
      const ta = $("#im-text", c.body), go = $("#im-go", c.body);
      const refresh = () => {
        text = ta.value;
        const n = parseBookList(text).length;
        go.disabled = !n; go.textContent = n ? `İçe aktar (${n} kitap)` : "İçe aktar";
      };
      ta.oninput = refresh;
      $("#im-file", c.body).onclick = () => $("#im-input", c.body).click();
      $("#im-input", c.body).onchange = async (ev) => { const f = ev.target.files[0]; if (!f) return; ta.value = await f.text(); refresh(); };
      $$("#im-status button", c.body).forEach((x) => x.onclick = () => { status = x.dataset.s; $$("#im-status button", c.body).forEach((y) => y.classList.toggle("on", y === x)); });
      $("#im-look", c.body).onclick = () => { lookup = !lookup; $("#im-look .switch", c.body).classList.toggle("on", lookup); };
      go.onclick = () => {
        const list = parseBookList(text);
        const have = new Set(S.books.map((b) => (b.title + "|" + (b.author || "")).toLocaleLowerCase("tr-TR")));
        const added = [];
        for (const x of list) {
          const key = (x.title + "|" + x.author).toLocaleLowerCase("tr-TR");
          if (have.has(key)) continue; have.add(key);
          const st = x.status || status;
          const b = { id: uid(), type: "kitap", title: x.title.slice(0, 120), author: x.author.slice(0, 80), total: x.pages, start: 0, cover: "", createdAt: keyOf(today()),
            want: st === "want", finishedAt: st === "done" ? (x.date || "eski") : null, coverTried: !lookup };
          S.books.push(b); added.push(b);
        }
        save(); c.close();
        const skipped = list.length - added.length;
        toast(`${added.length} kitap eklendi${skipped ? ` · ${skipped} zaten vardı` : ""}`);
        libTab = "all"; renderAll();
        if (lookup) enrichBooks(added);
      };
    });
  }
  // içe aktarılan kitaplara sırayla kapak ve sayfa sayısı bulur
  async function enrichBooks(list) {
    for (const b of list) {
      if (!navigator.onLine) break;
      try {
        const res = await searchBooks(`${b.title} ${b.author || ""}`.trim());
        const t = b.title.toLocaleLowerCase("tr-TR");
        const hit = res.find((r) => r.cover && r.title.toLocaleLowerCase("tr-TR").includes(t.slice(0, 12))) || res.find((r) => r.cover);
        if (hit && book(b.id)) { b.cover = hit.cover; if (!b.total && hit.pages) b.total = hit.pages; if (!b.author && hit.author) b.author = hit.author; }
        b.coverTried = true; save();
        if (tab === "books") renderBooks();
      } catch (e) { /* sonraki kitaba geç */ }
      await new Promise((r) => setTimeout(r, 350));
    }
  }

  /* ================= RAPOR ================= */
  let rType = "week", rAnchor = today(), rPick = null, rMode = "days";
  $("#r-mode").addEventListener("click", (ev) => { const b = ev.target.closest("button"); if (!b) return; if (b.dataset.m === "an" && !needPlus("analytics")) return; rMode = b.dataset.m; rPick = null; renderReport(); });
  $("#r-prev").innerHTML = ic("left");
  $("#r-next").innerHTML = ic("right");
  $("#r-seg").addEventListener("click", (ev) => { const b = ev.target.closest("button"); if (!b) return; rType = b.dataset.k; rAnchor = today(); rPick = null; renderReport(); });
  function shift(n) {
    const a = rAnchor;
    rAnchor = rType === "day" ? addDays(a, n) : rType === "week" ? addDays(a, 7 * n) : rType === "month" ? new Date(a.getFullYear(), a.getMonth() + n, 1) : new Date(a.getFullYear() + n, 0, 1);
    rPick = null; renderReport();
  }
  $("#r-prev").onclick = () => shift(-1);
  $("#r-next").onclick = () => { if (!$("#r-next").disabled) shift(1); };
  (() => { let x0 = null; const el = $("#s-rep .chart");
    el.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener("touchend", (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 60) (dx < 0 ? $("#r-next") : $("#r-prev")).click(); });
  })();

  function range(type, a) {
    if (type === "day") { const d = new Date(a); d.setHours(0, 0, 0, 0); return [d, d]; }
    if (type === "week") { const s = weekStart(a); return [s, addDays(s, 6)]; }
    if (type === "month") return [new Date(a.getFullYear(), a.getMonth(), 1), new Date(a.getFullYear(), a.getMonth() + 1, 0)];
    return [new Date(a.getFullYear(), 0, 1), new Date(a.getFullYear(), 11, 31)];
  }
  function statsFor(from, to) {
    const t = today(), end = to < t ? to : t;
    // ilk kayıttan önceki günler “boş gün” sayılmasın
    const first = Object.keys(S.days).sort()[0];
    if (first && parse(first) > from) from = parse(first);
    const r = { pages: 0, wrote: 0, active: 0, goalDays: 0, words: 0, moods: [0, 0, 0, 0, 0, 0], elapsed: Math.max(0, daysBetween(from, end) + 1), books: {}, byType: {}, min: 0, tags: {} };
    for (let d = new Date(from); d <= end; d = addDays(d, 1)) {
      const e = entry(keyOf(d)); if (!e) continue;
      r.pages += e.pages || 0;
      r.min += e.min || 0;
      for (const tg of tagsOf(e.text + " " + e.notes)) r.tags[tg] = (r.tags[tg] || 0) + 1;
      if (hasWriting(e)) r.wrote++;
      if (isActive(e)) r.active++;
      if ((e.pages || 0) >= S.settings.goal) r.goalDays++;
      r.words += words(e.text) + words(e.notes);
      if (e.mood) r.moods[e.mood]++;
      for (const x of reads(e)) {
        if (x.id) r.books[x.id] = (r.books[x.id] || 0) + x.pages;
        const tid = x.id && book(x.id) ? book(x.id).type : "_";
        r.byType[tid] = (r.byType[tid] || 0) + x.pages;
      }
    }
    r.finished = S.books.filter((b) => isBook(b) && b.finishedAt && b.finishedAt >= keyOf(from) && b.finishedAt <= keyOf(to)).length;
    r.booksRead = Object.keys(r.books).filter((id) => isBook(book(id))).length;
    r.longest = longest(from, end);
    return r;
  }

  function renderReport() {
    const t = today();
    $$("#r-seg button").forEach((b) => b.classList.toggle("on", b.dataset.k === rType));
    const [from, to] = range(rType, rAnchor);
    const prevA = rType === "day" ? addDays(from, -1) : rType === "week" ? addDays(from, -7) : rType === "month" ? new Date(from.getFullYear(), from.getMonth() - 1, 1) : new Date(from.getFullYear() - 1, 0, 1);
    const [pf, pt] = range(rType, prevA);
    const s = statsFor(from, to), ps = statsFor(pf, pt);
    const isCur = from <= t && t <= to;
    $("#r-next").disabled = to >= t; $("#r-next").style.opacity = to >= t ? .35 : 1;

    let title;
    if (rType === "day") { const df = daysBetween(from, t); title = df === 0 ? "Bugün" : df === 1 ? "Dün" : `${from.getDate()} ${AYLAR[from.getMonth()]} ${GUNLER[dow(from)]}`; }
    else if (rType === "week") title = isCur ? "Bu hafta" : from.getMonth() === to.getMonth() ? `${from.getDate()}–${to.getDate()} ${AYLAR[to.getMonth()]}` : `${from.getDate()} ${AYK[from.getMonth()]} – ${to.getDate()} ${AYK[to.getMonth()]}`;
    else if (rType === "month") title = `${AYLAR[from.getMonth()]} ${from.getFullYear()}`;
    else title = String(from.getFullYear());
    $("#r-title").innerHTML = `<span>${esc(title)}</span>${ic("up")}`;
    $("#r-title").onclick = () => openSheet(title, (c) => {
      c.body.innerHTML = `<div class="set-group"><button class="set-row" data-a="story"><span class="l">${ic("star")}<span>Özet hikâyesini izle ${plusB("story")}<small>Sayfalar, kitaplar, alıntılar — ekran ekran</small></span></span>${ic("right")}</button>
        <button class="set-row" data-a="card"><span class="l">${ic("up")}<span>Paylaşım kartı<small>Tek görselde dönem özeti</small></span></span>${ic("right")}</button></div>`;
      $("[data-a=story]", c.body).onclick = () => { c.close(); setTimeout(() => openStory(title, from, to, s), 250); };
      $("[data-a=card]", c.body).onclick = () => { c.close(); setTimeout(() => openShare("period", { title, from, to, s }), 250); };
    });

    const unit = rType === "day" ? "önceki gün" : rType === "week" ? "geçen hafta" : rType === "month" ? "geçen ay" : "geçen yıl";
    let delta = "";
    if (ps.pages > 0) { const pc = Math.round((s.pages - ps.pages) / ps.pages * 100); delta = `<span class="${pc >= 0 ? "up" : "down"}">${pc >= 0 ? "▲" : "▼"} %${Math.abs(pc)}</span> · ${unit}: ${fmt(ps.pages)}`; }
    else delta = s.pages ? "Yeni bir başlangıç" : "Henüz sayfa yok";
    const avg = s.elapsed ? s.pages / s.elapsed : 0;
    if (rType === "day") {
      const e = entry(keyOf(from)) || {}, w = words(e.text) + words(e.notes), goalPct = Math.round((e.pages || 0) / S.settings.goal * 100);
      $("#r-kpis").innerHTML = `
      <div class="card kpi"><span class="eyebrow">Okunan sayfa</span><b class="num" data-n="${s.pages}">${fmt(s.pages)}</b><p>${delta}</p></div>
      <div class="card kpi"><span class="eyebrow">Okuma süresi</span><b class="num">${s.min ? fmtMin(s.min).replace(/(\d+)\s(dk|sa)/g, "$1<small>$2</small>") : "–"}</b><p>${s.min && s.pages ? `saatte ~${fmt(s.pages / s.min * 60)} sayfa` : "Bugün ekranında ⏱ ile ölç"}</p></div>
      <div class="card kpi"><span class="eyebrow">Hedef</span><b class="num">%${goalPct}</b><p>${e.pages >= S.settings.goal ? "Hedef tuttu ✓" : `hedef ${S.settings.goal} sayfa`}</p></div>
      <div class="card kpi"><span class="eyebrow">Yazdığın</span><b class="num">${fmt(w)}<small>kelime</small></b><p>${hasWriting(e) ? "Günlük yazıldı" : "Günlük boş"}${isCur ? ` · seri ${streak()} gün` : ""}</p></div>`;
    } else
    $("#r-kpis").innerHTML = `
      <div class="card kpi"><span class="eyebrow">Okunan sayfa</span><b class="num" data-n="${s.pages}">${fmt(s.pages)}</b><p>${delta}</p></div>
      <div class="card kpi"><span class="eyebrow">Yazılan gün</span><b class="num">${s.wrote}<small>/ ${s.elapsed}</small></b><p>${s.elapsed ? `%${Math.round(s.wrote / s.elapsed * 100)} düzen` : "–"}</p></div>
      <div class="card kpi"><span class="eyebrow">Günlük ortalama</span><b class="num">${avg >= 10 ? fmt(avg) : avg.toFixed(1).replace(".", ",")}<small>sayfa</small></b><p>Hedef ${S.settings.goal} · ${s.goalDays} gün tuttu</p></div>
      <div class="card kpi"><span class="eyebrow">En uzun seri</span><b class="num">${s.longest}<small>gün</small></b><p>${isCur ? `Şu anki seri: ${streak()} gün` : `${s.active} aktif gün`}</p></div>`;

    $$("#r-kpis [data-n]").forEach((el) => countUp(el, +el.dataset.n));
    const kp = $("#r-kpis"); kp.classList.remove("enter"); void kp.offsetWidth; kp.classList.add("enter");
    if (rMode === "an" && !isPlus()) rMode = "days";
    $$("#r-mode button").forEach((b) => b.classList.toggle("on", b.dataset.m === rMode));
    $("#r-mode").style.display = rType === "day" ? "none" : "";
    if (rMode === "an" && rType !== "day") {
      $("#r-chart").innerHTML = analyticsHTML(from, to, s);
      $("#r-pick").textContent = "";
    } else if (rMode === "items" || rType === "day") {
      // okumalara göre: her kitap / gazete / dergi için okunan sayfa
      const ch = $("#r-chart");
      const rows = Object.entries(s.books).filter(([id]) => book(id)).sort((a, b) => b[1] - a[1]);
      const other = s.byType._ || 0;
      const mx = Math.max(1, ...rows.map((r) => r[1]), other);
      const tsum = S.types.filter((t) => s.byType[t.id]).map((t) => `<span class="tag"><span>${esc(t.emoji)} ${esc(t.name)} · ${fmt(s.byType[t.id])} s.</span></span>`).join("");
      const irow = (b, v, id) => `<${id ? `button data-id="${id}"` : "div"} class="irow">${coverHTML(b)}<span class="t"><b>${b ? esc(b.title) : "Diğer"}</b><span class="bar"><i style="width:${v / mx * 100}%"></i></span></span><span class="v num">${fmt(v)}</span></${id ? "button" : "div"}>`;
      ch.innerHTML = rows.length || other ? `<div class="ilist">${tsum ? `<div class="tsum">${tsum}</div>` : ""}${rows.map(([id, v]) => irow(book(id), v, id)).join("")}${other ? irow(null, other) : ""}</div>`
        : `<div class="pv-empty" style="height:100%"><span>Bu dönemde okuma kaydı yok.</span></div>`;
      $$(".irow[data-id]", ch).forEach((x) => x.onclick = () => openBookDetail(book(x.dataset.id)));
      $("#r-pick").textContent = rType === "day" ? (rows.length || other ? `${rows.length + (other ? 1 : 0)} okuma${s.min ? " · " + fmtMin(s.min) : ""}` : "") : rows.length ? `${rows.length} okuma · ${fmt(s.pages)} sayfa` : "";
    } else {
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
    // en çok okunan hafta günü (ay ve yıl görünümünde)
    let bestDay = "";
    if (rType !== "week" && s.pages) {
      const byDow = [0, 0, 0, 0, 0, 0, 0];
      for (let d = new Date(from); d <= to && d <= t; d = addDays(d, 1)) byDow[dow(d)] += entry(keyOf(d))?.pages || 0;
      bestDay = ` · en çok ${GUNLER[byDow.indexOf(Math.max(...byDow))]}`;
    }
    $("#r-pick").textContent = rPick != null ? tips[rPick] : rType === "year" ? (yearAvg ? `aylık ort. ${fmt(s.pages / Math.max(1, yearAvg))}${bestDay}` : "") : (s.pages ? `toplam ${fmt(s.pages)}${s.min ? " · " + fmtMin(s.min) : ""}${bestDay}` : "");
    $$("#r-chart .bars button").forEach((b) => b.onclick = () => {
      const i = +b.dataset.i;
      if (rPick === i && keys[i]) { openDay(keys[i]); return; }
      if (rPick === i && rType === "year") { rType = "month"; rAnchor = new Date(from.getFullYear(), i, 1); rPick = null; renderReport(); return; }
      rPick = i; renderReport();
    });
    }

    // ruh hâli
    const mt = s.moods.reduce((a, b) => a + b, 0);
    const mavg = mt ? s.moods.reduce((a, n, i) => a + n * i, 0) / mt : 0;
    const best = mt ? Math.round(mavg) : 0;
    $("#r-mood").innerHTML = `<div class="mrow"><span class="eyebrow">Ruh hâli</span>${mt ? `<span class="avg" style="color:${moodColor(best)}">${face(best)}<b>${MOODS[best]}</b></span>` : `<span>Henüz işaretlenmedi</span>`}</div>
      <div class="mdist">${mt ? [5, 4, 3, 2, 1].map((m) => s.moods[m] ? `<i style="width:${s.moods[m] / mt * 100}%;background:${moodColor(m)}" title="${MOODS[m]}: ${s.moods[m]}"></i>` : "").join("") : ""}</div>
      <div class="mrow">${mt ? [5, 4, 3, 2, 1].filter((m) => s.moods[m]).map((m) => `<span><i style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${moodColor(m)};margin-right:5px"></i>${MOODS[m]} <b>${s.moods[m]}</b></span>`).slice(0, 3).join("") : `<span>Bugün ekranından gününü bir yüzle işaretle.</span>`}</div>`;

    // alt satır
    $("#r-foot").innerHTML = `
      <div><b class="num">${s.booksRead}</b><small>kitap okundu</small></div>
      <div><b class="num">${s.finished}</b><small>kitap bitti</small></div>
      <div><b class="num">${fmt(s.words)}</b><small>kelime yazdın</small></div>`;
  }

  /* ================= AYARLAR ================= */
  function openSettings() {
    openSheet("Ayarlar", (c) => {
      const st = S.settings;
      const nDays = Object.keys(S.days).length;
      const standalone = navigator.standalone === true || matchMedia("(display-mode: standalone)").matches;
      c.body.innerHTML = `
        <button class="plus-card" id="s-plus"><span class="pc-l"><b>Okuma Günlüğü <em>Plus</em></b><small>${isPlus() ? (st.admin ? "Açık · yönetici hesabı" : "Açık") : "Dijital kitaplar, analiz, hikâyeler ve daha fazlası"}</small></span><span class="pc-badge">${isPlus() ? "✦ Plus" : "Keşfet"}</span></button>
        ${st.admin ? `<button class="set-row" id="s-free" style="border-radius:14px;background:var(--bg);border:1px solid var(--line)"><span class="l">${ic("user")}<span>Ücretsiz sürümü önizle<small>Yönetici: Plus özelliklerinin kilitli hâlini dene</small></span></span><span class="switch ${isPlus() ? "" : "on"}"></span></button>` : ""}
        <div class="set-group">
          <label class="set-row"><span class="l">${ic("user")}<span>Adın</span></span><input class="inp" id="s-name" style="height:38px;width:150px;text-align:right" maxlength="30" value="${esc(st.name)}" placeholder="İsteğe bağlı"></label>
          <div class="set-row"><span class="l">${ic("target")}<span>Günlük sayfa hedefi</span></span><span class="mini-step"><button class="stepbtn" data-g="-5">${ic("minus")}</button><input class="num goal-num" id="s-goal" type="number" inputmode="numeric" min="1" max="999" value="${st.goal}" aria-label="Günlük sayfa hedefi"><button class="stepbtn" data-g="5">${ic("plus")}</button></span></div>
          <div class="set-row"><span class="l">${ic("book")}<span>Yıllık kitap hedefi</span></span><span class="mini-step"><button class="stepbtn" data-bg="-1">${ic("minus")}</button><input class="num goal-num" id="s-bgoal" type="number" inputmode="numeric" min="1" max="365" value="${st.bookGoal}" aria-label="Yıllık kitap hedefi"><button class="stepbtn" data-bg="1">${ic("plus")}</button></span></div>
          <button class="set-row" id="s-types"><span class="l">${ic("book")}<span>Okuma türleri ${plusB("types")}<small>${S.types.map((t) => esc(t.emoji) + " " + esc(t.name)).join(" · ")}</small></span></span>${ic("right")}</button>
          <div class="set-row"><span class="l">${ic("palette")}<span>Tema</span></span><div class="seg" id="s-theme"><button data-t="system">Sistem</button><button data-t="light">Açık</button><button data-t="dark">Koyu</button></div></div>
          <button class="set-row" id="s-rem"><span class="l">${ic("clock")}<span>Akşam hatırlatması<small>${st.remind ? `Her gün ${st.remind}` : "Takvimine günlük hatırlatma ekle"}</small></span></span>${ic("right")}</button>
          <button class="set-row" id="s-lock"><span class="l">${ic("lock")}<span>Şifre kilidi<small>${st.pin ? "Açılışta 4 haneli şifre sorulur" : "Günlüğünü 4 haneli şifreyle koru"}</small></span></span><span class="switch ${st.pin ? "on" : ""}"></span></button>
        </div>
        <div class="sec-t">Yedekleme</div>
        <div class="set-group">
          <button class="set-row" id="s-exp"><span class="l">${ic("down")}<span>Yedek al<small>${nDays} gün · ${S.books.length} kitap · .json dosyası</small></span></span>${ic("right")}</button>
          <button class="set-row" id="s-imp"><span class="l">${ic("up")}<span>Yedeği geri yükle<small>Önceki bir yedek dosyasını seç</small></span></span>${ic("right")}</button>
          <button class="set-row" id="s-txt"><span class="l">${ic("text")}<span>Metin olarak dışa aktar<small>Tüm günlüğün, okunabilir .txt</small></span></span>${ic("right")}</button>
        </div>
        <div class="sec-t">Kitap arama</div>
        <div class="set-group"><div class="set-row" style="flex-direction:column;align-items:stretch;gap:8px"><span class="l">${ic("search")}<span>Google Books anahtarı (isteğe bağlı)<small>Ücretsiz arama kotası dolunca bazı kitaplar çıkmaz. Kendi ücretsiz anahtarını eklersen arama her zaman çalışır.</small></span></span><input class="inp" id="s-gkey" placeholder="AIza…" value="${esc(st.gkey || "")}" autocomplete="off" autocapitalize="off" spellcheck="false"></div></div>
        <button class="btn danger wide" id="s-wipe">${ic("trash")}Tüm verileri sil</button>
        <p class="muted" style="font-size:12px;text-align:center;line-height:1.6">Okuma Günlüğü verilerini yalnızca bu cihazda saklar; hiçbir yere gönderilmez.<br>Telefon değiştirirken “Yedek al” ile dosyanı taşı.</p>
        <p class="muted" style="font-size:10.5px;text-align:center;opacity:.7">Görünüm: ${innerWidth}×${innerHeight} · ekran ${screen.width}×${screen.height} · ${standalone ? "ana ekran uygulaması" : "tarayıcı"}</p>`;
      $("#s-plus", c.body).onclick = () => openPaywall();
      const fr = $("#s-free", c.body); if (fr) fr.onclick = () => { st.plan = isPlus() ? "free" : "plus"; save(); c.rebuild(); renderAll(); toast(isPlus() ? "Plus açık" : "Ücretsiz sürüm önizleniyor"); };
      $("#s-rem", c.body).onclick = () => { c.close(); openReminder(); };
      $("#s-gkey", c.body).onchange = (e) => { st.gkey = e.target.value.trim(); save(); toast(st.gkey ? "Anahtar kaydedildi" : "Anahtar kaldırıldı"); };
      $("#s-name", c.body).oninput = (e) => { st.name = e.target.value.trim(); save(); };
      const gIn = $("#s-goal", c.body), bgIn = $("#s-bgoal", c.body);
      $$("[data-g]", c.body).forEach((b) => b.onclick = () => { st.goal = clamp(st.goal + +b.dataset.g, 1, 999); gIn.value = st.goal; save(); });
      gIn.onchange = () => { st.goal = clamp(parseInt(gIn.value) || st.goal, 1, 999); gIn.value = st.goal; save(); };
      $$("[data-bg]", c.body).forEach((b) => b.onclick = () => { st.bookGoal = clamp(st.bookGoal + +b.dataset.bg, 1, 365); bgIn.value = st.bookGoal; save(); });
      bgIn.onchange = () => { st.bookGoal = clamp(parseInt(bgIn.value) || st.bookGoal, 1, 365); bgIn.value = st.bookGoal; save(); };
      [gIn, bgIn].forEach((x) => { x.onfocus = () => x.select(); x.onkeydown = (e) => { if (e.key === "Enter") x.blur(); }; });
      $$("#s-theme button", c.body).forEach((b) => { b.classList.toggle("on", b.dataset.t === st.theme); b.onclick = () => { st.theme = b.dataset.t; save(); applyTheme(); $$("#s-theme button", c.body).forEach((x) => x.classList.toggle("on", x === b)); }; });
      $("#s-lock", c.body).onclick = () => {
        if (st.pin) { st.pin = ""; save(); c.rebuild(); toast("Şifre kilidi kapatıldı"); }
        else setPinFlow(() => c.rebuild());
      };
      $("#s-exp", c.body).onclick = exportJSON;
      $("#s-types", c.body).onclick = () => { if (!needPlus("types")) return; c.close(); openTypes(); };
      $("#s-imp", c.body).onclick = () => $("#importFile").click();
      $("#s-txt", c.body).onclick = exportTXT;
      $("#s-wipe", c.body).onclick = () => confirmSheet("Her şey silinsin mi?", "Tüm günlükler, notlar ve kitaplar bu cihazdan kalıcı olarak silinir. Önce yedek almanı öneririz.", "Hepsini sil", () => {
        const keepTheme = S.settings.theme;
        S = blank(); S.settings.theme = keepTheme; S.settings.onboarded = true; save();
        closeAllSheets(); sel = keyOf(today()); renderAll(); toast("Tüm veriler silindi");
      });
    }, { onClose: () => renderAll() });
  }

  function openTypes() {
    openSheet("Okuma türleri", (c) => {
      c.body.innerHTML = `<p class="muted" style="font-size:13px;margin-top:-6px">Adını ve simgesini değiştirebilir, yeni tür ekleyebilirsin.</p>
        <div class="set-group">${S.types.map((t) => `<div class="set-row trow" data-id="${t.id}"><input class="inp ty-emo" value="${esc(t.emoji)}" maxlength="4" aria-label="Simge"><input class="inp ty-name" value="${esc(t.name)}" maxlength="24" aria-label="Tür adı">${t.id === "kitap" ? `<span class="ty-lock" title="Kitap türü silinemez">${ic("lock")}</span>` : `<button class="iconbtn ty-del" aria-label="Sil">${ic("trash")}</button>`}</div>`).join("")}</div>
        <button class="btn ghost wide" id="ty-add">${ic("plus")}Yeni tür ekle</button>`;
      $$(".trow", c.body).forEach((row) => {
        const t = S.types.find((x) => x.id === row.dataset.id);
        $(".ty-emo", row).oninput = (e) => { t.emoji = e.target.value.trim() || "📚"; save(); };
        $(".ty-name", row).oninput = (e) => { t.name = e.target.value.trim() || "Tür"; save(); };
        const del = $(".ty-del", row);
        if (del) del.onclick = () => {
          const n = S.books.filter((b) => b.type === t.id).length;
          const go_ = () => { S.types = S.types.filter((x) => x !== t); S.books.forEach((b) => { if (b.type === t.id) b.type = "kitap"; }); save(); c.rebuild(); renderAll(); };
          n ? confirmSheet(`“${t.name}” silinsin mi?`, `Bu türdeki ${n} okuma “${S.types[0].name}” türüne taşınır.`, "Sil", go_) : go_();
        };
      });
      $("#ty-add", c.body).onclick = () => {
        S.types.push({ id: uid(), name: "Yeni tür", emoji: "📚" }); save(); c.rebuild();
        const ins = $$(".ty-name", c.body), last = ins[ins.length - 1]; last.focus(); last.select();
      };
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
    S.settings.lastBackup = Date.now(); save();
    download(`okuma-gunlugu-yedek-${keyOf(today())}.json`, JSON.stringify({ app: "gunlugum", exportedAt: new Date().toISOString(), ...S }, null, 1), "application/json");
  }
  function exportTXT() {
    const lines = ["OKUMA GÜNLÜĞÜ", "=".repeat(30), ""];
    for (const k of Object.keys(S.days).sort()) {
      const e = S.days[k], d = parse(k);
      lines.push(`${longDate(d)} · ${GUNLER[dow(d)]}`);
      const meta = [e.mood && `Ruh hâli: ${MOODS[e.mood]}`, reads(e).map((r) => { const b = book(r.id); return `${r.pages} sayfa${b ? ` (${b.title})` : ""}`; }).join(", ")].filter(Boolean).join(" · ");
      if (meta) lines.push(meta);
      if ((e.text || "").trim()) lines.push("", e.text.trim());
      if ((e.notes || "").trim()) lines.push("", "Okuma notları:", e.notes.trim());
      lines.push("", "-".repeat(30), "");
    }
    download(`okuma-gunlugu-${keyOf(today())}.txt`, lines.join("\n"), "text/plain;charset=utf-8");
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
        for (const t of d.types || []) if (!S.types.some((x) => x.id === t.id)) S.types.push(t);
        migrate(S);
        S.settings.onboarded = true;
        save(); closeAllSheets(); renderAll(); toast(`${n} gün geri yüklendi`);
      });
    } catch (e) { toast("Bu dosya bir Okuma Günlüğü yedeği değil"); }
  });

  /* ================= paylaşım kartı (görsel) ================= */
  function wrapText(x, text, maxW, maxLines) {
    const out = [];
    for (const para of String(text).split(/\n+/)) {
      let line = "";
      for (const w of para.split(/\s+/).filter(Boolean)) {
        const t = line ? line + " " + w : w;
        if (x.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
      }
      if (line) out.push(line);
    }
    if (out.length > maxLines) { out.length = maxLines; out[maxLines - 1] = out[maxLines - 1].replace(/\s*\S*$/, "") + "…"; }
    return out;
  }
  const loadImg = (src) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = src; });
  async function drawCard(kind, data, dark) {
    try { await Promise.all(["500 64px Fraunces", "italic 400 48px Fraunces", "600 28px Inter", "400 28px Inter"].map((f) => document.fonts.load(f))); } catch (e) { /* yedek yazı tipi */ }
    const W = 1080, H = 1350, cv = document.createElement("canvas"); cv.width = W; cv.height = H;
    const x = cv.getContext("2d");
    const C = dark ? { b1: "#221c17", b2: "#0d0a08", ink: "#f3ece2", mute: "#a39686", acc: "#dba663", line: "rgba(255,240,220,.14)" }
      : { b1: "#fcf8f1", b2: "#eee3d1", ink: "#1d1915", mute: "#7f766a", acc: "#a65f2b", line: "rgba(40,30,20,.13)" };
    const SERIF = '"Fraunces", Georgia, serif', SANS = '"Inter", -apple-system, Helvetica, sans-serif';
    let g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, C.b1); g.addColorStop(1, C.b2); x.fillStyle = g; x.fillRect(0, 0, W, H);
    g = x.createRadialGradient(W * 0.85, H * 0.08, 10, W * 0.85, H * 0.08, 620); g.addColorStop(0, dark ? "rgba(219,166,99,.20)" : "rgba(201,148,78,.20)"); g.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.strokeStyle = C.line; x.lineWidth = 2; x.beginPath(); x.roundRect(56, 56, W - 112, H - 112, 34); x.stroke();
    const sp = (v) => { if ("letterSpacing" in x) x.letterSpacing = v; };
    const eyebrow = (t, y) => { x.font = `600 27px ${SANS}`; sp("5px"); x.fillStyle = C.acc; x.fillText(t.toLocaleUpperCase("tr-TR"), 120, y); sp("0px"); };
    const M = 120, MW = W - 2 * M;
    if (kind === "quote" || kind === "day") {
      const k = data.k, d = parse(k), e = entry(k) || {};
      eyebrow(`${GUNLER[dow(d)]} · ${longDate(d)}`, 170);
      if (kind === "quote") {
        const b = book(e.noteId);
        x.font = `500 260px ${SERIF}`; x.fillStyle = C.acc; x.globalAlpha = 0.35; x.fillText("“", M - 20, 420); x.globalAlpha = 1;
        const qt = (e.notes || "").trim(), n = qt.length;
        const size = n < 120 ? 64 : n < 220 ? 56 : n < 350 ? 48 : n < 520 ? 42 : 38;
        x.font = `italic 400 ${size}px ${SERIF}`; x.fillStyle = C.ink;
        const lines = wrapText(x, qt, MW, Math.floor(660 / (size * 1.4)));
        lines.forEach((l, i) => x.fillText(l, M, 400 + i * size * 1.4));
        const by = 400 + lines.length * size * 1.4 + 40;
        if (b) { x.font = `600 32px ${SANS}`; x.fillStyle = C.ink; x.fillText("— " + b.title, M, by); if (b.author) { x.font = `400 28px ${SANS}`; x.fillStyle = C.mute; x.fillText(b.author, M + 36, by + 44); } }
      } else {
        x.font = `500 104px ${SERIF}`; x.fillStyle = C.ink; x.fillText(`${d.getDate()} ${AYLAR[d.getMonth()]}`, M, 300);
        let y = 360;
        const meta = [e.mood ? `Ruh hâli: ${MOODS[e.mood]}` : "", e.pages ? `${e.pages} sayfa okundu` : "", e.min ? fmtMin(e.min) : ""].filter(Boolean).join("  ·  ");
        if (meta) { x.font = `500 30px ${SANS}`; x.fillStyle = C.mute; x.fillText(meta, M, y); y += 40; }
        x.strokeStyle = C.line; x.beginPath(); x.moveTo(M, y + 10); x.lineTo(W - M, y + 10); x.stroke();
        x.font = `400 42px ${SERIF}`; x.fillStyle = C.ink;
        const lines = wrapText(x, (e.text || e.notes || "").trim() || "—", MW, 12);
        lines.forEach((l, i) => x.fillText(l, M, y + 90 + i * 62));
        const titles = reads(e).map((r) => book(r.id)?.title).filter(Boolean);
        if (titles.length) { x.font = `600 28px ${SANS}`; x.fillStyle = C.acc; x.fillText(wrapText(x, "Okunan: " + titles.join(", "), MW, 1)[0], M, H - 250); }
      }
    } else {
      const s = data.s;
      eyebrow("Okuma özeti", 170);
      x.font = `500 112px ${SERIF}`; x.fillStyle = C.ink; x.fillText(data.title, M, 300);
      const cells = [[fmt(s.pages), "sayfa okundu"], [String(s.booksRead), "kitap okundu"], [String(s.finished), "kitap bitti"], [String(s.wrote), "gün yazıldı"]];
      cells.forEach(([v, l], i) => {
        const cx = M + (i % 2) * (MW / 2), cy = 470 + Math.floor(i / 2) * 210;
        x.font = `500 116px ${SERIF}`; x.fillStyle = i ? C.ink : C.acc; x.fillText(v, cx, cy);
        x.font = `500 30px ${SANS}`; x.fillStyle = C.mute; x.fillText(l, cx + 4, cy + 50);
      });
      let y = 920;
      const extra = [s.min ? `${fmtMin(s.min)} okuma` : "", s.longest ? `en uzun seri ${s.longest} gün` : ""].filter(Boolean).join("  ·  ");
      if (extra) { x.font = `500 30px ${SANS}`; x.fillStyle = C.ink; x.fillText(extra, M, y); y += 30; }
      const top = Object.entries(s.books).map(([id, v]) => [book(id), v]).filter((r) => r[0]).sort((a, b) => b[1] - a[1]).slice(0, 3);
      top.forEach(([b, v], i) => {
        const yy = y + 40 + i * 62, { c: [c1, c2] } = coverColors(b);
        const gg = x.createLinearGradient(M, yy, M, yy + 48); gg.addColorStop(0, c1); gg.addColorStop(1, c2);
        x.fillStyle = gg; x.beginPath(); x.roundRect(M, yy, 30, 46, 4); x.fill();
        x.font = `500 32px ${SERIF}`; x.fillStyle = C.ink; x.fillText(wrapText(x, b.title, MW - 200, 1)[0], M + 50, yy + 34);
        x.font = `500 26px ${SANS}`; x.fillStyle = C.mute; x.textAlign = "right"; x.fillText(`${fmt(v)} s.`, W - M, yy + 34); x.textAlign = "left";
      });
    }
    const icon = await loadImg("icon-192.png");
    if (icon) { x.save(); x.beginPath(); x.roundRect(M, H - 190, 64, 64, 16); x.clip(); x.drawImage(icon, M, H - 190, 64, 64); x.restore(); }
    x.font = `500 36px ${SERIF}`; x.fillStyle = C.ink; x.fillText("Okuma Günlüğü", M + 84, H - 146);
    if (S.settings.name) { x.font = `500 28px ${SANS}`; x.fillStyle = C.mute; x.textAlign = "right"; x.fillText(S.settings.name, W - M, H - 146); x.textAlign = "left"; }
    return cv;
  }
  function openShare(kind, data) {
    let dark = isDark() && isPlus(), cv = null;
    openSheet("Paylaş", (c) => {
      const e = data.k ? entry(data.k) || {} : {};
      const both = kind !== "period" && hasWriting(e) && (e.notes || "").trim();
      c.body.innerHTML = `${both ? `<div class="seg" id="sh-kind" style="align-self:center"><button data-k="day">Günlük</button><button data-k="quote">Alıntı</button></div>` : ""}
        <img class="share-prev" id="sh-img" alt="Paylaşım kartı önizlemesi">
        <div class="btnrow"><button class="btn ghost" id="sh-theme">${ic(dark ? "sun" : "moon")}${dark ? "Açık kart" : "Koyu kart"}</button><button class="btn acc" id="sh-go">${ic("up")}Paylaş</button></div>`;
      const draw = async () => {
        $$("#sh-kind button", c.body).forEach((b) => b.classList.toggle("on", b.dataset.k === kind));
        cv = await drawCard(kind, data, dark);
        $("#sh-img", c.body).src = cv.toDataURL("image/png");
      };
      $$("#sh-kind button", c.body).forEach((b) => b.onclick = () => { kind = b.dataset.k; draw(); });
      $("#sh-theme", c.body).onclick = () => { if (!dark && !needPlus("cards")) return; dark = !dark; $("#sh-theme", c.body).innerHTML = `${ic(dark ? "sun" : "moon")}${dark ? "Açık kart" : "Koyu kart"}`; draw(); };
      $("#sh-go", c.body).onclick = () => cv && cv.toBlob((blob) => {
        const file = new File([blob], "okuma-gunlugu.png", { type: "image/png" });
        if (navigator.canShare && navigator.canShare({ files: [file] })) navigator.share({ files: [file] }).catch(() => {});
        else { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.append(a); a.click(); a.remove(); }
      }, "image/png");
      draw();
    });
  }

  // iki haftada bir yedek hatırlatması (veriler yalnızca telefonda)
  function backupNudge() {
    const st = S.settings, last = Math.max(st.lastBackup || 0, st.backupSnooze || 0, st.since || 0);
    if (Object.keys(S.days).length < 7 || Date.now() - last < 14 * 864e5) return;
    openSheet("Yedek alma zamanı", (c) => {
      c.body.innerHTML = `<p class="muted">Yazdıkların yalnızca bu telefonda duruyor. Telefon kaybolur ya da sıfırlanırsa geri gelmez. İki dakikada yedek al, dosyayı iCloud Drive'a ya da kendine e-postayla gönder.</p>
        <div class="btnrow"><button class="btn ghost" data-n>Sonra</button><button class="btn acc" data-y>${ic("down")}Yedek al</button></div>`;
      $("[data-n]", c.body).onclick = () => { st.backupSnooze = Date.now() - 7 * 864e5; save(); c.close(); };
      $("[data-y]", c.body).onclick = () => { c.close(); exportJSON(); };
    });
  }

  /* ================= yükleyiciler ve depolama ================= */
  const scripts = {};
  const loadScript = (src) => scripts[src] || (scripts[src] = new Promise((ok, no) => {
    const s = document.createElement("script"); s.src = src; s.onload = ok;
    s.onerror = () => { delete scripts[src]; no(new Error("yüklenemedi: " + src)); };
    document.head.append(s);
  }));
  const absUrl = (p) => new URL(p, location.href).href;
  const loadPdf = async () => { await loadScript("lib/pdf.min.js"); window.pdfjsLib.GlobalWorkerOptions.workerSrc = absUrl("lib/pdf.worker.min.js"); return window.pdfjsLib; };
  const loadEpub = async () => { await loadScript("lib/jszip.min.js"); await loadScript("lib/epub.min.js"); return window.ePub; };
  // IndexedDB: dijital kitap dosyaları (localStorage'a sığmaz)
  const idb = (() => {
    let dbp;
    const open = () => dbp || (dbp = new Promise((ok, no) => {
      const r = indexedDB.open("okuma-gunlugu", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("files");
      r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
    }));
    const tx = async (mode, fn) => {
      const db = await open();
      return new Promise((ok, no) => { const t = db.transaction("files", mode), req = fn(t.objectStore("files")); t.oncomplete = () => ok(req && req.result); t.onerror = () => no(t.error); });
    };
    return { get: (k) => tx("readonly", (s) => s.get(k)), set: (k, v) => tx("readwrite", (s) => s.put(v, k)), del: (k) => tx("readwrite", (s) => s.delete(k)) };
  })();
  // resmi küçültüp JPEG veri adresine çevirir (kapaklar için)
  function imageToDataURL(src, maxW, maxH, q = 0.8) {
    return new Promise((ok) => {
      const url = src instanceof Blob ? URL.createObjectURL(src) : src;
      const im = new Image();
      im.onload = () => {
        const s = Math.min(1, maxW / im.naturalWidth, maxH / im.naturalHeight);
        const cv = document.createElement("canvas"); cv.width = Math.round(im.naturalWidth * s); cv.height = Math.round(im.naturalHeight * s);
        cv.getContext("2d").drawImage(im, 0, 0, cv.width, cv.height);
        try { ok(cv.toDataURL("image/jpeg", q)); } catch (e) { ok(""); }
        if (src instanceof Blob) URL.revokeObjectURL(url);
      };
      im.onerror = () => ok("");
      im.src = url;
    });
  }
  const pickFile = (accept, capture) => new Promise((ok) => {
    const inp = document.createElement("input"); inp.type = "file"; inp.accept = accept; if (capture) inp.setAttribute("capture", capture);
    inp.onchange = () => ok(inp.files[0] || null); inp.click();
  });

  /* ================= Plus ================= */
  const PLUS = {
    reader: ["book", "Dijital kitap okuyucu", "EPUB ve PDF kitaplarını uygulamada oku; okuduğun sayfa ve süre kendiliğinden kaydedilsin."],
    ocr: ["camera", "Fotoğraftan alıntı", "Kitap sayfasının fotoğrafını çek, altını çizdiğin cümle yazıya dönüşsün."],
    voice: ["mic", "Sesli not", "Konuşarak günlük ve okuma notu yaz."],
    analytics: ["chart", "Gelişmiş analiz", "Saatte kaç sayfa, en verimli saatin, yazar ve tür dağılımı."],
    story: ["star", "Özet hikâyesi", "Haftanın, ayın ve yılın okuma hikâyesi; paylaşılabilir."],
    import: ["down", "Listeden içe aktarma", "Goodreads ya da düz liste ile tüm kitaplığını tek seferde getir."],
    types: ["palette", "Özel okuma türleri", "Kendi türlerini oluştur, simgelerini seç."],
    goals: ["target", "Özel hedefler", "Kendi meydan okumalarını kur."],
    cards: ["up", "Kart temaları", "Koyu ve özel paylaşım kartı temaları."],
  };
  const isPlus = () => S.settings.plan === "plus";
  const plusB = (k) => (PLUS[k] ? `<span class="plus-b">PLUS</span>` : "");
  function needPlus(k) { if (isPlus()) return true; openPaywall(k); return false; }
  function openPaywall(focus) {
    openSheet("Okuma Günlüğü Plus", (c) => {
      c.body.innerHTML = `<div class="pw-hero"><span class="pw-crown">✦</span><h3>Daha derin okuma, daha güzel hatıralar</h3><p>${focus && PLUS[focus] ? `“${PLUS[focus][1]}” Plus ile açılır.` : "Tüm premium özellikler tek abonelikte."}</p></div>
        <div class="pw-list">${Object.entries(PLUS).map(([k, [i, t, d]]) => `<div class="pw-row ${k === focus ? "on" : ""}">${ic(i)}<span><b>${t}</b><small>${d}</small></span></div>`).join("")}
          <div class="pw-row soon">${ic("user")}<span><b>Yakında: bulut eşitleme, profil ve okuma grupları</b><small>Telefon değişse de verilerin kaybolmaz; arkadaşlarınla birlikte oku.</small></span></div></div>
        <div class="pw-plans"><button class="pw-plan"><b>Aylık</b><span>₺49,99</span></button><button class="pw-plan best"><i>2 ay bedava</i><b>Yıllık</b><span>₺399,99</span></button></div>
        <button class="btn acc wide" id="pw-go">Plus'a geç</button>
        <p class="muted" style="font-size:11.5px;text-align:center">Fiyatlar öneridir. Ödeme altyapısı, bulut hesabıyla birlikte eklenecek.</p>`;
      $("#pw-go", c.body).onclick = () => toast("Ödeme altyapısı yakında eklenecek");
    });
  }

  /* ================= ekle menüsü ================= */
  function openAddMenu() {
    openSheet("Kütüphaneye ekle", (c) => {
      const rows = [
        ["search", "Kitap ara ya da elle ekle", "Ad veya yazarla ara, kapak kendiliğinden gelsin", () => openBookForm(null)],
        ["scan", "Barkod okut", "Kitabın arkasındaki ISBN barkodunu kamerayla tara", () => openScanner((info) => openBookForm(null, null, info))],
        ["file", "Dijital kitap yükle", "EPUB ya da PDF; uygulamada oku", () => pickDigital(), "reader"],
        ["down", "Listeden içe aktar", "Goodreads CSV ya da her satıra bir kitap", () => openImport(), "import"],
        ["text", "Gazete, dergi, köşe yazısı", "Kitap dışındaki okumalar", () => openBookForm(null, null, { type: "gazete" })],
      ];
      c.body.innerHTML = `<div class="set-group">${rows.map(([i, t, d, , p], n) => `<button class="set-row" data-n="${n}"><span class="l">${ic(i)}<span>${t} ${p ? plusB(p) : ""}<small>${d}</small></span></span>${ic("right")}</button>`).join("")}</div>`;
      $$("[data-n]", c.body).forEach((x) => x.onclick = () => { c.close(); setTimeout(rows[+x.dataset.n][3], 200); });
    });
  }

  /* ================= barkod / ISBN ================= */
  async function lookupISBN(raw) {
    const isbn = String(raw).replace(/[^0-9Xx]/g, "");
    let r = null;
    try {
      const j = await (await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}${gkey()}`)).json();
      const v = j.items?.[0]?.volumeInfo;
      if (v) r = { title: v.title || "", author: (v.authors || []).join(", "), total: v.pageCount || "", cover: gCover(v) };
    } catch (e) { /* çevrimdışı */ }
    if (!r || !r.cover || !r.title) {
      try {
        const j = await (await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`)).json();
        const v = j[`ISBN:${isbn}`];
        if (v) r = { title: r?.title || v.title || "", author: r?.author || (v.authors || []).map((a) => a.name).join(", "), total: r?.total || v.number_of_pages || "", cover: r?.cover || v.cover?.medium || v.cover?.large || "" };
      } catch (e) { /* çevrimdışı */ }
    }
    if (r && !r.cover) r.cover = `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg?default=false`;
    return r ? { ...r, isbn, type: "kitap" } : { isbn, type: "kitap" };
  }
  async function openScanner(onFound) {
    let reader = null, done = false;
    const stop = () => { try { reader && reader.reset(); } catch (e) { /* zaten kapalı */ } };
    const c = openSheet("Barkod okut", (c) => {
      c.body.innerHTML = `<div class="scan"><video id="sc-v" playsinline muted autoplay></video><i class="scan-frame"></i><i class="scan-line"></i></div>
        <p class="muted" id="sc-msg" style="text-align:center;font-size:13px">Kamera açılıyor…</p>
        <button class="btn ghost wide" id="sc-photo">${ic("camera")}Barkodun fotoğrafından oku</button>
        <div class="field"><label>ya da ISBN numarasını yaz</label><div class="row-i"><input class="inp" id="sc-isbn" inputmode="numeric" placeholder="978…" autocomplete="off"><button class="btn acc" id="sc-go">Bul</button></div></div>`;
    }, { onClose: stop });
    const msg = (t) => { const m = $("#sc-msg", c.body); if (m) m.textContent = t; };
    const found = async (code) => {
      if (done) return; done = true; stop();
      msg(`Bulundu: ${code} — kitap aranıyor…`);
      const info = await lookupISBN(code);
      c.close(); setTimeout(() => onFound(info), 250);
      if (!info.title) toast("Kitap bilgisi bulunamadı — adını elle yazabilirsin");
    };
    $("#sc-go", c.body).onclick = () => { const v = $("#sc-isbn", c.body).value.replace(/\D/g, ""); if (v.length >= 10) found(v); else toast("ISBN 10 ya da 13 haneli olmalı"); };
    let ZX;
    try { await loadScript("lib/zxing.min.js"); ZX = window.ZXing; } catch (e) { msg("Barkod okuyucu yüklenemedi — ISBN'i yazabilirsin."); return; }
    const hints = new Map();
    hints.set(ZX.DecodeHintType.POSSIBLE_FORMATS, [ZX.BarcodeFormat.EAN_13, ZX.BarcodeFormat.EAN_8, ZX.BarcodeFormat.UPC_A]);
    hints.set(ZX.DecodeHintType.TRY_HARDER, true);
    $("#sc-photo", c.body).onclick = async () => {
      const f = await pickFile("image/*", "environment"); if (!f) return;
      msg("Fotoğraf okunuyor…");
      const url = URL.createObjectURL(f);
      try { const r = await new ZX.BrowserMultiFormatReader(hints).decodeFromImageUrl(url); found(r.getText()); }
      catch (e) { msg("Barkod okunamadı — daha yakından, net bir fotoğraf dene ya da ISBN'i yaz."); }
      finally { URL.revokeObjectURL(url); }
    };
    try {
      reader = new ZX.BrowserMultiFormatReader(hints);
      await reader.decodeFromVideoDevice(undefined, $("#sc-v", c.body), (res) => { if (res) found(res.getText()); });
      msg("Barkodu çerçevenin ortasına getir.");
    } catch (e) { msg("Kamera açılamadı. Fotoğraftan okumayı ya da ISBN yazmayı dene."); }
  }

  /* ================= fotoğraftan alıntı (yazı tanıma) ================= */
  async function ocrWorker(logger) {
    await loadScript("lib/tesseract.min.js");
    return window.Tesseract.createWorker("tur", 1, { workerPath: absUrl("lib/worker.min.js"), corePath: absUrl("lib/tesseract-core-lstm.wasm.js"), langPath: absUrl("lib"), workerBlobURL: false, logger });
  }
  // kapak fotoğrafındaki en büyük yazılardan arama sorgusu çıkarır
  async function coverQuery(file) {
    const worker = await ocrWorker();
    const { data } = await worker.recognize(await imageToDataURL(file, 1400, 1400, 0.9));
    await worker.terminate();
    const clean = (t) => t.replace(/[^\p{L}\p{N}\s'’-]/gu, " ").replace(/\s+/g, " ").trim();
    let lines = (data.lines || []).filter((l) => clean(l.text).length > 2 && l.confidence > 35)
      .sort((a, b) => (b.bbox.y1 - b.bbox.y0) - (a.bbox.y1 - a.bbox.y0)).slice(0, 3).map((l) => clean(l.text));
    if (!lines.length) lines = data.text.split("\n").map(clean).filter((t) => t.length > 2).slice(0, 3);
    return lines.join(" ").slice(0, 80);
  }
  async function openOCR() {
    if (!needPlus("ocr")) return;
    const f = await pickFile("image/*"); if (!f) return;
    const c = openSheet("Fotoğraftan alıntı", (c) => {
      c.body.innerHTML = `<img class="ocr-img" alt="" src="${URL.createObjectURL(f)}"><div class="ocr-prog"><i id="oc-bar"></i></div><p class="muted" id="oc-msg" style="text-align:center;font-size:13px">Yazı tanıma hazırlanıyor… (ilk seferde biraz sürer)</p>`;
    });
    try {
      const img = await imageToDataURL(f, 1800, 1800, 0.92);
      const worker = await ocrWorker((m) => { const b = $("#oc-bar", c.body); if (b && m.status === "recognizing text") { b.style.width = Math.round(m.progress * 100) + "%"; $("#oc-msg", c.body).textContent = "Yazı tanınıyor…"; } });
      const { data } = await worker.recognize(img);
      await worker.terminate();
      // satır sonlarını birleştir, tire ile bölünmüş kelimeleri düzelt
      const text = data.text.replace(/-\n(?=\p{Ll})/gu, "").replace(/([^\n])\n(?!\n)/g, "$1 ").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
      if (!c.body.isConnected) return;
      c.body.innerHTML = `<p class="muted" style="font-size:13px;margin-top:-6px">Gerekiyorsa düzelt ya da sadece istediğin cümleyi bırak.</p>
        <textarea class="inp imp-ta" id="oc-t" style="height:220px">${esc(text)}</textarea>
        <div class="btnrow"><button class="btn ghost" data-n>Vazgeç</button><button class="btn acc" data-y>${ic("check")}Notlara ekle</button></div>`;
      $("[data-n]", c.body).onclick = c.close;
      $("[data-y]", c.body).onclick = () => {
        const t = $("#oc-t", c.body).value.trim(); if (!t) { c.close(); return; }
        const cur = (entry(sel) || {}).notes || "";
        field = "notes";
        const q = /^[“"«]/.test(t) ? t : `“${t}”`;
        const v = (cur.trim() ? cur.trim() + "\n\n" : "") + q;
        saveField(v); c.close(); renderToday(); flashSaved(); toast("Alıntı notlarına eklendi");
      };
    } catch (e) {
      const m = $("#oc-msg", c.body); if (m) m.textContent = "Yazı tanınamadı. Daha net, düz çekilmiş bir fotoğraf dene.";
    }
  }

  /* ================= sesli not ================= */
  let rec = null;
  function toggleVoice() {
    if (!needPlus("voice")) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { toast("Bu cihazda sesle yazma yok — klavyedeki 🎤 tuşunu kullanabilirsin"); return; }
    if (rec) { rec.stop(); return; }
    const ta = $("#t-page"), base = ta.value.replace(/\s*$/, "");
    let fin = "";
    rec = new SR(); rec.lang = "tr-TR"; rec.continuous = true; rec.interimResults = true;
    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) { const r = e.results[i]; if (r.isFinal) fin += r[0].transcript.trim() + " "; else interim += r[0].transcript; }
      ta.value = (base ? base + (base.endsWith("\n") ? "" : " ") : "") + fin + interim;
    };
    rec.onend = () => { rec = null; $("#t-voice").classList.remove("rec"); saveField(ta.value.trim()); updateWords(); flashSaved(); };
    rec.onerror = (e) => { if (e.error === "not-allowed" || e.error === "service-not-allowed") toast("Mikrofon izni verilmedi"); };
    try { rec.start(); $("#t-voice").classList.add("rec"); toast("Dinliyorum… bitirince 🎤'a tekrar dokun"); }
    catch (e) { rec = null; toast("Sesle yazma başlatılamadı"); }
  }

  /* ================= dijital kitaplar ================= */
  async function pdfThumb(pdf) {
    try {
      const pg = await pdf.getPage(1), v = pg.getViewport({ scale: 1 }), sc = 360 / v.height;
      const vp = pg.getViewport({ scale: sc }), cv = document.createElement("canvas"); cv.width = vp.width; cv.height = vp.height;
      await pg.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
      return cv.toDataURL("image/jpeg", 0.8);
    } catch (e) { return ""; }
  }
  async function pickDigital(existing) {
    if (!needPlus("reader")) return;
    const file = await pickFile(".epub,.pdf,application/epub+zip,application/pdf"); if (!file) return;
    const isPdf = /\.pdf$/i.test(file.name) || file.type === "application/pdf";
    toast("Kitap hazırlanıyor…");
    try {
      const buf = await file.arrayBuffer();
      const meta = { title: file.name.replace(/\.(epub|pdf)$/i, "").replace(/[_]+/g, " ").trim(), author: "", total: 0, cover: "" };
      if (isPdf) {
        const lib = await loadPdf(), pdf = await lib.getDocument({ data: buf.slice(0) }).promise;
        meta.total = pdf.numPages;
        const info = await pdf.getMetadata().catch(() => null);
        if (info?.info?.Title && info.info.Title.length > 2) meta.title = info.info.Title;
        if (info?.info?.Author) meta.author = info.info.Author;
        meta.cover = await pdfThumb(pdf);
        pdf.destroy();
      } else {
        const ePub = await loadEpub(), bk = ePub(buf.slice(0));
        await bk.ready;
        const md = await bk.loaded.metadata;
        if (md.title) meta.title = md.title; if (md.creator) meta.author = md.creator;
        try { const cu = await bk.coverUrl(); if (cu) meta.cover = await imageToDataURL(cu, 240, 360); } catch (e) { /* kapaksız */ }
        bk.destroy();
      }
      const b = existing || { id: uid(), type: "kitap", createdAt: keyOf(today()), finishedAt: null, want: false, start: 0 };
      Object.assign(b, { title: b.title || meta.title, author: b.author || meta.author, total: b.total || meta.total, cover: b.cover || meta.cover, digital: isPdf ? "pdf" : "epub", format: "ekitap", fileSize: file.size, coverTried: !!(b.cover || meta.cover) });
      await idb.set(b.id, buf);
      if (!existing) S.books.unshift(b);
      S.activeBook = b.id; save(); renderAll();
      toast("Dijital kitap kütüphanene eklendi");
      openReader(b);
    } catch (e) { toast("Bu dosya açılamadı — EPUB ya da PDF olmalı"); }
  }
  const RTHEMES = { paper: ["#fbf5e6", "#2b241c"], sepia: ["#efe0c2", "#3b2a17"], night: ["#14110e", "#d8cdbd"] };
  async function openReader(b) {
    if (!needPlus("reader")) return;
    let buf = null;
    try { buf = await idb.get(b.id); } catch (e) { /* depolama yok */ }
    if (!buf) { confirmSheet("Dosya bu cihazda yok", "Bu dijital kitabın dosyası bu telefonda bulunamadı. Dosyayı yeniden seçebilirsin.", "Dosya seç", () => pickDigital(b)); return; }
    const st = S.settings;
    let theme = st.readerTheme || "paper", fs = st.readerFont || 100;
    const ov = document.createElement("div"); ov.className = "reader";
    ov.innerHTML = `<header class="rd-top"><button class="iconbtn" data-x aria-label="Kapat">${ic("x")}</button><div class="rd-t"><b>${esc(b.title)}</b><small id="rd-pos">Açılıyor…</small></div><button class="iconbtn" data-aa aria-label="Görünüm">Aa</button></header>
      <div class="rd-view" id="rd-view"></div><button class="rd-zone l" aria-label="Önceki sayfa"></button><button class="rd-zone r" aria-label="Sonraki sayfa"></button>
      <footer class="rd-bot"><input type="range" id="rd-range" min="0" max="1000" value="0" aria-label="Kitapta konum"><small id="rd-pct"></small></footer>`;
    document.body.append(ov);
    const paint = () => { const [bgc, fg] = RTHEMES[theme]; ov.style.setProperty("--rbg", bgc); ov.style.setProperty("--rfg", fg); };
    paint();
    ov.animate([{ opacity: 0, transform: "scale(.97)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: "cubic-bezier(.2,.8,.2,1)" });
    const view = $("#rd-view", ov), t0 = Date.now();
    let total = b.total || 0, cur = 0, startPage = null, nav = () => {}, jump = () => {}, restyle = () => {}, cleanup = () => {};
    const update = () => {
      $("#rd-pos", ov).textContent = total ? `Sayfa ${Math.max(1, cur)} / ${total}` : "Sayfa hesaplanıyor…";
      const f = total ? clamp(cur / total, 0, 1) : 0;
      $("#rd-range", ov).value = Math.round(f * 1000); $("#rd-pct", ov).textContent = total ? `%${Math.round(f * 100)}` : "";
    };
    try {
      if (b.digital === "pdf") {
        const lib = await loadPdf(), pdf = await lib.getDocument({ data: buf.slice(0) }).promise;
        total = pdf.numPages; let page = clamp(b.pos || 1, 1, total);
        let rendering = null;
        const render = async () => {
          const my = page; rendering = my;
          const pg = await pdf.getPage(my); if (rendering !== my) return;
          const vw = view.clientWidth, vh = view.clientHeight, v1 = pg.getViewport({ scale: 1 });
          const sc = Math.min(vw / v1.width, vh / v1.height), dpr = Math.min(devicePixelRatio || 1, 2), vp = pg.getViewport({ scale: sc * dpr });
          const cv = document.createElement("canvas"); cv.width = vp.width; cv.height = vp.height; cv.style.width = vp.width / dpr + "px"; cv.style.height = vp.height / dpr + "px";
          await pg.render({ canvasContext: cv.getContext("2d"), viewport: vp }).promise;
          if (rendering !== my) return;
          view.replaceChildren(cv); cur = page; b.pos = page; update();
        };
        nav = (d) => { const np = clamp(page + d, 1, total); if (np !== page) { page = np; render(); } };
        jump = (f) => { page = clamp(Math.round(f * (total - 1)) + 1, 1, total); render(); };
        startPage = page; cur = page; await render();
        cleanup = () => pdf.destroy();
      } else {
        const ePub = await loadEpub(), bk = ePub(buf.slice(0));
        await bk.ready;
        const rend = bk.renderTo(view, { width: "100%", height: "100%", spread: "none", flow: "paginated", allowScriptedContent: false });
        restyle = () => { const [bgc, fg] = RTHEMES[theme]; rend.themes.override("color", fg); rend.themes.override("background", bgc); rend.themes.fontSize(fs + "%"); };
        rend.themes.default({ body: { "font-family": "Georgia, 'Times New Roman', serif", "line-height": "1.62", "padding": "0 6px" }, p: { "text-align": "justify", "hyphens": "auto" } });
        restyle();
        const locs = await idb.get(b.id + ":loc").catch(() => null);
        const pctOf = (cfi) => (bk.locations.length() ? bk.locations.percentageFromCfi(cfi) : null);
        const setFromLoc = (loc) => {
          if (!loc?.start) return; b.pos = loc.start.cfi;
          const p = pctOf(loc.start.cfi);
          if (p != null && total) { cur = Math.max(1, Math.round(p * total)); if (startPage == null) startPage = cur; }
          update();
        };
        const useLocs = () => { total = b.total || bk.locations.length(); if (!b.total) { b.total = total; save(); } setFromLoc(rend.currentLocation()); };
        await rend.display(b.pos || undefined);
        let closed = false, genP = null;
        if (locs) { bk.locations.load(locs); useLocs(); }
        else genP = bk.locations.generate(1100).then(() => { idb.set(b.id + ":loc", bk.locations.save()).catch(() => {}); if (!closed) useLocs(); }).catch(() => {});
        rend.on("relocated", setFromLoc);
        nav = (d) => (d > 0 ? rend.next() : rend.prev());
        jump = (f) => { if (bk.locations.length()) rend.display(bk.locations.cfiFromPercentage(f)); };
        // sayfa hesabı sürüyorsa kitabı o bitince kapat
        cleanup = () => { closed = true; rend.destroy(); (genP || Promise.resolve()).then(() => bk.destroy()); };
      }
    } catch (e) { $("#rd-pos", ov).textContent = "Kitap açılamadı"; }
    update();
    $(".rd-zone.l", ov).onclick = () => nav(-1); $(".rd-zone.r", ov).onclick = () => nav(1);
    $("#rd-range", ov).onchange = (e) => jump(e.target.value / 1000);
    const key = (e) => { if (e.key === "ArrowRight") nav(1); else if (e.key === "ArrowLeft") nav(-1); else if (e.key === "Escape") close(); };
    document.addEventListener("keydown", key);
    let x0 = null;
    ov.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    ov.addEventListener("touchend", (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 50) nav(dx < 0 ? 1 : -1); });
    $("[data-aa]", ov).onclick = () => {
      openSheet("Okuma görünümü", (c) => {
        c.body.innerHTML = `<div class="field"><label>Zemin</label><div class="seg" id="rv-th">${[["paper", "Kâğıt"], ["sepia", "Sepya"], ["night", "Gece"]].map(([k, l]) => `<button data-t="${k}" class="${k === theme ? "on" : ""}">${l}</button>`).join("")}</div></div>
          ${b.digital === "epub" ? `<div class="set-row" style="padding:4px 0"><span>Yazı boyutu</span><span class="mini-step"><button class="stepbtn" data-f="-10">${ic("minus")}</button><b class="num" id="rv-fs">${fs}%</b><button class="stepbtn" data-f="10">${ic("plus")}</button></span></div>` : ""}`;
        $$("#rv-th button", c.body).forEach((x) => x.onclick = () => { theme = x.dataset.t; st.readerTheme = theme; save(); paint(); restyle(); $$("#rv-th button", c.body).forEach((y) => y.classList.toggle("on", y === x)); });
        $$("[data-f]", c.body).forEach((x) => x.onclick = () => { fs = clamp(fs + +x.dataset.f, 70, 180); st.readerFont = fs; save(); restyle(); $("#rv-fs", c.body).textContent = fs + "%"; });
      });
    };
    const close = () => {
      document.removeEventListener("keydown", key);
      const k = keyOf(today()), min = Math.round((Date.now() - t0) / 60000);
      const delta = startPage != null ? Math.max(0, cur - startPage) : 0;
      const before = bookProgress(b).done;
      if (delta > 0) setRead(k, b.id, readOn(entry(k), b.id) + delta);
      if (min >= 1) { addMinutes(k, b.id, min); (S.sessions = S.sessions || []).push({ k, id: b.id, start: t0, min }); }
      b.want = false; S.activeBook = b.id; save();
      try { cleanup(); } catch (e) { /* zaten kapalı */ }
      ov.animate([{ opacity: 1 }, { opacity: 0, transform: "scale(.98)" }], { duration: 220, fill: "both" }).finished.then(() => ov.remove());
      renderAll();
      if (delta || min) toast(`${delta ? delta + " sayfa" : ""}${delta && min ? " · " : ""}${min ? fmtMin(min) : ""} kaydedildi`);
      if (b.total && !b.finishedAt && bookProgress(b).done >= b.total && before < b.total) finishBook(b, k);
    };
    $("[data-x]", ov).onclick = close;
  }

  /* ================= hedefler ve rozetler ================= */
  const GKIND = { pages: ["sayfa", "Sayfa"], books: ["kitap", "Kitap bitir"], minutes: ["dk", "Okuma süresi"], wrote: ["gün", "Günlük yaz"], streak: ["gün", "Seri"] };
  const GPER = { week: "Bu hafta", month: "Bu ay", year: "Bu yıl", d30: "30 gün" };
  const PRESETS = [["pages", 1000, "month", "Bu ay 1000 sayfa"], ["books", 4, "month", "Bu ay 4 kitap bitir"], ["streak", 30, "d30", "30 gün aralıksız"], ["minutes", 300, "week", "Bu hafta 5 saat oku"], ["wrote", 7, "week", "Bu hafta her gün yaz"], ["books", S.settings.bookGoal || 12, "year", "Yıllık kitap hedefi"]];
  function goalRange(per) {
    const t = today();
    if (per === "week") { const s = weekStart(t); return [s, addDays(s, 6)]; }
    if (per === "month") return [new Date(t.getFullYear(), t.getMonth(), 1), new Date(t.getFullYear(), t.getMonth() + 1, 0)];
    if (per === "year") return [new Date(t.getFullYear(), 0, 1), new Date(t.getFullYear(), 11, 31)];
    return [t, addDays(t, 29)];
  }
  function goalValue(g) {
    const s = statsFor(parse(g.from), parse(g.to));
    return { pages: s.pages, books: s.finished, minutes: s.min, wrote: s.wrote, streak: s.longest }[g.kind] || 0;
  }
  function badges() {
    const all = Object.values(S.days), pages = all.reduce((a, e) => a + (e.pages || 0), 0);
    const fin = S.books.filter((b) => isBook(b) && b.finishedAt).length;
    const first = Object.keys(S.days).sort()[0];
    const best = first ? longest(parse(first), today()) : 0;
    const ses = S.sessions || [], hr = (s) => new Date(s.start).getHours();
    const wordsAll = all.reduce((a, e) => a + words(e.text) + words(e.notes), 0);
    return [
      ["✍️", "İlk sayfa", "İlk günlüğünü yaz", all.some(hasWriting)], ["🔥", "Bir hafta", "7 gün seri", best >= 7], ["🌙", "Bir ay", "30 gün seri", best >= 30],
      ["🏛️", "Yüz gün", "100 gün seri", best >= 100], ["📖", "Bin sayfa", "1.000 sayfa oku", pages >= 1000], ["📚", "On bin sayfa", "10.000 sayfa oku", pages >= 10000],
      ["🎉", "İlk kitap", "Bir kitabı bitir", fin >= 1], ["🏅", "On kitap", "10 kitap bitir", fin >= 10], ["👑", "Elli kitap", "50 kitap bitir", fin >= 50],
      ["🦉", "Gece kuşu", "23:00'ten sonra ⏱ ile oku", ses.some((s) => hr(s) >= 23 || hr(s) < 4)], ["🌅", "Erken kuş", "Sabah 7'den önce ⏱ ile oku", ses.some((s) => hr(s) >= 4 && hr(s) < 7)],
      ["💬", "Alıntı avcısı", "20 okuma notu", all.filter((e) => (e.notes || "").trim()).length >= 20], ["🖋️", "Kalem ustası", "10.000 kelime yaz", wordsAll >= 10000],
      ["⭐", "Eleştirmen", "5 kitabı puanla", S.books.filter((b) => b.rating).length >= 5], ["📱", "Dijital okur", "Bir e-kitap oku", S.books.some((b) => b.digital && bookRead(b.id) > 0)],
    ];
  }
  function openGoals() {
    openSheet("Hedefler ve rozetler", (c) => {
      const st = streak(), first = Object.keys(S.days).sort()[0], best = first ? longest(parse(first), today()) : 0;
      S.goals = (S.goals || []).filter((g) => g.to >= keyOf(addDays(today(), -14)));
      const gl = S.goals.map((g) => {
        const v = goalValue(g), pct = clamp(v / g.target, 0, 1), left = daysBetween(today(), parse(g.to));
        return `<div class="goal ${pct >= 1 ? "won" : ""}"><div class="g-h"><b>${esc(g.title)}</b><button class="g-x" data-del="${g.id}" aria-label="Sil">${ic("x")}</button></div>
          <div class="bar"><i style="width:${pct * 100}%"></i></div><div class="g-f"><span><b>${fmt(v)}</b> / ${fmt(g.target)} ${GKIND[g.kind][0]}</span><span>${pct >= 1 ? "Tamamlandı 🎉" : left >= 0 ? `${left} gün kaldı` : "Süre doldu"}</span></div></div>`;
      }).join("");
      const bd = badges(), won = bd.filter((x) => x[3]).length;
      c.body.innerHTML = `<div class="streak-hero"><span class="flame">${ic("flame")}</span><div><b class="num">${st}</b><span>gün seri</span></div><small>En uzun: ${best} gün</small></div>
        <div class="sec-t">Hedeflerin</div>${gl || `<p class="muted" style="font-size:13px">Henüz hedef yok. Aşağıdan birini seç.</p>`}
        <div class="typechips wrap">${PRESETS.filter((p) => !S.goals.some((g) => g.title === p[3])).map((p, i) => `<button class="tchip" data-p="${i}">+ ${p[3]}</button>`).join("")}<button class="tchip" data-custom>+ Özel hedef ${plusB("goals")}</button></div>
        <div class="sec-t">Rozetler · ${won} / ${bd.length}</div>
        <div class="badges">${bd.map(([e, t, d, ok]) => `<div class="badge ${ok ? "ok" : ""}" title="${esc(d)}"><span>${e}</span><b>${t}</b><small>${d}</small></div>`).join("")}</div>`;
      const add = (kind, target, per, title) => { const [f, t] = goalRange(per); S.goals.push({ id: uid(), kind, target, per, title, from: keyOf(f), to: keyOf(t) }); save(); c.rebuild(); };
      $$("[data-p]", c.body).forEach((x) => x.onclick = () => { const p = PRESETS.filter((p) => !S.goals.some((g) => g.title === p[3]))[+x.dataset.p]; add(...p); });
      $$("[data-del]", c.body).forEach((x) => x.onclick = () => { S.goals = S.goals.filter((g) => g.id !== x.dataset.del); save(); c.rebuild(); });
      $("[data-custom]", c.body).onclick = () => {
        if (!needPlus("goals")) return;
        let kind = "pages", per = "month";
        openSheet("Özel hedef", (c2) => {
          c2.body.innerHTML = `<div class="field"><label>Ne?</label><div class="typechips wrap">${Object.entries(GKIND).map(([k, v]) => `<button class="tchip ${k === kind ? "on" : ""}" data-k="${k}">${v[1]}</button>`).join("")}</div></div>
            <div class="field"><label>Ne zaman?</label><div class="typechips wrap">${Object.entries(GPER).map(([k, v]) => `<button class="tchip ${k === per ? "on" : ""}" data-pe="${k}">${v}</button>`).join("")}</div></div>
            <div class="field"><label>Hedef</label><input class="inp" id="g-t" type="number" inputmode="numeric" min="1" value="500"></div>
            <button class="btn acc wide" id="g-s">${ic("check")}Hedefi kur</button>`;
          $$("[data-k]", c2.body).forEach((x) => x.onclick = () => { kind = x.dataset.k; $$("[data-k]", c2.body).forEach((y) => y.classList.toggle("on", y === x)); });
          $$("[data-pe]", c2.body).forEach((x) => x.onclick = () => { per = x.dataset.pe; $$("[data-pe]", c2.body).forEach((y) => y.classList.toggle("on", y === x)); });
          $("#g-s", c2.body).onclick = () => { const t = Math.max(1, parseInt($("#g-t", c2.body).value) || 1); c2.close(); add(kind, t, per, `${GPER[per]} ${fmt(t)} ${GKIND[kind][0]}${kind === "books" ? "" : ""}`); };
        });
      };
    });
  }

  /* ================= özet hikâyesi ================= */
  function openStory(title, from, to, s) {
    if (!needPlus("story")) return;
    const name = S.settings.name;
    const fin = S.books.filter((b) => b.finishedAt && b.finishedAt >= keyOf(from) && b.finishedAt <= keyOf(to));
    const top = Object.entries(s.books).map(([id, v]) => [book(id), v]).filter((r) => r[0]).sort((a, b) => b[1] - a[1]);
    const ks = Object.keys(S.days).filter((k) => k >= keyOf(from) && k <= keyOf(to));
    const quote = ks.map((k) => S.days[k].notes || "").filter((n) => n.trim().length > 20).sort((a, b) => b.length - a.length)[0];
    const mt = s.moods.reduce((a, b) => a + b, 0), mavg = mt ? Math.round(s.moods.reduce((a, n, i) => a + n * i, 0) / mt) : 0;
    const tags = Object.entries(s.tags).sort((a, b) => b[1] - a[1]).slice(0, 6);
    // en iyi ay / gün
    let bestLbl = "", bestV = 0;
    if (daysBetween(from, to) > 40) for (let m = 0; m < 12; m++) { let p = 0; for (const k of ks) if (parse(k).getMonth() === m) p += S.days[k].pages || 0; if (p > bestV) { bestV = p; bestLbl = AYLAR[m]; } }
    else for (const k of ks) if ((S.days[k].pages || 0) > bestV) { bestV = S.days[k].pages; bestLbl = `${parse(k).getDate()} ${AYLAR[parse(k).getMonth()]}`; }
    const slides = [
      `<div class="st-k">${esc(title)}</div><h2>Okuma<br><em>hikâyen</em></h2><p>${name ? esc(name) + ", " : ""}birlikte geriye bakalım.</p>`,
      s.pages ? `<div class="st-k">Okuduğun sayfa</div><b class="st-big" data-n="${s.pages}">0</b><p>${s.pages >= 250 ? `≈ ${Math.max(1, Math.round(s.pages / 250))} kitap kalınlığında` : "Her sayfa bir adım."}${s.min ? `<br>${fmtMin(s.min)} okudun` : ""}</p>` : "",
      fin.length ? `<div class="st-k">Bitirdiğin kitaplar</div><b class="st-mid">${fin.length}</b><div class="st-covers">${fin.slice(0, 9).map((b) => coverHTML(b, "stc")).join("")}</div>` : top.length ? `<div class="st-k">Okuduğun kitaplar</div><b class="st-mid">${top.length}</b><div class="st-covers">${top.slice(0, 9).map(([b]) => coverHTML(b, "stc")).join("")}</div>` : "",
      top.length ? `<div class="st-k">En çok vakit geçirdiğin</div><div class="st-one">${coverHTML(top[0][0], "stc big")}</div><h3>${esc(top[0][0].title)}</h3><p>${fmt(top[0][1])} sayfa</p>` : "",
      bestV ? `<div class="st-k">En verimli ${daysBetween(from, to) > 40 ? "ayın" : "günün"}</div><h2>${esc(bestLbl)}</h2><p>${fmt(bestV)} sayfa</p>` : "",
      s.wrote || s.longest ? `<div class="st-k">Yazdığın günler</div><b class="st-mid">${s.wrote} gün</b><p>En uzun serin ${s.longest} gün · ${fmt(s.words)} kelime</p>` : "",
      quote ? `<div class="st-k">Altını çizdiğin</div><blockquote>${esc(quote.trim().slice(0, 280))}${quote.trim().length > 280 ? "…" : ""}</blockquote>` : "",
      mt ? `<div class="st-k">Ruh hâlin</div><div class="st-face" style="color:${moodColor(mavg)}">${face(mavg)}</div><h3>Çoğunlukla ${MOODS[mavg].toLocaleLowerCase("tr-TR")}</h3>${tags.length ? `<div class="st-tags">${tags.map(([t]) => `<span>${esc(t)}</span>`).join("")}</div>` : ""}` : "",
      `<div class="st-k">${esc(title)}</div><h2>Okumaya<br><em>devam</em></h2><p>Bu özeti bir kartla paylaşabilirsin.</p><button class="btn acc" data-share>${ic("up")}Paylaşım kartı</button>`,
    ].filter(Boolean);
    const ov = document.createElement("div"); ov.className = "story";
    ov.innerHTML = `<div class="st-bars">${slides.map(() => "<i><b></b></i>").join("")}</div><button class="st-x" aria-label="Kapat">${ic("x")}</button>${slides.map((h, i) => `<section class="sl" style="--hue:${(i * 23) % 60}">${h}</section>`).join("")}`;
    document.body.append(ov);
    ov.animate([{ opacity: 0, transform: "scale(1.04)" }, { opacity: 1, transform: "none" }], { duration: 380, easing: "cubic-bezier(.2,.8,.2,1)" });
    let i = -1, tm;
    const DUR = 5200;
    const show = (n) => {
      if (n >= slides.length) return close(); if (n < 0) n = 0;
      i = n; clearTimeout(tm);
      $$(".sl", ov).forEach((s, j) => s.classList.toggle("on", j === i));
      $$(".st-bars i", ov).forEach((b, j) => { b.className = j < i ? "done" : j === i ? "run" : ""; });
      const big = $(".sl.on [data-n]", ov); if (big) countUp(big, +big.dataset.n, 1400);
      tm = setTimeout(() => show(i + 1), DUR);
    };
    const close = () => { clearTimeout(tm); ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: "both" }).finished.then(() => ov.remove()); };
    ov.addEventListener("click", (e) => {
      if (e.target.closest(".st-x")) return close();
      if (e.target.closest("[data-share]")) { close(); return openShare("period", { title, from, to, s }); }
      show(e.clientX < innerWidth / 3 ? i - 1 : i + 1);
    });
    ov.style.setProperty("--dur", DUR + "ms");
    show(0);
  }
  function countUp(el, to, dur = 700) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !to) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = (t) => { const p = Math.min(1, (t - t0) / dur), v = to * (1 - Math.pow(1 - p, 3)); el.textContent = fmt(v); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  /* ================= gelişmiş analiz ================= */
  function analyticsHTML(from, to, s) {
    const fk = keyOf(from), tk = keyOf(to);
    const ks = Object.keys(S.days).filter((k) => k >= fk && k <= tk);
    let pm = 0, mm = 0;
    for (const k of ks) for (const r of reads(S.days[k])) if (r.min && r.pages) { pm += r.pages; mm += r.min; }
    const ses = (S.sessions || []).filter((x) => x.k >= fk && x.k <= tk);
    const byHour = Array(24).fill(0); ses.forEach((x) => { byHour[new Date(x.start).getHours()] += x.min; });
    const bh = byHour.indexOf(Math.max(...byHour));
    const byDow = Array(7).fill(0); ks.forEach((k) => { byDow[dow(parse(k))] += S.days[k].pages || 0; });
    const bd = byDow.indexOf(Math.max(...byDow));
    const auth = {}; Object.entries(s.books).forEach(([id, v]) => { const a = (book(id)?.author || "").split(",")[0].trim(); if (a) auth[a] = (auth[a] || 0) + v; });
    const topA = Object.entries(auth).sort((a, b) => b[1] - a[1]).slice(0, 3);
    const fin = S.books.filter((b) => finDate(b) && b.finishedAt >= fk && b.finishedAt <= tk);
    const dur = fin.map((b) => { const d = readDaysOf(b.id); return d.length ? daysBetween(parse(d[0]), finDate(b)) + 1 : 0; }).filter(Boolean);
    const avgLen = fin.filter((b) => b.total).reduce((a, b, _, arr) => a + b.total / arr.length, 0);
    const mx = Math.max(1, ...byHour);
    const row = (l, v, sub = "") => `<div class="an-row"><span>${l}${sub ? `<small>${sub}</small>` : ""}</span><b>${v}</b></div>`;
    return `<div class="ilist an">
      ${row("Okuma hızı", mm ? `${fmt(pm / mm * 60)} s/saat` : "–", mm ? `${fmtMin(mm)} ölçülen okuma` : "⏱ ile süre tut")}
      ${row("En verimli saatin", ses.length ? `${pad(bh)}:00–${pad((bh + 1) % 24)}:00` : "–", ses.length ? `${ses.length} okuma oturumu` : "")}
      ${ses.length ? `<div class="hours">${byHour.map((v, h) => `<i style="--v:${v / mx}" title="${h}:00"></i>`).join("")}</div><div class="hours-l"><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></div>` : ""}
      ${row("En çok okuduğun gün", s.pages ? GUNLER[bd] : "–")}
      ${row("Oturum ortalaması", ses.length ? fmtMin(ses.reduce((a, x) => a + x.min, 0) / ses.length) : "–")}
      ${row("Kitap bitirme süresi", dur.length ? `${fmt(dur.reduce((a, b) => a + b, 0) / dur.length)} gün` : "–", fin.length ? `${fin.length} kitap bitti` : "")}
      ${row("Ortalama kitap", avgLen ? `${fmt(avgLen)} sayfa` : "–")}
      ${topA.length ? `<div class="an-row col"><span>En çok okuduğun yazarlar</span><div class="tsum">${topA.map(([a, v]) => `<span class="tag"><span>${esc(a)} · ${fmt(v)} s.</span></span>`).join("")}</div></div>` : ""}
    </div>`;
  }

  /* ================= akşam hatırlatması (takvim) ================= */
  function reminderICS(hhmm) {
    const [h, m] = hhmm.split(":").map(Number), t = addDays(today(), 0);
    const dt = `${t.getFullYear()}${pad(t.getMonth() + 1)}${pad(t.getDate())}T${pad(h)}${pad(m)}00`;
    const now = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Okuma Gunlugu//TR", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
      `UID:okuma-gunlugu-hatirlatma-${hhmm.replace(":", "")}@felixdemario.github.io`, `DTSTAMP:${now}`, `DTSTART:${dt}`, "DURATION:PT10M", "RRULE:FREQ=DAILY",
      "SUMMARY:📖 Okuma Günlüğü — bugünü yaz", "DESCRIPTION:Bugün ne okudun? Birkaç satır yaz\\, sayfanı gir.", `URL:${location.href.split("#")[0]}`,
      "BEGIN:VALARM", "TRIGGER:PT0M", "ACTION:DISPLAY", "DESCRIPTION:Bugünü yaz", "END:VALARM", "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  }
  function openReminder() {
    openSheet("Akşam hatırlatması", (c) => {
      const st = S.settings;
      c.body.innerHTML = `<p class="muted" style="font-size:13.5px;margin-top:-6px">Telefonunun takvimine her gün tekrarlanan bir hatırlatma eklenir; saati gelince bildirim gelir. Takvimden istediğin zaman silebilirsin.</p>
        <div class="field"><label>Saat</label><input class="inp" id="rm-t" type="time" value="${st.remind || "21:30"}"></div>
        <a class="btn acc wide" id="rm-go" href="#">${ic("cal")}Takvime ekle</a>
        <p class="muted" style="font-size:12px;line-height:1.55">Olmazsa: iPhone'da <b>Kestirmeler → Otomasyon → Saat</b> ile her akşam bu uygulamayı açan bir otomasyon da kurabilirsin.</p>`;
      const a = $("#rm-go", c.body);
      const upd = () => { st.remind = $("#rm-t", c.body).value || "21:30"; save(); a.href = "data:text/calendar;charset=utf-8," + encodeURIComponent(reminderICS(st.remind)); a.setAttribute("download", "okuma-gunlugu-hatirlatma.ics"); };
      $("#rm-t", c.body).onchange = upd; upd();
      a.onclick = () => setTimeout(() => toast("Takvim dosyası açıldı — “Ekle”ye dokun"), 300);
    });
  }

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
    pinPad("Okuma Günlüğü", "Şifreni gir", (p) => {
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
      <div><h1>Okuma <em>Günlüğü</em></h1><p class="lead" style="margin:10px auto 0">Her gün bir sayfa yaz, okuduğunu kaydet, kendini zamanla yeniden oku.</p></div>
      <div class="ob-form">
        <div class="field"><label>Adın</label><input class="inp" id="ob-name" maxlength="30" placeholder="İsteğe bağlı" autocomplete="given-name"></div>
        <div class="field"><label>Günde kaç sayfa okumak istersin?</label><div class="goals">${[10, 20, 30].map((g) => `<button data-g="${g}" class="${g === goal ? "on" : ""}">${g}</button>`).join("")}<input class="inp goal-inp" id="ob-goal" type="number" inputmode="numeric" min="1" max="999" placeholder="Diğer" aria-label="Kendi sayfa hedefin"></div></div>
        <button class="btn acc wide" id="ob-go" style="height:52px;margin-top:6px">Başla</button>
      </div>`;
    const gi = $("#ob-goal", ov);
    $$(".goals button", ov).forEach((b) => b.onclick = () => { goal = +b.dataset.g; gi.value = ""; gi.classList.remove("on"); $$(".goals button", ov).forEach((x) => x.classList.toggle("on", x === b)); });
    gi.oninput = () => {
      const v = parseInt(gi.value);
      const ok = v > 0;
      gi.classList.toggle("on", ok);
      $$(".goals button", ov).forEach((x) => x.classList.toggle("on", !ok && +x.dataset.g === goal));
      if (ok) goal = clamp(v, 1, 999);
    };
    $("#ob-go", ov).onclick = () => {
      S.settings.name = $("#ob-name", ov).value.trim(); S.settings.goal = goal; S.settings.onboarded = true; save();
      ov.hidden = true; renderAll();
      setTimeout(() => toast("Hoş geldin. İlk sayfan seni bekliyor ✍️"), 300);
    };
  }

  /* ================= görünür alan (klavye) ================= */
  const isTyping = () => { const a = document.activeElement; return !!a && (a.tagName === "TEXTAREA" || (a.tagName === "INPUT" && !/^(file|range|checkbox|radio|button|time)$/.test(a.type))); };
  function fitViewport() {
    // Klavye açıkken uygulama ve alt pencereler görünür alana (klavyenin üstüne) sığdırılır
    const vv = window.visualViewport, root = document.documentElement, typing = isTyping();
    const h = vv ? vv.height : innerHeight, top = vv ? Math.max(0, vv.offsetTop) : 0;
    const kb = Math.max(0, innerHeight - h - top);
    if (vv && (kb > 80 || (typing && innerHeight - h > 80))) {
      root.style.setProperty("--appH", h + "px"); root.style.setProperty("--appT", top + "px"); root.style.setProperty("--kb", kb + "px");
    } else { root.style.removeProperty("--appH"); root.style.removeProperty("--appT"); root.style.setProperty("--kb", "0px"); }
    if (!typing && vv && vv.offsetTop) window.scrollTo(0, 0);
    if (typing) keepVisible(document.activeElement);
  }
  // yazılan alanı kendi kaydırma kutusunda görünür yere getirir
  function keepVisible(el) {
    const sc = el && el.closest(".sh-body, .bp-panel, .list");
    if (!sc) return;
    const vv = window.visualViewport, vb = vv ? vv.offsetTop + vv.height : innerHeight;
    const r = el.getBoundingClientRect(), b = sc.getBoundingClientRect();
    const bottom = Math.min(b.bottom, vb) - 14, topEdge = b.top + 10;
    if (r.bottom > bottom) sc.scrollTop += r.bottom - bottom;
    else if (r.top < topEdge) sc.scrollTop -= topEdge - r.top;
  }
  document.addEventListener("focusin", () => { fitViewport(); setTimeout(fitViewport, 120); setTimeout(fitViewport, 380); });
  document.addEventListener("focusout", () => setTimeout(fitViewport, 120));
  window.visualViewport?.addEventListener("resize", fitViewport);
  window.visualViewport?.addEventListener("scroll", fitViewport);
  addEventListener("resize", fitViewport);
  document.addEventListener("scroll", () => { if (!isTyping()) window.scrollTo(0, 0); });

  /* ================= başlat ================= */
  applyTheme();
  fitViewport();
  renderAll();
  if (!S.settings.onboarded) onboarding();
  else { lockIfNeeded(); setTimeout(() => { if ($("#lock").hidden && !sheetStack.length) backupNudge(); }, 1500); }
  addEventListener("focus", () => { if (!sheetStack.length && document.activeElement?.tagName !== "TEXTAREA") renderAll(); });

  window.GUNLUGUM = { get state() { return S; }, set state(v) { S = migrate(v); save(); renderAll(); }, go, render: renderAll };
})();
