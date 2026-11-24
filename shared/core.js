/* Galapagos · ortak çekirdek
   - parseNum / fmtIn: 6 modülün tek sayı kuralı
   - GX: modüller arası veri köprüsü (localStorage anahtarı galapagos_bus_v1)
   Modüllerin kendi kayıt anahtarları (galapagos_m1_v1 … galapagos_m6_v1) ve JSON şemaları değişmez. */

/* ---------- Güvenli sayı ----------
   dec=true  → nokta ONDALIK (7.5 → 7,5); "1.234,56" ve "1.234.567" yine doğru okunur
   dec=false → büyük tutar: "1.250" → 1250 (binlik), "1.250,50" → 1250,5
   Hangi alanın büyük tutar olduğu modülün kendi BIG/DEC listesindedir. */
function parseNum(x,dec){
  if(typeof x==='number')return Number.isFinite(x)?x:NaN;
  if(x==null)return NaN;
  const m=String(x).replace(/[\s  '’]/g,'').replace(/\u2212/g,'-').match(/-?\d[\d.,]*/);
  if(!m)return NaN;
  let s=m[0].replace(/[.,]+$/,'');const neg=s[0]==='-';if(neg)s=s.slice(1);
  const d=s.lastIndexOf('.'),c=s.lastIndexOf(',');
  if(d>-1&&c>-1){const dc=d>c?'.':',';s=s.split(dc==='.'?',':'.').join('');const i=s.lastIndexOf(dc);s=s.slice(0,i).split(dc).join('')+'.'+s.slice(i+1)}
  else if(c>-1)s=(s.split(',').length>2)?s.split(',').join(''):s.replace(',','.');
  else if(d>-1){if(s.split('.').length>2)s=s.split('.').join('');else if(!dec&&/^[1-9]\d{0,2}\.\d{3}$/.test(s))s=s.replace('.','')}
  const n=parseFloat(s);return Number.isFinite(n)?(neg?-n:n):NaN;
}
const fmtIn=n=>n!==''&&n!=null&&Number.isFinite(+n)?String(+(+n).toFixed(4)).replace('.',','):'';

/* ---------- Veri köprüsü ---------- */
const GX=(()=>{
  const BUS='galapagos_bus_v1',APP='galapagos_app_v1';
  const MODS=[
    {id:'m1',file:'m1-mekan.html',key:'galapagos_m1_v1',sc:'galapagos.mekan',n:'Mekân & Kapasite',s:'Mekân'},
    {id:'m2',file:'m2-personel.html',key:'galapagos_m2_v1',sc:'galapagos.personel',n:'Personel & Vardiya',s:'Personel'},
    {id:'m3',file:'m3-ciro.html',key:'galapagos_m3_v1',sc:'galapagos.ciro',n:'Ciro & Hedef',s:'Ciro'},
    {id:'m4',file:'m4-kurulum.html',key:'galapagos_m4_v1',sc:'galapagos.kurulum',n:'Kurulum & Nakit',s:'Kurulum'},
    {id:'m5',file:'m5-vergi.html',key:'galapagos_m5_v1',sc:'galapagos.vergi',n:'Vergi & Şirket',s:'Vergi'},
    {id:'m6',file:'m6-karar.html',key:'galapagos_m6_v1',sc:'galapagos.karar',n:'Master Karar Panosu',s:'Karar'}];
  const UP={m2:['m1'],m3:['m1','m2','m4'],m4:['m1','m3'],m5:['m3','m4'],m6:['m1','m2','m3','m4','m5']};
  const byId=id=>MODS.find(m=>m.id===id);
  const meta=document.querySelector('meta[name="gx-module"]');
  const ME=meta?meta.content:'home';
  const AUTO=/[?&]gx=auto\b/.test(location.search);
  let ad=null,ready=false,tm=null,loadedAt=0;

  const read=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return null}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}};
  function bus(){const b=read(BUS)||{};b.pub=b.pub||{};b.seen=b.seen||{};return b}
  const app=()=>Object.assign({lastBackup:0},read(APP)||{});
  const setApp=o=>write(APP,Object.assign(app(),o));

  function stable(v){
    if(Array.isArray(v))return '['+v.map(stable).join(',')+']';
    if(v&&typeof v==='object')return '{'+Object.keys(v).filter(k=>k!=='exported_at').sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')+'}';
    return JSON.stringify(v);
  }
  function hash(o){const s=stable(o);let h=5381;for(let i=0;i<s.length;i++)h=((h<<5)+h+s.charCodeAt(i))|0;return (h>>>0).toString(36)+'.'+s.length}

  /* Metin içindeki { … } bloklarını sırayla çıkarır (birden çok JSON, etrafında yazı olsa bile) */
  function extractObjects(t){
    const out=[];let depth=0,start=-1,inS=false,esc=false;t=String(t||'');
    for(let i=0;i<t.length;i++){const ch=t[i];
      if(inS){if(esc)esc=false;else if(ch==='\\')esc=true;else if(ch==='"')inS=false;continue}
      if(ch==='"'){if(depth>0)inS=true;continue}
      if(ch==='{'){if(depth===0)start=i;depth++}
      else if(ch==='}'&&depth>0){depth--;if(depth===0&&start>-1){try{out.push(JSON.parse(t.slice(start,i+1)))}catch(e){}start=-1}}}
    if(!out.length){try{const j=JSON.parse(t);(Array.isArray(j)?j:[j]).forEach(x=>x&&typeof x==='object'&&out.push(x))}catch(e){}}
    return out;
  }
  /* Şema → {mod, kind:'export'|'backup'|'app'} */
  function classify(j){
    if(!j||typeof j!=='object'||typeof j.schema!=='string')return null;
    if(j.schema==='galapagos.app.backup.v1')return {kind:'app'};
    const m=MODS.find(m=>j.schema===m.sc+'.v1'||j.schema===m.sc+'.backup.v1');
    if(!m)return null;
    return {mod:m.id,kind:j.schema.endsWith('.backup.v1')?'backup':'export'};
  }

  function publish(id,obj,force){
    if(!obj)return false;const b=bus(),h=hash(obj);
    if(!force&&b.pub[id]&&b.pub[id].hash===h)return false;
    b.pub[id]={at:Date.now(),hash:h,data:obj};
    // modül kendi yayınını görmüş sayılır
    return write(BUS,b);
  }
  function stale(id){const b=bus();return (UP[id]||[]).filter(u=>b.pub[u]&&((b.seen[id]||{})[u]!==b.pub[u].hash))}
  function markSeen(id,ups){const b=bus();b.seen[id]=b.seen[id]||{};(ups||UP[id]||[]).forEach(u=>{if(b.pub[u])b.seen[id][u]=b.pub[u].hash});write(BUS,b)}
  function upText(ups){const b=bus();return ups.filter(u=>b.pub[u]).map(u=>JSON.stringify(b.pub[u].data,null,1)).join('\n\n')}

  /* ---------- modül tarafı ---------- */
  function expFromTxt(){const el=document.querySelector('#exTxt');if(!el||!el.value)return null;try{return JSON.parse(el.value)}catch(e){return null}}
  function flush(force){
    if(!ad||ME==='home')return false;
    let o=null;try{o=ad.exp?ad.exp():expFromTxt()}catch(e){o=null}
    return publish(ME,o,force);
  }
  function dirty(){if(!ready)return;clearTimeout(tm);tm=setTimeout(()=>{flush();window.dispatchEvent(new Event('gx:bus'))},600)}
  function register(id,cfg){
    ad=cfg||{};
    const go=()=>{
      loadedAt=Date.now();
      // ilk açılış: henüz yayın yoksa yayınla (yapıştırılmış bir çıktının üstüne açılışta yazmaz)
      setTimeout(()=>{if(!bus().pub[ME])flush();ready=true;if(ad.onReady)try{ad.onReady()}catch(e){}window.dispatchEvent(new Event('gx:bus'))},350);
    };
    if(document.readyState==='complete')go();else window.addEventListener('load',go);
  }
  const sleep=ms=>new Promise(r=>setTimeout(r,ms));
  function setVal(sel,v){const el=document.querySelector(sel);if(!el)return false;el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));return true}
  function txt(sel){const el=document.querySelector(sel);return el?el.textContent.trim():''}
  /* Önizle ve al: modülün kendi içe aktarma akışını açar (uygulama kullanıcıda) */
  function pullUI(ups){
    ups=ups||stale(ME);if(!ups.length||!ad||!ad.ta)return false;
    if(ad.tab&&location.hash!=='#'+ad.tab)location.hash=ad.tab;
    setVal(ad.ta,upText(ups));
    const b=document.querySelector(ad.btn);if(b)b.click();
    markSeen(ME,ups);
    setTimeout(()=>{const el=document.querySelector(ad.msg)||document.querySelector(ad.ta);if(el)el.scrollIntoView({block:'center',behavior:'smooth'})},120);
    return true;
  }
  /* Otomatik al (ana sayfadaki zincir güncellemesi ve M6): önizlemeyi kendisi onaylar */
  async function autoImport(ups){
    ups=(ups||UP[ME]||[]).filter(u=>bus().pub[u]);
    if(!ups.length)return {ok:false,msg:'Önceki modül verisi yok'};
    if(ad.auto){const r=ad.auto(upText(ups));markSeen(ME,ups);await sleep(250);flush();return {ok:true,msg:r||'alındı',ups}}
    setVal(ad.ta,upText(ups));const b=document.querySelector(ad.btn);if(b)b.click();await sleep(250);
    let msg=txt(ad.msg);
    if(ad.apply){const a=document.querySelector(ad.apply);if(a){a.click();await sleep(250);msg=txt(ad.msg)||msg}}
    markSeen(ME,ups);flush();
    return {ok:true,msg:msg||'alındı',ups};
  }
  async function restore(text){
    const el=document.querySelector('#bkTxt'),b=document.querySelector('#bkIn');
    if(!el||!b)return {ok:false,msg:'Bu modülde geri yükleme alanı yok'};
    el.value=text;b.click();await sleep(300);flush(true);
    return {ok:true,msg:txt('#bkMsg')||'geri yüklendi'};
  }

  /* ---------- toplu yedek ---------- */
  function appBackup(){
    const keys={};
    for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(!/^galapagos_/.test(k)||k===APP)continue;
      let v=read(k);
      if(k==='galapagos_m1_v1'&&v&&v.settings){v=JSON.parse(JSON.stringify(v));delete v.settings.geminiKey}
      keys[k]=v}
    return {schema:'galapagos.app.backup.v1',exported_at:new Date().toISOString(),app:'Galapagos',keys};
  }
  function snapshot(){const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(/^galapagos_/.test(k)&&k!==APP)o[k]=localStorage.getItem(k)}return o}
  function restoreSnapshot(o){
    const cur=[];for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(/^galapagos_/.test(k)&&k!==APP)cur.push(k)}
    cur.forEach(k=>{if(!(k in o))localStorage.removeItem(k)});Object.entries(o).forEach(([k,v])=>localStorage.setItem(k,v));
  }
  function applyAppBackup(j){
    const gk=(read('galapagos_m1_v1')||{}).settings?.geminiKey;
    Object.entries(j.keys||{}).forEach(([k,v])=>{if(!/^galapagos_/.test(k)||k===APP||v==null)return;
      if(k==='galapagos_m1_v1'&&gk&&v.settings&&!v.settings.geminiKey)v.settings.geminiKey=gk;
      write(k,v)});
  }

  return {MODS,UP,byId,ME,AUTO,bus,app,setApp,hash,extractObjects,classify,publish,stale,markSeen,upText,
    register,dirty,flush,pullUI,autoImport,restore,appBackup,snapshot,restoreSnapshot,applyAppBackup,read,write,
    get adapter(){return ad},get ready(){return ready},sleep};
})();
window.GX=GX;
