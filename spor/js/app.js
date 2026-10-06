/* ADIM — uygulama arayüzü */
(function () {
  const { EQUIPMENT, SLOTS, EXERCISES, BY } = window.DB;
  const P = window.Program;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt1 = (n) => (Math.round(n * 10) / 10).toLocaleString("tr-TR");
  const mmss = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const todayKey = () => P.keyOf(new Date());
  const dateLabel = (k, long) => { const d = P.parseKey(k); return `${d.getDate()} ${P.MONTHS[d.getMonth()]}${long ? " " + P.DAY_NAMES[d.getDay()] : ""}`; };

  /* ---------- ikonlar ---------- */
  const I = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
  const ICON = {
    home: I('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
    cal: I('<rect x="3" y="4.5" width="18" height="16.5" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>'),
    db: I('<path d="M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11"/>'),
    chart: I('<path d="M4 20V11M10 20V5M16 20v-6M2 20h20"/>'),
    user: I('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
    x: I('<path d="M6 6l12 12M18 6 6 18"/>'),
    play: I('<path d="M7 5v14l12-7z" fill="currentColor"/>'),
    pause: I('<path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor"/>'),
    swap: I('<path d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>'),
    info: I('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
    left: I('<path d="m15 18-6-6 6-6"/>'),
    right: I('<path d="m9 18 6-6-6-6"/>'),
    check: I('<path d="m5 12 5 5 9-10"/>'),
    plus: I('<path d="M12 5v14M5 12h14"/>'),
    search: I('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
    bell: I('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0"/>'),
    flame: I('<path d="M12 22c4 0 7-3 7-7 0-5-5-7-5-12-3 2-4 5-4 7-1-1-2-2-2-4-2 2-3 5-3 8 0 5 3 8 7 8z"/>'),
    skip: I('<path d="M5 5v14l10-7zM19 5v14"/>'),
    yt: `<svg viewBox="0 0 24 24"><path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5a2.7 2.7 0 0 0-1.9 1.9C2 8.9 2 12 2 12s0 3.1.4 4.8a2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9c.4-1.7.4-4.8.4-4.8s0-3.1-.4-4.8z" fill="currentColor"/><path d="m10 15 5.2-3L10 9z" fill="#fff"/></svg>`,
    logo: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19 10 7l4 7 2-3 4 8"/></svg>`,
  };

  /* ---------- durum ---------- */
  const KEY = "adim.v1";
  function defaults() {
    const mon = P.mondayOf(new Date());
    const eq = {};
    // tipik bir salonda olmayabilecekler varsayılan olarak kapalı
    EQUIPMENT.forEach((e) => (eq[e.id] = !["ball", "band", "kettlebell", "assist", "smith", "rower", "stair"].includes(e.id)));
    return {
      v: 1, onboarded: false,
      profile: { name: "", age: 35, height: 175, weight: 100, goal: 85, start: P.keyOf(mon), days: [2, 4, 5, 0], offset: 0, kneeCare: true, backCare: false, gymTime: "18:30", morningTime: "09:00", checkTime: "21:30" },
      eq, swaps: {}, banned: {}, logs: {}, history: {}, pr: {}, weights: [], badges: {},
      settings: { sound: true, voice: true, restAdd: 0, vibrate: true },
      session: null,
    };
  }
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v) { const d = defaults(); return Object.assign(d, s, { profile: Object.assign(d.profile, s.profile), settings: Object.assign(d.settings, s.settings), eq: Object.assign(d.eq, s.eq) }); } } catch (e) {}
    return defaults();
  }
  let S = load();
  function save() { S.updated = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  /* ---------- türetilmiş bilgiler ---------- */
  const isTrain = (d) => S.profile.days.includes(d.getDay());
  const startDate = () => P.parseKey(S.profile.start);
  function currentWeight() { const w = S.weights.slice().sort((a, b) => (a.d < b.d ? -1 : 1)); return w.length ? w[w.length - 1].kg : S.profile.weight; }
  function bmi(kg) { const h = S.profile.height / 100; return kg / (h * h); }
  function bmiCat(b) { return b < 18.5 ? "Zayıf" : b < 25 ? "Normal" : b < 30 ? "Fazla kilolu" : b < 35 ? "1. derece obezite" : b < 40 ? "2. derece obezite" : "3. derece obezite"; }
  function doneLogs() { return Object.entries(S.logs).filter(([, l]) => l.status === "done").sort((a, b) => (a[0] < b[0] ? -1 : 1)); }
  function weekStats(date = new Date()) {
    const mon = P.mondayOf(date);
    let planned = 0, done = 0;
    for (let i = 0; i < 7; i++) { const d = P.addDays(mon, i); const k = P.keyOf(d); if (isTrain(d) && d >= startDate()) planned++; if (S.logs[k] && S.logs[k].status === "done") done++; }
    return { planned: planned || S.profile.days.length, done };
  }
  function streak() {
    // art arda tamamlanan planlı antrenman günleri (bugün henüz yapılmadıysa seriyi bozmaz)
    let n = 0, d = new Date();
    const st = startDate();
    for (let i = 0; i < 400; i++) {
      const k = P.keyOf(d);
      const log = S.logs[k];
      if (log && log.status === "done") n++;
      else if (isTrain(d) && d >= st && k !== todayKey()) break;
      d = P.addDays(d, -1);
      if (d < st) break;
    }
    return n;
  }
  function pendingCheck() {
    // son 6 günde planlı olup işaretlenmemiş en yakın gün
    for (let i = 1; i <= 6; i++) {
      const d = P.addDays(new Date(), -i);
      if (d < startDate()) break;
      const k = P.keyOf(d);
      if (isTrain(d) && !S.logs[k] && !(S.dismissed && S.dismissed[k])) return d;
    }
    return null;
  }
  function nextTraining(from = new Date(), includeToday) {
    for (let i = includeToday ? 0 : 1; i < 14; i++) { const d = P.addDays(from, i); if (isTrain(d) && !(S.logs[P.keyOf(d)] && S.logs[P.keyOf(d)].status === "done")) return d; }
    return null;
  }
  const regionsOf = (tpl) => tpl.sub;

  /* ---------- ses / titreşim / ekran ---------- */
  let actx = null;
  function audio() { if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (actx && actx.state === "suspended") actx.resume(); return actx; }
  function beep(freq = 880, dur = 0.12, vol = 0.25) {
    if (!S.settings.sound) return;
    const a = audio(); if (!a) return;
    const o = a.createOscillator(), g = a.createGain();
    o.type = "sine"; o.frequency.value = freq; g.gain.value = vol;
    o.connect(g); g.connect(a.destination);
    const t = a.currentTime; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function buzz(p) { if (S.settings.vibrate && navigator.vibrate) try { navigator.vibrate(p); } catch (e) {} }
  let trVoice = null;
  function speak(txt) {
    if (!S.settings.voice || !window.speechSynthesis) return;
    try {
      if (!trVoice) trVoice = speechSynthesis.getVoices().find((v) => /^tr/i.test(v.lang)) || null;
      const u = new SpeechSynthesisUtterance(txt); u.lang = "tr-TR"; if (trVoice) u.voice = trVoice; u.rate = 1.02;
      speechSynthesis.cancel(); speechSynthesis.speak(u);
    } catch (e) {}
  }
  let wake = null;
  async function keepAwake(on) {
    try {
      if (on && "wakeLock" in navigator && !wake) { wake = await navigator.wakeLock.request("screen"); wake.addEventListener("release", () => (wake = null)); }
      if (!on && wake) { await wake.release(); wake = null; }
    } catch (e) {}
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && player.open) keepAwake(true); });
  document.addEventListener("touchstart", () => audio(), { once: true, passive: true });
  document.addEventListener("click", () => audio(), { once: true });

  /* ---------- toast / sheet ---------- */
  let toastT = 0;
  function toast(msg, ic = "🔥") {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
    t.innerHTML = `<span class="ic">${ic}</span><span>${msg}</span>`;
    requestAnimationFrame(() => t.classList.add("show"));
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2800);
  }
  const sheets = [];
  function openSheet(html, mount, opts = {}) {
    const w = document.createElement("div");
    w.className = "sheet-wrap";
    w.innerHTML = `<div class="scrim"></div><div class="sheet"><div class="grab"></div><button class="iconbtn close" aria-label="Kapat">${ICON.x}</button><div class="body">${html}</div></div>`;
    document.body.appendChild(w);
    const close = () => { w.classList.remove("open"); if (w._cleanup) w._cleanup(); setTimeout(() => w.remove(), 320); const i = sheets.indexOf(w); if (i >= 0) sheets.splice(i, 1); if (opts.onClose) opts.onClose(); };
    w._close = close;
    $(".scrim", w).onclick = close; $(".close", w).onclick = close;
    // aşağı kaydırarak kapatma
    let sy = null; const sh = $(".sheet", w), body = $(".body", w);
    sh.addEventListener("touchstart", (e) => { sy = body.scrollTop <= 0 ? e.touches[0].clientY : null; }, { passive: true });
    sh.addEventListener("touchmove", (e) => { if (sy == null) return; const dy = e.touches[0].clientY - sy; if (dy > 0) sh.style.transform = `translateY(${dy}px)`; }, { passive: true });
    sh.addEventListener("touchend", (e) => { if (sy == null) return; const dy = (e.changedTouches[0].clientY - sy); sh.style.transform = ""; if (dy > 110) close(); sy = null; });
    sheets.push(w);
    requestAnimationFrame(() => requestAnimationFrame(() => w.classList.add("open")));
    if (mount) mount($(".body", w), close, w);
    return { close, el: w, body: $(".body", w) };
  }
  function closeAllSheets() { sheets.slice().forEach((w) => w._close()); }

  /* ---------- küçük bileşenler ---------- */
  const diffLbl = ["", "Çok kolay", "Kolay", "Orta", "Zor", "Çok zor"];
  const diffBars = (d) => `<span class="diff" title="${diffLbl[d]}">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= d ? "on" : ""}"></i>`).join("")}</span>`;
  const eqName = (id) => (EQUIPMENT.find((e) => e.id === id) || { n: id }).n;
  const eqText = (e) => (e.eq.length ? e.eq.map(eqName).join(" + ") : "Alet gerekmez");
  const targetText = (it) => (it.target.sec ? `${it.sets} × ${it.target.sec} sn` : `${it.sets} × ${it.target.reps}`);
  const mName = (m) => window.BodyMap.MUSCLES[m] || m;
  const thumb = (e, frame) => `<div class="thumb">${window.Figure.still(e.anim, e, frame, true)}</div>`;
  const WEIGHTED = ["dumbbell", "barbell", "kettlebell", "cable", "legpress", "legext", "legcurl", "latpull", "chestpress", "shoulderpress", "pecdeck", "abductor", "smith", "assist"];
  const isWeighted = (e) => e.eq.some((q) => WEIGHTED.includes(q));
  const kgStep = (e) => (e.eq.includes("dumbbell") || e.eq.includes("kettlebell") ? 1 : 2.5);

  const QUOTES = [
    "Bugün attığın küçük adım, yarının büyük farkı.", "Mükemmel olmak zorunda değilsin, sadece gel.", "Yavaş ilerlemek, hiç ilerlememekten iyidir.",
    "Disiplin, motivasyon bittiğinde devreye girer.", "Kendinle yarış, başkasıyla değil.", "Her set, dünkü senden bir adım ileri.",
    "Ter, vücudunun sana teşekkür etme şekli.", "Bırakma. Sadece yavaşla.", "Zor olan başlamak; gerisi alışkanlık.",
  ];
  const TIPS = [
    ["💧", "Su", "Antrenman günlerinde 2,5–3 L su hedefle; spordan önce ve sonra birer bardak ekle."],
    ["🍗", "Protein", "Her öğünde avuç içi kadar protein (tavuk, yumurta, yoğurt, baklagil) kas korumanı sağlar."],
    ["😴", "Uyku", "7–8 saat uyku hem toparlanmayı hem iştah kontrolünü doğrudan etkiler."],
    ["🚶", "Dinlenme günü", "Dinlenme günlerinde 20–30 dk hafif yürüyüş toparlanmayı hızlandırır."],
    ["🦵", "Dizler", "Kardiyoda bisiklet, eliptik ve eğimli yürüyüş dizlerine koşudan çok daha dosttur."],
    ["⚖️", "Tartı", "Haftada bir, aynı gün aynı saatte aç karna tartıl — günlük dalgalanmalara takılma."],
    ["🔥", "Tempo", "Haftada 0,5–1 kg vermek sağlıklı ve kalıcı bir hızdır."],
    ["🫁", "Nefes", "Ağırlığı kaldırırken nefes ver, indirirken al. Nefesini tutma."],
    ["🥗", "Tabak", "Tabağının yarısı sebze, çeyreği protein, çeyreği tam tahıl olsun."],
    ["⏱️", "Dinlenme", "Setler arası dinlenmeyi atlama: kaliteli tekrar, hızlı tekrardan iyidir."],
  ];

  /* ---------- rozetler ---------- */
  const BADGES = [
    { id: "first", ic: "👟", n: "İlk Adım", d: "İlk antrenmanını tamamla", test: (c) => c.workouts >= 1 },
    { id: "fullweek", ic: "🗓️", n: "Tam Hafta", d: "Bir haftanın tüm antrenmanlarını yap", test: (c) => c.fullWeeks >= 1 },
    { id: "w5", ic: "🔥", n: "Isındık", d: "5 antrenman", test: (c) => c.workouts >= 5 },
    { id: "w10", ic: "💪", n: "On Numara", d: "10 antrenman", test: (c) => c.workouts >= 10 },
    { id: "fw3", ic: "📆", n: "Alışkanlık", d: "3 tam hafta", test: (c) => c.fullWeeks >= 3 },
    { id: "w25", ic: "🏅", n: "Çeyrek Asır", d: "25 antrenman", test: (c) => c.workouts >= 25 },
    { id: "c300", ic: "❤️", n: "Kalp Dostu", d: "Toplam 300 dk kardiyo", test: (c) => c.cardio >= 300 },
    { id: "kg3", ic: "⚖️", n: "İlk Kilolar", d: "3 kg ver", test: (c) => c.lost >= 3 },
    { id: "kg5", ic: "🎯", n: "Beşlik", d: "5 kg ver", test: (c) => c.lost >= 5 },
    { id: "kg10", ic: "🏆", n: "Onluk", d: "10 kg ver", test: (c) => c.lost >= 10 },
    { id: "w50", ic: "⚡", n: "Elli", d: "50 antrenman", test: (c) => c.workouts >= 50 },
    { id: "c1000", ic: "🚀", n: "Motor", d: "1000 dk kardiyo", test: (c) => c.cardio >= 1000 },
    { id: "pr5", ic: "📈", n: "Rekorcu", d: "5 kişisel rekor", test: (c) => c.prs >= 5 },
    { id: "ph3", ic: "⬆️", n: "Gelişim", d: "Gelişim aşamasına ulaş", test: (c) => c.phase >= 3 },
    { id: "ph4", ic: "🦾", n: "Güçlenme", d: "Güçlenme aşamasına ulaş", test: (c) => c.phase >= 4 },
    { id: "kg20", ic: "👑", n: "Yeni Sen", d: "20 kg ver", test: (c) => c.lost >= 20 },
  ];
  function counters() {
    const logs = doneLogs();
    let cardio = 0; logs.forEach(([, l]) => (cardio += l.cardioMin || 0));
    const weeks = {};
    logs.forEach(([k]) => { const m = P.keyOf(P.mondayOf(P.parseKey(k))); weeks[m] = (weeks[m] || 0) + 1; });
    const fullWeeks = Object.values(weeks).filter((n) => n >= S.profile.days.length).length;
    return { workouts: logs.length, cardio, fullWeeks, lost: Math.max(0, S.profile.weight - currentWeight()), prs: Object.keys(S.pr).length, phase: P.phaseOf(P.weekIndex(S, new Date())).id };
  }
  function checkBadges(silent) {
    const c = counters(); const got = [];
    for (const b of BADGES) if (!S.badges[b.id] && b.test(c)) { S.badges[b.id] = todayKey(); got.push(b); }
    if (got.length) { save(); if (!silent) got.forEach((b, i) => setTimeout(() => toast(`Yeni rozet: <b>${b.n}</b>`, b.ic), 600 + i * 3000)); }
  }

  /* ================= GÖRÜNÜMLER ================= */
  let tab = "home";
  let progWeekOffset = 0;
  const lib = { q: "", region: "all", mine: false, muscle: null };

  function renderApp() {
    const app = $("#app");
    const scroll = $(".screen", app) ? $(".screen", app).scrollTop : 0;
    const views = { home: viewHome, program: viewProgram, library: viewLibrary, progress: viewProgress, profile: viewProfile };
    app.innerHTML = `<main class="screen" id="screen">${views[tab]()}</main>
      <nav class="tabs" aria-label="Menü">
        ${[["home", "Bugün", ICON.home], ["program", "Program", ICON.cal], ["library", "Hareketler", ICON.db], ["progress", "İlerleme", ICON.chart], ["profile", "Profil", ICON.user]]
          .map(([id, n, ic]) => `<button class="tab ${tab === id ? "on" : ""}" data-tab="${id}">${ic}<span>${n}</span></button>`).join("")}
      </nav>`;
    $$(".tab", app).forEach((b) => (b.onclick = () => { if (tab === b.dataset.tab) { $("#screen").scrollTo({ top: 0, behavior: "smooth" }); return; } tab = b.dataset.tab; renderApp(); $("#screen").scrollTop = 0; }));
    bind[tab] && bind[tab]($("#screen"));
    if (keepScroll) { $("#screen").scrollTop = scroll; keepScroll = false; }
  }
  let keepScroll = false;
  const rerender = () => { keepScroll = true; renderApp(); };
  const bind = {};

  /* ---------- BUGÜN ---------- */
  function weekStrip() {
    const mon = P.mondayOf(new Date());
    return `<div class="weekstrip">${[0, 1, 2, 3, 4, 5, 6].map((i) => {
      const d = P.addDays(mon, i), k = P.keyOf(d), log = S.logs[k];
      const past = k < todayKey();
      let cls = isTrain(d) ? "train" : "rest", ic = "";
      if (log && log.status === "done") { cls = "done"; ic = "✓"; }
      else if (log && log.status === "missed") { cls = "missed"; ic = "✕"; }
      else if (isTrain(d) && past && d >= startDate()) { cls = "missed"; ic = "?"; }
      return `<button class="wd ${cls} ${k === todayKey() ? "today" : ""}" data-day="${k}">${P.DAY_SHORT[d.getDay()]}<b>${d.getDate()}</b><i>${ic}</i></button>`;
    }).join("")}</div>`;
  }

  function viewHome() {
    const now = new Date();
    const hour = now.getHours();
    const greet = hour < 6 ? "İyi geceler" : hour < 12 ? "Günaydın" : hour < 18 ? "İyi günler" : "İyi akşamlar";
    const name = S.profile.name ? `, ${esc(S.profile.name)}` : "";
    const tk = todayKey();
    const plan = P.dayPlan(S, now);
    const log = S.logs[tk];
    const ws = weekStats(), st = streak();
    const w = P.weekIndex(S, now), ph = P.phaseOf(w);
    let html = `<div class="topbar"><div class="brand"><span class="logo">${ICON.logo}</span><b>ADIM</b></div>
      <button class="iconbtn" data-act="notify" aria-label="Bildirimler">${ICON.bell}</button></div>
      <div class="hello"><div class="up">${greet}${name} · ${dateLabel(tk, true)}</div><h1>Hafta ${w + 1} · <span class="grad-text">${ph.n}</span></h1></div>
      ${weekStrip()}`;

    // yarım kalan antrenman
    if (S.session) {
      html += `<div class="banner"><h3>Yarım kalan antrenman</h3><p class="small muted">${esc(P.TEMPLATES[S.session.tplId].n)} · ${dateLabel(S.session.date)} · ${S.session.idx} / ${S.session.total} adım</p>
        <div class="btnrow"><button class="btn sm primary" data-act="resume">Devam et</button><button class="btn sm" data-act="discard">Sil</button></div></div>`;
    }
    // "spora gittin mi?" kontrolü
    const pc = pendingCheck();
    if (pc) {
      const k = P.keyOf(pc), pp = P.dayPlan(S, pc);
      html += `<div class="banner"><h3>Spora gittin mi? 🤔</h3><p class="small" style="color:var(--ink2)">${P.DAY_NAMES[pc.getDay()]} (${dateLabel(k)}) <b>${esc(pp.tpl.n)}</b> günündü ama kayıt yok.</p>
        <div class="btnrow"><button class="btn sm primary" data-act="went" data-k="${k}">Evet, gittim</button><button class="btn sm" data-act="notwent" data-k="${k}">Hayır</button></div></div>`;
    }
    // geri bildirim önerisi
    const last = doneLogs().slice(-2).map(([, l]) => l.feel || 3);
    if (last.length === 2 && !S.session && S.fbSeen !== doneLogs().length) {
      if (last.every((f) => f >= 5)) html += `<div class="banner"><h3>Biraz fazla mı zorladı?</h3><p class="small" style="color:var(--ink2)">Son iki antrenmanı "çok zor" olarak işaretledin. Programı bir hafta geri alıp aynı seviyede biraz daha kalabilirsin.</p><div class="btnrow"><button class="btn sm primary" data-act="weekback">Bir hafta geri al</button><button class="btn sm" data-act="fbok">Böyle iyi</button></div></div>`;
      else if (last.every((f) => f <= 1) && ph.id < 5) html += `<div class="banner"><h3>Çok mu kolay geliyor?</h3><p class="small" style="color:var(--ink2)">Son iki antrenman "çok kolay" geçti. İstersen programı bir hafta ileri alabilirsin.</p><div class="btnrow"><button class="btn sm primary" data-act="weekfwd">Bir hafta ileri al</button><button class="btn sm" data-act="fbok">Böyle iyi</button></div></div>`;
    }
    // Pazartesi tartı hatırlatması
    if (now.getDay() === 1 && !S.weights.some((x) => x.d === tk)) html += `<div class="banner"><h3>⚖️ Tartı günü</h3><p class="small" style="color:var(--ink2)">Haftalık ölçümün için bugün aç karna tartıl.</p><div class="btnrow"><button class="btn sm primary" data-act="addweight">Kilomu gir</button></div></div>`;

    // ana kart
    if (log && log.status === "done") {
      html += `<div class="hero done"><span class="tag">✓ Tamamlandı</span><h2>Harika iş!</h2><div class="sub">${esc(log.tplName || "Antrenman")} bitti. Bugünkü payını aldın.</div>
        <div class="stats"><div class="stat"><div class="num">${Math.round((log.dur || 0) / 60)}</div><div class="tiny">dakika</div></div><div class="stat"><div class="num">${log.sets || 0}</div><div class="tiny">set</div></div><div class="stat"><div class="num">${log.kcal || 0}</div><div class="tiny">kcal (tahmini)</div></div></div>
        <button class="btn block" data-act="openlog" data-k="${tk}">Özeti gör</button></div>`;
    } else if (plan) {
      html += heroPlan(plan, true);
    } else {
      const nx = nextTraining(now);
      const np = nx && P.dayPlan(S, nx);
      html += `<div class="hero rest"><span class="tag">🌙 Dinlenme günü</span><h2>Toparlan</h2><div class="sub" style="color:var(--ink2)">Kaslar dinlenirken büyür. Bugün hafif hareket yeterli.</div>
        <div class="list" style="margin:14px 0">
          <div class="item"><span style="font-size:26px">🚶</span><div class="grow"><h4>20–30 dk hafif yürüyüş</h4><div class="meta">Konuşabileceğin tempoda, dışarıda ya da bantta</div></div></div>
          <div class="item"><span style="font-size:26px">🧘</span><div class="grow"><h4>5–10 dk esneme</h4><div class="meta">Kalça önü, arka bacak, göğüs</div></div></div>
        </div>
        ${np ? `<p class="small muted" style="margin-bottom:10px">Sıradaki: <b style="color:var(--ink)">${P.DAY_NAMES[nx.getDay()]} · ${esc(np.tpl.n)}</b> (${esc(np.tpl.sub)})</p>
        <div class="btnrow"><button class="btn sm" data-act="openday" data-k="${P.keyOf(nx)}">Programa bak</button><button class="btn sm" data-act="trainanyway" data-k="${P.keyOf(nx)}">Yine de bugün yap</button></div>` : ""}</div>`;
    }

    // istatistikler
    const lost = S.profile.weight - currentWeight();
    html += `<div class="sec"><h2>Durum</h2></div>
      <div class="statgrid">
        <div class="tile"><div class="up">Bu hafta</div><div class="num">${ws.done}<span class="muted" style="font-size:20px"> / ${ws.planned}</span></div><div class="bar"><i style="width:${Math.min(100, (ws.done / ws.planned) * 100)}%"></i></div></div>
        <div class="tile"><div class="up">Seri</div><div class="num">${st} <span style="font-size:22px">🔥</span></div><div class="tiny muted">art arda antrenman</div></div>
        <div class="tile"><div class="up">Toplam</div><div class="num">${doneLogs().length}</div><div class="tiny muted">antrenman</div></div>
        <button class="tile" data-act="addweight" style="text-align:left"><div class="up">Kilo</div><div class="num">${fmt1(currentWeight())}<span class="muted" style="font-size:18px"> kg</span></div><div class="tiny ${lost > 0 ? "grad-text" : "muted"}" style="font-weight:700">${lost > 0 ? `−${fmt1(lost)} kg 🎉` : lost < 0 ? `+${fmt1(-lost)} kg` : "+ Ölçüm ekle"}</div></button>
      </div>`;
    const tip = TIPS[(P.parseKey(tk) / 864e5 | 0) % TIPS.length];
    const q = QUOTES[(P.parseKey(tk) / 864e5 | 0) % QUOTES.length];
    html += `<div class="sec"><h2>Günün ipucu</h2></div>
      <div class="card"><div class="row"><span style="font-size:30px">${tip[0]}</span><div class="grow"><b>${tip[1]}</b><p class="small muted" style="margin-top:2px">${tip[2]}</p></div></div></div>
      <div class="card" style="background:transparent;border-style:dashed"><p class="quote grad-text">“${q}”</p></div>`;
    return html;
  }

  function heroPlan(plan, isToday) {
    const tpl = plan.tpl;
    return `<div class="hero">
      <div class="bm">${window.BodyMap.svg(tpl.focus.slice(0, 3), tpl.focus.slice(3))}</div>
      <span class="tag">${isToday ? "🔥 Bugün" : P.DAY_NAMES[P.parseKey(plan.date).getDay()]} · ${plan.phase.n}${plan.deload ? " · Hafif hafta" : ""}</span>
      <h2>${esc(tpl.n)}</h2><div class="sub">${esc(tpl.sub)}</div>
      <div class="stats">
        <div class="stat"><div class="num">~${plan.minutes}</div><div class="tiny">dakika</div></div>
        <div class="stat"><div class="num">${plan.items.length}</div><div class="tiny">hareket</div></div>
        <div class="stat"><div class="num">${plan.cardio.min}</div><div class="tiny">dk kardiyo</div></div>
      </div>
      <button class="btn primary block" data-act="start" data-k="${plan.date}">${ICON.play} Antrenmana başla</button>
      <button class="btn ghost block" style="margin-top:6px;height:40px;font-size:14px" data-act="openday" data-k="${plan.date}">Hareketleri gör →</button>
    </div>`;
  }

  bind.home = (root) => {
    root.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-act],[data-day]"); if (!b) return;
      if (b.dataset.day) { openDay(b.dataset.day); return; }
      const k = b.dataset.k;
      switch (b.dataset.act) {
        case "start": startWorkout(k); break;
        case "openday": openDay(k); break;
        case "trainanyway": startWorkout(k, todayKey()); break;
        case "resume": player.resume(); break;
        case "discard": if (confirm("Yarım kalan antrenman silinsin mi?")) { S.session = null; save(); rerender(); } break;
        case "went": quickLog(k, "done"); break;
        case "notwent": quickLog(k, "missed"); break;
        case "weekback": S.profile.offset = (S.profile.offset || 0) - 1; S.fbSeen = doneLogs().length; save(); toast("Program bir hafta geri alındı", "↩️"); rerender(); break;
        case "weekfwd": S.profile.offset = (S.profile.offset || 0) + 1; S.fbSeen = doneLogs().length; save(); toast("Program bir hafta ileri alındı", "⏩"); rerender(); break;
        case "fbok": S.fbSeen = doneLogs().length; save(); rerender(); break;
        case "addweight": openWeight(); break;
        case "openlog": openLog(k); break;
        case "notify": openNotify(); break;
      }
    });
  };

  function quickLog(k, status) {
    const pl = P.dayPlan(S, P.parseKey(k));
    if (status === "done") {
      const min = pl ? pl.minutes : 45;
      S.logs[k] = { status: "done", quick: true, tpl: pl && pl.tplId, tplName: pl && pl.tpl.n, dur: min * 60, sets: pl ? pl.items.reduce((t, i) => t + i.sets, 0) : 0, cardioMin: pl ? pl.cardio.min : 0, kcal: P.kcal(currentWeight(), min - (pl ? pl.cardio.min : 0), pl ? pl.cardio.min : 0, pl && pl.cardio.ex.met), feel: 3 };
      toast("Kaydedildi. Aferin! 💪", "✅");
    } else { S.logs[k] = { status: "missed" }; toast("Olur böyle şeyler. Sıradakini kaçırma!", "🫡"); }
    save(); checkBadges(); rerender();
  }

  /* ---------- PROGRAM ---------- */
  function viewProgram() {
    const base = P.addDays(P.mondayOf(new Date()), progWeekOffset * 7);
    const w = P.weekIndex(S, base), ph = P.phaseOf(w);
    const deload = P.isDeload(w);
    const before = base < P.mondayOf(startDate());
    const pct = Math.min(100, ((w - ph.from + 1) / (ph.to - ph.from + 1)) * 100);
    let html = `<div class="topbar"><h1>Program</h1></div>
      <div class="card">
        <div class="row"><button class="iconbtn" data-act="prev" aria-label="Önceki hafta">${ICON.left}</button>
          <div class="grow" style="text-align:center"><div class="up muted">${dateLabel(P.keyOf(base))} – ${dateLabel(P.keyOf(P.addDays(base, 6)))}</div><h2 style="font-size:28px;margin-top:4px;text-transform:uppercase">${before ? "Başlamadan önce" : `Hafta ${w + 1} · <span class="grad-text">${ph.n}</span>`}</h2></div>
          <button class="iconbtn" data-act="next" aria-label="Sonraki hafta">${ICON.right}</button></div>
        ${before ? "" : `<div class="phasebar">${P.PHASES.map((p) => `<i class="${p.id < ph.id ? "on" : p.id === ph.id ? "cur" : ""}" style="--p:${pct}%"></i>`).join("")}</div>
        <div class="phaselbl">${P.PHASES.map((p) => `<span>${p.n}</span>`).join("")}</div>
        <div class="hr"></div>
        <p class="small"><b>Hedef:</b> <span class="muted">${ph.goal}</span></p>
        <p class="small" style="margin-top:6px"><b>His:</b> <span class="muted">${ph.feel}</span></p>
        ${deload ? `<div class="callout" style="margin-top:10px">🌿 <b>Hafif hafta.</b> Set sayısı ve kardiyo biraz azaltıldı; vücudun toparlanıp bir sonraki aşamaya hazırlanıyor.</div>` : ""}
        ${progWeekOffset ? `<button class="btn sm block" style="margin-top:12px" data-act="thisweek">Bu haftaya dön</button>` : ""}`}
      </div>
      <div class="sec"><h2>Günler</h2><span class="tiny muted">Dokun → detay</span></div><div class="list">`;
    for (let i = 0; i < 7; i++) {
      const d = P.addDays(base, i), k = P.keyOf(d), log = S.logs[k];
      const isT = isTrain(d) && !before;
      const pl = isT && P.dayPlan(S, d);
      const today = k === todayKey();
      if (pl) {
        const status = log && log.status === "done" ? `<span class="status done">✓ Yapıldı</span>` : log && log.status === "missed" ? `<span class="status missed">Kaçtı</span>` : today ? `<span class="status today">Bugün</span>` : "";
        html += `<button class="daycard train ${today ? "today" : ""}" data-k="${k}"><div class="date"><span>${P.DAY_SHORT[d.getDay()]}</span><b>${d.getDate()}</b></div>
          <div class="grow"><div class="row" style="justify-content:space-between;align-items:flex-start"><h4>${esc(pl.tpl.n)}</h4>${status}</div>
          <div class="meta" style="color:var(--ink2);font-weight:600">${esc(pl.tpl.sub)}</div>
          <div class="meta">~${pl.minutes} dk · ${pl.items.length} hareket · ${pl.cardio.min} dk ${esc(pl.cardio.ex.n.toLowerCase())}</div></div></button>`;
      } else {
        const extra = log && log.status === "done" ? `<span class="status done">✓ Ek antrenman</span>` : "";
        html += `<div class="daycard rest ${today ? "today" : ""}"><div class="date"><span>${P.DAY_SHORT[d.getDay()]}</span><b>${d.getDate()}</b></div><div class="grow"><h4>Dinlenme</h4><div class="meta">${before ? "Program henüz başlamadı" : "Hafif yürüyüş + esneme önerilir"}</div></div>${extra}</div>`;
      }
    }
    html += `</div>
      <div class="sec"><h2>Nasıl ilerliyor?</h2></div>
      <div class="card"><ul class="notes">
        <li>Haftada ${S.profile.days.length} gün: ${S.profile.days.slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)).map((d) => P.DAY_NAMES[d]).join(", ")}.</li>
        <li>Her gün farklı bölge çalışır; aynı kas grubu arasında en az 2 gün dinlenme olur.</li>
        <li>İlk 2 hafta sadece alışma: az set, hafif ağırlık, kısa kardiyo.</li>
        <li>Haftalar ilerledikçe set, hareket ve kardiyo süresi kademeli artar; 8. hafta hafif haftadır.</li>
        <li>Zor gelirse Profil → Seviye'den programı bir hafta geri alabilirsin.</li>
      </ul></div>`;
    return html;
  }
  bind.program = (root) => {
    root.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-act],[data-k]"); if (!b) return;
      if (b.dataset.act === "prev") { progWeekOffset--; rerender(); }
      else if (b.dataset.act === "next") { progWeekOffset++; rerender(); }
      else if (b.dataset.act === "thisweek") { progWeekOffset = 0; rerender(); }
      else if (b.dataset.k) openDay(b.dataset.k);
    });
  };

  /* ---------- gün detayı ---------- */
  function openDay(k, tplOverride) {
    const d = P.parseKey(k);
    const plan = tplOverride ? P.planFor(S, tplOverride, d) : P.dayPlan(S, d);
    if (!plan) {
      const log = S.logs[k];
      if (log && log.status === "done") return openLog(k);
      const nx = nextTraining(d, true);
      openSheet(`<h2 class="title">${P.DAY_NAMES[d.getDay()]} · Dinlenme</h2><p class="muted" style="margin-bottom:14px">${dateLabel(k)} bir dinlenme günü. 20–30 dk hafif yürüyüş ve esneme önerilir.</p>
        ${nx ? `<button class="btn block" data-k="${P.keyOf(nx)}">Sıradaki antrenman: ${P.DAY_NAMES[nx.getDay()]} →</button>` : ""}`, (body, close) => { const b = $("[data-k]", body); if (b) b.onclick = () => { close(); openDay(b.dataset.k); }; });
      return;
    }
    const log = S.logs[k];
    const html = () => `
      <div class="up" style="color:var(--orange);margin-top:6px">${P.DAY_NAMES[d.getDay()]} · ${dateLabel(k)} · Hafta ${plan.week + 1}</div>
      <h2 class="title">${esc(plan.tpl.n)}</h2><p style="color:var(--ink2);font-weight:600;margin-bottom:12px">${esc(plan.tpl.sub)}</p>
      <div class="bodywrap">${window.BodyMap.svg(plan.tpl.focus.slice(0, 3), plan.tpl.focus.slice(3))}</div>
      <div class="kv"><div><span class="up">Süre</span><b>~${plan.minutes} dk</b></div><div><span class="up">Aşama</span><b>${plan.phase.n}</b></div><div><span class="up">Kardiyo</span><b>${plan.cardio.min} dk</b></div></div>
      ${log && log.status === "done" ? `<button class="btn block" data-act="log" style="margin-bottom:10px">✓ Bu antrenman yapıldı — özeti gör</button>` : ""}
      <div class="sec" style="margin-top:14px"><h2>1 · Isınma</h2><span class="tiny muted">~${Math.round(plan.warm.length * 0.7 + 3)} dk</span></div>
      <div class="list">${plan.warm.map((w) => `<button class="item" data-ex="${w.ex.id}">${thumb(w.ex)}<div class="grow"><h4>${esc(w.ex.n)}</h4><div class="meta">${w.sec} sn</div></div></button>`).join("")}</div>
      <div class="sec"><h2>2 · Ağırlık</h2><span class="tiny muted">${plan.items.length} hareket</span></div>
      <div class="list">${plan.items.map((it) => `<div class="item" data-ex="${it.ex.id}" data-key="${it.key}" role="button">${thumb(it.ex)}<div class="grow"><h4>${esc(it.ex.n)}</h4>
        <div class="meta"><b style="color:var(--ink)">${targetText(it)}</b> · ${it.rest} sn dinlenme</div><div class="meta">${esc(SLOTS[it.slot].n)} ${diffBars(it.ex.d)}</div></div>
        <div class="side"><button class="swapbtn" data-swap="${it.ex.id}" data-key="${it.key}">${"Değiştir"}</button></div></div>`).join("")}</div>
      <div class="sec"><h2>3 · Kardiyo</h2><span class="tiny muted">${plan.cardio.min} dk</span></div>
      <div class="item" data-ex="${plan.cardio.ex.id}" data-key="${plan.tplId}:cardio" role="button">${thumb(plan.cardio.ex)}<div class="grow"><h4>${esc(plan.cardio.ex.n)}</h4><div class="meta"><b style="color:var(--ink)">${plan.cardio.min} dk</b> · ${plan.cardio.intensity}</div><div class="meta">Nabız hedefi ${plan.cardio.hr[0]}–${plan.cardio.hr[1]} atım/dk</div></div>
        <div class="side"><button class="swapbtn" data-swap="${plan.cardio.ex.id}" data-key="${plan.tplId}:cardio">Değiştir</button></div></div>
      <div class="sec"><h2>4 · Soğuma</h2><span class="tiny muted">~${Math.round(plan.cool.length * 0.8)} dk</span></div>
      <div class="list">${plan.cool.map((w) => `<button class="item" data-ex="${w.ex.id}">${thumb(w.ex)}<div class="grow"><h4>${esc(w.ex.n)}</h4><div class="meta">${w.sec} sn${w.ex.perSide ? " (her taraf yarı süre)" : ""}</div></div></button>`).join("")}</div>
      <div class="callout" style="margin-top:14px">💡 ${plan.phase.feel}</div>
      <div style="height:12px"></div>
      ${!(log && log.status === "done") ? `<button class="btn primary block" data-act="start">${ICON.play} Bu antrenmanı başlat</button>` : ""}`;
    openSheet(html(), (body, close, wrap) => {
      body.addEventListener("click", (ev) => {
        const sw = ev.target.closest("[data-swap]");
        if (sw) { ev.stopPropagation(); openSwap(sw.dataset.swap, sw.dataset.key, () => { close(); openDay(k, tplOverride); }); return; }
        const a = ev.target.closest("[data-act]");
        if (a && a.dataset.act === "start") { close(); startWorkout(k, k === todayKey() ? null : todayKey(), tplOverride); return; }
        if (a && a.dataset.act === "log") { openLog(k); return; }
        const it = ev.target.closest("[data-ex]");
        if (it) openExercise(it.dataset.ex, { key: it.dataset.key, onSwap: () => { close(); openDay(k, tplOverride); } });
      });
    });
  }

  /* ---------- değiştir (alternatif) ---------- */
  function openSwap(exId, key, done, opts = {}) {
    const cur = BY[exId];
    const alts = P.alternatives(S, exId);
    openSheet(`<h2 class="title">Değiştir</h2>
      <p class="muted small" style="margin-bottom:10px">“${esc(cur.n)}” yerine aynı işlevi gören (<b style="color:var(--ink2)">${esc(SLOTS[cur.slot].f)}</b>) bir hareket seç.</p>
      ${opts.today ? "" : `<button class="toggle on" data-act="perm"><div class="grow"><b>Bundan sonra hep bunu kullan</b><div class="tiny muted">Kapalıysa sadece bu antrenman için değişir</div></div><span class="sw"></span></button>`}
      <div class="list" style="margin-top:10px">${alts.map(({ e, ok, why }) => `<button class="item ${ok ? "" : "dim"}" data-id="${e.id}" ${ok ? "" : 'data-na="1"'}>${thumb(e)}<div class="grow"><h4>${esc(e.n)}</h4><div class="meta">${esc(eqText(e))}</div><div class="meta">${diffBars(e.d)} ${diffLbl[e.d]}${why ? ` · <span style="color:#ff8a80">${esc(why)}</span>` : ""}</div></div><span class="swapbtn">${ok ? "Seç" : "Yok"}</span></button>`).join("")}</div>
      <div class="hr"></div>
      ${cur.eq.length ? `<p class="small muted" style="margin-bottom:8px">Salonunda bu hareketin aleti yok mu?</p>${cur.eq.map((q) => `<button class="btn sm block" data-noeq="${q}" style="margin-bottom:6px">“${esc(eqName(q))}” salonumda yok</button>`).join("")}` : ""}
      <button class="btn sm block ghost" data-act="ban" style="margin-top:4px">Bu hareketi hiç önerme</button>`,
    (body, close) => {
      let perm = !opts.today;
      body.addEventListener("click", (ev) => {
        const t = ev.target.closest("[data-act]");
        if (t && t.dataset.act === "perm") { perm = !perm; t.classList.toggle("on", perm); return; }
        if (t && t.dataset.act === "ban") { S.banned[exId] = true; if (key) delete S.swaps[key]; save(); close(); toast(`“${cur.n}” artık önerilmeyecek`, "🚫"); done && done(null, true); return; }
        const ne = ev.target.closest("[data-noeq]");
        if (ne) { S.eq[ne.dataset.noeq] = false; if (key) delete S.swaps[key]; save(); close(); toast(`${eqName(ne.dataset.noeq)} kaldırıldı — program buna göre güncellendi`, "🛠️"); done && done(null, true); return; }
        const it = ev.target.closest("[data-id]");
        if (!it) return;
        if (it.dataset.na) { if (confirm("Bu hareketin aleti salonunda yok olarak işaretli. Yine de seçilsin mi? (Aleti Profil → Salonumdaki aletler'den tekrar açabilirsin)")) { BY[it.dataset.id].eq.forEach((q) => (S.eq[q] = true)); delete S.banned[it.dataset.id]; } else return; }
        if (perm && key) S.swaps[key] = it.dataset.id;
        save(); close(); toast(`“${BY[it.dataset.id].n}” seçildi`, "🔁"); done && done(it.dataset.id, perm);
      });
    });
  }

  /* ---------- hareket detayı ---------- */
  function ytLink(q) { return "https://www.youtube.com/results?search_query=" + encodeURIComponent(q); }
  function openExercise(id, ctx = {}) {
    const e = BY[id];
    const avail = P.available(S, e);
    const alts = P.alternatives(S, id).filter((a) => a.ok).slice(0, 4);
    const kindTxt = e.kind === "time" ? "Süreli" : e.kind === "cardio" ? "Kardiyo" : "Tekrarlı";
    const hist = S.history[id] || [];
    const pr = S.pr[id];
    const html = `
      <div class="up" style="color:var(--orange);margin-top:6px">${esc(SLOTS[e.slot].n)}</div>
      <h2 class="title">${esc(e.n)}</h2>
      <p class="muted small" style="margin-bottom:12px">${esc(SLOTS[e.slot].f)}</p>
      <div class="stage" id="exStage"></div>
      <div class="frames"><figure><figcaption>1 · Başlangıç</figcaption>${window.Figure.still(e.anim, e, 0)}</figure><figure><figcaption>2 · Hareket</figcaption>${window.Figure.still(e.anim, e, 1)}</figure></div>
      <div class="vidbtns"><a href="${ytLink(e.n + " nasıl yapılır")}" target="_blank" rel="noopener">${ICON.yt} Türkçe video</a><a href="${ytLink(e.en)}" target="_blank" rel="noopener">${ICON.yt} Daha çok video</a></div>
      <div class="kv">
        <div><span class="up">Zorluk</span><b>${diffBars(e.d)}</b><span class="tiny muted">${diffLbl[e.d]}</span></div>
        <div><span class="up">Tür</span><b>${kindTxt}</b><span class="tiny muted">${e.perSide ? "her taraf" : "&nbsp;"}</span></div>
        <div><span class="up">Eklem yükü</span><b style="font-size:15px;margin-top:5px">Diz ${["az", "orta", "fazla"][e.knee]}</b><span class="tiny muted">Bel ${["az", "orta", "fazla"][e.back]}</span></div>
      </div>
      <div class="chips" style="margin-bottom:12px">${e.eq.length ? e.eq.map((q) => `<span class="chip ${S.eq[q] === false ? "warn" : ""}">${(EQUIPMENT.find((x) => x.id === q) || {}).ico || ""} ${esc(eqName(q))}${S.eq[q] === false ? " · salonunda yok" : ""}</span>`).join("") : `<span class="chip">🙌 Alet gerekmez</span>`}</div>
      ${e.note ? `<div class="callout" style="margin-bottom:12px">⭐ ${esc(e.note)}</div>` : ""}
      <div class="sec" style="margin-top:6px"><h2>Çalışan kaslar</h2></div>
      <div class="bodywrap">${window.BodyMap.svg(e.pri, e.sec)}
        <div class="legend"><span><i style="background:#ff3b30"></i>Ana kas</span><span><i style="background:#ff8a1f"></i>Yardımcı kas</span></div></div>
      <div class="chips" style="margin-top:10px">${e.pri.map((m) => `<span class="chip pri">${esc(mName(m))}</span>`).join("")}${e.sec.map((m) => `<span class="chip sec">${esc(mName(m))}</span>`).join("")}</div>
      <div class="sec"><h2>Nasıl yapılır</h2></div>
      <ol class="steps">${e.steps.map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      ${e.breath ? `<div class="card" style="margin-top:12px"><div class="row"><span style="font-size:24px">🫁</span><div><b>Nefes</b><p class="small muted">${esc(e.breath)}</p></div></div></div>` : ""}
      ${e.tips.length ? `<div class="sec"><h2>İpuçları</h2></div><ul class="notes">${e.tips.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}
      ${e.avoid.length ? `<div class="sec"><h2>Sık yapılan hatalar</h2></div><ul class="notes bad">${e.avoid.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>` : ""}
      ${hist.length ? `<div class="sec"><h2>Geçmişin</h2>${pr ? `<span class="tiny grad-text" style="font-weight:800">Rekor: ${fmt1(pr.kg)} kg × ${pr.r}</span>` : ""}</div>
        <div class="list">${hist.slice(-4).reverse().map((h) => `<div class="item"><div class="grow"><h4 style="font-size:14px">${dateLabel(h.date)}</h4><div class="meta">${h.sets.map((s) => (s.sec ? `${s.sec} sn` : `${s.kg != null ? fmt1(s.kg) + " kg × " : ""}${s.r}`)).join(" · ")}</div></div></div>`).join("")}</div>` : ""}
      <div class="sec"><h2>Alternatifler</h2><span class="tiny muted">Aynı işlev</span></div>
      <div class="list">${alts.length ? alts.map(({ e: a }) => `<button class="item" data-alt="${a.id}">${thumb(a)}<div class="grow"><h4>${esc(a.n)}</h4><div class="meta">${esc(eqText(a))}</div><div class="meta">${diffBars(a.d)} ${diffLbl[a.d]}</div></div>${ctx.key ? `<span class="swapbtn" data-use="${a.id}">Bunu kullan</span>` : ""}</button>`).join("") : `<p class="muted small">Salonundaki aletlerle başka alternatif yok.</p>`}</div>
      <div class="hr"></div>
      ${!avail ? `<div class="callout" style="margin-bottom:10px">⚠️ Bu hareketin aleti salonunda yok olarak işaretli; programda yerine alternatifi gösterilir.</div>` : ""}
      <button class="btn sm block ghost" data-act="ban">${S.banned[id] ? "Bu hareketi tekrar öner" : "Bu hareketi bana önerme"}</button>`;
    openSheet(html, (body, close, wrap) => {
      const stage = $("#exStage", body);
      let speed = 1;
      let anim = window.Figure.animate(stage, e.anim, e, { speed });
      const ctrls = document.createElement("div"); ctrls.className = "ctrls";
      ctrls.innerHTML = `<button data-c="speed">1×</button><button data-c="pp">${ICON.pause.replace("<svg", '<svg width="14" height="14"')}</button>`;
      const badge = document.createElement("div"); badge.className = "badge"; badge.textContent = "Canlı";
      const mountCtrls = () => { stage.appendChild(ctrls); stage.appendChild(badge); };
      mountCtrls();
      ctrls.onclick = (ev) => {
        const c = ev.target.closest("[data-c]"); if (!c) return;
        if (c.dataset.c === "pp") { if (anim.paused) { anim.play(); c.innerHTML = ICON.pause.replace("<svg", '<svg width="14" height="14"'); badge.style.opacity = 1; } else { anim.pause(); c.innerHTML = ICON.play.replace("<svg", '<svg width="14" height="14"'); badge.style.opacity = 0.3; } }
        else { speed = speed === 1 ? 0.5 : speed === 0.5 ? 1.5 : 1; anim.stop(); anim = window.Figure.animate(stage, e.anim, e, { speed }); mountCtrls(); c.textContent = speed.toString().replace(".", ",") + "×"; }
      };
      wrap._cleanup = () => anim.stop();
      body.addEventListener("click", (ev) => {
        const u = ev.target.closest("[data-use]");
        if (u && ctx.key) { ev.stopPropagation(); S.swaps[ctx.key] = u.dataset.use; save(); close(); toast(`“${BY[u.dataset.use].n}” programına eklendi`, "🔁"); ctx.onSwap && ctx.onSwap(); return; }
        const a = ev.target.closest("[data-alt]");
        if (a) { openExercise(a.dataset.alt, ctx); return; }
        const b = ev.target.closest("[data-act='ban']");
        if (b) { if (S.banned[id]) delete S.banned[id]; else S.banned[id] = true; save(); close(); toast(S.banned[id] ? "Bu hareket artık önerilmeyecek" : "Hareket tekrar önerilecek", "👌"); ctx.onSwap && ctx.onSwap(); if (tab !== "home") rerender(); }
      });
    });
  }

  /* ---------- HAREKETLER ---------- */
  const REGIONS = [
    ["all", "Tümü", null], ["chest", "Göğüs", ["chest"]], ["back", "Sırt", ["lats", "upperback", "lowerback", "traps"]], ["shoulder", "Omuz", ["shoulders_front", "shoulders_side", "shoulders_rear"]],
    ["arm", "Kol", ["biceps", "triceps", "forearms"]], ["leg", "Bacak", ["quads", "hamstrings", "adductors", "calves"]], ["glute", "Kalça", ["glutes", "glute_med", "hipflexors"]],
    ["core", "Karın", ["abs", "obliques"]], ["cardio", "Kardiyo", "cardio"], ["mob", "Isınma & Esneme", "mob"],
  ];
  function libFilter() {
    const q = lib.q.trim().toLocaleLowerCase("tr");
    // arama yapılırken bölge filtresi uygulanmaz
    const reg = q ? REGIONS[0] : REGIONS.find((r) => r[0] === lib.region);
    return EXERCISES.filter((e) => {
      if (reg[2] === "cardio" && e.slot !== "cardio") return false;
      if (reg[2] === "mob" && !["warmup", "stretch"].includes(e.slot)) return false;
      if (Array.isArray(reg[2]) && (!e.pri.some((m) => reg[2].includes(m)) || ["warmup", "stretch"].includes(e.slot))) return false;
      if (lib.region === "all" && ["warmup", "stretch"].includes(e.slot) && !q) return false;
      if (lib.muscle && !e.pri.includes(lib.muscle) && !e.sec.includes(lib.muscle)) return false;
      if (lib.mine && !P.available(S, e)) return false;
      if (q && !(e.n.toLocaleLowerCase("tr").includes(q) || e.pri.concat(e.sec).some((m) => mName(m).toLocaleLowerCase("tr").includes(q)) || SLOTS[e.slot].n.toLocaleLowerCase("tr").includes(q))) return false;
      return true;
    }).sort((a, b) => (lib.muscle ? (b.pri.includes(lib.muscle) - a.pri.includes(lib.muscle)) : 0) || a.d - b.d || a.n.localeCompare(b.n, "tr"));
  }
  function libList() {
    const list = libFilter();
    return `<div class="tiny muted" style="margin:4px 2px 8px">${list.length} hareket${lib.muscle ? ` · <b style="color:var(--ink)">${esc(mName(lib.muscle))}</b> <button class="swapbtn" data-act="clearm" style="margin-left:6px">✕ Temizle</button>` : ""}</div>
      <div class="list">${list.map((e) => { const ok = P.available(S, e); return `<button class="item ${ok ? "" : "dim"}" data-ex="${e.id}">${thumb(e)}<div class="grow"><h4>${esc(e.n)}</h4><div class="meta">${e.pri.slice(0, 2).map(mName).join(", ")}</div><div class="meta">${diffBars(e.d)} ${diffLbl[e.d]}${ok ? "" : ' · <span style="color:#ff8a80">alet yok</span>'}</div></div></button>`; }).join("") || `<div class="empty">Sonuç yok</div>`}</div>`;
  }
  function viewLibrary() {
    return `<div class="topbar"><h1>Hareketler</h1></div>
      <div class="search">${ICON.search}<input id="q" type="search" placeholder="Hareket ya da kas ara…" value="${esc(lib.q)}" autocomplete="off"></div>
      <div class="hscroll">${REGIONS.map((r) => `<button class="chip ${lib.region === r[0] ? "on" : ""}" data-reg="${r[0]}">${r[1]}</button>`).join("")}</div>
      <button class="toggle ${lib.mine ? "on" : ""}" data-act="mine"><div class="grow"><b>Sadece salonumdaki aletler</b><div class="tiny muted">Profil → Salonumdaki aletler'den düzenlenir</div></div><span class="sw"></span></button>
      <div class="bodywrap" style="margin-top:12px"><div class="tiny muted" style="text-align:center;margin-bottom:2px">Kasa dokun → o kası çalıştıran hareketler</div>
        <div id="libmap">${window.BodyMap.svg(lib.muscle ? [lib.muscle] : [], [], { interactive: true })}</div></div>
      <div id="liblist" style="margin-top:12px">${libList()}</div>`;
  }
  bind.library = (root) => {
    const refresh = () => { $("#liblist").innerHTML = libList(); };
    $("#q", root).addEventListener("input", (e) => { lib.q = e.target.value; refresh(); });
    root.addEventListener("click", (ev) => {
      const m = ev.target.closest("path[data-m]");
      if (m) { lib.muscle = lib.muscle === m.dataset.m ? null : m.dataset.m; lib.region = "all"; $("#libmap").innerHTML = window.BodyMap.svg(lib.muscle ? [lib.muscle] : [], [], { interactive: true }); $$("[data-reg]").forEach((x) => x.classList.toggle("on", x.dataset.reg === "all")); refresh(); return; }
      const r = ev.target.closest("[data-reg]");
      if (r) { lib.region = r.dataset.reg; lib.muscle = null; rerender(); return; }
      const a = ev.target.closest("[data-act]");
      if (a && a.dataset.act === "mine") { lib.mine = !lib.mine; a.classList.toggle("on", lib.mine); refresh(); return; }
      if (a && a.dataset.act === "clearm") { lib.muscle = null; rerender(); return; }
      const e = ev.target.closest("[data-ex]");
      if (e) openExercise(e.dataset.ex);
    });
  };

  /* ---------- İLERLEME ---------- */
  function weightChart() {
    const pts = [{ d: S.profile.start, kg: S.profile.weight }].concat(S.weights.slice().sort((a, b) => (a.d < b.d ? -1 : 1))).filter((p, i, a) => i === 0 || p.d >= a[0].d);
    if (pts.length < 2) return `<div class="empty small">Haftada bir kilonu girdikçe burada grafiğin oluşacak.</div>`;
    const W = 340, H = 150, pad = 26;
    const xs = pts.map((p) => P.parseKey(p.d).getTime()), ys = pts.map((p) => p.kg).concat([S.profile.goal]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs) || x0 + 1;
    const y0 = Math.floor(Math.min(...ys) - 1), y1 = Math.ceil(Math.max(...ys) + 1);
    const X = (t) => pad + ((t - x0) / Math.max(1, x1 - x0)) * (W - pad - 8);
    const Y = (v) => 8 + (1 - (v - y0) / Math.max(1, y1 - y0)) * (H - 30);
    const line = pts.map((p, i) => `${i ? "L" : "M"}${X(xs[i]).toFixed(1)} ${Y(p.kg).toFixed(1)}`).join(" ");
    const area = line + ` L${X(xs[xs.length - 1]).toFixed(1)} ${H - 22} L${X(xs[0]).toFixed(1)} ${H - 22} Z`;
    const grid = [y0, (y0 + y1) / 2, y1].map((v) => `<line class="gl" x1="${pad}" x2="${W - 8}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="0" y="${Y(v) + 3}">${Math.round(v)}</text>`).join("");
    const gy = Y(S.profile.goal);
    return `<svg viewBox="0 0 ${W} ${H}" class="chart"><defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5a1f" stop-opacity=".45"/><stop offset="1" stop-color="#ff5a1f" stop-opacity="0"/></linearGradient><linearGradient id="wl" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#ff2d2d"/><stop offset="1" stop-color="#ff8a1f"/></linearGradient></defs>
      ${grid}<line x1="${pad}" x2="${W - 8}" y1="${gy}" y2="${gy}" stroke="#ffb23f" stroke-dasharray="4 4" stroke-width="1.2"/><text class="ax" x="${W - 8}" y="${gy - 4}" text-anchor="end" style="fill:#ffb23f">Hedef ${S.profile.goal}</text>
      <path d="${area}" fill="url(#wg)"/><path d="${line}" fill="none" stroke="url(#wl)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
      ${pts.map((p, i) => `<circle cx="${X(xs[i])}" cy="${Y(p.kg)}" r="3.5" fill="#fff" stroke="#ff5a1f" stroke-width="2"/>`).join("")}
      <text class="ax" x="${pad}" y="${H - 6}">${dateLabel(pts[0].d)}</text><text class="ax" x="${W - 8}" y="${H - 6}" text-anchor="end">${dateLabel(pts[pts.length - 1].d)}</text></svg>`;
  }
  function heatmap() {
    const mon = P.mondayOf(new Date());
    const cols = [];
    for (let w = 11; w >= 0; w--) cols.push(P.addDays(mon, -w * 7));
    let html = `<div class="heat">`;
    for (let r = 0; r < 7; r++) {
      html += `<span>${P.DAY_SHORT[(r + 1) % 7]}</span>`;
      for (const c of cols) {
        const d = P.addDays(c, r), k = P.keyOf(d), log = S.logs[k];
        let cls = "";
        if (log && log.status === "done") cls = "d";
        else if (isTrain(d) && d >= startDate() && k < todayKey()) cls = "m";
        else if (isTrain(d) && d >= startDate()) cls = "t";
        html += `<i class="${cls}" title="${dateLabel(k)}"></i>`;
      }
    }
    return html + `</div><div class="legend" style="margin-top:10px"><span><i style="background:linear-gradient(135deg,#ff2d2d,#ff8a1f)"></i>Yapıldı</span><span><i style="background:rgba(255,59,48,.22)"></i>Kaçtı</span><span><i style="background:var(--surface3);box-shadow:inset 0 0 0 1.5px rgba(255,122,26,.35)"></i>Planlı</span></div>`;
  }
  function viewProgress() {
    const logs = doneLogs();
    const cw = currentWeight(), b = bmi(cw);
    const lost = S.profile.weight - cw, toGo = cw - S.profile.goal;
    const tot = logs.reduce((a, [, l]) => ({ min: a.min + (l.dur || 0) / 60, cardio: a.cardio + (l.cardioMin || 0), kcal: a.kcal + (l.kcal || 0) }), { min: 0, cardio: 0, kcal: 0 });
    const prs = Object.entries(S.pr).sort((a, b) => (a[1].date < b[1].date ? 1 : -1)).slice(0, 8);
    const h = S.profile.height / 100;
    const healthy = [18.5 * h * h, 24.9 * h * h];
    return `<div class="topbar"><h1>İlerleme</h1><button class="iconbtn" data-act="addweight" aria-label="Kilo ekle">${ICON.plus}</button></div>
      <div class="card">
        <div class="row" style="align-items:flex-end"><div class="grow"><div class="up muted">Şu anki kilo</div><div class="num" style="font-size:46px;line-height:1">${fmt1(cw)}<span class="muted" style="font-size:20px"> kg</span></div></div>
        <div style="text-align:right"><div class="num grad-text" style="font-size:28px">${lost > 0 ? "−" + fmt1(lost) : lost < 0 ? "+" + fmt1(-lost) : "0"} kg</div><div class="tiny muted">başlangıçtan beri</div></div></div>
        <div style="margin-top:12px">${weightChart()}</div>
        <div class="grid3" style="margin-top:12px">
          <div class="tile" style="padding:10px"><div class="up">Hedef</div><div class="num" style="font-size:22px">${fmt1(S.profile.goal)}</div><div class="tiny muted">${toGo > 0 ? fmt1(toGo) + " kg kaldı" : "Ulaştın! 🎉"}</div></div>
          <div class="tile" style="padding:10px"><div class="up">BMI</div><div class="num" style="font-size:22px">${fmt1(b)}</div><div class="tiny muted">${bmiCat(b)}</div></div>
          <div class="tile" style="padding:10px"><div class="up">Tempo</div><div class="num" style="font-size:22px">${paceText()}</div><div class="tiny muted">kg / hafta</div></div>
        </div>
        <p class="tiny muted" style="margin-top:10px">Boyuna göre sağlıklı kilo aralığı ${Math.round(healthy[0])}–${Math.round(healthy[1])} kg. Haftada 0,5–1 kg sağlıklı bir hızdır${toGo > 0 ? `; bu tempoyla hedefine yaklaşık ${Math.ceil(toGo / 0.75)} hafta.` : "."}</p>
        <button class="btn sm block" style="margin-top:12px" data-act="addweight">${ICON.plus} Kilo ölçümü ekle</button>
      </div>
      <div class="sec"><h2>Toplam</h2></div>
      <div class="statgrid">
        <div class="tile"><div class="up">Antrenman</div><div class="num">${logs.length}</div></div>
        <div class="tile"><div class="up">Süre</div><div class="num">${Math.round(tot.min / 60 * 10) / 10 > 0 ? fmt1(tot.min / 60) : 0}<span class="muted" style="font-size:18px"> saat</span></div></div>
        <div class="tile"><div class="up">Kardiyo</div><div class="num">${tot.cardio}<span class="muted" style="font-size:18px"> dk</span></div></div>
        <div class="tile"><div class="up">Yakılan (tahmini)</div><div class="num">${tot.kcal.toLocaleString("tr-TR")}<span class="muted" style="font-size:18px"> kcal</span></div></div>
      </div>
      <div class="sec"><h2>Son 12 hafta</h2></div><div class="card">${heatmap()}</div>
      <div class="sec"><h2>Rozetler</h2><span class="tiny muted">${Object.keys(S.badges).length} / ${BADGES.length}</span></div>
      <div class="badges">${BADGES.map((b) => `<button class="badge-i ${S.badges[b.id] ? "on" : ""}" data-badge="${b.id}"><span class="ic">${b.ic}</span>${b.n}</button>`).join("")}</div>
      <div class="sec"><h2>Kişisel rekorlar</h2></div>
      ${prs.length ? `<div class="list">${prs.map(([id, p]) => `<button class="item" data-ex="${id}">${thumb(BY[id])}<div class="grow"><h4>${esc(BY[id].n)}</h4><div class="meta">${dateLabel(p.date)}</div></div><div class="num grad-text" style="font-size:22px">${fmt1(p.kg)} kg × ${p.r}</div></button>`).join("")}</div>` : `<div class="card empty small">Ağırlıklı hareketlerde kaydettiğin en iyi setler burada görünecek.</div>`}
      <div class="sec"><h2>Geçmiş</h2></div>
      ${logs.length ? `<div class="list">${logs.slice().reverse().slice(0, 20).map(([k, l]) => `<button class="item" data-log="${k}"><span style="font-size:26px;width:36px;text-align:center">${["", "😌", "🙂", "💪", "😤", "🥵"][l.feel || 3]}</span><div class="grow"><h4>${esc(l.tplName || "Antrenman")}</h4><div class="meta">${dateLabel(k, true)} · ${Math.round((l.dur || 0) / 60)} dk${l.quick ? " · hızlı kayıt" : ""}</div></div><span class="tiny muted">${l.sets || 0} set</span></button>`).join("")}</div>` : `<div class="card empty small">İlk antrenmanından sonra geçmişin burada listelenecek.</div>`}`;
  }
  function paceText() {
    const w = S.weights.slice().sort((a, b) => (a.d < b.d ? -1 : 1));
    if (!w.length) return "—";
    const first = { d: S.profile.start, kg: S.profile.weight }, last = w[w.length - 1];
    const weeks = (P.parseKey(last.d) - P.parseKey(first.d)) / (7 * 864e5);
    if (weeks < 1) return "—";
    const r = (last.kg - first.kg) / weeks;
    return (r <= 0 ? "−" : "+") + fmt1(Math.abs(r));
  }
  bind.progress = (root) => {
    root.addEventListener("click", (ev) => {
      const a = ev.target.closest("[data-act='addweight']"); if (a) return openWeight();
      const e = ev.target.closest("[data-ex]"); if (e) return openExercise(e.dataset.ex);
      const l = ev.target.closest("[data-log]"); if (l) return openLog(l.dataset.log);
      const b = ev.target.closest("[data-badge]");
      if (b) { const x = BADGES.find((y) => y.id === b.dataset.badge); toast(`${x.n}: ${x.d}${S.badges[x.id] ? ` ✓ (${dateLabel(S.badges[x.id])})` : ""}`, x.ic); }
    });
  };

  function openWeight() {
    openSheet(`<h2 class="title">Kilo ölçümü</h2><p class="muted small" style="margin-bottom:14px">En doğru sonuç için haftada bir, aynı gün sabah aç karna tartıl.</p>
      <div class="grid2"><div class="field"><label>Kilo (kg)</label><input class="input" id="wkg" type="number" inputmode="decimal" step="0.1" value="${fmt1(currentWeight()).replace(",", ".")}"></div>
      <div class="field"><label>Tarih</label><input class="input" id="wd" type="date" value="${todayKey()}"></div></div>
      <button class="btn primary block" id="wsave">Kaydet</button>
      ${S.weights.length ? `<div class="sec"><h2>Ölçümler</h2></div><div class="list">${S.weights.slice().sort((a, b) => (a.d < b.d ? 1 : -1)).map((w) => `<div class="item"><div class="grow"><h4>${fmt1(w.kg)} kg</h4><div class="meta">${dateLabel(w.d, true)}</div></div><button class="swapbtn" data-del="${w.d}">Sil</button></div>`).join("")}</div>` : ""}`,
    (body, close) => {
      $("#wsave", body).onclick = () => {
        const kg = parseFloat(String($("#wkg", body).value).replace(",", ".")), d = $("#wd", body).value || todayKey();
        if (!(kg > 30 && kg < 400)) return toast("Geçerli bir kilo gir", "⚠️");
        S.weights = S.weights.filter((w) => w.d !== d).concat([{ d, kg }]);
        save(); close(); checkBadges(); rerender(); toast(`${fmt1(kg)} kg kaydedildi`, "⚖️");
      };
      body.addEventListener("click", (ev) => { const x = ev.target.closest("[data-del]"); if (x) { S.weights = S.weights.filter((w) => w.d !== x.dataset.del); save(); close(); rerender(); openWeight(); } });
    });
  }

  function openLog(k) {
    const l = S.logs[k]; if (!l) return;
    openSheet(`<div class="up" style="color:var(--orange);margin-top:6px">${dateLabel(k, true)}</div><h2 class="title">${esc(l.tplName || "Antrenman")}</h2>
      <div class="summary">
        <div class="tile"><div class="up">Süre</div><div class="num">${Math.round((l.dur || 0) / 60)} dk</div></div>
        <div class="tile"><div class="up">Set</div><div class="num">${l.sets || 0}</div></div>
        <div class="tile"><div class="up">Kardiyo</div><div class="num">${l.cardioMin || 0} dk</div></div>
        <div class="tile"><div class="up">Kalori (tahmini)</div><div class="num">${l.kcal || 0}</div></div>
      </div>
      ${l.vol ? `<p class="small muted">Toplam kaldırılan: <b style="color:var(--ink)">${l.vol.toLocaleString("tr-TR")} kg</b></p>` : ""}
      ${l.note ? `<div class="card" style="margin-top:10px"><b>Not</b><p class="small muted">${esc(l.note)}</p></div>` : ""}
      ${(l.items || []).length ? `<div class="sec"><h2>Hareketler</h2></div><div class="list">${l.items.map((it) => `<button class="item" data-ex="${it.id}">${thumb(BY[it.id])}<div class="grow"><h4>${esc(BY[it.id].n)}</h4><div class="meta">${it.sets.map((s) => (s.sec ? `${s.sec} sn` : `${s.kg != null ? fmt1(s.kg) + "×" : ""}${s.r}`)).join(" · ") || "atlandı"}</div></div></button>`).join("")}</div>` : l.quick ? `<p class="small muted" style="margin-top:10px">Hızlı kayıt (detay girilmedi).</p>` : ""}
      <div class="hr"></div><button class="btn sm block danger" data-act="del">Bu kaydı sil</button>`,
    (body, close) => body.addEventListener("click", (ev) => {
      const e = ev.target.closest("[data-ex]"); if (e) return openExercise(e.dataset.ex);
      if (ev.target.closest("[data-act='del']") && confirm("Kayıt silinsin mi?")) { delete S.logs[k]; save(); close(); rerender(); }
    }));
  }

  /* ---------- PROFİL / AYARLAR ---------- */
  function viewProfile() {
    const pr = S.profile;
    const w = P.weekIndex(S, new Date());
    const hr = P.hrZone(pr.age);
    return `<div class="topbar"><h1>Profil</h1></div>
      <div class="card"><div class="row"><div class="brand"><span class="logo" style="width:54px;height:54px;border-radius:16px;font-size:24px">${esc((pr.name || "?").slice(0, 1).toUpperCase())}</span></div>
        <div class="grow"><h2 style="font-size:26px;text-transform:uppercase">${esc(pr.name || "Sporcu")}</h2><div class="small muted">${pr.age} yaş · ${pr.height} cm · başlangıç ${fmt1(pr.weight)} kg → hedef ${fmt1(pr.goal)} kg</div></div>
        <button class="btn sm" data-act="editprofile">Düzenle</button></div></div>

      <div class="sec"><h2>Antrenman günleri</h2></div>
      <div class="daypick">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<button class="${pr.days.includes(d) ? "on" : ""}" data-dow="${d}">${P.DAY_SHORT[d]}</button>`).join("")}</div>
      <p class="tiny muted" style="margin-top:8px">Önerilen: 4 gün (Salı, Perşembe, Cuma, Pazar). 2–5 gün seçebilirsin; program buna göre dağıtılır.</p>

      <div class="sec"><h2>Seviye</h2></div>
      <div class="card"><div class="row"><div class="grow"><div class="up muted">Şu an</div><b style="font-size:18px">Hafta ${w + 1} · ${P.phaseOf(w).n}</b>${pr.offset ? `<div class="tiny muted">${pr.offset > 0 ? pr.offset + " hafta ileri" : -pr.offset + " hafta geri"} alındı</div>` : ""}</div></div>
        <div class="btnrow" style="margin-top:12px"><button class="btn sm" data-act="lvl" data-d="-1">− 1 hafta (kolaylaştır)</button><button class="btn sm" data-act="lvl" data-d="1">+ 1 hafta</button></div>
        ${pr.offset ? `<button class="btn sm block ghost" style="margin-top:6px" data-act="lvl0">Takvime göre sıfırla</button>` : ""}
        <p class="tiny muted" style="margin-top:10px">Zor geliyorsa geri al; aynı seviyede biraz daha kalmak tamamen normal.</p></div>

      <div class="sec"><h2>Salonumdaki aletler</h2><button class="link" data-act="eqall">Tümü</button></div>
      <p class="tiny muted" style="margin:-4px 0 10px">Olmayanların işaretini kaldır — program otomatik olarak aynı işi yapan başka hareket seçer.</p>
      <div class="eqgrid">${EQUIPMENT.map((e) => `<button class="eq ${S.eq[e.id] !== false ? "on" : ""}" data-eq="${e.id}"><span class="ck">${S.eq[e.id] !== false ? "✓" : ""}</span><span>${e.ico} ${esc(e.n)}</span></button>`).join("")}</div>

      <div class="sec"><h2>Eklem hassasiyeti</h2></div>
      <button class="toggle ${pr.kneeCare ? "on" : ""}" data-tog="kneeCare"><div class="grow"><b>Dizlerimi koru</b><div class="tiny muted">Dizlere fazla yük bindiren hareketler önerilmez</div></div><span class="sw"></span></button>
      <button class="toggle ${pr.backCare ? "on" : ""}" data-tog="backCare"><div class="grow"><b>Belimi koru</b><div class="tiny muted">Bele fazla yük bindiren hareketler önerilmez</div></div><span class="sw"></span></button>

      <div class="sec"><h2>Sayaç</h2></div>
      <button class="toggle ${S.settings.sound ? "on" : ""}" data-set="sound"><div class="grow"><b>Sesli uyarı</b><div class="tiny muted">Son 3 saniyede bip sesi</div></div><span class="sw"></span></button>
      <button class="toggle ${S.settings.voice ? "on" : ""}" data-set="voice"><div class="grow"><b>Sesli koç</b><div class="tiny muted">“Dinlenme bitti, sıradaki…” diye söyler</div></div><span class="sw"></span></button>
      <button class="toggle ${S.settings.vibrate ? "on" : ""}" data-set="vibrate"><div class="grow"><b>Titreşim</b><div class="tiny muted">Destekleyen cihazlarda</div></div><span class="sw"></span></button>
      <div class="card" style="margin-top:8px"><div class="up muted" style="margin-bottom:8px">Dinlenme süresi</div>
        <div class="seg">${[[-15, "Kısa"], [0, "Normal"], [15, "+15 sn"], [30, "+30 sn"]].map(([v, n]) => `<button class="${S.settings.restAdd === v ? "on" : ""}" data-rest="${v}">${n}</button>`).join("")}</div></div>

      <div class="sec"><h2>Bildirimler</h2></div>
      <button class="item" data-act="notify"><span style="font-size:28px">🔔</span><div class="grow"><h4>Hatırlatmaları kur</h4><div class="meta">Spor günü, “spora gittin mi?” ve tartı hatırlatmaları</div></div>${ICON.right.replace("<svg", '<svg width="20" height="20"')}</button>

      <div class="sec"><h2>Nabız bölgelerin</h2></div>
      <div class="card"><div class="row"><span style="font-size:28px">❤️</span><div class="grow"><b>Yağ yakım bölgesi: ${hr[0]}–${hr[1]} atım/dk</b><p class="tiny muted">Tahmini maksimum nabız ${hr[2]}. Kardiyoda konuşabildiğin ama şarkı söyleyemediğin tempo bu bölgedir.</p></div></div></div>

      ${Object.keys(S.banned).length || Object.keys(S.swaps).length ? `<div class="sec"><h2>Değiştirdiğin hareketler</h2></div><div class="list">
        ${Object.entries(S.swaps).map(([k, id]) => `<div class="item"><div class="grow"><h4>${esc(BY[id] ? BY[id].n : id)}</h4><div class="meta">${esc(P.TEMPLATES[k.split(":")[0]] ? P.TEMPLATES[k.split(":")[0]].n : "")} · ${esc(SLOTS[(BY[id] || {}).slot] ? SLOTS[BY[id].slot].n : "")}</div></div><button class="swapbtn" data-unswap="${esc(k)}">Geri al</button></div>`).join("")}
        ${Object.keys(S.banned).map((id) => `<div class="item"><div class="grow"><h4>${esc(BY[id].n)}</h4><div class="meta">Önerilmiyor</div></div><button class="swapbtn" data-unban="${id}">Geri al</button></div>`).join("")}</div>` : ""}

      <div class="sec"><h2>Yedek</h2></div>
      <div class="btnrow"><button class="btn sm" data-act="export">Yedeği indir</button><button class="btn sm" data-act="import">Yedekten yükle</button></div>
      <input type="file" id="impf" accept="application/json,.json" hidden>
      <p class="tiny muted" style="margin-top:8px">Verilerin sadece bu telefonda saklanır. Telefon değiştirirken yedeği indirip yeni telefonda yükle.</p>

      <div class="sec"><h2>Güvenlik</h2></div>
      <div class="card small muted">Bu program genel bir başlangıç programıdır, tıbbi tavsiye değildir. Kalp, tansiyon, diyabet ya da eklem sorunun varsa başlamadan önce doktoruna danış. Göğüs ağrısı, baş dönmesi, nefes darlığı ya da keskin eklem ağrısı hissedersen hemen dur.</div>
      <button class="btn sm block ghost danger" style="margin-top:14px" data-act="reset">Tüm verileri sıfırla</button>
      <p class="tiny muted" style="text-align:center;margin-top:16px">ADIM · Adım adım güçlen</p>`;
  }
  bind.profile = (root) => {
    root.addEventListener("click", (ev) => {
      const t = ev.target.closest("[data-dow],[data-act],[data-eq],[data-tog],[data-set],[data-rest],[data-unswap],[data-unban]"); if (!t) return;
      const ds = t.dataset;
      if (ds.dow != null) {
        const d = +ds.dow, days = S.profile.days;
        if (days.includes(d)) { if (days.length <= 2) return toast("En az 2 gün seçmelisin", "⚠️"); S.profile.days = days.filter((x) => x !== d); }
        else { if (days.length >= 5) return toast("En fazla 5 gün — dinlenme de antrenmanın parçası", "⚠️"); S.profile.days = days.concat([d]); }
        save(); rerender(); return;
      }
      if (ds.eq) { S.eq[ds.eq] = S.eq[ds.eq] === false; save(); rerender(); return; }
      if (ds.tog) { S.profile[ds.tog] = !S.profile[ds.tog]; save(); rerender(); return; }
      if (ds.set) { S.settings[ds.set] = !S.settings[ds.set]; save(); rerender(); if (ds.set === "voice" && S.settings.voice) speak("Sesli koç açık."); return; }
      if (ds.rest != null) { S.settings.restAdd = +ds.rest; save(); rerender(); return; }
      if (ds.unswap) { delete S.swaps[ds.unswap]; save(); rerender(); return; }
      if (ds.unban) { delete S.banned[ds.unban]; save(); rerender(); return; }
      switch (ds.act) {
        case "editprofile": openProfileEdit(); break;
        case "lvl": S.profile.offset = (S.profile.offset || 0) + +ds.d; if (P.weekIndex(S, new Date()) === 0 && S.profile.offset < 0 && P.weekIndex(S, new Date()) + S.profile.offset < 0) S.profile.offset++; save(); rerender(); toast(`Program: Hafta ${P.weekIndex(S, new Date()) + 1}`, "📅"); break;
        case "lvl0": S.profile.offset = 0; save(); rerender(); break;
        case "eqall": EQUIPMENT.forEach((e) => (S.eq[e.id] = true)); save(); rerender(); break;
        case "notify": openNotify(); break;
        case "export": exportData(); break;
        case "import": $("#impf").click(); break;
        case "reset": if (confirm("Tüm kayıtların, ayarların ve geçmişin silinecek. Emin misin?")) { localStorage.removeItem(KEY); S = defaults(); save(); startOnboarding(); } break;
      }
    });
    $("#impf", root).onchange = (e) => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then((txt) => { try { const d = JSON.parse(txt); if (!d.profile) throw 0; S = Object.assign(defaults(), d); save(); rerender(); toast("Yedek yüklendi", "✅"); } catch (er) { toast("Bu dosya okunamadı", "⚠️"); } });
    };
  };

  function openProfileEdit() {
    const p = S.profile;
    openSheet(`<h2 class="title">Profil</h2>
      <div class="field"><label>Adın</label><input class="input" id="pn" value="${esc(p.name)}" placeholder="Adın"></div>
      <div class="grid3"><div class="field"><label>Yaş</label><input class="input" id="pa" type="number" inputmode="numeric" value="${p.age}"></div>
      <div class="field"><label>Boy (cm)</label><input class="input" id="ph" type="number" inputmode="numeric" value="${p.height}"></div>
      <div class="field"><label>Hedef kg</label><input class="input" id="pg" type="number" inputmode="decimal" value="${p.goal}"></div></div>
      <div class="grid2"><div class="field"><label>Başlangıç kilosu</label><input class="input" id="pw" type="number" inputmode="decimal" value="${p.weight}"></div>
      <div class="field"><label>Program başlangıcı</label><input class="input" id="ps" type="date" value="${p.start}"></div></div>
      <button class="btn primary block" id="psave">Kaydet</button>`, (body, close) => {
      $("#psave", body).onclick = () => {
        const num = (id, d) => { const v = parseFloat(String($(id, body).value).replace(",", ".")); return isFinite(v) ? v : d; };
        p.name = $("#pn", body).value.trim(); p.age = num("#pa", p.age); p.height = num("#ph", p.height); p.goal = num("#pg", p.goal); p.weight = num("#pw", p.weight);
        const s = $("#ps", body).value; if (s) p.start = P.keyOf(P.mondayOf(P.parseKey(s)));
        save(); close(); rerender(); toast("Profil güncellendi", "✅");
      };
    });
  }

  function download(name, text, type) {
    const blob = new Blob([text], { type });
    const file = new File([blob], name, { type });
    if (navigator.canShare && navigator.canShare({ files: [file] }) && /iPhone|iPad|Android/i.test(navigator.userAgent)) {
      navigator.share({ files: [file], title: name }).catch(() => {});
      return;
    }
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function exportData() { const s = Object.assign({}, S); download(`adim-yedek-${todayKey()}.json`, JSON.stringify(s, null, 1), "application/json"); }

  /* ---------- BİLDİRİMLER ---------- */
  function notifEntries(weeks = 16) {
    const out = [];
    const start = new Date();
    const [gh, gm] = S.profile.gymTime.split(":").map(Number);
    const [mh, mm] = S.profile.morningTime.split(":").map(Number);
    const [ch, cm] = S.profile.checkTime.split(":").map(Number);
    for (let i = 0; i < weeks * 7; i++) {
      const d = P.addDays(start, i);
      const k = P.keyOf(d);
      const pl = P.dayPlan(S, d);
      if (pl) {
        const ex = pl.items.slice(0, 3).map((x) => x.ex.n).join(", ");
        out.push({ k, h: mh, m: mm, title: `🔥 Bugün spor günü: ${pl.tpl.n}`, body: `${pl.tpl.sub} · ~${pl.minutes} dk · ${pl.cardio.min} dk kardiyo. ${ex}…` });
        out.push({ k, h: gh, m: gm, title: "💪 Spor saati!", body: `Çantanı al, salona! Bugün: ${pl.tpl.sub}. Isınmayı atlama.` });
        out.push({ k, h: ch, m: cm, title: "✅ Spora gittin mi?", body: "ADIM'ı açıp bugünkü antrenmanını işaretle. Gitmediysen sorun değil, sıradakini kaçırma!" });
      } else if (d.getDay() === 1) {
        out.push({ k, h: 8, m: 30, title: "⚖️ Haftalık tartı günü", body: "Aç karna tartıl ve kilonu ADIM'a gir." });
      }
    }
    return out;
  }
  function icsText() {
    const pad = (n) => String(n).padStart(2, "0");
    const escI = (s) => String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
    // satırlar 75 baytı geçmesin (çok baytlı Türkçe harf ve emojiler bölünmeden)
    const enc = new TextEncoder();
    const fold = (l) => { const out = []; let cur = "", n = 0; for (const ch of l) { const b = enc.encode(ch).length; if (n + b > 73) { out.push(cur); cur = " "; n = 1; } cur += ch; n += b; } out.push(cur); return out.join("\r\n"); };
    const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
    const L = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ADIM//Spor//TR", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", "X-WR-CALNAME:ADIM Spor"];
    const [gh, gm] = S.profile.gymTime.split(":").map(Number);
    const [mh, mm] = S.profile.morningTime.split(":").map(Number);
    const [ch, cm] = S.profile.checkTime.split(":").map(Number);
    const morningBefore = Math.max(30, (gh * 60 + gm) - (mh * 60 + mm));
    for (let i = 0; i < 12 * 7; i++) {
      const d = P.addDays(new Date(), i);
      const pl = P.dayPlan(S, d); if (!pl) continue;
      const ds = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
      const desc = [`${pl.tpl.sub} · Hafta ${pl.week + 1} (${pl.phase.n})`, "", "Isınma: " + pl.warm.map((w) => w.ex.n).join(", "), "", ...pl.items.map((it) => `• ${it.ex.n} — ${targetText(it)}`), "", `Kardiyo: ${pl.cardio.ex.n} ${pl.cardio.min} dk (${pl.cardio.intensity})`, "Soğuma: " + pl.cool.map((w) => w.ex.n).join(", ")].join("\n");
      L.push("BEGIN:VEVENT", `UID:adim-${ds}-gym@adim`, `DTSTAMP:${stamp}`, `DTSTART:${ds}T${pad(gh)}${pad(gm)}00`, `DURATION:PT${pl.minutes}M`,
        fold(`SUMMARY:${escI(`💪 ${pl.tpl.n} · ${pl.tpl.sub}`)}`), fold(`DESCRIPTION:${escI(desc)}`),
        "BEGIN:VALARM", "ACTION:DISPLAY", fold(`DESCRIPTION:${escI(`Bugün spor günü: ${pl.tpl.sub}`)}`), `TRIGGER:-PT${morningBefore}M`, "END:VALARM",
        "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Spor saati yaklaşıyor!", "TRIGGER:-PT30M", "END:VALARM", "END:VEVENT");
      L.push("BEGIN:VEVENT", `UID:adim-${ds}-check@adim`, `DTSTAMP:${stamp}`, `DTSTART:${ds}T${pad(ch)}${pad(cm)}00`, "DURATION:PT10M",
        fold(`SUMMARY:${escI("✅ Spora gittin mi? ADIM'da işaretle")}`), "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Spora gittin mi?", "TRIGGER:PT0M", "END:VALARM", "END:VEVENT");
    }
    L.push("END:VCALENDAR");
    return L.join("\r\n");
  }
  function scriptableText() {
    const base = location.href.split("#")[0].split("?")[0];
    const data = notifEntries(16).map((n) => [n.k, n.h, n.m, n.title, n.body]);
    const nx = [];
    for (let i = 0; i < 16 * 7; i++) { const d = P.addDays(new Date(), i); const pl = P.dayPlan(S, d); if (pl) nx.push([P.keyOf(d), pl.tpl.n, pl.tpl.sub, pl.minutes, pl.cardio.min]); }
    return `// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: red; icon-glyph: dumbbell;

// ADIM — spor hatırlatmaları ve ana ekran widget'ı
// ADIM uygulamasında Profil → Bildirimler'den üretildi (${todayKey()}).
// Programın değişince (gün/saat/seviye) uygulamadan yeniden üretip bu betiğin yerine yapıştır.
const APP_URL = ${JSON.stringify(base)};
const DATA = ${JSON.stringify(data)};
const NEXT = ${JSON.stringify(nx)};

const pad = (n) => String(n).padStart(2, "0");
const keyOf = (d) => d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
const now = new Date();

// iOS en fazla 64 bekleyen bildirim tutar: en yakın 55'i kur
async function schedule() {
  const pending = await Notification.allPending();
  const old = pending.filter((n) => (n.identifier || "").startsWith("adim-")).map((n) => n.identifier);
  if (old.length) await Notification.removePending(old);
  let c = 0;
  for (const [k, h, m, title, body] of DATA) {
    const [y, mo, d] = k.split("-").map(Number);
    const at = new Date(y, mo - 1, d, h, m);
    if (at <= now) continue;
    if (c >= 55) break;
    const n = new Notification();
    n.identifier = "adim-" + k + "-" + pad(h) + pad(m);
    n.threadIdentifier = "adim";
    n.title = title; n.body = body; n.sound = "default";
    n.openURL = APP_URL;
    n.setTriggerDate(at);
    await n.schedule();
    c++;
  }
  return c;
}

function widget() {
  const w = new ListWidget();
  const g = new LinearGradient();
  g.colors = [new Color("#1a0606"), new Color("#7a0f12"), new Color("#ff5a1f")];
  g.locations = [0, 0.65, 1];
  g.startPoint = new Point(0, 0); g.endPoint = new Point(1, 1);
  w.backgroundGradient = g;
  w.url = APP_URL;
  const tk = keyOf(now);
  const next = NEXT.find((x) => x[0] >= tk);
  const head = w.addText("ADIM");
  head.font = Font.heavySystemFont(12); head.textColor = new Color("#ffb070");
  w.addSpacer(6);
  if (!next) { const t = w.addText("Programı yenile"); t.font = Font.boldSystemFont(16); t.textColor = Color.white(); return w; }
  const [k, name, sub, min, cardio] = next;
  const [y, mo, d] = k.split("-").map(Number);
  const nd = new Date(y, mo - 1, d);
  const diff = Math.round((nd - new Date(now.getFullYear(), now.getMonth(), now.getDate())) / 864e5);
  const when = diff === 0 ? "BUGÜN" : diff === 1 ? "YARIN" : ["PAZAR", "PAZARTESİ", "SALI", "ÇARŞAMBA", "PERŞEMBE", "CUMA", "CUMARTESİ"][nd.getDay()];
  const a = w.addText(when); a.font = Font.heavySystemFont(11); a.textColor = new Color("#ffffff", 0.75);
  const t = w.addText(name.toUpperCase()); t.font = Font.heavySystemFont(20); t.textColor = Color.white(); t.minimumScaleFactor = 0.6;
  const s = w.addText(sub); s.font = Font.mediumSystemFont(12); s.textColor = new Color("#ffd2b8"); s.lineLimit = 2;
  w.addSpacer();
  const f = w.addText("~" + min + " dk · " + cardio + " dk kardiyo"); f.font = Font.semiboldSystemFont(11); f.textColor = new Color("#ffffff", 0.85);
  return w;
}

const count = await schedule();
if (config.runsInWidget) {
  Script.setWidget(widget());
} else {
  const a = new Alert();
  a.title = "ADIM hatırlatmaları kuruldu ✓";
  a.message = count + " bildirim zamanlandı. Ana ekrana bu betikle bir Scriptable widget'ı eklersen hem sıradaki antrenmanı görürsün hem de hatırlatmalar kendiliğinden yenilenir.";
  a.addAction("Tamam");
  await a.present();
  await widget().presentSmall();
}
Script.complete();
`;
  }
  function openNotify() {
    const p = S.profile;
    openSheet(`<h2 class="title">Hatırlatmalar</h2>
      <p class="muted small" style="margin-bottom:14px">iPhone, ana ekrana eklenen web uygulamalarının kendi başına saatli bildirim kurmasına izin vermiyor. Bu yüzden iki kolay yol var — ikisi de gerçek iPhone bildirimi gösterir.</p>
      <div class="grid3"><div class="field"><label>Sabah planı</label><input class="input" id="nt-m" type="time" value="${p.morningTime}"></div>
        <div class="field"><label>Spor saati</label><input class="input" id="nt-g" type="time" value="${p.gymTime}"></div>
        <div class="field"><label>“Gittin mi?”</label><input class="input" id="nt-c" type="time" value="${p.checkTime}"></div></div>
      <div class="card"><div class="row"><span style="font-size:30px">📅</span><div class="grow"><b>1 · Takvime ekle (en kolay)</b><p class="tiny muted">Önümüzdeki 12 haftanın antrenmanları, içindeki hareket listesiyle birlikte Takvim'e eklenir. Sabah ve spordan 30 dk önce uyarı, akşam “Spora gittin mi?” hatırlatması gelir.</p></div></div>
        <button class="btn primary block" style="margin-top:12px;font-size:17px" data-act="ics">Takvime ekle</button>
        <p class="tiny muted" style="margin-top:8px">Açılan ekranda <b>“Tümünü Ekle”</b>ye dokun. Ana ekran uygulamasında açılmazsa bu sayfayı Safari'de açıp tekrar dene.</p></div>
      <div class="card"><div class="row"><span style="font-size:30px">📲</span><div class="grow"><b>2 · Scriptable (bildirim + widget)</b><p class="tiny muted">Ücretsiz <b>Scriptable</b> uygulamasıyla: sabah planı, spor saati, “Spora gittin mi?” ve Pazartesi tartı bildirimleri + ana ekranda sıradaki antrenmanı gösteren widget.</p></div></div>
        <div class="btnrow" style="margin-top:12px"><button class="btn sm" data-act="copy">Betiği kopyala</button><button class="btn sm" data-act="dl">Dosya olarak al</button></div>
        <ol class="steps" style="margin-top:12px;font-size:13px"><li>App Store'dan Scriptable'ı indir.</li><li>Scriptable → + → kopyaladığın betiği yapıştır, adını “ADIM” yap.</li><li>Bir kez çalıştır ve bildirim iznini ver.</li><li>Ana ekrana küçük Scriptable widget'ı ekle → Script: ADIM. Widget yenilendikçe bildirimler de yenilenir.</li></ol></div>`,
    (body) => {
      const saveTimes = () => { p.morningTime = $("#nt-m", body).value || p.morningTime; p.gymTime = $("#nt-g", body).value || p.gymTime; p.checkTime = $("#nt-c", body).value || p.checkTime; save(); };
      body.addEventListener("click", async (ev) => {
        const a = ev.target.closest("[data-act]"); if (!a) return;
        saveTimes();
        if (a.dataset.act === "ics") download("ADIM-spor-takvimi.ics", icsText(), "text/calendar");
        if (a.dataset.act === "dl") download("ADIM.js", scriptableText(), "text/javascript");
        if (a.dataset.act === "copy") {
          try { await navigator.clipboard.writeText(scriptableText()); toast("Betik kopyalandı — Scriptable'a yapıştır", "📋"); }
          catch (e) { download("ADIM.js", scriptableText(), "text/javascript"); }
        }
      });
    });
  }

  /* ================= ANTRENMAN MODU ================= */
  function startWorkout(dateKey, logAs, tplOverride) {
    if (S.session && !confirm("Yarım kalan bir antrenman var. Onu silip yenisine başlansın mı?")) return player.resume();
    const d = P.parseKey(dateKey);
    const plan = tplOverride ? P.planFor(S, tplOverride, d) : P.dayPlan(S, d);
    if (!plan) return;
    const k = logAs || dateKey;
    if (S.logs[k] && S.logs[k].status === "done" && !confirm("Bu gün için zaten bir antrenman kaydı var. Yenisi onun yerine geçsin mi?")) return;
    S.session = {
      date: k, planDate: dateKey, tplId: plan.tplId, week: plan.week, phase: plan.phase.n, startedAt: Date.now(), idx: 0, total: 0,
      warm: plan.warm.map((w) => [w.ex.id, w.sec]), cool: plan.cool.map((w) => [w.ex.id, w.sec]),
      items: plan.items.map((it) => ({ key: it.key, id: it.ex.id, sets: it.sets, target: it.target, rest: it.rest, role: it.role, done: [] })),
      cardio: { id: plan.cardio.ex.id, min: plan.cardio.min, blocks: plan.cardio.blocks, intensity: plan.cardio.intensity, hr: plan.cardio.hr, sec: 0 },
      feel: 3, note: "",
    };
    save();
    closeAllSheets();
    player.open_();
  }

  const player = {
    open: false, el: null, timer: null, tick: 0, anim: null, steps: [],
    build() {
      const s = S.session, st = [];
      s.warm.forEach(([id, sec], i) => st.push({ t: "warm", id, sec, i }));
      s.items.forEach((it, ii) => {
        for (let k = 0; k < it.sets; k++) {
          st.push({ t: "set", ii, k });
          const last = k === it.sets - 1, lastItem = ii === s.items.length - 1;
          if (!(last && lastItem)) st.push({ t: "rest", ii, k, sec: Math.max(20, (last ? Math.max(60, it.rest - 15) : it.rest) + (S.settings.restAdd || 0)) });
        }
      });
      st.push({ t: "cardio" });
      s.cool.forEach(([id, sec], i) => st.push({ t: "cool", id, sec, i }));
      st.push({ t: "end" });
      this.steps = st; s.total = st.length - 1;
    },
    open_() {
      this.build();
      if (!this.el) { this.el = document.createElement("div"); this.el.className = "player"; document.body.appendChild(this.el); }
      this.open = true; keepAwake(true);
      requestAnimationFrame(() => requestAnimationFrame(() => this.el.classList.add("open")));
      this.show();
      clearInterval(this.timer); this.timer = setInterval(() => this.onTick(), 250);
    },
    resume() { if (S.session) this.open_(); },
    close(saveIt) {
      clearInterval(this.timer); if (this.anim) this.anim.stop(); this.anim = null;
      this.open = false; keepAwake(false);
      if (this.el) { this.el.classList.remove("open"); const el = this.el; this.el = null; setTimeout(() => el.remove(), 380); }
      try { speechSynthesis.cancel(); } catch (e) {}
      if (saveIt === false) { S.session = null; save(); }
      rerender();
    },
    get step() { return this.steps[S.session.idx]; },
    // —— zamanlayıcı (zaman damgasıyla: ekran kilitlense de doğru sayar) ——
    T: null,
    startTimer(kind, dur, autostart = true) { this.T = { kind, dur, acc: 0, start: autostart ? Date.now() : null, beeped: {} }; },
    elapsed() { const T = this.T; if (!T) return 0; return T.acc + (T.start ? (Date.now() - T.start) / 1000 : 0); },
    toggleTimer() { const T = this.T; if (!T) return; if (T.start) { T.acc += (Date.now() - T.start) / 1000; T.start = null; } else T.start = Date.now(); this.updateCtl(); },
    running() { return this.T && this.T.start != null; },
    go(i) {
      const s = S.session;
      s.idx = Math.max(0, Math.min(this.steps.length - 1, i)); save();
      this.show();
    },
    next() { this.go(S.session.idx + 1); },
    prev() { let i = S.session.idx - 1; while (i > 0 && this.steps[i].t === "rest") i--; this.go(i); },
    show() {
      const s = S.session, st = this.step;
      if (this.anim) { this.anim.stop(); this.anim = null; }
      this.T = null;
      const pct = (s.idx / (this.steps.length - 1)) * 100;
      let label = "", body = "", foot = "";
      const exOf = (id) => BY[id];
      const sectionName = { warm: "Isınma", set: "Ağırlık", rest: "Dinlenme", cardio: "Kardiyo", cool: "Soğuma", end: "Bitti" }[st.t];
      if (st.t === "warm" || st.t === "cool") {
        const e = exOf(st.id);
        const list = st.t === "warm" ? s.warm : s.cool;
        label = `${sectionName} · ${st.i + 1}/${list.length}`;
        body = `<h2 class="pname">${esc(e.n)}</h2><p class="small muted">${esc(e.steps[0])}${e.steps[1] ? " " + esc(e.steps[1]) : ""}</p>
          <div class="pstage" id="pst"></div>
          ${ringHtml("Süre")}`;
        foot = `<button class="btn" data-p="prev">${ICON.left}</button><button class="btn primary" data-p="toggle" id="tbtn" style="flex:2">${ICON.play} Başla</button><button class="btn" data-p="next">Atla ${ICON.right}</button>`;
      } else if (st.t === "set") {
        const it = s.items[st.ii], e = exOf(it.id);
        const timeKind = e.kind === "time";
        const sug = P.suggestion(S, e.id, it.target) || {};
        const prevDone = it.done[st.k] || it.done[st.k - 1];
        const kg0 = prevDone && prevDone.kg != null ? prevDone.kg : sug.kg != null ? sug.kg : null;
        const r0 = prevDone && prevDone.r != null ? prevDone.r : parseInt(String(it.target.reps || "10"), 10) || 10;
        this.cur = { kg: kg0, r: r0 };
        label = `Hareket ${st.ii + 1} / ${s.items.length}`;
        body = `<h2 class="pname">${esc(e.n)}</h2>
          <div class="setdots">${Array.from({ length: it.sets }, (_, i) => `<i class="${i < st.k || it.done[i] ? "done" : i === st.k ? "cur" : ""}"></i>`).join("")}</div>
          <div class="row" style="justify-content:space-between"><div class="target"><span class="up muted">Set ${st.k + 1}/${it.sets}</span></div><span class="chip">${diffBars(e.d)} ${diffLbl[e.d]}</span></div>
          <div class="target"><span class="num grad-text">${timeKind ? it.target.sec : esc(String(it.target.reps).replace(" /taraf", "").replace("/taraf", ""))}</span><span class="muted" style="font-weight:700">${timeKind ? "saniye" : "tekrar"}${e.perSide ? " · her taraf" : ""}</span></div>
          <div class="pstage" id="pst"><button class="iconbtn info" data-p="info" aria-label="Bilgi">${ICON.info}</button></div>
          ${timeKind ? ringHtml("Kalan") : `<div class="watch">⏱ Set süresi <span class="num" id="tnum">0:00</span></div>
          <div class="steppers">
            ${isWeighted(e) ? `<div class="stepper"><span class="up">Ağırlık (kg)</span><div class="ctl"><button data-kg="-1">−</button><span class="v" id="vkg">${kg0 != null ? fmt1(kg0) : "—"}</span><button data-kg="1">+</button></div><span class="hint">${sug.up ? `↑ +${fmt1(sug.step)} kg dene` : sug.kg != null ? "Geçen sefer: " + fmt1(sug.kg) + " kg" : "Hafif başla"}</span></div>` : `<div class="stepper"><span class="up">Ağırlık</span><div class="ctl" style="justify-content:center;height:40px"><span class="small" style="font-weight:700">${e.eq.includes("band") ? "Lastik" : "Vücut ağırlığı"}</span></div><span class="hint"></span></div>`}
            <div class="stepper"><span class="up">Yaptığın tekrar</span><div class="ctl"><button data-r="-1">−</button><span class="v" id="vr">${r0}</span><button data-r="1">+</button></div><span class="hint">Hedef ${esc(it.target.reps)}</span></div>
          </div>`}
          <p class="tiny muted" style="margin-top:4px">🫁 ${esc(e.breath || "")} ${e.tips[0] ? "· " + esc(e.tips[0]) : ""}</p>`;
        foot = timeKind
          ? `<button class="btn" data-p="swap">${ICON.swap}</button><button class="btn primary" data-p="toggle" id="tbtn" style="flex:2">${ICON.play} Başla</button><button class="btn" data-p="skipex">Atla</button>`
          : `<button class="btn" data-p="swap" aria-label="Değiştir">${ICON.swap}</button><button class="btn primary" data-p="setdone" style="flex:2.4">${ICON.check} Seti bitir</button><button class="btn" data-p="skipex">Atla</button>`;
      } else if (st.t === "rest") {
        const nextStep = this.steps[s.idx + 1];
        let nextHtml = "", nextName = "";
        if (nextStep && nextStep.t === "set") { const it = s.items[nextStep.ii], e = exOf(it.id); nextName = `${e.n}, set ${nextStep.k + 1}`; nextHtml = `<div class="nextup">${`<div class="thumb">${window.Figure.still(e.anim, e, 1, true)}</div>`}<div class="grow"><div class="up muted">Sıradaki</div><b>${esc(e.n)}</b><div class="small muted">Set ${nextStep.k + 1}/${it.sets} · ${it.target.sec ? it.target.sec + " sn" : esc(it.target.reps) + " tekrar"}</div></div></div>`; }
        else if (nextStep && nextStep.t === "cardio") { const e = exOf(s.cardio.id); nextName = "kardiyo, " + e.n; nextHtml = `<div class="nextup"><div class="thumb">${window.Figure.still(e.anim, e, 1, true)}</div><div class="grow"><div class="up muted">Sıradaki</div><b>Kardiyo · ${esc(e.n)}</b><div class="small muted">${s.cardio.min} dk</div></div></div>`; }
        this.nextName = nextName;
        label = "Dinlenme";
        body = `<h2 class="pname" style="text-align:center;margin-top:8px">Nefeslen</h2><p class="small muted" style="text-align:center">Su iç, omuzlarını gevşet. Süre bitince sesli uyarı gelir.</p>
          ${ringHtml("Dinlenme", "rest")}
          <div class="btnrow"><button class="btn sm" data-p="rest-15">−15 sn</button><button class="btn sm" data-p="rest+15">+15 sn</button></div>${nextHtml}`;
        foot = `<button class="btn" data-p="prev">${ICON.left}</button><button class="btn primary" data-p="next" style="flex:2">Hazırım ${ICON.right}</button>`;
      } else if (st.t === "cardio") {
        const c = s.cardio, e = exOf(c.id);
        label = `Kardiyo · ${c.intensity}`;
        body = `<h2 class="pname">${esc(e.n)}</h2><p class="small muted">${c.min} dk · nabız ${c.hr[0]}–${c.hr[1]} · ${esc(e.steps[0])}</p>
          <div class="pstage short" id="pst"><button class="iconbtn info" data-p="info" aria-label="Bilgi">${ICON.info}</button></div>
          ${ringHtml("Kalan")}
          <div class="blocks" id="blocks">${c.blocks.map((b, i) => `<div class="block ${b.hard ? "hard" : ""}" data-b="${i}"><span>${esc(b.label)}</span><b>${mmss(b.sec)}</b></div>`).join("")}</div>`;
        foot = `<button class="btn" data-p="swapcardio" aria-label="Değiştir">${ICON.swap}</button><button class="btn primary" data-p="toggle" id="tbtn" style="flex:2">${ICON.play} Başla</button><button class="btn" data-p="cardiodone">Bitir</button>`;
      } else if (st.t === "end") {
        const sum = this.summary();
        label = "Tebrikler";
        body = `<div style="text-align:center;margin-top:10px"><div style="font-size:56px">🏆</div><h2 class="pname">Antrenman bitti!</h2><p class="muted">Bugün kendin için harika bir şey yaptın.</p></div>
          <div class="summary"><div class="tile"><div class="up">Süre</div><div class="num">${Math.round(sum.dur / 60)} dk</div></div><div class="tile"><div class="up">Set</div><div class="num">${sum.sets}</div></div>
          <div class="tile"><div class="up">Kardiyo</div><div class="num">${sum.cardioMin} dk</div></div><div class="tile"><div class="up">Kalori (tahmini)</div><div class="num">${sum.kcal}</div></div></div>
          ${sum.vol ? `<p class="small muted" style="text-align:center">Toplam kaldırdığın: <b style="color:var(--ink)">${sum.vol.toLocaleString("tr-TR")} kg</b></p>` : ""}
          <div class="sec" style="margin-top:16px"><h2>Nasıl geçti?</h2></div>
          <div class="feel">${[["😌", "Çok kolay"], ["🙂", "Kolay"], ["💪", "İyi"], ["😤", "Zor"], ["🥵", "Çok zor"]].map(([ic, n], i) => `<button class="${s.feel === i + 1 ? "on" : ""}" data-feel="${i + 1}"><span>${ic}</span>${n}</button>`).join("")}</div>
          <div class="field"><label>Not (isteğe bağlı)</label><input class="input" id="pnote" placeholder="Örn. dizimde hafif ağrı vardı" value="${esc(s.note)}"></div>`;
        foot = `<button class="btn primary block" data-p="finish">${ICON.check} Kaydet ve bitir</button>`;
      }
      const elapsed = Math.floor((Date.now() - s.startedAt) / 1000);
      this.el.innerHTML = `<div class="ptop"><button class="iconbtn" data-p="exit" aria-label="Kapat">${ICON.x}</button><div class="grow"><div class="phase-lbl">${label}</div><div class="num" id="ptot">${mmss(elapsed)}</div></div><span class="iconbtn" style="font-size:12px;font-weight:800">${s.idx}/${this.steps.length - 1}</span></div>
        <div class="pbar"><i style="width:${pct}%"></i></div><div class="pbody">${body}</div><div class="pfoot">${foot}</div>`;
      this.el.onclick = (ev) => this.onClick(ev);
      const pst = $("#pst", this.el);
      if (pst) {
        const id = st.t === "set" ? s.items[st.ii].id : st.t === "cardio" ? s.cardio.id : st.id;
        const info = $(".info", pst);
        this.anim = window.Figure.animate(pst, BY[id].anim, BY[id]);
        if (info) pst.appendChild(info);
      }
      // zamanlayıcıyı başlat
      if (st.t === "warm" || st.t === "cool") this.startTimer("down", st.sec, false);
      else if (st.t === "set") { const e = BY[s.items[st.ii].id]; if (e.kind === "time") this.startTimer("down", s.items[st.ii].target.sec, false); else this.startTimer("up", 0, true); }
      else if (st.t === "rest") { this.startTimer("down", st.sec, true); }
      else if (st.t === "cardio") { this.startTimer("down", s.cardio.min * 60, false); this.T.acc = s.cardio.sec || 0; }
      this.onTick();
      this.updateCtl();
    },
    updateCtl() {
      const b = $("#tbtn", this.el); if (!b || !this.T) return;
      b.innerHTML = this.running() ? `${ICON.pause} Duraklat` : this.elapsed() > 0 ? `${ICON.play} Devam` : `${ICON.play} Başla`;
    },
    onTick() {
      if (!this.open || !S.session || !this.el) return;
      const s = S.session, st = this.step;
      const tot = $("#ptot", this.el); if (tot) tot.textContent = mmss((Date.now() - s.startedAt) / 1000);
      if (!this.T) return;
      const el = this.elapsed();
      if (this.T.kind === "up") { const n = $("#tnum", this.el); if (n) n.textContent = mmss(el); return; }
      const rem = Math.max(0, this.T.dur - el);
      const n = $("#tnum", this.el); if (n) n.textContent = mmss(Math.ceil(rem));
      const ring = $("#rprog", this.el); if (ring) ring.style.strokeDashoffset = String(CIRC * (1 - rem / this.T.dur));
      if (st.t === "cardio") {
        s.cardio.sec = el;
        let acc = 0;
        s.cardio.blocks.forEach((b, i) => {
          const be = $(`[data-b="${i}"]`, this.el); if (!be) return;
          const cur = el >= acc && el < acc + b.sec;
          be.classList.toggle("cur", cur); be.classList.toggle("past", el >= acc + b.sec);
          if (cur && this.T.start && !this.T.beeped["b" + i] && i > 0) { this.T.beeped["b" + i] = 1; beep(660, 0.2); buzz(200); speak(b.label + ". " + (b.cue || "")); }
          acc += b.sec;
        });
        if ((this.tick = (this.tick + 1) % 20) === 0) save();
      }
      // yarı süre (tek taraflı esneme)
      if ((st.t === "cool" || st.t === "warm") && this.T.start && BY[st.id].perSide && el >= this.T.dur / 2 && !this.T.beeped.half) { this.T.beeped.half = 1; beep(740, 0.18); speak("Taraf değiştir"); }
      if (this.T.start) {
        const sec = Math.ceil(rem);
        if (sec <= 3 && sec > 0 && !this.T.beeped[sec]) { this.T.beeped[sec] = 1; beep(880, 0.1); }
      }
      if (rem <= 0 && this.T.start) {
        this.T.acc = this.T.dur; this.T.start = null;
        beep(1175, 0.35, 0.3); buzz([200, 80, 200]);
        this.timerDone();
      }
    },
    timerDone() {
      const s = S.session, st = this.step;
      if (st.t === "rest") { speak("Dinlenme bitti." + (this.nextName ? " Sıradaki: " + this.nextName : "")); this.next(); }
      else if (st.t === "warm" || st.t === "cool") { this.next(); }
      else if (st.t === "set") { const it = s.items[st.ii]; it.done[st.k] = { sec: it.target.sec }; save(); speak("Süre doldu. Güzel!"); this.next(); }
      else if (st.t === "cardio") { s.cardio.sec = s.cardio.min * 60; save(); speak("Kardiyo bitti. Harika!"); this.next(); }
    },
    summary() {
      const s = S.session;
      let sets = 0, vol = 0;
      s.items.forEach((it) => it.done.forEach((d) => { if (!d) return; sets++; if (d.kg && d.r) vol += d.kg * d.r; }));
      const dur = Math.round((Date.now() - s.startedAt) / 1000);
      const cardioMin = Math.round((s.cardio.sec || 0) / 60);
      const kcal = P.kcal(currentWeight(), Math.max(0, dur / 60 - cardioMin), cardioMin, BY[s.cardio.id].met);
      return { sets, vol: Math.round(vol), dur, cardioMin, kcal };
    },
    finish() {
      const s = S.session, sum = this.summary();
      const tpl = P.TEMPLATES[s.tplId];
      const newPR = [];
      const items = s.items.map((it) => ({ id: it.id, sets: it.done.filter(Boolean) }));
      items.forEach((it) => {
        if (!it.sets.length) return;
        const h = (S.history[it.id] = S.history[it.id] || []);
        const kgs = it.sets.map((x) => x.kg).filter((x) => x != null);
        h.push({ date: s.date, kg: kgs.length ? Math.max(...kgs) : null, sets: it.sets, feel: s.feel });
        if (h.length > 30) h.splice(0, h.length - 30);
        it.sets.forEach((x) => {
          if (x.kg == null || !x.r) return;
          const pr = S.pr[it.id];
          if (!pr || x.kg > pr.kg || (x.kg === pr.kg && x.r > pr.r)) { S.pr[it.id] = { kg: x.kg, r: x.r, date: s.date }; if (pr) newPR.push(it.id); }
        });
      });
      S.logs[s.date] = { status: "done", tpl: s.tplId, tplName: tpl.n, week: s.week, dur: sum.dur, sets: sum.sets, vol: sum.vol, cardioMin: sum.cardioMin, kcal: sum.kcal, feel: s.feel, note: s.note, items };
      S.session = null; save();
      this.close();
      tab = "home"; renderApp(); $("#screen").scrollTop = 0;
      toast(newPR.length ? `Kaydedildi! ${newPR.length} yeni rekor 📈` : "Antrenman kaydedildi. Aferin! 💪", "🏆");
      checkBadges();
    },
    onClick(ev) {
      const s = S.session; if (!s) return;
      const st = this.step;
      const b = ev.target.closest("[data-p],[data-kg],[data-r],[data-feel]");
      if (!b) return;
      if (b.dataset.kg) {
        const e = BY[s.items[st.ii].id], stp = kgStep(e);
        this.cur.kg = Math.max(0, Math.round(((this.cur.kg == null ? (e.eq.includes("dumbbell") ? 4 : 10) - +b.dataset.kg * stp : this.cur.kg) + +b.dataset.kg * stp) * 2) / 2);
        $("#vkg", this.el).textContent = fmt1(this.cur.kg); return;
      }
      if (b.dataset.r) { this.cur.r = Math.max(0, this.cur.r + +b.dataset.r); $("#vr", this.el).textContent = this.cur.r; return; }
      if (b.dataset.feel) { s.feel = +b.dataset.feel; save(); $$("[data-feel]", this.el).forEach((x) => x.classList.toggle("on", x === b)); return; }
      switch (b.dataset.p) {
        case "exit": this.exitMenu(); break;
        case "toggle": this.toggleTimer(); if (this.running() && this.elapsed() < 0.5) beep(660, 0.08); break;
        case "next": this.next(); break;
        case "prev": this.prev(); break;
        case "rest-15": this.T.dur = Math.max(5, this.T.dur - 15); this.onTick(); break;
        case "rest+15": this.T.dur += 15; this.T.beeped = {}; this.onTick(); break;
        case "setdone": {
          const it = s.items[st.ii];
          it.done[st.k] = { r: this.cur.r, kg: isWeighted(BY[it.id]) ? this.cur.kg : null, t: Math.round(this.elapsed()) };
          save(); beep(990, 0.08); buzz(60);
          this.next(); break;
        }
        case "skipex": {
          // bu hareketin kalan setlerini atla
          let i = s.idx + 1;
          while (i < this.steps.length && (this.steps[i].ii === st.ii && (this.steps[i].t === "set" || this.steps[i].t === "rest"))) i++;
          this.go(i); break;
        }
        case "swap": {
          const it = s.items[st.ii];
          this.anim && this.anim.pause();
          openSwap(it.id, it.key, (newId) => {
            if (newId) { it.id = newId; it.done = it.done.filter(Boolean).length ? it.done : []; save(); }
            else if (newId === null) { const fresh = P.planFor(S, s.tplId, P.parseKey(s.planDate)); const f = fresh.items.find((x) => x.key === it.key); if (f) it.id = f.ex.id; save(); }
            this.show();
          }, {});
          break;
        }
        case "swapcardio": {
          openSwap(s.cardio.id, `${s.tplId}:cardio`, (newId) => { if (newId) s.cardio.id = newId; else { const f = P.planFor(S, s.tplId, P.parseKey(s.planDate)); s.cardio.id = f.cardio.ex.id; } save(); this.show(); });
          break;
        }
        case "info": { const id = st.t === "set" ? s.items[st.ii].id : st.t === "cardio" ? s.cardio.id : st.id; openExercise(id); break; }
        case "cardiodone": s.cardio.sec = this.elapsed(); save(); this.next(); break;
        case "finish": s.note = ($("#pnote", this.el) || {}).value || ""; this.finish(); break;
      }
    },
    exitMenu() {
      openSheet(`<h2 class="title">Antrenmandan çık</h2><p class="muted small" style="margin-bottom:14px">İlerlemen kaydedildi; istediğin zaman kaldığın yerden devam edebilirsin.</p>
        <button class="btn block" data-x="later" style="margin-bottom:8px">Sonra devam et</button>
        <button class="btn block" data-x="finish" style="margin-bottom:8px">Şimdi bitir ve kaydet</button>
        <button class="btn block danger" data-x="drop">Kaydetmeden çık</button>`, (body, close) => body.addEventListener("click", (ev) => {
        const x = ev.target.closest("[data-x]"); if (!x) return;
        close();
        if (x.dataset.x === "later") { save(); this.close(); }
        if (x.dataset.x === "finish") { this.go(this.steps.length - 1); }
        if (x.dataset.x === "drop" && confirm("Bu antrenman kaydedilmeden silinsin mi?")) this.close(false);
      }));
    },
  };
  const CIRC = 2 * Math.PI * 54;
  function ringHtml(lbl, cls = "") {
    return `<div class="ring ${cls}"><svg viewBox="0 0 120 120"><defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff2d2d"/><stop offset="1" stop-color="#ff8a1f"/></linearGradient></defs>
      <circle cx="60" cy="60" r="54" fill="none" stroke="var(--surface3)" stroke-width="8"/>
      <circle id="rprog" cx="60" cy="60" r="54" fill="none" stroke="url(#rg)" stroke-width="8" stroke-linecap="round" stroke-dasharray="${CIRC}" stroke-dashoffset="${CIRC}"/></svg>
      <div class="c"><span class="up">${lbl}</span><span class="num" id="tnum">0:00</span></div></div>`;
  }

  /* ================= KARŞILAMA ================= */
  function startOnboarding() {
    const p = S.profile;
    let step = 0;
    const el = document.createElement("div"); el.className = "onb"; document.body.appendChild(el);
    let anim = null;
    const steps = [
      () => `<div class="splash-fig" id="obfig"></div><h1>Adım adım<br><span class="grad-text">güçlen.</span></h1>
        <p class="lead">Sana özel, haftada 4 gün, yavaş yavaş zorlaşan bir program. Her hareketi canlı animasyonla, çalışan kaslarıyla ve süre tutarak yapacaksın.</p>
        <div class="field"><label>Adın</label><input class="input" id="obn" value="${esc(p.name)}" placeholder="Sana nasıl hitap edelim?"></div>`,
      () => `<h1>Seni<br><span class="grad-text">tanıyalım</span></h1><p class="lead">Kardiyo nabzını, kalori tahminini ve ilerlemeni buna göre hesaplıyoruz.</p>
        <div class="grid2"><div class="field"><label>Yaş</label><input class="input" id="oba" type="number" inputmode="numeric" value="${p.age}"></div><div class="field"><label>Boy (cm)</label><input class="input" id="obh" type="number" inputmode="numeric" value="${p.height}"></div></div>
        <div class="grid2"><div class="field"><label>Kilo (kg)</label><input class="input" id="obw" type="number" inputmode="decimal" value="${p.weight}"></div><div class="field"><label>Hedef kilo</label><input class="input" id="obg" type="number" inputmode="decimal" value="${p.goal}"></div></div>
        <button class="toggle ${p.kneeCare ? "on" : ""}" data-tog="kneeCare"><div class="grow"><b>Dizlerimi koru</b><div class="tiny muted">Önerilir: dizlere yük bindiren hareketler elenir</div></div><span class="sw"></span></button>
        <button class="toggle ${p.backCare ? "on" : ""}" data-tog="backCare"><div class="grow"><b>Belimi koru</b><div class="tiny muted">Bel ağrın varsa aç</div></div><span class="sw"></span></button>`,
      () => `<h1>Spor<br><span class="grad-text">günlerin</span></h1><p class="lead">Varsayılan: Salı, Perşembe, Cuma ve Pazar. Her gün farklı bir bölge çalışır.</p>
        <div class="daypick">${[1, 2, 3, 4, 5, 6, 0].map((d) => `<button class="${p.days.includes(d) ? "on" : ""}" data-dow="${d}">${P.DAY_SHORT[d]}</button>`).join("")}</div>
        <div class="list" style="margin-top:14px">${Object.entries(P.dayTemplateMap(p.days)).sort((a, b) => ((+a[0] + 6) % 7) - ((+b[0] + 6) % 7)).map(([d, t]) => `<div class="item"><div class="grow"><h4>${P.DAY_NAMES[d]} · ${esc(P.TEMPLATES[t].n)}</h4><div class="meta">${esc(P.TEMPLATES[t].sub)}</div></div></div>`).join("")}</div>
        <div class="field" style="margin-top:14px"><label>Genelde spora gittiğin saat</label><input class="input" id="obt" type="time" value="${p.gymTime}"></div>`,
      () => `<h1>Salonunda<br><span class="grad-text">ne var?</span></h1><p class="lead">Olmayanların işaretini kaldır. Program o aletle yapılan hareket yerine aynı işi yapan başka bir hareket koyar. Sonradan da değiştirebilirsin.</p>
        <div class="eqgrid">${EQUIPMENT.map((e) => `<button class="eq ${S.eq[e.id] !== false ? "on" : ""}" data-eq="${e.id}"><span class="ck">${S.eq[e.id] !== false ? "✓" : ""}</span><span>${e.ico} ${esc(e.n)}</span></button>`).join("")}</div>`,
      () => `<h1>Güvenli<br><span class="grad-text">başlangıç</span></h1>
        <div class="list" style="margin:16px 0">
          <div class="item"><span style="font-size:26px">🩺</span><div class="grow"><h4>Doktor kontrolü</h4><div class="meta">Tansiyon, kalp, şeker ya da eklem sorunun varsa önce doktoruna danış.</div></div></div>
          <div class="item"><span style="font-size:26px">🐢</span><div class="grow"><h4>Hafif başla</h4><div class="meta">İlk 2 hafta sadece alışma. Ağırlık değil, doğru hareket önemli.</div></div></div>
          <div class="item"><span style="font-size:26px">🛑</span><div class="grow"><h4>Ağrıda dur</h4><div class="meta">Göğüs ağrısı, baş dönmesi ya da keskin eklem ağrısında hemen bırak.</div></div></div>
          <div class="item"><span style="font-size:26px">📲</span><div class="grow"><h4>Ana ekrana ekle</h4><div class="meta">Safari'de Paylaş → “Ana Ekrana Ekle” ile tam ekran uygulama gibi açılır, internetsiz de çalışır.</div></div></div>
        </div>`,
    ];
    const render = () => {
      if (anim) { anim.stop(); anim = null; }
      el.innerHTML = `<div class="ob-body"><div class="dots">${steps.map((_, i) => `<i class="${i <= step ? "on" : ""}"></i>`).join("")}</div>${steps[step]()}</div>
        <div class="ob-foot"><div class="btnrow">${step ? `<button class="btn" data-ob="back" style="flex:.5">${ICON.left}</button>` : ""}<button class="btn primary" data-ob="next">${step === steps.length - 1 ? "Başlayalım 🔥" : "Devam"}</button></div></div>`;
      const fig = $("#obfig", el);
      if (fig) anim = window.Figure.animate(fig, "squat_goblet", { pri: ["quads", "glutes"], sec: ["hamstrings", "abs"] });
    };
    const collect = () => {
      const v = (id) => { const x = $(id, el); return x ? x.value : null; };
      const num = (id, d) => { const x = v(id); const n = parseFloat(String(x).replace(",", ".")); return x != null && isFinite(n) ? n : d; };
      if (step === 0) p.name = (v("#obn") || "").trim();
      if (step === 1) { p.age = num("#oba", p.age); p.height = num("#obh", p.height); p.weight = num("#obw", p.weight); p.goal = num("#obg", p.goal); }
      if (step === 2) p.gymTime = v("#obt") || p.gymTime;
    };
    el.addEventListener("click", (ev) => {
      const t = ev.target.closest("[data-ob],[data-tog],[data-dow],[data-eq]"); if (!t) return;
      if (t.dataset.tog) { p[t.dataset.tog] = !p[t.dataset.tog]; t.classList.toggle("on", p[t.dataset.tog]); return; }
      if (t.dataset.dow != null) { collect(); const d = +t.dataset.dow; if (p.days.includes(d)) { if (p.days.length > 2) p.days = p.days.filter((x) => x !== d); } else if (p.days.length < 5) p.days = p.days.concat([d]); render(); return; }
      if (t.dataset.eq) { S.eq[t.dataset.eq] = S.eq[t.dataset.eq] === false; t.classList.toggle("on", S.eq[t.dataset.eq]); $(".ck", t).textContent = S.eq[t.dataset.eq] ? "✓" : ""; return; }
      collect();
      if (t.dataset.ob === "back") { step--; render(); return; }
      if (step < steps.length - 1) { step++; render(); return; }
      S.onboarded = true; p.start = P.keyOf(P.mondayOf(new Date())); save();
      if (anim) anim.stop();
      el.style.transition = "opacity .3s"; el.style.opacity = 0; setTimeout(() => el.remove(), 300);
      tab = "home"; renderApp();
      setTimeout(() => toast(`Hoş geldin${p.name ? ", " + esc(p.name) : ""}! İlk hafta: Alışma.`, "🔥"), 400);
    });
    render();
  }

  /* ================= BAŞLAT ================= */
  renderApp();
  if (!S.onboarded) startOnboarding();
  else { checkBadges(true); if (S.session && location.hash !== "#nores") setTimeout(() => toast("Yarım kalan antrenmanın var — Bugün ekranından devam et", "⏸️"), 600); }
  window.addEventListener("focus", () => { if (!player.open && !sheets.length) rerender(); });
  // test / hata ayıklama kolaylığı
  window.ADIM = { get state() { return S; }, render: renderApp, openExercise, openDay, startWorkout, player, icsText, scriptableText, setTab: (t) => { tab = t; renderApp(); } };
})();
