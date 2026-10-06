/* ADIM — kas haritası: önden ve arkadan insan vücudu, çalışan kaslar renklenir.
   Ana kaslar kırmızı, yardımcı kaslar turuncu. Şekiller vücudun sol yarısı için çizilip aynalanır. */
(function () {
  const MUSCLES = {
    chest: "Göğüs",
    shoulders_front: "Ön omuz",
    shoulders_side: "Yan omuz",
    shoulders_rear: "Arka omuz",
    biceps: "Pazı (biceps)",
    triceps: "Arka kol (triceps)",
    forearms: "Ön kol / bilek",
    traps: "Trapez",
    upperback: "Sırt ortası",
    lats: "Kanat (latissimus)",
    lowerback: "Bel",
    abs: "Karın",
    obliques: "Yan karın",
    hipflexors: "Kalça önü",
    glutes: "Kalça (gluteus)",
    glute_med: "Yan kalça",
    quads: "Ön bacak (quadriceps)",
    hamstrings: "Arka bacak (hamstring)",
    adductors: "İç bacak",
    calves: "Baldır",
  };

  // Silüet (sol yarı, x=100 orta çizgi)
  const SIL_FRONT = "M100 14 C88 14 82 24 82 36 C82 46 86 54 90 57 L90 64 C84 67 76 68 66 70 C56 72 50 80 49 92 C47 108 46 128 45 150 C44 170 40 190 37 212 C35 226 33 238 34 248 C35 256 40 258 42 252 C44 242 46 230 50 214 C55 194 58 176 60 158 C61 146 63 132 66 122 C67 138 66 156 64 176 C62 192 60 204 60 214 C58 238 60 262 64 290 C66 304 66 314 66 324 C66 344 70 364 72 384 C72 394 70 402 74 406 L90 406 C92 400 88 392 88 384 C88 360 90 340 92 320 C92 308 92 300 94 290 C97 268 98 246 100 226 Z";
  const SIL_BACK = SIL_FRONT;

  // Kas şekilleri: [kas, yol, görünüm]
  const SHAPES_FRONT = [
    ["traps", "M90 60 C86 64 80 67 72 69 C80 70 88 71 96 70 C94 66 92 63 90 60 Z"],
    ["shoulders_front", "M70 72 C60 72 53 79 52 90 C51 98 53 104 56 108 C58 98 62 90 70 86 C74 82 76 77 70 72 Z"],
    ["shoulders_side", "M52 90 C50 98 50 106 52 114 C54 112 55 110 56 108 C53 104 51 98 52 90 Z"],
    ["chest", "M98 74 C90 72 80 72 72 76 C66 82 64 94 66 108 C72 118 84 122 98 118 Z"],
    ["biceps", "M56 112 C52 122 50 134 50 146 C52 152 56 154 59 150 C62 138 64 124 63 112 C61 108 58 108 56 112 Z"],
    ["forearms", "M49 158 C46 172 42 190 40 208 C40 214 42 218 45 216 C48 206 52 190 56 172 C58 164 57 158 54 156 C52 155 50 156 49 158 Z"],
    ["abs", "M98 124 C92 124 88 126 87 130 L87 186 C88 196 92 202 98 204 Z"],
    ["obliques", "M84 128 C76 128 71 132 69 140 C68 156 67 172 66 190 C72 196 78 200 84 202 C85 178 85 152 84 128 Z"],
    ["hipflexors", "M86 206 C80 206 74 210 72 216 C78 222 86 226 94 228 C96 220 93 210 86 206 Z"],
    ["glute_med", "M66 200 C62 206 61 214 62 222 C64 230 67 234 70 232 C70 222 70 212 70 204 Z"],
    ["quads", "M70 222 C64 238 62 258 64 280 C66 292 72 300 80 300 C88 298 92 290 93 278 C95 262 94 246 92 232 C86 226 78 222 70 222 Z"],
    ["adductors", "M94 232 C96 244 97 256 96 268 C94 276 92 282 90 286 C94 268 94 250 92 234 Z M93 230 C96 236 98 242 99 250 L99 232 Z"],
    ["calves", "M70 318 C67 332 67 348 70 364 C72 370 75 370 76 364 C77 350 78 334 76 320 C74 314 71 314 70 318 Z M88 320 C86 334 86 350 88 362 C90 356 92 340 92 324 Z"],
  ];
  const SHAPES_BACK = [
    ["traps", "M100 54 C96 60 90 66 74 70 C80 74 86 80 92 90 C96 100 98 112 100 124 Z"],
    ["shoulders_rear", "M72 70 C60 70 53 78 52 90 C52 100 54 106 57 110 C60 100 64 92 72 86 C76 82 78 76 72 70 Z"],
    ["shoulders_side", "M52 90 C50 98 50 106 52 114 C54 112 55 110 57 110 C54 104 52 98 52 90 Z"],
    ["upperback", "M90 92 C84 86 78 84 74 88 C74 100 78 114 84 124 C90 128 96 128 98 122 C96 112 94 100 90 92 Z"],
    ["lats", "M72 92 C68 104 67 120 68 140 C69 158 74 172 82 182 C88 186 94 186 96 180 C92 168 88 150 86 132 C80 124 75 110 72 92 Z"],
    ["lowerback", "M98 140 C94 140 90 146 90 156 L90 194 C92 200 96 202 99 202 Z"],
    ["obliques", "M68 150 C67 166 67 182 68 196 C74 196 80 194 86 192 C80 180 74 166 68 150 Z"],
    ["triceps", "M57 112 C52 120 50 134 50 148 C52 154 57 156 60 152 C63 140 64 126 63 114 C61 108 59 108 57 112 Z"],
    ["forearms", "M49 158 C46 172 42 190 40 208 C40 214 42 218 45 216 C48 206 52 190 56 172 C58 164 57 158 54 156 C52 155 50 156 49 158 Z"],
    ["glute_med", "M86 196 C78 194 70 196 64 202 C62 208 62 214 64 218 C72 212 80 208 88 206 Z"],
    ["glutes", "M99 206 C90 204 78 208 68 216 C62 226 62 240 66 250 C74 256 86 258 98 254 Z"],
    ["hamstrings", "M70 258 C66 272 65 288 67 304 C70 312 76 314 80 310 C82 296 82 278 80 260 C77 256 73 256 70 258 Z M84 260 C86 276 88 292 90 304 C93 300 95 286 96 270 C96 264 94 258 90 256 C87 256 85 258 84 260 Z"],
    ["calves", "M70 320 C66 332 66 346 69 358 C72 364 77 362 79 356 C80 344 80 330 78 320 C76 314 72 314 70 320 Z M82 320 C82 334 83 348 86 360 C90 356 92 344 92 332 C92 324 88 316 84 316 C83 317 82 318 82 320 Z"],
  ];

  function view(shapes, sil, pri, sec, dx, label, interactive) {
    const fill = (m) => (pri.includes(m) ? "url(#bmPri)" : sec.includes(m) ? "url(#bmSec)" : "#33343b");
    const cls = (m) => (pri.includes(m) ? "bm-pri" : sec.includes(m) ? "bm-sec" : "bm-off");
    const half = shapes.map(([m, d]) => `<path d="${d}" fill="${fill(m)}" class="${cls(m)}" data-m="${m}"${interactive ? ' role="button"' : ""}><title>${MUSCLES[m]}</title></path>`).join("");
    return `<g transform="translate(${dx},0)">
      <g><path d="${sil}" fill="#1f2026"/><g transform="translate(200,0) scale(-1,1)"><path d="${sil}" fill="#1f2026"/></g>
      <ellipse cx="100" cy="34" rx="16" ry="20" fill="#26272e"/></g>
      <g class="bm-half">${half}</g>
      <g transform="translate(200,0) scale(-1,1)" class="bm-half">${half}</g>
      <text x="100" y="424" text-anchor="middle" class="bm-label">${label}</text>
    </g>`;
  }

  function svg(pri = [], sec = [], opts = {}) {
    return `<svg viewBox="0 0 420 432" class="bodymap${opts.interactive ? " interactive" : ""}" role="img" aria-label="Çalışan kaslar">
      <defs>
        <linearGradient id="bmPri" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="430"><stop offset="0" stop-color="#ff4a3d"/><stop offset="1" stop-color="#d0101c"/></linearGradient>
        <linearGradient id="bmSec" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="430"><stop offset="0" stop-color="#ffae45"/><stop offset="1" stop-color="#ff7417"/></linearGradient>
        <filter id="bmGlow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      ${view(SHAPES_FRONT, SIL_FRONT, pri, sec, 0, "ÖN", opts.interactive)}
      ${view(SHAPES_BACK, SIL_BACK, pri, sec, 220, "ARKA", opts.interactive)}
    </svg>`;
  }

  window.BodyMap = { svg, MUSCLES };
})();
