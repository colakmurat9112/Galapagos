/* Galapagos · kabuk: yan menü, "Önizle ve al" şeridi, service worker */
(()=>{
  const G=window.GX;if(!G||G.AUTO||window.top!==window)return; // gizli çerçevede (zincir güncellemesi) arayüz yok
  const ME=G.ME,esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const tf=t=>{const d=new Date(t);return d.toLocaleDateString('de-DE',{day:'2-digit',month:'2-digit'})+' '+d.toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})};
  const ICON={home:'<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    m1:'<path d="M4 21V9l8-5 8 5v12"/><path d="M9 21v-6h6v6"/>',m2:'<circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3 3 0 0 1 0 6M21 20c0-2.6-1.6-4.8-4-5.6"/>',
    m3:'<path d="M4 19l5-6 4 3 7-9"/><path d="M15 7h5v5"/>',m4:'<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h4"/>',
    m5:'<path d="M7 3h8l4 4v14H7z"/><path d="M15 3v4h4M10 12h6M10 16h6"/>',m6:'<path d="M12 3v18M5 8h14M7 8l-3 7h6zM17 8l-3 7h6z"/>'};
  const svg=k=>`<svg viewBox="0 0 24 24" aria-hidden="true">${ICON[k]||''}</svg>`;
  const items=[{id:'home',file:'index.html',n:'Ana sayfa',s:'Ana sayfa'}].concat(G.MODS);

  function dot(id){if(id==='home')return '';const st=G.stale(id);return st.length?`<i class="gx-dot" title="Önceki modülde değişiklik var"></i>`:''}
  function sideHTML(){
    return `<div class="gx-brand"><span class="gx-logo">G</span><div><b>Galapagos</b><small>Bar fizibilite</small></div></div>
    <nav class="gx-nav" aria-label="Modüller">${items.map((m,i)=>`<a href="${m.file}" class="${m.id===ME?'on':''}"${m.id===ME?' aria-current="page"':''}>${svg(m.id)}<span>${i?`<em>${i}</em>`:''}${esc(m.n)}</span>${dot(m.id)}</a>`).join('')}</nav>
    <div class="gx-sfoot"><a href="index.html#yedek">Tüm verileri yedekle</a><small>Veriler sadece bu tarayıcıda kalır.</small></div>`;
  }
  function build(){
    document.body.classList.add('gx');
    const side=document.createElement('aside');side.className='gx-side';side.id='gxSide';side.innerHTML=sideHTML();
    const ov=document.createElement('div');ov.className='gx-ov';ov.addEventListener('click',close);
    document.body.prepend(ov);document.body.prepend(side);
    // ☰ başlıkta
    const hdr=document.querySelector('header.top');
    if(hdr){const b=document.createElement('button');b.type='button';b.className='gx-burger';b.setAttribute('aria-label','Menüyü aç');b.innerHTML='<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';b.addEventListener('click',open);hdr.prepend(b);hdr.classList.add('gx-hdr')}
    // alt sekme çubuğunun başına "Menü"
    const nav=document.querySelector('nav.tabs');
    if(nav){const a=document.createElement('a');a.href='#';a.className='gx-tabmenu';a.innerHTML='<svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>Modüller';a.addEventListener('click',e=>{e.preventDefault();open()});nav.prepend(a);
      const n=nav.querySelectorAll('a').length;nav.style.gridTemplateColumns=`repeat(${n},minmax(0,1fr))`;nav.classList.add('gx-n'+n)}
    // şerit
    if(ME!=='home'&&ME!=='m1'){const ban=document.createElement('div');ban.className='gx-ban';ban.id='gxBan';ban.hidden=true;
      if(hdr)hdr.after(ban);else document.body.prepend(ban)}
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
  }
  function open(){document.body.classList.add('gx-open');const f=document.querySelector('.gx-nav a');if(f)f.focus()}
  function close(){document.body.classList.remove('gx-open')}
  function refresh(){
    const side=document.getElementById('gxSide');if(side){const nav=side.querySelector('.gx-nav');const t=document.createElement('div');t.innerHTML=sideHTML();nav.replaceWith(t.querySelector('.gx-nav'))}
    const ban=document.getElementById('gxBan');if(!ban)return;
    if(ME==='m6'){ban.hidden=true;return}
    const st=G.stale(ME),b=G.bus();
    if(!st.length||!G.adapter||!G.adapter.ta){ban.hidden=true;return}
    ban.hidden=false;
    ban.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/></svg><div><b>${st.map(u=>`Modül ${u.slice(1)}`).join(' + ')} değişti</b><small>${st.map(u=>`${G.byId(u).s}: ${tf(b.pub[u].at)}`).join(' · ')}</small></div><div class="gx-bb"><button type="button" class="gx-take">Önizle ve al</button><button type="button" class="gx-skip">Yoksay</button></div>`;
    ban.querySelector('.gx-take').onclick=()=>{G.pullUI(st);refresh()};
    ban.querySelector('.gx-skip').onclick=()=>{G.markSeen(ME,st);refresh()};
  }
  function start(){build();refresh();
    window.addEventListener('gx:bus',refresh);
    window.addEventListener('storage',e=>{if(!e.key||/^galapagos_bus/.test(e.key)){refresh();if(ME==='m6'&&G.adapter&&G.adapter.pull)G.adapter.pull()}});
    sw();
  }
  /* ---------- service worker (sadece http/https) ---------- */
  function toast(html,btn,fn){let t=document.getElementById('gxToast');if(!t){t=document.createElement('div');t.id='gxToast';t.className='gx-toast';document.body.append(t)}
    t.innerHTML=`<span>${html}</span>${btn?`<button type="button">${btn}</button>`:''}`;t.classList.add('on');if(btn)t.querySelector('button').onclick=fn;}
  function sw(){
    if(!('serviceWorker' in navigator)||!/^https?:$/.test(location.protocol))return;
    navigator.serviceWorker.register('sw.js').then(reg=>{
      const ask=w=>toast('Yeni sürüm hazır.','Yenile',()=>w.postMessage('skip'));
      if(reg.waiting&&navigator.serviceWorker.controller)ask(reg.waiting);
      reg.addEventListener('updatefound',()=>{const w=reg.installing;if(!w)return;w.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)ask(w)})});
      setInterval(()=>reg.update().catch(()=>{}),60*60*1000);
    }).catch(()=>{});
    let done=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(done)return;done=true;location.reload()});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  window.GXShell={refresh,toast,open,close};
})();
