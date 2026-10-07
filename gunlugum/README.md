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
- **Okumalar:** kitap, gazete, dergi, köşe yazısı, makale — türler Ayarlar → Okuma türleri'nden
  yeniden adlandırılır, simgesi değişir, yeni tür eklenir. Kitap eklerken adı ya da yazarıyla arama yapılır
  (Google Books / Open Library); kapak, yazar ve sayfa sayısı kendiliğinden gelir. Elle eklenen kitapların kapağı da
  internet varken kendiliğinden bulunur. Bir günde birden çok okuma girilebilir (sayaçtaki okumaya dokun → başka okuma seç).
  Kitabın yüzdesi, kalan sayfa ve tahmini bitiş; sayfalar bitince kitap kendiliğinden “bitti” olur.
- **Rapor (Hafta / Ay / Yıl):** “Günler” ve “Okumalar” görünümü (her kitap / gazete için sayfa, türlere göre toplam), kaç kitap okundu, okunan sayfa (önceki döneme göre % değişim), yazılan gün, günlük ortalama,
  hedefin tuttuğu gün sayısı, en uzun seri, sayfa grafiği (hedef çizgisiyle), ruh hâli dağılımı,
  yazılan kelime, biten kitap ve en çok okunan kitap. Grafikte çubuğa dokun → ayrıntı; ikinci dokunuş o güne / aya gider.

## Ayarlar
- Ad, günlük sayfa hedefi, tema (Sistem / Açık / Koyu — üstteki ay/güneş düğmesiyle de değişir).
- **Şifre kilidi:** 4 haneli şifre; uygulama 1 dakikadan uzun arka planda kalınca tekrar sorulur.
- **Yedek al / geri yükle** (.json) ve **metin olarak dışa aktar** (.txt). Telefon değiştirirken yedeği taşı.

## Dosyalar
`index.html` (arayüz ve stil), `app.js` (uygulama), `sw.js` (çevrimdışı), `manifest.webmanifest`,
`icon.svg` (ikonun kaynağı) ve ondan üretilen `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`.
