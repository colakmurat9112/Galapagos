/* Galapagos service worker: uygulama dosyalarını önbelleğe alır, çevrimdışı açar.
   VERSION ve FILES tools/build.py tarafından güncellenir — elle değiştirmen gerekmez. */
const VERSION='gx-20261124-be9ba860';
const FILES=['./','./index.html','./m1-mekan.html','./m2-personel.html','./m3-ciro.html','./m4-kurulum.html','./m5-vergi.html','./m6-karar.html','./manifest.webmanifest','./shared/core.js','./shared/shell.js','./shared/shell.css','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png','./icons/apple-touch-icon.png','./icons/favicon-32.png'];
const FONT_HOSTS=['fonts.googleapis.com','fonts.gstatic.com'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION&&k!=='gx-fonts').map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('message',e=>{if(e.data==='skip')self.skipWaiting()});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(FONT_HOSTS.includes(u.hostname)){ // yazı tipleri: önbellekten, arka planda yenile
    e.respondWith(caches.open('gx-fonts').then(c=>c.match(r).then(hit=>{const net=fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone());return res}).catch(()=>hit);return hit||net})));return;
  }
  if(u.origin!==location.origin)return; // Gemini, OSM, Overpass: her zaman ağdan, önbelleğe alınmaz
  e.respondWith(caches.open(VERSION).then(c=>c.match(r,{ignoreSearch:true}).then(hit=>hit||fetch(r).then(res=>{if(res.ok&&u.pathname.startsWith(new URL('./',self.registration.scope).pathname))c.put(r,res.clone());return res}).catch(()=>r.mode==='navigate'?c.match('./index.html'):Response.error()))));
});
