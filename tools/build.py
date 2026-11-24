"""Galapagos derleme scripti
Kullanım (repo klasöründe):  python3 tools/build.py
1) sw.js içindeki VERSION ve FILES listesini dosyaların içeriğine göre günceller
   → GitHub'a yükleyince telefonda "Yeni sürüm hazır → Yenile" çıkar.
2) dist/ klasörüne 7 bağımsız tek dosya üretir (ortak CSS/JS içine gömülü).
   Bu dosyalar internet ve sunucu olmadan çift tıkla açılır; birbirine menüden bağlıdır.
Sadece Python 3 gerekir, ek paket yok.
"""
import hashlib, os, re, sys, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
PAGES = ['index.html', 'm1-mekan.html', 'm2-personel.html', 'm3-ciro.html', 'm4-kurulum.html', 'm5-vergi.html', 'm6-karar.html']
ASSETS = ['manifest.webmanifest', 'shared/core.js', 'shared/shell.js', 'shared/shell.css',
          'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png']

def rd(p, b=False):
    with open(p, 'rb' if b else 'r', **({} if b else {'encoding': 'utf-8'})) as f: return f.read()

missing = [p for p in PAGES + ASSETS if not os.path.exists(p)]
if missing: sys.exit('Eksik dosya: ' + ', '.join(missing))

# 1) service worker sürümü
h = hashlib.sha256()
for p in PAGES + ASSETS: h.update(p.encode()); h.update(rd(p, True))
ver = 'gx-' + datetime.date.today().strftime('%Y%m%d') + '-' + h.hexdigest()[:8]
files = ['./'] + ['./' + p for p in PAGES + ASSETS]
sw = rd('sw.js')
sw = re.sub(r"const VERSION='[^']*';", "const VERSION='%s';" % ver, sw, count=1)
sw = re.sub(r"const FILES=\[[^\]]*\];", "const FILES=%s;" % str(files).replace(' ', ''), sw, count=1)
open('sw.js', 'w', encoding='utf-8').write(sw)

# 2) dist/ tek dosyalar
os.makedirs('dist', exist_ok=True)
css, core, shell = rd('shared/shell.css'), rd('shared/core.js'), rd('shared/shell.js')
for js in (core, shell):
    if '</script' in js.lower(): sys.exit('JS içinde </script var, gömülemez')
for p in PAGES:
    s = rd(p)
    s = s.replace('<link rel="stylesheet" href="shared/shell.css">', '<style>\n' + css + '\n</style>')
    s = s.replace('<script src="shared/core.js"></script>', '<script>\n' + core + '\n</script>')
    s = s.replace('<script src="shared/shell.js" defer></script>', '<script>\n' + shell + '\n</script>')
    s = re.sub(r'<link rel="(manifest|icon|apple-touch-icon)"[^>]*>\n?', '', s)
    if 'src="shared/' in s or 'href="shared/' in s: sys.exit(p + ': gömülemeyen ortak dosya bağlantısı kaldı')
    open(os.path.join('dist', p), 'w', encoding='utf-8').write(s)

print('sw.js sürümü:', ver)
print('dist/:', ', '.join(PAGES))
