// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: calendar-check;

// Haftalık Rutin — Scriptable betiği
// • Ana ekrandaki widget: bu haftanın tablosu (büyük), bugünün durumu (orta / küçük)
// • Widget'a dokununca ya da betiği çalıştırınca: Rutin uygulaması (index.html ile aynı arayüz)
// Bu dosya build_scriptable.py ile üretilir; arayüzü değiştirmek için index.html'i düzenle.
// Veriler iCloud Drive > Scriptable > rutin.json dosyasında tutulur.

const SCRIPT_VERSION = 7;
const FILE_NAME = "rutin.json";
const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const DAYS_SHORT = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];
const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const COLORS = { c1: "#6fbf94", c2: "#e89a5e", c3: "#7ea0e6", c4: "#e07aa8", c5: "#cdbb55", c6: "#a495e8", c7: "#5cc8c8", c8: "#ef6b5f", c9: "#8b8cf0", c10: "#a8d14a", c11: "#c99a6e", c12: "#a3b1bc", c13: "#5cb8ea" };
const COLORS_LIGHT = { c1: "#2f6b4f", c2: "#c4682b", c3: "#3b5fa8", c4: "#a83b6e", c5: "#8a7a1e", c6: "#5b4aa0", c7: "#1f7a7a", c8: "#b8322a", c9: "#3f3fa8", c10: "#5f7f12", c11: "#7a5230", c12: "#4d5b66", c13: "#1b6f9e" };
const DOTS = { c1: "🟢", c2: "🟠", c3: "🔵", c4: "🔴", c5: "🟡", c6: "🟣", c7: "🔷", c8: "🟥", c9: "🟦", c10: "🟩", c11: "🟤", c12: "⚫️", c13: "💠" };
const COLOR_NAMES = { c1: "Yeşil", c2: "Turuncu", c3: "Mavi", c4: "Pembe", c5: "Sarı", c6: "Mor", c7: "Turkuaz", c8: "Kırmızı", c9: "Lacivert", c10: "Fıstık yeşili", c11: "Kahverengi", c12: "Gri", c13: "Gök mavisi" };
const GOLD = new Color("#e8c06a");
const WHITE = Color.white();
const MUTED = new Color("#ffffff", 0.55);

/* ---------- veri ---------- */
const fm = (() => { try { return FileManager.iCloud(); } catch (e) { return FileManager.local(); } })();
const path = fm.joinPath(fm.documentsDirectory(), FILE_NAME);

const uid = () => Math.random().toString(36).slice(2, 9);
function defaultState() {
  return {
    v: 5,
    habits: [
      { id: uid(), name: "2 L su iç", color: "c3", goal: 7 },
      { id: uid(), name: "Spor", color: "c2", goal: 7, days: [1, 3, 4, 6] },
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
    // Sonradan istenen ayar değişiklikleri (gün sırası: 0=Pzt … 6=Paz)
    if (!(st.v >= 5)) {
      for (const h of st.habits) {
        if (/spor/i.test(h.name)) { h.days = [1, 3, 4, 6]; h.goal = 7; }
        if (/yürüyüş|yuruyus/i.test(h.name)) { h.goal = 7; delete h.days; }
      }
      st.v = 5; changed = true;
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
const goalOf = h => h.days ? 7 : (h.goal || 7);
const wd = d => (d.getDay() + 6) % 7;
const dateOf = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
const planned = (h, k) => !h.days || h.days.includes(wd(dateOf(k)));
const daysLabel = h => h.days.map(i => DAYS[i]).join(" · ");
const isOn = (hid, k) => (state.checks[k] || []).includes(hid);
function weekCount(hid, mon) { let n = 0; for (let i = 0; i < 7; i++) if (isOn(hid, keyOf(addDays(mon, i)))) n++; return n; }
function streak(h) {
  let d = new Date(), n = 0, guard = 0;
  if (!isOn(h.id, keyOf(d))) d = addDays(d, -1);
  while (guard++ < 800) {
    const k = keyOf(d);
    if (isOn(h.id, k)) n++;
    else if (planned(h, k)) break;
    d = addDays(d, -1);
  }
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
  const s = streak(h);
  const lead = h.days ? daysLabel(h) : "";
  const tail = s ? `${s} gün seri` : (h.days ? "" : "Her gün");
  return [lead, tail].filter(Boolean).join(" · ");
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
      if (k <= today && planned(h, k)) { possible++; if (isOn(h.id, k)) done++; }
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
  } else if (!planned(h, k)) {
    b.backgroundColor = new Color("#ffffff", 0.02);
    b.borderColor = new Color("#ffffff", 0.12); b.borderWidth = 1;
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
      if (k > today || (!planned(h, k) && !isOn(h.id, k))) {
        const f = r.addText(k > today ? "·" : "–"); f.widthWeight = 10; f.centerAligned(); f.titleColor = Color.gray();
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
  const init = `<script>window.__SCRIPT_VERSION__=${SCRIPT_VERSION};window.__INIT__=${JSON.stringify(state).replace(/</g, "\\u003c")};</script>`;
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
// Yeni sürüm varsa dosyayı değiştirir; true dönerse betik yeni sürümle yeniden başlatılmalı.
async function selfUpdate(timeout = 5) {
  try {
    const req = new Request(SOURCE_URL + "?t=" + Date.now());
    req.timeoutInterval = timeout;
    const code = await req.loadString();
    if (!code.includes("Haftalık Rutin — Scriptable betiği")) return false;
    const m = code.match(/const SCRIPT_VERSION = (\d+);/);
    if (!m || Number(m[1]) <= SCRIPT_VERSION) return false;
    const me = module.filename;
    fm.writeString(me, code);
    return fm.readString(me) === code;
  } catch (e) {
    return false;
  }
}
// Aynı dakikada art arda yeniden başlatmayı önle
function mayRelaunch() {
  const lf = FileManager.local(), p = lf.joinPath(lf.temporaryDirectory(), "rutin-relaunch.txt");
  const last = lf.fileExists(p) ? Number(lf.readString(p)) : 0;
  if (Date.now() - last < 60000) return false;
  lf.writeString(p, String(Date.now()));
  return true;
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

/* ---------- bildirimler ---------- */
// Her rutin adına göre eşleşir. times: sabit saatler ("SS:DD"); random: o gün içinde rastgele N saat.
// Rutin o gün işaretlendiyse kalan bildirimleri gelmez (skipIfDone). Diyet öğün hatırlatmaları her zaman gelir.
const NOTIFY = [
  { match: /\bsu\b/i, skipIfDone: true, times: ["09:00", "12:00", "15:00", "18:00", "21:00"],
    title: "💧 Su vakti", body: () => "Bir bardak su iç. Günlük hedef: 2 litre." },
  { match: /spor/i, skipIfDone: true, skipIfWeekGoal: true, times: ["10:00", "18:00"],
    title: "🏋️ Spor", body: (h, day) => h.days
      ? `Bugün spor günü! Bu hafta ${weekCount(h.id, mondayOf(day))}/${h.days.length}.`
      : `Bugün spor yapmaya ne dersin? Bu hafta ${weekCount(h.id, mondayOf(day))}/${goalOf(h)}.` },
  { match: /diyet/i, skipIfDone: false, times: ["08:30", "13:00", "19:30"],
    title: ["🍳 Kahvaltı", "🥗 Öğle yemeği", "🍽️ Akşam yemeği"],
    body: () => ["Güne diyetine uygun bir kahvaltıyla başla.", "Öğle yemeğini diyetine uygun seç.", "Akşam yemeğinde porsiyona dikkat."] },
  { match: /kitap/i, skipIfDone: true, random: { count: 2, from: "10:00", to: "22:00" },
    title: "📖 Kitap oku", body: () => "Birkaç sayfa okumak için güzel bir an." },
  { match: /klip/i, skipIfDone: true, random: { count: 2, from: "10:00", to: "22:00" },
    title: "🎬 Klip paylaş", body: () => "Bugünün klibini paylaştın mı?" },
  { match: /yürüyüş|yuruyus/i, skipIfDone: true, times: ["08:00", "20:00"],
    title: ["🚶 Sabah yürüyüşü", "🚶 Akşam yürüyüşü"],
    body: () => ["Günaydın! Güne kısa bir yürüyüşle başla.", "Bugün yürüdün mü? Akşam havası tam yürüyüşlük."] },
  { match: /uyku/i, skipIfDone: true, times: ["23:00"],
    title: "🌙 Uyku vakti", body: () => "Ekranı bırak, düzenli uyku için yatma vakti." },
];
const NOTIFY_DAYS = 3; // bugün + 2 gün ileriye kurulur (iOS en fazla 64 bekleyen bildirime izin verir)

const toMin = t => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
function seeded(str) { // aynı gün + rutin için hep aynı "rastgele" saatler
  let h = 2166136261;
  for (const c of str) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619); }
  return () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 100000) / 100000; };
}
function randomTimes(seedKey, { count, from, to }) {
  const rnd = seeded(seedKey), a = toMin(from), b = toMin(to);
  const gap = Math.floor((b - a) / count);
  // aralığı eşit dilimlere böl, her dilimden bir saat seç: aynı saate denk gelmez
  return [...Array(count)].map((_, i) => a + i * gap + Math.floor(rnd() * Math.max(gap - 30, 1)));
}
async function scheduleNotifications() {
  if (typeof Notification === "undefined") return;
  const now = new Date();
  const wanted = [];
  for (let d = 0; d < NOTIFY_DAYS; d++) {
    const day = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), d);
    const k = keyOf(day);
    for (const h of state.habits) {
      const rule = NOTIFY.find(r => r.match.test(h.name));
      if (!rule) continue;
      if (!planned(h, k)) continue;
      if (rule.skipIfDone && isOn(h.id, k)) continue;
      if (rule.skipIfWeekGoal && weekCount(h.id, mondayOf(day)) >= goalOf(h)) continue;
      const mins = rule.times ? rule.times.map(toMin) : randomTimes(k + h.id, rule.random);
      const bodies = rule.body(h, day);
      mins.forEach((m, i) => {
        const at = new Date(day); at.setHours(Math.floor(m / 60), m % 60, 0, 0);
        if (at <= now) return;
        wanted.push({
          id: `rutin-${k}-${h.id}-${i}`, at,
          title: Array.isArray(rule.title) ? rule.title[i] : rule.title,
          body: Array.isArray(bodies) ? bodies[i] : bodies,
        });
      });
    }
  }
  let pendingIds = new Set();
  try {
    pendingIds = new Set((await Notification.allPending()).map(n => n.identifier));
    const keep = new Set(wanted.map(w => w.id));
    const stale = [...pendingIds].filter(id => id && id.startsWith("rutin-") && !keep.has(id));
    if (stale.length) await Notification.removePending(stale);
  } catch (e) {}
  // Haftalık özet: Pazar 21:30 (içerik değişince bildirim yenilenir)
  const mon = mondayOf(now), sum = new Date(addDays(mon, 6)); sum.setHours(21, 30, 0, 0);
  if (sum > now) {
    const a = weekStats(mon), b = weekStats(addDays(mon, -7)), diff = a.pct - b.pct;
    let best = null, bp = -1;
    for (const h of state.habits) {
      let poss = 0, done = 0;
      for (let i = 0; i < 7; i++) { const k = keyOf(addDays(mon, i)); if (!planned(h, k)) continue; poss++; if (isOn(h.id, k)) done++; }
      const g = goalOf(h) < 7 ? goalOf(h) : poss, p = g ? Math.min(1, done / g) : 0;
      if (p > bp) { bp = p; best = h; }
    }
    const body = `Bu hafta %${a.pct}` + (b.possible ? ` · geçen haftaya göre ${diff >= 0 ? "+" : "−"}${Math.abs(diff)} puan` : "") +
      (best && bp > 0 ? `. En iyi giden: ${best.name}.` : ".");
    wanted.push({ id: `rutin-ozet-${keyOf(mon)}-${a.done}-${a.possible}`, at: sum, title: "📊 Haftalık özet", body });
  }
  try {
    const stale2 = [...pendingIds].filter(id => id && id.startsWith("rutin-ozet-") && !wanted.some(w => w.id === id));
    if (stale2.length) await Notification.removePending(stale2);
  } catch (e) {}
  for (const w of wanted.filter(x => !pendingIds.has(x.id))) {
    try {
      const n = new Notification();
      n.identifier = w.id;
      n.threadIdentifier = "rutin";
      n.title = w.title;
      n.body = w.body;
      n.sound = "default";
      n.openURL = URLScheme.forRunningScript();
      n.setTriggerDate(w.at);
      await n.schedule();
    } catch (e) {}
  }
}
/* ---------- otomatik yedek: iCloud Drive > Scriptable > Rutin Yedekleri (son 30 gün) ---------- */
function dailyBackup() {
  try {
    const dir = fm.joinPath(fm.documentsDirectory(), "Rutin Yedekleri");
    if (!fm.fileExists(dir)) fm.createDirectory(dir, true);
    const file = fm.joinPath(dir, `rutin-${keyOf(new Date())}.json`);
    fm.writeString(file, JSON.stringify(state));
    const old = fm.listContents(dir).filter(f => /^rutin-\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
    old.slice(0, Math.max(0, old.length - 30)).forEach(f => fm.remove(fm.joinPath(dir, f)));
  } catch (e) {}
}
function reloadState() {
  try { const fresh = JSON.parse(fm.readString(path)); state.habits = fresh.habits; state.checks = fresh.checks; } catch (e) {}
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
} else if (await selfUpdate(4) && mayRelaunch()) {
  // Yeni sürüm indirildi: hemen yeni sürümle aç
  Safari.open(URLScheme.forRunningScript());
} else {
  try {
    await presentApp();
  } catch (e) {
    render();
    await table.present(false);
  }
  reloadState();
}
// Her çalışmada (widget yenilemesi, uygulama, kestirme) bildirimleri ve yedeği güncelle
try { await scheduleNotifications(); } catch (e) {}
dailyBackup();
Script.complete();
