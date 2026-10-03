// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: calendar-check;

// Haftalık Rutin — Scriptable betiği
// • Ana ekrandaki widget: bu haftanın tablosu (büyük), bugünün durumu (orta / küçük)
// • Widget'a dokununca ya da betiği çalıştırınca: Rutin uygulaması (index.html ile aynı arayüz)
// Bu dosya build_scriptable.py ile üretilir; arayüzü değiştirmek için index.html'i düzenle.
// Veriler iCloud Drive > Scriptable > rutin.json dosyasında tutulur.

const FILE_NAME = "rutin.json";
const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const DAYS_SHORT = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];
const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const COLORS = { c1: "#6fbf94", c2: "#e89a5e", c3: "#7ea0e6", c4: "#e07aa8", c5: "#cdbb55", c6: "#a495e8", c7: "#5cc8c8" };
const COLORS_LIGHT = { c1: "#2f6b4f", c2: "#c4682b", c3: "#3b5fa8", c4: "#a83b6e", c5: "#8a7a1e", c6: "#5b4aa0", c7: "#1f7a7a" };
const DOTS = { c1: "🟢", c2: "🟠", c3: "🔵", c4: "🔴", c5: "🟡", c6: "🟣", c7: "🔷" };
const COLOR_NAMES = { c1: "Yeşil", c2: "Turuncu", c3: "Mavi", c4: "Pembe", c5: "Sarı", c6: "Mor", c7: "Turkuaz" };
const GOLD = new Color("#e8c06a");
const WHITE = Color.white();
const MUTED = new Color("#ffffff", 0.55);

/* ---------- veri ---------- */
const fm = (() => { try { return FileManager.iCloud(); } catch (e) { return FileManager.local(); } })();
const path = fm.joinPath(fm.documentsDirectory(), FILE_NAME);

const uid = () => Math.random().toString(36).slice(2, 9);
function defaultState() {
  return {
    v: 4,
    habits: [
      { id: uid(), name: "2 L su iç", color: "c3", goal: 7 },
      { id: uid(), name: "Spor", color: "c2", goal: 4 },
      { id: uid(), name: "Uyku düzeni", color: "c6", goal: 7 },
      { id: uid(), name: "Günlük yürüyüş", color: "c1", goal: 7 },
      { id: uid(), name: "Diyet", color: "c4", goal: 7 },
      { id: uid(), name: "Kitap oku", color: "c5", goal: 7 },
      { id: uid(), name: "Klip paylaş", color: "c7", goal: 7 },
    ],
    checks: {},
  };
}
async function load() {
  if (!fm.fileExists(path)) return defaultState();
  try {
    if (fm.isFileStoredIniCloud(path) && !fm.isFileDownloaded(path)) await fm.downloadFileFromiCloud(path);
    const st = JSON.parse(fm.readString(path));
    // Sonradan istenen rutinler: her sürümde bir kez eklenir (aynı adda biri yoksa)
    const ADDED = [
      { v: 3, name: "Kitap oku", match: /kitap/i, color: "c5", goal: 7 },
      { v: 4, name: "Klip paylaş", match: /klip/i, color: "c7", goal: 7 },
    ];
    let changed = false;
    for (const a of ADDED) {
      if (st.v >= a.v) continue;
      if (!st.habits.some(h => a.match.test(h.name))) st.habits.push({ id: uid(), name: a.name, color: a.color, goal: a.goal });
      st.v = a.v; changed = true;
    }
    if (changed) { st.updated = Date.now(); fm.writeString(path, JSON.stringify(st)); }
    return st;
  } catch (e) {
    return defaultState();
  }
}
function save() { state.updated = Date.now(); fm.writeString(path, JSON.stringify(state)); }

/* ---------- tarih ---------- */
const pad = n => String(n).padStart(2, "0");
const keyOf = d => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const mondayOf = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
function isoWeek(mon) {
  const th = addDays(mon, 3), y = new Date(th.getFullYear(), 0, 4);
  return 1 + Math.round((th - mondayOf(y)) / 864e5 / 7);
}
function weekTitle(mon) {
  const end = addDays(mon, 6);
  return mon.getMonth() === end.getMonth()
    ? `${mon.getDate()}–${end.getDate()} ${MONTHS[end.getMonth()]}`
    : `${mon.getDate()} ${MONTHS[mon.getMonth()].slice(0, 3)} – ${end.getDate()} ${MONTHS[end.getMonth()].slice(0, 3)}`;
}

/* ---------- hesaplar ---------- */
const goalOf = h => h.goal || 7;
const isOn = (hid, k) => (state.checks[k] || []).includes(hid);
function weekCount(hid, mon) { let n = 0; for (let i = 0; i < 7; i++) if (isOn(hid, keyOf(addDays(mon, i)))) n++; return n; }
function streak(hid) {
  let d = new Date(), n = 0;
  if (!isOn(hid, keyOf(d))) d = addDays(d, -1);
  while (isOn(hid, keyOf(d))) { n++; d = addDays(d, -1); }
  return n;
}
function weekStreak(h) {
  let w = mondayOf(new Date()), n = 0;
  if (weekCount(h.id, w) < goalOf(h)) w = addDays(w, -7);
  while (weekCount(h.id, w) >= goalOf(h)) { n++; w = addDays(w, -7); }
  return n;
}
function subtitle(h, mon) {
  const goal = goalOf(h);
  if (goal < 7) {
    const cnt = weekCount(h.id, mon), ws = weekStreak(h);
    return `${cnt >= goal ? "Hedef tamam" : "Haftada " + goal + " gün"} · ${cnt}/${goal}${ws > 1 ? ` · ${ws} hafta seri` : ""}`;
  }
  const s = streak(h.id);
  return s ? `${s} gün seri` : "Her gün";
}
function weekStats(mon) {
  const today = keyOf(new Date());
  let done = 0, possible = 0;
  for (const h of state.habits) {
    const goal = goalOf(h);
    if (goal < 7) {
      if (mon <= new Date()) { possible += goal; done += Math.min(weekCount(h.id, mon), goal); }
      continue;
    }
    for (let i = 0; i < 7; i++) {
      const k = keyOf(addDays(mon, i));
      if (k <= today) { possible++; if (isOn(h.id, k)) done++; }
    }
  }
  return { done, possible, pct: possible ? Math.round(done / possible * 100) : 0 };
}
function toggle(hid, k) {
  const arr = state.checks[k] || [];
  state.checks[k] = arr.includes(hid) ? arr.filter(x => x !== hid) : [...arr, hid];
  if (!state.checks[k].length) delete state.checks[k];
  save();
}

/* ---------- widget ---------- */
function background(w) {
  const g = new LinearGradient();
  g.colors = [new Color("#245e44"), new Color("#0c241a")];
  g.locations = [0, 1];
  g.startPoint = new Point(0, 0);
  g.endPoint = new Point(1, 1);
  w.backgroundGradient = g;
}
function text(stack, str, font, color, opts = {}) {
  const t = stack.addText(str);
  t.font = font; t.textColor = color;
  t.lineLimit = opts.lines || 1;
  t.minimumScaleFactor = opts.scale || 0.75;
  if (opts.center) t.centerAlignText();
  return t;
}
function box(stack, size, h, k, today) {
  const b = stack.addStack();
  b.size = new Size(size, size);
  b.cornerRadius = size * 0.3;
  b.centerAlignContent();
  if (isOn(h.id, k)) {
    b.backgroundColor = new Color(COLORS[h.color] || COLORS.c1);
    const img = b.addImage(SFSymbol.named("checkmark").image);
    img.imageSize = new Size(size * 0.5, size * 0.5);
    img.tintColor = new Color("#0c241a");
  } else if (k === today) {
    b.backgroundColor = new Color("#ffffff", 0.08);
    b.borderColor = GOLD; b.borderWidth = 2;
  } else {
    b.backgroundColor = new Color("#ffffff", k > today ? 0.04 : 0.1);
  }
}
function header(w, mon, stats, big) {
  const top = w.addStack();
  top.centerAlignContent();
  const left = top.addStack();
  left.layoutVertically();
  text(left, `RUTİN · ${isoWeek(mon)}. HAFTA`, Font.semiboldSystemFont(10), GOLD);
  text(left, weekTitle(mon), Font.boldRoundedSystemFont(big ? 20 : 16), WHITE);
  top.addSpacer();
  const right = top.addStack();
  right.layoutVertically();
  text(right, `%${stats.pct}`, Font.heavyRoundedSystemFont(big ? 28 : 22), GOLD);
  text(right, `${stats.done}/${stats.possible}`, Font.mediumSystemFont(10), MUTED);
}
function largeWidget() {
  const w = new ListWidget();
  background(w);
  w.setPadding(16, 16, 14, 16);
  const mon = mondayOf(new Date()), today = keyOf(new Date()), stats = weekStats(mon);
  header(w, mon, stats, true);
  const compact = state.habits.length > 6;
  w.addSpacer(compact ? 8 : 12);

  const SIZE = compact ? 20 : 22, GAP = 5;
  const dh = w.addStack();
  dh.addSpacer();
  for (let i = 0; i < 7; i++) {
    const k = keyOf(addDays(mon, i));
    const c = dh.addStack(); c.size = new Size(SIZE, 14);
    text(c, DAYS_SHORT[i], Font.semiboldSystemFont(9), k === today ? GOLD : MUTED, { center: true });
    if (i < 6) dh.addSpacer(GAP);
  }
  w.addSpacer(6);

  const shown = state.habits.slice(0, 7);
  shown.forEach((h, idx) => {
    const row = w.addStack();
    row.centerAlignContent();
    const name = row.addStack();
    name.layoutVertically();
    text(name, h.name, Font.semiboldSystemFont(13), WHITE);
    text(name, subtitle(h, mon), Font.mediumSystemFont(9), goalOf(h) < 7 && weekCount(h.id, mon) >= goalOf(h) ? new Color(COLORS[h.color] || COLORS.c1) : MUTED);
    row.addSpacer(8);
    for (let i = 0; i < 7; i++) {
      box(row, SIZE, h, keyOf(addDays(mon, i)), today);
      if (i < 6) row.addSpacer(GAP);
    }
    if (idx < shown.length - 1) w.addSpacer(compact ? 3 : 7);
  });
  if (state.habits.length > shown.length) {
    w.addSpacer(4);
    text(w, `+${state.habits.length - shown.length} rutin daha`, Font.mediumSystemFont(10), MUTED);
  }
  w.addSpacer();
  if (!compact) text(w, "İşaretlemek için dokun", Font.mediumSystemFont(10), MUTED);
  return w;
}
function mediumWidget() {
  const w = new ListWidget();
  background(w);
  w.setPadding(14, 16, 14, 16);
  const mon = mondayOf(new Date()), today = keyOf(new Date());
  header(w, mon, weekStats(mon), false);
  w.addSpacer();
  const row = w.addStack();
  const shown = state.habits.slice(0, 7);
  const many = shown.length > 6;
  shown.forEach((h, i) => {
    const col = row.addStack();
    col.layoutVertically();
    col.size = new Size(many ? 40 : 46, 0);
    const c = col.addStack(); c.addSpacer(); box(c, many ? 26 : 30, h, today, today); c.addSpacer();
    col.addSpacer(4);
    text(col, h.name, Font.mediumSystemFont(9), WHITE, { center: true, lines: 2, scale: 0.7 });
    if (i < shown.length - 1) row.addSpacer();
  });
  w.addSpacer();
  return w;
}
function smallWidget() {
  const w = new ListWidget();
  background(w);
  w.setPadding(14, 14, 14, 14);
  const today = keyOf(new Date());
  const doneToday = state.habits.filter(h => isOn(h.id, today)).length;
  text(w, "BUGÜN", Font.semiboldSystemFont(10), GOLD);
  text(w, `${doneToday}/${state.habits.length}`, Font.heavyRoundedSystemFont(34), WHITE);
  w.addSpacer();
  const row = w.addStack();
  state.habits.slice(0, 7).forEach((h, i, a) => { box(row, a.length > 6 ? 14 : 16, h, today, today); if (i < a.length - 1) row.addSpacer(a.length > 6 ? 3 : 4); });
  w.addSpacer(6);
  text(w, `Hafta %${weekStats(mondayOf(new Date())).pct}`, Font.mediumSystemFont(10), MUTED);
  return w;
}
function buildWidget() {
  const fam = config.widgetFamily || "large";
  const w = fam === "small" ? smallWidget() : fam === "medium" ? mediumWidget() : largeWidget();
  w.url = URLScheme.forRunningScript();
  w.refreshAfterDate = new Date(Date.now() + 10 * 60 * 1000);
  return w;
}

/* ---------- işaretleme ekranı ---------- */
let viewMon = mondayOf(new Date());
const table = new UITable();
table.showSeparators = true;

function render() {
  table.removeAllRows();
  const today = keyOf(new Date());
  const stats = weekStats(viewMon);

  const nav = new UITableRow();
  nav.height = 64;
  const prev = nav.addButton("‹"); prev.widthWeight = 12; prev.onTap = () => { viewMon = addDays(viewMon, -7); render(); };
  const title = nav.addText(weekTitle(viewMon), `${isoWeek(viewMon)}. hafta · ${stats.done}/${stats.possible} · %${stats.pct}`);
  title.widthWeight = 76; title.centerAligned();
  title.titleFont = Font.boldRoundedSystemFont(20); title.subtitleFont = Font.mediumSystemFont(12);
  const next = nav.addButton("›"); next.widthWeight = 12; next.onTap = () => { viewMon = addDays(viewMon, 7); render(); };
  table.addRow(nav);

  if (keyOf(viewMon) !== keyOf(mondayOf(new Date()))) {
    const back = new UITableRow();
    const b = back.addButton("Bu haftaya dön"); b.centerAligned();
    b.onTap = () => { viewMon = mondayOf(new Date()); render(); };
    table.addRow(back);
  }

  const dh = new UITableRow();
  dh.isHeader = true;
  dh.height = 40;
  const sp = dh.addText(""); sp.widthWeight = 30;
  for (let i = 0; i < 7; i++) {
    const d = addDays(viewMon, i);
    const c = dh.addText(DAYS[i], String(d.getDate()));
    c.widthWeight = 10; c.centerAligned();
    c.titleFont = Font.semiboldSystemFont(11); c.subtitleFont = Font.boldSystemFont(13);
    if (keyOf(d) === today) { c.titleColor = Color.orange(); c.subtitleColor = Color.orange(); }
  }
  table.addRow(dh);

  for (const h of state.habits) {
    const r = new UITableRow();
    r.height = 62;
    const n = r.addText(h.name, subtitle(h, viewMon));
    n.widthWeight = 30;
    n.titleFont = Font.semiboldSystemFont(14); n.subtitleFont = Font.systemFont(10);
    n.titleColor = Color.dynamic(new Color(COLORS_LIGHT[h.color] || COLORS_LIGHT.c1), new Color(COLORS[h.color] || COLORS.c1));
    for (let i = 0; i < 7; i++) {
      const k = keyOf(addDays(viewMon, i));
      if (k > today) {
        const f = r.addText("·"); f.widthWeight = 10; f.centerAligned(); f.titleColor = Color.gray();
        continue;
      }
      const b = r.addButton(isOn(h.id, k) ? (DOTS[h.color] || "🟢") : "⚪️");
      b.widthWeight = 10; b.centerAligned();
      b.onTap = () => { toggle(h.id, k); render(); };
    }
    r.onSelect = () => editHabit(h);
    r.dismissOnSelect = false;
    table.addRow(r);
  }

  const add = new UITableRow();
  add.height = 56;
  const a = add.addButton("+ Rutin ekle"); a.centerAligned();
  a.onTap = () => addHabit();
  table.addRow(add);

  const hint = new UITableRow();
  const t = hint.addText("Düzenlemek için rutinin adına dokun."); t.centerAligned();
  t.titleFont = Font.systemFont(12); t.titleColor = Color.gray();
  table.addRow(hint);

  table.reload();
}

async function askGoal(current) {
  const a = new Alert();
  a.title = "Hedef";
  const opts = [7, 6, 5, 4, 3, 2, 1];
  opts.forEach(n => a.addAction((n === 7 ? "Her gün" : `Haftada ${n} gün`) + (n === current ? "  ✓" : "")));
  a.addCancelAction("Vazgeç");
  const i = await a.presentSheet();
  return i < 0 ? current : opts[i];
}
async function askColor(current) {
  const a = new Alert();
  a.title = "Renk";
  const keys = Object.keys(COLORS);
  keys.forEach(k => a.addAction(`${DOTS[k]}  ${COLOR_NAMES[k]}` + (k === current ? "  ✓" : "")));
  a.addCancelAction("Vazgeç");
  const i = await a.presentSheet();
  return i < 0 ? current : keys[i];
}
async function addHabit() {
  const a = new Alert();
  a.title = "Yeni rutin";
  a.addTextField("Örn. Kitap oku", "");
  a.addAction("Devam");
  a.addCancelAction("Vazgeç");
  if (await a.presentAlert() < 0) return;
  const name = a.textFieldValue(0).trim();
  if (!name) return;
  const goal = await askGoal(7);
  const keys = Object.keys(COLORS);
  state.habits.push({ id: uid(), name, color: keys[state.habits.length % keys.length], goal });
  save(); render();
}
async function editHabit(h) {
  const a = new Alert();
  a.title = h.name;
  a.message = subtitle(h, mondayOf(new Date()));
  const actions = ["Adını değiştir", "Hedefi değiştir", "Rengini değiştir", "Yukarı taşı", "Aşağı taşı"];
  actions.forEach(x => a.addAction(x));
  a.addDestructiveAction("Sil");
  a.addCancelAction("Vazgeç");
  const i = await a.presentSheet();
  const idx = state.habits.indexOf(h);
  if (i === 0) {
    const r = new Alert(); r.title = "Yeni ad"; r.addTextField("Ad", h.name); r.addAction("Kaydet"); r.addCancelAction("Vazgeç");
    if (await r.presentAlert() === 0 && r.textFieldValue(0).trim()) h.name = r.textFieldValue(0).trim();
  } else if (i === 1) {
    h.goal = await askGoal(goalOf(h));
  } else if (i === 2) {
    h.color = await askColor(h.color);
  } else if (i === 3 && idx > 0) {
    [state.habits[idx - 1], state.habits[idx]] = [state.habits[idx], state.habits[idx - 1]];
  } else if (i === 4 && idx < state.habits.length - 1) {
    [state.habits[idx + 1], state.habits[idx]] = [state.habits[idx], state.habits[idx + 1]];
  } else if (i === 5) {
    const c = new Alert(); c.title = `“${h.name}” silinsin mi?`; c.message = "Bu rutinin bütün işaretleri de silinir.";
    c.addDestructiveAction("Sil"); c.addCancelAction("Vazgeç");
    if (await c.presentAlert() !== 0) return;
    state.habits = state.habits.filter(x => x.id !== h.id);
    for (const k in state.checks) { state.checks[k] = state.checks[k].filter(x => x !== h.id); if (!state.checks[k].length) delete state.checks[k]; }
  } else {
    return;
  }
  save(); render();
}

/* ---------- uygulama (web arayüzü) ---------- */
const sleep = ms => new Promise(r => Timer.schedule(ms, false, r));
function storeFromApp(json) {
  if (!json || json === lastSaved) return;
  try { JSON.parse(json); } catch (e) { return; }
  fm.writeString(path, json);
  lastSaved = json;
}
let lastSaved = null;
async function presentApp() {
  const wv = new WebView();
  const init = `<script>window.__INIT__=${JSON.stringify(state).replace(/</g, "\\u003c")};</script>`;
  await wv.loadHTML(init + APP_HTML, "https://felixdemario.github.io/felixdemario/rutin/");
  lastSaved = JSON.stringify(state);
  let open = true;
  const shown = wv.present(true).then(() => { open = false; });
  // Uygulamadaki değişiklikleri saniyede bir iCloud dosyasına yaz
  (async () => {
    while (open) {
      await sleep(1000);
      if (!open) break;
      try { storeFromApp(await wv.evaluateJavaScript("JSON.stringify(state)")); } catch (e) {}
    }
  })();
  await shown;
  try { storeFromApp(await wv.evaluateJavaScript("JSON.stringify(state)")); } catch (e) {}
}

/* ---------- güncelleme: GitHub'daki son sürümü bir sonraki açılış için indir ---------- */
const SOURCE_URL = "https://raw.githubusercontent.com/felixdemario/felixdemario/claude/iphone-video-download-shortcut-5y6vy1/rutin/Rutin.js";
async function selfUpdate() {
  try {
    const req = new Request(SOURCE_URL);
    req.timeoutInterval = 6;
    const code = await req.loadString();
    if (!code.includes("Haftalık Rutin — Scriptable betiği")) return;
    const me = module.filename;
    if (fm.readString(me) !== code) fm.writeString(me, code);
  } catch (e) {}
}

/* ---------- Kestirmeler: uygulamayı açmadan bugünü işaretle ---------- */
// Parametre "liste" → bugünün durumuyla rutin listesi döner (Listeden Seç için)
// Parametre listedeki bir satır → o rutini bugün için işaretler / işareti kaldırır
function shortcutLine(h, mon, today) {
  const goal = goalOf(h);
  return `${isOn(h.id, today) ? "✅" : "⬜️"} ${h.name}${goal < 7 ? ` · ${weekCount(h.id, mon)}/${goal}` : ""}`;
}
function runShortcut(param) {
  const mon = mondayOf(new Date()), today = keyOf(new Date());
  const p = String(param || "").trim();
  if (!p || p.toLowerCase() === "liste") {
    Script.setShortcutOutput(state.habits.map(h => shortcutLine(h, mon, today)));
    return;
  }
  const h = state.habits.find(x => p === shortcutLine(x, mon, today)) ||
            state.habits.find(x => p.replace(/^(✅|⬜️|⬜)\s*/, "").split(" · ")[0] === x.name) ||
            state.habits.find(x => p.includes(x.name));
  if (!h) { Script.setShortcutOutput(`“${p}” adında rutin bulunamadı.`); return; }
  toggle(h.id, today);
  const on = isOn(h.id, today), goal = goalOf(h);
  const done = state.habits.filter(x => isOn(x.id, today)).length;
  let msg = on ? `${h.name} ✓ işaretlendi` : `${h.name} işareti kaldırıldı`;
  msg += goal < 7 ? ` · bu hafta ${weekCount(h.id, mon)}/${goal}` : ` · bugün ${done}/${state.habits.length}`;
  Script.setShortcutOutput(msg);
}

/* ---------- başlat ---------- */
const state = await load();
if (!fm.fileExists(path)) save();

if (config.runsInWidget) {
  Script.setWidget(buildWidget());
} else if (args.shortcutParameter !== undefined && args.shortcutParameter !== null && !config.runsInApp) {
  runShortcut(args.shortcutParameter);
} else if (!config.runsInApp) {
  runShortcut("liste");
} else {
  try {
    await presentApp();
  } catch (e) {
    render();
    await table.present(false);
  }
  await selfUpdate();
}
Script.complete();
