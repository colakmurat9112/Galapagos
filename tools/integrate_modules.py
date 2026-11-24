"""Tek seferlik: tek dosyalı modülleri (galapagos-*.html) çok dosyalı uygulamaya bağlar.
Yapılan değişiklikler (modül mantığına dokunmadan):
  1) <head> sonuna: gx-module etiketi, manifest/ikonlar, shared/shell.css, shared/core.js, shared/shell.js
  2) Modül içindeki parseNum ve fmtIn kopyası silinir (ortak core.js'teki aynı fonksiyon kullanılır)
  3) save() başına GX.dirty() → değişince veri köprüsüne yayın
  4) </body> önüne modülün köprü ayarı (hangi alan / buton / sekme)
Kullanım: python3 tools/integrate_modules.py <tek_dosyalar_klasörü> <repo_klasörü>
"""
import sys, os, re

SRC, DST = sys.argv[1], sys.argv[2]
MAP = [
    ('m1', 'galapagos-mekan-analizi.html', 'm1-mekan.html', "{}"),
    ('m2', 'galapagos-personel-vardiya.html', 'm2-personel.html', "{ta:'#m1Txt',btn:'#m1In',msg:'#m1Msg',tab:'kadro',apply:'#pdApply'}"),
    ('m3', 'galapagos-ciro-hedef.html', 'm3-ciro.html', "{ta:'#impTxt',btn:'#impIn',msg:'#impMsg',tab:'gider',apply:'#pdApply'}"),
    ('m4', 'galapagos-kurulum-nakit.html', 'm4-kurulum.html', "{ta:'#impTxt',btn:'#impIn',msg:'#impMsg',tab:'kredi'}"),
    ('m5', 'galapagos-vergi-sirket.html', 'm5-vergi.html', "{ta:'#impTxt',btn:'#impIn',msg:'#impMsg',tab:'ayar'}"),
    ('m6', 'galapagos-karar-panosu.html', 'm6-karar.html', """{ta:'#impTxt',btn:'#impIn',msg:'#impMsg',tab:'veri',
  exp(){const d=data(),m=model(d,st.wi,st.set,st.rs),r=x=>Number.isFinite(x)?Math.round(x):null;
    return {schema:'galapagos.karar.v1',module:'karar',verdict:m.verdict,score:r(m.score),open:r(m.open),tief:r(m.tief),
      dscr3:Number.isFinite(m.y.dscr)?+m.y.dscr.toFixed(2):null,save:r(m.y.save),revenue:r(m.y.R),venue:d.m1.name||'',
      loaded:MODS.filter(([k])=>d[k]._loaded).map(([k])=>k),veto:m.veto.map(v=>v[1])}},
  auto(t){importText(t);return ($('#impMsg')||{}).textContent||''},
  pull(){const s=GX.stale('m6');if(!s.length)return;importText(GX.upText(s));GX.markSeen('m6',s);GX.flush()},
  onReady(){this.pull()}}"""),
]

HEAD = """<meta name="gx-module" content="{id}">
<meta name="theme-color" content="#0f1411">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Galapagos">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" sizes="32x32" href="icons/favicon-32.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="stylesheet" href="shared/shell.css">
<script src="shared/core.js"></script>
<script src="shared/shell.js" defer></script>
</head>"""

def cut_fn(s, name):
    i = s.find('function %s(' % name)
    if i < 0: sys.exit('parseNum yok')
    j = s.find('\n}\n', i) + 3
    return s[:i] + s[j:]

for mid, src, dst, cfg in MAP:
    s = open(os.path.join(SRC, src), encoding='utf-8').read()
    if 'gx-module' in s: sys.exit(src + ' zaten bağlı')
    assert s.count('</head>') == 1
    s = s.replace('</head>', HEAD.format(id=mid))
    s = cut_fn(s, 'parseNum')
    s, n = re.subn(r"const fmtIn=n=>[^\n]*\n", "", s, count=1); assert n == 1, src
    assert s.count('function save(){try{') == 1, src
    s = s.replace('function save(){try{', 'function save(){GX.dirty();try{')
    assert s.count('</body>') == 1
    reg = "/* Galapagos veri köprüsü */\nGX.register('%s',%s);\n" % (mid, cfg)
    end = s.rfind('</script>')
    blk = s.rfind('\n}\n', 0, end)
    if mid == 'm6':  # M6 kodu { … } bloğu içinde: köprü modülün değişkenlerine erişmek için bloğun içine girer
        assert s[blk:end].strip() == '}', 'M6 blok sonu bulunamadı'
        s = s[:blk] + '\n' + reg + s[blk+1:]
    else:
        s = s.replace('</body>', '<script>' + reg + '</script>\n</body>')
    open(os.path.join(DST, dst), 'w', encoding='utf-8').write(s)
    print(mid, dst, len(s))
