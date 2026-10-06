# ADIM — Adım adım spor programı (iPhone)

Sana özel, haftada 4 gün (Salı · Perşembe · Cuma · Pazar), yavaş yavaş zorlaşan spor programı.
iPhone'a ana ekran uygulaması olarak eklenir; tam ekran açılır ve internetsiz çalışır.

Adres (yayınlandıktan sonra): https://felixdemario.github.io/felixdemario/spor/

## Kurulum
1. iPhone'da **Safari** ile adresi aç.
2. **Paylaş → Ana Ekrana Ekle**. Artık ADIM ikonuna dokununca uygulama gibi açılır.
3. İlk açılışta adını, yaşını, boyunu, kilonu (118), hedef kilonu, spor günlerini ve salonundaki aletleri gir.

## Program
| Gün | Bölge | Kardiyo |
|---|---|---|
| Salı | Alt vücut — bacak & kalça | bisiklet (dizlere dost) |
| Perşembe | Üst vücut — göğüs, omuz & arka kol | eğimli yürüyüş |
| Cuma | Alt vücut B — kalça, arka bacak & karın | eliptik |
| Pazar | Üst vücut B — sırt, arka omuz & pazı | uzun kardiyo |

Kademeli ilerleme:

| Hafta | Aşama | Set | Kardiyo |
|---|---|---|---|
| 1–2 | Alışma | 2 set, hafif, 4–5 hareket | 15–20 dk hafif |
| 3–4 | Temel | ana hareketlerde 3 set | 20–25 dk |
| 5–8 | Gelişim | 3 set, yeni hareketler (8. hafta hafif hafta) | 20–30 dk |
| 9–12 | Güçlenme | ilk harekette 4 set | 25–35 dk, aralıklı |
| 13+ | Devam | her 4. hafta hafif | 30–35 dk |

Zor gelirse **Profil → Seviye**'den bir hafta geri alınır. Son iki antrenmanı "çok zor" işaretlersen
uygulama bunu kendisi önerir.

## Özellikler
- **Bugün ekranı:** günün bölgesi, süresi, hareket sayısı, kardiyo dakikası; haftalık şerit; seri; "Spora gittin mi?" kontrolü.
- **Haftalık program:** her gün için ısınma → ağırlık → kardiyo → soğuma; aşama yol haritası.
- **Hareket kütüphanesi (100+ hareket):** her hareket için canlı animasyon (hız ayarı, durdur),
  başlangıç/hareket kareleri, Türkçe ve İngilizce YouTube videoları, adım adım anlatım, nefes,
  ipuçları, sık yapılan hatalar, zorluk (1–5) ve diz/bel yükü.
- **Kas haritası:** önden ve arkadan insan vücudu; ana kaslar kırmızı, yardımcı kaslar turuncu.
  Kütüphanede kasa dokununca o kası çalıştıran hareketler listelenir.
- **Alet yoksa değiştir:** her hareketin aynı işlevi gören alternatifleri var. "Salonumda yok"
  dediğin alet programdan otomatik çıkar; seçtiğin alternatif kalıcı olur.
- **Antrenman modu:** set süresi kronometresi, dinlenme geri sayımı (+/−15 sn, bip sesi, sesli koç,
  titreşim), süreli hareketlerde halka sayaç, kardiyo bölümleri (aralıklı antrenmanda sesli uyarı),
  ağırlık/tekrar kaydı, bir önceki seferden ağırlık önerisi, ekranın kapanmasını engelleme;
  yarıda bırakılırsa kaldığı yerden devam.
- **İlerleme:** kilo grafiği, BMI, hedefe kalan, haftalık tempo; 12 haftalık takvim; toplam süre,
  kardiyo ve tahmini kalori; kişisel rekorlar; 16 rozet; antrenman geçmişi.
- **Diz/bel koruma**, nabız bölgesi, günün ipucu (su, protein, uyku…), yedekle/yükle.

## Bildirimler
iPhone, ana ekran web uygulamalarının kendi başına saatli bildirim kurmasına izin vermez. Uygulamada
**Profil → Bildirimler**'den iki yol var:
1. **Takvime ekle:** 12 haftalık antrenmanlar hareket listesiyle Takvim'e eklenir — sabah, spordan
   30 dk önce ve akşam "Spora gittin mi?" uyarısı.
2. **Scriptable betiği:** ücretsiz Scriptable uygulamasıyla sabah planı, spor saati, "Spora gittin mi?"
   ve Pazartesi tartı bildirimleri + ana ekranda sıradaki antrenmanı gösteren widget.

## Dosyalar
- `index.html` — arayüz ve tasarım
- `js/exercises.js` — hareket kütüphanesi ve aletler
- `js/program.js` — program üretici (aşamalar, gün şablonları, alternatif seçimi)
- `js/figure.js` — hareket animasyon motoru
- `js/body.js` — kas haritası
- `js/app.js` — ekranlar, antrenman modu, kayıtlar, bildirim dosyaları
- `sw.js` — internetsiz çalışma

Veriler yalnızca telefonda (tarayıcı depolaması) tutulur.

> Bu program genel bir başlangıç programıdır, tıbbi tavsiye değildir. Kalp, tansiyon, şeker ya da
> eklem sorunun varsa başlamadan önce doktoruna danış; ağrıda dur.
