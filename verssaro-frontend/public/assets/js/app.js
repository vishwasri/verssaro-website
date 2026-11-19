/* VERSSARO — page orchestration */
(function () {
  'use strict';
  const { $, $$, clamp, lerp, prog, ease, tween } = VS;
  const CFG = window.VERSSARO_CONFIG, P = CFG.products;
  const byId = id => P.find(p => p.id === id);
  $('#yr').textContent = new Date().getFullYear();
  $$('.mq-emb').forEach(s => s.setAttribute('viewBox', '0 0 100 100'));

  /* ================= ENQUIRY BAG ================= */
  const KEY = 'verssaro-bag-v3';
  let bag = [];
  try { bag = JSON.parse(localStorage.getItem(KEY) || '[]').filter(x => byId(x.id)); } catch (e) { bag = []; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(bag)); } catch (e) {} renderBag(); };
  function addToBag(p, size) {
    const ex = bag.find(x => x.id === p.id && x.size === size);
    ex ? ex.qty++ : bag.push({ id: p.id, size, qty: 1 });
    save(); VS.toast(`${p.name} · ${size} added to your enquiry`);
    const c = $('#bagCount'); c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
  }
  function message() {
    const name = $('#enqName').value.trim(), note = $('#enqNote').value.trim();
    const lines = bag.map(x => `• ${byId(x.id).name} — size ${x.size} × ${x.qty}`);
    return `Hello VERSSARO,${name ? ` this is ${name}.` : ''}\nI'd like to enquire about:\n${lines.join('\n')}${note ? `\n\nNotes: ${note}` : ''}\n\nThank you.`;
  }
  function renderBag() {
    const n = bag.reduce((s, x) => s + x.qty, 0);
    $('#bagCount').textContent = n;
    const list = $('#drawerItems');
    list.innerHTML = bag.length ? bag.map((x, i) => { const p = byId(x.id); return `<div class="item"><img src="${p.photo}" alt=""><div><p class="item__n">${p.name}</p><p class="item__m">${p.colour} · Size ${x.size}</p><div class="qty"><button data-q="${i}" data-d="-1" aria-label="Decrease">−</button><span>${x.qty}</span><button data-q="${i}" data-d="1" aria-label="Increase">+</button></div></div><button class="item__x" data-rm="${i}" aria-label="Remove ${p.name}">Remove</button></div>`; }).join('')
      : `<div class="empty"><svg viewBox="-130 -130 260 260" class="empty__emb">${armsSvg()}</svg><p>Your enquiry list is empty.</p><a href="#collection" data-close class="link">Browse the collection →</a></div>`;
    const acts = $('#drawerActions');
    const wa = CFG.orderWhatsapp, em = CFG.orderEmail;
    acts.innerHTML = bag.length ? [
      wa ? `<button class="btn btn--gold btn--full" data-send="wa"><span>Send via WhatsApp</span></button>` : '',
      em ? `<button class="btn btn--${wa ? 'ghost' : 'gold'} btn--full" data-send="mail"><span>Send by email</span></button>` : '',
      `<button class="btn btn--${wa || em ? 'ghost' : 'gold'} btn--full" data-send="copy"><span>Copy enquiry message</span></button>`,
      !wa && !em ? `<a class="btn btn--ghost btn--full" href="${CFG.socialInstagram}" target="_blank" rel="noopener"><span>Open Instagram to send</span></a>` : ''
    ].join('') : '';
    $('#drawerSmall').textContent = bag.length ? CFG.shippingMessage : '';
  }
  $('#drawer').addEventListener('click', e => {
    const q = e.target.closest('[data-q]'); if (q) { const it = bag[+q.dataset.q]; it.qty += +q.dataset.d; if (it.qty < 1) bag.splice(+q.dataset.q, 1); save(); }
    const r = e.target.closest('[data-rm]'); if (r) { bag.splice(+r.dataset.rm, 1); save(); }
    const s = e.target.closest('[data-send]');
    if (s) {
      const m = message();
      if (s.dataset.send === 'wa') window.open(`https://wa.me/${CFG.orderWhatsapp}?text=${encodeURIComponent(m)}`, '_blank');
      else if (s.dataset.send === 'mail') location.href = `mailto:${CFG.orderEmail}?subject=${encodeURIComponent('VERSSARO enquiry')}&body=${encodeURIComponent(m)}`;
      else (navigator.clipboard ? navigator.clipboard.writeText(m) : Promise.reject()).then(() => VS.toast('Enquiry copied — paste it into a message to VERSSARO'), () => { prompt('Copy your enquiry:', m); });
    }
    if (e.target.closest('[data-close]')) closeDrawer();
  });
  const openDrawer = () => { renderBag(); $('#drawer').classList.add('is-open'); $('#drawer').setAttribute('aria-hidden', 'false'); document.body.classList.add('lock'); };
  const closeDrawer = () => { $('#drawer').classList.remove('is-open'); $('#drawer').setAttribute('aria-hidden', 'true'); document.body.classList.remove('lock'); };
  $('#bagBtn').addEventListener('click', openDrawer); $('#contactBag').addEventListener('click', openDrawer);

  function armsSvg() { return Array.from({ length: 6 }, (_, i) => `<g class="arm"><path d="${window.VS_ARM}" transform="rotate(${i * 60})"/></g>`).join(''); }

  /* ================= QUICK VIEW ================= */
  let qvP = null;
  function openQV(p) {
    qvP = p;
    $('#qvEd').textContent = p.edition; $('#qvName').textContent = p.name; $('#qvLead').textContent = p.lead; $('#qvDesc').textContent = p.story;
    $('#qvMedia').innerHTML = `<div class="qv__main"><img src="${p.gallery[0]}" alt="${p.name}" id="qvMain"></div><div class="qv__thumbs">${p.gallery.map((g, i) => `<button ${i === 0 ? 'aria-current="true"' : ''} data-img="${g}"><img src="${g}" alt=""></button>`).join('')}</div>`;
    $('#qvSizes').innerHTML = p.sizes.map((s, i) => `<button type="button" role="radio" aria-checked="${i === 1}" data-size="${s}">${s}</button>`).join('');
    $('#qvPrice').textContent = p.price ? `${CFG.currency} ${Number(p.price).toLocaleString()}` : 'Price on enquiry';
    $('#qvShip').textContent = CFG.shippingMessage;
    const qv = $('#qv'); qv.hidden = false; requestAnimationFrame(() => qv.classList.add('is-open'));
    document.body.classList.add('lock'); $('.qv__close', qv).focus();
  }
  function closeQV() { const qv = $('#qv'); qv.classList.remove('is-open'); document.body.classList.remove('lock'); setTimeout(() => (qv.hidden = true), 450); }
  $('#qv').addEventListener('click', e => {
    if (e.target.closest('[data-close]')) closeQV();
    const t = e.target.closest('[data-img]'); if (t) { $('#qvMain').src = t.dataset.img; $$('[data-img]').forEach(b => b === t ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')); }
    const s = e.target.closest('[data-size]'); if (s) $$('#qvSizes [data-size]').forEach(b => b.setAttribute('aria-checked', b === s));
  });
  $('#qvAdd').addEventListener('click', () => { const s = $('#qvSizes [aria-checked="true"]'); addToBag(qvP, s ? s.dataset.size : 'M'); closeQV(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!$('#qv').hidden) closeQV(); closeDrawer(); closeMenu(); } });

  /* ================= HEADER / MENU ================= */
  const hdr = $('#hdr'), bar = $('#progress');
  VS.onScroll(s => {
    const max = document.documentElement.scrollHeight - s.vh;
    bar.style.transform = `scaleX(${max > 0 ? s.y / max : 0})`;
    hdr.classList.toggle('is-solid', s.y > s.vh * .5);
    if (s.y > s.vh * 1.2 && s.vel > 4 && !document.body.classList.contains('menu-open')) hdr.classList.add('is-hidden');
    else if (s.vel < -4 || s.y < s.vh) hdr.classList.remove('is-hidden');
  });
  const menu = $('#menu'), burger = $('#burger');
  const closeMenu = () => { document.body.classList.remove('menu-open'); burger.setAttribute('aria-expanded', 'false'); menu.setAttribute('aria-hidden', 'true'); };
  burger.addEventListener('click', () => { const o = !document.body.classList.contains('menu-open'); document.body.classList.toggle('menu-open', o); burger.setAttribute('aria-expanded', o); menu.setAttribute('aria-hidden', !o); });
  menu.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  $('#toTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ================= CURSOR + MAGNETIC ================= */
  if (!VS.touch && !VS.reduced) {
    const cur = $('.cursor'), dot = $('.cursor__dot'), ring = $('.cursor__ring'), label = $('.cursor__label');
    let mx = -100, my = -100, rx = -100, ry = -100;
    document.addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; cur.classList.add('is-on'); });
    document.addEventListener('pointerleave', () => cur.classList.remove('is-on'));
    const tick = () => { rx = lerp(rx, mx, .18); ry = lerp(ry, my, .18); dot.style.transform = `translate(${mx}px,${my}px)`; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(tick); };
    tick();
    document.addEventListener('pointerover', e => {
      const t = e.target.closest('[data-cursor], a, button, input, [role="radio"]');
      cur.classList.toggle('is-hover', !!t);
      const l = t && t.dataset ? t.dataset.cursor : '';
      cur.classList.toggle('has-label', !!l); label.textContent = l || '';
    });
    $$('[data-magnetic]').forEach(el => {
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2; el.style.transform = `translate(${x * .25}px,${y * .35}px)`; });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; });
    });
  }

  /* ================= HERO ================= */
  const hero = $('#hero'), panels = $$('.hero__panel', hero), heroItems = $$('#heroIndex li');
  let hIdx = 0, hTimer = 0, hT0 = performance.now(), hPaused = false;
  const HDUR = 6500;
  const slots = ['center', 'right', 'left'];
  function setHero(i) {
    hIdx = (i + 3) % 3;
    panels.forEach((p, k) => p.dataset.slot = slots[(k - hIdx + 3) % 3]);
    heroItems.forEach((li, k) => li.classList.toggle('is-active', k === hIdx));
    $('#heroNum').textContent = String(hIdx + 1).padStart(2, '0');
    hT0 = performance.now();
  }
  panels.forEach((p, k) => p.addEventListener('click', () => { if (p.dataset.slot !== 'center') setHero(k); else openQV(byId(['guardian', 'mayara', 'ivory'][k])); }));
  heroItems.forEach((li, k) => li.addEventListener('click', () => setHero(k)));
  $('#heroStage').addEventListener('pointerenter', () => (hPaused = true));
  $('#heroStage').addEventListener('pointerleave', () => { hPaused = false; hT0 = performance.now() - (hT0 ? 0 : 0); });
  const heroBar = $('#heroBar');
  (function heroTick(now) {
    if (document.body.classList.contains('is-ready') && !VS.reduced) {
      if (hPaused) hT0 = now - (parseFloat(heroBar.dataset.p || 0) * HDUR);
      const p = clamp((now - hT0) / HDUR, 0, 1); heroBar.style.transform = `scaleX(${p})`; heroBar.dataset.p = p;
      if (p >= 1 && VS.scroll.y < VS.scroll.vh) setHero(hIdx + 1);
    }
    requestAnimationFrame(heroTick);
  })(performance.now());
  // pointer depth
  const stage = $('#heroStage');
  if (!VS.touch) hero.addEventListener('pointermove', e => {
    const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
    stage.style.setProperty('--mx', x.toFixed(3)); stage.style.setProperty('--my', y.toFixed(3));
    $('.hero__glow').style.transform = `translate(${x * 60}px,${y * 40}px)`;
  });
  let heroDots = null, heroIntro = 1, heroScroll = 0;
  const makeHeroDots = () => {
    heroDots = new Halftone($('#heroDots'), { text: 'HERITAGE', font: '800 100px Montserrat, Arial, sans-serif', crop: .18, fill: .98, letterSpacing: 2, ink: '#D9B25C', warm: '#FFF2CC', dotGap: innerWidth < 700 ? 5 : 7, radius: innerWidth < 700 ? 60 : 95, target: hero });
    heroDots.setScatter(1);
    tween({ duration: VS.reduced ? 0 : 2000, ease: ease.outCubic, update: v => { heroIntro = 1 - v; heroDots.setScatter(Math.max(heroIntro, heroScroll)); } });
  };
  // scroll exit
  VS.onScroll(s => {
    const p = VS.trackProgress(hero);
    hero.style.setProperty('--hp', p.toFixed(4));
    heroScroll = prog(p, .05, .75);
    if (heroDots) heroDots.setScatter(Math.max(heroIntro, heroScroll));
  });
  // split lede
  VS.splitWords($('.hero__lede'));

  /* ================= MARQUEE ================= */
  const mq = $('#marquee');
  mq.innerHTML += mq.innerHTML;
  let mqX = 0, mqV = 0;
  (function mqTick() {
    mqV = lerp(mqV, VS.scroll.vel || 0, .08);
    mqX -= .6 + Math.abs(mqV) * .25 * (VS.reduced ? 0 : 1);
    const half = mq.scrollWidth / 2; if (-mqX > half) mqX += half;
    mq.style.transform = `translate3d(${mqX}px,0,0) skewX(${clamp(-mqV * .15, -8, 8)}deg)`;
    VS.scroll.vel *= .9;
    requestAnimationFrame(mqTick);
  })();

  /* ================= MANIFESTO EMBLEM ================= */
  const man = $('#manifesto'), big = $('#bigEmblem');
  big.innerHTML = `<g class="big-rot">${armsSvg()}</g>`;
  const bigArms = $$('.arm', big).map((el, i) => ({ el, th: i * Math.PI / 3 })), bigRot = $('.big-rot', big);
  const words = VS.splitWords($('#manifestoText'));
  VS.onScroll(() => {
    const p = VS.trackProgress(man);
    bigArms.forEach((a, i) => {
      const e = ease.outCubic(prog(p, .02 + i * .045, .42 + i * .045));
      const off = (1 - e) * 190, r = (1 - e) * -160;
      a.el.setAttribute('transform', `translate(${Math.sin(a.th) * off} ${-Math.cos(a.th) * off}) rotate(${r}) scale(${.5 + .5 * e})`);
      a.el.style.opacity = .15 + .85 * e;
    });
    bigRot.setAttribute('transform', `rotate(${p * 120})`);
    man.style.setProperty('--mp', p.toFixed(4));
    const lit = prog(p, .12, .78) * words.length;
    words.forEach((w, i) => w.classList.toggle('on', i < lit));
  });
  // counters
  const counters = $$('[data-count]');
  VS.reveal(counters, 'is-counted');
  new MutationObserver(ms => ms.forEach(m => { const el = m.target; if (el.classList.contains('is-counted') && !el._done) { el._done = 1; const to = +el.dataset.count; tween({ duration: 1600, ease: ease.outQuart, update: v => (el.textContent = Math.round(v * to) + (el.dataset.suffix || '')) }); } }))
    .observe(man, { attributes: true, subtree: true, attributeFilter: ['class'] });

  /* ================= COLLECTION GRID ================= */
  $('#productGrid').innerHTML = P.map((p, i) => `<article class="card" data-reveal style="--d:${i * 90}ms">
    <button class="card__media" data-qv="${p.id}" data-cursor="View" aria-label="Quick view ${p.name}">
      <img class="card__a" src="${p.photo}" alt="${p.name} tee" loading="lazy">
      <img class="card__b" src="${p.lifestyle}" alt="" loading="lazy">
      <span class="card__tag">${p.edition}</span>
      <span class="card__quick">Quick view</span>
    </button>
    <div class="card__info"><div><h3>${p.name}</h3><p>${p.colour} · ${p.lead}</p></div><button class="card__add" data-add="${p.id}" aria-label="Add ${p.name} to enquiry"><span>+</span></button></div>
  </article>`).join('');
  $('#productGrid').addEventListener('click', e => {
    const q = e.target.closest('[data-qv]'); if (q) openQV(byId(q.dataset.qv));
    const a = e.target.closest('[data-add]'); if (a) openQV(byId(a.dataset.add));
  });
  if (!VS.touch && !VS.reduced) $$('.card__media').forEach(m => {
    m.addEventListener('pointermove', e => { const r = m.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; m.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg)`; m.style.setProperty('--gx', (x + .5) * 100 + '%'); m.style.setProperty('--gy', (y + .5) * 100 + '%'); });
    m.addEventListener('pointerleave', () => { m.style.transform = ''; });
  });

  /* ================= SELECTOR ================= */
  const sel = OrbitSelector({ products: P, onAdd: (p, s) => addToBag(p, s), onChange: i => { selIdx = i; } });
  let selIdx = 0;
  $('#selQuick').addEventListener('click', () => openQV(P[sel.index]));
  $('#selStudio').addEventListener('click', () => { setDesign(sel.index); $('#studio').scrollIntoView({ behavior: 'smooth' }); });

  /* ================= STUDIO ================= */
  const sw = $('#swatches');
  sw.innerHTML = P.map((p, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-d="${i}" aria-label="${p.name}"><img src="${p.photo}" alt=""><span>${p.name}</span></button>`).join('');
  let cloth = null, design = 0, clothTried = false;
  function setDesign(i) {
    design = i; const p = P[i];
    $$('[data-d]', sw).forEach(b => b.setAttribute('aria-checked', +b.dataset.d === i));
    $('#studioName').textContent = p.name; $('#studioMeta').textContent = `${p.edition} · ${p.colour}`;
    $('.studio__fallback').src = p.photo;
    if (cloth && window.VS_TEX) cloth.setTexture(window.VS_TEX[p.tex]);
  }
  sw.addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (b) setDesign(+b.dataset.d); });
  function initCloth() {
    if (clothTried) return; clothTried = true;
    const go = () => {
      if (!window.VS_TEX) return setTimeout(go, 120);
      try { cloth = Cloth($('#cloth'), { onInteract: () => $('#clothHint').classList.add('is-gone') }); } catch (e) { console.warn(e); cloth = null; }
      if (!cloth) { $('#cloth').hidden = true; $('.studio__fallback').hidden = false; $('#clothHint').hidden = true; return; }
      cloth.wind = $('#wind').value / 100; cloth.light = $('#light').value / 100;
      cloth.setTexture(window.VS_TEX[P[design].tex]).then(ok => { if (!ok) { $('#cloth').hidden = true; $('.studio__fallback').hidden = false; } });
    };
    go();
  }
  VS.whenVisible($('#studio'), initCloth, null, '600px');
  $('#wind').addEventListener('input', e => { $('#windOut').textContent = e.target.value; if (cloth) cloth.wind = e.target.value / 100; });
  $('#light').addEventListener('input', e => { $('#lightOut').textContent = e.target.value; if (cloth) cloth.light = e.target.value / 100; });
  $('#clothPause').addEventListener('click', e => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on); e.currentTarget.textContent = on ? 'Play' : 'Pause'; cloth && cloth.pause(on); });
  $('#clothReset').addEventListener('click', () => cloth && cloth.reset());
  $('#clothAdd').addEventListener('click', () => openQV(P[design]));
  let studioDots = null;

  /* ================= LOOKBOOK (horizontal) ================= */
  const look = $('#lookbook'), lt = $('#lookTrack'), lookItems = $$('.look__item', lt);
  const horizontal = () => innerWidth > 820 && !VS.reduced;
  function sizeLook() { look.style.height = horizontal() ? `${lt.scrollWidth - innerWidth + innerHeight * 1.15}px` : ''; }
  window.addEventListener('load', sizeLook); window.addEventListener('resize', sizeLook); sizeLook();
  VS.onScroll(() => {
    if (!horizontal()) { lt.style.transform = ''; return; }
    const p = VS.trackProgress(look), dist = lt.scrollWidth - innerWidth;
    lt.style.transform = `translate3d(${-p * dist}px,0,0)`;
    $('#lookBar').style.transform = `scaleX(${p})`;
    $('#lookNum').textContent = String(Math.min(lookItems.length, 1 + Math.floor(p * lookItems.length * .999))).padStart(2, '0');
    lookItems.forEach(it => { const r = it.getBoundingClientRect(); const c = (r.left + r.width / 2) / innerWidth - .5; it.style.setProperty('--lx', c.toFixed(3)); });
  });

  /* ================= CRAFT STACK ================= */
  const cards = $$('.stack__card');
  VS.onScroll(() => {
    cards.forEach((c, i) => {
      const next = cards[i + 1]; if (!next) return;
      const r = next.getBoundingClientRect(), top = parseFloat(getComputedStyle(next).top) || 0;
      const p = clamp(1 - (r.top - top) / (innerHeight * .9), 0, 1);
      c.style.setProperty('--sp', p.toFixed(3));
    });
  });

  /* ================= PARALLAX + REVEALS ================= */
  const par = $$('[data-parallax]');
  VS.onScroll(s => par.forEach(el => { const r = el.getBoundingClientRect(); const c = (r.top + r.height / 2 - s.vh / 2); el.style.setProperty('--py', (c * -(+el.dataset.parallax)).toFixed(1) + 'px'); }));
  $$('[data-reveal]').forEach(el => { if (el.matches('.title')) { const b = el.innerHTML; el.innerHTML = `<span class="mask"><span>${b}</span></span>`; } });
  VS.reveal($$('[data-reveal], .sec-head .eyebrow, .stack__card, .look__item'));

  /* ================= FOOTER HALFTONE EMBLEM ================= */
  let ftrDots = null;
  VS.whenVisible($('#footer'), () => { if (!ftrDots) ftrDots = new Halftone($('#ftrDots'), { mode: 'emblem', ink: '#D9B25C', warm: '#FFF2CC', dotGap: 6, radius: 70, emblemScale: .8, emblemX: innerWidth < 900 ? .5 : .86, target: $('#footer') }); }, null, '400px');
  VS.whenVisible($('#studio'), () => { if (!studioDots) studioDots = new Halftone($('#studioTitle'), { text: 'STUDIO', font: '800 100px Montserrat, Arial, sans-serif', align: 'center', fill: 1, maxCap: .82, letterSpacing: 4, ink: '#D9B25C', warm: '#FFF2CC', dotGap: 5, radius: 60, target: $('.studio__head') }); }, null, '500px');

  /* ================= INTRO ================= */
  window.addEventListener('vs:reveal', () => { setTimeout(makeHeroDots, 350); });
  window.addEventListener('vs:ready', () => { if (!heroDots) makeHeroDots(); VS.refresh(); sizeLook(); });
  renderBag();
  setHero(0);
})();
