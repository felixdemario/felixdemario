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

const APP_HTML = "<!doctype html>\n<html lang=\"tr\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\">\n<title>Haftalık Rutin</title>\n<meta name=\"apple-mobile-web-app-capable\" content=\"yes\">\n<meta name=\"mobile-web-app-capable\" content=\"yes\">\n<meta name=\"apple-mobile-web-app-title\" content=\"Rutin\">\n<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black-translucent\">\n<meta name=\"theme-color\" content=\"#eef1ec\" media=\"(prefers-color-scheme: light)\">\n<meta name=\"theme-color\" content=\"#141a17\" media=\"(prefers-color-scheme: dark)\">\n<link rel=\"apple-touch-icon\" href=\"apple-touch-icon.png\">\n<link rel=\"icon\" type=\"image/png\" href=\"icon-192.png\">\n<link rel=\"manifest\" href=\"manifest.webmanifest\">\n\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Figtree:wght@400;500;600&display=swap\">\n<style>\n:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px)}\nhtml,body{margin:0;min-height:100%}\nimg{max-width:100%}\nbody{overscroll-behavior-y:none;touch-action:manipulation;-webkit-user-select:none;user-select:none}\ninput{-webkit-user-select:text;user-select:text}\n/* Layout: tek ekran telefon uygulaması — üstte hafta başlığı, ortada alışkanlık × gün ızgarası, altta ekle butonu */\n:root{\n  --bg:#eef1ec; --surface:#ffffff; --ink:#1d2621; --muted:#68746d; --line:#d8ded8;\n  --accent:#2f6b4f; --accent-ink:#ffffff; --today:#e3ece5; --danger:#b4432f;\n  --display:\"Bricolage Grotesque\",ui-sans-serif,system-ui,sans-serif;\n  --body:\"Figtree\",ui-sans-serif,system-ui,-apple-system,\"Segoe UI\",sans-serif;\n  --c1:#2f6b4f; --c2:#c4682b; --c3:#3b5fa8; --c4:#a83b6e; --c5:#8a7a1e; --c6:#5b4aa0; --c7:#1f7a7a; --c8:#b8322a; --c9:#3f3fa8; --c10:#5f7f12; --c11:#7a5230; --c12:#4d5b66; --c13:#1b6f9e;\n}\n@media (prefers-color-scheme: dark){:root:not([data-theme=\"light\"]){\n  --bg:#141a17; --surface:#1d2521; --ink:#e7ece8; --muted:#93a198; --line:#2e3933;\n  --accent:#6fbf94; --accent-ink:#0f1512; --today:#22302a; --danger:#e47a63;\n  --c1:#6fbf94; --c2:#e89a5e; --c3:#7ea0e6; --c4:#e07aa8; --c5:#cdbb55; --c6:#a495e8; --c7:#5cc8c8; --c8:#ef6b5f; --c9:#8b8cf0; --c10:#a8d14a; --c11:#c99a6e; --c12:#a3b1bc; --c13:#5cb8ea; color-scheme:dark}}\n:root[data-theme=\"dark\"]{\n  --bg:#141a17; --surface:#1d2521; --ink:#e7ece8; --muted:#93a198; --line:#2e3933;\n  --accent:#6fbf94; --accent-ink:#0f1512; --today:#22302a; --danger:#e47a63;\n  --c1:#6fbf94; --c2:#e89a5e; --c3:#7ea0e6; --c4:#e07aa8; --c5:#cdbb55; --c6:#a495e8; --c7:#5cc8c8; --c8:#ef6b5f; --c9:#8b8cf0; --c10:#a8d14a; --c11:#c99a6e; --c12:#a3b1bc; --c13:#5cb8ea; color-scheme:dark}\n\n*{box-sizing:border-box}\nbody{background:var(--bg);color:var(--ink);font-family:var(--body);font-size:15px;-webkit-tap-highlight-color:transparent}\n.app{max-width:560px;margin:0 auto;padding-inline:16px;padding-block:14px 110px;display:flex;flex-direction:column;gap:16px}\nbutton{font:inherit;color:inherit;background:none;border:0;cursor:pointer}\nbutton:focus-visible,input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}\n\nheader{display:flex;flex-direction:column;gap:10px}\n.eyebrow{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:600}\n.weekrow{display:flex;align-items:center;gap:8px}\nh1{font-family:var(--display);font-weight:800;font-size:clamp(24px,7vw,32px);line-height:1.05;margin:0;flex:1;min-width:0;text-wrap:balance}\n.nav{width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:var(--surface);display:grid;place-items:center;font-size:18px;flex:none}\n.sub{display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--muted);font-size:14px}\n.todaybtn{font-weight:600;color:var(--accent);padding:4px 0}\n.meter{height:6px;border-radius:3px;background:var(--line);overflow:hidden}\n.meter i{display:block;height:100%;background:var(--accent);width:0;transition:width .3s}\n\n.board{background:var(--surface);border:1px solid var(--line);border-radius:16px;overflow:hidden}\n[hidden]{display:none!important}\n.grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));align-items:center}\n.dayhead{display:flex;flex-direction:column;align-items:center;gap:2px;padding-block:10px 8px;font-variant-numeric:tabular-nums;border-bottom:1px solid var(--line)}\n.dayhead .dn{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:600}\n.dayhead .dd{font-family:var(--display);font-weight:600;font-size:16px}\n.dayhead.is-today{background:var(--today)}\n.dayhead.is-today .dd{color:var(--accent)}\n.hname{grid-column:1 / -1;display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;column-gap:10px;row-gap:2px;padding:12px 14px 2px;text-align:left;min-width:0}\n.hname b{font-weight:600;font-size:15px;line-height:1.25;overflow-wrap:anywhere;display:flex;align-items:center;gap:7px}\n.hname b::before{content:\"\";width:9px;height:9px;border-radius:50%;background:var(--hc);flex:none}\n.hname small{font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums}\n.cell{display:grid;place-items:center;align-self:stretch;border-bottom:1px solid var(--line);min-height:50px;padding-bottom:4px}\n.cell button{width:min(34px,90%)!important;aspect-ratio:1;height:auto!important}\n.cell.is-today{background:var(--today)}\n.cell button{width:30px;height:30px;border-radius:9px;border:2px solid var(--line);display:grid;place-items:center;transition:transform .12s,background .15s,border-color .15s}\n.cell button:active{transform:scale(.88)}\n.cell button[aria-pressed=\"true\"]{background:var(--hc);border-color:var(--hc)}\n.cell button[aria-pressed=\"true\"] svg{opacity:1;transform:scale(1)}\n.cell button svg{width:16px;height:16px;opacity:0;transform:scale(.4);transition:all .15s;stroke:var(--surface)}\n.cell.is-future button{opacity:.45}\n\n.empty{padding:28px 20px;text-align:center;color:var(--muted);display:flex;flex-direction:column;gap:6px}\n.empty strong{color:var(--ink);font-family:var(--display);font-size:18px}\n\n.foot{position:fixed;left:0;right:0;bottom:0;padding:12px 16px calc(12px + env(safe-area-inset-bottom,0px));background:linear-gradient(transparent,var(--bg) 35%);display:flex;justify-content:center}\n.add{width:100%;max-width:528px;background:var(--accent);color:var(--accent-ink);font-weight:600;padding:14px;border-radius:14px;font-size:16px}\n.status{font-size:12px;color:var(--muted);text-align:center}\n\n/* alt sayfa */\n.scrim{position:fixed;inset:0;background:rgba(10,14,12,.45);display:flex;align-items:flex-end;justify-content:center;z-index:10}\n.sheet{background:var(--surface);width:100%;max-width:560px;border-radius:20px 20px 0 0;padding:20px 16px calc(20px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:16px}\n.sheet h2{font-family:var(--display);font-weight:800;font-size:22px;margin:0}\n.sheet label{font-size:13px;color:var(--muted);font-weight:600;display:flex;flex-direction:column;gap:6px}\n.sheet input[type=text]{font:inherit;font-size:16px;padding:12px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink);width:100%}\n.swatches{display:flex;gap:10px;flex-wrap:wrap}\n.swatches button{width:34px;height:34px;border-radius:50%;background:var(--sc);border:3px solid transparent}\n.swatches button[aria-pressed=\"true\"]{border-color:var(--ink)}\n.row{display:flex;gap:10px}\n.row button{flex:1;padding:13px;border-radius:12px;font-weight:600}\n.btn-primary{background:var(--accent);color:var(--accent-ink)}\n.btn-ghost{border:1px solid var(--line)}\n.btn-danger{color:var(--danger);border:1px solid var(--line)}\n.btn-danger.armed{background:var(--danger);color:var(--surface);border-color:var(--danger)}\n.goals{display:flex;gap:8px;flex-wrap:wrap}\n.goals button{padding:8px 12px;border-radius:999px;border:1px solid var(--line);font-size:14px;font-variant-numeric:tabular-nums}\n.goals button[aria-pressed=\"true\"]{background:var(--ink);color:var(--surface);border-color:var(--ink)}\n.hname small.met{color:var(--hc);font-weight:600}\n.order{display:flex;gap:10px}\n.order button{flex:1;padding:10px;border-radius:10px;border:1px solid var(--line);font-size:14px}\n@media (prefers-reduced-motion: reduce){*{transition:none!important}}\n</style>\n</head>\n<body>\n<div class=\"app\">\n  <header>\n    <div class=\"eyebrow\" id=\"yearLabel\">Hafta</div>\n    <div class=\"weekrow\">\n      <button class=\"nav\" id=\"prev\" aria-label=\"Önceki hafta\">‹</button>\n      <h1 id=\"weekTitle\">—</h1>\n      <button class=\"nav\" id=\"next\" aria-label=\"Sonraki hafta\">›</button>\n    </div>\n    <div class=\"sub\">\n      <span id=\"weekStat\">—</span>\n      <button class=\"todaybtn\" id=\"goToday\" hidden>Bu haftaya dön</button>\n    </div>\n    <div class=\"meter\" aria-hidden=\"true\"><i id=\"meterBar\"></i></div>\n  </header>\n\n  <div class=\"board\"><div class=\"grid\" id=\"grid\"></div></div>\n</div>\n\n<div class=\"foot\"><button class=\"add\" id=\"addBtn\">+ Rutin ekle</button></div>\n\n<div class=\"scrim\" id=\"scrim\" hidden>\n  <div class=\"sheet\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"sheetTitle\">\n    <h2 id=\"sheetTitle\">Yeni rutin</h2>\n    <label for=\"nameInput\">Adı\n      <input type=\"text\" id=\"nameInput\" maxlength=\"40\" placeholder=\"Örn. 2 litre su iç\" autocomplete=\"off\">\n    </label>\n    <div>\n      <div class=\"eyebrow\" style=\"margin-bottom:8px\">Renk</div>\n      <div class=\"swatches\" id=\"swatches\"></div>\n    </div>\n    <div>\n      <div class=\"eyebrow\" style=\"margin-bottom:8px\">Hedef</div>\n      <div class=\"goals\" id=\"goals\"></div>\n    </div>\n    <div class=\"order\" id=\"orderRow\" hidden>\n      <button id=\"upBtn\">↑ Yukarı taşı</button>\n      <button id=\"downBtn\">↓ Aşağı taşı</button>\n    </div>\n    <div class=\"row\">\n      <button class=\"btn-danger\" id=\"delBtn\" hidden>Sil</button>\n      <button class=\"btn-ghost\" id=\"cancelBtn\">Vazgeç</button>\n      <button class=\"btn-primary\" id=\"saveBtn\">Kaydet</button>\n    </div>\n  </div>\n</div>\n\n<script>\nconst COLORS=[\"c1\",\"c2\",\"c3\",\"c4\",\"c5\",\"c6\",\"c7\",\"c8\",\"c9\",\"c10\",\"c11\",\"c12\",\"c13\"];\nconst DAYS=[\"Pzt\",\"Sal\",\"Çar\",\"Per\",\"Cum\",\"Cmt\",\"Paz\"];\nconst MONTHS=[\"Ocak\",\"Şubat\",\"Mart\",\"Nisan\",\"Mayıs\",\"Haziran\",\"Temmuz\",\"Ağustos\",\"Eylül\",\"Ekim\",\"Kasım\",\"Aralık\"];\nconst CHECK='<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke-width=\"3.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 12.5l4.5 4.5L19 7.5\"/></svg>';\nconst LS_KEY=\"haftalik-rutin-v1\";\n\nconst $=id=>document.getElementById(id);\nconst pad=n=>String(n).padStart(2,\"0\");\nconst keyOf=d=>d.getFullYear()+\"-\"+pad(d.getMonth()+1)+\"-\"+pad(d.getDate());\nconst addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};\nconst mondayOf=d=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return x};\nconst uid=()=>Math.random().toString(36).slice(2,9);\n\nconst PRESET=[\n  {name:\"2 L su iç\",color:\"c3\",goal:7,was:\"Su iç (2 L)\"},\n  {name:\"Spor\",color:\"c2\",goal:4},\n  {name:\"Uyku düzeni\",color:\"c6\",goal:7},\n  {name:\"Günlük yürüyüş\",color:\"c1\",goal:7,was:\"30 dk yürüyüş\"},\n  {name:\"Diyet\",color:\"c4\",goal:7}\n];\nfunction defaultState(){\n  return {v:2,habits:PRESET.map(p=>({id:uid(),name:p.name,color:p.color,goal:p.goal})),checks:{},updated:0};\n}\n/* v2: istenen 5 rutini ekle; eski örnekleri işaretleri koruyarak dönüştür */\n/* Sonradan istenen rutinler: her sürümde bir kez eklenir (aynı adda biri yoksa) */\nconst ADDED=[\n  {v:3,name:\"Kitap oku\",match:/kitap/i,color:\"c5\",goal:7},\n  {v:4,name:\"Klip paylaş\",match:/klip/i,color:\"c7\",goal:7}\n];\nfunction migrate(st){\n  let changed=migrateV2(st);\n  ADDED.forEach(a=>{\n    if(st.v>=a.v) return;\n    if(!st.habits.some(h=>a.match.test(h.name))) st.habits.push({id:uid(),name:a.name,color:a.color,goal:a.goal});\n    st.v=a.v;changed=true;\n  });\n  return changed;\n}\nfunction migrateV2(st){\n  if(st.v>=2) return false;\n  const used=id=>Object.values(st.checks).some(a=>a.includes(id));\n  const out=[];\n  PRESET.forEach(p=>{\n    const old=st.habits.find(h=>h.name===p.name||(p.was&&h.name===p.was));\n    out.push(old?{...old,name:p.name,goal:p.goal}:{id:uid(),name:p.name,color:p.color,goal:p.goal});\n  });\n  st.habits.forEach(h=>{\n    if(out.some(o=>o.id===h.id)) return;\n    if(h.name===\"20 sayfa kitap\"&&!used(h.id)) return;\n    out.push(h);\n  });\n  st.habits=out;st.v=2;return true;\n}\nfunction readLocal(){try{const s=localStorage.getItem(LS_KEY);return s?JSON.parse(s):null}catch(e){return null}}\nfunction writeLocal(){try{localStorage.setItem(LS_KEY,JSON.stringify(state))}catch(e){}}\n\nlet state=window.__INIT__||readLocal()||defaultState();\nconst migratedLocal=migrate(state);\nlet weekStart=mondayOf(new Date());\nlet remote=null; // db doc reference\nlet saveTimer=null, saving=false, dirty=false;\n\n/* ---------- render ---------- */\nfunction streak(hid){\n  const checks=state.checks;let d=new Date(),n=0;\n  if(!(checks[keyOf(d)]||[]).includes(hid)) d=addDays(d,-1);\n  while((checks[keyOf(d)]||[]).includes(hid)){n++;d=addDays(d,-1)}\n  return n;\n}\nconst goalOf=h=>h.goal||7;\nfunction weekCount(hid,mon){let n=0;for(let i=0;i<7;i++)if((state.checks[keyOf(addDays(mon,i))]||[]).includes(hid))n++;return n}\nfunction weekStreak(h){\n  let w=mondayOf(new Date()),n=0;\n  if(weekCount(h.id,w)<goalOf(h)) w=addDays(w,-7);\n  while(weekCount(h.id,w)>=goalOf(h)){n++;w=addDays(w,-7)}\n  return n;\n}\nfunction render(){\n  const today=keyOf(new Date());\n  const days=[...Array(7)].map((_,i)=>addDays(weekStart,i));\n  const end=days[6];\n  const sameMonth=weekStart.getMonth()===end.getMonth();\n  $(\"weekTitle\").textContent=sameMonth\n    ? `${weekStart.getDate()}–${end.getDate()} ${MONTHS[end.getMonth()]}`\n    : `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()].slice(0,3)} – ${end.getDate()} ${MONTHS[end.getMonth()].slice(0,3)}`;\n  $(\"yearLabel\").textContent=`${end.getFullYear()} · ${isoWeek(weekStart)}. hafta`;\n  const isThisWeek=keyOf(weekStart)===keyOf(mondayOf(new Date()));\n  $(\"goToday\").hidden=isThisWeek;\n\n  const g=$(\"grid\");g.innerHTML=\"\";\n  days.forEach((d,i)=>{\n    const h=document.createElement(\"div\");\n    h.className=\"dayhead\"+(keyOf(d)===today?\" is-today\":\"\");\n    h.innerHTML=`<span class=\"dn\">${DAYS[i]}</span><span class=\"dd\">${d.getDate()}</span>`;\n    g.append(h);\n  });\n\n  let done=0,possible=0;\n  if(!state.habits.length){\n    const e=document.createElement(\"div\");e.className=\"empty\";e.style.gridColumn=\"1 / -1\";\n    e.innerHTML=\"<strong>Henüz rutin yok</strong><span>Alttaki “Rutin ekle” ile her gün yapmak istediğin ilk şeyi ekle.</span>\";\n    g.append(e);\n  }\n  state.habits.forEach(h=>{\n    const nb=document.createElement(\"button\");nb.className=\"hname\";nb.style.setProperty(\"--hc\",`var(--${h.color})`);\n    const goal=goalOf(h);\n    if(goal<7){\n      const cnt=weekCount(h.id,weekStart),met=cnt>=goal,ws=weekStreak(h);\n      nb.innerHTML=`<b></b><small class=\"${met?\"met\":\"\"}\">${met?\"Hedef tamam\":\"Haftada \"+goal+\" gün\"} · ${cnt}/${goal}${ws>1?` · ${ws} hafta seri`:\"\"}</small>`;\n      if(days[0]<=new Date()){possible+=goal;done+=Math.min(cnt,goal)}\n    }else{\n      const s=streak(h.id);\n      nb.innerHTML=`<b></b><small>${s?`${s} gün seri`:\"Düzenlemek için dokun\"}</small>`;\n    }\n    nb.querySelector(\"b\").append(document.createTextNode(h.name));\n    nb.onclick=()=>openSheet(h);\n    g.append(nb);\n    days.forEach((d,i)=>{\n      const k=keyOf(d),on=(state.checks[k]||[]).includes(h.id),future=k>today;\n      if(!future&&goal===7){possible++;if(on)done++}\n      const c=document.createElement(\"div\");\n      c.className=\"cell\"+(k===today?\" is-today\":\"\")+(future?\" is-future\":\"\");\n      c.style.setProperty(\"--hc\",`var(--${h.color})`);\n      const b=document.createElement(\"button\");\n      b.setAttribute(\"aria-pressed\",on);b.setAttribute(\"aria-label\",`${h.name}, ${DAYS[i]} ${d.getDate()}`);\n      b.innerHTML=CHECK;b.onclick=()=>toggle(h.id,k);\n      c.append(b);g.append(c);\n    });\n  });\n  const pct=possible?Math.round(done/possible*100):0;\n  $(\"weekStat\").textContent=possible?`${done}/${possible} tamamlandı · %${pct}`:(state.habits.length?\"Bu hafta henüz başlamadı\":\"\");\n  $(\"meterBar\").style.width=pct+\"%\";\n}\nfunction isoWeek(mon){\n  const th=addDays(mon,3);const y=new Date(th.getFullYear(),0,4);\n  return 1+Math.round(((th-mondayOf(y))/864e5)/7);\n}\n\n/* ---------- actions ---------- */\nfunction toggle(hid,k){\n  const arr=state.checks[k]||[];\n  state.checks[k]=arr.includes(hid)?arr.filter(x=>x!==hid):[...arr,hid];\n  if(!state.checks[k].length) delete state.checks[k];\n  commit();\n}\nfunction commit(){\n  state.updated=Date.now();writeLocal();render();\n  dirty=true;clearTimeout(saveTimer);saveTimer=setTimeout(flush,600);\n}\nasync function flush(){\n  if(!remote||!dirty) return;\n  if(saving){saveTimer=setTimeout(flush,400);return}\n  saving=true;dirty=false;\n  try{await remote.set(JSON.parse(JSON.stringify(state)))}catch(e){dirty=true}\n  saving=false;\n}\n\n/* ---------- sheet ---------- */\nlet editing=null,pickColor=\"c1\",pickGoal=7,delArmed=false;\nfunction drawGoals(){\n  const w=$(\"goals\");w.innerHTML=\"\";\n  [7,6,5,4,3,2,1].forEach(n=>{const b=document.createElement(\"button\");\n    b.textContent=n===7?\"Her gün\":`Haftada ${n}`;b.setAttribute(\"aria-pressed\",n===pickGoal);\n    b.onclick=()=>{pickGoal=n;drawGoals()};w.append(b)});\n}\nfunction openSheet(h){\n  editing=h||null;delArmed=false;\n  $(\"sheetTitle\").textContent=h?\"Rutini düzenle\":\"Yeni rutin\";\n  $(\"nameInput\").value=h?h.name:\"\";\n  pickColor=h?h.color:COLORS[state.habits.length%COLORS.length];\n  $(\"delBtn\").hidden=!h;$(\"delBtn\").classList.remove(\"armed\");$(\"delBtn\").textContent=\"Sil\";\n  $(\"orderRow\").hidden=!h||state.habits.length<2;\n  pickGoal=h?goalOf(h):7;\n  drawSwatches();drawGoals();$(\"scrim\").hidden=false;\n  setTimeout(()=>{if(!h)$(\"nameInput\").focus()},50);\n}\nfunction closeSheet(){$(\"scrim\").hidden=true;editing=null}\nfunction drawSwatches(){\n  const w=$(\"swatches\");w.innerHTML=\"\";\n  COLORS.forEach(c=>{const b=document.createElement(\"button\");b.style.setProperty(\"--sc\",`var(--${c})`);\n    b.setAttribute(\"aria-pressed\",c===pickColor);b.setAttribute(\"aria-label\",\"Renk \"+c.slice(1));\n    b.onclick=()=>{pickColor=c;drawSwatches()};w.append(b)});\n}\nfunction move(dir){\n  const i=state.habits.indexOf(editing),j=i+dir;\n  if(j<0||j>=state.habits.length) return;\n  [state.habits[i],state.habits[j]]=[state.habits[j],state.habits[i]];commit();\n}\n$(\"upBtn\").onclick=()=>move(-1);\n$(\"downBtn\").onclick=()=>move(1);\n$(\"saveBtn\").onclick=()=>{\n  const name=$(\"nameInput\").value.trim();\n  if(!name){$(\"nameInput\").focus();$(\"nameInput\").placeholder=\"Bir ad yaz\";return}\n  if(editing){editing.name=name;editing.color=pickColor;editing.goal=pickGoal}\n  else state.habits.push({id:uid(),name,color:pickColor,goal:pickGoal});\n  closeSheet();commit();\n};\n$(\"delBtn\").onclick=()=>{\n  if(!delArmed){delArmed=true;$(\"delBtn\").classList.add(\"armed\");$(\"delBtn\").textContent=\"Emin misin?\";return}\n  const id=editing.id;\n  state.habits=state.habits.filter(h=>h.id!==id);\n  for(const k in state.checks){state.checks[k]=state.checks[k].filter(x=>x!==id);if(!state.checks[k].length)delete state.checks[k]}\n  closeSheet();commit();\n};\n$(\"cancelBtn\").onclick=closeSheet;\n$(\"scrim\").onclick=e=>{if(e.target===$(\"scrim\"))closeSheet()};\n$(\"nameInput\").onkeydown=e=>{if(e.key===\"Enter\")$(\"saveBtn\").click()};\n$(\"addBtn\").onclick=()=>openSheet(null);\n$(\"prev\").onclick=()=>{weekStart=addDays(weekStart,-7);render()};\n$(\"next\").onclick=()=>{weekStart=addDays(weekStart,7);render()};\n$(\"goToday\").onclick=()=>{weekStart=mondayOf(new Date());render()};\n\n/* ---------- swipe between weeks ---------- */\nlet sx=null,sy=null;\n$(\"grid\").addEventListener(\"touchstart\",e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});\n$(\"grid\").addEventListener(\"touchend\",e=>{\n  if(sx===null)return;const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;sx=null;\n  if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){weekStart=addDays(weekStart,dx<0?7:-7);render()}\n});\n\nif(migratedLocal) commit(); else render();\n\n/* ---------- uygulama ---------- */\nlet lastDay=keyOf(new Date());\ndocument.addEventListener(\"visibilitychange\",()=>{\n  if(document.visibilityState!==\"visible\") return;\n  const t=keyOf(new Date());\n  if(t!==lastDay){lastDay=t;weekStart=mondayOf(new Date())}\n  render();\n});\nif(\"serviceWorker\" in navigator) navigator.serviceWorker.register(\"sw.js\").catch(()=>{});\n</script>\n</body>\n</html>\n";

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

/* ---------- bildirimler ---------- */
// Her rutin adına göre eşleşir. times: sabit saatler ("SS:DD"); random: o gün içinde rastgele N saat.
// Rutin o gün işaretlendiyse kalan bildirimleri gelmez (skipIfDone). Diyet öğün hatırlatmaları her zaman gelir.
const NOTIFY = [
  { match: /\bsu\b/i, skipIfDone: true, times: ["09:00", "12:00", "15:00", "18:00", "21:00"],
    title: "💧 Su vakti", body: () => "Bir bardak su iç. Günlük hedef: 2 litre." },
  { match: /spor/i, skipIfDone: true, skipIfWeekGoal: true, times: ["10:00", "18:00"],
    title: "🏋️ Spor", body: h => `Bugün spor yapmaya ne dersin? Bu hafta ${weekCount(h.id, mondayOf(new Date()))}/${goalOf(h)}.` },
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
      if (rule.skipIfDone && isOn(h.id, k)) continue;
      if (rule.skipIfWeekGoal && weekCount(h.id, mondayOf(day)) >= goalOf(h)) continue;
      const mins = rule.times ? rule.times.map(toMin) : randomTimes(k + h.id, rule.random);
      const bodies = rule.body(h);
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
} else {
  try {
    await presentApp();
  } catch (e) {
    render();
    await table.present(false);
  }
  reloadState();
}
// Her çalışmada (widget yenilemesi, uygulama, kestirme) bildirimleri güncelle
try { await scheduleNotifications(); } catch (e) {}
if (config.runsInApp) await selfUpdate();
Script.complete();
