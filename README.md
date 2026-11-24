# Galapagos · Bar fizibilite

Galapagos Cocktailbar (Chemnitz) için 6 modüllü planlama uygulaması. Tamamen tarayıcıda çalışır; sunucu, hesap veya ücretli servis yoktur. Veriler sadece kullanılan tarayıcının `localStorage` alanında kalır.

| Dosya | İçerik |
|---|---|
| `index.html` | Ana sayfa: karar ışığı, modül durumu, **zinciri güncelle**, toplu içe aktarma, tam yedek, telefona kurulum |
| `m1-mekan.html` … `m6-karar.html` | Modül 1–6 (mantık, rehberler, TR/DE çıktılar aynen korunur) |
| `shared/core.js` | Ortak `parseNum` / `fmtIn` ve modüller arası veri köprüsü (`GX`) |
| `shared/shell.js`, `shared/shell.css` | Yan menü, "Önizle ve al" şeridi, güncelleme bildirimi |
| `sw.js`, `manifest.webmanifest`, `icons/` | Çevrimdışı çalışma ve ana ekran kısayolu |
| `dist/` | Aynı 7 sayfanın bağımsız tek dosya kopyaları (internetsiz / e-posta ile göndermek için) |
| `tools/build.py` | Sürüm numarasını günceller ve `dist/` klasörünü yeniden üretir |
| `tests/parsenum.html` | Ortak sayı kuralının test sayfası |

## GitHub Pages'e yükleme (bir kez)

1. GitHub'da **New repository** → ad: `galapagos` → **Public** → Create.
2. Repo sayfasında **Add file → Upload files**. Zip'ten çıkan klasörün **içindekileri** (klasörlerle birlikte) sürükle-bırak. `.nojekyll` dosyası da gelmeli (gizli dosya; görünmüyorsa **Add file → Create new file** ile boş bir `.nojekyll` oluştur).
3. **Commit changes**.
4. **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save.**
5. 1–2 dakika sonra adres: `https://KULLANICI_ADIN.github.io/galapagos/`

## Güncelleme yüklerken

1. Değiştirdiğin dosyalardan sonra (Python 3 varsa) repo klasöründe: `python3 tools/build.py`
2. Değişen dosyaları ve `sw.js`'i aynı yolla yükle.
3. Telefonda uygulama açıkken "Yeni sürüm hazır → Yenile" çıkar. GitHub Pages önbelleği yüzünden bu 10 dakikaya kadar gecikebilir.

## Telefona kısayol

- **iPhone:** adresi **Safari**'de aç → Paylaş → **Ana Ekrana Ekle**. Kısayol modunda yazdırma kısıtlıysa Modül 6 belgesini Safari'de aç.
- **Android:** Chrome'da ana sayfadaki **Ana ekrana ekle** düğmesi ya da ⋮ → **Uygulamayı yükle**.

## Veri

- Kayıt anahtarları değişmedi: `galapagos_m1_v1` … `galapagos_m6_v1`. Ek olarak `galapagos_bus_v1` (modül çıktıları köprüsü) ve `galapagos_app_v1` (son yedek tarihi).
- Her modül kaydettiğinde kendi "sonraki modüle aktar" JSON'unu köprüye yazar. Sonraki modül açıldığında **"Önizle ve al"** şeridi çıkar. Uygulamak senin onayındadır; Modül 6 otomatik çeker.
- Modüllerin kendi JSON içe/dışa aktarma ve yedek alanları aynen duruyor.
- **Veri cihaza bağlıdır.** Telefon ile laptop arasında taşımak için ana sayfada **Tüm verileri yedekle** → diğer cihazda **Toplu içe aktar**.
- `KULLANICI_ADIN.github.io` altındaki tüm repolar aynı tarayıcı deposunu paylaşır. Anahtarlar `galapagos_` ile başladığı için çakışmaz, ama "site verilerini sil" hepsini siler.
- Repo herkese açıktır ama içinde kişisel veri yoktur. **Yedek JSON dosyalarını repoya yükleme.**
- Modül 1'deki Gemini anahtarı sadece tarayıcıda durur ve tam yedeğe yazılmaz. Google AI Studio'da anahtarı **HTTP referrer: `https://KULLANICI_ADIN.github.io/*`** ile kısıtla.

## Eski tek dosyalardan taşıma

Eski Modül 1–6 sayfalarının her birinde **Yedek oluştur → Kopyala**. Altısını art arda ana sayfadaki **Toplu içe aktar** alanına yapıştır → **Önizle → Seçilenleri uygula**. Ardından **Zinciri güncelle**.
