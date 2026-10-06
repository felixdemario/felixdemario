/* ADIM — hareket kütüphanesi
   slot: aynı işlevi gören hareketlerin grubu. Salonunda bir alet yoksa aynı slot'tan başka hareket önerilir.
   d: zorluk 1 (çok kolay) – 5 (zor). eq: gereken aletler (boş = alet gerekmez).
   knee/back: dize / bele binen yük (0 az, 1 orta, 2 fazla). */
(function () {
  const EQUIPMENT = [
    { id: "dumbbell", n: "Dambıl", ico: "🏋️" },
    { id: "bench", n: "Ayarlı sehpa (bench)", ico: "🛋️" },
    { id: "cable", n: "Kablo / makara istasyonu", ico: "🔗" },
    { id: "legpress", n: "Leg press makinesi", ico: "🦵" },
    { id: "legext", n: "Leg extension (ön bacak) makinesi", ico: "🦵" },
    { id: "legcurl", n: "Leg curl (arka bacak) makinesi", ico: "🦵" },
    { id: "latpull", n: "Lat pulldown makinesi", ico: "⬇️" },
    { id: "chestpress", n: "Chest press (göğüs) makinesi", ico: "💪" },
    { id: "shoulderpress", n: "Shoulder press (omuz) makinesi", ico: "💪" },
    { id: "pecdeck", n: "Pec deck / butterfly makinesi", ico: "🦋" },
    { id: "abductor", n: "Abductor (kalça açma) makinesi", ico: "↔️" },
    { id: "assist", n: "Destekli barfiks makinesi", ico: "⬆️" },
    { id: "barbell", n: "Halter (barbell) ve sehpa", ico: "🏋️" },
    { id: "smith", n: "Smith makinesi", ico: "🏗️" },
    { id: "kettlebell", n: "Kettlebell", ico: "🔔" },
    { id: "box", n: "Step / basamak kutusu", ico: "📦" },
    { id: "ball", n: "Pilates topu", ico: "⚪" },
    { id: "band", n: "Direnç bandı (lastik)", ico: "🎗️" },
    { id: "mat", n: "Mat", ico: "🟥" },
    { id: "treadmill", n: "Koşu bandı", ico: "🏃" },
    { id: "bike", n: "Kondisyon bisikleti", ico: "🚴" },
    { id: "elliptical", n: "Eliptik bisiklet", ico: "⛷️" },
    { id: "rower", n: "Kürek makinesi", ico: "🚣" },
    { id: "stair", n: "Merdiven makinesi", ico: "🪜" },
  ];

  const SLOTS = {
    quad_main: { n: "Bacak – ana hareket", f: "Ön bacak ve kalçayı birlikte çalıştıran temel çömelme hareketi" },
    hinge: { n: "Kalça menteşe", f: "Kalça ve arka bacak (arka zincir), bel sağlığı" },
    single_leg: { n: "Tek bacak", f: "Denge, kalça ve ön bacak; sağ–sol farkını giderir" },
    quad_iso: { n: "Ön bacak izole", f: "Diz çevresi kaslarını tek başına güçlendirir" },
    ham_iso: { n: "Arka bacak izole", f: "Arka bacak (hamstring) kaslarını tek başına çalıştırır" },
    glute_iso: { n: "Kalça izole", f: "Yan ve arka kalça; diz ve kalça hizası" },
    calf: { n: "Baldır", f: "Baldır kasları, ayak bileği dengesi" },
    chest_press: { n: "Göğüs itiş", f: "Göğüs, ön omuz ve arka kol – itme gücü" },
    chest_fly: { n: "Göğüs açma", f: "Göğsü tek başına, gerdirerek çalıştırır" },
    shoulder_press: { n: "Omuz itiş", f: "Omuzları yukarı itme hareketiyle güçlendirir" },
    lateral: { n: "Yan omuz", f: "Omuz genişliği, yan omuz kası" },
    rear_delt: { n: "Arka omuz & duruş", f: "Arka omuz ve sırt üstü – dik duruş" },
    triceps: { n: "Arka kol", f: "Arka kol (triceps)" },
    vertical_pull: { n: "Dikey çekiş", f: "Kanat kası (lat) – sırt genişliği" },
    row: { n: "Yatay çekiş (row)", f: "Sırt ortası, kanat, arka omuz – dik duruş" },
    biceps: { n: "Pazı", f: "Ön kol üstü (biceps) ve bilek" },
    carry: { n: "Taşıma", f: "Kavrama gücü, karın ve duruş – tüm vücut" },
    core_antiext: { n: "Karın – sabitleme", f: "Belini koruyan derin karın kasları" },
    core_stab: { n: "Karın – denge", f: "Gövde dengesi, yan karın, bel sağlığı" },
    core_flex: { n: "Karın – mekik", f: "Düz karın kası" },
    cardio: { n: "Kardiyo", f: "Kalp-damar sağlığı ve yağ yakımı" },
    warmup: { n: "Isınma", f: "Eklemleri ve kasları harekete hazırlar" },
    stretch: { n: "Esneme", f: "Soğuma ve esneklik" },
  };

  const X = [];
  const ex = (o) => X.push(Object.assign({ eq: [], d: 1, kind: "reps", knee: 0, back: 0, sec: [], tips: [], avoid: [] }, o));

  /* ================= BACAK ================= */
  ex({ id: "leg_press", n: "Leg Press", en: "leg press machine proper form", slot: "quad_main", eq: ["legpress"], d: 1, anim: "legpress", knee: 1,
    pri: ["quads", "glutes"], sec: ["hamstrings", "adductors", "calves"],
    steps: ["Sırtını ve başını minderin tamamına yasla, kalçan oturağa otursun.", "Ayaklarını platformun ortasına omuz genişliğinde koy, parmak uçları hafif dışa baksın.", "Güvenlik kollarını aç; dizlerini yavaşça göğsüne doğru 90°'ye kadar bük.", "Topuklarınla iterek platformu yukarı it; dizlerini sonuna kadar kilitleme."],
    tips: ["Başlangıçta hafif ağırlık: 15 tekrar rahat yapabileceğin kadar.", "Belin minderden kalkmayacak kadar aşağı in — gerekiyorsa hareket açıklığını kısalt.", "Dizlerin ayak parmaklarınla aynı yöne baksın."],
    avoid: ["Dizleri tamamen kilitlemek", "Kalçayı minderden kaldıracak kadar derine inmek", "Dizlerin içe çökmesi"],
    breath: "İnerken nefes al, iterken ver.", note: "Kilolu başlangıç için en güvenli bacak hareketi: sırtın destekli, dengeyle uğraşmazsın." });
  ex({ id: "box_squat_bw", n: "Sehpaya Otur-Kalk (Box Squat)", en: "box squat bodyweight beginner", slot: "quad_main", eq: ["bench"], d: 1, anim: "squat_box", knee: 1,
    pri: ["quads", "glutes"], sec: ["hamstrings", "abs"],
    steps: ["Diz yüksekliğindeki bir sehpanın (ya da sandalyenin) önünde, ayaklar omuz genişliğinde dur.", "Kollarını öne uzat, göğsünü dik tut.", "Kalçanı geriye iterek sehpaya kontrollü otur — çökme, dokun.", "Topuklarından iterek ayağa kalk, sonunda kalçanı sık."],
    tips: ["Zor gelirse daha yüksek bir sehpa kullan; kolaylaştıkça alçalt.", "Dizlerin ayak uçlarını çok geçmesin, ağırlık topuklarda olsun."],
    avoid: ["Sehpaya bırakır gibi çökmek", "Kalkarken öne fazla eğilmek"], breath: "İnerken al, kalkarken ver.", note: "Gündelik hayattaki oturup kalkmayı güçlendirir; dizlere en dost squat çeşidi." });
  ex({ id: "goblet_box_squat", n: "Dambılla Sehpaya Squat", en: "goblet box squat dumbbell", slot: "quad_main", eq: ["dumbbell", "bench"], d: 2, anim: "squat_goblet_box", knee: 1,
    pri: ["quads", "glutes"], sec: ["hamstrings", "abs", "forearms"],
    steps: ["Dambılı dik tutarak iki elinle göğsünün önünde, çenenin altında kavra.", "Sehpanın önünde ayaklar omuz genişliğinde dur.", "Kalçanı geriye ve aşağı iterek sehpaya hafifçe dokun.", "Topuklarından iterek kalk; dirseklerin dizlerinin iç tarafında kalsın."],
    tips: ["Dambıl göğsüne yakın kalsın — gövdeni dik tutmana yardım eder.", "İlk hafta 4–8 kg yeterli."], avoid: ["Sırtı yuvarlamak", "Topukları kaldırmak"], breath: "İnerken al, kalkarken ver." });
  ex({ id: "bw_squat", n: "Vücut Ağırlığıyla Squat", en: "bodyweight squat form", slot: "quad_main", d: 2, anim: "squat_bw", knee: 1,
    pri: ["quads", "glutes"], sec: ["hamstrings", "abs"],
    steps: ["Ayaklar omuz genişliğinde, parmaklar hafif dışa.", "Kollarını öne uzat, sandalyeye oturur gibi kalçanı geri ve aşağı it.", "Rahat inebildiğin yere kadar in (uyluk yere paralel olmak zorunda değil).", "Topuklardan iterek kalk."],
    tips: ["Dengen zorlanırsa bir direğe hafifçe tutun."], avoid: ["Dizlerin içe çökmesi", "Topukların kalkması"], breath: "İnerken al, kalkarken ver." });
  ex({ id: "goblet_squat", n: "Goblet Squat", en: "goblet squat dumbbell", slot: "quad_main", eq: ["dumbbell"], d: 3, anim: "squat_goblet", knee: 2,
    pri: ["quads", "glutes"], sec: ["hamstrings", "abs", "adductors"],
    steps: ["Dambılı göğsünün önünde dik tut.", "Ayaklar omuz genişliğinden biraz açık.", "Göğsün dik, kalçanı aşağı indir; dirsekler dizlerin arasına girsin.", "Topuklarından iterek kalk."],
    tips: ["Sehpalı versiyonu rahat gelince buna geç."], avoid: ["Sırtın yuvarlanması", "Çok hızlı inmek"], breath: "İnerken al, kalkarken ver." });
  ex({ id: "smith_squat", n: "Smith Makinesinde Squat", en: "smith machine squat form", slot: "quad_main", eq: ["smith"], d: 3, anim: "squat_bar", knee: 2, back: 1,
    pri: ["quads", "glutes"], sec: ["hamstrings", "abs", "lowerback"],
    steps: ["Barı omuzlarının üst kısmına (boyun değil) yerleştir.", "Ayaklarını barın biraz önüne koy.", "Kalçanı geri iterek kontrollü in.", "Topuklarından iterek kalk."], tips: ["Önce boş barla öğren."], avoid: ["Barı boyna koymak", "Dizleri kilitlemek"], breath: "İnerken al, kalkarken ver." });
  ex({ id: "barbell_squat", n: "Halter Squat", en: "barbell back squat form beginner", slot: "quad_main", eq: ["barbell"], d: 4, anim: "squat_bar", knee: 2, back: 2,
    pri: ["quads", "glutes"], sec: ["hamstrings", "abs", "lowerback", "adductors"],
    steps: ["Barı sehpadan omuzlarının üst arkasına alarak çık.", "İki adım geri gel, ayaklar omuz genişliğinde.", "Göğsün dik, kalçanı geri ve aşağı it.", "Topuklardan iterek kalk."], tips: ["Mutlaka güvenlik kolları ayarlı sehpada yap."], avoid: ["Sırtı yuvarlamak", "Dizleri içe çökertmek"], breath: "İnmeden önce derin nefes al, kalkınca ver." });

  ex({ id: "glute_bridge", n: "Köprü (Glute Bridge)", en: "glute bridge exercise", slot: "hinge", eq: ["mat"], d: 1, anim: "bridge",
    pri: ["glutes"], sec: ["hamstrings", "lowerback", "abs"],
    steps: ["Sırtüstü yat, dizlerini bük, ayakların yere düz bassın.", "Kollar yanında, avuçlar yerde.", "Topuklarından iterek kalçanı yukarı kaldır; omuz–kalça–diz tek çizgi olsun.", "Tepede kalçanı 1–2 sn sık, yavaşça indir."],
    tips: ["Belinden değil kalçandan kalk — kalçanı sıkmayı düşün."], avoid: ["Beli aşırı kavislemek", "Ayak parmaklarıyla itmek"], breath: "Kaldırırken ver, indirirken al.", note: "Bele yük bindirmeden kalçayı güçlendirir — başlangıç için ideal." });
  ex({ id: "db_rdl", n: "Dambıl Romanian Deadlift", en: "dumbbell romanian deadlift form", slot: "hinge", eq: ["dumbbell"], d: 2, anim: "rdl", back: 1,
    pri: ["hamstrings", "glutes"], sec: ["lowerback", "forearms", "traps"],
    steps: ["Dambılları uyluklarının önünde tut, ayaklar kalça genişliğinde.", "Dizler hafif bükük kalsın, kalçanı geriye doğru it.", "Dambıllar bacaklarına yakın aşağı kaysın; arka bacağında gerilme hissedince dur (genelde diz altı).", "Kalçanı öne iterek doğrul, tepede kalçanı sık."],
    tips: ["Sırtın her zaman düz; göğüs açık.", "Hafif başla — form ağırlıktan önemli."], avoid: ["Sırtı yuvarlamak", "Squat'a dönüştürmek (dizleri fazla bükmek)"], breath: "İnerken al, kalkarken ver." });
  ex({ id: "kb_deadlift", n: "Kettlebell Deadlift", en: "kettlebell deadlift beginner", slot: "hinge", eq: ["kettlebell"], d: 2, anim: "kbdl", back: 1,
    pri: ["glutes", "hamstrings"], sec: ["quads", "lowerback", "forearms"],
    steps: ["Kettlebell ayaklarının arasında, ayaklar kalça genişliğinde.", "Kalçanı geri it, dizleri hafif bük, sırtın düz kalsın.", "Sapı iki elle kavra, omuzları geri çek.", "Topuklardan iterek ve kalçayı öne alarak dik dur."], tips: ["Sırtın nötr, bakış yerde 1–2 m önde."], avoid: ["Kollarla çekmek", "Sırtı yuvarlamak"], breath: "Kalkarken ver." });
  ex({ id: "hip_thrust", n: "Hip Thrust (Sehpada)", en: "dumbbell hip thrust bench", slot: "hinge", eq: ["bench", "dumbbell"], d: 3, anim: "hipthrust",
    pri: ["glutes"], sec: ["hamstrings", "quads", "abs"],
    steps: ["Kürek kemiklerini sehpanın kenarına daya, dambılı kalça kemiğinin üstüne koy.", "Ayaklar yere düz, diz hizasında.", "Topuklarından iterek kalçanı kaldır; gövden yere paralel olsun.", "Tepede 1 sn sık, kontrollü indir."], tips: ["Dambıl altına havlu koy."], avoid: ["Beli kavislemek", "Başı geriye atmak"], breath: "Kaldırırken ver." });
  ex({ id: "cable_pullthrough", n: "Kablo Pull-Through", en: "cable pull through", slot: "hinge", eq: ["cable"], d: 2, anim: "pullthrough", back: 1,
    pri: ["glutes", "hamstrings"], sec: ["lowerback", "abs"],
    steps: ["Makarayı en alta al, halat başlığını tak; makaraya sırtını dön.", "Halatı bacaklarının arasından tut, birkaç adım öne çık.", "Kalçanı geriye it, halat bacak aralarından geriye gitsin.", "Kalçanı öne iterek dik dur, tepede kalçanı sık."], tips: ["Kollar sadece tutar, işi kalça yapar."], avoid: ["Sırtla çekmek"], breath: "Doğrulurken ver." });
  ex({ id: "band_good_morning", n: "Lastikle Good Morning", en: "band good morning", slot: "hinge", eq: ["band"], d: 1, anim: "goodmorning", back: 1,
    pri: ["hamstrings", "glutes"], sec: ["lowerback"],
    steps: ["Lastiğin üzerine bas, diğer ucunu ense arkasından omuzlarına geçir.", "Dizler hafif bükük, sırt düz.", "Kalçanı geri iterek gövdeni öne eğ.", "Kalçayı öne iterek doğrul."], avoid: ["Sırtı yuvarlamak"], breath: "Doğrulurken ver." });

  ex({ id: "step_up", n: "Basamağa Çıkış (Step-Up)", en: "step up exercise beginner low box", slot: "single_leg", eq: ["box"], d: 2, anim: "stepup", knee: 1,
    pri: ["quads", "glutes"], sec: ["hamstrings", "calves", "glute_med"],
    steps: ["Alçak bir basamağın (20–30 cm) önünde dur; gerekirse bir yere tutun.", "Bir ayağını tamamen basamağa koy.", "O ayağın topuğundan iterek basamağa çık, diğer ayağı yanına getir.", "Kontrollü in; o bacakla tüm tekrarları bitir, sonra değiştir."],
    tips: ["Başlangıçta alçak basamak, gerekirse tutunarak.", "Arkadaki ayakla zıplayarak itme."], avoid: ["Dizin içe kaçması", "Çok yüksek basamak"], breath: "Çıkarken ver.", perSide: true });
  ex({ id: "step_up_bench", n: "Sehpaya Step-Up", en: "bench step up", slot: "single_leg", eq: ["bench"], d: 3, anim: "stepup", knee: 1,
    pri: ["quads", "glutes"], sec: ["hamstrings", "calves", "glute_med"],
    steps: ["Sehpanın önünde dur, bir ayağını sehpaya koy.", "Öndeki topuktan iterek çık.", "Kontrollü in.", "Tüm tekrarları bitir, bacak değiştir."], tips: ["Sehpa yüksekse önce basamakla başla."], avoid: ["Arka ayakla sıçramak"], breath: "Çıkarken ver.", perSide: true });
  ex({ id: "reverse_lunge", n: "Destekli Geri Lunge", en: "supported reverse lunge", slot: "single_leg", d: 2, anim: "lunge_rev", knee: 1,
    pri: ["quads", "glutes"], sec: ["hamstrings", "adductors", "calves"],
    steps: ["Bir direğe ya da sehpaya hafifçe tutun.", "Bir bacağınla geriye büyük bir adım at.", "Arka dizin yere yaklaşana kadar dikey in.", "Öndeki topuktan iterek başlangıca dön."], tips: ["Öne lunge'a göre dizlere daha dosttur."], avoid: ["Ön dizin içe kaçması", "Gövdeyi öne yatırmak"], breath: "İnerken al, kalkarken ver.", perSide: true });
  ex({ id: "split_squat", n: "Split Squat", en: "split squat form", slot: "single_leg", d: 3, anim: "splitsquat", knee: 1,
    pri: ["quads", "glutes"], sec: ["hamstrings", "adductors"],
    steps: ["Bir ayak önde, bir ayak arkada adım pozisyonunda dur.", "Gövden dik, aşağı in — arka diz yere yaklaşsın.", "Öndeki topuktan iterek kalk.", "Tekrarları bitirince bacak değiştir."], avoid: ["Ön topuğu kaldırmak"], breath: "İnerken al, kalkarken ver.", perSide: true });
  ex({ id: "db_lunge", n: "Dambılla Geri Lunge", en: "dumbbell reverse lunge", slot: "single_leg", eq: ["dumbbell"], d: 4, anim: "lunge_rev", knee: 2,
    pri: ["quads", "glutes"], sec: ["hamstrings", "adductors", "forearms"],
    steps: ["Dambılları iki yanında tut.", "Geriye adım at, arka diz yere yaklaşana kadar in.", "Öndeki topuktan iterek dön.", "Bacak değiştir."], avoid: ["Dengesiz, hızlı adımlar"], breath: "İnerken al, kalkarken ver.", perSide: true });

  ex({ id: "leg_extension", n: "Leg Extension", en: "leg extension machine form", slot: "quad_iso", eq: ["legext"], d: 1, anim: "legext", knee: 1,
    pri: ["quads"], sec: [],
    steps: ["Makineye otur, diz eklemin makinenin dönme noktasıyla hizalansın.", "Ayak bileği minderi ayak bileğinin hemen üstünde olsun.", "Bacaklarını kontrollü şekilde düzleştir, tepede 1 sn sık.", "Yavaşça indir (2–3 sn)."], tips: ["Hafif ağırlıkla, yüksek tekrar — dizlerin bunu sever."], avoid: ["Ağırlığı savurmak", "Kalçayı oturaktan kaldırmak"], breath: "Kaldırırken ver." });
  ex({ id: "wall_sit", n: "Duvarda Oturma (Wall Sit)", en: "wall sit exercise", slot: "quad_iso", d: 2, anim: "wallsit", kind: "time", knee: 1,
    pri: ["quads"], sec: ["glutes", "adductors"],
    steps: ["Sırtını duvara yasla, ayaklarını 40–50 cm öne al.", "Sırtını duvardan kaydırarak in — dizler 90° olmak zorunda değil, rahat açıda kal.", "Süre bitene kadar pozisyonu koru.", "Ellerini dizine koymadan dur."], tips: ["Başlangıçta yüksekte dur, haftalar geçtikçe alçal."], avoid: ["Nefes tutmak"], breath: "Normal ve düzenli nefes al." });
  ex({ id: "band_knee_ext", n: "Lastikle Oturarak Diz Açma", en: "seated resistance band leg extension", slot: "quad_iso", eq: ["band", "bench"], d: 1, anim: "legext", knee: 0,
    pri: ["quads"], sec: [],
    steps: ["Sehpaya otur, lastiğin bir ucunu sehpa ayağına, diğerini ayak bileğine bağla.", "Bacağını düzleştir, tepede 1 sn tut.", "Yavaşça indir.", "Bacak değiştir."], breath: "Açarken ver.", perSide: true });

  ex({ id: "leg_curl", n: "Leg Curl (Oturarak)", en: "seated leg curl machine form", slot: "ham_iso", eq: ["legcurl"], d: 1, anim: "legcurl",
    pri: ["hamstrings"], sec: ["calves"],
    steps: ["Makineye otur, dizin dönme noktasıyla hizalı olsun.", "Uyluk minderini sabitle, ayak bileği minderi baldırının alt ucunda.", "Topuklarını aşağı ve geriye doğru çek.", "Yavaşça geri bırak."], tips: ["Makine yatarak yapılan türdeyse aynı mantık: topukları kalçana çek."], avoid: ["Kalçayı oturaktan kaldırmak", "Ağırlığı savurmak"], breath: "Çekerken ver." });
  ex({ id: "heel_bridge", n: "Topukla Köprü", en: "heel bridge hamstring", slot: "ham_iso", eq: ["mat"], d: 1, anim: "bridge_heel",
    pri: ["hamstrings", "glutes"], sec: ["lowerback"],
    steps: ["Sırtüstü yat, topuklarını kalçandan biraz uzağa, sadece topuklar yere değecek şekilde koy.", "Topuklarını yere bastırıp kendine doğru çekiyormuş gibi kalçanı kaldır.", "Tepede 2 sn tut.", "Yavaşça indir."], tips: ["Arka bacakta kasılmayı hissetmelisin."], avoid: ["Beli kavislemek"], breath: "Kaldırırken ver." });
  ex({ id: "band_leg_curl", n: "Lastikle Bacak Bükme", en: "resistance band hamstring curl", slot: "ham_iso", eq: ["band"], d: 1, anim: "legcurl",
    pri: ["hamstrings"], sec: [],
    steps: ["Lastiği önündeki sabit bir yere bağla, otur ve ayak bileğine geçir.", "Topuğunu aşağı ve geriye doğru çek.", "Yavaşça geri bırak.", "Bacak değiştir."], breath: "Çekerken ver.", perSide: true });
  ex({ id: "ball_leg_curl", n: "Topla Bacak Bükme", en: "stability ball hamstring curl", slot: "ham_iso", eq: ["ball", "mat"], d: 3, anim: "bridge_heel",
    pri: ["hamstrings", "glutes"], sec: ["abs", "lowerback"],
    steps: ["Sırtüstü yat, topuklar pilates topunun üstünde.", "Kalçanı kaldır.", "Topu topuklarınla kendine doğru yuvarla.", "Kontrollü geri it."], avoid: ["Kalçayı düşürmek"], breath: "Çekerken ver." });

  ex({ id: "hip_abduction", n: "Kalça Açma Makinesi (Abductor)", en: "hip abduction machine", slot: "glute_iso", eq: ["abductor"], d: 1, anim: "abductor",
    pri: ["glute_med"], sec: ["glutes"],
    steps: ["Makineye otur, minderler dizlerinin dış tarafında.", "Dizlerini dışa doğru aç.", "Açık pozisyonda 1 sn tut.", "Kontrollü kapat — ağırlıklar çarpmasın."], tips: ["Gövdeni hafif öne eğersen kalça daha iyi çalışır."], avoid: ["Hızlı ve savurarak yapmak"], breath: "Açarken ver." });
  ex({ id: "band_lateral_walk", n: "Lastikle Yan Yürüyüş", en: "resistance band lateral walk", slot: "glute_iso", eq: ["band"], d: 1, anim: "latwalk",
    pri: ["glute_med"], sec: ["glutes", "quads"],
    steps: ["Mini lastiği dizlerinin hemen üstüne geçir.", "Hafif çömel, ayaklar kalça genişliğinde.", "Yana küçük adımlarla yürü — lastik hep gergin kalsın.", "Aynı sayıda adımı diğer yöne at."], avoid: ["Dizlerin içe çökmesi", "Gövdeyi sallamak"], breath: "Düzenli nefes." });
  ex({ id: "side_lying_abd", n: "Yan Yatarak Bacak Kaldırma", en: "side lying leg raise", slot: "glute_iso", eq: ["mat"], d: 1, anim: "sidelying",
    pri: ["glute_med"], sec: ["obliques"],
    steps: ["Yan yat, alttaki kolun başının altında, alttaki diz hafif bükük.", "Üstteki bacak düz, ayak parmakları öne baksın.", "Bacağını 30–40 cm kaldır.", "Yavaşça indir; tekrarlar bitince yön değiştir."], avoid: ["Kalçayı geriye devirmek"], breath: "Kaldırırken ver.", perSide: true });
  ex({ id: "cable_kickback", n: "Kablo Kickback", en: "cable glute kickback", slot: "glute_iso", eq: ["cable"], d: 2, anim: "kickback_cable",
    pri: ["glutes"], sec: ["hamstrings"],
    steps: ["Makarayı en alta al, ayak bileği bandını tak.", "Makineye dönük dur, iki elle tutun, hafif öne eğil.", "Bacağını geriye doğru it, kalçanı sık.", "Kontrollü geri getir."], avoid: ["Beli kavislemek"], breath: "İterken ver.", perSide: true });
  ex({ id: "quadruped_kickback", n: "Dört Ayak Geri Tekme", en: "donkey kick exercise", slot: "glute_iso", eq: ["mat"], d: 1, anim: "kickback_quad",
    pri: ["glutes"], sec: ["hamstrings", "abs"],
    steps: ["Eller omuz, dizler kalça hizasında dört ayak pozisyonuna geç.", "Bir dizin 90° bükülü kalarak ayak tabanını tavana doğru it.", "Kalçanı sık, belini kavisleme.", "İndir; tekrarlar bitince taraf değiştir."], breath: "İterken ver.", perSide: true });

  ex({ id: "calf_raise", n: "Ayakta Parmak Ucu Kalkış", en: "standing calf raise", slot: "calf", d: 1, anim: "calf",
    pri: ["calves"], sec: [],
    steps: ["Bir yere hafifçe tutun, ayaklar kalça genişliğinde.", "Parmak uçlarına yüksel, tepede 1 sn bekle.", "Topuklarını yavaşça indir.", "Kolaylaşınca eline dambıl al."], breath: "Yükselirken ver." });
  ex({ id: "seated_calf", n: "Oturarak Baldır (Dambıl)", en: "seated dumbbell calf raise", slot: "calf", eq: ["dumbbell", "bench"], d: 1, anim: "calf_seated",
    pri: ["calves"], sec: [],
    steps: ["Sehpaya otur, dambılları dizlerinin üstüne koy.", "Parmak uçlarına yüksel.", "Tepede 1 sn tut, yavaşça indir."], breath: "Yükselirken ver." });
  ex({ id: "legpress_calf", n: "Leg Press'te Baldır", en: "leg press calf raise", slot: "calf", eq: ["legpress"], d: 2, anim: "legpress",
    pri: ["calves"], sec: [],
    steps: ["Leg press'e otur, ayak parmak uçlarını platformun alt kenarına koy.", "Dizler düz (kilitli değil).", "Parmak uçlarınla platformu it.", "Yavaşça geri bırak."], tips: ["Güvenlik kollarını kapalı tut."], breath: "İterken ver." });

  /* ================= GÖĞÜS / OMUZ / KOL ================= */
  ex({ id: "chest_press_machine", n: "Chest Press Makinesi", en: "chest press machine form", slot: "chest_press", eq: ["chestpress"], d: 1, anim: "chestpress_m",
    pri: ["chest"], sec: ["shoulders_front", "triceps"],
    steps: ["Oturağı tutamaklar göğsünün orta hizasına gelecek şekilde ayarla.", "Sırtını tamamen yasla, kürek kemiklerini geri çek.", "Tutamakları öne doğru it, dirsekleri kilitleme.", "Göğsünde gerilme hissedene kadar yavaşça geri gel."], tips: ["Makine hareketi yönlendirir — başlangıç için en güvenli göğüs hareketi."], avoid: ["Omuzları öne yuvarlamak", "Sırtı minderden ayırmak"], breath: "İterken ver." });
  ex({ id: "db_bench_press", n: "Dambıl Bench Press", en: "dumbbell bench press form", slot: "chest_press", eq: ["dumbbell", "bench"], d: 2, anim: "benchpress_db",
    pri: ["chest"], sec: ["shoulders_front", "triceps"],
    steps: ["Sehpaya sırtüstü uzan, dambılları göğüs hizasında tut.", "Ayaklar yere sağlam bassın, kürek kemikleri geride.", "Dambılları yukarı it, tepede birbirine yaklaştır.", "Dirsekler gövdeyle ~45° açı yapacak şekilde kontrollü indir."], avoid: ["Dirsekleri tamamen yana açmak", "Kalçayı kaldırmak"], breath: "İterken ver." });
  ex({ id: "incline_pushup", n: "Eğimli Şınav (Sehpada)", en: "incline push up bench", slot: "chest_press", eq: ["bench"], d: 1, anim: "pushup_incline",
    pri: ["chest"], sec: ["triceps", "shoulders_front", "abs"],
    steps: ["Ellerini sehpanın kenarına omuz genişliğinden biraz açık koy.", "Ayaklarını geri al; baştan topuğa düz bir çizgi oluştur.", "Göğsünü sehpaya doğru indir.", "Ellerinle iterek geri dön."], tips: ["Yüzey ne kadar yüksekse o kadar kolay."], avoid: ["Kalçanın düşmesi"], breath: "İnerken al, iterken ver." });
  ex({ id: "wall_pushup", n: "Duvar Şınavı", en: "wall push up", slot: "chest_press", d: 1, anim: "pushup_wall",
    pri: ["chest"], sec: ["triceps", "shoulders_front"],
    steps: ["Duvara karşı bir kol boyu uzakta dur.", "Avuçlarını omuz hizasında duvara koy.", "Göğsünü duvara yaklaştır.", "İterek geri dön."], breath: "İterken ver." });
  ex({ id: "knee_pushup", n: "Dizüstü Şınav", en: "knee push up proper form", slot: "chest_press", eq: ["mat"], d: 2, anim: "pushup_knee",
    pri: ["chest"], sec: ["triceps", "shoulders_front", "abs"],
    steps: ["Dizlerinin üstünde, eller omuz genişliğinden açık.", "Dizden başa düz çizgi.", "Göğsünü yere yaklaştır.", "İterek kalk."], avoid: ["Kalçayı havada bırakmak"], breath: "İterken ver." });
  ex({ id: "floor_press", n: "Yerde Dambıl Press", en: "dumbbell floor press", slot: "chest_press", eq: ["dumbbell", "mat"], d: 2, anim: "floorpress",
    pri: ["chest", "triceps"], sec: ["shoulders_front"],
    steps: ["Yere sırtüstü uzan, dizler bükük.", "Dambılları göğüs hizasında tut, dirsekler yerde.", "Yukarı it.", "Dirsekler yere hafifçe değene kadar indir."], breath: "İterken ver." });
  ex({ id: "pushup", n: "Şınav", en: "push up proper form", slot: "chest_press", eq: ["mat"], d: 4, anim: "pushup",
    pri: ["chest"], sec: ["triceps", "shoulders_front", "abs"],
    steps: ["Eller omuz genişliğinden biraz açık, vücut düz.", "Göğsünü yere yaklaştır.", "İterek kalk."], avoid: ["Kalçanın düşmesi"], breath: "İterken ver." });
  ex({ id: "barbell_bench", n: "Halter Bench Press", en: "barbell bench press form", slot: "chest_press", eq: ["barbell", "bench"], d: 3, anim: "benchpress_bb",
    pri: ["chest"], sec: ["triceps", "shoulders_front"],
    steps: ["Gözlerin barın altında olacak şekilde uzan.", "Barı omuz genişliğinden biraz açık kavra.", "Göğsünün alt kısmına kontrollü indir.", "Yukarı it."], tips: ["Yanında biri (spotter) olsun."], avoid: ["Barı göğüste sektirmek"], breath: "İterken ver." });

  ex({ id: "pec_deck", n: "Pec Deck (Butterfly)", en: "pec deck machine form", slot: "chest_fly", eq: ["pecdeck"], d: 1, anim: "pecdeck",
    pri: ["chest"], sec: ["shoulders_front"],
    steps: ["Oturağı kollar omuz hizasında olacak şekilde ayarla.", "Sırtını yasla, kolları açık başla.", "Kollarını önde birleştir, göğsünü sık.", "Yavaşça aç; omzunu zorlayacak kadar geri gitme."], avoid: ["Omuzları kaldırmak"], breath: "Kapatırken ver." });
  ex({ id: "db_fly", n: "Dambıl Fly", en: "dumbbell chest fly form", slot: "chest_fly", eq: ["dumbbell", "bench"], d: 2, anim: "fly",
    pri: ["chest"], sec: ["shoulders_front"],
    steps: ["Sehpaya uzan, dambıllar göğsünün üstünde, dirsekler hafif bükük.", "Kollarını yanlara doğru geniş bir yay çizerek aç.", "Göğüste gerilme hissedince dur.", "Aynı yayla geri kapat."], tips: ["Hafif dambıl — bu hareket ağırlık değil his hareketi."], avoid: ["Dirsekleri düz kilitlemek", "Çok aşağı inmek"], breath: "Kapatırken ver." });
  ex({ id: "cable_fly", n: "Kablo Fly (Crossover)", en: "standing cable fly", slot: "chest_fly", eq: ["cable"], d: 2, anim: "fly_cable",
    pri: ["chest"], sec: ["shoulders_front"],
    steps: ["Makaraları omuz hizasına al, iki tutamağı kavra.", "Bir adım öne çık, gövde hafif öne eğik.", "Kollarını önde birleştir.", "Yavaşça aç."], breath: "Kapatırken ver." });
  ex({ id: "band_fly", n: "Lastikle Göğüs Açma", en: "resistance band chest fly", slot: "chest_fly", eq: ["band"], d: 1, anim: "fly_band",
    pri: ["chest"], sec: ["shoulders_front"],
    steps: ["Lastiği arkanda omuz hizasında bir yere bağla ya da sırtından dolaştır.", "Kollar yanlarda açık başla.", "Önde birleştir.", "Yavaşça aç."], breath: "Kapatırken ver." });

  ex({ id: "machine_shoulder_press", n: "Shoulder Press Makinesi", en: "machine shoulder press", slot: "shoulder_press", eq: ["shoulderpress"], d: 1, anim: "shoulderpress_m",
    pri: ["shoulders_front", "shoulders_side"], sec: ["triceps", "traps"],
    steps: ["Oturağı tutamaklar omuz hizasında olacak şekilde ayarla.", "Sırtını yasla.", "Tutamakları yukarı it, dirsekleri kilitleme.", "Omuz hizasına kontrollü indir."], avoid: ["Beli kavislemek"], breath: "İterken ver." });
  ex({ id: "seated_db_press", n: "Oturarak Dambıl Omuz Press", en: "seated dumbbell shoulder press", slot: "shoulder_press", eq: ["dumbbell", "bench"], d: 2, anim: "shoulderpress",
    pri: ["shoulders_front", "shoulders_side"], sec: ["triceps", "traps"],
    steps: ["Sehpanın sırtını dik konuma getir, otur.", "Dambılları omuz hizasında tut, avuçlar öne.", "Yukarı it, tepede birbirine yaklaştır.", "Kontrollü omuz hizasına indir."], avoid: ["Beli kavislemek", "Dambılları çarpıştırmak"], breath: "İterken ver." });
  ex({ id: "band_shoulder_press", n: "Lastikle Omuz Press", en: "resistance band shoulder press", slot: "shoulder_press", eq: ["band"], d: 1, anim: "shoulderpress_band",
    pri: ["shoulders_front", "shoulders_side"], sec: ["triceps"],
    steps: ["Lastiğin ortasına bas, uçlarını omuz hizasında tut.", "Yukarı it.", "Kontrollü indir."], breath: "İterken ver." });

  ex({ id: "db_lateral", n: "Dambıl Yana Açış", en: "dumbbell lateral raise form", slot: "lateral", eq: ["dumbbell"], d: 1, anim: "lateral",
    pri: ["shoulders_side"], sec: ["traps", "shoulders_front"],
    steps: ["Hafif dambılları iki yanında tut, dirsekler hafif bükük.", "Kollarını yana doğru omuz hizasına kadar kaldır.", "Tepede 1 sn bekle.", "Yavaşça indir."], tips: ["Çok hafif başla: 2–4 kg yeterli."], avoid: ["Omuzları kulağa doğru kaldırmak", "Savurmak"], breath: "Kaldırırken ver." });
  ex({ id: "cable_lateral", n: "Kablo Yana Açış", en: "cable lateral raise", slot: "lateral", eq: ["cable"], d: 2, anim: "lateral_cable",
    pri: ["shoulders_side"], sec: ["traps"],
    steps: ["Makarayı en alta al, makaraya yan dur.", "Uzak eldeki tutamakla kolunu yana kaldır.", "Omuz hizasında dur.", "Yavaşça indir; taraf değiştir."], breath: "Kaldırırken ver.", perSide: true });
  ex({ id: "band_lateral", n: "Lastikle Yana Açış", en: "resistance band lateral raise", slot: "lateral", eq: ["band"], d: 1, anim: "lateral_band",
    pri: ["shoulders_side"], sec: ["traps"],
    steps: ["Lastiğin ortasına bas.", "Uçlarını tutarak kollarını yana kaldır.", "Yavaşça indir."], breath: "Kaldırırken ver." });

  ex({ id: "reverse_pec_deck", n: "Ters Pec Deck", en: "reverse pec deck rear delt", slot: "rear_delt", eq: ["pecdeck"], d: 1, anim: "reversefly_m",
    pri: ["shoulders_rear", "upperback"], sec: ["traps"],
    steps: ["Makineye yüzün minderde olacak şekilde ters otur.", "Tutamakları kollar düz önde kavra.", "Kollarını yanlara geriye aç, kürek kemiklerini sık.", "Yavaşça geri getir."], breath: "Açarken ver." });
  ex({ id: "face_pull", n: "Face Pull", en: "cable face pull form", slot: "rear_delt", eq: ["cable"], d: 2, anim: "facepull",
    pri: ["shoulders_rear", "upperback"], sec: ["traps", "biceps"],
    steps: ["Makarayı yüz hizasına al, halat başlığını tak.", "Halatın uçlarını avuçlar içe bakacak şekilde tut.", "Halatı yüzüne doğru çek, dirsekler yukarıda ve dışarıda.", "Kontrollü geri bırak."], tips: ["Masa başı duruşuna birebir iyi gelir."], avoid: ["Gövdeyle geri yaslanmak"], breath: "Çekerken ver." });
  ex({ id: "band_pull_apart", n: "Lastik Açma (Pull-Apart)", en: "band pull apart", slot: "rear_delt", eq: ["band"], d: 1, anim: "pullapart",
    pri: ["shoulders_rear", "upperback"], sec: ["traps"],
    steps: ["Lastiği göğüs hizasında, kollar düz önde tut.", "Lastiği göğsüne doğru iki yana aç.", "Kürek kemiklerini sık.", "Yavaşça geri getir."], breath: "Açarken ver." });
  ex({ id: "db_reverse_fly", n: "Eğimli Sehpada Ters Fly", en: "chest supported reverse dumbbell fly", slot: "rear_delt", eq: ["dumbbell", "bench"], d: 2, anim: "reversefly_db",
    pri: ["shoulders_rear", "upperback"], sec: ["traps"],
    steps: ["Eğimli sehpaya yüzüstü uzan, hafif dambılları sarkıt.", "Dirsekler hafif bükük, kollarını yanlara aç.", "Kürek kemiklerini sık.", "Yavaşça indir."], breath: "Açarken ver." });

  ex({ id: "cable_pushdown", n: "Kablo Pushdown", en: "cable tricep pushdown form", slot: "triceps", eq: ["cable"], d: 1, anim: "pushdown",
    pri: ["triceps"], sec: ["forearms"],
    steps: ["Makarayı en üste al, düz bar ya da halat tak.", "Dirseklerini gövdenin yanına sabitle.", "Barı aşağı it, kolların tamamen düzelsin.", "Dirsekler kıpırdamadan yavaşça yukarı bırak."], avoid: ["Dirsekleri öne-arkaya oynatmak", "Gövdeyle bastırmak"], breath: "İterken ver." });
  ex({ id: "band_pushdown", n: "Lastikle Pushdown", en: "resistance band tricep pushdown", slot: "triceps", eq: ["band"], d: 1, anim: "pushdown_band",
    pri: ["triceps"], sec: [],
    steps: ["Lastiği yüksek bir yere tak.", "Dirsekler gövde yanında sabit.", "Aşağı it, kolları düzelt.", "Yavaşça bırak."], breath: "İterken ver." });
  ex({ id: "db_overhead_ext", n: "Oturarak Baş Üstü Triceps", en: "seated dumbbell overhead tricep extension", slot: "triceps", eq: ["dumbbell", "bench"], d: 2, anim: "overhead_ext",
    pri: ["triceps"], sec: [],
    steps: ["Sırt destekli otur, tek dambılı iki elle başının üstünde tut.", "Dirseklerin tavana baksın, dambılı başının arkasına indir.", "Kollarını düzelterek yukarı kaldır.", "Dirsekleri açma."], tips: ["Omzun ağrırsa pushdown'a geç."], avoid: ["Dirsekleri yana açmak", "Beli kavislemek"], breath: "Kaldırırken ver." });
  ex({ id: "db_kickback", n: "Dambıl Kickback", en: "dumbbell tricep kickback", slot: "triceps", eq: ["dumbbell", "bench"], d: 2, anim: "kickback_db",
    pri: ["triceps"], sec: ["shoulders_rear"],
    steps: ["Bir elini ve dizini sehpaya koy, sırt düz.", "Diğer elde dambıl, üst kolun gövdeye paralel.", "Ön kolunu geriye doğru düzelt.", "Yavaşça geri bük."], breath: "Açarken ver.", perSide: true });
  ex({ id: "bench_dip", n: "Sehpada Dips", en: "bench dips form", slot: "triceps", eq: ["bench"], d: 4, anim: "dip_bench",
    pri: ["triceps"], sec: ["chest", "shoulders_front"],
    steps: ["Ellerini arkandaki sehpanın kenarına koy.", "Dizler bükük, ayaklar yerde.", "Dirsekleri geriye bükerek in.", "İterek kalk."], tips: ["Omuzlara yük bindirir; kilolu başlangıçta önerilmez."], avoid: ["Çok derine inmek"], breath: "İterken ver." });

  ex({ id: "lat_pulldown", n: "Lat Pulldown", en: "lat pulldown proper form", slot: "vertical_pull", eq: ["latpull"], d: 1, anim: "pulldown",
    pri: ["lats"], sec: ["biceps", "upperback", "shoulders_rear", "forearms"],
    steps: ["Diz minderini uyluklarını sabitleyecek şekilde ayarla.", "Barı omuz genişliğinden biraz açık kavra.", "Göğsünü hafif kaldır, barı üst göğsüne doğru çek.", "Dirsekleri aşağı ve geriye götür; yavaşça yukarı bırak."], tips: ["Kolla değil dirsekle çekiyormuş gibi düşün."], avoid: ["Barı ense arkasına çekmek", "Geriye fazla yaslanıp sallanmak"], breath: "Çekerken ver." });
  ex({ id: "band_pulldown", n: "Lastikle Pulldown", en: "resistance band lat pulldown", slot: "vertical_pull", eq: ["band"], d: 1, anim: "pulldown_band",
    pri: ["lats"], sec: ["biceps", "upperback"],
    steps: ["Lastiği yüksek bir yere bağla, altında otur ya da diz çök.", "Kollar yukarıda uçları kavra.", "Dirsekleri aşağı, kaburgalarına doğru çek.", "Yavaşça bırak."], breath: "Çekerken ver." });
  ex({ id: "assisted_pullup", n: "Destekli Barfiks", en: "assisted pull up machine", slot: "vertical_pull", eq: ["assist"], d: 2, anim: "assist_pullup",
    pri: ["lats"], sec: ["biceps", "upperback", "forearms"],
    steps: ["Makinede yardım ağırlığını yüksek seç (ne kadar yüksek o kadar kolay).", "Dizlerini platforma koy, barı kavra.", "Çeneni bar hizasına kadar kendini çek.", "Kontrollü in."], tips: ["Senin kilonda yardım ağırlığını kilonun yarısından başlat."], breath: "Çekerken ver." });
  ex({ id: "straight_arm_pulldown", n: "Düz Kol Pulldown", en: "straight arm cable pulldown", slot: "vertical_pull", eq: ["cable"], d: 2, anim: "straightarm",
    pri: ["lats"], sec: ["triceps", "abs"],
    steps: ["Makarayı en üste al, düz barı tut.", "Hafif öne eğil, kollar düz.", "Barı uyluklarına doğru bir yayla indir.", "Yavaşça yukarı bırak."], breath: "İndirirken ver." });

  ex({ id: "seated_cable_row", n: "Oturarak Kablo Row", en: "seated cable row form", slot: "row", eq: ["cable"], d: 1, anim: "row_cable",
    pri: ["upperback", "lats"], sec: ["biceps", "shoulders_rear", "forearms"],
    steps: ["Ayaklarını platforma koy, dizler hafif bükük.", "Tutamağı kavra, sırt dik.", "Tutamağı karnına doğru çek, kürek kemiklerini sık.", "Kollar uzayana kadar yavaşça bırak."], avoid: ["Gövdeyi ileri-geri sallamak", "Omuzları kulağa kaldırmak"], breath: "Çekerken ver." });
  ex({ id: "chest_supported_row", n: "Göğüs Destekli Dambıl Row", en: "chest supported dumbbell row incline bench", slot: "row", eq: ["dumbbell", "bench"], d: 1, anim: "row_cs",
    pri: ["upperback", "lats"], sec: ["biceps", "shoulders_rear"],
    steps: ["Sehpayı 30–45° eğime getir, yüzüstü uzan.", "Dambılları kollar düz sarkıt.", "Dirsekleri geriye çekerek dambılları kaldır.", "Yavaşça indir."], tips: ["Belin tamamen destekli — bel dostu row."], breath: "Çekerken ver." });
  ex({ id: "one_arm_db_row", n: "Tek Kol Dambıl Row", en: "one arm dumbbell row form", slot: "row", eq: ["dumbbell", "bench"], d: 2, anim: "row_db",
    pri: ["lats", "upperback"], sec: ["biceps", "shoulders_rear", "forearms"],
    steps: ["Bir elini ve dizini sehpaya koy, sırt düz.", "Diğer elle dambılı kol düz tut.", "Dirseğini kalçana doğru çek.", "Yavaşça indir; taraf değiştir."], avoid: ["Gövdeyi döndürmek"], breath: "Çekerken ver.", perSide: true });
  ex({ id: "band_row", n: "Lastikle Row", en: "resistance band seated row", slot: "row", eq: ["band"], d: 1, anim: "row_band",
    pri: ["upperback", "lats"], sec: ["biceps", "shoulders_rear"],
    steps: ["Otur, lastiği ayak tabanlarından geçir.", "Uçlarını tut, sırt dik.", "Karnına doğru çek.", "Yavaşça bırak."], breath: "Çekerken ver." });
  ex({ id: "inverted_row", n: "Smith'te Ters Row", en: "inverted row smith machine", slot: "row", eq: ["smith"], d: 3, anim: "row_inverted",
    pri: ["upperback", "lats"], sec: ["biceps", "abs"],
    steps: ["Smith barını göğüs hizasına ayarla.", "Altına gir, barı kavra, vücut düz.", "Göğsünü bara çek.", "Kontrollü in."], tips: ["Bar ne kadar yüksekse o kadar kolay."], breath: "Çekerken ver." });

  ex({ id: "db_curl", n: "Dambıl Biceps Curl", en: "dumbbell bicep curl form", slot: "biceps", eq: ["dumbbell"], d: 1, anim: "curl",
    pri: ["biceps"], sec: ["forearms"],
    steps: ["Dambılları iki yanında, avuçlar öne bakacak şekilde tut.", "Dirsekler gövdeye yakın sabit.", "Dambılları omuzlarına doğru kaldır.", "Yavaşça indir."], avoid: ["Gövdeyle savurmak", "Dirsekleri öne kaçırmak"], breath: "Kaldırırken ver." });
  ex({ id: "hammer_curl", n: "Hammer Curl", en: "hammer curl form", slot: "biceps", eq: ["dumbbell"], d: 1, anim: "curl_hammer",
    pri: ["biceps", "forearms"], sec: [],
    steps: ["Dambılları avuçlar içe bakacak şekilde (çekiç tutar gibi) tut.", "Dirsekler sabit, dambılları kaldır.", "Yavaşça indir."], breath: "Kaldırırken ver." });
  ex({ id: "cable_curl", n: "Kablo Curl", en: "cable bicep curl", slot: "biceps", eq: ["cable"], d: 1, anim: "curl_cable",
    pri: ["biceps"], sec: ["forearms"],
    steps: ["Makarayı en alta al, düz barı tut.", "Dirsekler gövdede sabit.", "Barı omuzlarına doğru kaldır.", "Yavaşça indir."], breath: "Kaldırırken ver." });
  ex({ id: "band_curl", n: "Lastikle Curl", en: "resistance band bicep curl", slot: "biceps", eq: ["band"], d: 1, anim: "curl_band",
    pri: ["biceps"], sec: ["forearms"],
    steps: ["Lastiğin ortasına bas.", "Uçlarını avuçlar öne bakacak şekilde tut.", "Kaldır.", "Yavaşça indir."], breath: "Kaldırırken ver." });
  ex({ id: "barbell_curl", n: "Halter Curl", en: "barbell curl form", slot: "biceps", eq: ["barbell"], d: 2, anim: "curl_bb",
    pri: ["biceps"], sec: ["forearms"],
    steps: ["Barı omuz genişliğinde, avuçlar öne bakacak şekilde kavra.", "Dirsekler sabit, barı kaldır.", "Yavaşça indir."], avoid: ["Bel ile savurmak"], breath: "Kaldırırken ver." });

  ex({ id: "farmer_walk", n: "Çiftçi Yürüyüşü", en: "farmers walk dumbbell", slot: "carry", eq: ["dumbbell"], d: 1, anim: "farmer", kind: "time",
    pri: ["forearms", "traps"], sec: ["abs", "obliques", "glutes", "calves"],
    steps: ["Ağırca iki dambılı iki yanında tut.", "Dik dur, omuzlar geride, karın sıkı.", "Küçük ve kontrollü adımlarla süre boyunca yürü.", "Dambılları dizlerini bükerek yere bırak."], tips: ["Tüm vücudu çalıştırır, kalp ritmini de yükseltir."], breath: "Düzenli nefes." });
  ex({ id: "kb_carry", n: "Kettlebell Taşıma", en: "kettlebell farmers carry", slot: "carry", eq: ["kettlebell"], d: 1, anim: "farmer", kind: "time",
    pri: ["forearms", "traps"], sec: ["abs", "obliques", "glutes"],
    steps: ["Kettlebell'leri iki yanında tut.", "Dik dur, karın sıkı.", "Kontrollü adımlarla yürü."], breath: "Düzenli nefes." });

  /* ================= KARIN ================= */
  ex({ id: "dead_bug", n: "Dead Bug", en: "dead bug exercise beginner", slot: "core_antiext", eq: ["mat"], d: 1, anim: "deadbug",
    pri: ["abs"], sec: ["obliques", "hipflexors"],
    steps: ["Sırtüstü yat, kollar tavana, dizler 90° havada.", "Belini yere bastır — bu his hareket boyunca kalsın.", "Sağ kolunu başının arkasına, sol bacağını öne doğru yavaşça uzat.", "Geri getir, diğer tarafla tekrarla."], tips: ["Belin yerden kalkıyorsa daha az uzat."], avoid: ["Beli kavislemek", "Hızlı yapmak"], breath: "Uzatırken ver.", perSide: true, note: "Bele yük bindirmeden derin karın kaslarını çalıştırır." });
  ex({ id: "incline_plank", n: "Eğimli Plank (Sehpada)", en: "incline plank bench", slot: "core_antiext", eq: ["bench"], d: 1, anim: "plank_incline", kind: "time",
    pri: ["abs"], sec: ["obliques", "shoulders_front", "glutes"],
    steps: ["Ön kollarını ya da ellerini sehpaya koy.", "Ayaklarını geri al, baştan topuğa düz çizgi.", "Karnını ve kalçanı sık.", "Süre boyunca tut."], avoid: ["Kalçanın düşmesi ya da çok kalkması"], breath: "Düzenli nefes — tutma." });
  ex({ id: "knee_plank", n: "Dizüstü Plank", en: "kneeling plank", slot: "core_antiext", eq: ["mat"], d: 1, anim: "plank_knee", kind: "time",
    pri: ["abs"], sec: ["obliques", "shoulders_front"],
    steps: ["Ön kollar ve dizler yerde.", "Dizden başa düz çizgi.", "Karnını sık, süre boyunca tut."], breath: "Düzenli nefes." });
  ex({ id: "plank", n: "Plank", en: "plank proper form", slot: "core_antiext", eq: ["mat"], d: 3, anim: "plank", kind: "time",
    pri: ["abs"], sec: ["obliques", "shoulders_front", "glutes", "quads"],
    steps: ["Ön kollar omuzların altında, ayak parmakları yerde.", "Vücudun baştan topuğa düz bir çizgi.", "Karnını ve kalçanı sık.", "Süre boyunca tut."], avoid: ["Kalçanın düşmesi"], breath: "Düzenli nefes." });

  ex({ id: "bird_dog", n: "Bird Dog", en: "bird dog exercise", slot: "core_stab", eq: ["mat"], d: 1, anim: "birddog",
    pri: ["lowerback", "abs"], sec: ["glutes", "shoulders_front"],
    steps: ["Dört ayak pozisyonuna geç.", "Sağ kolunu öne, sol bacağını geriye uzat — vücut düz.", "1–2 sn tut, geri getir.", "Diğer tarafla tekrarla."], tips: ["Sırtına bir bardak su koyduğunu düşün — dökme."], breath: "Uzatırken ver.", perSide: true, note: "Bel ağrılarına karşı en çok önerilen hareketlerden." });
  ex({ id: "side_plank_knee", n: "Dizüstü Yan Plank", en: "modified side plank knees", slot: "core_stab", eq: ["mat"], d: 2, anim: "sideplank", kind: "time",
    pri: ["obliques"], sec: ["abs", "glute_med"],
    steps: ["Yan yat, ön kolun omzunun altında, dizler bükük.", "Kalçanı kaldır; dizden başa düz çizgi.", "Süre boyunca tut, sonra taraf değiştir."], breath: "Düzenli nefes.", perSide: true });
  ex({ id: "pallof_press", n: "Pallof Press", en: "pallof press cable", slot: "core_stab", eq: ["cable"], d: 2, anim: "pallof",
    pri: ["obliques", "abs"], sec: ["shoulders_front"],
    steps: ["Makarayı göğüs hizasına al, makaraya yan dur.", "Tutamağı iki elle göğsüne yakın tut.", "Kollarını öne uzat — gövden dönmeye direnmeli.", "2 sn tut, geri getir; taraf değiştir."], breath: "Uzatırken ver.", perSide: true });
  ex({ id: "band_pallof", n: "Lastikle Pallof Press", en: "band pallof press", slot: "core_stab", eq: ["band"], d: 1, anim: "pallof",
    pri: ["obliques", "abs"], sec: [],
    steps: ["Lastiği göğüs hizasında yandaki bir yere bağla.", "İki elle göğsüne yakın tut.", "Öne uzat, gövdeni döndürme.", "Geri getir; taraf değiştir."], breath: "Uzatırken ver.", perSide: true });

  ex({ id: "crunch", n: "Mekik (Crunch)", en: "crunch proper form", slot: "core_flex", eq: ["mat"], d: 1, anim: "crunch",
    pri: ["abs"], sec: ["obliques"],
    steps: ["Sırtüstü yat, dizler bükük.", "Ellerini dizlerine doğru uzat.", "Omuzlarını yerden birkaç cm kaldır — beli yerde kalsın.", "Yavaşça indir."], avoid: ["Boyundan çekmek"], breath: "Kalkarken ver." });
  ex({ id: "reverse_crunch", n: "Ters Mekik", en: "reverse crunch", slot: "core_flex", eq: ["mat"], d: 2, anim: "revcrunch",
    pri: ["abs"], sec: ["hipflexors"],
    steps: ["Sırtüstü yat, dizler bükük havada.", "Karnınla dizlerini göğsüne doğru çek, kalça hafif kalksın.", "Yavaşça indir."], breath: "Çekerken ver." });
  ex({ id: "cable_crunch", n: "Kablo Crunch", en: "kneeling cable crunch", slot: "core_flex", eq: ["cable"], d: 2, anim: "cablecrunch",
    pri: ["abs"], sec: ["obliques"],
    steps: ["Makarayı en üste al, halat tak, önünde diz çök.", "Halatı başının yanında tut.", "Karnınla kıvrılarak dirseklerini dizlerine doğru indir.", "Yavaşça doğrul."], breath: "Kıvrılırken ver." });

  /* ================= KARDİYO ================= */
  ex({ id: "incline_walk", n: "Eğimli Yürüyüş (Koşu Bandı)", en: "incline treadmill walking", slot: "cardio", eq: ["treadmill"], d: 1, anim: "walk", kind: "cardio", met: 4.8,
    pri: ["calves", "glutes", "quads"], sec: ["hamstrings"],
    steps: ["Hızı 4–5 km/sa, eğimi %3–6 ayarla.", "Tutamaklara asılmadan, dik yürü.", "Konuşabileceğin ama şarkı söyleyemeyeceğin tempoda kal.", "Son 2 dakikada hızı ve eğimi azaltarak soğu."], tips: ["Koşmak yerine eğimli yürüyüş dizlerine çok daha dost."], breath: "Burundan al, ağızdan ver." });
  ex({ id: "bike", n: "Kondisyon Bisikleti", en: "stationary bike beginner", slot: "cardio", eq: ["bike"], d: 1, anim: "bike", kind: "cardio", met: 5,
    pri: ["quads"], sec: ["glutes", "hamstrings", "calves"],
    steps: ["Oturak yüksekliği: pedal en alttayken dizin hafif bükük kalsın.", "Hafif dirençle başla.", "Dakikada 60–80 pedal ritmiyle çevir.", "Konuşabileceğin tempoda kal."], tips: ["Eklemlere en az yük bindiren kardiyo — kilolu başlangıç için birinci tercih."], breath: "Düzenli nefes." });
  ex({ id: "elliptical", n: "Eliptik", en: "elliptical trainer form", slot: "cardio", eq: ["elliptical"], d: 1, anim: "elliptical", kind: "cardio", met: 5,
    pri: ["quads", "glutes"], sec: ["hamstrings", "calves", "chest", "upperback"],
    steps: ["Ayaklarını pedallara tam bas.", "Kolları da kullanarak ritmik hareket et.", "Dik dur, öne eğilme.", "Konuşabileceğin tempoda kal."], tips: ["Darbesiz olduğu için dizlere dosttur."], breath: "Düzenli nefes." });
  ex({ id: "rower", n: "Kürek Makinesi", en: "rowing machine technique", slot: "cardio", eq: ["rower"], d: 3, anim: "rower", kind: "cardio", met: 6,
    pri: ["upperback", "lats", "quads"], sec: ["glutes", "biceps", "hamstrings", "abs"],
    steps: ["Önce bacakla it, sonra gövdeni hafif geri yasla, en son kollarla çek.", "Dönüşte sıra tersine: kollar, gövde, bacaklar.", "Dirençi orta seviyede tut.", "Konuşabileceğin tempoda kal."], breath: "Çekerken ver." });
  ex({ id: "stair", n: "Merdiven Makinesi", en: "stair climber machine", slot: "cardio", eq: ["stair"], d: 3, anim: "stair", kind: "cardio", met: 7,
    pri: ["glutes", "quads"], sec: ["calves", "hamstrings"],
    steps: ["En yavaş hızla başla.", "Tutamaklara hafifçe tutun, asılma.", "Basamağa tam bas.", "Nefesin çok hızlanırsa hızı düşür."], tips: ["Zorlayıcıdır; ilk aylarda kısa süre ve düşük hız."], breath: "Düzenli nefes." });
  ex({ id: "outdoor_walk", n: "Tempolu Yürüyüş", en: "brisk walking", slot: "cardio", d: 1, anim: "walk_out", kind: "cardio", met: 4.3,
    pri: ["calves", "glutes", "quads"], sec: ["hamstrings"],
    steps: ["Rahat ayakkabı giy.", "Kollarını sallayarak, tempolu yürü.", "Konuşabileceğin ama nefesinin hızlandığı tempoda kal."], breath: "Düzenli nefes." });
  ex({ id: "march", n: "Yerinde Yürüyüş", en: "marching in place cardio", slot: "cardio", d: 1, anim: "march", kind: "cardio", met: 3.8,
    pri: ["hipflexors", "quads"], sec: ["calves", "abs"],
    steps: ["Dik dur.", "Dizlerini sırayla kaldırarak yerinde yürü.", "Kollarını da salla.", "Tempoyu konuşabileceğin seviyede tut."], breath: "Düzenli nefes." });

  /* ================= ISINMA / ESNEME ================= */
  ex({ id: "w_march", n: "Yerinde Yürüyüş", en: "march in place warm up", slot: "warmup", d: 1, anim: "march", kind: "time", pri: ["hipflexors"], sec: ["quads", "calves"], steps: ["Dizlerini sırayla kaldırarak yerinde yürü.", "Kollarını salla, tempoyu yavaş yavaş artır."] });
  ex({ id: "w_armcircle", n: "Kol Çevirme", en: "arm circles warm up", slot: "warmup", d: 1, anim: "armcircle", kind: "time", pri: ["shoulders_side"], sec: ["shoulders_front", "shoulders_rear"], steps: ["Kollarını yana aç.", "Küçük çemberlerle başla, büyüt.", "Yarı süre öne, yarı süre geriye çevir."] });
  ex({ id: "w_hipcircle", n: "Kalça Çevirme", en: "hip circles warm up", slot: "warmup", d: 1, anim: "hipcircle", kind: "time", pri: ["obliques"], sec: ["lowerback", "glutes"], steps: ["Ellerini beline koy.", "Kalçanla geniş çemberler çiz.", "Yarı süre bir yöne, yarı süre diğer yöne."] });
  ex({ id: "w_legswing", n: "Bacak Sallama", en: "leg swings warm up", slot: "warmup", d: 1, anim: "legswing", kind: "time", pri: ["hipflexors", "hamstrings"], sec: ["glutes"], steps: ["Bir duvara tutun.", "Bir bacağını öne-arkaya rahatça salla.", "Yarı süre sonra bacak değiştir."] });
  ex({ id: "w_catcow", n: "Kedi–İnek", en: "cat cow stretch", slot: "warmup", eq: ["mat"], d: 1, anim: "catcow", kind: "time", pri: ["lowerback"], sec: ["abs", "upperback"], steps: ["Dört ayak pozisyonuna geç.", "Nefes alırken belini çukurlaştır, başını kaldır.", "Verirken sırtını kamburlaştır, çeneni göğsüne yaklaştır."] });
  ex({ id: "w_goodmorning", n: "Kalça Menteşe (Isınma)", en: "bodyweight good morning", slot: "warmup", d: 1, anim: "goodmorning", kind: "time", pri: ["hamstrings"], sec: ["glutes", "lowerback"], steps: ["Ellerini göğsünde çaprazla.", "Kalçanı geri iterek öne eğil, sırt düz.", "Doğrul."] });

  ex({ id: "s_quad", n: "Ön Bacak Esnetme", en: "standing quad stretch", slot: "stretch", d: 1, anim: "stretch_quad", kind: "time", pri: ["quads"], sec: ["hipflexors"], perSide: true, steps: ["Duvara tutun.", "Bir ayağını kalçana doğru tut.", "Dizler yan yana, 20–30 sn bekle; taraf değiştir."], tips: ["Ayağına uzanamıyorsan bir havlu dola."] });
  ex({ id: "s_ham", n: "Arka Bacak Esnetme", en: "seated hamstring stretch bench", slot: "stretch", d: 1, anim: "stretch_ham", kind: "time", pri: ["hamstrings"], sec: ["calves", "lowerback"], perSide: true, steps: ["Sehpaya otur, bir bacağını düz uzat.", "Sırtını düz tutarak öne eğil.", "Gerilme hissettiğin yerde 20–30 sn bekle."] });
  ex({ id: "s_chest", n: "Göğüs Esnetme (Duvar)", en: "wall chest stretch", slot: "stretch", d: 1, anim: "stretch_chest", kind: "time", pri: ["chest"], sec: ["shoulders_front"], perSide: true, steps: ["Kolunu duvara omuz hizasında koy.", "Gövdeni yavaşça ters yöne çevir.", "20–30 sn bekle; taraf değiştir."] });
  ex({ id: "s_child", n: "Çocuk Pozu", en: "child's pose", slot: "stretch", eq: ["mat"], d: 1, anim: "childpose", kind: "time", pri: ["lowerback", "lats"], sec: ["glutes"], steps: ["Dizlerinin üstüne otur, kalçanı topuklarına yaklaştır.", "Kollarını öne uzatarak gövdeni yere doğru bırak.", "Derin nefeslerle bekle."], tips: ["Dizlerini biraz açarsan karın için yer açılır."] });
  ex({ id: "s_hipflex", n: "Kalça Önü Esnetme", en: "half kneeling hip flexor stretch", slot: "stretch", eq: ["mat"], d: 1, anim: "stretch_hipflex", kind: "time", pri: ["hipflexors"], sec: ["quads"], perSide: true, steps: ["Bir diz yerde, diğer ayak önde.", "Kalçanı hafifçe öne it, arkadaki kalçayı sık.", "20–30 sn bekle; taraf değiştir."], tips: ["Gün boyu oturanlar için çok önemli."] });
  ex({ id: "s_calf", n: "Baldır Esnetme", en: "wall calf stretch", slot: "stretch", d: 1, anim: "stretch_calf", kind: "time", pri: ["calves"], sec: [], perSide: true, steps: ["Ellerini duvara koy, bir ayağın arkada.", "Arka topuğu yere bastır.", "20–30 sn bekle; taraf değiştir."] });
  ex({ id: "s_lat", n: "Yan Gövde Esnetme", en: "standing side stretch", slot: "stretch", d: 1, anim: "stretch_lat", kind: "time", pri: ["lats", "obliques"], sec: [], perSide: true, steps: ["Kollarını başının üstünde birleştir.", "Gövdeni yavaşça bir yana eğ.", "20 sn bekle; diğer yana."] });

  const BY = {};
  for (const e of X) BY[e.id] = e;

  window.DB = { EQUIPMENT, SLOTS, EXERCISES: X, BY };
})();
