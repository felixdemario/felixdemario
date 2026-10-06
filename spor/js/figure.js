/* ADIM — hareket animasyon motoru
   Her hareket, birkaç anahtar pozdan (keyframe) oluşan bir döngü olarak tanımlanır.
   Poz alanları:
     hip:[x,y]          kalça (kök) konumu
     t / T:[x,y]        gövde açısı ya da omzun gideceği nokta
     n                  baş açısı (varsayılan gövdeyle aynı)
     A1/A2:[üst,alt]    kol açıları   ·  H1/H2:[x,y] el hedefi (ters kinematik)
     L1/L2:[uyluk,kaval] bacak açıları ·  F1/F2:[x,y] ayak bileği hedefi
     ft1/ft2            ayak açısı (90 = yere düz)
   Açılar: 0 = aşağı, 90 = ileri (sağa), 180 = yukarı, 270 = geri.
   view:"front" önden görünüş (1 = ekranın solu, 2 = sağı). */
(function () {
  const D = Math.PI / 180;
  const LEN = { torso: 48, neck: 7, head: 10, ua: 27, fa: 25, th: 38, sh: 37, ft: 12 };
  const FLOOR = 186;
  const v = (a, l) => [l * Math.sin(a * D), l * Math.cos(a * D)];
  const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
  const ang = (p, q) => Math.atan2(q[0] - p[0], q[1] - p[1]) / D;
  const dist = (p, q) => Math.hypot(q[0] - p[0], q[1] - p[1]);

  // İki parçalı uzuv için ters kinematik: kökten hedefe; bend +1 = saat yönü tersine büküm
  function ik(root, target, a, b, bend) {
    let d = dist(root, target);
    d = Math.max(Math.abs(a - b) + 0.01, Math.min(a + b - 0.01, d));
    const base = ang(root, target);
    const alpha = Math.acos((a * a + d * d - b * b) / (2 * a * d)) / D;
    const a1 = base + bend * alpha;
    const j = add(root, v(a1, a));
    return [a1, ang(j, target)];
  }

  const BASE = { view: "side", hip: [110, 109], t: 180, A1: [4, 8], A2: [-4, 2], L1: [0, 0], L2: [-2, -2], ft1: 90, ft2: 90 };

  // Anahtar pozu açılara çevir (ters kinematik hedefleri dahil)
  function canon(p) {
    const front = p.view === "front";
    const c = { hip: p.hip.slice(), view: p.view };
    c.t = p.T ? ang(p.hip, p.T) : p.t;
    c.n = p.n != null ? p.n : c.t;
    const sh = add(c.hip, v(c.t, LEN.torso));
    const off = front ? v(c.t + 90, 1) : [0, 0];
    const shW = front ? 13 : 0, hipW = front ? 7 : 0;
    const sh1 = add(sh, [off[0] * shW, off[1] * shW]), sh2 = add(sh, [-off[0] * shW, -off[1] * shW]);
    const hp1 = add(c.hip, [off[0] * hipW, off[1] * hipW]), hp2 = add(c.hip, [-off[0] * hipW, -off[1] * hipW]);
    for (const i of [1, 2]) {
      const sp = i === 1 ? sh1 : sh2, hp = i === 1 ? hp1 : hp2;
      if (p["H" + i]) { c["A" + i] = ik(sp, p["H" + i], LEN.ua, LEN.fa, p["ab" + i] != null ? p["ab" + i] : (front ? (i === 1 ? 1 : -1) : -1)); c["H" + i] = p["H" + i]; }
      else c["A" + i] = p["A" + i].slice();
      if (p["F" + i]) { c["L" + i] = ik(hp, p["F" + i], LEN.th, LEN.sh, p["lb" + i] != null ? p["lb" + i] : (front ? (i === 1 ? -1 : 1) : 1)); c["F" + i] = p["F" + i]; }
      else c["L" + i] = p["L" + i].slice();
      c["ft" + i] = p["ft" + i] != null ? p["ft" + i] : 90;
      c["ab" + i] = p["ab" + i] != null ? p["ab" + i] : (front ? (i === 1 ? 1 : -1) : -1);
      c["lb" + i] = p["lb" + i] != null ? p["lb" + i] : (front ? (i === 1 ? -1 : 1) : 1);
    }
    return c;
  }

  // Açılardan eklem konumları
  function joints(c) {
    const front = c.view === "front";
    const J = { hip: c.hip, view: c.view };
    J.sh = add(c.hip, v(c.t, LEN.torso));
    J.head = add(J.sh, v(c.n, LEN.neck + LEN.head));
    const off = front ? v(c.t + 90, 1) : [0, 0];
    const shW = front ? 13 : 0, hipW = front ? 7 : 0;
    J.s1 = add(J.sh, [off[0] * shW, off[1] * shW]); J.s2 = add(J.sh, [-off[0] * shW, -off[1] * shW]);
    J.p1 = add(c.hip, [off[0] * hipW, off[1] * hipW]); J.p2 = add(c.hip, [-off[0] * hipW, -off[1] * hipW]);
    for (const i of [1, 2]) {
      const A = c["A" + i], L = c["L" + i];
      J["e" + i] = add(J["s" + i], v(A[0], LEN.ua));
      J["h" + i] = add(J["e" + i], v(A[1], LEN.fa));
      J["k" + i] = add(J["p" + i], v(L[0], LEN.th));
      J["a" + i] = add(J["k" + i], v(L[1], LEN.sh));
      J["toe" + i] = front ? add(J["a" + i], [i === 1 ? -4 : 4, 3]) : add(J["a" + i], v(c["ft" + i], LEN.ft));
    }
    J.hands = [(J.h1[0] + J.h2[0]) / 2, (J.h1[1] + J.h2[1]) / 2];
    return J;
  }

  const lerp = (a, b, k) => a + (b - a) * k;
  const lerpA = (a, b, k) => { let d = ((b - a) % 360 + 540) % 360 - 180; return a + d * k; };
  const lerpP = (p, q, k) => [lerp(p[0], q[0], k), lerp(p[1], q[1], k)];
  function mix(a, b, k) {
    const c = { view: a.view, hip: lerpP(a.hip, b.hip, k), t: lerpA(a.t, b.t, k), n: lerpA(a.n, b.n, k) };
    const sh = add(c.hip, v(c.t, LEN.torso));
    const front = c.view === "front";
    const off = front ? v(c.t + 90, 1) : [0, 0];
    for (const i of [1, 2]) {
      c["ft" + i] = lerpA(a["ft" + i], b["ft" + i], k);
      const sp = add(sh, [off[0] * (i === 1 ? 13 : -13) * (front ? 1 : 0), off[1] * (i === 1 ? 13 : -13) * (front ? 1 : 0)]);
      const hp = add(c.hip, [off[0] * (i === 1 ? 7 : -7) * (front ? 1 : 0), off[1] * (i === 1 ? 7 : -7) * (front ? 1 : 0)]);
      if (a["H" + i] && b["H" + i] && a["ab" + i] === b["ab" + i]) c["A" + i] = ik(sp, lerpP(a["H" + i], b["H" + i], k), LEN.ua, LEN.fa, a["ab" + i]);
      else c["A" + i] = [lerpA(a["A" + i][0], b["A" + i][0], k), lerpA(a["A" + i][1], b["A" + i][1], k)];
      if (a["F" + i] && b["F" + i] && a["lb" + i] === b["lb" + i]) c["L" + i] = ik(hp, lerpP(a["F" + i], b["F" + i], k), LEN.th, LEN.sh, a["lb" + i]);
      else c["L" + i] = [lerpA(a["L" + i][0], b["L" + i][0], k), lerpA(a["L" + i][1], b["L" + i][1], k)];
    }
    return c;
  }

  /* ---------- sahne ögeleri (aletler) ---------- */
  const C = { metal: "#8b8f98", dark: "#2a2b31", pad: "#3a2a2c", padHi: "#5a2f33", line: "#55575f", band: "#ff8a1f", cable: "#c9ccd3" };
  const seg = (p, q, w, col, extra) => `<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"${extra || ""}/>`;
  const dot = (p, r, col, extra) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${r}" fill="${col}"${extra || ""}/>`;
  const P = {
    db(p, a = 90, s = 1) { const u = v(a, 7 * s); return seg(add(p, [-u[0], -u[1]]), add(p, u), 3, C.metal) + seg(add(p, [-u[0] * 1.1, -u[1] * 1.1]), add(p, [-u[0] * 0.55, -u[1] * 0.55]), 7 * s, "#1c1d22", ` stroke="#6b6f78"`) + seg(add(p, [u[0] * 0.55, u[1] * 0.55]), add(p, [u[0] * 1.1, u[1] * 1.1]), 7 * s, "#6b6f78"); },
    dbSide(p) { return dot(p, 6.5, "#6b6f78") + dot(p, 3, "#2b2c31"); },
    kb(p) { return `<path d="M${p[0] - 5} ${p[1] + 2} q5 -10 10 0" fill="none" stroke="#6b6f78" stroke-width="2.5"/>` + dot([p[0], p[1] + 8], 7, "#6b6f78"); },
    plate(p, r = 14) { return dot(p, r, "#24252b", ` stroke="#6b6f78" stroke-width="2.5"`) + dot(p, 2.5, C.metal); },
    bench(x, y, w, h = FLOOR - y) { return `<rect x="${x}" y="${y}" width="${w}" height="6" rx="3" fill="${C.pad}"/>` + seg([x + 6, y + 6], [x + 6, y + h], 3, C.line) + seg([x + w - 6, y + 6], [x + w - 6, y + h], 3, C.line); },
    box(x, y, w) { return `<rect x="${x}" y="${y}" width="${w}" height="${FLOOR - y}" rx="3" fill="#26272d" stroke="#3a3c44"/>`; },
    mat(x, w) { return `<rect x="${x}" y="${FLOOR - 3}" width="${w}" height="3" rx="1.5" fill="#5a2f33"/>`; },
    pad(p, q, w = 8, col = C.pad) { return seg(p, q, w, col); },
    pulley(p) { return dot(p, 4.5, "#1c1d22", ` stroke="${C.metal}" stroke-width="2"`); },
    cable(from, to) { return seg(from, to, 1.4, C.cable, ` opacity=".8"`) + P.pulley(from); },
    band(from, to) { return seg(from, to, 2.6, C.band, ` opacity=".9"`) + dot(from, 2.5, C.band); },
    wall(x) { return `<rect x="${x - 4}" y="40" width="8" height="${FLOOR - 40}" fill="#202127"/>`; },
    tread(x, w) { return `<rect x="${x}" y="${FLOOR - 7}" width="${w}" height="7" rx="3.5" fill="#26272d" stroke="#3a3c44"/>` + seg([x + w - 6, FLOOR - 7], [x + w + 8, FLOOR - 92], 4, C.line) + seg([x + w + 8, FLOOR - 92], [x + w - 10, FLOOR - 96], 4, C.line); },
  };

  /* ---------- poz yardımcıları ---------- */
  const F0 = 183; // ayak bileği yüksekliği (ayakta)
  const stand = (o) => Object.assign({}, BASE, { F1: [112, F0], F2: [109, F0] }, o);
  const sideFront = (o) => Object.assign({}, BASE, { view: "front", hip: [120, 109], t: 180, A1: [-8, -4], A2: [8, 4], F1: [110, F0], F2: [130, F0] }, o);

  const QB = { ...BASE, hip: [80, 145], T: [128, 131], n: 104, A1: [0, 0], A2: [0, 0], L1: [0, 270], L2: [0, 270], ft1: 270, ft2: 270 };

  /* ---------- hareket animasyonları ----------
     frames: anahtar pozlar; dur: her geçişin süresi (sn); hold: her pozda bekleme */
  const A = {};
  const def = (id, spec) => (A[id] = spec);

  // —— BACAK ——
  def("squat_goblet", { frames: [
    stand({ H1: [128, 68], H2: [126, 68] }),
    stand({ hip: [86, 146], t: 146, H1: [118, 104], H2: [116, 104] }),
  ], props: (J) => P.db([J.h1[0] + 2, J.h1[1] - 2], 0, 1.1) });
  def("squat_box", { frames: [
    stand({ H1: [146, 74], H2: [144, 76] }),
    stand({ hip: [86, 146], t: 146, H1: [134, 108], H2: [132, 110] }),
  ], scene: P.bench(52, 156, 40) });
  def("squat_goblet_box", { frames: A.squat_goblet.frames, props: A.squat_goblet.props, scene: P.bench(52, 156, 40) });
  def("squat_bw", { frames: [
    stand({ H1: [146, 74], H2: [144, 76] }),
    stand({ hip: [86, 146], t: 146, H1: [134, 108], H2: [132, 110] }),
  ] });
  def("squat_bar", { frames: [
    stand({ H1: [118, 58], H2: [116, 58], ab1: -1 }),
    stand({ hip: [86, 146], t: 142, H1: [106, 96], H2: [104, 96], ab1: -1 }),
  ], props: (J) => P.plate([J.sh[0] - 2, J.sh[1] - 2], 15) + seg([J.sh[0] - 2, J.sh[1] - 2], [J.sh[0] - 2, J.sh[1] - 2], 4, C.metal) });
  def("wallsit", { frames: [
    stand({ hip: [62, 142], t: 180, F1: [100, F0], F2: [97, F0], A1: [0, 0], A2: [0, 0] }),
    stand({ hip: [62, 141], t: 180, F1: [100, F0], F2: [97, F0], A1: [0, 0], A2: [0, 0] }),
  ], scene: P.wall(48), dur: [2, 2], hold: [0, 0] });
  def("legpress", { frames: [
    { ...BASE, hip: [72, 150], t: 236, F1: [116, 116], F2: [113, 118], ft1: 214, ft2: 214, H1: [84, 160], H2: [82, 160] },
    { ...BASE, hip: [72, 150], t: 236, F1: [138, 102], F2: [135, 104], ft1: 214, ft2: 214, H1: [84, 160], H2: [82, 160] },
  ], scene: seg([52, 120], [80, 162], 10, C.pad) + seg([60, 172], [150, 172], 5, C.line) + seg([110, 172], [165, 70], 4, C.line),
    props: (J) => seg(add(J.a1, v(214, -6)), add(J.a1, v(214, 26)), 6, C.metal) });
  def("legext", { frames: [
    { ...BASE, hip: [96, 140], t: 186, L1: [90, -8], L2: [90, -12], A1: [10, 40], A2: [8, 40] },
    { ...BASE, hip: [96, 140], t: 186, L1: [90, 82], L2: [90, 80], ft1: 175, ft2: 175, A1: [10, 40], A2: [8, 40] },
  ], scene: seg([78, 148], [130, 148], 8, C.pad) + seg([84, 92], [86, 144], 8, C.pad) + seg([100, 152], [100, FLOOR], 4, C.line) + seg([80, FLOOR], [128, FLOOR], 4, C.line),
    props: (J) => dot(add(J.a1, [3, -2]), 5.5, C.padHi) });
  def("legcurl", { frames: [
    { ...BASE, hip: [96, 140], t: 190, L1: [90, 84], L2: [90, 82], ft1: 175, ft2: 175, A1: [10, 40], A2: [8, 40] },
    { ...BASE, hip: [96, 140], t: 190, L1: [90, -4], L2: [90, -8], A1: [10, 40], A2: [8, 40] },
  ], scene: seg([78, 148], [130, 148], 8, C.pad) + seg([82, 94], [86, 144], 8, C.pad) + seg([100, 152], [100, FLOOR], 4, C.line),
    props: (J) => dot(add(J.a1, [-3, 4]), 5.5, C.padHi) + seg(add(J.k1, [-12, -7]), add(J.k1, [4, -7]), 6, C.pad) });
  def("bridge", { frames: [
    { ...BASE, hip: [118, 174], T: [70, 176], n: 272, F1: [146, F0], F2: [143, F0], H1: [108, 182], H2: [106, 182] },
    { ...BASE, hip: [114, 150], T: [70, 177], n: 280, F1: [146, F0], F2: [143, F0], H1: [104, 182], H2: [102, 182] },
  ], scene: P.mat(40, 140) });
  def("bridge_heel", { frames: [
    { ...BASE, hip: [118, 174], T: [70, 176], n: 272, F1: [154, F0 - 2], F2: [151, F0 - 2], ft1: 150, ft2: 150, H1: [108, 182], H2: [106, 182] },
    { ...BASE, hip: [116, 156], T: [70, 177], n: 280, F1: [154, F0 - 2], F2: [151, F0 - 2], ft1: 150, ft2: 150, H1: [104, 182], H2: [102, 182] },
  ], scene: P.mat(40, 140) });
  def("hipthrust", { frames: [
    { ...BASE, hip: [110, 168], T: [72, 142], n: 230, F1: [140, F0], F2: [137, F0], H1: [104, 160], H2: [102, 160] },
    { ...BASE, hip: [112, 140], T: [70, 140], n: 268, F1: [140, F0], F2: [137, F0], H1: [102, 144], H2: [100, 144] },
  ], scene: P.bench(30, 142, 46), props: (J) => P.db([J.hip[0] + 2, J.hip[1] - 8], 90, 1) });
  def("rdl", { frames: [
    stand({ H1: [116, 140], H2: [114, 140] }),
    stand({ hip: [94, 112], t: 112, n: 120, F1: [112, F0], F2: [109, F0], H1: [120, 168], H2: [118, 168] }),
  ], props: (J) => P.dbSide(J.h1) });
  def("kbdl", { frames: [
    stand({ H1: [114, 142], H2: [112, 142] }),
    stand({ hip: [92, 126], t: 120, n: 128, H1: [114, 168], H2: [112, 168] }),
  ], props: (J) => P.kb([J.h1[0], J.h1[1] + 1]) });
  def("goodmorning", { frames: [
    stand({ H1: [120, 66], H2: [118, 66] }),
    stand({ hip: [96, 112], t: 112, n: 122, H1: [126, 98], H2: [124, 98] }),
  ] });
  def("pullthrough", { frames: [
    stand({ hip: [96, 120], t: 116, n: 120, F1: [112, F0], F2: [109, F0], H1: [86, 150], H2: [84, 150] }),
    stand({ H1: [118, 136], H2: [116, 136] }),
  ], props: (J) => P.cable([40, 178], J.h1) });
  def("stepup", { frames: [
    stand({ hip: [94, 109], F1: [118, 154], F2: [92, F0], ft1: 90, H1: [100, 140], H2: [96, 140] }),
    stand({ hip: [114, 82], t: 176, F1: [118, 154], F2: [112, 152], L2: [-10, -14], H1: [118, 114], H2: [112, 114] }),
  ], scene: P.box(100, 157, 50) });
  def("lunge_rev", { frames: [
    stand({ H1: [118, 136], H2: [114, 136] }),
    stand({ hip: [96, 144], t: 182, F1: [124, F0], F2: [62, F0 - 1], ft2: 145, H1: [102, 172], H2: [98, 172] }),
  ], props: (J) => P.dbSide(J.h1) });
  def("splitsquat", { frames: [
    stand({ hip: [94, 112], F1: [124, F0], F2: [62, F0 - 1], ft2: 145, H1: [100, 140], H2: [96, 140] }),
    stand({ hip: [96, 144], t: 182, F1: [124, F0], F2: [62, F0 - 1], ft2: 145, H1: [102, 172], H2: [98, 172] }),
  ] });
  def("calf", { frames: [
    stand({ H1: [114, 140], H2: [112, 140] }),
    stand({ hip: [110, 99], F1: [112, F0 - 10], F2: [109, F0 - 10], ft1: 140, ft2: 140, H1: [114, 130], H2: [112, 130] }),
  ], props: (J) => P.dbSide(J.h1), dur: [0.8, 0.9] });
  def("calf_seated", { frames: [
    { ...BASE, hip: [92, 144], t: 182, F1: [128, F0], F2: [125, F0], H1: [124, 140], H2: [122, 140] },
    { ...BASE, hip: [92, 144], t: 182, F1: [128, F0 - 10], F2: [125, F0 - 10], ft1: 140, ft2: 140, H1: [124, 132], H2: [122, 132] },
  ], scene: P.bench(56, 150, 50), props: (J) => P.db([J.k1[0] - 2, J.k1[1] - 6], 90, 1) });
  def("abductor", { frames: [
    { ...BASE, view: "front", hip: [120, 140], t: 180, L1: [80, 4], L2: [-80, -4], A1: [-14, 30], A2: [14, -30] },
    { ...BASE, view: "front", hip: [120, 140], t: 180, L1: [50, -10], L2: [-50, 10], A1: [-14, 30], A2: [14, -30] },
  ].map((f) => { f.L1 = [-f.L1[0], -f.L1[1]]; f.L2 = [-f.L2[0], -f.L2[1]]; return f; }),
    scene: seg([96, 150], [144, 150], 8, C.pad) + seg([120, 154], [120, FLOOR], 4, C.line), props: (J) => seg(add(J.k1, [-5, 0]), add(J.k1, [-5, 14]), 5, C.padHi) + seg(add(J.k2, [5, 0]), add(J.k2, [5, 14]), 5, C.padHi) });
  def("latwalk", { frames: [
    sideFront({ F1: [108, F0], F2: [132, F0] }),
    sideFront({ hip: [124, 113], F1: [104, F0], F2: [146, F0] }),
    sideFront({ hip: [128, 112], F1: [118, F0], F2: [146, F0] }),
  ], dur: [0.9, 0.9, 0.6], props: (J) => P.band(J.k1, J.k2).replace(/<circle.*$/, "") + seg(add(J.a1, [0, -12]), add(J.a2, [0, -12]), 2.4, C.band) });
  def("sidelying", { frames: [
    { ...BASE, view: "front", hip: [124, 172], t: 270, n: 270, A1: [270, 270], A2: [20, 0], L1: [90, 90], L2: [92, 92] },
    { ...BASE, view: "front", hip: [124, 172], t: 270, n: 270, A1: [270, 270], A2: [20, 0], L1: [90, 90], L2: [124, 124] },
  ], scene: P.mat(40, 170) });
  def("kickback_quad", { frames: [
    { ...QB },
    { ...QB, L1: [-86, 180] },
  ], scene: P.mat(36, 120) });
  def("kickback_cable", { frames: [
    stand({ t: 170, H1: [146, 84], H2: [146, 86] }),
    stand({ t: 162, H1: [146, 86], H2: [146, 88], L1: [-36, -30], F1: undefined }),
  ].map((f) => { if (!f.F1) delete f.F1; return f; }), scene: seg([150, 40], [150, FLOOR], 5, C.line), props: (J) => P.cable([60, 178], J.a1) });

  // —— GÖĞÜS ——
  def("chestpress_m", { frames: [
    { ...BASE, hip: [90, 142], t: 186, F1: [126, F0], F2: [123, F0], H1: [116, 92], H2: [114, 92] },
    { ...BASE, hip: [90, 142], t: 186, F1: [126, F0], F2: [123, F0], H1: [142, 94], H2: [140, 94] },
  ], scene: seg([74, 150], [116, 150], 8, C.pad) + seg([78, 90], [80, 146], 8, C.pad) + seg([94, 154], [94, FLOOR], 4, C.line),
    props: (J) => seg(add(J.h1, [0, -9]), add(J.h1, [0, 9]), 4, C.metal) });
  def("benchpress_db", { frames: [
    { ...BASE, hip: [116, 146], T: [68, 145], n: 272, F1: [150, F0], F2: [147, F0], H1: [90, 128], H2: [88, 128] },
    { ...BASE, hip: [116, 146], T: [68, 145], n: 272, F1: [150, F0], F2: [147, F0], H1: [88, 98], H2: [86, 98] },
  ], scene: P.bench(52, 152, 84), props: (J) => P.dbSide(J.h1) });
  def("benchpress_bb", { frames: A.benchpress_db.frames, scene: P.bench(52, 152, 84), props: (J) => P.plate(J.h1, 14) });
  def("floorpress", { frames: [
    { ...BASE, hip: [118, 176], T: [70, 178], n: 272, F1: [146, F0], F2: [143, F0], H1: [84, 158], H2: [82, 158] },
    { ...BASE, hip: [118, 176], T: [70, 178], n: 272, F1: [146, F0], F2: [143, F0], H1: [76, 128], H2: [74, 128] },
  ], scene: P.mat(40, 140), props: (J) => P.dbSide(J.h1) });
  def("pushup_incline", { frames: [
    { ...BASE, hip: [92, 128], T: [134, 98], n: 120, F1: [52, F0], F2: [50, F0], ft1: 150, ft2: 150, H1: [150, 140], H2: [148, 140] },
    { ...BASE, hip: [100, 134], T: [146, 114], n: 116, F1: [52, F0], F2: [50, F0], ft1: 150, ft2: 150, H1: [150, 140], H2: [148, 140] },
  ], scene: P.bench(136, 144, 42) });
  def("pushup_wall", { frames: [
    stand({ hip: [104, 108], t: 166, n: 166, F1: [92, F0], F2: [89, F0], H1: [150, 64], H2: [150, 66] }),
    stand({ hip: [110, 106], t: 152, n: 150, F1: [92, F0], F2: [89, F0], H1: [150, 64], H2: [150, 66] }),
  ], scene: P.wall(156) });
  def("pushup_knee", { frames: [
    { ...BASE, hip: [104, 156], T: [146, 132], n: 112, F1: [80, F0], F2: [78, F0], L1: [-60, 0], L2: [-62, 0], H1: [150, 182], H2: [148, 182] },
    { ...BASE, hip: [104, 164], T: [150, 160], n: 100, L1: [-75, 10], L2: [-77, 10], H1: [150, 182], H2: [148, 182] },
  ].map((f) => { delete f.F1; delete f.F2; f.L1 = f.L1; return f; }), scene: P.mat(50, 130) });
  def("pushup", { frames: [
    { ...BASE, hip: [96, 146], T: [142, 132], n: 112, F1: [40, F0], F2: [38, F0], ft1: 160, ft2: 160, H1: [146, 182], H2: [144, 182] },
    { ...BASE, hip: [98, 164], T: [146, 158], n: 102, F1: [40, F0], F2: [38, F0], ft1: 160, ft2: 160, H1: [146, 182], H2: [144, 182] },
  ], scene: P.mat(30, 140) });
  def("pecdeck", { frames: [
    { ...BASE, view: "front", hip: [120, 140], t: 180, L1: [-30, 0], L2: [30, 0], A1: [-90, -180], A2: [90, 180], ab1: 1 },
    { ...BASE, view: "front", hip: [120, 140], t: 180, L1: [-30, 0], L2: [30, 0], A1: [-128, 168], A2: [128, -168] },
  ], scene: seg([98, 148], [142, 148], 8, C.pad) + seg([120, 152], [120, FLOOR], 4, C.line), props: (J) => seg(J.e1, J.h1, 5, C.padHi, ' opacity=".7"') + seg(J.e2, J.h2, 5, C.padHi, ' opacity=".7"') });
  def("fly", { frames: [
    { ...BASE, hip: [116, 146], T: [68, 145], n: 272, F1: [150, F0], F2: [147, F0], A1: [10, 50], A2: [8, 48] },
    { ...BASE, hip: [116, 146], T: [68, 145], n: 272, F1: [150, F0], F2: [147, F0], A1: [170, 190], A2: [168, 188] },
  ], scene: P.bench(52, 152, 84), props: (J) => P.dbSide(J.h1) });
  const FLYF = [
    sideFront({ A1: [-96, -100], A2: [96, 100] }),
    sideFront({ H1: [114, 92], H2: [126, 92], ab1: -1, ab2: 1 }),
  ];
  def("fly_cable", { frames: FLYF, props: (J) => P.cable([40, 60], J.h1) + P.cable([200, 60], J.h2) });
  def("fly_band", { frames: FLYF, props: (J) => seg(J.h1, [120, 74], 2.4, C.band) + seg(J.h2, [120, 74], 2.4, C.band) });

  // —— OMUZ ——
  def("shoulderpress", { frames: [
    { ...BASE, view: "front", hip: [120, 140], t: 180, L1: [-30, 0], L2: [30, 0], A1: [-80, -175], A2: [80, 175] },
    { ...BASE, view: "front", hip: [120, 140], t: 180, L1: [-30, 0], L2: [30, 0], A1: [-160, -175], A2: [160, 175] },
  ], scene: seg([98, 148], [142, 148], 8, C.pad) + seg([120, 152], [120, FLOOR], 4, C.line) + seg([120, 60], [120, 146], 8, C.pad), props: (J) => P.db(J.h1, 90) + P.db(J.h2, 90) });
  def("shoulderpress_m", { frames: A.shoulderpress.frames, scene: A.shoulderpress.scene, props: (J) => seg(add(J.h1, [-6, 0]), add(J.h1, [3, 0]), 4, C.metal) + seg(add(J.h2, [-3, 0]), add(J.h2, [6, 0]), 4, C.metal) });
  def("shoulderpress_band", { frames: [
    sideFront({ A1: [-80, -175], A2: [80, 175] }), sideFront({ A1: [-160, -175], A2: [160, 175] }),
  ], props: (J) => seg(J.h1, J.a1, 2.4, C.band) + seg(J.h2, J.a2, 2.4, C.band) });
  def("lateral", { frames: [
    sideFront({ A1: [-12, -8], A2: [12, 8] }), sideFront({ A1: [-86, -80], A2: [86, 80] }),
  ], props: (J) => P.db(J.h1, 0, 0.9) + P.db(J.h2, 0, 0.9) });
  def("lateral_band", { frames: A.lateral.frames, props: (J) => seg(J.h1, J.a1, 2.4, C.band) + seg(J.h2, J.a2, 2.4, C.band) });
  def("lateral_cable", { frames: A.lateral.frames, props: (J) => P.cable([200, 180], J.h1) });
  def("reversefly_m", { frames: [
    { ...BASE, view: "front", hip: [120, 140], t: 180, L1: [-30, 0], L2: [30, 0], A1: [-150, -170], A2: [150, 170] },
    { ...BASE, view: "front", hip: [120, 140], t: 180, L1: [-30, 0], L2: [30, 0], A1: [-92, -96], A2: [92, 96] },
  ].map((f, i) => { if (!i) { delete f.A1; delete f.A2; f.H1 = [114, 92]; f.H2 = [126, 92]; f.ab1 = -1; f.ab2 = 1; } return f; }),
    scene: seg([98, 148], [142, 148], 8, C.pad) + seg([120, 152], [120, FLOOR], 4, C.line), props: (J) => seg(add(J.h1, [0, -7]), add(J.h1, [0, 7]), 4, C.metal) + seg(add(J.h2, [0, -7]), add(J.h2, [0, 7]), 4, C.metal) });
  def("pullapart", { frames: [
    sideFront({ H1: [112, 76], H2: [128, 76], ab1: -1, ab2: 1 }), sideFront({ A1: [-92, -94], A2: [92, 94] }),
  ], props: (J) => seg(J.h1, J.h2, 2.4, C.band) });
  def("facepull", { frames: [
    stand({ H1: [150, 64], H2: [148, 66] }),
    stand({ H1: [120, 52], H2: [118, 54], ab1: -1, A1: undefined }),
  ].map((f, i) => { if (i) { delete f.H1; f.A1 = [100, 225]; f.A2 = [96, 222]; } return f; }), props: (J) => P.cable([210, 54], J.h1) });
  def("reversefly_db", { frames: [
    { ...BASE, view: "front", hip: [120, 116], t: 180, F1: [108, F0], F2: [132, F0], A1: [-8, 6], A2: [8, -6] },
    { ...BASE, view: "front", hip: [120, 116], t: 180, F1: [108, F0], F2: [132, F0], A1: [-80, -84], A2: [80, 84] },
  ], props: (J) => P.db(J.h1, 0, 0.8) + P.db(J.h2, 0, 0.8), note: "öne eğilmiş" });

  // —— KOL ——
  def("curl", { frames: [
    stand({ A1: [4, 6], A2: [-2, 2] }), stand({ A1: [2, 150], A2: [-4, 146] }),
  ], props: (J) => P.dbSide(J.h1) });
  def("curl_hammer", { frames: A.curl.frames, props: (J) => P.db(J.h1, 0, 0.9) });
  def("curl_cable", { frames: A.curl.frames, props: (J) => P.cable([150, 180], J.h1) });
  def("curl_band", { frames: A.curl.frames, props: (J) => seg(J.h1, J.a1, 2.4, C.band) });
  def("curl_bb", { frames: A.curl.frames, props: (J) => P.plate(J.h1, 12) });
  def("pushdown", { frames: [
    stand({ t: 174, A1: [6, 150], A2: [2, 148] }), stand({ t: 174, A1: [8, 12], A2: [4, 10] }),
  ], props: (J) => P.cable([150, 30], J.h1) });
  def("pushdown_band", { frames: A.pushdown.frames, props: (J) => P.band([150, 30], J.h1) });
  def("overhead_ext", { frames: [
    { ...BASE, hip: [98, 140], t: 182, F1: [130, F0], F2: [127, F0], A1: [176, 340], A2: [174, 336] },
    { ...BASE, hip: [98, 140], t: 182, F1: [130, F0], F2: [127, F0], A1: [176, 182], A2: [174, 180] },
  ], scene: P.bench(70, 148, 44), props: (J) => P.db(J.h1, 0, 1) });
  def("kickback_db", { frames: [
    { ...BASE, hip: [70, 122], t: 100, n: 106, F1: [72, F0], F2: [66, F0], H2: [130, 152], A1: [-80, 10] },
    { ...BASE, hip: [70, 122], t: 100, n: 106, F1: [72, F0], F2: [66, F0], H2: [130, 152], A1: [-80, -84] },
  ], scene: P.bench(100, 154, 60), props: (J) => P.dbSide(J.h1) });
  def("dip_bench", { frames: [
    { ...BASE, hip: [112, 142], t: 186, F1: [170, F0], F2: [168, F0], H1: [100, 146], H2: [98, 146], ab1: 1, ab2: 1 },
    { ...BASE, hip: [114, 162], t: 182, F1: [170, F0], F2: [168, F0], H1: [100, 146], H2: [98, 146], ab1: 1, ab2: 1 },
  ], scene: P.bench(60, 148, 46) });

  // —— SIRT ——
  def("pulldown", { frames: [
    { ...BASE, view: "front", hip: [120, 140], t: 180, L1: [-60, 10], L2: [60, -10], A1: [-168, -176], A2: [168, 176] },
    { ...BASE, view: "front", hip: [120, 140], t: 180, L1: [-60, 10], L2: [60, -10], A1: [-60, -168], A2: [60, 168] },
  ], scene: seg([98, 148], [142, 148], 8, C.pad) + seg([120, 152], [120, FLOOR], 4, C.line) + seg([120, 4], [120, 14], 1.4, C.cable),
    props: (J) => seg(add(J.h1, [-10, 0]), add(J.h2, [10, 0]), 4, C.metal) + seg([120, 4], [120, J.h1[1]], 1.4, C.cable) + seg(add(J.k1, [-4, -6]), add(J.k2, [4, -6]), 6, C.pad) });
  def("pulldown_band", { frames: [
    { ...BASE, view: "front", hip: [120, 150], t: 180, L1: [0, -90], L2: [0, 90], A1: [-168, -176], A2: [168, 176] },
    { ...BASE, view: "front", hip: [120, 150], t: 180, L1: [0, -90], L2: [0, 90], A1: [-60, -168], A2: [60, 168] },
  ].map((f) => { f.L1 = [-30, 0]; f.L2 = [30, 0]; f.hip = [120, 140]; return f; }), scene: seg([98, 148], [142, 148], 8, C.pad) + seg([120, 152], [120, FLOOR], 4, C.line), props: (J) => P.band([120, 4], J.h1) + P.band([120, 4], J.h2) });
  def("assist_pullup", { frames: [
    { ...BASE, view: "front", hip: [120, 132], t: 180, L1: [-10, 30], L2: [10, -30], A1: [-168, -176], A2: [168, 176] },
    { ...BASE, view: "front", hip: [120, 156], t: 180, L1: [-10, 30], L2: [10, -30], A1: [-60, -168], A2: [60, 168] },
  ], dyn: true, props: (J) => seg([84, J.h1[1] - 2], [156, J.h1[1] - 2], 4, C.metal) + seg(add(J.k1, [-6, 6]), add(J.k2, [6, 6]), 7, C.pad) });
  def("straightarm", { frames: [
    stand({ t: 166, A1: [168, 170], A2: [166, 168] }), stand({ t: 166, A1: [20, 24], A2: [18, 22] }),
  ], props: (J) => P.cable([170, 20], J.h1) });
  def("row_cable", { frames: [
    { ...BASE, hip: [84, 160], t: 172, F1: [146, 168], F2: [143, 168], ft1: 175, ft2: 175, H1: [140, 136], H2: [138, 136] },
    { ...BASE, hip: [84, 160], t: 188, F1: [146, 168], F2: [143, 168], ft1: 175, ft2: 175, A1: [-60, 80], A2: [-62, 78] },
  ], scene: seg([60, 170], [104, 170], 8, C.pad) + seg([150, 150], [150, 180], 6, C.line) + seg([60, FLOOR], [160, FLOOR], 4, C.line), props: (J) => P.cable([170, 136], J.h1) });
  def("row_band", { frames: A.row_cable.frames, scene: P.mat(50, 120), props: (J) => P.band(J.a1, J.h1) });
  def("row_cs", { frames: [
    { ...BASE, hip: [72, 140], T: [112, 108], n: 128, F1: [56, F0], F2: [53, F0], H1: [124, 164], H2: [122, 164] },
    { ...BASE, hip: [72, 140], T: [112, 108], n: 128, F1: [56, F0], F2: [53, F0], A1: [-40, 70], A2: [-42, 68] },
  ], scene: seg([74, 146], [130, 104], 8, C.pad) + seg([96, 134], [96, FLOOR], 4, C.line), props: (J) => P.dbSide(J.h1) });
  def("row_db", { frames: [
    { ...BASE, hip: [74, 112], t: 104, n: 110, F1: [76, F0], F2: [62, F0], H2: [124, 150], A1: [4, -2] },
    { ...BASE, hip: [74, 112], t: 104, n: 110, F1: [76, F0], F2: [62, F0], H2: [124, 150], A1: [-60, 70] },
  ], scene: P.bench(96, 152, 60), props: (J) => P.dbSide(J.h1) });
  def("row_inverted", { frames: [
    { ...BASE, hip: [100, 160], T: [146, 150], n: 104, F1: [56, F0], F2: [54, F0], ft1: 180, ft2: 180, H1: [154, 114], H2: [152, 114] },
    { ...BASE, hip: [100, 140], T: [146, 128], n: 106, F1: [56, F0], F2: [54, F0], ft1: 180, ft2: 180, H1: [154, 114], H2: [152, 114] },
  ], scene: seg([140, 114], [190, 114], 4, C.metal) + seg([190, 114], [190, FLOOR], 4, C.line) });

  // —— KARIN / CORE ——
  def("deadbug", { frames: [
    { ...BASE, hip: [124, 176], T: [76, 177], n: 272, L1: [180, 90], L2: [180, 90], A1: [180, 180], A2: [180, 180] },
    { ...BASE, hip: [124, 176], T: [76, 177], n: 272, L1: [100, 100], L2: [180, 90], A1: [180, 180], A2: [260, 266] },
  ], scene: P.mat(40, 150) });
  def("plank", { frames: [
    { ...BASE, hip: [96, 160], T: [142, 152], n: 108, F1: [40, F0], F2: [38, F0], ft1: 160, ft2: 160, H1: [158, 182], H2: [156, 182], A1: [0, 90], A2: [0, 90] },
    { ...BASE, hip: [96, 159], T: [142, 151], n: 108, F1: [40, F0], F2: [38, F0], ft1: 160, ft2: 160, A1: [0, 90], A2: [0, 90] },
  ].map((f) => { delete f.H1; delete f.H2; return f; }), scene: P.mat(30, 150), dur: [2, 2], hold: [0, 0] });
  def("plank_knee", { frames: [
    { ...BASE, hip: [104, 160], T: [148, 150], n: 110, L1: [-70, 0], L2: [-72, 0], A1: [0, 90], A2: [0, 90] },
    { ...BASE, hip: [104, 159], T: [148, 149], n: 110, L1: [-70, 0], L2: [-72, 0], A1: [0, 90], A2: [0, 90] },
  ], scene: P.mat(40, 140), dur: [2, 2], hold: [0, 0] });
  def("plank_incline", { frames: [
    { ...BASE, hip: [96, 126], T: [138, 106], n: 116, F1: [50, F0], F2: [48, F0], ft1: 150, ft2: 150, A1: [8, 96], A2: [8, 96] },
    { ...BASE, hip: [96, 125], T: [138, 105], n: 116, F1: [50, F0], F2: [48, F0], ft1: 150, ft2: 150, A1: [8, 96], A2: [8, 96] },
  ], scene: P.bench(124, 134, 54), dur: [2, 2], hold: [0, 0] });
  def("birddog", { frames: [
    { ...QB },
    { ...QB, A1: [96, 96], L2: [-88, -88], ft2: 270 },
  ], scene: P.mat(20, 150) });
  def("sideplank", { frames: [
    { ...BASE, view: "front", hip: [110, 172], t: 106, n: 106, L1: [-80, -80], L2: [-80, -80], A1: [0, 90], A2: [-160, -170] },
    { ...BASE, view: "front", hip: [110, 162], t: 112, n: 112, L1: [-73, -73], L2: [-73, -73], A1: [-6, 90], A2: [-160, -170] },
  ], scene: P.mat(30, 170), dur: [2, 2], hold: [0, 0] });
  def("pallof", { frames: [
    stand({ hip: [110, 112], H1: [126, 76], H2: [124, 76] }),
    stand({ hip: [110, 112], H1: [150, 76], H2: [148, 76] }),
  ], props: (J) => P.cable([40, 70], J.h1) + dot(J.h1, 3.5, C.metal) });
  def("crunch", { frames: [
    { ...BASE, hip: [118, 176], T: [70, 176], n: 272, F1: [146, F0], F2: [143, F0], A1: [130, 120], A2: [128, 118] },
    { ...BASE, hip: [118, 176], T: [76, 154], n: 300, F1: [146, F0], F2: [143, F0], A1: [104, 96], A2: [102, 94] },
  ], scene: P.mat(40, 140) });
  def("revcrunch", { frames: [
    { ...BASE, hip: [122, 176], T: [74, 177], n: 272, L1: [150, 30], L2: [150, 30], A1: [-90, -90], A2: [-90, -90] },
    { ...BASE, hip: [120, 170], T: [74, 177], n: 272, L1: [200, 120], L2: [200, 120], A1: [-90, -90], A2: [-90, -90] },
  ].map((f) => { f.A1 = [270, 270]; f.A2 = [270, 270]; return f; }), scene: P.mat(40, 140) });
  def("cablecrunch", { frames: [
    { ...BASE, hip: [96, 128], t: 172, n: 172, L1: [-2, -90], L2: [-4, -92], A1: [150, 30], A2: [148, 28] },
    { ...BASE, hip: [96, 128], t: 110, n: 100, L1: [-2, -90], L2: [-4, -92], A1: [100, 0], A2: [98, 0] },
  ], props: (J) => P.cable([110, 20], J.h1) });
  def("farmer", { frames: [
    stand({ F1: [126, F0], F2: [96, F0], ft2: 120, H1: [112, 140], H2: [110, 140] }),
    stand({ hip: [120, 109], F1: [120, F0], F2: [122, F0 - 12], H1: [120, 140], H2: [118, 140] }),
    stand({ hip: [126, 110], F1: [110, F0], F2: [144, F0], ft1: 120, H1: [126, 140], H2: [124, 140] }),
  ], dur: [0.5, 0.5, 0.8], props: (J) => P.db(J.h1, 0, 1) });

  // —— KARDİYO ——
  def("walk", { frames: [
    stand({ hip: [110, 110], t: 176, F1: [128, F0 - 2], F2: [90, F0 - 2], ft2: 120, A1: [-20, -10], A2: [24, 60] }),
    stand({ hip: [110, 108], t: 176, F1: [112, F0 - 2], F2: [104, F0 - 14], A1: [0, 10], A2: [0, 10] }),
    stand({ hip: [110, 110], t: 176, F1: [90, F0 - 2], F2: [128, F0 - 2], ft1: 120, A1: [24, 60], A2: [-20, -10] }),
    stand({ hip: [110, 108], t: 176, F1: [104, F0 - 14], F2: [112, F0 - 2], A1: [0, 10], A2: [0, 10] }),
  ], dur: [0.35, 0.35, 0.35, 0.35], hold: [0, 0, 0, 0], ease: false, scene: P.tread(64, 110) });
  def("walk_out", { frames: A.walk.frames, dur: A.walk.dur, hold: A.walk.hold, ease: false });
  def("bike", { frames: [0, 90, 180, 270].map((d) => ({ ...BASE, hip: [94, 112], t: 160, n: 150, H1: [146, 92], H2: [144, 92], F1: [120 + 14 * Math.sin(d * D), 160 + 14 * Math.cos(d * D)], F2: [120 - 14 * Math.sin(d * D), 160 - 14 * Math.cos(d * D)] })),
    dur: [0.3, 0.3, 0.3, 0.3], hold: [0, 0, 0, 0], ease: false,
    scene: seg([94, 118], [116, 160], 5, C.line) + seg([116, 160], [150, 96], 5, C.line) + seg([80, 118], [102, 118], 7, C.pad) + seg([140, 92], [154, 92], 4, C.metal) + seg([100, FLOOR], [150, FLOOR], 5, C.line) + seg([120, 160], [120, FLOOR], 5, C.line) + dot([120, 160], 9, "none", ` stroke="${C.line}" stroke-width="3"`) });
  def("elliptical", { frames: [0, 90, 180, 270].map((d) => ({ ...BASE, hip: [110, 94 + 3 * Math.cos(d * D)], t: 178, H1: [128 + 10 * Math.sin(d * D), 64], H2: [128 - 10 * Math.sin(d * D), 64], F1: [112 + 18 * Math.sin(d * D), 162 + 5 * Math.cos(d * D)], F2: [112 - 18 * Math.sin(d * D), 162 - 5 * Math.cos(d * D)] })),
    dur: [0.4, 0.4, 0.4, 0.4], hold: [0, 0, 0, 0], ease: false,
    scene: seg([70, 172], [170, 172], 5, C.line) + seg([150, 172], [146, 60], 4, C.line) },);
  def("rower", { frames: [
    { ...BASE, hip: [76, 164], t: 150, n: 140, F1: [112, 160], F2: [110, 160], ft1: 170, ft2: 170, H1: [130, 140], H2: [128, 140] },
    { ...BASE, hip: [104, 164], t: 196, n: 196, F1: [160, 162], F2: [158, 162], ft1: 175, ft2: 175, A1: [-40, 80], A2: [-42, 78] },
  ], dur: [0.8, 1.4], hold: [0, 0], scene: seg([40, 172], [200, 172], 5, C.line) + seg([162, 150], [166, 176], 6, C.line), props: (J) => P.cable([176, 150], J.h1) + seg([J.hip[0] - 14, 170], [J.hip[0] + 12, 170], 7, C.pad) });
  def("stair", { frames: [
    stand({ hip: [110, 98], t: 172, F1: [122, 150], F2: [104, F0 - 10], H1: [146, 102], H2: [144, 102] }),
    stand({ hip: [112, 90], t: 172, F1: [120, 160], F2: [116, 138], H1: [146, 102], H2: [144, 102] }),
    stand({ hip: [110, 98], t: 172, F1: [104, F0 - 10], F2: [122, 150], H1: [146, 102], H2: [144, 102] }),
    stand({ hip: [112, 90], t: 172, F1: [116, 138], F2: [120, 160], H1: [146, 102], H2: [144, 102] }),
  ], dur: [0.45, 0.45, 0.45, 0.45], hold: [0, 0, 0, 0], ease: false, scene: seg([150, 100], [150, FLOOR], 4, C.line) + seg([140, 100], [160, 100], 4, C.metal) });
  def("march", { frames: [
    stand({ F1: [116, 160], F2: [108, F0], ft1: 110, A1: [-20, -10], A2: [30, 80] }),
    stand({ F1: [112, F0], F2: [108, F0], A1: [0, 6], A2: [0, 6] }),
    stand({ F1: [112, F0], F2: [114, 160], ft2: 110, A1: [30, 80], A2: [-20, -10] }),
    stand({ F1: [112, F0], F2: [108, F0], A1: [0, 6], A2: [0, 6] }),
  ], dur: [0.35, 0.35, 0.35, 0.35], hold: [0, 0, 0, 0] });

  // —— ISINMA / ESNEME ——
  def("armcircle", { frames: [0, 90, 180, 270].map((d) => sideFront({ A1: [-90 - 25 * Math.cos(d * D), -90 - 25 * Math.cos(d * D)], A2: [90 + 25 * Math.cos(d * D), 90 + 25 * Math.cos(d * D)], hip: [120, 109 + 0 * d] })),
    dur: [0.4, 0.4, 0.4, 0.4], hold: [0, 0, 0, 0], ease: false });
  def("hipcircle", { frames: [0, 90, 180, 270].map((d) => sideFront({ hip: [120 + 7 * Math.sin(d * D), 110 + 2 * Math.cos(d * D)], t: 180 - 5 * Math.sin(d * D), H1: [110 + 7 * Math.sin(d * D), 112], H2: [130 + 7 * Math.sin(d * D), 112], ab1: -1, ab2: 1 })),
    dur: [0.5, 0.5, 0.5, 0.5], hold: [0, 0, 0, 0], ease: false });
  def("legswing", { frames: [
    stand({ L1: [50, 40], H1: [112, 150], H2: [112, 150] }),
    stand({ L1: [-30, -34], H1: [112, 150], H2: [112, 150] }),
  ].map((f) => { delete f.F1; return f; }), dur: [0.7, 0.7], hold: [0, 0], scene: P.wall(150) });
  def("catcow", { frames: [
    { ...QB, T: [128, 136], n: 140 },
    { ...QB, T: [128, 126], n: 70 },
  ], dur: [1.4, 1.4], scene: P.mat(30, 150) });
  def("stretch_quad", { frames: [
    stand({ L1: [-6, 170], H1: [104, 128], H2: [150, 66] }),
    stand({ L1: [-10, 172], H1: [102, 126], H2: [150, 66] }),
  ].map((f) => { delete f.F1; f.ab1 = 1; return f; }), scene: P.wall(156), dur: [2, 2], hold: [0, 0] });
  def("stretch_ham", { frames: [
    { ...BASE, hip: [88, 144], t: 170, F1: [150, 152], F2: [116, F0], H1: [136, 146], H2: [134, 146] },
    { ...BASE, hip: [88, 144], t: 136, n: 128, F1: [150, 152], F2: [116, F0], H1: [146, 150], H2: [144, 150] },
  ], scene: P.bench(56, 150, 120), dur: [2, 2], hold: [0.6, 1.5] });
  def("stretch_chest", { frames: [
    stand({ A1: [270, 270], A2: [8, 10] }), stand({ t: 186, A1: [266, 272], A2: [8, 10] }),
  ], scene: P.wall(64), dur: [2, 2], hold: [0.5, 1.5] });
  def("childpose", { frames: [
    { ...BASE, hip: [80, 168], t: 98, n: 80, L1: [80, 268], L2: [80, 268], ft1: 270, ft2: 270, A1: [92, 90], A2: [90, 90] },
    { ...BASE, hip: [78, 170], t: 96, n: 78, L1: [84, 268], L2: [84, 268], ft1: 270, ft2: 270, A1: [92, 90], A2: [90, 90] },
  ], scene: P.mat(20, 160), dur: [2, 2], hold: [0.5, 0.5] });
  def("stretch_hipflex", { frames: [
    { ...BASE, hip: [92, 136], t: 182, F1: [130, F0], F2: [56, F0 - 1], ft2: 180, H1: [118, 116], H2: [116, 116] },
    { ...BASE, hip: [98, 140], t: 186, F1: [130, F0], F2: [56, F0 - 1], ft2: 180, H1: [120, 120], H2: [118, 120] },
  ], scene: P.mat(40, 140), dur: [2, 2], hold: [0.5, 1.5] });
  def("stretch_calf", { frames: [
    stand({ hip: [104, 108], t: 166, F1: [130, F0], F2: [72, F0], H1: [152, 66], H2: [152, 68] }),
    stand({ hip: [110, 110], t: 162, F1: [130, F0], F2: [72, F0], H1: [152, 66], H2: [152, 68] }),
  ], scene: P.wall(158), dur: [2, 2], hold: [0.5, 1.5] });
  def("stretch_lat", { frames: [
    sideFront({ A1: [-170, -176], A2: [178, 186] }),
    sideFront({ t: 166, A1: [-150, -160], A2: [160, 150] }),
  ], dur: [2, 2], hold: [0.5, 1.5] });

  /* ---------- kas → vücut parçası eşlemesi (renklendirme için) ---------- */
  const PART = {
    torso: ["chest", "abs", "obliques", "lats", "upperback", "lowerback"],
    trap: ["traps"],
    delt: ["shoulders_front", "shoulders_side", "shoulders_rear"],
    ua: ["biceps", "triceps"],
    fa: ["forearms"],
    glute: ["glutes", "glute_med", "hipflexors"],
    th: ["quads", "hamstrings", "adductors", "glute_med", "hipflexors"],
    sh: ["calves"],
  };
  const COL = { pri: "url(#gPri)", sec: "url(#gSec)", near: "#4b4c55", far: "#30313a", head: "#5b5c66" };

  function partColor(part, pri, sec, far) {
    const ids = PART[part];
    if (ids.some((m) => pri.includes(m))) return COL.pri;
    if (ids.some((m) => sec.includes(m))) return COL.sec;
    return far ? COL.far : COL.near;
  }

  function render(J, ex, sceneSvg, propsSvg) {
    const pri = ex.pri || [], sec = ex.sec || [];
    const front = J.view === "front";
    const pc = (p, far) => partColor(p, pri, sec, far);
    const limbArm = (i, far) => seg(J["s" + i], J["e" + i], 9, pc("ua", far)) + seg(J["e" + i], J["h" + i], 7.5, pc("fa", far)) + dot(J["h" + i], 4, far ? COL.far : COL.near);
    const limbLeg = (i, far) => seg(J["p" + i], J["k" + i], 13, pc("th", far)) + seg(J["k" + i], J["a" + i], 10, pc("sh", far)) + seg(J["a" + i], J["toe" + i], 6, far ? COL.far : COL.near);
    let s = "";
    s += sceneSvg || "";
    if (front) {
      s += limbLeg(1) + limbLeg(2);
      const tc = pc("torso");
      s += `<polygon points="${[J.s1, J.s2, J.p2, J.p1].map((p) => p.map((x) => x.toFixed(1)).join(",")).join(" ")}" fill="${tc}" stroke="${tc}" stroke-width="9" stroke-linejoin="round"/>`;
      s += seg(J.p1, J.p2, 12, pc("glute"));
      s += seg(J.sh, add(J.sh, v(J.view === "front" ? 180 : 180, 0)), 0, "none");
      s += dot(J.s1, 6, pc("delt")) + dot(J.s2, 6, pc("delt"));
      s += limbArm(1) + limbArm(2);
      s += seg(J.sh, J.head, 7, COL.near) + dot(J.head, LEN.head, COL.head);
    } else {
      s += limbArm(2, true) + limbLeg(2, true);
      s += seg(J.hip, J.sh, 21, pc("torso"));
      s += dot(J.hip, 10, pc("glute"));
      s += seg(add(J.sh, v(J.view === "front" ? 0 : 0, 0)), J.head, 7, pc("trap")) + dot(J.head, LEN.head, COL.head);
      s += limbLeg(1) + dot(J.sh, 6.5, pc("delt")) + limbArm(1);
    }
    s += propsSvg || "";
    return s;
  }

  const DEFS = `<defs>
    <linearGradient id="gPri" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="240" y2="200"><stop offset="0" stop-color="#ff3a2f"/><stop offset="1" stop-color="#d4141f"/></linearGradient>
    <linearGradient id="gSec" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="240" y2="200"><stop offset="0" stop-color="#ffa53a"/><stop offset="1" stop-color="#ff7417"/></linearGradient>
    <radialGradient id="gSpot" cx=".5" cy=".9" r=".7"><stop offset="0" stop-color="#ff3a2f" stop-opacity=".18"/><stop offset="1" stop-color="#ff3a2f" stop-opacity="0"/></radialGradient>
  </defs>`;
  const STAGE = `<rect x="0" y="0" width="240" height="200" fill="url(#gSpot)"/><line x1="10" y1="${FLOOR + 1.5}" x2="230" y2="${FLOOR + 1.5}" stroke="#3a3b42" stroke-width="2"/>`;

  function prepared(id) {
    const spec = A[id] || A.squat_bw;
    if (!spec._c) {
      let prev = null;
      spec._c = spec.frames.map((f) => { const full = Object.assign({}, prev || {}, f); prev = full; return canon(full); });
    }
    return spec;
  }

  // Tek kare (statik) SVG — liste küçük resimleri ve "fotoğraf" kareleri için
  function still(id, ex, frameIdx, crop) {
    const spec = prepared(id);
    const n = spec._c.length;
    const c = spec._c[frameIdx == null ? Math.min(1, n - 1) : frameIdx % n];
    const J = joints(c);
    return `<svg viewBox="${crop ? "18 28 204 166" : "0 0 240 200"}" class="fig" aria-hidden="true">${DEFS}${STAGE}${render(J, ex, spec.scene, spec.props ? spec.props(J) : "")}</svg>`;
  }

  // Canlı animasyon: bir kapsayıcıya yerleştirir, durdurmak için fonksiyon döndürür
  function animate(el, id, ex, opts = {}) {
    const spec = prepared(id);
    const fr = spec._c, n = fr.length;
    const speed = opts.speed || 1;
    const dur = spec.dur || (n === 2 ? [1.1, 1.3] : fr.map(() => 0.6));
    const hold = spec.hold || (n === 2 ? [0.5, 0.35] : fr.map(() => 0.15));
    const segs = [];
    let total = 0;
    for (let i = 0; i < n; i++) { segs.push({ i, start: total, hold: hold[i] || 0, move: dur[i] || 0.6 }); total += (hold[i] || 0) + (dur[i] || 0.6); }
    el.innerHTML = `<svg viewBox="0 0 240 200" class="fig" aria-hidden="true">${DEFS}${STAGE}<g class="g"></g></svg>`;
    const g = el.querySelector(".g");
    let raf = 0, t0 = performance.now(), paused = false, pausedAt = 0;
    const ease = spec.ease === false ? (k) => k : (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
    function frame(now) {
      const t = (((now - t0) / 1000) * speed) % total;
      let s = segs[n - 1];
      for (const x of segs) if (t >= x.start) s = x;
      const local = t - s.start;
      const a = fr[s.i], b = fr[(s.i + 1) % n];
      const k = local < s.hold ? 0 : ease(Math.min(1, (local - s.hold) / s.move));
      const J = joints(k === 0 ? a : mix(a, b, k));
      g.innerHTML = render(J, ex, spec.scene, spec.props ? spec.props(J) : "");
      if (opts.onPhase) opts.onPhase(s.i, k);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    return {
      stop() { cancelAnimationFrame(raf); },
      pause() { if (!paused) { paused = true; pausedAt = performance.now(); cancelAnimationFrame(raf); } },
      play() { if (paused) { paused = false; t0 += performance.now() - pausedAt; raf = requestAnimationFrame(frame); } },
      get paused() { return paused; },
    };
  }

  window.Figure = { still, animate, ids: () => Object.keys(A), count: (id) => prepared(id)._c.length };
})();
