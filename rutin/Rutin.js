// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: calendar-check;

// Haftalık Rutin — Scriptable betiği
// • Ana ekrandaki widget: bu haftanın tablosu (büyük), bugünün durumu (orta / küçük)
// • Widget'a dokununca ya da betiği çalıştırınca: Rutin uygulaması (index.html ile aynı arayüz)
// Bu dosya build_scriptable.py ile üretilir; arayüzü değiştirmek için index.html'i düzenle.
// Veriler iCloud Drive > Scriptable > rutin.json dosyasında tutulur.

const SCRIPT_VERSION = 14;
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
  const today = keyOf(new Date());
  const lv = h.measure ? lastValues(h) : [];
  if (h.measure) return lv.length ? `Son: ${fmtN(lv[lv.length - 1][1])} ${h.measure.unit}` + (lv.length > 1 ? ` (${lv[lv.length - 1][1] - lv[lv.length - 2][1] > 0 ? "+" : "−"}${fmtN(Math.abs(lv[lv.length - 1][1] - lv[lv.length - 2][1]))})` : "") : `Her ${["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"][h.days ? h.days[0] : 0]}`;
  const lead = h.days ? daysLabel(h) : h.qty ? `Bugün ${fmtN(qtyOf(h, today))}/${fmtN(h.qty.target)} ${h.qty.unit || ""}`.trim() : "";
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

const APP_HTML = "<!doctype html>\n<html lang=\"tr\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1,viewport-fit=cover\">\n<title>Haftalık Rutin</title>\n<meta name=\"apple-mobile-web-app-capable\" content=\"yes\">\n<meta name=\"mobile-web-app-capable\" content=\"yes\">\n<meta name=\"apple-mobile-web-app-title\" content=\"Rutin\">\n<meta name=\"apple-mobile-web-app-status-bar-style\" content=\"black-translucent\">\n<meta name=\"theme-color\" content=\"#eef1ec\" media=\"(prefers-color-scheme: light)\">\n<meta name=\"theme-color\" content=\"#141a17\" media=\"(prefers-color-scheme: dark)\">\n<link rel=\"apple-touch-icon\" href=\"apple-touch-icon.png\">\n<link rel=\"icon\" type=\"image/png\" href=\"icon-192.png\">\n<link rel=\"manifest\" href=\"manifest.webmanifest\">\n\n<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\">\n<link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>\n<link rel=\"stylesheet\" href=\"https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Figtree:wght@400;500;600&display=swap\">\n<style>\n:root{color-scheme:light}\nhtml,body{margin:0;height:100%;overflow:hidden}\nimg{max-width:100%}\nbody{overscroll-behavior-y:none;touch-action:manipulation;-webkit-user-select:none;user-select:none}\ninput,textarea{-webkit-user-select:text;user-select:text}\n/* Layout: tek ekran telefon uygulaması — üstte hafta başlığı, ortada alışkanlık × gün ızgarası, altta ekle butonu */\n:root{\n  --bg:#eef1ec; --surface:#ffffff; --ink:#1d2621; --muted:#68746d; --line:#d8ded8;\n  --accent:#2f6b4f; --accent-ink:#ffffff; --today:#e3ece5; --danger:#b4432f;\n  --display:\"Bricolage Grotesque\",ui-sans-serif,system-ui,sans-serif;\n  --body:\"Figtree\",ui-sans-serif,system-ui,-apple-system,\"Segoe UI\",sans-serif;\n  --c1:#2f6b4f; --c2:#c4682b; --c3:#3b5fa8; --c4:#a83b6e; --c5:#8a7a1e; --c6:#5b4aa0; --c7:#1f7a7a; --c8:#b8322a; --c9:#3f3fa8; --c10:#5f7f12; --c11:#7a5230; --c12:#4d5b66; --c13:#1b6f9e;\n  --empty:#e6eae5; --gold:#c9962f;\n}\n@media (prefers-color-scheme: dark){:root:not([data-theme=\"light\"]){\n  --bg:#141a17; --surface:#1d2521; --ink:#e7ece8; --muted:#93a198; --line:#2e3933;\n  --accent:#6fbf94; --accent-ink:#0f1512; --today:#22302a; --danger:#e47a63; --empty:#26302b; --gold:#e8c06a;\n  --c1:#6fbf94; --c2:#e89a5e; --c3:#7ea0e6; --c4:#e07aa8; --c5:#cdbb55; --c6:#a495e8; --c7:#5cc8c8; --c8:#ef6b5f; --c9:#8b8cf0; --c10:#a8d14a; --c11:#c99a6e; --c12:#a3b1bc; --c13:#5cb8ea; color-scheme:dark}}\n:root[data-theme=\"dark\"]{\n  --bg:#141a17; --surface:#1d2521; --ink:#e7ece8; --muted:#93a198; --line:#2e3933;\n  --accent:#6fbf94; --accent-ink:#0f1512; --today:#22302a; --danger:#e47a63; --empty:#26302b; --gold:#e8c06a;\n  --c1:#6fbf94; --c2:#e89a5e; --c3:#7ea0e6; --c4:#e07aa8; --c5:#cdbb55; --c6:#a495e8; --c7:#5cc8c8; --c8:#ef6b5f; --c9:#8b8cf0; --c10:#a8d14a; --c11:#c99a6e; --c12:#a3b1bc; --c13:#5cb8ea; color-scheme:dark}\n\n*{box-sizing:border-box}\nbody{background:var(--bg);color:var(--ink);font-family:var(--body);font-size:15px;-webkit-tap-highlight-color:transparent}\n/* Tek ekran: başlık + tablo + ekle düğmesi; tablo kalan yüksekliği rutinlere eşit paylaştırır */\n.app{position:fixed;top:0;bottom:0;left:0;right:0;box-sizing:border-box;max-width:560px;margin:0 auto;padding-inline:16px;padding-top:calc(env(safe-area-inset-top,0px) + 10px);padding-bottom:calc(env(safe-area-inset-bottom,0px) + 10px);display:flex;flex-direction:column;gap:10px}\nbutton{font:inherit;color:inherit;background:none;border:0;cursor:pointer}\nbutton:focus-visible,input:focus-visible{outline:2px solid var(--accent);outline-offset:2px}\n\nheader{display:flex;flex-direction:column;gap:6px;flex:none}\n.eyebrow{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:600}\n.weekrow{display:flex;align-items:center;gap:8px}\nh1{font-family:var(--display);font-weight:800;font-size:clamp(22px,6.4vw,30px);line-height:1.05;margin:0;flex:1;min-width:0;text-wrap:balance}\n.nav{width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:var(--surface);display:grid;place-items:center;font-size:18px;flex:none}\n.sub{display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--muted);font-size:14px}\n.todaybtn{font-weight:600;color:var(--accent);padding:4px 0}\n.meter{height:6px;border-radius:3px;background:var(--line);overflow:hidden}\n.meter i{display:block;height:100%;background:var(--accent);width:0;transition:width .3s}\n\n.board{background:var(--surface);border:1px solid var(--line);border-radius:16px;overflow-x:hidden;overflow-y:auto;flex:1;min-height:0;display:flex;flex-direction:column}\n[hidden]{display:none!important}\n.grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));align-items:center;flex:1}\n.dayhead{display:flex;flex-direction:column;align-items:center;gap:2px;padding-block:7px 6px;font-variant-numeric:tabular-nums;border-bottom:1px solid var(--line)}\n.dayhead .dn{font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:600}\n.dayhead .dd{font-family:var(--display);font-weight:600;font-size:16px}\n.dayhead.is-today{background:var(--today)}\n.dayhead.is-today .dd{color:var(--accent)}\n.hname{grid-column:1 / -1;display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;column-gap:10px;row-gap:0;padding:6px 12px 0;align-self:end;text-align:left;min-width:0}\n.hname b{font-weight:600;font-size:14px;line-height:1.25;overflow-wrap:anywhere;display:flex;align-items:center;gap:7px}\n.hname b::before{content:\"\";width:9px;height:9px;border-radius:50%;background:var(--hc);flex:none}\n.hname small{font-size:11px;color:var(--muted);font-variant-numeric:tabular-nums}\n.cell{display:grid;place-items:center;align-self:stretch;border-bottom:1px solid var(--line);padding-block:3px 4px}\n.cell button{width:min(var(--box,30px),90%)!important;height:auto!important;aspect-ratio:1}\n.cell.is-today{background:var(--today)}\n.cell button{width:30px;height:30px;border-radius:9px;border:2px solid var(--line);display:grid;place-items:center;transition:transform .12s,background .15s,border-color .15s}\n.cell button:active{transform:scale(.88)}\n.cell button[aria-pressed=\"true\"]{background:var(--hc);border-color:var(--hc)}\n.cell button[aria-pressed=\"true\"] svg{opacity:1;transform:scale(1)}\n.cell button svg{width:55%;height:55%;opacity:0;transform:scale(.4);transition:all .15s;stroke:var(--surface)}\n.cell.is-future button{opacity:.45}\n.cell.is-off button{opacity:.3;border-style:dashed}\n.cell.is-off button[aria-pressed=\"true\"]{opacity:1;border-style:solid}\n\n.empty{padding:28px 20px;text-align:center;color:var(--muted);display:flex;flex-direction:column;gap:6px}\n.empty strong{color:var(--ink);font-family:var(--display);font-size:18px}\n\n.foot{flex:none;display:flex;gap:10px}\n.kilo{flex:1;min-width:0;display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:14px;background:var(--surface);border:1px solid var(--line);text-align:left}\n.kilo .ki{flex:none;width:30px;height:30px;border-radius:9px;background:var(--hc);display:grid;place-items:center}\n.kilo .ki svg{width:17px;height:17px;stroke:var(--surface)}\n.kilo .kt{display:flex;flex-direction:column;min-width:0;line-height:1.2}\n.kilo .kt b{font-size:15px;font-variant-numeric:tabular-nums;white-space:nowrap}\n.kilo .kt small{font-size:11.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n.kilo.due .kt small{color:var(--hc);font-weight:600}\n.foot .add{width:auto;flex:1}\n.add{width:100%;background:var(--accent);color:var(--accent-ink);font-weight:600;padding:14px;border-radius:14px;font-size:16px}\n.status{font-size:12px;color:var(--muted);text-align:center}\n\n/* alt sayfa */\n.scrim{position:fixed;inset:0;background:rgba(10,14,12,.45);display:flex;align-items:flex-end;justify-content:center;z-index:10}\n.sheet{background:var(--surface);width:100%;max-width:560px;border-radius:20px 20px 0 0;padding:20px 16px calc(20px + env(safe-area-inset-bottom,0px));display:flex;flex-direction:column;gap:16px}\n.sheet h2{font-family:var(--display);font-weight:800;font-size:22px;margin:0}\n.sheet label{font-size:13px;color:var(--muted);font-weight:600;display:flex;flex-direction:column;gap:6px}\n.sheet input[type=text]{font:inherit;font-size:16px;padding:12px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink);width:100%}\n.swatches{display:flex;gap:10px;flex-wrap:wrap}\n.swatches button{width:34px;height:34px;border-radius:50%;background:var(--sc);border:3px solid transparent}\n.swatches button[aria-pressed=\"true\"]{border-color:var(--ink)}\n.row{display:flex;gap:10px}\n.row button{flex:1;padding:13px;border-radius:12px;font-weight:600}\n.btn-primary{background:var(--accent);color:var(--accent-ink)}\n.btn-ghost{border:1px solid var(--line)}\n.btn-danger{color:var(--danger);border:1px solid var(--line)}\n.btn-danger.armed{background:var(--danger);color:var(--surface);border-color:var(--danger)}\n.goals{display:flex;gap:8px;flex-wrap:wrap}\n.goals button{padding:8px 12px;border-radius:999px;border:1px solid var(--line);font-size:14px;font-variant-numeric:tabular-nums}\n.goals button[aria-pressed=\"true\"]{background:var(--ink);color:var(--surface);border-color:var(--ink)}\n.hname small.met{color:var(--hc);font-weight:600}\n.order{display:flex;gap:10px}\n.order button{flex:1;padding:10px;border-radius:10px;border:1px solid var(--line);font-size:14px}\n\n/* üst satır: yıl/hafta etiketi + istatistik düğmesi */\n.toprow{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.pill{display:inline-flex;align-items:center;gap:6px;padding:6px 11px;border-radius:999px;background:var(--surface);border:1px solid var(--line);font-size:13px;font-weight:600;color:var(--ink)}\n.pill svg{width:15px;height:15px;stroke:var(--accent)}\n\n/* istatistik paneli (kendi içinde kayar) */\n.panel{position:fixed;inset:0;background:var(--bg);z-index:20;overflow-y:auto;-webkit-overflow-scrolling:touch}\n.panel-in{max-width:560px;margin:0 auto;padding-inline:16px;padding-top:calc(env(safe-area-inset-top,0px) + 12px);padding-bottom:calc(env(safe-area-inset-bottom,0px) + 24px);display:flex;flex-direction:column;gap:12px}\n.panel-head{display:flex;align-items:center;justify-content:space-between;gap:8px;position:sticky;top:0;background:var(--bg);padding-block:4px;z-index:1}\n.panel h2{font-family:var(--display);font-weight:800;font-size:26px;margin:0}\n.card{background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:12px;min-width:0}\n.card h3{margin:0;font-family:var(--display);font-weight:800;font-size:17px}\n.muted{color:var(--muted);font-size:13px;margin:0;line-height:1.45}\n.big{font-family:var(--display);font-weight:800;font-size:40px;line-height:1;font-variant-numeric:tabular-nums}\n.sumrow{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap}\n.delta{font-weight:700;font-size:14px;padding:4px 9px;border-radius:999px;background:var(--today);font-variant-numeric:tabular-nums}\n.delta.up{color:var(--accent)} .delta.down{color:var(--danger)}\n.seg{display:grid;grid-template-columns:1fr 1fr;background:var(--bg);border-radius:10px;padding:3px;gap:3px}\n.seg button{padding:8px;border-radius:8px;font-weight:600;font-size:14px;color:var(--muted)}\n.seg button[aria-pressed=\"true\"]{background:var(--surface);color:var(--ink);box-shadow:0 1px 2px rgba(0,0,0,.12)}\n.chips{display:flex;gap:6px;overflow-x:auto;padding-bottom:2px;scrollbar-width:none}\n.chips::-webkit-scrollbar{display:none}\n.chips button{flex:none;display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:999px;border:1px solid var(--line);font-size:13px;white-space:nowrap}\n.chips button i{width:8px;height:8px;border-radius:50%;background:var(--hc)}\n.chips button[aria-pressed=\"true\"]{background:var(--ink);color:var(--surface);border-color:var(--ink)}\n.mhead{display:flex;align-items:center;justify-content:space-between}\n.mhead b{font-family:var(--display);font-size:17px}\n.nav.sm{width:32px;height:32px;font-size:15px}\n.mgrid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px}\n.mgrid .dn{font-size:10px;text-align:center;color:var(--muted);font-weight:600;letter-spacing:.05em;text-transform:uppercase}\n.sq{position:relative;aspect-ratio:1;border-radius:7px;background:var(--empty);overflow:hidden;display:grid;place-items:center;font-size:11px;font-weight:600;font-variant-numeric:tabular-nums;color:var(--muted)}\n.sq i{position:absolute;inset:0;background:var(--hc);opacity:var(--o,0)}\n.sq span{position:relative}\n.sq.hi span{color:var(--surface)}\n.sq.today{outline:2px solid var(--gold);outline-offset:1px}\n.sq.future{opacity:.35}\n.sq.off{background:transparent;border:1px dashed var(--line)}\n.sq.blank{background:transparent}\n.daynote{font-size:13px;color:var(--muted);min-height:1.4em}\n.yscroll{overflow-x:auto;padding-bottom:4px}\n.ygrid{display:grid;grid-auto-flow:column;grid-template-rows:14px repeat(7,11px);grid-auto-columns:11px;gap:3px;width:max-content}\n.ygrid .ml{font-size:9px;color:var(--muted);white-space:nowrap;grid-row:1}\n.ygrid .sq{border-radius:3px;aspect-ratio:auto}\n.legend{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--muted);justify-content:flex-end}\n.legend .sq{width:11px;height:11px;border-radius:3px;aspect-ratio:auto}\n.hs{display:flex;flex-direction:column;gap:8px;padding-top:12px;border-top:1px solid var(--line)}\n.hs:first-of-type{border-top:0;padding-top:0}\n.hs-top{display:flex;align-items:center;justify-content:space-between;gap:8px}\n.hs-top b{display:flex;align-items:center;gap:7px;font-size:15px;min-width:0}\n.hs-top b::before{content:\"\";width:9px;height:9px;border-radius:50%;background:var(--hc);flex:none}\n.hs-top .pct{font-family:var(--display);font-weight:800;font-size:20px;color:var(--hc);font-variant-numeric:tabular-nums}\n.bar{height:6px;border-radius:3px;background:var(--empty);overflow:hidden}\n.bar i{display:block;height:100%;background:var(--hc)}\n.facts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}\n.facts div{display:flex;flex-direction:column;gap:1px;min-width:0}\n.facts small{font-size:11px;color:var(--muted)}\n.facts strong{font-size:15px;font-variant-numeric:tabular-nums}\n.weak{font-size:12px;color:var(--muted)}\n.badges{display:flex;gap:6px;flex-wrap:wrap}\n.badge{display:inline-flex;align-items:center;gap:5px;padding:4px 9px;border-radius:999px;font-size:12px;font-weight:600;border:1px solid var(--line);color:var(--muted);opacity:.55}\n.badge.got{opacity:1;color:var(--ink);border-color:var(--hc);background:var(--today)}\n.badge svg{width:13px;height:13px}\n.card textarea{font:12px/1.4 ui-monospace,Menlo,monospace;width:100%;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink);padding:10px;resize:vertical;-webkit-user-select:text;user-select:text}\n.ver{text-align:center;font-size:12px;color:var(--muted);margin:4px 0 0}\n\n\n/* miktarlı rutin (su sayacı) */\n.cell button.qty{position:relative;overflow:hidden}\n.cell button.qty::before{content:\"\";position:absolute;left:0;right:0;bottom:0;height:var(--fill,0%);background:var(--hc);opacity:.4;transition:height .2s}\n.cell button.qty .qn{position:relative;font-size:10px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--ink)}\n.cell button.qty[aria-pressed=\"true\"]::before{opacity:0}\n.qbig{font-family:var(--display);font-weight:800;font-size:44px;line-height:1;text-align:center;font-variant-numeric:tabular-nums;color:var(--hc)}\n.qbig small{font-size:20px;color:var(--muted)}\n.qbar{height:10px;border-radius:5px;background:var(--empty);overflow:hidden}\n.qbar i{display:block;height:100%;background:var(--hc);transition:width .2s}\n.qbtns{display:grid;grid-template-columns:1fr 1fr;gap:10px}\n.qbtns button{padding:16px;border-radius:14px;font-weight:700;font-size:17px;border:1px solid var(--line)}\n.qbtns .plus{background:var(--hc);color:var(--surface);border-color:var(--hc)}\n.sheet{max-height:92%;overflow-y:auto}\n.fields{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:10px}\n.fields label{font-size:12px}\n.fields input,.tadd input,.tadd select{font:inherit;font-size:16px;padding:10px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink);width:100%;min-width:0}\n.tadd{display:flex;gap:8px;align-items:center;margin-top:10px;flex-wrap:wrap}\n.tadd input[type=time]{width:auto;flex:1}\n.tadd .btn-ghost{padding:10px 14px;border-radius:10px;font-weight:600}\n.tchip{display:inline-flex;align-items:center;gap:6px}\n\n/* senkronizasyon kartı */\n.steps{margin:0;padding-left:20px;display:flex;flex-direction:column;gap:6px;font-size:14px;line-height:1.45}\n.steps a{color:var(--accent);font-weight:600}\n.card input[type=password],.card input[type=text]{font:inherit;font-size:16px;padding:12px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--ink);width:100%;min-width:0;-webkit-user-select:text;user-select:text}\n.card .btn-primary,.card .btn-ghost{padding:13px;border-radius:12px;font-weight:600}\n.linkbtn{color:var(--muted);font-size:14px;text-decoration:underline;padding:6px;align-self:center}\n.syncdot{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--accent);margin-right:6px;vertical-align:1px}\n.syncdot.err{background:var(--danger)}\n\n/* ölçüm (haftalık kilo) */\n.cell button.meas{font-size:10px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--surface);letter-spacing:-.02em}\n.cell button.meas[aria-pressed=\"true\"] svg{display:none}\n.mbig{display:flex;align-items:baseline;justify-content:center;gap:8px}\n.mbig input{font-family:var(--display);font-weight:800;font-size:44px;width:5.2ch;text-align:center;border:0;border-bottom:2px solid var(--hc);background:transparent;color:var(--ink);padding:4px 0;font-variant-numeric:tabular-nums;-webkit-user-select:text;user-select:text}\n.mbig input:focus-visible{outline:none;border-bottom-width:3px}\n.mbig span{font-size:20px;color:var(--muted);font-weight:600}\n.chart{width:100%;height:auto;display:block;touch-action:pan-y}\n.chart .grid line{stroke:var(--line);stroke-width:1}\n.chart text{fill:var(--muted);font-size:10px;font-family:var(--body);font-variant-numeric:tabular-nums}\n.chart .lbl{fill:var(--ink);font-weight:700;font-size:11px}\n.readout{font-size:13px;color:var(--muted);min-height:1.4em;font-variant-numeric:tabular-nums}\n\n/* tekli hedefler */\n#gScrim{z-index:25}\n.pills{display:flex;gap:6px;flex:none}\n.toprow .eyebrow{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}\n.pills .pill{padding:6px 9px;font-size:12.5px;gap:5px}\n.pill .cnt{min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--accent);color:var(--accent-ink);font-size:11px;display:inline-grid;place-items:center;font-variant-numeric:tabular-nums}\n.gform textarea,.gsheet textarea{font:inherit;font-size:16px;line-height:1.4;width:100%;min-height:76px;padding:12px;border-radius:12px;border:1px solid var(--line);background:var(--bg);color:var(--ink);resize:vertical;-webkit-user-select:text;user-select:text}\n.glist{display:flex;flex-direction:column}\n.goal{display:flex;gap:12px;align-items:flex-start;padding-block:12px;border-top:1px solid var(--line)}\n.goal:first-child{border-top:0;padding-top:0}\n.gcheck{flex:none;width:28px;height:28px;border-radius:50%;border:2px solid var(--line);display:grid;place-items:center;margin-top:1px}\n.gcheck svg{width:15px;height:15px;stroke:var(--surface);opacity:0}\n.goal.done .gcheck{background:var(--accent);border-color:var(--accent)}\n.goal.done .gcheck svg{opacity:1}\n.gbody{flex:1;min-width:0;text-align:left;display:flex;flex-direction:column;gap:4px}\n.gtext{margin:0;font-size:15px;line-height:1.45;white-space:pre-wrap;overflow-wrap:anywhere}\n.goal.done .gtext{color:var(--muted);text-decoration:line-through}\n.gmeta{font-size:12px;color:var(--muted)}\n.gempty{color:var(--muted);font-size:14px;margin:0;line-height:1.5}\ndetails.gdone summary{cursor:pointer;font-weight:600;font-size:14px;color:var(--muted);list-style:none;padding-block:4px}\ndetails.gdone summary::-webkit-details-marker{display:none}\ndetails.gdone summary::before{content:\"▸ \";}\ndetails.gdone[open] summary::before{content:\"▾ \";}\n\n/* kutlama */\n.celebrate{position:fixed;inset:0;z-index:30;display:grid;place-items:center;background:rgba(10,14,12,.35)}\n.celebrate canvas{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}\n.cele-card{position:relative;background:var(--surface);border-radius:22px;padding:22px 26px;text-align:center;display:flex;flex-direction:column;gap:4px;align-items:center;box-shadow:0 20px 50px rgba(0,0,0,.3);animation:pop .45s cubic-bezier(.2,1.4,.4,1);max-width:300px;margin:16px}\n.cele-card .num{font-family:var(--display);font-weight:800;font-size:64px;line-height:1;color:var(--hc)}\n.cele-card .lbl{font-family:var(--display);font-weight:800;font-size:20px}\n.cele-card .sub2{color:var(--muted);font-size:14px}\n@keyframes pop{from{transform:scale(.6);opacity:0}to{transform:scale(1);opacity:1}}\n@media (prefers-reduced-motion: reduce){*{transition:none!important;animation:none!important}}\n</style>\n</head>\n<body>\n<div class=\"app\">\n  <header>\n    <div class=\"toprow\">\n      <div class=\"eyebrow\" id=\"yearLabel\">Hafta</div>\n      <div class=\"pills\">\n      <button class=\"pill\" id=\"goalsBtn\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M6 3.5h12v17l-6-4-6 4z\"/></svg>Unutma<span class=\"cnt\" id=\"gCount\" hidden></span></button>\n      <button class=\"pill\" id=\"statsBtn\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke-width=\"2.4\" stroke-linecap=\"round\"><path d=\"M5 20V11M12 20V5M19 20v-6\"/></svg>İstatistik</button>\n      </div>\n    </div>\n    <div class=\"weekrow\">\n      <button class=\"nav\" id=\"prev\" aria-label=\"Önceki hafta\">‹</button>\n      <h1 id=\"weekTitle\">—</h1>\n      <button class=\"nav\" id=\"next\" aria-label=\"Sonraki hafta\">›</button>\n    </div>\n    <div class=\"sub\">\n      <span id=\"weekStat\">—</span>\n      <button class=\"todaybtn\" id=\"goToday\" hidden>Bu haftaya dön</button>\n    </div>\n    <div class=\"meter\" aria-hidden=\"true\"><i id=\"meterBar\"></i></div>\n  </header>\n\n  <div class=\"board\" id=\"board\"><div class=\"grid\" id=\"grid\"></div></div>\n  <div class=\"foot\"><button class=\"kilo\" id=\"kiloBtn\" hidden></button><button class=\"add\" id=\"addBtn\">+ Rutin ekle</button></div>\n</div>\n\n<div class=\"panel\" id=\"panel\" hidden role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"panelTitle\">\n  <div class=\"panel-in\">\n    <div class=\"panel-head\"><h2 id=\"panelTitle\">İstatistik</h2><button class=\"nav\" id=\"panelClose\" aria-label=\"Kapat\">✕</button></div>\n\n    <section class=\"card\" id=\"sumCard\"></section>\n\n    <section class=\"card\">\n      <div class=\"seg\"><button id=\"segMonth\" aria-pressed=\"true\">Ay</button><button id=\"segYear\" aria-pressed=\"false\">Yıl</button></div>\n      <div class=\"chips\" id=\"chips\"></div>\n      <div id=\"monthView\">\n        <div class=\"mhead\"><button class=\"nav sm\" id=\"mPrev\" aria-label=\"Önceki ay\">‹</button><b id=\"mTitle\"></b><button class=\"nav sm\" id=\"mNext\" aria-label=\"Sonraki ay\">›</button></div>\n        <div class=\"mgrid\" id=\"mGrid\" style=\"margin-top:10px\"></div>\n        <div class=\"daynote\" id=\"dayNote\" style=\"margin-top:8px\">Ayrıntı için bir güne dokun.</div>\n      </div>\n      <div id=\"yearView\" hidden>\n        <div class=\"yscroll\" id=\"yScroll\"><div class=\"ygrid\" id=\"yGrid\"></div></div>\n        <div class=\"legend\">Az <span class=\"sq\"></span><span class=\"sq\" style=\"--hc:var(--accent)\"><i style=\"--o:.3\"></i></span><span class=\"sq\" style=\"--hc:var(--accent)\"><i style=\"--o:.55\"></i></span><span class=\"sq\" style=\"--hc:var(--accent)\"><i style=\"--o:.8\"></i></span><span class=\"sq\" style=\"--hc:var(--accent)\"><i style=\"--o:1\"></i></span> Çok</div>\n      </div>\n    </section>\n\n    <section class=\"card\" id=\"kiloCard\" hidden><h3>Kilo</h3><div id=\"kiloStats\"></div></section>\n\n    <section class=\"card\"><h3 id=\"hsTitle\">Rutinler</h3><div id=\"habitStats\" style=\"display:flex;flex-direction:column;gap:12px\"></div></section>\n\n    <section class=\"card\" id=\"syncCard\">\n      <h3>Senkronizasyon</h3>\n      <div id=\"syncOff\" style=\"display:flex;flex-direction:column;gap:10px\">\n        <p class=\"muted\">Widget ve bildirimler bu uygulamadaki işaretleri ve notları görsün diye veriler, sadece senin erişebildiğin gizli bir GitHub Gist'inde tutulur. Bir kez kurman yeterli.</p>\n        <ol class=\"steps\">\n          <li><a href=\"https://github.com/settings/tokens/new?scopes=gist&amp;description=Rutin%20senkron\" target=\"_blank\" rel=\"noopener\">Bu bağlantıyı aç</a>. Sadece <b>gist</b> kutusu işaretli gelir, başka bir şeye dokunma.</li>\n          <li><b>Expiration</b> kısmında <b>No expiration</b> seç.</li>\n          <li>En alttaki <b>Generate token</b>'a dokun, çıkan <b>ghp_</b> ile başlayan anahtarı kopyala.</li>\n          <li>Buraya yapıştır ve <b>Bağlan</b>'a dokun.</li>\n        </ol>\n        <input type=\"password\" id=\"tokenIn\" placeholder=\"ghp_…\" autocomplete=\"off\" autocapitalize=\"off\" spellcheck=\"false\" aria-label=\"GitHub anahtarı\">\n        <button class=\"btn-primary\" id=\"syncConnect\">Bağlan</button>\n        <p class=\"muted\" id=\"syncMsg\"></p>\n      </div>\n      <div id=\"syncOn\" hidden style=\"display:flex;flex-direction:column;gap:10px\">\n        <p class=\"muted\" id=\"syncState\"></p>\n        <p class=\"muted\" id=\"linkHint\">Son adım: <b>Scriptable'ı bağla</b>'ya dokun. Scriptable açılıp “Bağlandı” diyecek, sonra buraya geri dön.</p>\n        <div class=\"row\"><button class=\"btn-ghost\" id=\"syncNow\">Şimdi eşitle</button><button class=\"btn-primary\" id=\"linkScriptable\">Scriptable'ı bağla</button></div>\n        <button class=\"linkbtn\" id=\"syncOffBtn\">Bağlantıyı kes</button>\n      </div>\n    </section>\n\n    <section class=\"card\">\n      <h3>Yedek</h3>\n      <p class=\"muted\" id=\"backupInfo\">Verilerini metin olarak kopyalayıp Notlar'a ya da bir mesaja yapıştırarak saklayabilir, başka bir cihaza taşıyabilirsin.</p>\n      <div class=\"row\"><button class=\"btn-ghost\" id=\"exportBtn\">Yedeği kopyala</button><button class=\"btn-ghost\" id=\"importBtn\">Yedekten yükle</button></div>\n      <div id=\"exportBox\" hidden style=\"display:flex;flex-direction:column;gap:8px\"><textarea id=\"exportText\" rows=\"4\" readonly></textarea><p class=\"muted\" id=\"exportMsg\"></p></div>\n      <div id=\"importBox\" hidden style=\"display:flex;flex-direction:column;gap:8px\">\n        <textarea id=\"importText\" rows=\"4\" placeholder=\"Yedek metnini buraya yapıştır\"></textarea>\n        <div class=\"row\"><button class=\"btn-primary\" id=\"importDo\">Geri yükle</button></div>\n        <p class=\"muted\" id=\"importMsg\"></p>\n      </div>\n    </section>\n    <p class=\"ver\" id=\"verLabel\"></p>\n  </div>\n</div>\n\n\n<div class=\"scrim\" id=\"qScrim\" hidden>\n  <div class=\"sheet\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"qTitle\">\n    <h2 id=\"qTitle\">Su</h2>\n    <p class=\"muted\" id=\"qDay\"></p>\n    <div class=\"qbig\" id=\"qBig\"></div>\n    <div class=\"qbar\"><i id=\"qBar\"></i></div>\n    <div class=\"qbtns\"><button id=\"qMinus\">−</button><button class=\"plus\" id=\"qPlus\">+</button></div>\n    <div class=\"row\"><button class=\"btn-ghost\" id=\"qReset\">Sıfırla</button><button class=\"btn-ghost\" id=\"qFull\">Hedefi tamamla</button><button class=\"btn-primary\" id=\"qClose\">Bitti</button></div>\n  </div>\n</div>\n\n<div class=\"panel\" id=\"gPanel\" hidden role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"gPanelTitle\">\n  <div class=\"panel-in\">\n    <div class=\"panel-head\"><h2 id=\"gPanelTitle\">Unutma</h2><button class=\"nav\" id=\"gClose\" aria-label=\"Kapat\">✕</button></div>\n    <section class=\"card gform\">\n      <h3>Yeni not</h3>\n      <textarea id=\"gNew\" placeholder=\"Örn. Ehliyet sınavına başvur\" maxlength=\"400\"></textarea>\n      <div><div class=\"eyebrow\" style=\"margin-bottom:8px\">Bana hatırlat</div><div class=\"goals\" id=\"gFreqNew\"></div></div>\n      <button class=\"btn-primary\" id=\"gAdd\">Ekle</button>\n    </section>\n    <section class=\"card\"><h3 id=\"gActiveTitle\">Notlarım</h3><div class=\"glist\" id=\"gList\"></div></section>\n    <section class=\"card\" id=\"gDoneCard\" hidden><details class=\"gdone\"><summary id=\"gDoneSum\">Tamamlananlar</summary><div class=\"glist\" id=\"gDoneList\" style=\"margin-top:10px\"></div></details></section>\n    <p class=\"muted\" style=\"text-align:center\">Hatırlatmalar 10:00–21:00 arasında rastgele bir saatte gelir. Aylık seçeneklerde notu eklediğin günün ayın kaçı olduğuna göre hatırlatılır.</p>\n  </div>\n</div>\n\n<div class=\"scrim\" id=\"gScrim\" hidden>\n  <div class=\"sheet gsheet\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"gEditTitle\">\n    <h2 id=\"gEditTitle\">Notu düzenle</h2>\n    <textarea id=\"gEditText\" maxlength=\"400\" aria-label=\"Not\"></textarea>\n    <div><div class=\"eyebrow\" style=\"margin-bottom:8px\">Bana hatırlat</div><div class=\"goals\" id=\"gFreqEdit\"></div></div>\n    <div class=\"row\"><button class=\"btn-danger\" id=\"gDel\">Sil</button><button class=\"btn-ghost\" id=\"gCancel\">Vazgeç</button><button class=\"btn-primary\" id=\"gSave\">Kaydet</button></div>\n  </div>\n</div>\n\n<div class=\"scrim\" id=\"mScrim\" hidden>\n  <div class=\"sheet\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"mTitle2\">\n    <h2 id=\"mTitle2\">Kilo ölçümü</h2>\n    <p class=\"muted\" id=\"mDay\"></p>\n    <div class=\"mbig\"><input id=\"mInput\" inputmode=\"decimal\" autocomplete=\"off\" aria-label=\"Ölçüm\"><span id=\"mUnit\">kg</span></div>\n    <p class=\"muted\" id=\"mPrevTxt\" style=\"text-align:center\"></p>\n    <div class=\"row\"><button class=\"btn-danger\" id=\"mDel\">Sil</button><button class=\"btn-ghost\" id=\"mCancel\">Vazgeç</button><button class=\"btn-primary\" id=\"mSave\">Kaydet</button></div>\n  </div>\n</div>\n\n<div class=\"celebrate\" id=\"celebrate\" hidden><canvas id=\"confetti\"></canvas><div class=\"cele-card\" id=\"celeCard\"></div></div>\n\n<div class=\"scrim\" id=\"scrim\" hidden>\n  <div class=\"sheet\" role=\"dialog\" aria-modal=\"true\" aria-labelledby=\"sheetTitle\">\n    <h2 id=\"sheetTitle\">Yeni rutin</h2>\n    <label for=\"nameInput\">Adı\n      <input type=\"text\" id=\"nameInput\" maxlength=\"40\" placeholder=\"Örn. 2 litre su iç\" autocomplete=\"off\">\n    </label>\n    <div>\n      <div class=\"eyebrow\" style=\"margin-bottom:8px\">Renk</div>\n      <div class=\"swatches\" id=\"swatches\"></div>\n    </div>\n    <div>\n      <div class=\"eyebrow\" style=\"margin-bottom:8px\">Hedef</div>\n      <div class=\"goals\" id=\"goals\"></div>\n      <div class=\"goals\" id=\"dayPick\" style=\"margin-top:10px\" hidden></div>\n    </div>\n    <div>\n      <div class=\"eyebrow\" style=\"margin-bottom:8px\">Miktar</div>\n      <div class=\"goals\" id=\"qMode\"></div>\n      <div class=\"fields\" id=\"qFields\" hidden>\n        <label for=\"qTarget\">Günlük hedef<input id=\"qTarget\" inputmode=\"decimal\" autocomplete=\"off\"></label>\n        <label for=\"qUnit\">Birim<input id=\"qUnit\" maxlength=\"8\" autocomplete=\"off\"></label>\n        <label for=\"qStep\">Her dokunuş<input id=\"qStep\" inputmode=\"decimal\" autocomplete=\"off\"></label>\n      </div>\n    </div>\n    <div>\n      <div class=\"eyebrow\" style=\"margin-bottom:8px\">Bildirim</div>\n      <div class=\"goals\" id=\"nMode\"></div>\n      <div id=\"nTimes\" hidden>\n        <div class=\"goals\" id=\"nList\" style=\"margin-top:10px\"></div>\n        <div class=\"tadd\"><input type=\"time\" id=\"nTimeIn\" value=\"09:00\"><button class=\"btn-ghost\" id=\"nAdd\">Saat ekle</button></div>\n      </div>\n      <div class=\"tadd\" id=\"nRand\" hidden>\n        <select id=\"nCount\" aria-label=\"Kaç kez\"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5</option></select>\n        <span class=\"muted\">kez,</span>\n        <input type=\"time\" id=\"nFrom\" value=\"10:00\" aria-label=\"En erken\">\n        <span class=\"muted\">–</span>\n        <input type=\"time\" id=\"nTo\" value=\"22:00\" aria-label=\"En geç\">\n      </div>\n      <p class=\"muted\" style=\"margin-top:8px\" id=\"nHint\">Bildirimler Scriptable'daki Rutin'den gelir. O gün işaretlediysen kalanlar gelmez.</p>\n    </div>\n    <div class=\"order\" id=\"orderRow\" hidden>\n      <button id=\"upBtn\">↑ Yukarı taşı</button>\n      <button id=\"downBtn\">↓ Aşağı taşı</button>\n    </div>\n    <div class=\"row\">\n      <button class=\"btn-danger\" id=\"delBtn\" hidden>Sil</button>\n      <button class=\"btn-ghost\" id=\"cancelBtn\">Vazgeç</button>\n      <button class=\"btn-primary\" id=\"saveBtn\">Kaydet</button>\n    </div>\n  </div>\n</div>\n\n<script>\nconst COLORS=[\"c1\",\"c2\",\"c3\",\"c4\",\"c5\",\"c6\",\"c7\",\"c8\",\"c9\",\"c10\",\"c11\",\"c12\",\"c13\"];\nconst DAYS=[\"Pzt\",\"Sal\",\"Çar\",\"Per\",\"Cum\",\"Cmt\",\"Paz\"];\nconst MONTHS=[\"Ocak\",\"Şubat\",\"Mart\",\"Nisan\",\"Mayıs\",\"Haziran\",\"Temmuz\",\"Ağustos\",\"Eylül\",\"Ekim\",\"Kasım\",\"Aralık\"];\nconst CHECK='<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke-width=\"3.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M5 12.5l4.5 4.5L19 7.5\"/></svg>';\nconst LS_KEY=\"haftalik-rutin-v1\";\n\nconst $=id=>document.getElementById(id);\nconst pad=n=>String(n).padStart(2,\"0\");\nconst keyOf=d=>d.getFullYear()+\"-\"+pad(d.getMonth()+1)+\"-\"+pad(d.getDate());\nconst addDays=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};\nconst mondayOf=d=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return x};\nconst uid=()=>Math.random().toString(36).slice(2,9);\n\nconst PRESET=[\n  {name:\"2 L su iç\",color:\"c3\",goal:7,was:\"Su iç (2 L)\"},\n  {name:\"Spor\",color:\"c2\",goal:4},\n  {name:\"Uyku düzeni\",color:\"c6\",goal:7},\n  {name:\"Günlük yürüyüş\",color:\"c1\",goal:7,was:\"30 dk yürüyüş\"},\n  {name:\"Diyet\",color:\"c4\",goal:7}\n];\nfunction defaultState(){\n  return {v:2,habits:PRESET.map(p=>({id:uid(),name:p.name,color:p.color,goal:p.goal})),checks:{},updated:0};\n}\n/* v2: istenen 5 rutini ekle; eski örnekleri işaretleri koruyarak dönüştür */\n/* Sonradan istenen rutinler: her sürümde bir kez eklenir (aynı adda biri yoksa) */\nconst ADDED=[\n  {v:3,name:\"Kitap oku\",match:/kitap/i,color:\"c5\",goal:7},\n  {v:4,name:\"Klip paylaş\",match:/klip/i,color:\"c7\",goal:7}\n];\n/* Sonradan istenen ayar değişiklikleri (gün sırası: 0=Pzt … 6=Paz) */\nconst CHANGES=[\n  {v:5,apply:st=>{\n    st.habits.forEach(h=>{\n      if(/spor/i.test(h.name)){h.days=[1,3,4,6];h.goal=7}\n      if(/yürüyüş|yuruyus/i.test(h.name)){h.goal=7;delete h.days}\n    });\n  }},\n  {v:9,apply:st=>{ // her hafta başı (Pazartesi) kilo ölçümü\n    if(st.habits.some(h=>/kilo|tart/i.test(h.name)))return;\n    st.habits.push({id:uid(),name:\"Kilo ölçümü\",color:\"c11\",goal:7,days:[0],measure:{unit:\"kg\"},notify:{mode:\"times\",times:[\"09:00\"]},created:keyOf(new Date())});\n  }},\n  {v:8,apply:st=>{ // su: bardak bardak say (adındaki litre hedef olur, yoksa 2 L)\n    st.habits.forEach(h=>{\n      if(h.qty||!/\\bsu\\b/i.test(h.name))return;\n      const m=h.name.match(/(\\d+(?:[.,]\\d+)?)\\s*(l|lt|litre)\\b/i);\n      h.qty={target:m?parseFloat(m[1].replace(\",\",\".\")):2,step:0.25,unit:\"L\"};\n      // daha önce tam işaretlenen günler hedef kadar sayılır\n      st.counts=st.counts||{};\n      for(const k in st.checks)if(st.checks[k].includes(h.id))(st.counts[k]=st.counts[k]||{})[h.id]=h.qty.target;\n    });\n  }},\n  {v:6,apply:st=>{ // istatistikler için başlangıç günü: ilk işaret ya da bugün\n    st.habits.forEach(h=>{\n      if(h.created) return;\n      let m=null;for(const k in st.checks) if(st.checks[k].includes(h.id)&&(!m||k<m)) m=k;\n      h.created=m||keyOf(new Date());\n    });\n  }}\n];\nfunction migrate(st){\n  let changed=migrateV2(st);\n  ADDED.forEach(a=>{\n    if(st.v>=a.v) return;\n    if(!st.habits.some(h=>a.match.test(h.name))) st.habits.push({id:uid(),name:a.name,color:a.color,goal:a.goal});\n    st.v=a.v;changed=true;\n  });\n  CHANGES.slice().sort((a,b)=>a.v-b.v).forEach(c=>{if(st.v>=c.v)return;c.apply(st);st.v=c.v;changed=true});\n  return changed;\n}\nfunction migrateV2(st){\n  if(st.v>=2) return false;\n  const used=id=>Object.values(st.checks).some(a=>a.includes(id));\n  const out=[];\n  PRESET.forEach(p=>{\n    const old=st.habits.find(h=>h.name===p.name||(p.was&&h.name===p.was));\n    out.push(old?{...old,name:p.name,goal:p.goal}:{id:uid(),name:p.name,color:p.color,goal:p.goal});\n  });\n  st.habits.forEach(h=>{\n    if(out.some(o=>o.id===h.id)) return;\n    if(h.name===\"20 sayfa kitap\"&&!used(h.id)) return;\n    out.push(h);\n  });\n  st.habits=out;st.v=2;return true;\n}\nfunction readLocal(){try{const s=localStorage.getItem(LS_KEY);return s?JSON.parse(s):null}catch(e){return null}}\nfunction writeLocal(){try{localStorage.setItem(LS_KEY,JSON.stringify(state))}catch(e){}}\n\nlet state=window.__INIT__||readLocal()||defaultState();\nconst migratedLocal=migrate(state);\nlet weekStart=mondayOf(new Date());\nlet remote=null; // db doc reference\nlet saveTimer=null, saving=false, dirty=false;\n\n/* ---------- render ---------- */\nconst goalOf=h=>h.days?7:(h.goal||7);\nconst wd=d=>(d.getDay()+6)%7;\nconst planned=(h,d)=>!h.days||h.days.includes(wd(d));\nconst daysLabel=h=>h.days.map(i=>DAYS[i]).join(\" · \");\nfunction streak(h){\n  const on=d=>(state.checks[keyOf(d)]||[]).includes(h.id);\n  let d=new Date(),n=0,guard=0;\n  if(!on(d)) d=addDays(d,-1);\n  while(guard++<800){\n    if(on(d)) n++;\n    else if(planned(h,d)) break;\n    d=addDays(d,-1);\n  }\n  return n;\n}\nfunction weekCount(hid,mon){let n=0;for(let i=0;i<7;i++)if((state.checks[keyOf(addDays(mon,i))]||[]).includes(hid))n++;return n}\nfunction weekStreak(h){\n  let w=mondayOf(new Date()),n=0;\n  if(weekCount(h.id,w)<goalOf(h)) w=addDays(w,-7);\n  while(weekCount(h.id,w)>=goalOf(h)){n++;w=addDays(w,-7)}\n  return n;\n}\nfunction render(){\n  const today=keyOf(new Date());\n  const days=[...Array(7)].map((_,i)=>addDays(weekStart,i));\n  const end=days[6];\n  const sameMonth=weekStart.getMonth()===end.getMonth();\n  $(\"weekTitle\").textContent=sameMonth\n    ? `${weekStart.getDate()}–${end.getDate()} ${MONTHS[end.getMonth()]}`\n    : `${weekStart.getDate()} ${MONTHS[weekStart.getMonth()].slice(0,3)} – ${end.getDate()} ${MONTHS[end.getMonth()].slice(0,3)}`;\n  $(\"yearLabel\").textContent=`${isoWeek(weekStart)}. hafta`+(end.getFullYear()!==new Date().getFullYear()?` · ${end.getFullYear()}`:\"\");\n  const isThisWeek=keyOf(weekStart)===keyOf(mondayOf(new Date()));\n  $(\"goToday\").hidden=isThisWeek;\n\n  const g=$(\"grid\");g.innerHTML=\"\";\n  days.forEach((d,i)=>{\n    const h=document.createElement(\"div\");\n    h.className=\"dayhead\"+(keyOf(d)===today?\" is-today\":\"\");\n    h.innerHTML=`<span class=\"dn\">${DAYS[i]}</span><span class=\"dd\">${d.getDate()}</span>`;\n    g.append(h);\n  });\n\n  let done=0,possible=0;\n  if(!listHabits().length){\n    const e=document.createElement(\"div\");e.className=\"empty\";e.style.gridColumn=\"1 / -1\";\n    e.innerHTML=\"<strong>Henüz rutin yok</strong><span>Alttaki “Rutin ekle” ile her gün yapmak istediğin ilk şeyi ekle.</span>\";\n    g.append(e);\n  }\n  listHabits().forEach(h=>{\n    const nb=document.createElement(\"button\");nb.className=\"hname\";nb.style.setProperty(\"--hc\",`var(--${h.color})`);\n    const goal=goalOf(h);\n    if(goal<7){\n      const cnt=weekCount(h.id,weekStart),met=cnt>=goal,ws=weekStreak(h);\n      nb.innerHTML=`<b></b><small class=\"${met?\"met\":\"\"}\">${met?\"Hedef tamam\":\"Haftada \"+goal+\" gün\"} · ${cnt}/${goal}${ws>1?` · ${ws} hafta seri`:\"\"}</small>`;\n      if(days[0]<=new Date()&&active(h,days[6])){possible+=goal;done+=Math.min(cnt,goal)}\n    }else{\n      const s=streak(h);\n      const lm=h.measure&&measurements(h).slice(-2);\n      const lead=h.measure?(lm.length?`Son: ${fmtN(lm[lm.length-1][1])} ${h.measure.unit}`+(lm.length>1?` (${lm[1][1]-lm[0][1]>0?\"+\":lm[1][1]-lm[0][1]<0?\"−\":\"±\"}${fmtN(Math.abs(lm[1][1]-lm[0][1]))})`:\"\"):`Her ${DAY_NAMES[h.days?h.days[0]:0]}`):h.days?daysLabel(h):h.qty?`Bugün ${fmtN(qtyOf(h,today))} / ${fmtN(h.qty.target)} ${h.qty.unit||\"\"}`:\"\";\n      const tail=s?`${s} ${h.days&&h.days.length===1?\"hafta\":\"gün\"} seri`:(lead?\"\":\"Düzenlemek için dokun\");\n      nb.innerHTML=`<b></b><small>${[lead,tail].filter(Boolean).join(\" · \")}</small>`;\n    }\n    nb.querySelector(\"b\").append(document.createTextNode(h.name));\n    nb.onclick=()=>openSheet(h);\n    g.append(nb);\n    days.forEach((d,i)=>{\n      const k=keyOf(d),on=(state.checks[k]||[]).includes(h.id),future=k>today;\n      const plan=planned(h,d);\n      if(!future&&goal===7&&plan&&active(h,d)){possible++;if(on)done++}\n      const c=document.createElement(\"div\");\n      c.className=\"cell\"+(k===today?\" is-today\":\"\")+(future?\" is-future\":\"\")+(plan?\"\":\" is-off\");\n      c.style.setProperty(\"--hc\",`var(--${h.color})`);\n      const b=document.createElement(\"button\");\n      b.setAttribute(\"aria-pressed\",on);b.setAttribute(\"aria-label\",`${h.name}, ${DAYS[i]} ${d.getDate()}`);\n      if(h.measure){\n        const v=valOf(h,k);\n        b.classList.add(\"meas\");b.innerHTML=CHECK+(v!=null?fmtN(v):\"\");\n        b.setAttribute(\"aria-label\",`${h.name}, ${DAYS[i]} ${d.getDate()}: ${v!=null?fmtN(v)+\" \"+(h.measure.unit||\"\"):\"ölçülmedi\"}`);\n        b.onclick=()=>{if(k>today)return;openMeasure(h,k)};\n      }else if(h.qty){\n        const v=qtyOf(h,k);\n        b.classList.add(\"qty\");b.style.setProperty(\"--fill\",Math.min(100,v/h.qty.target*100)+\"%\");\n        b.innerHTML=CHECK+(v>0&&!on?`<span class=\"qn\">${fmtN(v)}</span>`:\"\");\n        b.setAttribute(\"aria-label\",`${h.name}, ${DAYS[i]} ${d.getDate()}: ${fmtN(v)} / ${fmtN(h.qty.target)} ${h.qty.unit||\"\"}`);\n        bindQtyButton(b,h,k);\n      }else{b.innerHTML=CHECK;b.onclick=()=>toggle(h.id,k)}\n      c.append(b);g.append(c);\n    });\n  });\n  fitBoard();\n  const pct=possible?Math.round(done/possible*100):0;\n  $(\"weekStat\").textContent=possible?`${done}/${possible} tamamlandı · %${pct}`:(listHabits().length?\"Bu hafta henüz başlamadı\":\"\");\n  drawKilo();\n  $(\"meterBar\").style.width=pct+\"%\";\n}\n/* Tabloyu ekrana sığdır: kutu boyunu rutin sayısına ve kalan yüksekliğe göre ayarla */\nfunction fitBoard(){\n  const g=$(\"grid\"),n=listHabits().length;\n  g.style.gridTemplateRows=n?`auto repeat(${n}, auto minmax(0,1fr))`:\"\";\n  if(!n) return;\n  g.style.setProperty(\"--box\",\"22px\");\n  const avail=$(\"board\").clientHeight;\n  if(avail<50) return; // yerleşim henüz hazır değil; ResizeObserver tekrar çağıracak\n  const head=g.querySelector(\".dayhead\").offsetHeight;\n  let names=0;g.querySelectorAll(\".hname\").forEach(x=>names+=x.offsetHeight);\n  const per=(avail-head-names)/n-8;\n  g.style.setProperty(\"--box\",Math.max(18,Math.min(38,Math.floor(per)))+\"px\");\n}\n/* iOS ana ekran uygulaması: bazı sürümlerde görünür alan ekranın altına kadar inmiyor (ana ekran çizgisinin\n   üstünde bitiyor). O durumda alttaki güvenli alan payı gereksiz; sadece küçük bir boşluk bırak. */\nfunction fixStandaloneHeight(){\n  const app=document.querySelector(\".app\");\n  const standalone=navigator.standalone===true||matchMedia(\"(display-mode: standalone)\").matches;\n  const short=standalone&&innerHeight>innerWidth&&screen.height-innerHeight>20;\n  app.style.paddingBottom=short?\"10px\":\"\";\n}\nfixStandaloneHeight();\naddEventListener(\"resize\",()=>{fixStandaloneHeight();fitBoard()});\nif(window.ResizeObserver) new ResizeObserver(()=>fitBoard()).observe(document.getElementById(\"board\"));\naddEventListener(\"load\",()=>fitBoard());\nrequestAnimationFrame(()=>requestAnimationFrame(()=>fitBoard()));\n\nfunction isoWeek(mon){\n  const th=addDays(mon,3);const y=new Date(th.getFullYear(),0,4);\n  return 1+Math.round(((th-mondayOf(y))/864e5)/7);\n}\n\n/* ---------- actions ---------- */\nfunction touchCreated(hid,k){const h=state.habits.find(x=>x.id===hid);if(h&&h.created&&k<h.created)h.created=k}\nfunction toggle(hid,k){\n  touchCreated(hid,k);\n  const arr=state.checks[k]||[];\n  state.checks[k]=arr.includes(hid)?arr.filter(x=>x!==hid):[...arr,hid];\n  if(!state.checks[k].length) delete state.checks[k];\n  commit();\n  if(isOnK({id:hid},k)) celebrate(hid,k);\n}\nfunction commit(){\n  state.updated=Date.now();writeLocal();render();\n  dirty=true;clearTimeout(saveTimer);saveTimer=setTimeout(flush,1200);\n}\nasync function flush(){\n  if(!remote||!dirty) return;\n  if(saving){saveTimer=setTimeout(flush,400);return}\n  saving=true;dirty=false;\n  try{await remote.set(JSON.parse(JSON.stringify(state)))}catch(e){dirty=true}\n  saving=false;\n}\n\n/* ---------- sheet ---------- */\nlet editing=null,pickColor=\"c1\",pickGoal=7,pickDays=[],delArmed=false;\nfunction drawGoals(){\n  const w=$(\"goals\");w.innerHTML=\"\";\n  [7,\"days\",6,5,4,3,2,1].forEach(n=>{const b=document.createElement(\"button\");\n    b.textContent=n===7?\"Her gün\":n===\"days\"?\"Belirli günler\":`Haftada ${n}`;b.setAttribute(\"aria-pressed\",n===pickGoal);\n    b.onclick=()=>{pickGoal=n;if(n===\"days\"&&!pickDays.length)pickDays=[0,2,4];drawGoals()};w.append(b)});\n  const p=$(\"dayPick\");p.hidden=pickGoal!==\"days\";p.innerHTML=\"\";\n  DAYS.forEach((d,i)=>{const b=document.createElement(\"button\");\n    b.textContent=d;b.setAttribute(\"aria-pressed\",pickDays.includes(i));\n    b.onclick=()=>{pickDays=pickDays.includes(i)?pickDays.filter(x=>x!==i):[...pickDays,i].sort((a,b)=>a-b);drawGoals()};p.append(b)});\n}\nfunction applyGoal(h){\n  if(pickGoal===\"days\"&&pickDays.length&&pickDays.length<7){h.days=[...pickDays];h.goal=7}\n  else{delete h.days;h.goal=pickGoal===\"days\"?7:pickGoal}\n}\nfunction openSheet(h){\n  editing=h||null;delArmed=false;\n  $(\"sheetTitle\").textContent=h?\"Rutini düzenle\":\"Yeni rutin\";\n  $(\"nameInput\").value=h?h.name:\"\";\n  pickColor=h?h.color:COLORS[state.habits.length%COLORS.length];\n  $(\"delBtn\").hidden=!h;$(\"delBtn\").classList.remove(\"armed\");$(\"delBtn\").textContent=\"Sil\";\n  $(\"orderRow\").hidden=!h||state.habits.length<2;\n  pickGoal=h?(h.days?\"days\":goalOf(h)):7;\n  pickDays=h&&h.days?[...h.days]:[];\n  pickQty=h&&h.qty?{...h.qty}:null;\n  pickNotify=notifyOf(h);\n  drawSwatches();drawGoals();drawQtyEdit();drawNotifyEdit();$(\"scrim\").hidden=false;$(\"scrim\").querySelector(\".sheet\").scrollTop=0;\n  setTimeout(()=>{if(!h)$(\"nameInput\").focus()},50);\n}\nfunction closeSheet(){$(\"scrim\").hidden=true;editing=null}\nfunction drawSwatches(){\n  const w=$(\"swatches\");w.innerHTML=\"\";\n  COLORS.forEach(c=>{const b=document.createElement(\"button\");b.style.setProperty(\"--sc\",`var(--${c})`);\n    b.setAttribute(\"aria-pressed\",c===pickColor);b.setAttribute(\"aria-label\",\"Renk \"+c.slice(1));\n    b.onclick=()=>{pickColor=c;drawSwatches()};w.append(b)});\n}\nfunction move(dir){\n  const i=state.habits.indexOf(editing),j=i+dir;\n  if(j<0||j>=state.habits.length) return;\n  [state.habits[i],state.habits[j]]=[state.habits[j],state.habits[i]];commit();\n}\n$(\"upBtn\").onclick=()=>move(-1);\n$(\"downBtn\").onclick=()=>move(1);\n$(\"saveBtn\").onclick=()=>{\n  const name=$(\"nameInput\").value.trim();\n  if(!name){$(\"nameInput\").focus();$(\"nameInput\").placeholder=\"Bir ad yaz\";return}\n  const apply=h=>{\n    applyGoal(h);\n    const q=readQtyEdit();if(q)h.qty=q;else delete h.qty;\n    h.notify=readNotifyEdit();\n  };\n  if(editing){editing.name=name;editing.color=pickColor;apply(editing);if(editing.qty)resyncQty(editing)}\n  else{const h={id:uid(),name,color:pickColor,created:keyOf(new Date())};apply(h);state.habits.push(h)}\n  closeSheet();commit();\n};\n$(\"delBtn\").onclick=()=>{\n  if(!delArmed){delArmed=true;$(\"delBtn\").classList.add(\"armed\");$(\"delBtn\").textContent=\"Emin misin?\";return}\n  const id=editing.id;\n  state.habits=state.habits.filter(h=>h.id!==id);\n  for(const k in state.checks){state.checks[k]=state.checks[k].filter(x=>x!==id);if(!state.checks[k].length)delete state.checks[k]}\n  for(const k in (state.counts||{})){delete state.counts[k][id];if(!Object.keys(state.counts[k]).length)delete state.counts[k]}\n  for(const k in (state.values||{})){delete state.values[k][id];if(!Object.keys(state.values[k]).length)delete state.values[k]}\n  closeSheet();commit();\n};\n$(\"cancelBtn\").onclick=closeSheet;\n$(\"scrim\").onclick=e=>{if(e.target===$(\"scrim\"))closeSheet()};\n$(\"nameInput\").onkeydown=e=>{if(e.key===\"Enter\")$(\"saveBtn\").click()};\n$(\"addBtn\").onclick=()=>openSheet(null);\n$(\"prev\").onclick=()=>{weekStart=addDays(weekStart,-7);render()};\n$(\"next\").onclick=()=>{weekStart=addDays(weekStart,7);render()};\n$(\"goToday\").onclick=()=>{weekStart=mondayOf(new Date());render()};\n\n/* ---------- tarih / aktiflik yardımcıları ---------- */\nconst APP_VERSION=16;\nconst keyToDate=k=>{const[y,m,d]=k.split(\"-\").map(Number);return new Date(y,m-1,d)};\nconst today0=()=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate())};\nconst isOnK=(h,k)=>(state.checks[k]||[]).includes(h.id);\nconst isWeekly=h=>!h.days&&goalOf(h)<7;\nfunction startOf(h){return h.created?keyToDate(h.created):null}\nfunction active(h,d){const s=startOf(h);return !s||d>=s}\nfunction weekStats(mon){\n  const tk=keyOf(new Date());let done=0,possible=0;\n  for(const h of listHabits()){\n    if(isWeekly(h)){\n      const g=goalOf(h);\n      if(mon<=new Date()&&active(h,addDays(mon,6))){possible+=g;done+=Math.min(weekCount(h.id,mon),g)}\n      continue;\n    }\n    for(let i=0;i<7;i++){const d=addDays(mon,i),k=keyOf(d);\n      if(k<=tk&&planned(h,d)&&active(h,d)){possible++;if(isOnK(h,k))done++}}\n  }\n  return {done,possible,pct:possible?Math.round(done/possible*100):null};\n}\n\n/* ---------- seri hesapları ---------- */\nfunction longestStreak(h){\n  const s=[startOf(h),firstCheck(h)].filter(Boolean).sort((a,b)=>a-b)[0];if(!s)return 0;\n  const t=today0();let best=0,cur=0;\n  if(isWeekly(h)){\n    for(let w=mondayOf(s);w<=t;w=addDays(w,7)){\n      if(weekCount(h.id,w)>=goalOf(h)){cur++;best=Math.max(best,cur)}\n      else if(keyOf(w)!==keyOf(mondayOf(t)))cur=0;\n    }\n    return best;\n  }\n  for(let d=new Date(s);d<=t;d=addDays(d,1)){\n    const k=keyOf(d);\n    if(isOnK(h,k)){cur++;best=Math.max(best,cur)}\n    else if(planned(h,d)&&k!==keyOf(t))cur=0;\n  }\n  return best;\n}\nfunction firstCheck(h){let m=null;for(const k in state.checks)if(state.checks[k].includes(h.id)&&(!m||k<m))m=k;return m?keyToDate(m):null}\nfunction currentStreak(h){return isWeekly(h)?weekStreak(h):streak(h)}\nfunction monthPct(h,y,m){\n  const t=today0();let done=0,poss=0;\n  if(isWeekly(h)){\n    for(let w=mondayOf(new Date(y,m,1));w<=t&&w<new Date(y,m+1,1);w=addDays(w,7)){\n      if(!active(h,addDays(w,6)))continue;\n      if(keyOf(w)===keyOf(mondayOf(t))&&weekCount(h.id,w)<goalOf(h))continue; // süren hafta henüz bitmedi\n      poss++;if(weekCount(h.id,w)>=goalOf(h))done++;\n    }\n  }else{\n    for(let d=new Date(y,m,1);d.getMonth()===m&&d<=t;d=addDays(d,1)){\n      if(!planned(h,d)||!active(h,d))continue;\n      const k=keyOf(d);\n      if(k===keyOf(t)&&!isOnK(h,k))continue; // bugün henüz bitmedi\n      poss++;if(isOnK(h,k))done++;\n    }\n  }\n  return poss?Math.round(done/poss*100):null;\n}\nfunction weakestDay(h){\n  if(isWeekly(h))return null;\n  const t=today0(),miss=Array(7).fill(0),tot=Array(7).fill(0);\n  for(let i=1;i<=84;i++){const d=addDays(t,-i);\n    if(!planned(h,d)||!active(h,d))continue;\n    tot[wd(d)]++;if(!isOnK(h,keyOf(d)))miss[wd(d)]++;}\n  let bi=-1,br=0;\n  for(let i=0;i<7;i++)if(tot[i]>=2&&miss[i]/tot[i]>br){br=miss[i]/tot[i];bi=i}\n  if(tot.reduce((a,b)=>a+b,0)<5)return {text:\"Yeterli veri yok, birkaç hafta sonra burada en çok aksattığın gün görünecek.\"};\n  if(bi<0)return {text:\"Son 12 haftada hiç aksatmadın.\"};\n  return {text:`En çok aksattığın gün: ${DAY_NAMES[bi]} (%${Math.round(br*100)} kaçırdın)`};\n}\nconst DAY_NAMES=[\"Pazartesi\",\"Salı\",\"Çarşamba\",\"Perşembe\",\"Cuma\",\"Cumartesi\",\"Pazar\"];\n\n/* ---------- rozetler ---------- */\nconst BADGES_D=[[7,\"1 hafta\"],[30,\"1 ay\"],[100,\"100 gün\"],[365,\"1 yıl\"]];\nconst BADGES_W=[[4,\"4 hafta\"],[12,\"12 hafta\"],[26,\"26 hafta\"],[52,\"52 hafta\"]];\nconst MEDAL='<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"14\" r=\"6\"/><path d=\"M8.5 9 6 3h4l2 4 2-4h4l-2.5 6\"/></svg>';\n\n/* ---------- istatistik paneli ---------- */\nlet pMonth=new Date(today0().getFullYear(),today0().getMonth(),1),pView=\"month\",pFilter=\"all\";\nfunction openPanel(){pMonth=new Date(today0().getFullYear(),today0().getMonth(),1);$(\"panel\").hidden=false;drawPanel();$(\"panel\").scrollTop=0}\nfunction closePanel(){$(\"panel\").hidden=true;$(\"exportBox\").hidden=true;$(\"importBox\").hidden=true}\nfunction dayLevel(d){\n  const k=keyOf(d);\n  if(pFilter!==\"all\"){\n    const h=state.habits.find(x=>x.id===pFilter);if(!h)return {o:0};\n    const on=isOnK(h,k);\n    return {o:on?1:0,off:!on&&!isWeekly(h)&&!planned(h,d),hc:`var(--${h.color})`,text:on?\"yapıldı\":\"yapılmadı\"};\n  }\n  let poss=0,done=0,missed=[];\n  for(const h of listHabits()){\n    if(isWeekly(h)||!planned(h,d)||!active(h,d))continue;\n    poss++;if(isOnK(h,k))done++;else missed.push(h.name);\n  }\n  const r=poss?done/poss:0;\n  return {o:r?(.25+.75*r):0,r,done,poss,missed,hc:\"var(--accent)\"};\n}\nfunction drawPanel(){\n  // özet\n  const mon=mondayOf(new Date()),a=weekStats(mon),b=weekStats(addDays(mon,-7));\n  const diff=a.pct!=null&&b.pct!=null?a.pct-b.pct:null;\n  $(\"sumCard\").innerHTML=`<div class=\"eyebrow\">Bu hafta</div><div class=\"sumrow\"><span class=\"big\">%${a.pct??0}</span>${diff==null?\"\":`<span class=\"delta ${diff>=0?\"up\":\"down\"}\">${diff>=0?\"+\":\"−\"}${Math.abs(diff)} puan · geçen hafta %${b.pct}</span>`}</div><p class=\"muted\">${a.done}/${a.possible} tamamlandı. ${bestThisWeek()}</p>`;\n  // filtre\n  const ch=$(\"chips\");ch.innerHTML=\"\";\n  [{id:\"all\",name:\"Tümü\",color:\"accent\"},...listHabits()].forEach(h=>{\n    const b=document.createElement(\"button\");b.setAttribute(\"aria-pressed\",pFilter===h.id);\n    b.style.setProperty(\"--hc\",`var(--${h.color})`);b.innerHTML=\"<i></i>\";b.append(document.createTextNode(h.name));\n    b.onclick=()=>{pFilter=h.id;drawPanel()};ch.append(b);\n  });\n  $(\"segMonth\").setAttribute(\"aria-pressed\",pView===\"month\");$(\"segYear\").setAttribute(\"aria-pressed\",pView===\"year\");\n  $(\"monthView\").hidden=pView!==\"month\";$(\"yearView\").hidden=pView!==\"year\";\n  if(pView===\"month\")drawMonth();else drawYear();\n  drawHabitStats();\n  drawSync();\n  $(\"verLabel\").textContent=`Sürüm ${APP_VERSION}${window.__SCRIPT_VERSION__?` · Scriptable ${window.__SCRIPT_VERSION__}`:\"\"}`;\n}\nfunction bestThisWeek(){\n  const mon=mondayOf(new Date());let best=null,bp=-1;\n  for(const h of listHabits()){\n    if(isWeekly(h)){const p=Math.min(1,weekCount(h.id,mon)/goalOf(h));if(p>bp){bp=p;best=h}continue}\n    let poss=0,done=0;for(let i=0;i<7;i++){const d=addDays(mon,i);if(d>new Date()||!planned(h,d))continue;poss++;if(isOnK(h,keyOf(d)))done++}\n    if(poss&&done/poss>bp){bp=done/poss;best=h}\n  }\n  return best&&bp>0?`En iyi giden: ${best.name}.`:\"\";\n}\nfunction drawMonth(){\n  const g=$(\"mGrid\"),y=pMonth.getFullYear(),m=pMonth.getMonth(),tk=keyOf(new Date());\n  $(\"mTitle\").textContent=`${MONTHS[m]} ${y}`;\n  g.innerHTML=DAYS.map(d=>`<div class=\"dn\">${d}</div>`).join(\"\");\n  const first=new Date(y,m,1),lead=wd(first);\n  for(let i=0;i<lead;i++)g.insertAdjacentHTML(\"beforeend\",'<div class=\"sq blank\"></div>');\n  for(let d=new Date(first);d.getMonth()===m;d=addDays(d,1)){\n    const k=keyOf(d),L=dayLevel(d),c=document.createElement(\"button\");\n    c.className=\"sq\"+(k===tk?\" today\":\"\")+(k>tk?\" future\":\"\")+(L.off?\" off\":\"\")+(L.o>.6?\" hi\":\"\");\n    c.style.setProperty(\"--hc\",L.hc||\"var(--accent)\");\n    c.innerHTML=`<i style=\"--o:${k>tk?0:L.o}\"></i><span>${d.getDate()}</span>`;\n    const dd=new Date(d);\n    c.onclick=()=>{\n      const t=`${dd.getDate()} ${MONTHS[dd.getMonth()]} ${DAY_NAMES[wd(dd)]}: `;\n      if(k>tk){$(\"dayNote\").textContent=t+\"henüz gelmedi.\";return}\n      if(pFilter!==\"all\"){$(\"dayNote\").textContent=t+(L.off?\"plan dışı gün.\":L.text+\".\");return}\n      $(\"dayNote\").textContent=L.poss?t+`${L.done}/${L.poss} tamam`+(L.missed.length?` · eksik: ${L.missed.join(\", \")}`:\" · hepsi yapıldı\"):t+\"kayıt yok.\";\n    };\n    g.append(c);\n  }\n  $(\"dayNote\").textContent=\"Ayrıntı için bir güne dokun.\";\n}\nfunction drawYear(){\n  const g=$(\"yGrid\"),t=today0(),tk=keyOf(t);g.innerHTML=\"\";\n  const start=addDays(mondayOf(t),-52*7);let lastM=-1,col=0;\n  for(let w=new Date(start);w<=t;w=addDays(w,7),col++){\n    const lab=document.createElement(\"div\");lab.className=\"ml\";lab.style.gridColumn=col+1;\n    if(w.getMonth()!==lastM){lab.textContent=MONTHS[w.getMonth()].slice(0,3);lastM=w.getMonth()}\n    g.append(lab);\n    for(let i=0;i<7;i++){const d=addDays(w,i),k=keyOf(d),L=dayLevel(d),c=document.createElement(\"div\");\n      c.className=\"sq\"+(k>tk?\" blank\":\"\")+(k===tk?\" today\":\"\")+(L.off?\" off\":\"\");c.style.gridColumn=col+1;c.style.gridRow=i+2;\n      c.style.setProperty(\"--hc\",L.hc||\"var(--accent)\");c.innerHTML=k>tk?\"\":`<i style=\"--o:${L.o}\"></i>`;g.append(c)}\n  }\n  requestAnimationFrame(()=>{$(\"yScroll\").scrollLeft=$(\"yScroll\").scrollWidth});\n}\nfunction drawHabitStats(){\n  const y=pMonth.getFullYear(),m=pMonth.getMonth(),box0=$(\"habitStats\");box0.innerHTML=\"\";$(\"kiloStats\").innerHTML=\"\";\n  $(\"kiloCard\").hidden=!measureHabit();\n  $(\"hsTitle\").textContent=`Rutinler · ${MONTHS[m]}`;\n  for(const h of state.habits){\n    const pct=monthPct(h,y,m),cur=currentStreak(h),best=longestStreak(h),wk=isWeekly(h)||(h.days&&h.days.length===1),unit=wk?\"hafta\":\"gün\";\n    const el=document.createElement(\"div\");el.className=\"hs\";el.style.setProperty(\"--hc\",`var(--${h.color})`);\n    const weak=weakestDay(h);\n    el.innerHTML=`<div class=\"hs-top\"><b></b><span class=\"pct\">${pct==null?\"–\":\"%\"+pct}</span></div>\n      <div class=\"bar\"><i style=\"width:${pct||0}%\"></i></div>\n      <div class=\"facts\"><div><small>Şu anki seri</small><strong>${cur} ${unit}</strong></div><div><small>En uzun seri</small><strong>${best} ${unit}</strong></div><div><small>${isWeekly(h)?\"Hedef\":\"Plan\"}</small><strong>${isWeekly(h)?\"Haftada \"+goalOf(h):h.days?(h.days.length===1?DAY_NAMES[h.days[0]]:h.days.length+\" gün/hafta\"):\"Her gün\"}</strong></div></div>\n      ${weak?`<div class=\"weak\">${weak.text}</div>`:\"\"}\n      <div class=\"badges\">${(wk?BADGES_W:BADGES_D).map(([n,l])=>`<span class=\"badge${best>=n?\" got\":\"\"}\">${MEDAL}${l}</span>`).join(\"\")}</div>`;\n    el.querySelector(\"b\").append(document.createTextNode(h.name));\n    if(h.measure){\n      el.querySelector(\".weak\")?.remove();el.querySelector(\".hs-top\").remove();el.querySelector(\".bar\").remove();\n      el.querySelector(\".badges\").insertAdjacentHTML(\"beforebegin\",measureFacts(h));el.querySelector(\".badges\").before(measureChart(h));\n      $(\"kiloStats\").append(el);\n    }else box0.append(el);\n  }\n}\n$(\"statsBtn\").onclick=openPanel;\n$(\"panelClose\").onclick=closePanel;\n$(\"segMonth\").onclick=()=>{pView=\"month\";drawPanel()};\n$(\"segYear\").onclick=()=>{pView=\"year\";drawPanel()};\n$(\"mPrev\").onclick=()=>{pMonth=new Date(pMonth.getFullYear(),pMonth.getMonth()-1,1);drawPanel()};\n$(\"mNext\").onclick=()=>{pMonth=new Date(pMonth.getFullYear(),pMonth.getMonth()+1,1);drawPanel()};\n\n/* ---------- yedek ---------- */\n$(\"exportBtn\").onclick=async()=>{\n  $(\"importBox\").hidden=true;$(\"exportBox\").hidden=false;\n  const t=$(\"exportText\");t.value=JSON.stringify({app:\"haftalik-rutin\",saved:new Date().toISOString(),...state});\n  try{await navigator.clipboard.writeText(t.value);$(\"exportMsg\").textContent=\"Kopyalandı. Notlar'a ya da bir mesaja yapıştırıp sakla.\"}\n  catch(e){t.focus();t.select();t.setSelectionRange(0,t.value.length);$(\"exportMsg\").textContent=\"Metni seçtim; Kopyala'ya dokunup bir yere yapıştır.\"}\n};\nlet importArmed=false;\n$(\"importBtn\").onclick=()=>{$(\"exportBox\").hidden=true;$(\"importBox\").hidden=false;importArmed=false;$(\"importDo\").textContent=\"Geri yükle\";$(\"importMsg\").textContent=\"Mevcut verilerin yedektekilerle değiştirilir.\"};\n$(\"importDo\").onclick=()=>{\n  let data;\n  try{data=JSON.parse($(\"importText\").value.trim())}catch(e){$(\"importMsg\").textContent=\"Bu metin bir Rutin yedeği değil. Yedeği eksiksiz yapıştırdığından emin ol.\";return}\n  if(!data||!Array.isArray(data.habits)||typeof data.checks!==\"object\"){$(\"importMsg\").textContent=\"Yedekte rutin listesi bulunamadı.\";return}\n  if(!importArmed){importArmed=true;$(\"importDo\").textContent=`Evet, ${data.habits.length} rutini yükle`;$(\"importMsg\").textContent=\"Emin misin? Şu anki işaretlerin silinip yedektekiler gelecek.\";return}\n  delete data.app;delete data.saved;\n  state=data;migrate(state);commit();\n  $(\"importBox\").hidden=true;$(\"importText\").value=\"\";drawPanel();\n  $(\"exportMsg\").textContent=\"\";$(\"backupInfo\").textContent=\"Yedek yüklendi.\";\n};\n\n/* ---------- kutlama ---------- */\nfunction celebrate(hid,k){\n  const h=state.habits.find(x=>x.id===hid);if(!h||!isOnK(h,k))return;\n  const tk=keyOf(new Date()),yk=keyOf(addDays(new Date(),-1));\n  if(isWeekly(h)){\n    const c=weekCount(h.id,mondayOf(keyToDate(k)));\n    if(c===goalOf(h)){\n      const ws=weekStreak(h),hit=BADGES_W.find(([n])=>n===ws);\n      return showCele(h,hit?ws:c,hit?\"hafta üst üste\":`/${goalOf(h)} · haftalık hedef tamam`,hit?`${hit[1]} rozeti kazandın`:h.name);\n    }\n    return;\n  }\n  if(k===tk||k===yk){\n    const s=streak(h),hit=BADGES_D.find(([n])=>n===s);\n    if(hit)return showCele(h,s,\"gün seri\",`${h.name} · ${hit[1]} rozeti`);\n  }\n  if(k===tk){\n    const d=today0(),todays=listHabits().filter(x=>!isWeekly(x)&&planned(x,d));\n    if(todays.length&&todays.every(x=>isOnK(x,tk)))return showCele({color:\"c1\"},todays.length,\"rutinin hepsi bugün tamam\",\"Harika bir gün!\");\n  }\n}\nlet celeTimer=null;\nfunction showCele(h,num,label,sub){\n  const c=$(\"celeCard\");c.style.setProperty(\"--hc\",`var(--${h.color})`);\n  c.innerHTML=`<div class=\"num\">${num}</div><div class=\"lbl\"></div><div class=\"sub2\"></div>`;\n  c.querySelector(\".lbl\").textContent=label;c.querySelector(\".sub2\").textContent=sub;\n  $(\"celebrate\").hidden=false;confetti(getComputedStyle(c).getPropertyValue(\"--hc\"));\n  clearTimeout(celeTimer);celeTimer=setTimeout(()=>{$(\"celebrate\").hidden=true},2800);\n}\n$(\"celebrate\").onclick=()=>{$(\"celebrate\").hidden=true};\nfunction confetti(){\n  if(matchMedia(\"(prefers-reduced-motion: reduce)\").matches)return;\n  const cv=$(\"confetti\"),ctx=cv.getContext(\"2d\"),W=cv.width=innerWidth*devicePixelRatio,H=cv.height=innerHeight*devicePixelRatio;\n  const cs=getComputedStyle(document.documentElement),cols=[\"--c1\",\"--c2\",\"--c3\",\"--c4\",\"--c5\",\"--c6\",\"--c13\"].map(v=>cs.getPropertyValue(v).trim());\n  const ps=[...Array(140)].map(()=>({x:W/2,y:H*.45,vx:(Math.random()-.5)*W*.03,vy:-Math.random()*H*.025-H*.005,r:(4+Math.random()*5)*devicePixelRatio,c:cols[Math.random()*cols.length|0],a:Math.random()*6,s:(Math.random()-.5)*.3}));\n  const t0=performance.now();\n  (function f(t){const e=t-t0;ctx.clearRect(0,0,W,H);\n    for(const p of ps){p.vy+=H*.0009;p.x+=p.vx;p.y+=p.vy;p.vx*=.99;p.a+=p.s;\n      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.a);ctx.globalAlpha=Math.max(0,1-e/2400);ctx.fillStyle=p.c;ctx.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);ctx.restore()}\n    if(e<2400)requestAnimationFrame(f);else ctx.clearRect(0,0,W,H)})(t0);\n}\n\n/* ---------- miktarlı rutinler (su sayacı) ---------- */\nconst fmtN=n=>Number(n).toLocaleString(\"tr-TR\",{maximumFractionDigits:2});\nconst parseN=s=>{const n=parseFloat(String(s).replace(\",\",\".\"));return isFinite(n)?n:0};\nfunction qtyOf(h,k){return (state.counts&&state.counts[k]&&state.counts[k][h.id])||0}\nfunction setQty(h,k,v){\n  if(v>0)touchCreated(h.id,k);\n  v=Math.max(0,Math.round(v*1000)/1000);\n  state.counts=state.counts||{};\n  const day=state.counts[k]||(state.counts[k]={});\n  if(v>0)day[h.id]=v;else delete day[h.id];\n  if(!Object.keys(day).length)delete state.counts[k];\n  const was=isOnK(h,k),now=v>=h.qty.target;\n  const arr=(state.checks[k]||[]).filter(x=>x!==h.id);\n  if(now)arr.push(h.id);\n  if(arr.length)state.checks[k]=arr;else delete state.checks[k];\n  commit();\n  if(now&&!was)celebrate(h.id,k);\n}\nlet qH=null,qK=null;\nfunction openQty(h,k){\n  qH=h;qK=k;$(\"qScrim\").hidden=false;drawQty();\n}\nfunction drawQty(){\n  const h=qH,k=qK,v=qtyOf(h,k),t=h.qty.target,d=keyToDate(k);\n  const s=$(\"qScrim\").querySelector(\".sheet\");s.style.setProperty(\"--hc\",`var(--${h.color})`);\n  $(\"qTitle\").textContent=h.name;\n  $(\"qDay\").textContent=`${d.getDate()} ${MONTHS[d.getMonth()]} ${DAY_NAMES[wd(d)]}`+(k===keyOf(new Date())?\" · bugün\":\"\");\n  $(\"qBig\").innerHTML=`${fmtN(v)} <small>/ ${fmtN(t)} ${h.qty.unit||\"\"}</small>`;\n  $(\"qBar\").style.width=Math.min(100,v/t*100)+\"%\";\n  $(\"qMinus\").textContent=`− ${fmtN(h.qty.step)} ${h.qty.unit||\"\"}`;\n  $(\"qPlus\").textContent=`+ ${fmtN(h.qty.step)} ${h.qty.unit||\"\"}`;\n}\n$(\"qPlus\").onclick=()=>{setQty(qH,qK,qtyOf(qH,qK)+qH.qty.step);drawQty()};\n$(\"qMinus\").onclick=()=>{setQty(qH,qK,qtyOf(qH,qK)-qH.qty.step);drawQty()};\n$(\"qReset\").onclick=()=>{setQty(qH,qK,0);drawQty()};\n$(\"qFull\").onclick=()=>{setQty(qH,qK,Math.max(qtyOf(qH,qK),qH.qty.target));drawQty()};\n$(\"qClose\").onclick=()=>{$(\"qScrim\").hidden=true};\n$(\"qScrim\").onclick=e=>{if(e.target===$(\"qScrim\"))$(\"qScrim\").hidden=true};\n// hücreye dokun: +1 adım (hedef doluysa ayrıntı açılır); basılı tut: ayrıntı\nfunction resyncQty(h){ // hedef değişince işaretleri miktarla uyumlu tut\n  state.counts=state.counts||{};\n  for(const k of new Set([...Object.keys(state.counts),...Object.keys(state.checks)])){\n    const has=state.counts[k]&&h.id in state.counts[k];\n    if(!has&&isOnK(h,k)){(state.counts[k]=state.counts[k]||{})[h.id]=h.qty.target;continue} // eski tam işaret = hedef\n    if(!has)continue;\n    const v=qtyOf(h,k),arr=(state.checks[k]||[]).filter(x=>x!==h.id);\n    if(v>=h.qty.target)arr.push(h.id);\n    if(arr.length)state.checks[k]=arr;else delete state.checks[k];\n  }\n}\nfunction bindQtyButton(b,h,k){\n  let timer=null,long=false;\n  b.addEventListener(\"pointerdown\",()=>{long=false;timer=setTimeout(()=>{long=true;openQty(h,k)},450)});\n  [\"pointerup\",\"pointerleave\",\"pointercancel\"].forEach(ev=>b.addEventListener(ev,()=>clearTimeout(timer)));\n  b.addEventListener(\"contextmenu\",e=>e.preventDefault());\n  b.onclick=()=>{\n    if(long)return;\n    const v=qtyOf(h,k);\n    if(v>=h.qty.target)return openQty(h,k);\n    setQty(h,k,v+h.qty.step);\n  };\n}\n\n/* ---------- düzenleme ekranı: miktar ve bildirim ---------- */\nconst NOTIFY_DEFAULTS=[\n  [/\\bsu\\b/i,{mode:\"times\",times:[\"09:00\",\"12:00\",\"15:00\",\"18:00\",\"21:00\"]}],\n  [/spor/i,{mode:\"times\",times:[\"10:00\",\"18:00\"]}],\n  [/diyet/i,{mode:\"times\",times:[\"08:30\",\"13:00\",\"19:30\"]}],\n  [/kitap/i,{mode:\"random\",random:{count:2,from:\"10:00\",to:\"22:00\"}}],\n  [/klip/i,{mode:\"random\",random:{count:2,from:\"10:00\",to:\"22:00\"}}],\n  [/yürüyüş|yuruyus/i,{mode:\"times\",times:[\"08:00\",\"20:00\"]}],\n  [/uyku/i,{mode:\"times\",times:[\"23:00\"]}],\n  [/kilo|tart/i,{mode:\"times\",times:[\"09:00\"]}]\n];\nfunction notifyOf(h){\n  if(h&&h.notify)return JSON.parse(JSON.stringify(h.notify));\n  const d=h&&NOTIFY_DEFAULTS.find(([re])=>re.test(h.name));\n  return d?JSON.parse(JSON.stringify(d[1])):{mode:\"off\"};\n}\nlet pickQty=null,pickNotify={mode:\"off\"};\nfunction drawQtyEdit(){\n  const w=$(\"qMode\");w.innerHTML=\"\";\n  [[\"off\",\"Yapıldı / yapılmadı\"],[\"on\",\"Miktarla say\"]].forEach(([m,l])=>{\n    const b=document.createElement(\"button\");b.textContent=l;b.setAttribute(\"aria-pressed\",(m===\"on\")===!!pickQty);\n    b.onclick=()=>{pickQty=m===\"on\"?(pickQty||{target:3,unit:\"L\",step:0.25}):null;drawQtyEdit()};w.append(b);\n  });\n  $(\"qFields\").hidden=!pickQty;\n  if(pickQty){$(\"qTarget\").value=fmtN(pickQty.target);$(\"qUnit\").value=pickQty.unit||\"\";$(\"qStep\").value=fmtN(pickQty.step)}\n}\nfunction readQtyEdit(){\n  if(!pickQty)return null;\n  const target=parseN($(\"qTarget\").value),step=parseN($(\"qStep\").value);\n  if(target<=0||step<=0)return null;\n  return {target,step,unit:$(\"qUnit\").value.trim()};\n}\nfunction drawNotifyEdit(){\n  const w=$(\"nMode\");w.innerHTML=\"\";\n  [[\"off\",\"Kapalı\"],[\"times\",\"Belirli saatler\"],[\"random\",\"Rastgele\"]].forEach(([m,l])=>{\n    const b=document.createElement(\"button\");b.textContent=l;b.setAttribute(\"aria-pressed\",pickNotify.mode===m);\n    b.onclick=()=>{\n      pickNotify.mode=m;\n      if(m===\"times\"&&!(pickNotify.times&&pickNotify.times.length))pickNotify.times=[\"09:00\"];\n      if(m===\"random\"&&!pickNotify.random)pickNotify.random={count:2,from:\"10:00\",to:\"22:00\"};\n      drawNotifyEdit();\n    };w.append(b);\n  });\n  $(\"nTimes\").hidden=pickNotify.mode!==\"times\";$(\"nRand\").hidden=pickNotify.mode!==\"random\";\n  if(pickNotify.mode===\"times\"){\n    const l=$(\"nList\");l.innerHTML=\"\";\n    (pickNotify.times||[]).slice().sort().forEach(t=>{\n      const b=document.createElement(\"button\");b.className=\"tchip\";b.innerHTML=`${t} <span aria-hidden=\"true\">✕</span>`;\n      b.setAttribute(\"aria-label\",`${t} saatini kaldır`);\n      b.onclick=()=>{pickNotify.times=pickNotify.times.filter(x=>x!==t);drawNotifyEdit()};l.append(b);\n    });\n  }\n  if(pickNotify.mode===\"random\"){const r=pickNotify.random;$(\"nCount\").value=String(r.count);$(\"nFrom\").value=r.from;$(\"nTo\").value=r.to}\n}\n$(\"nAdd\").onclick=()=>{const t=$(\"nTimeIn\").value;if(!t)return;pickNotify.times=[...new Set([...(pickNotify.times||[]),t])];drawNotifyEdit()};\n[\"nCount\",\"nFrom\",\"nTo\"].forEach(id=>$(id).onchange=()=>{\n  const f=$(\"nFrom\").value||\"10:00\",t=$(\"nTo\").value||\"22:00\";\n  pickNotify.random={count:Number($(\"nCount\").value)||2,from:f<t?f:t,to:f<t?t:f};\n});\nfunction readNotifyEdit(){\n  const n=pickNotify;\n  if(n.mode===\"times\")return n.times&&n.times.length?{mode:\"times\",times:[...n.times].sort()}:{mode:\"off\"};\n  if(n.mode===\"random\")return {mode:\"random\",random:n.random};\n  return {mode:\"off\"};\n}\n\n/* ---------- ölçümlü rutinler (haftalık kilo) — rutin listesinden ayrı ---------- */\nfunction listHabits(){return state.habits.filter(h=>!h.measure)}\nfunction measureHabit(){return state.habits.find(h=>h.measure)}\nconst SCALE='<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke-width=\"2.2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><rect x=\"3.5\" y=\"3.5\" width=\"17\" height=\"17\" rx=\"4\"/><path d=\"M8.5 9.5a5 5 0 0 1 7 0M12 9.5l1.5-1.8\"/></svg>';\nfunction drawKilo(){\n  const h=measureHabit(),b=$(\"kiloBtn\");b.hidden=!h;if(!h)return;\n  // bu haftanın ölçümü (hangi gün girildiyse); yoksa bugün için yeni ölçüm\n  const mon=keyOf(mondayOf(new Date())),pts=measurements(h),thisWeek=pts.filter(p=>p[0]>=mon).pop();\n  const v=thisWeek?thisWeek[1]:null,target=thisWeek?thisWeek[0]:keyOf(new Date()),last=pts[pts.length-1],u=h.measure.unit||\"\";\n  b.style.setProperty(\"--hc\",`var(--${h.color})`);b.classList.toggle(\"due\",v==null);\n  const delta=pts.length>1?pts[pts.length-1][1]-pts[pts.length-2][1]:null;\n  b.innerHTML=`<span class=\"ki\">${SCALE}</span><span class=\"kt\"><b>${last?fmtN(last[1])+\" \"+u:\"Kilo\"}${delta!=null?` <small style=\"display:inline\">${delta>0?\"▲\":delta<0?\"▼\":\"\"}${fmtN(Math.abs(delta))}</small>`:\"\"}</b><small>${v==null?\"Ölçümü gir\":\"Bu hafta tamam\"}</small></span>`;\n  b.setAttribute(\"aria-label\",`${h.name}: ${last?fmtN(last[1])+\" \"+u:\"henüz ölçüm yok\"}. ${v==null?\"Bu haftanın ölçümünü gir\":\"Bu hafta ölçüldü, düzenlemek için dokun\"}`);\n  b.onclick=()=>openMeasure(h,target);\n}\nfunction valOf(h,k){return state.values&&state.values[k]&&state.values[k][h.id]}\nfunction measurements(h){const out=[];for(const k in (state.values||{}))if(state.values[k][h.id]!=null)out.push([k,state.values[k][h.id]]);return out.sort((a,b)=>a[0]<b[0]?-1:1)}\nfunction prevMeasure(h,k){const m=measurements(h).filter(x=>x[0]<k);return m.length?m[m.length-1]:null}\nfunction setVal(h,k,v){\n  if(v!=null)touchCreated(h.id,k);\n  state.values=state.values||{};\n  const day=state.values[k]||(state.values[k]={});\n  if(v==null)delete day[h.id];else day[h.id]=v;\n  if(!Object.keys(day).length)delete state.values[k];\n  const was=isOnK(h,k),arr=(state.checks[k]||[]).filter(x=>x!==h.id);\n  if(v!=null)arr.push(h.id);\n  if(arr.length)state.checks[k]=arr;else delete state.checks[k];\n  commit();\n  if(v!=null&&!was)celebrate(h.id,k);\n}\nlet mH=null,mK=null;\nfunction openMeasure(h,k){\n  mH=h;mK=k;const d=keyToDate(k),v=valOf(h,k),p=prevMeasure(h,k);\n  $(\"mScrim\").querySelector(\".sheet\").style.setProperty(\"--hc\",`var(--${h.color})`);\n  $(\"mTitle2\").textContent=h.name;\n  $(\"mDay\").textContent=`${d.getDate()} ${MONTHS[d.getMonth()]} ${DAY_NAMES[wd(d)]}`+(k===keyOf(new Date())?\" · bugün\":\"\");\n  $(\"mUnit\").textContent=h.measure.unit||\"\";\n  $(\"mInput\").value=v!=null?fmtN(v):\"\";\n  $(\"mInput\").placeholder=p?fmtN(p[1]):\"0\";\n  $(\"mPrevTxt\").textContent=p?`Önceki ölçüm: ${fmtN(p[1])} ${h.measure.unit||\"\"} (${keyToDate(p[0]).getDate()} ${MONTHS[keyToDate(p[0]).getMonth()].slice(0,3)})`:\"İlk ölçümün.\";\n  $(\"mDel\").hidden=v==null;\n  $(\"mScrim\").hidden=false;setTimeout(()=>$(\"mInput\").focus(),60);\n}\n$(\"mSave\").onclick=()=>{\n  const raw=$(\"mInput\").value.trim();\n  if(!raw){$(\"mInput\").focus();return}\n  const v=parseN(raw);\n  if(!(v>0)){$(\"mPrevTxt\").textContent=\"Geçerli bir sayı yaz, örneğin 78,4.\";return}\n  $(\"mScrim\").hidden=true;setVal(mH,mK,Math.round(v*100)/100);\n};\n$(\"mDel\").onclick=()=>{$(\"mScrim\").hidden=true;setVal(mH,mK,null)};\n$(\"mCancel\").onclick=()=>{$(\"mScrim\").hidden=true};\n$(\"mInput\").onkeydown=e=>{if(e.key===\"Enter\")$(\"mSave\").click()};\n$(\"mScrim\").onclick=e=>{if(e.target===$(\"mScrim\"))$(\"mScrim\").hidden=true};\n\n/* kilo grafiği: tek seri, tek eksen; dokununca o haftanın değeri okunur */\nfunction measureChart(h){\n  const pts=measurements(h).slice(-26),u=h.measure.unit||\"\";\n  const wrap=document.createElement(\"div\");wrap.style.cssText=\"display:flex;flex-direction:column;gap:6px\";\n  if(pts.length<2){wrap.innerHTML=`<p class=\"muted\">${pts.length?`İlk ölçüm: ${fmtN(pts[0][1])} ${u}. `:\"\"}Grafik için en az 2 haftalık ölçüm gerekiyor.</p>`;return wrap}\n  const W=320,H=150,L=36,R=40,T=14,B=22,vals=pts.map(p=>p[1]);\n  let lo=Math.min(...vals),hi=Math.max(...vals);const padv=Math.max(.5,(hi-lo)*.15);lo=Math.floor((lo-padv)*2)/2;hi=Math.ceil((hi+padv)*2)/2;\n  const x=i=>L+(W-L-R)*(pts.length===1?0:i/(pts.length-1)),y=v=>T+(H-T-B)*(1-(v-lo)/(hi-lo));\n  const ticks=[lo,(lo+hi)/2,hi];\n  const line=pts.map((p,i)=>`${i?\"L\":\"M\"}${x(i).toFixed(1)},${y(p[1]).toFixed(1)}`).join(\" \");\n  const area=`${line} L${x(pts.length-1).toFixed(1)},${H-B} L${x(0).toFixed(1)},${H-B} Z`;\n  const dl=k=>{const d=keyToDate(k);return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0,3)}`};\n  const last=pts.length-1;\n  wrap.innerHTML=`<svg class=\"chart\" viewBox=\"0 0 ${W} ${H}\" role=\"img\" aria-label=\"${h.name} grafiği\">\n    <g class=\"grid\">${ticks.map(t=>`<line x1=\"${L}\" x2=\"${W-R}\" y1=\"${y(t)}\" y2=\"${y(t)}\"/>`).join(\"\")}</g>\n    ${ticks.map(t=>`<text x=\"${L-6}\" y=\"${y(t)+3}\" text-anchor=\"end\">${fmtN(t)}</text>`).join(\"\")}\n    <text x=\"${x(0)}\" y=\"${H-6}\" text-anchor=\"start\">${dl(pts[0][0])}</text>\n    <text x=\"${x(last)}\" y=\"${H-6}\" text-anchor=\"end\">${dl(pts[last][0])}</text>\n    <path d=\"${area}\" fill=\"var(--hc)\" opacity=\".1\"/>\n    <path d=\"${line}\" fill=\"none\" stroke=\"var(--hc)\" stroke-width=\"2\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/>\n    <line class=\"xh\" y1=\"${T}\" y2=\"${H-B}\" stroke=\"var(--muted)\" stroke-width=\"1\" stroke-dasharray=\"3 3\" visibility=\"hidden\"/>\n    ${pts.map((p,i)=>`<circle cx=\"${x(i)}\" cy=\"${y(p[1])}\" r=\"${i===last?5:3.5}\" fill=\"var(--hc)\" stroke=\"var(--surface)\" stroke-width=\"2\"/>`).join(\"\")}\n    <text class=\"lbl\" x=\"${x(last)+8}\" y=\"${y(pts[last][1])+4}\">${fmtN(pts[last][1])}</text>\n  </svg><div class=\"readout\">Bir noktaya dokun.</div>`;\n  const svg=wrap.querySelector(\"svg\"),xh=svg.querySelector(\".xh\"),ro=wrap.querySelector(\".readout\"),dots=[...svg.querySelectorAll(\"circle\")];\n  const pick=e=>{\n    const r=svg.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*W;\n    let bi=0,bd=1e9;pts.forEach((p,i)=>{const d=Math.abs(x(i)-px);if(d<bd){bd=d;bi=i}});\n    xh.setAttribute(\"x1\",x(bi));xh.setAttribute(\"x2\",x(bi));xh.setAttribute(\"visibility\",\"visible\");\n    dots.forEach((c,i)=>c.setAttribute(\"r\",i===bi?6:(i===last?5:3.5)));\n    const prev=bi?pts[bi][1]-pts[bi-1][1]:null;\n    ro.textContent=`${dl(pts[bi][0])}: ${fmtN(pts[bi][1])} ${u}`+(prev!=null?` · önceki haftaya göre ${prev>0?\"+\":prev<0?\"−\":\"±\"}${fmtN(Math.abs(prev))} ${u}`:\"\");\n  };\n  svg.addEventListener(\"pointerdown\",pick);svg.addEventListener(\"pointermove\",e=>{if(e.pointerType===\"mouse\"||e.buttons)pick(e)});\n  return wrap;\n}\nfunction measureFacts(h){\n  const pts=measurements(h),u=h.measure.unit||\"\";\n  if(!pts.length)return \"\";\n  const first=pts[0][1],lastV=pts[pts.length-1][1],ch=lastV-first;\n  return `<div class=\"facts\"><div><small>Başlangıç</small><strong>${fmtN(first)} ${u}</strong></div><div><small>Son ölçüm</small><strong>${fmtN(lastV)} ${u}</strong></div><div><small>Toplam değişim</small><strong>${ch>0?\"▲ +\":ch<0?\"▼ −\":\"\"}${fmtN(Math.abs(ch))} ${u}</strong></div></div>`;\n}\n\n/* ---------- Unutma: notlar ve ara ara hatırlatma ---------- */\nconst G_FREQ=[[\"off\",\"Hatırlatma yok\"],[\"daily\",\"Her gün\"],[\"few\",\"2-3 günde bir\"],[\"weekly\",\"Haftada bir\"],[\"m1\",\"Ayda bir\"],[\"m2\",\"2 ayda bir\"],[\"m3\",\"3 ayda bir\"]];\nlet gFreqNew=\"few\",gEdit=null,gFreqEd=\"few\",gDelArmed=false;\nconst goalsOf=()=>state.goals||(state.goals=[]);\nfunction drawFreq(id,cur,set){\n  const w=$(id);w.innerHTML=\"\";\n  G_FREQ.forEach(([v,l])=>{const b=document.createElement(\"button\");b.textContent=l;b.setAttribute(\"aria-pressed\",v===cur);b.onclick=()=>set(v);w.append(b)});\n}\nfunction goalItem(g){\n  const el=document.createElement(\"div\");el.className=\"goal\"+(g.done?\" done\":\"\");\n  const c=document.createElement(\"button\");c.className=\"gcheck\";c.innerHTML=CHECK;\n  c.setAttribute(\"aria-label\",g.done?\"Tamamlanmadı olarak işaretle\":\"Tamamlandı olarak işaretle\");\n  c.onclick=()=>{g.done=g.done?null:keyOf(new Date());commit();drawGoals2();if(g.done)showCele({color:\"c1\"},\"✓\",\"Tamamlandı\",g.text.length>60?g.text.slice(0,60)+\"…\":g.text)};\n  const body=document.createElement(\"button\");body.className=\"gbody\";\n  const t=document.createElement(\"p\");t.className=\"gtext\";t.textContent=g.text;\n  const d=keyToDate(g.created),f=G_FREQ.find(x=>x[0]===g.remind)||G_FREQ[0];\n  const m=document.createElement(\"div\");m.className=\"gmeta\";\n  m.textContent=g.done?`${keyToDate(g.done).getDate()} ${MONTHS[keyToDate(g.done).getMonth()]} tarihinde tamamlandı`:`${d.getDate()} ${MONTHS[d.getMonth()]} · ${g.remind===\"off\"?\"hatırlatma yok\":\"🔔 \"+f[1].toLocaleLowerCase(\"tr\")}`;\n  body.append(t,m);body.onclick=()=>openGoalEdit(g);\n  el.append(c,body);return el;\n}\nfunction drawGoals2(){\n  const gs=goalsOf(),act=gs.filter(g=>!g.done),done=gs.filter(g=>g.done).sort((a,b)=>a.done<b.done?1:-1);\n  const l=$(\"gList\");l.innerHTML=\"\";\n  if(!act.length)l.innerHTML='<p class=\"gempty\">Henüz not yok. Unutmak istemediğin şeyi yukarıya yaz, “Ekle”ye dokun. Seçtiğin sıklıkta sana bildirimle hatırlatırım.</p>';\n  act.forEach(g=>l.append(goalItem(g)));\n  $(\"gActiveTitle\").textContent=act.length?`Notlarım (${act.length})`:\"Notlarım\";\n  $(\"gDoneCard\").hidden=!done.length;$(\"gDoneSum\").textContent=`Tamamlananlar (${done.length})`;\n  const dl=$(\"gDoneList\");dl.innerHTML=\"\";done.forEach(g=>dl.append(goalItem(g)));\n  drawFreq(\"gFreqNew\",gFreqNew,v=>{gFreqNew=v;drawGoals2()});\n  const n=act.length,cnt=$(\"gCount\");cnt.textContent=n;cnt.hidden=!n;\n}\nfunction openGoalEdit(g){\n  gEdit=g;gFreqEd=g.remind||\"off\";gDelArmed=false;\n  $(\"gEditText\").value=g.text;$(\"gDel\").textContent=\"Sil\";$(\"gDel\").classList.remove(\"armed\");\n  setEditFreq(gFreqEd);\n  $(\"gScrim\").hidden=false;\n}\nfunction setEditFreq(v){gFreqEd=v;drawFreq(\"gFreqEdit\",gFreqEd,setEditFreq)}\n$(\"gAdd\").onclick=()=>{\n  const text=$(\"gNew\").value.trim();if(!text){$(\"gNew\").focus();return}\n  goalsOf().unshift({id:uid(),text,created:keyOf(new Date()),done:null,remind:gFreqNew});\n  $(\"gNew\").value=\"\";commit();drawGoals2();\n};\n$(\"gSave\").onclick=()=>{const t=$(\"gEditText\").value.trim();if(!t)return;gEdit.text=t;gEdit.remind=gFreqEd;$(\"gScrim\").hidden=true;commit();drawGoals2()};\n$(\"gCancel\").onclick=()=>{$(\"gScrim\").hidden=true};\n$(\"gScrim\").onclick=e=>{if(e.target===$(\"gScrim\"))$(\"gScrim\").hidden=true};\n$(\"gDel\").onclick=()=>{\n  if(!gDelArmed){gDelArmed=true;$(\"gDel\").classList.add(\"armed\");$(\"gDel\").textContent=\"Emin misin?\";return}\n  state.goals=goalsOf().filter(x=>x!==gEdit);$(\"gScrim\").hidden=true;commit();drawGoals2();\n};\n$(\"goalsBtn\").onclick=()=>{$(\"gPanel\").hidden=false;$(\"gPanel\").scrollTop=0;drawGoals2()};\n$(\"gClose\").onclick=()=>{$(\"gPanel\").hidden=true};\ndrawGoals2();\n\n/* ---------- swipe between weeks ---------- */\nlet sx=null,sy=null;\n$(\"grid\").addEventListener(\"touchstart\",e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});\n$(\"grid\").addEventListener(\"touchend\",e=>{\n  if(sx===null)return;const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;sx=null;\n  if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*1.5){weekStart=addDays(weekStart,dx<0?7:-7);render()}\n});\n\nif(migratedLocal) commit(); else render();\n\n/* ---------- uygulama ---------- */\nlet lastDay=keyOf(new Date());\ndocument.addEventListener(\"visibilitychange\",()=>{\n  if(document.visibilityState!==\"visible\") return;\n  const t=keyOf(new Date());\n  if(t!==lastDay){lastDay=t;weekStart=mondayOf(new Date())}\n  render();\n  pullRemote();\n});\ndocument.addEventListener(\"visibilitychange\",()=>{if(document.visibilityState===\"hidden\"&&dirty)flush()});\nif(\"serviceWorker\" in navigator) navigator.serviceWorker.register(\"sw.js\").catch(()=>{});\n/* ---------- GitHub Gist senkronizasyonu (widget ve bildirimler için Scriptable ile ortak veri) ---------- */\nconst GIST_FILE=\"rutin.json\",GIST_DESC=\"Haftalık Rutin verileri (otomatik senkron)\";\nconst SYNC_ON=!window.__INIT__; // Scriptable içindeki kopya kendi eşitlemesini yapar\nlet syncInfo={at:0,err:\"\"};\nfunction syncCfg(){if(!SYNC_ON)return null;try{return JSON.parse(localStorage.getItem(\"rutin-sync\")||\"null\")}catch(e){return null}}\nfunction setSyncCfg(c){try{c?localStorage.setItem(\"rutin-sync\",JSON.stringify(c)):localStorage.removeItem(\"rutin-sync\")}catch(e){}}\nasync function gh(path,token,opts={}){\n  const r=await fetch(\"https://api.github.com\"+path,{...opts,cache:\"no-store\",headers:{Authorization:\"Bearer \"+token,Accept:\"application/vnd.github+json\",...(opts.body?{\"Content-Type\":\"application/json\"}:{})}});\n  if(!r.ok){const e=new Error(\"http \"+r.status);e.status=r.status;throw e}\n  return r.status===204?null:r.json();\n}\nasync function readGist(c){\n  const g=await gh(\"/gists/\"+c.id+\"?t=\"+Date.now(),c.token),f=g.files&&g.files[GIST_FILE];\n  if(!f)return null;\n  const txt=f.truncated?await (await fetch(f.raw_url,{cache:\"no-store\"})).text():f.content;\n  return JSON.parse(txt);\n}\nconst writeGist=(c,data)=>gh(\"/gists/\"+c.id,c.token,{method:\"PATCH\",body:JSON.stringify({files:{[GIST_FILE]:{content:JSON.stringify(data)}}})});\nfunction setupRemote(){\n  const c=syncCfg();\n  remote=c?{set:async d=>{try{await writeGist(c,d);syncInfo={at:Date.now(),err:\"\"}}catch(e){syncInfo.err=syncErr(e);throw e}finally{drawSync()}}}:null;\n}\nfunction syncErr(e){return e.status===401?\"Anahtar geçersiz ya da silinmiş.\":e.status===404?\"Gist bulunamadı ya da anahtarın gist izni yok.\":\"İnternet yok; bağlanınca eşitlenecek.\"}\nfunction mergeStates(a,b){ // çevrimdışı yapılan değişiklik + uzaktaki daha yeni veri: işaretleri birleştir\n  const m=JSON.parse(JSON.stringify(b));\n  for(const h of a.habits)if(!m.habits.some(x=>x.id===h.id))m.habits.push(h);\n  for(const k in a.checks)m.checks[k]=[...new Set([...(m.checks[k]||[]),...a.checks[k]])];\n  m.goals=m.goals||[];for(const g of (a.goals||[]))if(!m.goals.some(x=>x.id===g.id))m.goals.push(g);\n  m.counts=m.counts||{};\n  for(const k in (a.counts||{}))for(const id in a.counts[k])(m.counts[k]=m.counts[k]||{})[id]=Math.max(a.counts[k][id],(m.counts[k]||{})[id]||0);\n  m.values=m.values||{};\n  for(const k in (a.values||{}))for(const id in a.values[k])if(!(m.values[k]&&id in m.values[k]))(m.values[k]=m.values[k]||{})[id]=a.values[k][id];\n  m.updated=Math.max(a.updated||0,b.updated||0);return m;\n}\nasync function pullRemote(){\n  const c=syncCfg();if(!c)return;\n  try{\n    const r=await readGist(c);\n    syncInfo={at:Date.now(),err:\"\"};\n    if(!r||!Array.isArray(r.habits)){dirty=true;flush();return}\n    if((r.updated||0)>(state.updated||0)){\n      if(dirty){state=mergeStates(state,r);commit()}\n      else{state=r;if(migrate(state))commit();else{writeLocal();render()}}\n      if(!$(\"panel\").hidden)drawPanel();\n    }else if((r.updated||0)<(state.updated||0)){dirty=true;flush()}\n  }catch(e){syncInfo.err=syncErr(e)}\n  drawSync();\n}\nfunction drawSync(){\n  const c=syncCfg();\n  $(\"syncCard\").hidden=!SYNC_ON;\n  $(\"syncOff\").hidden=!!c;$(\"syncOn\").hidden=!c;\n  // bağlı değilken kart en üstte, bağlanınca yedeğin yanına iner\n  const card=$(\"syncCard\");\n  if(!c||!lsGet(\"rutin-linked\")){if(card.previousElementSibling!==$(\"sumCard\"))$(\"sumCard\").after(card)}\n  else{const yedek=$(\"exportBtn\").closest(\"section\");if(card.nextElementSibling!==yedek)yedek.before(card)}\n  if(c){\n    const t=syncInfo.at?new Date(syncInfo.at).toLocaleTimeString(\"tr-TR\",{hour:\"2-digit\",minute:\"2-digit\"}):\"\";\n    $(\"syncState\").innerHTML=syncInfo.err?`<span class=\"syncdot err\"></span>${syncInfo.err}`:`<span class=\"syncdot\"></span>Bağlı${t?` · son eşitleme ${t}`:\"\"}`;\n    $(\"linkHint\").hidden=!!lsGet(\"rutin-linked\");\n  }\n}\nfunction lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}\nfunction lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}\n$(\"syncConnect\").onclick=async()=>{\n  const token=$(\"tokenIn\").value.trim();\n  if(!token){$(\"syncMsg\").textContent=\"Önce anahtarı yapıştır.\";return}\n  $(\"syncMsg\").textContent=\"Bağlanıyor…\";$(\"syncConnect\").disabled=true;\n  try{\n    const list=await gh(\"/gists?per_page=100\",token);\n    let g=list.find(x=>x.description===GIST_DESC&&x.files&&x.files[GIST_FILE]);\n    if(!g)g=await gh(\"/gists\",token,{method:\"POST\",body:JSON.stringify({description:GIST_DESC,public:false,files:{[GIST_FILE]:{content:JSON.stringify(state)}}})});\n    setSyncCfg({token,id:g.id});setupRemote();$(\"tokenIn\").value=\"\";$(\"syncMsg\").textContent=\"\";\n    await pullRemote();\n  }catch(e){$(\"syncMsg\").textContent=e.status===401?\"Anahtar kabul edilmedi. Doğru kopyaladığından emin ol.\":e.status===403||e.status===404?\"Bu anahtarın gist izni yok. Anahtarı oluştururken gist kutusunun işaretli olduğundan emin ol.\":\"Bağlanılamadı. İnternet bağlantını kontrol edip tekrar dene.\"}\n  $(\"syncConnect\").disabled=false;drawSync();\n};\n$(\"syncNow\").onclick=async()=>{$(\"syncState\").textContent=\"Eşitleniyor…\";if(dirty)await flush();await pullRemote()};\n$(\"linkScriptable\").onclick=()=>{const c=syncCfg();if(!c)return;lsSet(\"rutin-linked\",\"1\");drawSync();location.href=`scriptable:///run/Rutin?link=${encodeURIComponent(c.token+\"|\"+c.id)}`};\nlet syncOffArmed=false;\n$(\"syncOffBtn\").onclick=()=>{\n  if(!syncOffArmed){syncOffArmed=true;$(\"syncOffBtn\").textContent=\"Emin misin? Bağlantıyı kes\";return}\n  syncOffArmed=false;$(\"syncOffBtn\").textContent=\"Bağlantıyı kes\";setSyncCfg(null);setupRemote();drawSync();\n};\nsetupRemote();\nif(syncCfg())pullRemote();\n</script>\n</body>\n</html>\n";

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
    title: "⚖️ Haftalık tartı", body: h => { const lv = lastValues(h); return "Hafta başı! Tartıl ve kilonu Rutin'e yaz." + (lv.length ? ` Geçen ölçüm: ${fmtN(lv[lv.length - 1][1])} ${h.measure ? h.measure.unit : "kg"}.` : ""); } },
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
        wanted.push({
          id: `rutin-${k}-${h.id}-${i}${tag}`, at,
          title: Array.isArray(rule.title) ? rule.title[j] : rule.title,
          body: Array.isArray(bodies) ? bodies[j] : bodies,
        });
      });
    }
  }
  // Unutma notları: seçilen sıklıkta, 10:00–21:00 arası rastgele bir saatte hedef metni
  const dayNum = d => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5);
  const hsh = str => { let x = 7; for (const c of str) x = (x * 31 + c.codePointAt(0)) >>> 0; return x; };
  for (const g of (state.goals || [])) {
    if (g.done || !g.remind || g.remind === "off") continue;
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
