// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: calendar-check;

// Haftalık Rutin — Scriptable betiği
// • Ana ekrandaki widget: bu haftanın tablosu (büyük), bugünün durumu (orta / küçük)
// • Widget'a dokununca ya da betiği çalıştırınca: Rutin uygulaması (index.html ile aynı arayüz)
// Bu dosya build_scriptable.py ile üretilir; arayüzü değiştirmek için index.html'i düzenle.
// Veriler iCloud Drive > Scriptable > rutin.json dosyasında tutulur.

const SCRIPT_VERSION = 20;
const FILE_NAME = "rutin.json";
const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const DAYS_SHORT = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];
const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const COLORS = { c1: "#34d399", c2: "#fb923c", c3: "#60a5fa", c4: "#f472b6", c5: "#facc15", c6: "#a78bfa", c7: "#2dd4bf", c8: "#f87171", c9: "#818cf8", c10: "#a3e635", c11: "#f59e0b", c12: "#94a3b8", c13: "#38bdf8" };
const COLORS_LIGHT = { c1: "#059669", c2: "#ea580c", c3: "#2563eb", c4: "#db2777", c5: "#ca8a04", c6: "#7c3aed", c7: "#0d9488", c8: "#dc2626", c9: "#4f46e5", c10: "#65a30d", c11: "#b45309", c12: "#475569", c13: "#0284c7" };
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
/* ---------- GitHub Gist senkronizasyonu (ana ekrandaki Rutin uygulamasıyla ortak veri) ---------- */
// Anahtar ve gist kimliği uygulamadaki "Scriptable'ı bağla" düğmesiyle gelir ve Keychain'de saklanır.
const KC_TOKEN = "rutin-gist-token", KC_ID = "rutin-gist-id", GIST_FILE = "rutin.json";
let needPush = false;
function syncCfg() {
  try { if (Keychain.contains(KC_TOKEN) && Keychain.contains(KC_ID)) return { token: Keychain.get(KC_TOKEN), id: Keychain.get(KC_ID) }; } catch (e) {}
  return null;
}
async function gist(cfg, method, body) {
  const r = new Request(`https://api.github.com/gists/${cfg.id}` + (method === "GET" ? `?t=${Date.now()}` : ""));
  r.method = method;
  r.headers = { Authorization: "Bearer " + cfg.token, Accept: "application/vnd.github+json", "Content-Type": "application/json", "User-Agent": "Rutin-Scriptable" };
  r.timeoutInterval = 8;
  if (body) r.body = JSON.stringify(body);
  const j = await r.loadJSON();
  const code = r.response && r.response.statusCode;
  if (code && code >= 300) throw new Error("GitHub " + code);
  return j;
}
async function readRemote(cfg) {
  const g = await gist(cfg, "GET");
  const f = g && g.files && g.files[GIST_FILE];
  if (!f) return null;
  const txt = f.truncated ? await new Request(f.raw_url).loadString() : f.content;
  const d = JSON.parse(txt);
  return d && Array.isArray(d.habits) ? d : null;
}
async function withRemote(st) {
  const cfg = syncCfg();
  if (!cfg) return st;
  try {
    const r = await readRemote(cfg);
    if (r && (r.updated || 0) > (st.updated || 0)) { fm.writeString(path, JSON.stringify(r)); return r; }
    if (!r || (r.updated || 0) < (st.updated || 0)) needPush = true;
  } catch (e) {}
  return st;
}
async function pushRemote() {
  const cfg = syncCfg();
  if (!cfg || !needPush) return;
  try { await gist(cfg, "PATCH", { files: { [GIST_FILE]: { content: JSON.stringify(state) } } }); needPush = false; } catch (e) {}
}
async function linkSync(param) {
  const say = async (title, message) => { const a = new Alert(); a.title = title; a.message = message; a.addAction("Tamam"); await a.presentAlert(); };
  const [token, id] = String(param).split("|");
  if (!token || !id) { await say("Bağlanamadı", "Bağlantı bilgisi eksik geldi. Uygulamada “Scriptable'ı bağla”ya yeniden dokun."); return; }
  const cfg = { token, id };
  let r = null;
  try { r = await readRemote(cfg); }
  catch (e) { await say("Bağlanamadı", "GitHub'a ulaşılamadı. İnternet bağlantını kontrol edip uygulamada “Scriptable'ı bağla”ya yeniden dokun."); return; }
  Keychain.set(KC_TOKEN, token); Keychain.set(KC_ID, id);
  if (r) {
    // eski Scriptable verisini yedekle, uygulamadaki veriyi esas al
    try {
      const dir = fm.joinPath(fm.documentsDirectory(), "Rutin Yedekleri");
      if (!fm.fileExists(dir)) fm.createDirectory(dir, true);
      fm.writeString(fm.joinPath(dir, `rutin-baglanti-oncesi-${Date.now()}.json`), JSON.stringify(state));
    } catch (e) {}
    for (const k of Object.keys(state)) delete state[k];
    Object.assign(state, r);
    fm.writeString(path, JSON.stringify(state));
  }
  await say("Bağlandı ✓", "Widget'lar ve bildirimler artık ana ekrandaki Rutin uygulamasındaki verileri kullanıyor. Uygulamaya geri dönebilirsin.");
}

async function load() {
  if (!fm.fileExists(path)) return await withRemote(defaultState());
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
    // v9: her Pazartesi kilo ölçümü
    if (!(st.v >= 9)) {
      if (!st.habits.some(h => /kilo|tart/i.test(h.name)))
        st.habits.push({ id: uid(), name: "Kilo ölçümü", color: "c11", goal: 7, days: [0], measure: { unit: "kg" }, notify: { mode: "times", times: ["09:00"] }, created: keyOf(new Date()) });
      st.v = Math.max(st.v || 0, 9); changed = true;
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
    return await withRemote(st);
  } catch (e) {
    return defaultState();
  }
}
function save() { state.updated = Date.now(); fm.writeString(path, JSON.stringify(state)); needPush = true; }

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
const fmtN = n => Number(n).toLocaleString("tr-TR", { maximumFractionDigits: 2 });
const listHabits = () => state.habits.filter(h => !h.measure); // kilo ölçümü widget listesinde değil, ayrı
const mealsOf = (h, k) => (state.meals && state.meals[k] && state.meals[k][h.id]) || [0, 0, 0];
const valOf = (h, k) => state.values && state.values[k] && state.values[k][h.id];
function lastValues(h) { const out = []; for (const k in (state.values || {})) if (state.values[k][h.id] != null) out.push([k, state.values[k][h.id]]); return out.sort((a, b) => a[0] < b[0] ? -1 : 1); }
function setVal(h, k, v) {
  state.values = state.values || {};
  const day = state.values[k] || (state.values[k] = {});
  day[h.id] = v;
  const arr = (state.checks[k] || []).filter(x => x !== h.id); arr.push(h.id); state.checks[k] = arr;
  save();
}
const qtyOf = (h, k) => (state.counts && state.counts[k] && state.counts[k][h.id]) || 0;
function setQty(h, k, v) {
  v = Math.max(0, Math.round(v * 1000) / 1000);
  state.counts = state.counts || {};
  const day = state.counts[k] || (state.counts[k] = {});
  if (v > 0) day[h.id] = v; else delete day[h.id];
  if (!Object.keys(day).length) delete state.counts[k];
  const arr = (state.checks[k] || []).filter(x => x !== h.id);
  if (v >= h.qty.target) arr.push(h.id);
  if (arr.length) state.checks[k] = arr; else delete state.checks[k];
  save();
}
const dateOf = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
const planned = (h, k) => !(state.off && state.off[k]) && (!h.days || h.days.includes(wd(dateOf(k)))); // izinli günler hiçbir rutine sayılmaz
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
  const today = keyOf(new Date());
  const lv = h.measure ? lastValues(h) : [];
  if (h.measure) return lv.length ? `Son: ${fmtN(lv[lv.length - 1][1])} ${h.measure.unit}` + (lv.length > 1 ? ` (${lv[lv.length - 1][1] - lv[lv.length - 2][1] > 0 ? "+" : "−"}${fmtN(Math.abs(lv[lv.length - 1][1] - lv[lv.length - 2][1]))})` : "") : `Her ${["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"][h.days ? h.days[0] : 0]}`;
  const lead = h.days ? daysLabel(h) : h.meals ? `Bugün ${mealsOf(h, today).filter(Boolean).length}/3 öğün` : h.qty ? `Bugün ${fmtN(qtyOf(h, today))}/${fmtN(h.qty.target)} ${h.qty.unit || ""}`.trim() : "";
  const tail = s ? `${s} gün seri` : (h.days ? "" : "Her gün");
  return [lead, tail].filter(Boolean).join(" · ");
}
function weekStats(mon) {
  const today = keyOf(new Date());
  let done = 0, possible = 0;
  for (const h of listHabits()) {
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
  g.colors = [new Color("#26285a"), new Color("#0d0e1d")]; // uygulamanın koyu temasıyla aynı gece mavisi
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
    img.tintColor = Color.white();
  } else if (h.meals && mealsOf(h, k).some(Boolean)) {
    b.backgroundColor = new Color(COLORS[h.color] || COLORS.c1, 0.2 + 0.55 * mealsOf(h, k).filter(Boolean).length / 3);
    if (k === today) { b.borderColor = GOLD; b.borderWidth = 2; }
  } else if (h.qty && qtyOf(h, k) > 0) {
    b.backgroundColor = new Color(COLORS[h.color] || COLORS.c1, 0.2 + 0.55 * Math.min(1, qtyOf(h, k) / h.qty.target));
    if (k === today) { b.borderColor = GOLD; b.borderWidth = 2; }
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
  const compact = listHabits().length > 6;
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

  const shown = listHabits().slice(0, 7);
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
  if (listHabits().length > shown.length) {
    w.addSpacer(4);
    text(w, `+${listHabits().length - shown.length} rutin daha`, Font.mediumSystemFont(10), MUTED);
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
  const shown = listHabits().slice(0, 7);
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
  const doneToday = listHabits().filter(h => isOn(h.id, today)).length;
  text(w, "BUGÜN", Font.semiboldSystemFont(10), GOLD);
  text(w, `${doneToday}/${listHabits().length}`, Font.heavyRoundedSystemFont(34), WHITE);
  w.addSpacer();
  const row = w.addStack();
  listHabits().slice(0, 7).forEach((h, i, a) => { box(row, a.length > 6 ? 14 : 16, h, today, today); if (i < a.length - 1) row.addSpacer(a.length > 6 ? 3 : 4); });
  w.addSpacer(6);
  text(w, `Hafta %${weekStats(mondayOf(new Date())).pct}`, Font.mediumSystemFont(10), MUTED);
  return w;
}
/* ---------- kilit ekranı widget'ları ---------- */
function todayStatus() {
  const d = new Date(), k = keyOf(d);
  const list = listHabits().filter(h => goalOf(h) === 7 && planned(h, k));
  const done = list.filter(h => isOn(h.id, k));
  return { list, done, left: list.filter(h => !isOn(h.id, k)) };
}
function ring(pct, size) {
  const c = new DrawContext();
  c.size = new Size(size, size); c.opaque = false; c.respectScreenScale = true;
  const lw = size * 0.11, r = size / 2 - lw / 2 - 1, cx = size / 2, cy = size / 2;
  const arc = (from, to, color) => {
    const p = new Path(), steps = 64;
    for (let i = 0; i <= steps; i++) {
      const a = -Math.PI / 2 + (from + (to - from) * i / steps) * 2 * Math.PI;
      const pt = new Point(cx + r * Math.cos(a), cy + r * Math.sin(a));
      i ? p.addLine(pt) : p.move(pt);
    }
    c.addPath(p); c.setStrokeColor(color); c.setLineWidth(lw); c.strokePath();
  };
  arc(0, 1, new Color("#ffffff", 0.25));
  if (pct > 0) arc(0, Math.min(1, pct), Color.white());
  return c.getImage();
}
function accessoryWidget(fam) {
  const w = new ListWidget();
  const s = todayStatus(), n = s.list.length, dn = s.done.length, pct = n ? dn / n : 0;
  if (fam === "accessoryInline") {
    w.addText(n ? (s.left.length ? `Rutin ${dn}/${n} · ${s.left.map(h => h.name).slice(0, 2).join(", ")} kaldı` : `Rutin ${dn}/${n} · hepsi tamam`) : "Rutin");
    return w;
  }
  if (fam === "accessoryCircular") return circularWithText(pct, `${dn}/${n}`);
  // accessoryRectangular
  const top = w.addStack(); top.centerAlignContent();
  const t = top.addText("RUTİN"); t.font = Font.semiboldSystemFont(11);
  top.addSpacer();
  const c = top.addText(`${dn}/${n}`); c.font = Font.boldRoundedSystemFont(13);
  w.addSpacer(2);
  const bar = w.addImage(barImage(pct)); bar.imageSize = new Size(150, 6);
  w.addSpacer(3);
  const msg = n ? (s.left.length ? s.left.map(h => h.name).join(", ") : "Bugün hepsi tamam!") : "Bugün plan yok";
  const m = w.addText(s.left.length ? "Kalan: " + msg : msg); m.font = Font.mediumSystemFont(11); m.lineLimit = 2; m.minimumScaleFactor = 0.8;
  return w;
}
function circularWithText(pct, label) {
  const size = 60, c = new DrawContext();
  c.size = new Size(size, size); c.opaque = false; c.respectScreenScale = true;
  c.drawImageInRect(ring(pct, size), new Rect(0, 0, size, size));
  c.setFont(Font.boldRoundedSystemFont(label.length > 3 ? 14 : 17)); c.setTextColor(Color.white()); c.setTextAlignedCenter();
  c.drawTextInRect(label, new Rect(0, size / 2 - 11, size, 22));
  const w = new ListWidget();
  w.addAccessoryWidgetBackground = true;
  const img = w.addImage(c.getImage()); img.imageSize = new Size(size, size); img.centerAlignImage();
  return w;
}
function barImage(pct) {
  const c = new DrawContext();
  c.size = new Size(300, 12); c.opaque = false; c.respectScreenScale = true;
  const bg = new Path(); bg.addRoundedRect(new Rect(0, 0, 300, 12), 6, 6);
  c.addPath(bg); c.setFillColor(new Color("#ffffff", 0.25)); c.fillPath();
  if (pct > 0) { const f = new Path(); f.addRoundedRect(new Rect(0, 0, Math.max(12, 300 * pct), 12), 6, 6); c.addPath(f); c.setFillColor(Color.white()); c.fillPath(); }
  return c.getImage();
}
function buildWidget() {
  const fam = config.widgetFamily || "large";
  if (String(fam).startsWith("accessory")) {
    const w = accessoryWidget(fam);
    w.url = URLScheme.forRunningScript();
    w.refreshAfterDate = new Date(Date.now() + 10 * 60 * 1000);
    return w;
  }
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
  needPush = true;
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

/* ---------- bildirimler ---------- */
// Her rutin adına göre eşleşir. times: sabit saatler ("SS:DD"); random: o gün içinde rastgele N saat.
// Rutin o gün işaretlendiyse kalan bildirimleri gelmez (skipIfDone). Diyet öğün hatırlatmaları her zaman gelir.
const NOTIFY = [
  { match: /\bsu\b/i, skipIfDone: true, times: ["09:00", "12:00", "15:00", "18:00", "21:00"],
    title: "💧 Su vakti", body: (h, day, k) => h.qty
      ? (k === keyOf(new Date()) && qtyOf(h, k) > 0
        ? `Bugün ${fmtN(qtyOf(h, k))} / ${fmtN(h.qty.target)} ${h.qty.unit} içtin. Bir bardak daha!`
        : `Bir bardak su iç. Günlük hedef: ${fmtN(h.qty.target)} ${h.qty.unit}.`)
      : "Bir bardak su iç. Günlük hedef: 2 litre." },
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
  { match: /kilo|tart/i, skipIfDone: true, times: ["09:00"],
    title: "⚖️ Haftalık tartı", body: h => { const lv = lastValues(h); const t = state.profile && state.profile.target, last = lv.length ? lv[lv.length - 1][1] : null;
      return "Hafta başı! Tartıl ve kilonu Rutin'e yaz." + (last != null ? ` Geçen ölçüm: ${fmtN(last)} kg.` : "") + (t && last != null && Math.abs(last - t) >= 0.2 ? ` Hedefe ${fmtN(Math.round(Math.abs(last - t) * 10) / 10)} kg kaldı.` : ""); } },
  { match: /uyku/i, skipIfDone: true, times: ["23:00"],
    title: "🌙 Uyku vakti", body: () => "Ekranı bırak, düzenli uyku için yatma vakti." },
];
// Uygulamada rutinin "Bildirim" ayarı değiştirildiyse o kullanılır; yoksa yukarıdaki varsayılan
function ruleFor(h) {
  const base = NOTIFY.find(r => r.match.test(h.name));
  const n = h.notify;
  if (!n) return base || null;
  if (n.mode === "off") return null;
  const r = Object.assign({ skipIfDone: true, title: `🔔 ${h.name}`, body: () => `${h.name} için hatırlatma.` }, base || {});
  r.baseTimes = base && base.times;
  if (n.mode === "times" && n.times && n.times.length) { r.times = n.times; delete r.random; }
  else if (n.mode === "random" && n.random) { r.random = n.random; delete r.times; }
  else if (!r.times && !r.random) return null;
  return r;
}
function nearestIdx(times, m) {
  if (!times || !times.length) return 0;
  let bi = 0, bd = Infinity;
  times.forEach((t, i) => { const d = Math.abs(toMin(t) - m); if (d < bd) { bd = d; bi = i; } });
  return bi;
}
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
      const rule = ruleFor(h);
      if (!rule) continue;
      if (!planned(h, k)) continue;
      if (rule.skipIfDone && isOn(h.id, k)) continue;
      if (rule.skipIfWeekGoal && weekCount(h.id, mondayOf(day)) >= goalOf(h)) continue;
      const mins = rule.times ? rule.times.map(toMin) : randomTimes(k + h.id, rule.random);
      const bodies = rule.body(h, day, k);
      // miktarlı rutinde bugünün miktarı değişince bildirim metni de yenilensin
      const tag = h.qty && k === keyOf(now) ? `-${qtyOf(h, k)}` : "";
      mins.forEach((m, i) => {
        const at = new Date(day); at.setHours(Math.floor(m / 60), m % 60, 0, 0);
        if (at <= now) return;
        // başlık listesi varsa (Diyet: kahvaltı/öğle/akşam) en yakın varsayılan saatin başlığı kullanılır
        const j = Array.isArray(rule.title) ? nearestIdx(rule.baseTimes || rule.times, m) : i;
        // öğün takibi: o öğünü diyete uygun işaretlediysen hatırlatma gelmez
        if (h.meals && mealsOf(h, k)[Math.min(j, 2)]) return;
        wanted.push({
          id: `rutin-${k}-${h.id}-${i}${tag}`, at,
          title: Array.isArray(rule.title) ? rule.title[j] : rule.title,
          body: Array.isArray(bodies) ? bodies[j] : bodies,
        });
      });
    }
  }
  const hsh = str => { let x = 7; for (const c of str) x = (x * 31 + c.codePointAt(0)) >>> 0; return x; };
  // Sabah planı 08:00: bugünün rutinleri, özel günler, tarihli notlar ve bir motivasyon cümlesi
  const QUOTES = [
    "Küçük adımlar, büyük değişimler.", "Bugün dünden biraz daha iyi olman yeter.", "Disiplin, motivasyon bittiğinde devam etmektir.",
    "Mükemmel olmak zorunda değilsin, sadece başla.", "Her gün %1 daha iyi: bir yılda 37 kat.", "Alışkanlıklar seni, sen alışkanlıklarını şekillendirirsin.",
    "Zincirini kırma.", "Yorgunken yapılan küçük şey, hiç yapmamaktan iyidir.", "Bugünün emeği, yarının rahatlığı.", "Kendine verdiğin sözü tut.",
    "Ritim kur, gerisi gelir.", "Seri bozulsa da yarın yeniden başlarsın.", "Bir bardak su, bir sayfa kitap, bir adım: hepsi sayılır.", "Hedefe giden yol tekrar etmekten geçer.",
  ];
  for (let d = 0; d < NOTIFY_DAYS; d++) {
    const day = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), d), k = keyOf(day);
    const at = new Date(day); at.setHours(8, 0, 0, 0);
    if (at <= now) continue;
    const q = QUOTES[Math.floor(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()) / 864e5) % QUOTES.length];
    if (state.off && state.off[k]) {
      wanted.push({ id: `rutin-sabah-${k}-izin`, at, title: "☀️ Günaydın", body: `Bugün izinli günün, rutinlerin seni bekler. ${q}` });
      continue;
    }
    const todays = listHabits().filter(h => goalOf(h) === 7 && planned(h, k));
    const extras = [];
    if (listHabits().some(h => /spor/i.test(h.name) && h.days && planned(h, k))) extras.push("Spor günü 💪");
    const mh = state.habits.find(h => h.measure);
    if (mh && planned(mh, k) && !lastValues(mh).some(p => p[0] >= keyOf(mondayOf(day)))) extras.push("Tartı günü ⚖️");
    const dated = (state.goals || []).filter(g => !g.done && g.remind === "date" && g.at && g.at.slice(0, 10) === k);
    if (dated.length) extras.push(`📌 ${dated.length === 1 ? dated[0].text.slice(0, 40) : dated.length + " notun var"}`);
    const body = `Bugün ${todays.length} rutinin var` + (extras.length ? ` · ${extras.join(" · ")}` : "") + `.\n“${q}”`;
    wanted.push({ id: `rutin-sabah-${k}-${hsh(body) % 100000}`, at, title: "☀️ Günaydın", body });
  }
  // Akşam özeti 21:00: o gün kalan rutinler (hepsi bittiyse ya da izinli günse gelmez)
  for (let d = 0; d < NOTIFY_DAYS; d++) {
    const day = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), d), k = keyOf(day);
    const at = new Date(day); at.setHours(21, 0, 0, 0);
    if (at <= now || (state.off && state.off[k])) continue;
    const plannedToday = listHabits().filter(h => goalOf(h) === 7 && planned(h, k));
    const left = plannedToday.filter(h => !isOn(h.id, k));
    if (!left.length) continue;
    const names = left.map(h => h.qty ? `${h.name} (${fmtN(qtyOf(h, k))}/${fmtN(h.qty.target)} ${h.qty.unit})` : h.meals ? `${h.name} (${mealsOf(h, k).filter(Boolean).length}/3 öğün)` : h.name);
    const body = d === 0
      ? `Bugün ${left.length} rutin kaldı: ${names.join(", ")}.`
      : `Bugünkü rutinlerini işaretledin mi? ${plannedToday.length} rutinin var.`;
    // aynı dakikadaki tekil rutin bildirimleri özetle birleşsin (iki bildirim üst üste gelmesin)
    for (let i = wanted.length - 1; i >= 0; i--) if (wanted[i].id.startsWith(`rutin-${k}-`) && +wanted[i].at === +at) wanted.splice(i, 1);
    wanted.push({ id: `rutin-aksam-${k}-${d === 0 ? left.map(h => h.id + qtyOf(h, k) + mealsOf(h, k).join("")).join(".") : "x"}`, at, title: "🌙 Akşam özeti", body });
  }
  // Unutma notları: seçilen sıklıkta, 10:00–21:00 arası rastgele bir saatte hedef metni
  const dayNum = d => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
  for (const g of (state.goals || [])) {
    if (g.done || !g.remind || g.remind === "off") continue;
    if (g.remind === "date") { // tek seferlik: seçilen tarih ve saatte
      const at = g.at ? new Date(g.at) : null;
      if (at && at > now) wanted.push({ id: `rutin-hedef-tarih-${g.id}-${g.at}-${hsh(g.text) % 100000}`, at, title: "📌 Unutma", body: g.text.length > 180 ? g.text.slice(0, 180) + "…" : g.text });
      continue;
    }
    for (let d = 0; d < NOTIFY_DAYS; d++) {
      const day = addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate()), d), k = keyOf(day);
      const n = dayNum(day) + hsh(g.id);
      // aylık: notun eklendiği günün ayın kaçı olduğuna göre her N ayda bir (kısa aylarda ayın son günü)
      let monthly = false;
      if (/^m[123]$/.test(g.remind) && g.created) {
        const N = Number(g.remind[1]), [cy, cm, cd] = g.created.split("-").map(Number);
        const diff = (day.getFullYear() * 12 + day.getMonth()) - (cy * 12 + cm - 1);
        const last = new Date(day.getFullYear(), day.getMonth() + 1, 0).getDate();
        monthly = diff > 0 && diff % N === 0 && day.getDate() === Math.min(cd, last);
      }
      const on = monthly || g.remind === "daily" || (g.remind === "few" && (n % 5 === 0 || n % 5 === 2)) || (g.remind === "weekly" && n % 7 === 0);
      if (!on) continue;
      const m = randomTimes(k + g.id, { count: 1, from: "10:00", to: "21:00" })[0];
      const at = new Date(day); at.setHours(Math.floor(m / 60), m % 60, 0, 0);
      if (at <= now) continue;
      const text = g.text.length > 180 ? g.text.slice(0, 180) + "…" : g.text;
      wanted.push({ id: `rutin-hedef-${k}-${g.id}-${hsh(g.text) % 100000}`, at, title: "📌 Unutma", body: text });
    }
  }
  // iOS en fazla 64 bekleyen bildirim tutar: en yakın 60'ı kur
  wanted.sort((a, b) => a.at - b.at);
  wanted.splice(60);
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
    for (const h of listHabits()) {
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
const CATS = [["kilo", /kilo|tart/i], ["su", /\bsu\b/i], ["spor", /spor/i], ["uyku", /uyku/i], ["yuruyus", /yürüyüş|yuruyus/i], ["diyet", /diyet/i], ["kitap", /kitap/i], ["klip", /klip/i]];
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
  try {
    const fresh = JSON.parse(fm.readString(path));
    for (const k of Object.keys(state)) delete state[k];
    Object.assign(state, fresh);
  } catch (e) {}
}

/* ---------- başlat ---------- */
const state = await load();
if (!fm.fileExists(path)) save();

if (config.runsInWidget) {
  Script.setWidget(buildWidget());
} else if (!config.runsInApp) {
  // uygulama dışında (ör. Kestirmeler) çalıştırılırsa sadece bildirimleri ve senkronu güncelle
} else if (args.queryParameters && args.queryParameters.link && SCRIPT_VERSION >= 10) {
  await linkSync(args.queryParameters.link);
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
await pushRemote();
Script.complete();
