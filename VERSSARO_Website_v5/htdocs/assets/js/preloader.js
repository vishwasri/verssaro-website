/* Preloader: emblem arms assemble → wordmark appears → lockup glides into the header
 * while the doors part from the centre seam. Uses the official logo geometry. */
(function () {
  'use strict';
  const { $, $$, tween, tw, ease, wait } = VS;
  const loader = $('#loader');
  if (!loader) return;
  const logo = $('.loader__logo', loader), shift = $('.vs-shift', logo);
  const arms = $$('.arm', logo), letters = $$('.ltr', logo), emb = $('.vs-emb', logo);
  const count = $('#loaderCount');
  const SHIFT = 1245 - 370; // centre the emblem inside the viewBox first

  // ----- load progress (critical images + fonts) -----
  let loaded = 0, total = 0, shown = 0;
  const crit = $$('.hero__panel img');
  total = crit.length + 1;
  const bump = () => { loaded++; };
  crit.forEach(img => (img.complete ? bump() : (img.addEventListener('load', bump, { once: true }), img.addEventListener('error', bump, { once: true }))));
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(bump);
  let fakeT = performance.now();
  const counter = () => {
    const real = loaded / total;
    const t = Math.min(1, (performance.now() - fakeT) / 2600);
    const target = Math.min(real, t) * 100;
    shown += (target - shown) * 0.12;
    if (target >= 99.5 && shown > 99) shown = 100;
    count.textContent = String(Math.round(shown)).padStart(3, '0');
    if (shown < 100) requestAnimationFrame(counter);
  };
  const ready = new Promise(res => { const chk = () => (shown >= 100 ? res() : requestAnimationFrame(chk)); chk(); });
  setTimeout(() => { loaded = total; }, 6000); // never hang on a slow asset

  // ----- initial states -----
  shift.setAttribute('transform', `translate(${SHIFT} 0)`);
  const armState = arms.map((a, i) => ({ el: a, th: i * Math.PI / 3 }));
  const setArm = (s, p) => {
    const off = (1 - p) * 120, rot = (1 - p) * -140, sc = .35 + .65 * p;
    s.el.setAttribute('transform', `translate(${Math.sin(s.th) * off} ${-Math.cos(s.th) * off}) rotate(${rot}) scale(${sc})`);
    s.el.style.opacity = Math.min(1, p * 1.6);
  };
  armState.forEach(s => setArm(s, 0));
  letters.forEach(l => { l.style.opacity = 0; });

  async function run() {
    if (VS.reduced) {
      armState.forEach(s => setArm(s, 1)); letters.forEach(l => (l.style.opacity = 1));
      shift.setAttribute('transform', 'translate(0 0)');
      fakeT -= 2600; requestAnimationFrame(counter); await ready;
      loader.style.transition = 'opacity .5s'; loader.style.opacity = 0;
      finish(); return;
    }
    requestAnimationFrame(counter);
    await wait(250);
    // 1 — arms assemble
    await Promise.all(armState.map((s, i) => tw({ duration: 1100, delay: i * 90, ease: ease.outQuart, update: (v, e) => setArm(s, e) })));
    // a quarter-turn settle of the whole emblem
    await tw({ duration: 700, ease: ease.inOutCubic, update: (v, e) => emb.setAttribute('transform', `translate(370 450) scale(2.5471698) rotate(${e * 60})`) });
    emb.setAttribute('transform', 'translate(370 450) scale(2.5471698)');
    // 2 — lockup slides, letters arrive
    tween({ duration: 1000, ease: ease.inOutQuart, update: v => shift.setAttribute('transform', `translate(${SHIFT * (1 - v)} 0)`) });
    await Promise.all(letters.map((l, i) => tw({ duration: 700, delay: 260 + i * 70, ease: ease.outCubic, update: (v, e) => { l.style.opacity = e; l.style.transform = `translateY(${(1 - e) * 60}px)`; } })));
    await ready;
    await wait(200);
    // 3 — glide into header + doors open
    const hdr = $('#hdrLogo').getBoundingClientRect(), cur = logo.getBoundingClientRect();
    const sc = hdr.width / cur.width;
    const dx = (hdr.left + hdr.width / 2) - (cur.left + cur.width / 2);
    const dy = (hdr.top + hdr.height / 2) - (cur.top + cur.height / 2);
    loader.classList.add('is-opening');
    document.body.classList.add('is-revealing');
    window.dispatchEvent(new CustomEvent('vs:reveal'));
    tween({ duration: 1150, delay: 250, ease: ease.inOutQuart, update: (v, e) => { logo.style.transform = `translate(${dx * e}px, ${dy * e}px) scale(${1 + (sc - 1) * e})`; } });
    await wait(1450);
    finish();
  }
  function finish() {
    document.body.classList.remove('is-loading', 'is-revealing');
    document.body.classList.add('is-ready');
    window.dispatchEvent(new CustomEvent('vs:ready'));
    setTimeout(() => loader.remove(), 700);
  }
  window.scrollTo(0, 0);
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  run();
})();
