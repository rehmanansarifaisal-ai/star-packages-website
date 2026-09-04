/* Theme controller: persistent, accessible light/dark mode across all pages. */
(function initThemeController(){
  const root=document.documentElement, btn=document.getElementById('themeToggle');
  if(!btn) return;
  const getTheme=()=>root.dataset.theme==='dark'?'dark':'light';
  const sync=()=>{
    const dark=getTheme()==='dark';
    btn.setAttribute('aria-pressed',String(dark));
    btn.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');
    btn.title=dark?'Switch to light mode':'Switch to dark mode';
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta) meta.setAttribute('content',dark?'#071329':'#0b4ea2');
  };
  sync();
  btn.addEventListener('click',()=>{
    const next=getTheme()==='dark'?'light':'dark';
    root.dataset.theme=next;
    try{localStorage.setItem('sp-theme',next)}catch(e){}
    sync();
  });
})();

const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const yearEl=$('#year'); if(yearEl) yearEl.textContent=new Date().getFullYear();

/* Makkah hero slideshow: supports makkah-hero.jpg through makkah-hero (9).jpg */
(function initHeroSlideshow(){
  const hero=document.querySelector('.hero');
  const currentLayer=document.querySelector('.hero-slide-current');
  const nextLayer=document.querySelector('.hero-slide-next');
  const prevBtn=document.querySelector('.hero-prev');
  const nextBtn=document.querySelector('.hero-next');
  const dotsWrap=document.querySelector('.hero-slider-dots');
  if(!hero||!currentLayer||!nextLayer||!prevBtn||!nextBtn||!dotsWrap) return;

  const imageNames=Array.from({length:10},(_,i)=>
    i===0 ? 'makkah-hero.jpg' : `makkah-hero (${i}).jpg`
  );
  const base='assets/site/';
  let available=[];
  let index=0;
  let timer=null;
  let transitionLock=false;

  const preload=(name)=>new Promise(resolve=>{
    const img=new Image();
    img.onload=()=>resolve(true);
    img.onerror=()=>resolve(false);
    img.src=base+name;
  });

  Promise.all(imageNames.map(async name=>({name,ok:await preload(name)}))).then(results=>{
    available=results.filter(x=>x.ok).map(x=>x.name);
    if(!available.length) available=['makkah-hero.jpg'];
    renderDots();
    setSlide(0,false);
    startAuto();
  });

  function renderDots(){
    dotsWrap.innerHTML='';
    if(available.length<=1){ dotsWrap.hidden=true; prevBtn.hidden=true; nextBtn.hidden=true; return; }
    dotsWrap.hidden=false; prevBtn.hidden=false; nextBtn.hidden=false;
    available.forEach((name,i)=>{
      const b=document.createElement('button');
      b.type='button'; b.className='hero-slider-dot';
      b.setAttribute('aria-label',`Show Makkah image ${i+1}`);
      b.addEventListener('click',()=>{ stopAuto(); setSlide(i,true); startAuto(); });
      dotsWrap.appendChild(b);
    });
  }

  function updateDots(){
    [...dotsWrap.children].forEach((dot,i)=>dot.classList.toggle('active',i===index));
  }

  function setBackground(el,name){
    el.style.backgroundImage=`url("${base}${name.replaceAll('"','%22')}")`;
  }

  function setSlide(nextIndex,animate=true){
    if(!available.length || transitionLock) return;
    nextIndex=(nextIndex+available.length)%available.length;
    if(nextIndex===index && currentLayer.style.backgroundImage) return;
    transitionLock=animate;
    setBackground(nextLayer,available[nextIndex]);
    if(!animate){
      currentLayer.style.backgroundImage=nextLayer.style.backgroundImage;
      currentLayer.classList.add('visible');
      nextLayer.classList.remove('visible');
      index=nextIndex; updateDots(); transitionLock=false; return;
    }
    nextLayer.classList.add('visible');
    currentLayer.classList.remove('visible');
    window.setTimeout(()=>{
      setBackground(currentLayer,available[nextIndex]);
      currentLayer.classList.add('visible');
      nextLayer.classList.remove('visible');
      index=nextIndex;
      updateDots();
      transitionLock=false;
    },650);
  }

  function move(delta){ stopAuto(); setSlide(index+delta,true); startAuto(); }
  function startAuto(){ stopAuto(); if(available.length>1) timer=window.setInterval(()=>setSlide(index+1,true),2500); }
  function stopAuto(){ if(timer){window.clearInterval(timer);timer=null;} }

  prevBtn.addEventListener('click',()=>move(-1));
  nextBtn.addEventListener('click',()=>move(1));
  hero.addEventListener('mouseenter',stopAuto);
  hero.addEventListener('mouseleave',()=>{
    hero.style.setProperty('--hero-mx','0px');
    hero.style.setProperty('--hero-my','0px');
    startAuto();
  });
  hero.addEventListener('mousemove',e=>{
    const r=hero.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-.5;
    const y=(e.clientY-r.top)/r.height-.5;
    hero.style.setProperty('--hero-mx',`${(x*10).toFixed(2)}px`);
    hero.style.setProperty('--hero-my',`${(y*7).toFixed(2)}px`);
  });
  document.addEventListener('visibilitychange',()=>document.hidden?stopAuto():startAuto());

  let touchX=0;
  hero.addEventListener('touchstart',e=>{touchX=e.changedTouches[0].clientX;},{passive:true});
  hero.addEventListener('touchend',e=>{
    const dx=e.changedTouches[0].clientX-touchX;
    if(Math.abs(dx)>45) move(dx<0?1:-1);
  },{passive:true});
})();

const menu=$('#mainNav'),toggle=$('#menuToggle');
toggle?.addEventListener('click',()=>{const open=menu.classList.toggle('open');toggle.setAttribute('aria-expanded',open)});
$$('#mainNav a').forEach(a=>a.addEventListener('click',()=>{menu.classList.remove('open');toggle.setAttribute('aria-expanded','false')}));

const chatButton=$('#chatButton'), chatPanel=$('#chatPanel'), chatClose=$('#chatClose'), chatBody=$('#chatBody');
const faqs={
 'What services does Star Packages provide?':'Star Packages provides travel and tourism services, tourist and business travel support, computerised reservation support for airline, hotel and car rental requirements, and dedicated Umrah and Hajj arrangements.',
 'How can I request Umrah package details?':'Use the contact section, call (021) 32575228-9, or email starpackages786@gmail.com. The supplied website lists 2025–26 and 15 Days Umrah package documents; rates and availability are subject to change.',
 'Where is the office?':'Jamia Binoria Alamia, SITE Karachi No. 16 – 75700, Pakistan.',
 'Which certificates are available?':'The supplied company materials include KCCI Membership Certificate, DTS Certificate, TAAP Membership Certificate, and IATA Certificate of Accreditation.',
};
function addMsg(text,type){const d=document.createElement('div');d.className=`chat-msg ${type}`;d.textContent=text;chatBody.appendChild(d);chatBody.scrollTop=chatBody.scrollHeight}
function openChat(){if(!chatPanel) return; chatPanel.classList.add('open');chatPanel.setAttribute('aria-hidden','false')}
function closeChat(){if(!chatPanel) return; chatPanel.classList.remove('open');chatPanel.setAttribute('aria-hidden','true')}
chatButton?.addEventListener('click',()=>chatPanel.classList.contains('open')?closeChat():openChat()); chatClose?.addEventListener('click',closeChat);
$$('.chat-options button').forEach(btn=>btn.addEventListener('click',()=>{const q=btn.dataset.question;addMsg(q,'user');setTimeout(()=>addMsg(faqs[q]||'Please contact Star Packages directly for the latest information.','bot'),180)}));

const lightbox=$('#lightbox'),lbImg=$('#lightboxImage');
function showLightbox(src){lbImg.src=src;lightbox.classList.add('open');lightbox.setAttribute('aria-hidden','false')}
function hideLightbox(){lightbox.classList.remove('open');lightbox.setAttribute('aria-hidden','true');lbImg.src=''}
$$('[data-lightbox]').forEach(el=>el.addEventListener('click',()=>showLightbox(el.dataset.lightbox)));
$('#lightboxClose')?.addEventListener('click',hideLightbox); lightbox?.addEventListener('click',e=>{if(e.target===lightbox)hideLightbox()});document.addEventListener('keydown',e=>{if(e.key==='Escape'){hideLightbox();closeChat()}});

$('#enquiryForm')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget);const subject=encodeURIComponent(f.get('subject'));const body=encodeURIComponent(`Name: ${f.get('name')}\nEmail: ${f.get('email')}\n\n${f.get('message')}`);window.location.href=`mailto:starpackages786@gmail.com?subject=${subject}&body=${body}`});

const toast=$('#toast');let toastTimer;function notify(msg){clearTimeout(toastTimer);toast.textContent=msg;toast.classList.add('show');toastTimer=setTimeout(()=>toast.classList.remove('show'),2500)}
$$('.unconfigured').forEach(b=>b.addEventListener('click',()=>notify(`${b.dataset.name} profile link is not listed on the current Star Packages website.`)));


/* Page-wide interaction layer. The existing Makkah slideshow remains untouched. */
(function initPremiumInteractions(){
  const header=document.querySelector('.site-header');
  const updateHeader=()=>header&&header.classList.toggle('scrolled',window.scrollY>18);
  updateHeader(); window.addEventListener('scroll',updateHeader,{passive:true});

  const items=[...document.querySelectorAll('.reveal')];
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{ if(!entry.isIntersecting) return; entry.target.classList.add('revealed'); io.unobserve(entry.target); });
    },{threshold:.1,rootMargin:'0px 0px -35px'});
    items.forEach(el=>io.observe(el));
  }else items.forEach(el=>el.classList.add('revealed'));

  const canHover=window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if(canHover){
    document.querySelectorAll('.tilt-card').forEach(card=>{
      card.addEventListener('pointermove',e=>{
        const r=card.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width-.5; const y=(e.clientY-r.top)/r.height-.5;
        card.style.transform=`perspective(900px) rotateX(${(-y*3.5).toFixed(2)}deg) rotateY(${(x*4.5).toFixed(2)}deg) translateY(-7px)`;
      });
      card.addEventListener('pointerleave',()=>{card.style.transform='';});
    });
    document.querySelectorAll('.magnetic').forEach(btn=>{
      btn.addEventListener('pointermove',e=>{const r=btn.getBoundingClientRect();const x=(e.clientX-(r.left+r.width/2))*.10;const y=(e.clientY-(r.top+r.height/2))*.10;btn.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;});
      btn.addEventListener('pointerleave',()=>{btn.style.transform='';});
    });
  }

  // Animate numbers if added to the site in future.
  document.querySelectorAll('[data-count-to]').forEach(el=>{
    const target=Number(el.dataset.countTo); if(!Number.isFinite(target)) return; let started=false;
    const run=()=>{if(started)return; started=true; const start=performance.now(); const duration=1100; const step=now=>{const p=Math.min(1,(now-start)/duration); const eased=1-Math.pow(1-p,3); el.textContent=Math.round(target*eased).toLocaleString(); if(p<1)requestAnimationFrame(step)}; requestAnimationFrame(step)};
    if('IntersectionObserver' in window){const io=new IntersectionObserver(es=>{if(es[0].isIntersecting){run();io.disconnect()}},{threshold:.65});io.observe(el)}else run();
  });
})();

// Smooth same-page navigation with sticky-header offset.
document.querySelectorAll('a[href^="#"]').forEach(link=>{
  link.addEventListener('click',e=>{
    const id=link.getAttribute('href'); if(!id||id==='#') return; const target=document.querySelector(id); if(!target) return; e.preventDefault();
    const offset=document.querySelector('.site-header')?.offsetHeight||0; window.scrollTo({top:target.getBoundingClientRect().top+window.scrollY-offset-8,behavior:'smooth'});
  });
});
