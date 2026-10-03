// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: calendar-check;

// Haftalık Rutin — Scriptable betiği
// • Ana ekrandaki widget: bu haftanın tablosu (büyük), bugünün durumu (orta / küçük)
// • Widget'a dokununca ya da betiği çalıştırınca: Rutin uygulaması (index.html ile aynı arayüz)
// Bu dosya build_scriptable.py ile üretilir; arayüzü değiştirmek için index.html'i düzenle.
// Veriler iCloud Drive > Scriptable > rutin.json dosyasında tutulur.

const SCRIPT_VERSION = 8;
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

const APP_HTML = "<!doctype html>\n<html lang=\"tr\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\">\n<title>Haftalık Rutin</title>\n<meta name=\"apple-mobile-web-app-capable\" content=\"yes\">\n<meta name=\"mobile-web-app-capable\" content=\"yes\">\n<meta name=\"apple-mobile-web-app-title\" content=\"Rutin\">\n<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black-translucent\">\n<meta name=\"theme-color\" content=\"#eef1ec\" media=\"(prefers-color-scheme: light)\">\n<meta name=\"theme-color\" content=\"#141a17\" media=\"(prefers-color-scheme: dark)\">\n<link rel=\"apple-touch-icon\" href=\"apple-touch-icon.png\">\n<link rel=\"icon\" type=\"image/png\" href=\"icon-192.png\">\n<link rel=\"manifest\" href=\"manifest.webmanifest\">\n\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Figtree:wght@400;500;600&display=swap\">\n<style>\n:root{color-scheme:light}\nhtml,body{margin:0;height:100%;overflow:hidden}\nimg{max-width:100%}\nbody{overscroll-behavior-y:none;touch-action:manipulation;-webkit-user-select:none;user-select:none}\ninput,textarea{-webkit-user-select:text;user-select:text}\n/* Layout: tek ekran telefon uygulaması — üstte hafta başlığı, ortada alışkanlık × gün ızgarası, altta ekle butonu */\n:root{\n  --bg:#eef1ec; --surface:#ffffff; --ink:#1d2621; --muted:#68746d; --line:#d8ded8;\n  --accent:#2f6b4f; --accent-ink:#ffffff; --today:#e3ece5; --danger:#b4432f;\n  --display:\"Bricolage Grotesque\",ui-sans-serif,system-ui,sans-serif;\n  --body:\"Figtree\",ui-sans-serif,system-ui,-apple-system,\"Segoe UI\",sans-serif;\n  --c1:#2f6b4f; --c2:#c4682b; --c3:#3b5fa8; --c4:#a83b6e; --c5:#8a7a1e; --c6:#5b4aa0; --c7:#1f7a7a; --c8:#b8322a; --c9:#3f3fa8; --c10:#5f7f12; --c11:#7a5230; --c12:#4d5b66; --c13:#1b6f9e;\n  --empty:#e6eae5; --gold:#c9962f;\n}\n@media (prefers-color-scheme: dark){:root:not([data-theme=\"light\"]){\n  --bg:#141a17; --surface:#1d2521; --ink:#e7ece8; --muted:#93a198; --line:#2e3933;\n  --accent:#6fbf94; --accent-ink:#0f1512; --today:#22302a; --danger:#e47a63; --empty:#26302b; --gold:#e8c06a;\n  --c1:#6fbf94; --c2:#e89a5e; --c3:#7ea0e6; --c4:#e07aa8; --c5:#cdbb55; --c6:#a495e8; --c7:#5cc8c8; --c8:#ef6b5f; --c9:#8b8cf0; --c10:#a8d14a; --c11:#c99a6e; --c12:#a3b1bc; --c13:#5cb8ea; color-scheme:dark}}\n:root[data-theme=\"dark\"]{\n  --bg:#141a17; --surface:#1d2521; --ink:#e7ece8; --muted:#93a198; --line:#2e3933;\n  --accent:#6fbf94; --accent-ink:#0f1512; --today:#22302a; --danger:#e47a63; --empty:#26302b; --gold:#e8c06a;\n  --c1:#6fbf94; --c2:#e89a5e; --c3:#7ea0e6; --c4:#e07aa8; --c5:#cdbb55; --c6:#a495e8; --c7:#5cc8c8; --c8:#ef6b5f; --c9:#8b8cf0; --c10:#a8d14a; --c11:#c99a6e; --c12:#a3b1bc; --c13:#5cb8ea; color-scheme:dark}\n\n*{box-sizing:border-box}\nbody{background:var(--bg);color:var(--ink);font-family:var(--body);font-size:15px;-webkit-tap-highlight-color:transparent}\n/* Tek ekran: başlık + tablo + ekle düğmesi; tablo kalan yüksekliği rutinlere eşit paylaştırır */\n.app{position:fixed;top:0;bottom:0;left:0;right:0;box-sizing:border-box;max-width:560px;margin:0 auto;padding-inline:16px;padding-top:calc(env(safe-area-inset-top,0px) + 10px);padding-bottom:calc(env(safe-area-inset-bottom,0px) + 10px);display:flex;flex-direction:column;gap:10px}\nbutton{font:inherit;color:inherit;background:none;border:0;cursor:pointer}\nbutton:focus-visible,input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}\n\nheader{display:flex;flex-direction:column;gap:6px;flex:none}\n.eyebrow{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:600}\n.weekrow{display:flex;align-items:center;gap:8px}\nh1{font-family:var(--display);font-weight:800;font-size:clamp(22px,6.4vw,30px);line-height:1.05;margin:0;flex:1;min-width:0;text-wrap:balance}\n.nav{width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:var(--surface);display:grid;place-items:center;font-size:18px;flex:none}\n.sub{display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--muted);font-size:14px}\n.todaybtn{font-weight:600;color:var(--accent);padding:4px 0}\n.meter{height:6px;border-radius:3px;background:var(--line);overflow:hidden}\n.meter i{display:block;height:100%;background:var(--accent);width:0;transition:width .3s}\n\n.board{background:var(--surface);border:1px solid var(--line);border-radius:16px;overflow-x:hidden;overflow-y:auto;flex:1;min-height:0;display:flex;flex-direction:column}\n[hidden]{display:none!important}\n.grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));align-items:center;flex:1}\n.dayhead{display:flex;flex-direction:column;align-items:center;gap:2px;padding-block:7px 6px;font-variant-numeric:tabular-nums;border-bottom:1px solid var(--line)}\n.dayhead .dn{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:600}\n.dayhead .dd{font-family:var(--display);font-weight:600;font-size:16px}\n.dayhead.is-today{background:var(--today)}\n.dayhead.is-today .dd{color:var(--accent)}\n.hname{grid-column:1 / -1;display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;column-gap:10px;row-gap:0;padding:6px 12px 0;align-self:end;text-align:left;min-width:0}\n.hname b{font-weight:600;font-size:14px;line-height:1.25;overflow-wrap:anywhere;display:flex;align-items:center;gap:7px}\n.hname b::before{content:\"\";width:9px;height:9px;border-radius:50%;background:var(--hc);flex:none}\n.hname small{font-size:11px;color:var(--muted);font-variant-numeric:tabular-nums}\n.cell{display:grid;place-items:center;align-self:stretch;border-bottom:1px solid var(--line);padding-block:3px 4px}\n.cell button{width:min(var(--box,30px),90%)!important;height:auto!important;aspect-ratio:1}\n.cell.is-today{background:var(--today)}\n.cell button{width:30px;height:30px;border-radius:9px;border:2px solid var(--line);display:grid;place-items:center;transition:transform .12s,background .15s,border-color .15s}\n.cell button:active{transform:scale(.88)}\n.cell button[aria-pressed=\"true\"]{background:var(--hc);border-color:var(--hc)}\n.cell button[aria-pressed=\"true\"] svg{opacity:1;transform:scale(1)}\n.cell button svg{width:55%;height:55%;opacity:0;transform:scale(.4);transition:all .15s;stroke:var(--surface)}\n.cell.is-future button{opacity:.45}\n.cell.is-off button{opacity:.3;border-style:dashed}\n.cell.is-off button[aria-pressed=\"true\"]{opacity:1;border-style:solid}\n\n.empty{padding:28px 20px;text-align:center;color:var(--muted);display:flex;flex-direction:column;gap:6px}\n.empty strong{color:var(--ink);font-family:var(--display);font-size:18px}\n\n.foot{flex:none;display:flex}\n.add{width:100%;background:var(--accent);color:var(--accent-ink);font-weight:600;padding:14px;border-radius:14px;font-size:16px}\n.status{font-size:12px;color:var(--muted);text-align:center}\n\n/* alt sayfa */\n.scrim{position:fixed;inset:0;background:rgba(10,14,12,.45);display:flex;align-items:flex-end;justify-content:center;z-index:10}\n.sheet{background:var(--surface);width:100%;max-width:560px;border-radius:20px 20px 0 0;padding:20px 16px calc(20px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:16px}\n.sheet h2{font-family:var(--display);font-weight:800;font-size:22px;margin:0}\n.sheet label{font-size:13px;color:var(--muted);font-weight:600;display:flex;flex-direction:column;gap:6px}\n.sheet input[type=text]{font:inherit;font-size:16px;padding:12px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink);width:100%}\n.swatches{display:flex;gap:10px;flex-wrap:wrap}\n.swatches button{width:34px;height:34px;border-radius:50%;background:var(--sc);border:3px solid transparent}\n.swatches button[aria-pressed=\"true\"]{border-color:var(--ink)}\n.row{display:flex;gap:10px}\n.row button{flex:1;padding:13px;border-radius:12px;font-weight:600}\n.btn-primary{background:var(--accent);color:var(--accent-ink)}\n.btn-ghost{border:1px solid var(--line)}\n.btn-danger{color:var(--danger);border:1px solid var(--line)}\n.btn-danger.armed{background:var(--danger);color:var(--surface);border-color:var(--danger)}\n.goals{display:flex;gap:8px;flex-wrap:wrap}\n.goals button{padding:8px 12px;border-radius:999px;border:1px solid var(--line);font-size:14px;font-variant-numeric:tabular-nums}\n.goals button[aria-pressed=\"true\"]{background:var(--ink);color:var(--surface);border-color:var(--ink)}\n.hname small.met{color:var(--hc);font-weight:600}\n.order{display:flex;gap:10px}\n.order button{flex:1;padding:10px;border-radius:10px;border:1px solid var(--line);font-size:14px}\n\n/* üst satır: yıl/hafta etiketi + istatistik düğmesi */\n.toprow{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.pill{display:inline-flex;align-items:center;gap:6px;padding:6px 11px;border-radius:999px;background:var(--surface);border:1px solid var(--line);font-size:13px;font-weight:600;color:var(--ink)}\n.pill svg{width:15px;height:15px;stroke:var(--accent)}\n\n/* istatistik paneli (kendi içinde kayar) */\n.panel{position:fixed;inset:0;background:var(--bg);z-index:20;overflow-y:auto;-webkit-overflow-scrolling:touch}\n.panel-in{max-width:560px;margin:0 auto;padding-inline:16px;padding-top:calc(env(safe-area-inset-top,0px) + 12px);padding-bottom:calc(env(safe-area-inset-bottom,0px) + 24px);display:flex;flex-direction:column;gap:12px}\n.panel-head{display:flex;align-items:center;justify-content:space-between;gap:8px;position:sticky;top:0;background:var(--bg);padding-block:4px;z-index:1}\n.panel h2{font-family:var(--display);font-weight:800;font-size:26px;margin:0}\n.card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:12px;min-width:0}\n.card h3{margin:0;font-family:var(--display);font-weight:800;font-size:17px}\n.muted{color:var(--muted);font-size:13px;margin:0;line-height:1.45}\n.big{font-family:var(--display);font-weight:800;font-size:40px;line-height:1;font-variant-numeric:tabular-nums}\n.sumrow{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap}\n.delta{font-weight:700;font-size:14px;padding:4px 9px;border-radius:999px;background:var(--today);font-variant-numeric:tabular-nums}\n.delta.up{color:var(--accent)} .delta.down{color:var(--danger)}\n.seg{display:grid;grid-template-columns:1fr 1fr;background:var(--bg);border-radius:10px;padding:3px;gap:3px}\n.seg button{padding:8px;border-radius:8px;font-weight:600;font-size:14px;color:var(--muted)}\n.seg button[aria-pressed=\"true\"]{background:var(--surface);color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.12)}\n.chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}\n.chips::-webkit-scrollbar{display:none}\n.chips button{flex:none;display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;border:1px solid var(--line);font-size:13px;white-space:nowrap}\n.chips button i{width:8px;height:8px;border-radius:50%;background:var(--hc)}\n.chips button[aria-pressed=\"true\"]{background:var(--ink);color:var(--surface);border-color:var(--ink)}\n.mhead{display:flex;align-items:center;justify-content:space-between}\n.mhead b{font-family:var(--display);font-size:17px}\n.nav.sm{width:32px;height:32px;font-size:15px}\n.mgrid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px}\n.mgrid .dn{font-size:10px;text-align:center;color:var(--muted);font-weight:600;letter-spacing:.05em;text-transform:uppercase}\n.sq{position:relative;aspect-ratio:1;border-radius:7px;background:var(--empty);overflow:hidden;display:grid;place-items:center;font-size:11px;font-weight:600;font-variant-numeric:tabular-nums;color:var(--muted)}\n.sq i{position:absolute;inset:0;background:var(--hc);opacity:var(--o,0)}\n.sq span{position:relative}\n.sq.hi span{color:var(--surface)}\n.sq.today{outline:2px solid var(--gold);outline-offset:1px}\n.sq.future{opacity:.35}\n.sq.off{background:transparent;border:1px dashed var(--line)}\n.sq.blank{background:transparent}\n.daynote{font-size:13px;color:var(--muted);min-height:1.4em}\n.yscroll{overflow-x:auto;padding-bottom:4px}\n.ygrid{display:grid;grid-auto-flow:column;grid-template-rows:14px repeat(7,11px);grid-auto-columns:11px;gap:3px;width:max-content}\n.ygrid .ml{font-size:9px;color:var(--muted);white-space:nowrap;grid-row:1}\n.ygrid .sq{border-radius:3px;aspect-ratio:auto}\n.legend{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--muted);justify-content:flex-end}\n.legend .sq{width:11px;height:11px;border-radius:3px;aspect-ratio:auto}\n.hs{display:flex;flex-direction:column;gap:8px;padding-top:12px;border-top:1px solid var(--line)}\n.hs:first-of-type{border-top:0;padding-top:0}\n.hs-top{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.hs-top b{display:flex;align-items:center;gap:7px;font-size:15px;min-width:0}\n.hs-top b::before{content:\"\";width:9px;height:9px;border-radius:50%;background:var(--hc);flex:none}\n.hs-top .pct{font-family:var(--display);font-weight:800;font-size:20px;color:var(--hc);font-variant-numeric:tabular-nums}\n.bar{height:6px;border-radius:3px;background:var(--empty);overflow:hidden}\n.bar i{display:block;height:100%;background:var(--hc)}\n.facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}\n.facts div{display:flex;flex-direction:column;gap:1px;min-width:0}\n.facts small{font-size:11px;color:var(--muted)}\n.facts strong{font-size:15px;font-variant-numeric:tabular-nums}\n.weak{font-size:12px;color:var(--muted)}\n.badges{display:flex;gap:6px;flex-wrap:wrap}\n.badge{display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;font-size:12px;font-weight:600;border:1px solid var(--line);color:var(--muted);opacity:.55}\n.badge.got{opacity:1;color:var(--ink);border-color:var(--hc);background:var(--today)}\n.badge svg{width:13px;height:13px}\n.card textarea{font:12px/1.4 ui-monospace,Menlo,monospace;width:100%;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink);padding:10px;resize:vertical;-webkit-user-select:text;user-select:text}\n.ver{text-align:center;font-size:12px;color:var(--muted);margin:4px 0 0}\n\n/* web sürümü artık Scriptable'ı açan bir başlatıcı */\n.launch{position:fixed;inset:0;z-index:40;background:var(--bg);display:grid;place-items:center;padding:calc(env(safe-area-inset-top,0px) + 16px) 16px calc(env(safe-area-inset-bottom,0px) + 16px)}\n.launch-in{max-width:380px;width:100%;display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px}\n.licon{width:88px;height:88px;border-radius:22px;box-shadow:0 10px 30px rgba(0,0,0,.25)}\n.launch h2{font-family:var(--display);font-weight:800;font-size:26px;margin:0;text-wrap:balance}\n.launch p{margin:0;color:var(--muted);line-height:1.5;font-size:15px}\n.linkbtn{color:var(--muted);font-size:14px;text-decoration:underline;padding:6px}\n\n/* kutlama */\n.celebrate{position:fixed;inset:0;z-index:30;display:grid;place-items:center;background:rgba(10,14,12,.35)}\n.celebrate canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}\n.cele-card{position:relative;background:var(--surface);border-radius:22px;padding:22px 26px;text-align:center;display:flex;flex-direction:column;gap:4px;align-items:center;box-shadow:0 20px 50px rgba(0,0,0,.3);animation:pop .45s cubic-bezier(.2,1.4,.4,1);max-width:300px;margin:16px}\n.cele-card .num{font-family:var(--display);font-weight:800;font-size:64px;line-height:1;color:var(--hc)}\n.cele-card .lbl{font-family:var(--display);font-weight:800;font-size:20px}\n.cele-card .sub2{color:var(--muted);font-size:14px}\n@keyframes pop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}\n@media (prefers-reduced-motion: reduce){*{transition:none!important;animation:none!important}}\n</style>\n</head>\n<body>\n<div class=\"app\">\n  <header>\n    <div class=\"toprow\">\n      <div class=\"eyebrow\" id=\"yearLabel\">Hafta</div>\n      <button class=\"pill\" id=\"statsBtn\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke-width=\"2.4\" stroke-linecap=\"round\"><path d=\"M5 20V11M12 20V5M19 20v-6\"/></svg>İstatistik</button>\n    </div>\n    <div class=\"weekrow\">\n      <button class=\"nav\" id=\"prev\" aria-label=\"Önceki hafta\">‹</button>\n      <h1 id=\"weekTitle\">—</h1>\n      <button class=\"nav\" id=\"next\" aria-label=\"Sonraki hafta\">›</button>\n    </div>\n    <div class=\"sub\">\n      <span id=\"weekStat\">—</span>\n      <button class=\"todaybtn\" id=\"goToday\" hidden>Bu haftaya dön</button>\n    </div>\n    <div class=\"meter\" aria-hidden=\"true\"><i id=\"meterBar\"></i></div>\n  </header>\n\n  <div class=\"board\" id=\"board\"><div class=\"grid\" id=\"grid\"></div></div>\n  <div class=\"foot\"><button class=\"add\" id=\"addBtn\">+ Rutin ekle</button></div>\n</div>\n\n<div class=\"panel\" id=\"panel\" hidden role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"panelTitle\">\n  <div class=\"panel-in\">\n    <div class=\"panel-head\"><h2 id=\"panelTitle\">İstatistik</h2><button class=\"nav\" id=\"panelClose\" aria-label=\"Kapat\">✕</button></div>\n\n    <section class=\"card\" id=\"sumCard\"></section>\n\n    <section class=\"card\">\n      <div class=\"seg\"><button id=\"segMonth\" aria-pressed=\"true\">Ay</button><button id=\"segYear\" aria-pressed=\"false\">Yıl</button></div>\n      <div class=\"chips\" id=\"chips\"></div>\n      <div id=\"monthView\">\n        <div class=\"mhead\"><button class=\"nav sm\" id=\"mPrev\" aria-label=\"Önceki ay\">‹</button><b id=\"mTitle\"></b><button class=\"nav sm\" id=\"mNext\" aria-label=\"Sonraki ay\">›</button></div>\n        <div class=\"mgrid\" id=\"mGrid\" style=\"margin-top:10px\"></div>\n        <div class=\"daynote\" id=\"dayNote\" style=\"margin-top:8px\">Ayrıntı için bir güne dokun.</div>\n      </div>\n      <div id=\"yearView\" hidden>\n        <div class=\"yscroll\" id=\"yScroll\"><div class=\"ygrid\" id=\"yGrid\"></div></div>\n        <div class=\"legend\">Az <span class=\"sq\"></span><span class=\"sq\" style=\"--hc:var(--accent)\"><i style=\"--o:.3\"></i></span><span class=\"sq\" style=\"--hc:var(--accent)\"><i style=\"--o:.55\"></i></span><span class=\"sq\" style=\"--hc:var(--accent)\"><i style=\"--o:.8\"></i></span><span class=\"sq\" style=\"--hc:var(--accent)\"><i style=\"--o:1\"></i></span> Çok</div>\n      </div>\n    </section>\n\n    <section class=\"card\"><h3 id=\"hsTitle\">Rutinler</h3><div id=\"habitStats\" style=\"display:flex;flex-direction:column;gap:12px\"></div></section>\n\n    <section class=\"card\">\n      <h3>Yedek</h3>\n      <p class=\"muted\" id=\"backupInfo\">Verilerini metin olarak kopyalayıp Notlar'a ya da bir mesaja yapıştırarak saklayabilir, başka bir cihaza taşıyabilirsin.</p>\n      <div class=\"row\"><button class=\"btn-ghost\" id=\"exportBtn\">Yedeği kopyala</button><button class=\"btn-ghost\" id=\"importBtn\">Yedekten yükle</button></div>\n      <div id=\"exportBox\" hidden style=\"display:flex;flex-direction:column;gap:8px\"><textarea id=\"exportText\" rows=\"4\" readonly></textarea><p class=\"muted\" id=\"exportMsg\"></p></div>\n      <div id=\"importBox\" hidden style=\"display:flex;flex-direction:column;gap:8px\">\n        <textarea id=\"importText\" rows=\"4\" placeholder=\"Yedek metnini buraya yapıştır\"></textarea>\n        <div class=\"row\"><button class=\"btn-primary\" id=\"importDo\">Geri yükle</button></div>\n        <p class=\"muted\" id=\"importMsg\"></p>\n      </div>\n    </section>\n    <p class=\"ver\" id=\"verLabel\"></p>\n  </div>\n</div>\n\n<div class=\"launch\" id=\"launch\" hidden>\n  <div class=\"launch-in\">\n    <img class=\"licon\" src=\"apple-touch-icon.png\" alt=\"\">\n    <h2 id=\"lTitle\">Rutin artık tek yerde</h2>\n    <p id=\"lText\">Bildirimler, ana ekran widget'ı ve iCloud yedeği Scriptable'daki Rutin'de çalışıyor. Bu simge artık seni doğrudan oraya götürecek.</p>\n    <button class=\"add\" id=\"moveBtn\">Verilerimi taşı ve aç</button>\n    <p class=\"muted\" id=\"moveInfo\"></p>\n    <button class=\"linkbtn\" id=\"againBtn\" hidden>Verileri yeniden taşı</button>\n    <button class=\"linkbtn\" id=\"openOld\">Eski web sürümünü aç</button>\n  </div>\n</div>\n\n<div class=\"celebrate\" id=\"celebrate\" hidden><canvas id=\"confetti\"></canvas><div class=\"cele-card\" id=\"celeCard\"></div></div>\n\n<div class=\"scrim\" id=\"scrim\" hidden>\n  <div class=\"sheet\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"sheetTitle\">\n    <h2 id=\"sheetTitle\">Yeni rutin</h2>\n    <label for=\"nameInput\">Adı\n      <input type=\"text\" id=\"nameInput\" maxlength=\"40\" placeholder=\"Örn. 2 litre su iç\" autocomplete=\"off\">\n    </label>\n    <div>\n      <div class=\"eyebrow\" style=\"margin-bottom:8px\">Renk</div>\n      <div class=\"swatches\" id=\"swatches\"></div>\n    </div>\n    <div>\n      <div class=\"eyebrow\" style=\"margin-bottom:8px\">Hedef</div>\n      <div class=\"goals\" id=\"goals\"></div>\n      <div class=\"goals\" id=\"dayPick\" style=\"margin-top:10px\" hidden></div>\n    </div>\n    <div class=\"order\" id=\"orderRow\" hidden>\n      <button id=\"upBtn\">↑ Yukarı taşı</button>\n      <button id=\"downBtn\">↓ Aşağı taşı</button>\n    </div>\n    <div class=\"row\">\n      <button class=\"btn-danger\" id=\"delBtn\" hidden>Sil</button>\n      <button class=\"btn-ghost\" id=\"cancelBtn\">Vazgeç</button>\n      <button class=\"btn-primary\" id=\"saveBtn\">Kaydet</button>\n    </div>\n  </div>\n</div>\n\n<script>\nconst COLORS=[\"c1\",\"c2\",\"c3\",\"c4\",\"c5\",\"c6\",\"c7\",\"c8\",\"c9\",\"c10\",\"c11\",\"c12\",\"c13\"];\nconst DAYS=[\"Pzt\",\"Sal\",\"Çar\",\"Per\",\"Cum\",\"Cmt\",\"Paz\"];\nconst MONTHS=[\"Ocak\",\"Şubat\",\"Mart\",\"Nisan\",\"Mayıs\",\"Haziran\",\"Temmuz\",\"Ağustos\",\"Eylül\",\"Ekim\",\"Kasım\",\"Aralık\"];\nconst CHECK='<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke-width=\"3.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 12.5l4.5 4.5L19 7.5\"/></svg>';\nconst LS_KEY=\"haftalik-rutin-v1\";\n\nconst $=id=>document.getElementById(id);\nconst pad=n=>String(n).padStart(2,\"0\");\nconst keyOf=d=>d.getFullYear()+\"-\"+pad(d.getMonth()+1)+\"-\"+pad(d.getDate());\nconst addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};\nconst mondayOf=d=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return x};\nconst uid=()=>Math.random().toString(36).slice(2,9);\n\nconst PRESET=[\n  {name:\"2 L su iç\",color:\"c3\",goal:7,was:\"Su iç (2 L)\"},\n  {name:\"Spor\",color:\"c2\",goal:4},\n  {name:\"Uyku düzeni\",color:\"c6\",goal:7},\n  {name:\"Günlük yürüyüş\",color:\"c1\",goal:7,was:\"30 dk yürüyüş\"},\n  {name:\"Diyet\",color:\"c4\",goal:7}\n];\nfunction defaultState(){\n  return {v:2,habits:PRESET.map(p=>({id:uid(),name:p.name,color:p.color,goal:p.goal})),checks:{},updated:0};\n}\n/* v2: istenen 5 rutini ekle; eski örnekleri işaretleri koruyarak dönüştür */\n/* Sonradan istenen rutinler: her sürümde bir kez eklenir (aynı adda biri yoksa) */\nconst ADDED=[\n  {v:3,name:\"Kitap oku\",match:/kitap/i,color:\"c5\",goal:7},\n  {v:4,name:\"Klip paylaş\",match:/klip/i,color:\"c7\",goal:7}\n];\n/* Sonradan istenen ayar değişiklikleri (gün sırası: 0=Pzt … 6=Paz) */\nconst CHANGES=[\n  {v:5,apply:st=>{\n    st.habits.forEach(h=>{\n      if(/spor/i.test(h.name)){h.days=[1,3,4,6];h.goal=7}\n      if(/yürüyüş|yuruyus/i.test(h.name)){h.goal=7;delete h.days}\n    });\n  }},\n  {v:6,apply:st=>{ // istatistikler için başlangıç günü: ilk işaret ya da bugün\n    st.habits.forEach(h=>{\n      if(h.created) return;\n      let m=null;for(const k in st.checks) if(st.checks[k].includes(h.id)&&(!m||k<m)) m=k;\n      h.created=m||keyOf(new Date());\n    });\n  }}\n];\nfunction migrate(st){\n  let changed=migrateV2(st);\n  ADDED.forEach(a=>{\n    if(st.v>=a.v) return;\n    if(!st.habits.some(h=>a.match.test(h.name))) st.habits.push({id:uid(),name:a.name,color:a.color,goal:a.goal});\n    st.v=a.v;changed=true;\n  });\n  CHANGES.forEach(c=>{if(st.v>=c.v)return;c.apply(st);st.v=c.v;changed=true});\n  return changed;\n}\nfunction migrateV2(st){\n  if(st.v>=2) return false;\n  const used=id=>Object.values(st.checks).some(a=>a.includes(id));\n  const out=[];\n  PRESET.forEach(p=>{\n    const old=st.habits.find(h=>h.name===p.name||(p.was&&h.name===p.was));\n    out.push(old?{...old,name:p.name,goal:p.goal}:{id:uid(),name:p.name,color:p.color,goal:p.goal});\n  });\n  st.habits.forEach(h=>{\n    if(out.some(o=>o.id===h.id)) return;\n    if(h.name===\"20 sayfa kitap\"&&!used(h.id)) return;\n    out.push(h);\n  });\n  st.habits=out;st.v=2;return true;\n}\nfunction readLocal(){try{const s=localStorage.getItem(LS_KEY);return s?JSON.parse(s):null}catch(e){return null}}\nfunction writeLocal(){try{localStorage.setItem(LS_KEY,JSON.stringify(state))}catch(e){}}\n\nlet state=window.__INIT__||readLocal()||defaultState();\nconst migratedLocal=migrate(state);\nlet weekStart=mondayOf(new Date());\nlet remote=null; // db doc reference\nlet saveTimer=null, saving=false, dirty=false;\n\n/* ---------- render ---------- */\nconst goalOf=h=>h.days?7:(h.goal||7);\nconst wd=d=>(d.getDay()+6)%7;\nconst planned=(h,d)=>!h.days||h.days.includes(wd(d));\nconst daysLabel=h=>h.days.map(i=>DAYS[i]).join(\" · \");\nfunction streak(h){\n  const on=d=>(state.checks[keyOf(d)]||[]).includes(h.id);\n  let d=new Date(),n=0,guard=0;\n  if(!on(d)) d=addDays(d,-1);\n  while(guard++<800){\n    if(on(d)) n++;\n    else if(planned(h,d)) break;\n    d=addDays(d,-1);\n  }\n  return n;\n}\nfunction weekCount(hid,mon){let n=0;for(let i=0;i<7;i++)if((state.checks[keyOf(addDays(mon,i))]||[]).includes(hid))n++;return n}\nfunction weekStreak(h){\n  let w=mondayOf(new Date()),n=0;\n  if(weekCount(h.id,w)<goalOf(h)) w=addDays(w,-7);\n  while(weekCount(h.id,w)>=goalOf(h)){n++;w=addDays(w,-7)}\n  return n;\n}\nfunction render(){\n  const today=keyOf(new Date());\n  const days=[...Array(7)].map((_,i)=>addDays(weekStart,i));\n  const end=days[6];\n  const sameMonth=weekStart.getMonth()===end.getMonth();\n  $(\"weekTitle\").textContent=sameMonth\n    ? `${weekStart.getDate()}–${end.getDate()} ${MONTHS[end.getMonth()]}`\n    : `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()].slice(0,3)} – ${end.getDate()} ${MONTHS[end.getMonth()].slice(0,3)}`;\n  $(\"yearLabel\").textContent=`${end.getFullYear()} · ${isoWeek(weekStart)}. hafta`;\n  const isThisWeek=keyOf(weekStart)===keyOf(mondayOf(new Date()));\n  $(\"goToday\").hidden=isThisWeek;\n\n  const g=$(\"grid\");g.innerHTML=\"\";\n  days.forEach((d,i)=>{\n    const h=document.createElement(\"div\");\n    h.className=\"dayhead\"+(keyOf(d)===today?\" is-today\":\"\");\n    h.innerHTML=`<span class=\"dn\">${DAYS[i]}</span><span class=\"dd\">${d.getDate()}</span>`;\n    g.append(h);\n  });\n\n  let done=0,possible=0;\n  if(!state.habits.length){\n    const e=document.createElement(\"div\");e.className=\"empty\";e.style.gridColumn=\"1 / -1\";\n    e.innerHTML=\"<strong>Henüz rutin yok</strong><span>Alttaki “Rutin ekle” ile her gün yapmak istediğin ilk şeyi ekle.</span>\";\n    g.append(e);\n  }\n  state.habits.forEach(h=>{\n    const nb=document.createElement(\"button\");nb.className=\"hname\";nb.style.setProperty(\"--hc\",`var(--${h.color})`);\n    const goal=goalOf(h);\n    if(goal<7){\n      const cnt=weekCount(h.id,weekStart),met=cnt>=goal,ws=weekStreak(h);\n      nb.innerHTML=`<b></b><small class=\"${met?\"met\":\"\"}\">${met?\"Hedef tamam\":\"Haftada \"+goal+\" gün\"} · ${cnt}/${goal}${ws>1?` · ${ws} hafta seri`:\"\"}</small>`;\n      if(days[0]<=new Date()&&active(h,days[6])){possible+=goal;done+=Math.min(cnt,goal)}\n    }else{\n      const s=streak(h);\n      const lead=h.days?daysLabel(h):\"\";\n      const tail=s?`${s} gün seri`:(h.days?\"\":\"Düzenlemek için dokun\");\n      nb.innerHTML=`<b></b><small>${[lead,tail].filter(Boolean).join(\" · \")}</small>`;\n    }\n    nb.querySelector(\"b\").append(document.createTextNode(h.name));\n    nb.onclick=()=>openSheet(h);\n    g.append(nb);\n    days.forEach((d,i)=>{\n      const k=keyOf(d),on=(state.checks[k]||[]).includes(h.id),future=k>today;\n      const plan=planned(h,d);\n      if(!future&&goal===7&&plan&&active(h,d)){possible++;if(on)done++}\n      const c=document.createElement(\"div\");\n      c.className=\"cell\"+(k===today?\" is-today\":\"\")+(future?\" is-future\":\"\")+(plan?\"\":\" is-off\");\n      c.style.setProperty(\"--hc\",`var(--${h.color})`);\n      const b=document.createElement(\"button\");\n      b.setAttribute(\"aria-pressed\",on);b.setAttribute(\"aria-label\",`${h.name}, ${DAYS[i]} ${d.getDate()}`);\n      b.innerHTML=CHECK;b.onclick=()=>toggle(h.id,k);\n      c.append(b);g.append(c);\n    });\n  });\n  fitBoard();\n  const pct=possible?Math.round(done/possible*100):0;\n  $(\"weekStat\").textContent=possible?`${done}/${possible} tamamlandı · %${pct}`:(state.habits.length?\"Bu hafta henüz başlamadı\":\"\");\n  $(\"meterBar\").style.width=pct+\"%\";\n}\n/* Tabloyu ekrana sığdır: kutu boyunu rutin sayısına ve kalan yüksekliğe göre ayarla */\nfunction fitBoard(){\n  const g=$(\"grid\"),n=state.habits.length;\n  g.style.gridTemplateRows=n?`auto repeat(${n}, auto minmax(0,1fr))`:\"\";\n  if(!n) return;\n  g.style.setProperty(\"--box\",\"22px\");\n  const avail=$(\"board\").clientHeight;\n  const head=g.querySelector(\".dayhead\").offsetHeight;\n  let names=0;g.querySelectorAll(\".hname\").forEach(x=>names+=x.offsetHeight);\n  const per=(avail-head-names)/n-8;\n  g.style.setProperty(\"--box\",Math.max(18,Math.min(38,Math.floor(per)))+\"px\");\n}\naddEventListener(\"resize\",()=>fitBoard());\n\nfunction isoWeek(mon){\n  const th=addDays(mon,3);const y=new Date(th.getFullYear(),0,4);\n  return 1+Math.round(((th-mondayOf(y))/864e5)/7);\n}\n\n/* ---------- actions ---------- */\nfunction toggle(hid,k){\n  const arr=state.checks[k]||[];\n  state.checks[k]=arr.includes(hid)?arr.filter(x=>x!==hid):[...arr,hid];\n  if(!state.checks[k].length) delete state.checks[k];\n  commit();\n  if(isOnK({id:hid},k)) celebrate(hid,k);\n}\nfunction commit(){\n  state.updated=Date.now();writeLocal();render();\n  dirty=true;clearTimeout(saveTimer);saveTimer=setTimeout(flush,600);\n}\nasync function flush(){\n  if(!remote||!dirty) return;\n  if(saving){saveTimer=setTimeout(flush,400);return}\n  saving=true;dirty=false;\n  try{await remote.set(JSON.parse(JSON.stringify(state)))}catch(e){dirty=true}\n  saving=false;\n}\n\n/* ---------- sheet ---------- */\nlet editing=null,pickColor=\"c1\",pickGoal=7,pickDays=[],delArmed=false;\nfunction drawGoals(){\n  const w=$(\"goals\");w.innerHTML=\"\";\n  [7,\"days\",6,5,4,3,2,1].forEach(n=>{const b=document.createElement(\"button\");\n    b.textContent=n===7?\"Her gün\":n===\"days\"?\"Belirli günler\":`Haftada ${n}`;b.setAttribute(\"aria-pressed\",n===pickGoal);\n    b.onclick=()=>{pickGoal=n;if(n===\"days\"&&!pickDays.length)pickDays=[0,2,4];drawGoals()};w.append(b)});\n  const p=$(\"dayPick\");p.hidden=pickGoal!==\"days\";p.innerHTML=\"\";\n  DAYS.forEach((d,i)=>{const b=document.createElement(\"button\");\n    b.textContent=d;b.setAttribute(\"aria-pressed\",pickDays.includes(i));\n    b.onclick=()=>{pickDays=pickDays.includes(i)?pickDays.filter(x=>x!==i):[...pickDays,i].sort((a,b)=>a-b);drawGoals()};p.append(b)});\n}\nfunction applyGoal(h){\n  if(pickGoal===\"days\"&&pickDays.length&&pickDays.length<7){h.days=[...pickDays];h.goal=7}\n  else{delete h.days;h.goal=pickGoal===\"days\"?7:pickGoal}\n}\nfunction openSheet(h){\n  editing=h||null;delArmed=false;\n  $(\"sheetTitle\").textContent=h?\"Rutini düzenle\":\"Yeni rutin\";\n  $(\"nameInput\").value=h?h.name:\"\";\n  pickColor=h?h.color:COLORS[state.habits.length%COLORS.length];\n  $(\"delBtn\").hidden=!h;$(\"delBtn\").classList.remove(\"armed\");$(\"delBtn\").textContent=\"Sil\";\n  $(\"orderRow\").hidden=!h||state.habits.length<2;\n  pickGoal=h?(h.days?\"days\":goalOf(h)):7;\n  pickDays=h&&h.days?[...h.days]:[];\n  drawSwatches();drawGoals();$(\"scrim\").hidden=false;\n  setTimeout(()=>{if(!h)$(\"nameInput\").focus()},50);\n}\nfunction closeSheet(){$(\"scrim\").hidden=true;editing=null}\nfunction drawSwatches(){\n  const w=$(\"swatches\");w.innerHTML=\"\";\n  COLORS.forEach(c=>{const b=document.createElement(\"button\");b.style.setProperty(\"--sc\",`var(--${c})`);\n    b.setAttribute(\"aria-pressed\",c===pickColor);b.setAttribute(\"aria-label\",\"Renk \"+c.slice(1));\n    b.onclick=()=>{pickColor=c;drawSwatches()};w.append(b)});\n}\nfunction move(dir){\n  const i=state.habits.indexOf(editing),j=i+dir;\n  if(j<0||j>=state.habits.length) return;\n  [state.habits[i],state.habits[j]]=[state.habits[j],state.habits[i]];commit();\n}\n$(\"upBtn\").onclick=()=>move(-1);\n$(\"downBtn\").onclick=()=>move(1);\n$(\"saveBtn\").onclick=()=>{\n  const name=$(\"nameInput\").value.trim();\n  if(!name){$(\"nameInput\").focus();$(\"nameInput\").placeholder=\"Bir ad yaz\";return}\n  if(editing){editing.name=name;editing.color=pickColor;applyGoal(editing)}\n  else{const h={id:uid(),name,color:pickColor,created:keyOf(new Date())};applyGoal(h);state.habits.push(h)}\n  closeSheet();commit();\n};\n$(\"delBtn\").onclick=()=>{\n  if(!delArmed){delArmed=true;$(\"delBtn\").classList.add(\"armed\");$(\"delBtn\").textContent=\"Emin misin?\";return}\n  const id=editing.id;\n  state.habits=state.habits.filter(h=>h.id!==id);\n  for(const k in state.checks){state.checks[k]=state.checks[k].filter(x=>x!==id);if(!state.checks[k].length)delete state.checks[k]}\n  closeSheet();commit();\n};\n$(\"cancelBtn\").onclick=closeSheet;\n$(\"scrim\").onclick=e=>{if(e.target===$(\"scrim\"))closeSheet()};\n$(\"nameInput\").onkeydown=e=>{if(e.key===\"Enter\")$(\"saveBtn\").click()};\n$(\"addBtn\").onclick=()=>openSheet(null);\n$(\"prev\").onclick=()=>{weekStart=addDays(weekStart,-7);render()};\n$(\"next\").onclick=()=>{weekStart=addDays(weekStart,7);render()};\n$(\"goToday\").onclick=()=>{weekStart=mondayOf(new Date());render()};\n\n/* ---------- tarih / aktiflik yardımcıları ---------- */\nconst APP_VERSION=8;\nconst keyToDate=k=>{const[y,m,d]=k.split(\"-\").map(Number);return new Date(y,m-1,d)};\nconst today0=()=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate())};\nconst isOnK=(h,k)=>(state.checks[k]||[]).includes(h.id);\nconst isWeekly=h=>!h.days&&goalOf(h)<7;\nfunction startOf(h){return h.created?keyToDate(h.created):null}\nfunction active(h,d){const s=startOf(h);return !s||d>=s}\nfunction weekStats(mon){\n  const tk=keyOf(new Date());let done=0,possible=0;\n  for(const h of state.habits){\n    if(isWeekly(h)){\n      const g=goalOf(h);\n      if(mon<=new Date()&&active(h,addDays(mon,6))){possible+=g;done+=Math.min(weekCount(h.id,mon),g)}\n      continue;\n    }\n    for(let i=0;i<7;i++){const d=addDays(mon,i),k=keyOf(d);\n      if(k<=tk&&planned(h,d)&&active(h,d)){possible++;if(isOnK(h,k))done++}}\n  }\n  return {done,possible,pct:possible?Math.round(done/possible*100):null};\n}\n\n/* ---------- seri hesapları ---------- */\nfunction longestStreak(h){\n  const s=startOf(h)||firstCheck(h);if(!s)return 0;\n  const t=today0();let best=0,cur=0;\n  if(isWeekly(h)){\n    for(let w=mondayOf(s);w<=t;w=addDays(w,7)){\n      if(weekCount(h.id,w)>=goalOf(h)){cur++;best=Math.max(best,cur)}\n      else if(keyOf(w)!==keyOf(mondayOf(t)))cur=0;\n    }\n    return best;\n  }\n  for(let d=new Date(s);d<=t;d=addDays(d,1)){\n    const k=keyOf(d);\n    if(isOnK(h,k)){cur++;best=Math.max(best,cur)}\n    else if(planned(h,d)&&k!==keyOf(t))cur=0;\n  }\n  return best;\n}\nfunction firstCheck(h){let m=null;for(const k in state.checks)if(state.checks[k].includes(h.id)&&(!m||k<m))m=k;return m?keyToDate(m):null}\nfunction currentStreak(h){return isWeekly(h)?weekStreak(h):streak(h)}\nfunction monthPct(h,y,m){\n  const t=today0();let done=0,poss=0;\n  if(isWeekly(h)){\n    for(let w=mondayOf(new Date(y,m,1));w<=t&&w<new Date(y,m+1,1);w=addDays(w,7)){\n      if(!active(h,addDays(w,6)))continue;\n      if(keyOf(w)===keyOf(mondayOf(t))&&weekCount(h.id,w)<goalOf(h))continue; // süren hafta henüz bitmedi\n      poss++;if(weekCount(h.id,w)>=goalOf(h))done++;\n    }\n  }else{\n    for(let d=new Date(y,m,1);d.getMonth()===m&&d<=t;d=addDays(d,1)){\n      if(!planned(h,d)||!active(h,d))continue;\n      const k=keyOf(d);\n      if(k===keyOf(t)&&!isOnK(h,k))continue; // bugün henüz bitmedi\n      poss++;if(isOnK(h,k))done++;\n    }\n  }\n  return poss?Math.round(done/poss*100):null;\n}\nfunction weakestDay(h){\n  if(isWeekly(h))return null;\n  const t=today0(),miss=Array(7).fill(0),tot=Array(7).fill(0);\n  for(let i=1;i<=84;i++){const d=addDays(t,-i);\n    if(!planned(h,d)||!active(h,d))continue;\n    tot[wd(d)]++;if(!isOnK(h,keyOf(d)))miss[wd(d)]++;}\n  let bi=-1,br=0;\n  for(let i=0;i<7;i++)if(tot[i]>=2&&miss[i]/tot[i]>br){br=miss[i]/tot[i];bi=i}\n  if(tot.reduce((a,b)=>a+b,0)<5)return {text:\"Yeterli veri yok, birkaç hafta sonra burada en çok aksattığın gün görünecek.\"};\n  if(bi<0)return {text:\"Son 12 haftada hiç aksatmadın.\"};\n  return {text:`En çok aksattığın gün: ${DAY_NAMES[bi]} (%${Math.round(br*100)} kaçırdın)`};\n}\nconst DAY_NAMES=[\"Pazartesi\",\"Salı\",\"Çarşamba\",\"Perşembe\",\"Cuma\",\"Cumartesi\",\"Pazar\"];\n\n/* ---------- rozetler ---------- */\nconst BADGES_D=[[7,\"1 hafta\"],[30,\"1 ay\"],[100,\"100 gün\"],[365,\"1 yıl\"]];\nconst BADGES_W=[[4,\"4 hafta\"],[12,\"12 hafta\"],[26,\"26 hafta\"],[52,\"52 hafta\"]];\nconst MEDAL='<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"14\" r=\"6\"/><path d=\"M8.5 9 6 3h4l2 4 2-4h4l-2.5 6\"/></svg>';\n\n/* ---------- istatistik paneli ---------- */\nlet pMonth=new Date(today0().getFullYear(),today0().getMonth(),1),pView=\"month\",pFilter=\"all\";\nfunction openPanel(){pMonth=new Date(today0().getFullYear(),today0().getMonth(),1);$(\"panel\").hidden=false;drawPanel();$(\"panel\").scrollTop=0}\nfunction closePanel(){$(\"panel\").hidden=true;$(\"exportBox\").hidden=true;$(\"importBox\").hidden=true}\nfunction dayLevel(d){\n  const k=keyOf(d);\n  if(pFilter!==\"all\"){\n    const h=state.habits.find(x=>x.id===pFilter);if(!h)return {o:0};\n    const on=isOnK(h,k);\n    return {o:on?1:0,off:!on&&!isWeekly(h)&&!planned(h,d),hc:`var(--${h.color})`,text:on?\"yapıldı\":\"yapılmadı\"};\n  }\n  let poss=0,done=0,missed=[];\n  for(const h of state.habits){\n    if(isWeekly(h)||!planned(h,d)||!active(h,d))continue;\n    poss++;if(isOnK(h,k))done++;else missed.push(h.name);\n  }\n  const r=poss?done/poss:0;\n  return {o:r?(.25+.75*r):0,r,done,poss,missed,hc:\"var(--accent)\"};\n}\nfunction drawPanel(){\n  // özet\n  const mon=mondayOf(new Date()),a=weekStats(mon),b=weekStats(addDays(mon,-7));\n  const diff=a.pct!=null&&b.pct!=null?a.pct-b.pct:null;\n  $(\"sumCard\").innerHTML=`<div class=\"eyebrow\">Bu hafta</div><div class=\"sumrow\"><span class=\"big\">%${a.pct??0}</span>${diff==null?\"\":`<span class=\"delta ${diff>=0?\"up\":\"down\"}\">${diff>=0?\"+\":\"−\"}${Math.abs(diff)} puan · geçen hafta %${b.pct}</span>`}</div><p class=\"muted\">${a.done}/${a.possible} tamamlandı. ${bestThisWeek()}</p>`;\n  // filtre\n  const ch=$(\"chips\");ch.innerHTML=\"\";\n  [{id:\"all\",name:\"Tümü\",color:\"accent\"},...state.habits].forEach(h=>{\n    const b=document.createElement(\"button\");b.setAttribute(\"aria-pressed\",pFilter===h.id);\n    b.style.setProperty(\"--hc\",`var(--${h.color})`);b.innerHTML=\"<i></i>\";b.append(document.createTextNode(h.name));\n    b.onclick=()=>{pFilter=h.id;drawPanel()};ch.append(b);\n  });\n  $(\"segMonth\").setAttribute(\"aria-pressed\",pView===\"month\");$(\"segYear\").setAttribute(\"aria-pressed\",pView===\"year\");\n  $(\"monthView\").hidden=pView!==\"month\";$(\"yearView\").hidden=pView!==\"year\";\n  if(pView===\"month\")drawMonth();else drawYear();\n  drawHabitStats();\n  $(\"verLabel\").textContent=`Sürüm ${APP_VERSION}${window.__SCRIPT_VERSION__?` · Scriptable ${window.__SCRIPT_VERSION__}`:\"\"}`;\n}\nfunction bestThisWeek(){\n  const mon=mondayOf(new Date());let best=null,bp=-1;\n  for(const h of state.habits){\n    if(isWeekly(h)){const p=Math.min(1,weekCount(h.id,mon)/goalOf(h));if(p>bp){bp=p;best=h}continue}\n    let poss=0,done=0;for(let i=0;i<7;i++){const d=addDays(mon,i);if(d>new Date()||!planned(h,d))continue;poss++;if(isOnK(h,keyOf(d)))done++}\n    if(poss&&done/poss>bp){bp=done/poss;best=h}\n  }\n  return best&&bp>0?`En iyi giden: ${best.name}.`:\"\";\n}\nfunction drawMonth(){\n  const g=$(\"mGrid\"),y=pMonth.getFullYear(),m=pMonth.getMonth(),tk=keyOf(new Date());\n  $(\"mTitle\").textContent=`${MONTHS[m]} ${y}`;\n  g.innerHTML=DAYS.map(d=>`<div class=\"dn\">${d}</div>`).join(\"\");\n  const first=new Date(y,m,1),lead=wd(first);\n  for(let i=0;i<lead;i++)g.insertAdjacentHTML(\"beforeend\",'<div class=\"sq blank\"></div>');\n  for(let d=new Date(first);d.getMonth()===m;d=addDays(d,1)){\n    const k=keyOf(d),L=dayLevel(d),c=document.createElement(\"button\");\n    c.className=\"sq\"+(k===tk?\" today\":\"\")+(k>tk?\" future\":\"\")+(L.off?\" off\":\"\")+(L.o>.6?\" hi\":\"\");\n    c.style.setProperty(\"--hc\",L.hc||\"var(--accent)\");\n    c.innerHTML=`<i style=\"--o:${k>tk?0:L.o}\"></i><span>${d.getDate()}</span>`;\n    const dd=new Date(d);\n    c.onclick=()=>{\n      const t=`${dd.getDate()} ${MONTHS[dd.getMonth()]} ${DAY_NAMES[wd(dd)]}: `;\n      if(k>tk){$(\"dayNote\").textContent=t+\"henüz gelmedi.\";return}\n      if(pFilter!==\"all\"){$(\"dayNote\").textContent=t+(L.off?\"plan dışı gün.\":L.text+\".\");return}\n      $(\"dayNote\").textContent=L.poss?t+`${L.done}/${L.poss} tamam`+(L.missed.length?` · eksik: ${L.missed.join(\", \")}`:\" · hepsi yapıldı\"):t+\"kayıt yok.\";\n    };\n    g.append(c);\n  }\n  $(\"dayNote\").textContent=\"Ayrıntı için bir güne dokun.\";\n}\nfunction drawYear(){\n  const g=$(\"yGrid\"),t=today0(),tk=keyOf(t);g.innerHTML=\"\";\n  const start=addDays(mondayOf(t),-52*7);let lastM=-1,col=0;\n  for(let w=new Date(start);w<=t;w=addDays(w,7),col++){\n    const lab=document.createElement(\"div\");lab.className=\"ml\";lab.style.gridColumn=col+1;\n    if(w.getMonth()!==lastM){lab.textContent=MONTHS[w.getMonth()].slice(0,3);lastM=w.getMonth()}\n    g.append(lab);\n    for(let i=0;i<7;i++){const d=addDays(w,i),k=keyOf(d),L=dayLevel(d),c=document.createElement(\"div\");\n      c.className=\"sq\"+(k>tk?\" blank\":\"\")+(k===tk?\" today\":\"\")+(L.off?\" off\":\"\");c.style.gridColumn=col+1;c.style.gridRow=i+2;\n      c.style.setProperty(\"--hc\",L.hc||\"var(--accent)\");c.innerHTML=k>tk?\"\":`<i style=\"--o:${L.o}\"></i>`;g.append(c)}\n  }\n  requestAnimationFrame(()=>{$(\"yScroll\").scrollLeft=$(\"yScroll\").scrollWidth});\n}\nfunction drawHabitStats(){\n  const y=pMonth.getFullYear(),m=pMonth.getMonth(),box=$(\"habitStats\");box.innerHTML=\"\";\n  $(\"hsTitle\").textContent=`Rutinler · ${MONTHS[m]}`;\n  for(const h of state.habits){\n    const pct=monthPct(h,y,m),cur=currentStreak(h),best=longestStreak(h),wk=isWeekly(h),unit=wk?\"hafta\":\"gün\";\n    const el=document.createElement(\"div\");el.className=\"hs\";el.style.setProperty(\"--hc\",`var(--${h.color})`);\n    const weak=weakestDay(h);\n    el.innerHTML=`<div class=\"hs-top\"><b></b><span class=\"pct\">${pct==null?\"–\":\"%\"+pct}</span></div>\n      <div class=\"bar\"><i style=\"width:${pct||0}%\"></i></div>\n      <div class=\"facts\"><div><small>Şu anki seri</small><strong>${cur} ${unit}</strong></div><div><small>En uzun seri</small><strong>${best} ${unit}</strong></div><div><small>${wk?\"Hedef\":\"Plan\"}</small><strong>${wk?\"Haftada \"+goalOf(h):h.days?h.days.length+\" gün/hafta\":\"Her gün\"}</strong></div></div>\n      ${weak?`<div class=\"weak\">${weak.text}</div>`:\"\"}\n      <div class=\"badges\">${(wk?BADGES_W:BADGES_D).map(([n,l])=>`<span class=\"badge${best>=n?\" got\":\"\"}\">${MEDAL}${l}</span>`).join(\"\")}</div>`;\n    el.querySelector(\"b\").append(document.createTextNode(h.name));\n    box.append(el);\n  }\n}\n$(\"statsBtn\").onclick=openPanel;\n$(\"panelClose\").onclick=closePanel;\n$(\"segMonth\").onclick=()=>{pView=\"month\";drawPanel()};\n$(\"segYear\").onclick=()=>{pView=\"year\";drawPanel()};\n$(\"mPrev\").onclick=()=>{pMonth=new Date(pMonth.getFullYear(),pMonth.getMonth()-1,1);drawPanel()};\n$(\"mNext\").onclick=()=>{pMonth=new Date(pMonth.getFullYear(),pMonth.getMonth()+1,1);drawPanel()};\n\n/* ---------- yedek ---------- */\n$(\"exportBtn\").onclick=async()=>{\n  $(\"importBox\").hidden=true;$(\"exportBox\").hidden=false;\n  const t=$(\"exportText\");t.value=JSON.stringify({app:\"haftalik-rutin\",saved:new Date().toISOString(),...state});\n  try{await navigator.clipboard.writeText(t.value);$(\"exportMsg\").textContent=\"Kopyalandı. Notlar'a ya da bir mesaja yapıştırıp sakla.\"}\n  catch(e){t.focus();t.select();t.setSelectionRange(0,t.value.length);$(\"exportMsg\").textContent=\"Metni seçtim; Kopyala'ya dokunup bir yere yapıştır.\"}\n};\nlet importArmed=false;\n$(\"importBtn\").onclick=()=>{$(\"exportBox\").hidden=true;$(\"importBox\").hidden=false;importArmed=false;$(\"importDo\").textContent=\"Geri yükle\";$(\"importMsg\").textContent=\"Mevcut verilerin yedektekilerle değiştirilir.\"};\n$(\"importDo\").onclick=()=>{\n  let data;\n  try{data=JSON.parse($(\"importText\").value.trim())}catch(e){$(\"importMsg\").textContent=\"Bu metin bir Rutin yedeği değil. Yedeği eksiksiz yapıştırdığından emin ol.\";return}\n  if(!data||!Array.isArray(data.habits)||typeof data.checks!==\"object\"){$(\"importMsg\").textContent=\"Yedekte rutin listesi bulunamadı.\";return}\n  if(!importArmed){importArmed=true;$(\"importDo\").textContent=`Evet, ${data.habits.length} rutini yükle`;$(\"importMsg\").textContent=\"Emin misin? Şu anki işaretlerin silinip yedektekiler gelecek.\";return}\n  delete data.app;delete data.saved;\n  state=data;migrate(state);commit();\n  $(\"importBox\").hidden=true;$(\"importText\").value=\"\";drawPanel();\n  $(\"exportMsg\").textContent=\"\";$(\"backupInfo\").textContent=\"Yedek yüklendi.\";\n};\n\n/* ---------- kutlama ---------- */\nfunction celebrate(hid,k){\n  const h=state.habits.find(x=>x.id===hid);if(!h||!isOnK(h,k))return;\n  const tk=keyOf(new Date()),yk=keyOf(addDays(new Date(),-1));\n  if(isWeekly(h)){\n    const c=weekCount(h.id,mondayOf(keyToDate(k)));\n    if(c===goalOf(h)){\n      const ws=weekStreak(h),hit=BADGES_W.find(([n])=>n===ws);\n      return showCele(h,hit?ws:c,hit?\"hafta üst üste\":`/${goalOf(h)} · haftalık hedef tamam`,hit?`${hit[1]} rozeti kazandın`:h.name);\n    }\n    return;\n  }\n  if(k===tk||k===yk){\n    const s=streak(h),hit=BADGES_D.find(([n])=>n===s);\n    if(hit)return showCele(h,s,\"gün seri\",`${h.name} · ${hit[1]} rozeti`);\n  }\n  if(k===tk){\n    const d=today0(),todays=state.habits.filter(x=>!isWeekly(x)&&planned(x,d));\n    if(todays.length&&todays.every(x=>isOnK(x,tk)))return showCele({color:\"c1\"},todays.length,\"rutinin hepsi bugün tamam\",\"Harika bir gün!\");\n  }\n}\nlet celeTimer=null;\nfunction showCele(h,num,label,sub){\n  const c=$(\"celeCard\");c.style.setProperty(\"--hc\",`var(--${h.color})`);\n  c.innerHTML=`<div class=\"num\">${num}</div><div class=\"lbl\"></div><div class=\"sub2\"></div>`;\n  c.querySelector(\".lbl\").textContent=label;c.querySelector(\".sub2\").textContent=sub;\n  $(\"celebrate\").hidden=false;confetti(getComputedStyle(c).getPropertyValue(\"--hc\"));\n  clearTimeout(celeTimer);celeTimer=setTimeout(()=>{$(\"celebrate\").hidden=true},2800);\n}\n$(\"celebrate\").onclick=()=>{$(\"celebrate\").hidden=true};\nfunction confetti(){\n  if(matchMedia(\"(prefers-reduced-motion: reduce)\").matches)return;\n  const cv=$(\"confetti\"),ctx=cv.getContext(\"2d\"),W=cv.width=innerWidth*devicePixelRatio,H=cv.height=innerHeight*devicePixelRatio;\n  const cs=getComputedStyle(document.documentElement),cols=[\"--c1\",\"--c2\",\"--c3\",\"--c4\",\"--c5\",\"--c6\",\"--c13\"].map(v=>cs.getPropertyValue(v).trim());\n  const ps=[...Array(140)].map(()=>({x:W/2,y:H*.45,vx:(Math.random()-.5)*W*.03,vy:-Math.random()*H*.025-H*.005,r:(4+Math.random()*5)*devicePixelRatio,c:cols[Math.random()*cols.length|0],a:Math.random()*6,s:(Math.random()-.5)*.3}));\n  const t0=performance.now();\n  (function f(t){const e=t-t0;ctx.clearRect(0,0,W,H);\n    for(const p of ps){p.vy+=H*.0009;p.x+=p.vx;p.y+=p.vy;p.vx*=.99;p.a+=p.s;\n      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.globalAlpha=Math.max(0,1-e/2400);ctx.fillStyle=p.c;ctx.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);ctx.restore()}\n    if(e<2400)requestAnimationFrame(f);else ctx.clearRect(0,0,W,H)})(t0);\n}\n\n/* ---------- swipe between weeks ---------- */\nlet sx=null,sy=null;\n$(\"grid\").addEventListener(\"touchstart\",e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});\n$(\"grid\").addEventListener(\"touchend\",e=>{\n  if(sx===null)return;const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;sx=null;\n  if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){weekStart=addDays(weekStart,dx<0?7:-7);render()}\n});\n\nif(migratedLocal) commit(); else render();\n\n/* ---------- uygulama ---------- */\nlet lastDay=keyOf(new Date());\ndocument.addEventListener(\"visibilitychange\",()=>{\n  if(document.visibilityState!==\"visible\") return;\n  const t=keyOf(new Date());\n  if(t!==lastDay){lastDay=t;weekStart=mondayOf(new Date())}\n  render();\n});\nif(\"serviceWorker\" in navigator) navigator.serviceWorker.register(\"sw.js\").catch(()=>{});\n/* ---------- tek uygulama: web sürümü verileri Scriptable'a taşır, sonra onu açar ---------- */\nconst SCRIPTABLE_URL=\"scriptable:///run/Rutin\";\nfunction exportParam(){return btoa(unescape(encodeURIComponent(JSON.stringify(state)))).replace(/\\+/g,\"-\").replace(/\\//g,\"_\").replace(/=+$/,\"\")}\nfunction lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}\nfunction lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}\nfunction showLauncher(){\n  const moved=lsGet(\"rutin-moved\");\n  const nChecks=Object.values(state.checks).reduce((a,b)=>a+b.length,0);\n  const nDays=Object.keys(state.checks).length;\n  $(\"launch\").hidden=false;\n  if(moved||!nChecks){\n    $(\"lTitle\").textContent=\"Rutin açılıyor…\";\n    $(\"lText\").textContent=\"Rutin artık Scriptable'da. Açılmazsa aşağıdaki düğmeye dokun.\";\n    $(\"moveBtn\").textContent=\"Rutin'i aç\";\n    $(\"moveInfo\").textContent=\"Scriptable yüklü değilse App Store'dan indir.\";\n    $(\"againBtn\").hidden=!nChecks;\n    $(\"moveBtn\").onclick=()=>{location.href=SCRIPTABLE_URL};\n    setTimeout(()=>{location.href=SCRIPTABLE_URL},400);\n  }else{\n    $(\"moveInfo\").textContent=`Bu telefondaki ${state.habits.length} rutin ve ${nDays} günlük işaretin Scriptable'daki Rutin'e eklenecek. Oradaki işaretlerin silinmez.`;\n    $(\"moveBtn\").onclick=moveData;\n  }\n}\nfunction moveData(){lsSet(\"rutin-moved\",new Date().toISOString());location.href=SCRIPTABLE_URL+\"?import=\"+exportParam()}\n$(\"againBtn\").onclick=moveData;\n$(\"openOld\").onclick=()=>{$(\"launch\").hidden=true};\nif(!window.__INIT__) showLauncher();\n</script>\n</body>\n</html>\n";

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
/* ---------- web sürümünden taşıma ---------- */
const CATS = [["su", /\bsu\b/i], ["spor", /spor/i], ["uyku", /uyku/i], ["yuruyus", /yürüyüş|yuruyus/i], ["diyet", /diyet/i], ["kitap", /kitap/i], ["klip", /klip/i]];
const catOf = name => { const c = CATS.find(([, re]) => re.test(name)); return c ? c[0] : name.trim().toLocaleLowerCase("tr"); };
async function importFromWeb(b64) {
  const say = async (title, message) => { const a = new Alert(); a.title = title; a.message = message; a.addAction("Tamam"); await a.presentAlert(); };
  let data;
  try {
    let s = String(b64).trim().replace(/-/g, "+").replace(/_/g, "/").replace(/ /g, "+");
    while (s.length % 4) s += "=";
    data = JSON.parse(Data.fromBase64String(s).toRawString());
  } catch (e) {
    await say("Taşınamadı", "Web sürümünden gelen veri okunamadı. Web uygulamasında “Verileri yeniden taşı”yı dene.");
    return;
  }
  if (!data || !Array.isArray(data.habits) || typeof data.checks !== "object") { await say("Taşınamadı", "Gelen veride rutin bulunamadı."); return; }
  const hadChecks = Object.keys(state.checks).length > 0;
  const idMap = {};
  if (!hadChecks) {
    state.habits = JSON.parse(JSON.stringify(data.habits));
    data.habits.forEach(h => { idMap[h.id] = h.id; });
    state.checks = {};
  } else {
    for (const ih of data.habits) {
      const ex = state.habits.find(h => h.id === ih.id) || state.habits.find(h => catOf(h.name) === catOf(ih.name));
      if (ex) {
        ex.name = ih.name; ex.color = ih.color; ex.goal = ih.goal;
        if (ih.days) ex.days = ih.days; else delete ex.days;
        if (ih.created && (!ex.created || ih.created < ex.created)) ex.created = ih.created;
        idMap[ih.id] = ex.id;
      } else {
        state.habits.push(JSON.parse(JSON.stringify(ih)));
        idMap[ih.id] = ih.id;
      }
    }
  }
  let added = 0;
  for (const k in data.checks) {
    for (const id of data.checks[k]) {
      const nid = idMap[id];
      if (!nid) continue;
      const arr = state.checks[k] || (state.checks[k] = []);
      if (!arr.includes(nid)) { arr.push(nid); added++; }
    }
  }
  state.v = Math.max(state.v || 0, data.v || 0);
  save();
  await say("Veriler taşındı", `${data.habits.length} rutin ve ${added} işaret Rutin'e eklendi. Bundan sonra ana ekrandaki Rutin simgesi doğrudan burayı açacak.`);
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
  // Yeni sürüm indirildi: hemen yeni sürümle aç (gelen parametreleri koru)
  const q = Object.entries(args.queryParameters || {}).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");
  Safari.open(URLScheme.forRunningScript() + (q ? "?" + q : ""));
} else {
  if (args.queryParameters && args.queryParameters.import) await importFromWeb(args.queryParameters.import);
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
