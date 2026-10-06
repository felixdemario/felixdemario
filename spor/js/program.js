/* ADIM — program üretici
   4 gün: A Alt vücut (bacak & kalça) · B Üst vücut itiş · C Alt vücut B (kalça & karın) · D Üst vücut çekiş + uzun kardiyo.
   Aşamalar haftalara göre kademeli artar; her 4. hafta civarı "hafif hafta" (toparlanma) vardır. */
(function () {
  const { BY, EXERCISES } = window.DB;

  const PHASES = [
    { id: 1, n: "Alışma", from: 0, to: 1, cap: 2, sets: { main: 2, acc: 2, core: 2 }, reps: { main: "10–12", acc: "12–15" }, core: 20, rest: { main: 90, acc: 75, core: 45 },
      cardio: [15, 15, 15, 20], feel: "Çok hafif başla: her setin sonunda 4–5 tekrar daha yapabilecek gibi hissetmelisin. Amaç hareketleri öğrenmek ve vücudunu alıştırmak.",
      goal: "Hareketleri doğru öğren, salona alış, kaslarını ve eklemlerini hazırla." },
    { id: 2, n: "Temel", from: 2, to: 3, cap: 2, sets: { main: 3, acc: 2, core: 2 }, reps: { main: "10–12", acc: "12–15" }, core: 25, rest: { main: 90, acc: 75, core: 45 },
      cardio: [20, 20, 20, 25], feel: "Hâlâ rahat: setin sonunda 3–4 tekrar daha yapabilecek gibi olmalı. Ana hareketlerde 3 sete çıkıyoruz.",
      goal: "Ana hareketlerde set sayısını artır, kardiyo süresini uzat." },
    { id: 3, n: "Gelişim", from: 4, to: 7, cap: 3, sets: { main: 3, acc: 3, core: 3 }, reps: { main: "10–12", acc: "12–15" }, core: 30, rest: { main: 90, acc: 60, core: 40 },
      cardio: [20, 25, 20, 30], feel: "Orta zorluk: son 2–3 tekrar zorlamalı ama form bozulmamalı. 12 tekrarı rahat yapınca ağırlığı biraz artır.",
      goal: "Yeni hareketler eklenir, ağırlıkları kademeli artırırsın." },
    { id: 4, n: "Güçlenme", from: 8, to: 11, cap: 3, top: 4, sets: { main: 3, acc: 3, core: 3 }, reps: { main: "8–12", acc: "10–15" }, core: 40, rest: { main: 90, acc: 60, core: 40 },
      cardio: [25, 30, 25, 35], interval: [false, true, false, false], feel: "Zorlayıcı ama kontrollü: son 1–2 tekrar zor gelmeli. Kardiyoya kısa hızlı bölümler ekleniyor.",
      goal: "Güç ve kondisyon: ilk ana harekette 4 set, aralıklı kardiyo." },
    { id: 5, n: "Devam", from: 12, to: 9999, cap: 4, top: 4, sets: { main: 3, acc: 3, core: 3 }, reps: { main: "8–12", acc: "10–15" }, core: 45, rest: { main: 90, acc: 60, core: 40 },
      cardio: [30, 30, 30, 35], interval: [false, true, false, true], feel: "Artık düzenli sporcusun: ağırlıkları kademeli artırmaya devam et, her 4. hafta hafif hafta.",
      goal: "Kazandıklarını koru ve yavaş yavaş artırmaya devam et." },
  ];

  // Gün şablonları: her satır bir "slot" (aynı işi yapan hareketler grubu)
  // pref: aşamaya göre öncelik listesi ({ aşama: [...] } — en büyük ≤ aşama kullanılır)
  const TEMPLATES = {
    A: { n: "Alt Vücut", sub: "Bacak & Kalça", focus: ["quads", "glutes", "hamstrings", "calves", "abs"], color: "#ff3b30",
      warm: ["w_march", "w_legswing", "w_hipcircle"], cool: ["s_quad", "s_ham", "s_hipflex"],
      cardioPref: ["bike", "elliptical", "incline_walk", "outdoor_walk", "march"],
      slots: [
        { slot: "quad_main", role: "main", from: 1, pref: { 1: ["leg_press", "goblet_box_squat", "box_squat_bw", "smith_squat", "bw_squat"] } },
        { slot: "hinge", role: "main", from: 1, pref: { 1: ["glute_bridge", "cable_pullthrough", "db_rdl"], 3: ["hip_thrust", "glute_bridge", "cable_pullthrough"] } },
        { slot: "ham_iso", role: "acc", from: 1, pref: { 1: ["leg_curl", "heel_bridge", "band_leg_curl"] } },
        { slot: "quad_iso", role: "acc", from: 2, pref: { 1: ["leg_extension", "band_knee_ext", "wall_sit"] } },
        { slot: "glute_iso", role: "acc", from: 4, pref: { 1: ["hip_abduction", "band_lateral_walk", "side_lying_abd"] } },
        { slot: "calf", role: "acc", from: 1, pref: { 1: ["calf_raise", "seated_calf", "legpress_calf"] } },
        { slot: "core_antiext", role: "core", from: 1, pref: { 1: ["dead_bug", "knee_plank", "incline_plank"], 4: ["plank", "dead_bug", "incline_plank"] } },
      ] },
    B: { n: "Üst Vücut", sub: "Göğüs, Omuz & Arka Kol", focus: ["chest", "shoulders_front", "shoulders_side", "triceps", "obliques"], color: "#ff6a1a",
      warm: ["w_march", "w_armcircle", "w_catcow"], cool: ["s_chest", "s_lat", "s_child"],
      cardioPref: ["incline_walk", "elliptical", "bike", "outdoor_walk", "march"],
      slots: [
        { slot: "chest_press", role: "main", from: 1, pref: { 1: ["chest_press_machine", "incline_pushup", "floor_press", "wall_pushup"], 3: ["db_bench_press", "chest_press_machine", "incline_pushup", "floor_press"] } },
        { slot: "shoulder_press", role: "main", from: 1, pref: { 1: ["machine_shoulder_press", "seated_db_press", "band_shoulder_press"], 3: ["seated_db_press", "machine_shoulder_press", "band_shoulder_press"] } },
        { slot: "chest_fly", role: "acc", from: 2, pref: { 1: ["pec_deck", "cable_fly", "band_fly", "db_fly"] } },
        { slot: "lateral", role: "acc", from: 3, pref: { 1: ["db_lateral", "cable_lateral", "band_lateral"] } },
        { slot: "triceps", role: "acc", from: 1, pref: { 1: ["cable_pushdown", "band_pushdown", "db_kickback"], 4: ["cable_pushdown", "db_overhead_ext", "band_pushdown"] } },
        { slot: "rear_delt", role: "acc", from: 5, pref: { 1: ["face_pull", "band_pull_apart", "reverse_pec_deck"] } },
        { slot: "core_stab", role: "core", from: 1, pref: { 1: ["bird_dog", "band_pallof", "side_plank_knee"], 3: ["pallof_press", "band_pallof", "bird_dog"] } },
      ] },
    C: { n: "Alt Vücut B", sub: "Kalça, Arka Bacak & Karın", focus: ["glutes", "hamstrings", "glute_med", "quads", "abs"], color: "#ff3b30",
      warm: ["w_march", "w_goodmorning", "w_legswing"], cool: ["s_ham", "s_hipflex", "s_calf"],
      cardioPref: ["elliptical", "bike", "incline_walk", "outdoor_walk", "march"],
      slots: [
        { slot: "hinge", role: "main", from: 1, pref: { 1: ["db_rdl", "kb_deadlift", "cable_pullthrough", "glute_bridge"] } },
        { slot: "quad_main", role: "main", from: 1, pref: { 1: ["goblet_box_squat", "box_squat_bw", "leg_press"], 3: ["goblet_box_squat", "goblet_squat", "leg_press"], 5: ["goblet_squat", "smith_squat", "leg_press"] } },
        { slot: "single_leg", role: "acc", from: 2, pref: { 1: ["step_up", "reverse_lunge", "split_squat"], 4: ["step_up", "reverse_lunge", "step_up_bench"] } },
        { slot: "glute_iso", role: "acc", from: 1, pref: { 1: ["hip_abduction", "band_lateral_walk", "side_lying_abd", "quadruped_kickback"] } },
        { slot: "calf", role: "acc", from: 3, pref: { 1: ["seated_calf", "calf_raise", "legpress_calf"] } },
        { slot: "core_flex", role: "core", from: 1, pref: { 1: ["crunch", "reverse_crunch", "cable_crunch"], 3: ["reverse_crunch", "cable_crunch", "crunch"] } },
        { slot: "core_stab", role: "core", from: 3, pref: { 1: ["side_plank_knee", "bird_dog", "band_pallof"] } },
      ] },
    D: { n: "Üst Vücut B", sub: "Sırt, Arka Omuz & Pazı", focus: ["lats", "upperback", "shoulders_rear", "biceps", "forearms"], color: "#ff6a1a", longCardio: true,
      warm: ["w_march", "w_armcircle", "w_catcow"], cool: ["s_lat", "s_child", "s_chest"],
      cardioPref: ["incline_walk", "elliptical", "bike", "outdoor_walk", "march"],
      slots: [
        { slot: "vertical_pull", role: "main", from: 1, pref: { 1: ["lat_pulldown", "band_pulldown", "straight_arm_pulldown"], 5: ["assisted_pullup", "lat_pulldown", "band_pulldown"] } },
        { slot: "row", role: "main", from: 1, pref: { 1: ["seated_cable_row", "chest_supported_row", "band_row"], 3: ["chest_supported_row", "seated_cable_row", "one_arm_db_row"] } },
        { slot: "rear_delt", role: "acc", from: 1, pref: { 1: ["reverse_pec_deck", "band_pull_apart", "face_pull"] } },
        { slot: "biceps", role: "acc", from: 1, pref: { 1: ["db_curl", "cable_curl", "band_curl"] } },
        { slot: "biceps", role: "acc", from: 4, key: "biceps2", pref: { 1: ["hammer_curl", "band_curl", "cable_curl"] } },
        { slot: "carry", role: "acc", from: 2, pref: { 1: ["farmer_walk", "kb_carry"] } },
        { slot: "core_antiext", role: "core", from: 1, pref: { 1: ["incline_plank", "knee_plank", "dead_bug"], 4: ["plank", "incline_plank", "knee_plank"] } },
      ] },
  };

  const DAY_NAMES = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  const DAY_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

  /* ---------- tarih yardımcıları ---------- */
  const pad = (n) => String(n).padStart(2, "0");
  const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseKey = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const mondayOf = (d) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); const w = (x.getDay() + 6) % 7; x.setDate(x.getDate() - w); return x; };
  const weeksBetween = (a, b) => Math.round((mondayOf(b) - mondayOf(a)) / (7 * 864e5));

  // Antrenman günleri sırayla şablonlara dağıtılır (haftanın Pazartesi'den başlayan sırasına göre)
  function dayTemplateMap(days) {
    const order = days.slice().sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7));
    const ids = order.length >= 4 ? ["A", "B", "C", "D"] : order.length === 3 ? ["A", "B", "C"] : ["A", "B"];
    const map = {};
    order.forEach((d, i) => (map[d] = ids[i % ids.length]));
    // 3 gün seçildiyse C gününe çekiş hareketleri de eklenir (aşağıda)
    return map;
  }

  function weekIndex(state, date) {
    const start = parseKey(state.profile.start);
    return Math.max(0, weeksBetween(start, date) + (state.profile.offset || 0));
  }
  function phaseOf(w) { return PHASES.find((p) => w >= p.from && w <= p.to) || PHASES[PHASES.length - 1]; }
  function isDeload(w) { return w === 7 || (w >= 12 && w % 4 === 3); }

  /* ---------- alet / hareket uygunluğu ---------- */
  function available(state, e) {
    return e.eq.every((q) => state.eq[q] !== false);
  }
  function allowed(state, e, cap) {
    if (!available(state, e)) return false;
    if (state.banned && state.banned[e.id]) return false;
    if (cap != null && e.d > cap) return false;
    if (state.profile.kneeCare && e.knee >= 2) return false;
    if (state.profile.backCare && e.back >= 2) return false;
    return true;
  }
  function prefFor(slotDef, phaseId) {
    let best = null;
    for (const k of Object.keys(slotDef.pref)) if (+k <= phaseId && (best == null || +k > best)) best = +k;
    return slotDef.pref[best] || [];
  }
  function slotKey(tplId, slotDef) { return `${tplId}:${slotDef.key || slotDef.slot}`; }

  function choose(state, tplId, slotDef, phase) {
    const key = slotKey(tplId, slotDef);
    const sw = state.swaps && state.swaps[key];
    if (sw && BY[sw] && allowed(state, BY[sw], 5)) return BY[sw];
    const pref = prefFor(slotDef, phase.id);
    const rest = EXERCISES.filter((e) => e.slot === slotDef.slot && !pref.includes(e.id)).sort((a, b) => a.d - b.d);
    const cands = pref.map((id) => BY[id]).filter(Boolean).concat(rest);
    return cands.find((e) => allowed(state, e, phase.cap)) || cands.find((e) => allowed(state, e, 5)) || null;
  }

  // Aynı işi gören alternatifler (değiştir menüsü)
  function alternatives(state, exId) {
    const cur = BY[exId];
    return EXERCISES.filter((e) => e.slot === cur.slot && e.id !== exId)
      .map((e) => ({ e, ok: available(state, e) && !(state.banned && state.banned[e.id]), why: !available(state, e) ? "Alet yok: " + e.eq.filter((q) => state.eq[q] === false).map((q) => window.DB.EQUIPMENT.find((x) => x.id === q).n).join(", ") : state.banned && state.banned[e.id] ? "Gizledin" : "" }))
      .sort((a, b) => (b.ok - a.ok) || Math.abs(a.e.d - cur.d) - Math.abs(b.e.d - cur.d) || a.e.d - b.e.d);
  }

  /* ---------- kardiyo planı ---------- */
  function cardioPlan(state, tpl, phase, tplIndex, deload) {
    const pref = tpl.cardioPref;
    const cands = pref.map((id) => BY[id]).concat(EXERCISES.filter((e) => e.slot === "cardio" && !pref.includes(e.id)));
    const sw = state.swaps && state.swaps[`${tpl.id}:cardio`];
    const e = (sw && BY[sw] && allowed(state, BY[sw], 5) && BY[sw]) || cands.find((x) => allowed(state, x, 5)) || BY.march;
    let min = phase.cardio[tplIndex] || phase.cardio[0];
    if (deload) min = Math.max(15, min - 5);
    const interval = !deload && phase.interval && phase.interval[tplIndex];
    const hr = hrZone(state.profile.age);
    const blocks = [];
    blocks.push({ label: "Isınma temposu", sec: 180, cue: "Yavaş başla, nefesin açılsın." });
    const main = min * 60 - 180 - 120;
    if (interval) {
      let left = main;
      while (left >= 240) { blocks.push({ label: "Rahat tempo", sec: 180, cue: "Konuşabileceğin tempo." }); blocks.push({ label: "Biraz hızlı", sec: 60, cue: "Tempoyu ya da eğimi artır — nefesin hızlansın.", hard: true }); left -= 240; }
      if (left > 0) blocks.push({ label: "Rahat tempo", sec: left, cue: "Konuşabileceğin tempo." });
    } else blocks.push({ label: "Sabit tempo", sec: main, cue: `Konuşabileceğin tempo · nabız ${hr[0]}–${hr[1]}` });
    blocks.push({ label: "Soğuma", sec: 120, cue: "Tempoyu yavaş yavaş düşür." });
    return { ex: e, min, interval, blocks, intensity: interval ? "Aralıklı (rahat + kısa hızlı)" : phase.id >= 3 ? "Hafif–orta" : "Hafif", hr };
  }

  // Tanaka formülü: maks. nabız ≈ 208 − 0,7 × yaş; yağ yakım bölgesi %60–70
  function hrZone(age) {
    const max = Math.round(208 - 0.7 * (age || 35));
    return [Math.round(max * 0.6), Math.round(max * 0.7), max];
  }

  /* ---------- bir günün antrenmanı ---------- */
  function dayPlan(state, date) {
    const days = state.profile.days;
    const dow = date.getDay();
    const map = dayTemplateMap(days);
    const tplId = map[dow];
    if (!tplId) return null;
    return planFor(state, tplId, date);
  }

  function planFor(state, tplId, date) {
    const tpl = Object.assign({ id: tplId }, TEMPLATES[tplId]);
    const w = weekIndex(state, date);
    const phase = phaseOf(w);
    const deload = isDeload(w);
    const tplIndex = ["A", "B", "C", "D"].indexOf(tplId);
    let slots = tpl.slots.slice();
    // 3 günlük düzende C gününe çekiş de eklenir ki sırt ihmal edilmesin
    if (state.profile.days.length === 3 && tplId === "C") slots = slots.concat([{ slot: "row", role: "main", from: 1, key: "row3", pref: { 1: ["seated_cable_row", "chest_supported_row", "band_row"] } }]);
    if (state.profile.days.length <= 2) slots = slots.concat(tplId === "A" ? TEMPLATES.D.slots.slice(0, 2) : TEMPLATES.C.slots.slice(0, 1));
    const items = [];
    for (const s of slots) {
      if (s.from > phase.id) continue;
      const e = choose(state, tplId, s, phase);
      if (!e) continue;
      let sets = phase.sets[s.role];
      if (phase.top && s.role === "main" && !items.some((x) => x.role === "main")) sets = phase.top;
      if (deload) sets = Math.max(2, sets - 1);
      const time = e.kind === "time";
      let target;
      if (time) target = { sec: e.slot === "carry" ? [30, 30, 40, 45, 60][phase.id - 1] : phase.core + (e.perSide ? -5 : 0) };
      else if (s.role === "core") target = { reps: e.perSide ? `${[8, 10, 10, 12, 12][phase.id - 1]} /taraf` : ["10", "12", "12–15", "15", "15–20"][phase.id - 1] };
      else target = { reps: (s.role === "main" ? phase.reps.main : phase.reps.acc) + (e.perSide ? " /taraf" : "") };
      items.push({ key: slotKey(tplId, s), slot: s.slot, role: s.role, ex: e, sets, target, rest: phase.rest[s.role] });
    }
    const cardio = cardioPlan(state, tpl, phase, tplIndex, deload);
    const warm = tpl.warm.map((id) => ({ ex: BY[id], sec: 40 }));
    const cool = tpl.cool.map((id) => ({ ex: BY[id], sec: BY[id].perSide ? 40 : 30 }));
    // süre tahmini (dk)
    const strengthMin = items.reduce((t, it) => t + it.sets * ((it.target.sec || (it.ex.perSide ? 70 : 40)) + it.rest) / 60, 0) + items.length * 0.5;
    const total = Math.round(3 + warm.length * 0.7 + strengthMin + cardio.min + cool.length * 0.7);
    return { tpl, tplId, week: w, phase, deload, items, cardio, warm, cool, minutes: total, date: keyOf(date) };
  }

  /* ---------- kalori tahmini (MET × kg × saat) ---------- */
  function kcal(weightKg, minStrength, cardioMin, cardioMet) {
    return Math.round(3.5 * weightKg * (minStrength / 60) + (cardioMet || 4.5) * weightKg * (cardioMin / 60));
  }

  // Bu ağırlıkta tekrar aralığının üst sınırına ulaşıldıysa ağırlık artırma önerisi
  function suggestion(state, exId, target) {
    const hist = state.history && state.history[exId];
    if (!hist || !hist.length) return null;
    const last = hist[hist.length - 1];
    const top = parseInt(String(target.reps || "").split(/[–-]/).pop(), 10);
    if (!top || !last.sets.length) return { kg: last.kg };
    const all = last.sets.every((s) => s.r >= top);
    const e = BY[exId];
    const step = e.eq.includes("dumbbell") ? 1 : e.eq.includes("cable") || e.eq.some((q) => ["legpress", "legext", "legcurl", "latpull", "chestpress", "shoulderpress", "pecdeck", "abductor"].includes(q)) ? 2.5 : 2.5;
    if (all && last.kg != null && (!last.feel || last.feel <= 3)) return { kg: Math.round((last.kg + step) * 2) / 2, up: true, step };
    return { kg: last.kg };
  }

  window.Program = { PHASES, TEMPLATES, DAY_NAMES, DAY_SHORT, MONTHS, keyOf, parseKey, addDays, mondayOf, weekIndex, phaseOf, isDeload, dayPlan, planFor, dayTemplateMap, alternatives, available, allowed, hrZone, kcal, suggestion, slotKey };
})();
