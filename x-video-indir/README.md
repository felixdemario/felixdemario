# X (Twitter) Video İndirme Kestirmesi — iPhone

X'teki bir gönderiyi **Paylaş → X Video İndir** ile Fotoğraflar'a kaydeden iOS kestirmesi.
Ekstra uygulama, hesap veya ücret gerekmiyor.

- `X-Video-Indir.shortcut` — hazır kestirme dosyası (içe aktarılabilir)
- `build_shortcut.py` — bu dosyayı üreten betik (uyarlamak isterseniz)

---

## Nasıl çalışıyor?

X'in resmî bir indirme API'si yok. Kestirme, herkese açık **fxtwitter** önizleme
API'sini kullanıyor: gönderi bağlantısındaki alan adı `api.fxtwitter.com` ile
değiştiriliyor, dönen JSON'dan videonun doğrudan `.mp4` adresi alınıyor ve indirilip
Fotoğraflar'a kaydediliyor.

```
https://x.com/kullanici/status/123456   (paylaşılan bağlantı)
        ↓ alan adı değiştir
https://api.fxtwitter.com/kullanici/status/123456   → JSON
        ↓ tweet → media → videos → [0] → url
https://video.twimg.com/....mp4   → indir → Fotoğraflar
```

Gönderide birden fazla video varsa (X'te en fazla 4) hepsi tek tek kaydedilir.

---

## Kurulum — Yol 1: hazır dosyayı içe aktar (hızlı)

1. iPhone'da **Ayarlar → Kestirmeler → Güvenilmeyen Kestirmelere İzin Ver**'i açın.
   (Bu seçenek görünmüyorsa önce Kestirmeler uygulamasında herhangi bir kestirmeyi
   bir kez çalıştırın, sonra tekrar bakın.)
2. iPhone'daki Safari ile `X-Video-Indir.shortcut` dosyasını açıp indirin
   → **İndirilenler**'e düşer.
3. Dosyalar uygulamasından dosyaya dokunun → **Kestirmeler**'e aktarılır →
   en alta inip **Güvenilmeyen Kestirmeyi Ekle**'ye dokunun.
4. Kestirmeye dokunup **ⓘ → Paylaşım Sayfasında Göster**'in açık olduğunu doğrulayın.

> Not: İmzasız kestirme dosyaları bazı iOS sürümlerinde içe aktarılamayabiliyor.
> Bir sorun yaşarsanız aşağıdaki Yol 2 ile 2-3 dakikada elle kurabilirsiniz —
> sonuç birebir aynı.

## Kurulum — Yol 2: elle oluştur (her zaman çalışır)

Kestirmeler → **+** → aşağıdaki eylemleri sırayla ekleyin. Her eylemin girdisi bir
önceki adımın çıktısıdır (Kestirmeler bunu genelde otomatik doldurur).

| # | Eylem | Ayar |
|---|-------|------|
| 1 | **Girdiden URL'leri Al** | Girdi: `Kestirme Girdisi` |
| 2 | **Listeden Öğe Al** | İlk Öğe |
| 3 | **Metni Değiştir** | Bul: `\?.*$` — Değiştir: *(boş)* — **Düzenli İfade: açık** |
| 4 | **Metni Değiştir** | Bul: `^https?://(www\.\|mobile\.)?(x\|twitter\|vxtwitter\|fixupx\|fxtwitter)\.com/` — Değiştir: `https://api.fxtwitter.com/` — **Düzenli İfade: açık** |
| 5 | **URL'nin İçeriğini Al** | URL: 4. adımın çıktısı (Yöntem: GET) |
| 6 | **Sözlük Değeri Al** | Anahtar: `tweet` |
| 7 | **Sözlük Değeri Al** | Anahtar: `media` |
| 8 | **Sözlük Değeri Al** | Anahtar: `videos` |
| 9 | **Her Öğe İçin Tekrarla** | Girdi: 8. adımın çıktısı |
| 10 | ↳ **Sözlük Değeri Al** | Anahtar: `url` — Girdi: `Tekrar Öğesi` |
| 11 | ↳ **URL'nin İçeriğini Al** | URL: 10. adımın çıktısı |
| 12 | ↳ **Fotoğraf Albümüne Kaydet** | Girdi: 11. adımın çıktısı |
| 13 | **Bildirim Göster** | `Video Fotoğraflar'a kaydedildi ✅` |

Son olarak **ⓘ** sekmesinde:
- **Paylaşım Sayfasında Göster**: açık
- Kabul edilen tür: **URL** ve **Metin**
- İsim: `X Video İndir`

---

## Kullanım

1. X uygulamasında (veya Safari'de) videolu gönderide **Paylaş → Bağlantıyı Kopyala /
   Paylaş**'a dokunun.
2. Paylaşım sayfasında **X Video İndir**'i seçin.
3. Birkaç saniye sonra video Fotoğraflar'da. İlk çalıştırmada iOS, `api.fxtwitter.com`
   ve `video.twimg.com` erişimi ile Fotoğraflar izni soracak — **İzin Ver** deyin.

Kestirmeyi ana ekrana da ekleyip, bağlantıyı kopyaladıktan sonra doğrudan
çalıştıracak hale getirmek isterseniz 1. adımı `Panoyu Al` ile değiştirin.

---

## Sorun giderme

| Belirti | Çözüm |
|---|---|
| "Sözlük değeri bulunamadı" | Gönderide video yok (sadece fotoğraf/GIF olabilir) ya da gönderi gizli/silinmiş. |
| Boş sonuç / hata döner | fxtwitter geçici olarak kapalı olabilir. 4. adımdaki adresi `https://api.vxtwitter.com/Twitter/` yapıp 6-8. adımları tek bir **Sözlük Değeri Al → `media_extended`** ile değiştirin, 10. adımda anahtar yine `url` kalsın. |
| Video kaydedilmiyor | Ayarlar → Kestirmeler → X Video İndir → Fotoğraflar izni. |
| Yaş sınırlı / özel hesap | Bu API oturum açmadığı için bunlara erişemez; indirilemez. |

## Not

Bu kestirme yalnızca herkese açık gönderilerdeki videoları kişisel kullanım için indirir.
İçerik telif hakkı sahibine aittir; yeniden yayınlamadan önce hak sahibinin iznini alın
ve platformun kullanım koşullarına uyun.
