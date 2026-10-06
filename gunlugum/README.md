# Günlüğüm

Her gün bir sayfa: gününü yaz, okuduğun sayfa sayısını gir, okuma notlarını tut.
iPhone'a (ve Android'e) ana ekran uygulaması olarak eklenir; tam ekran açılır, internetsiz çalışır.

Adres (yayınlandıktan sonra): https://felixdemario.github.io/felixdemario/gunlugum/

## Kurulum
1. Telefonda **Safari** ile adresi aç.
2. **Paylaş → Ana Ekrana Ekle**. Günlüğüm ikonu ana ekrana gelir.
3. İlk açılışta adını (isteğe bağlı) ve günlük sayfa hedefini seç.

Her kullanıcı kendi telefonunda kullanır; veriler yalnızca o cihazda tutulur, hiçbir yere gönderilmez.

## Ekranlar
Hiçbir ekran aşağı-yukarı kaydırılmaz; her şey tek ekrana sığar. Sadece uzun yazılar ve listeler kendi kutusunda kayar.

- **Bugün:** tarih, seri (🔥), hafta şeridi (kaydırınca önceki hafta), ruh hâli (5 yüz),
  çizgili defter sayfası (Günlük / Okuma notları sekmeleri), kelime sayısı, otomatik kayıt.
  Altta okunan kitap ve sayfa sayacı: −/+ (basılı tutunca hızlı), sayıya dokunup yazılabilir;
  halka günlük hedefe ne kadar yaklaştığını gösterir. Yazmaya başlayınca diğer her şey gizlenir (odak modu).
- **Takvim:** okunan sayfaya göre renklenen ay görünümü (az → çok), ruh hâli noktaları,
  seçilen günün önizlemesi, “Geçen yıl / geçen ay bu gün” hatırlatması, tüm kayıtlarda arama.
- **Kitaplar:** şu an okunan kitap, ilerleme yüzdesi, kalan sayfa ve okuma hızına göre tahmini bitiş tarihi.
  Sayfalar toplamı geçince kitap kendiliğinden “bitti” olur. Bitenler ve tüm okuma notları ayrı sekmelerde;
  kitaba dokununca o kitabın bütün notları tarih sırasıyla toplanır.
- **Rapor (Hafta / Ay / Yıl):** okunan sayfa (önceki döneme göre % değişim), yazılan gün, günlük ortalama,
  hedefin tuttuğu gün sayısı, en uzun seri, sayfa grafiği (hedef çizgisiyle), ruh hâli dağılımı,
  yazılan kelime, biten kitap ve en çok okunan kitap. Grafikte çubuğa dokun → ayrıntı; ikinci dokunuş o güne / aya gider.

## Ayarlar
- Ad, günlük sayfa hedefi, tema (Sistem / Açık / Koyu — üstteki ay/güneş düğmesiyle de değişir).
- **Şifre kilidi:** 4 haneli şifre; uygulama 1 dakikadan uzun arka planda kalınca tekrar sorulur.
- **Yedek al / geri yükle** (.json) ve **metin olarak dışa aktar** (.txt). Telefon değiştirirken yedeği taşı.

## Dosyalar
`index.html` (arayüz ve stil), `app.js` (uygulama), `sw.js` (çevrimdışı), `manifest.webmanifest`,
`icon.svg` (ikonun kaynağı) ve ondan üretilen `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`.
