/* VERSSARO core — tiny animation + scroll toolkit (no external libraries). */
(function () {
  'use strict';
  const VS = (window.VS = {});
  VS.$ = (s, r = document) => r.querySelector(s);
  VS.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  VS.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  VS.lerp = (a, b, t) => a + (b - a) * t;
  VS.map = (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c);
  VS.prog = (v, a, b) => VS.clamp((v - a) / (b - a), 0, 1);
  VS.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  VS.touch = window.matchMedia('(hover: none), (pointer: coarse)').matches;

  // Easings
  VS.ease = {
    linear: t => t,
    inCubic: t => t * t * t,
    outCubic: t => 1 - Math.pow(1 - t, 3),
    inOutCubic: t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outQuart: t => 1 - Math.pow(1 - t, 4),
    inOutQuart: t => (t < .5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2),
    outExpo: t => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    inOutExpo: t => t === 0 ? 0 : t === 1 ? 1 : t < .5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2,
    outBack: t => { const c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  };

  // Minimal tween: VS.tween({from,to,duration,delay,ease,update,complete}) -> {stop()}
  VS.tween = function (o) {
    const d = (o.duration ?? 600), dl = (o.delay ?? 0), e = o.ease || VS.ease.outCubic;
    const from = o.from ?? 0, to = o.to ?? 1;
    let raf = 0, t0 = 0, stopped = false;
    const step = now => {
      if (stopped) return;
      if (!t0) t0 = now;
      const el = now - t0 - dl;
      if (el < 0) { raf = requestAnimationFrame(step); return; }
      const p = d <= 0 ? 1 : Math.min(1, el / d);
      const v = typeof from === 'number' ? from + (to - from) * e(p) : null;
      o.update && o.update(v, e(p), p);
      if (p < 1) raf = requestAnimationFrame(step); else o.complete && o.complete();
    };
    raf = requestAnimationFrame(step);
    return { stop() { stopped = true; cancelAnimationFrame(raf); } };
  };
  VS.wait = ms => new Promise(r => setTimeout(r, ms));
  VS.tw = o => new Promise(r => VS.tween({ ...o, complete: () => { o.complete && o.complete(); r(); } }));

  // Colour helpers
  VS.hex = h => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return [0, 0, 0]; const n = parseInt(m[1], 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  VS.mix = (a, b, t) => 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')';

  // ---------- Scroll engine: one rAF, many subscribers ----------
  const subs = new Set();
  let sy = window.scrollY, vh = window.innerHeight, vw = window.innerWidth, ticking = false, lastY = sy, vel = 0;
  VS.scroll = { y: sy, vh, vw, vel: 0, dir: 1 };
  const run = () => {
    ticking = false;
    sy = window.scrollY;
    vel = sy - lastY; lastY = sy;
    VS.scroll.y = sy; VS.scroll.vel = vel; if (vel) VS.scroll.dir = vel > 0 ? 1 : -1;
    subs.forEach(fn => fn(VS.scroll));
  };
  VS.onScroll = fn => { subs.add(fn); fn(VS.scroll); return () => subs.delete(fn); };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
  window.addEventListener('resize', () => { vh = window.innerHeight; vw = window.innerWidth; VS.scroll.vh = vh; VS.scroll.vw = vw; run(); });
  VS.refresh = run;

  // Absolute top offset of element (layout, ignores transforms of ancestors mostly)
  VS.top = el => { let y = 0; while (el) { y += el.offsetTop; el = el.offsetParent; } return y; };

  // Progress of a tall "track" element whose child is sticky: 0 at track top, 1 at track bottom - vh
  VS.trackProgress = el => {
    const t = VS.top(el), h = el.offsetHeight - VS.scroll.vh;
    return h <= 0 ? 0 : VS.clamp((VS.scroll.y - t) / h, 0, 1);
  };

  // ---------- Split text into words (masked) ----------
  VS.splitWords = el => {
    if (el.dataset.splitDone) return VS.$$('.w > i', el);
    const words = el.textContent.trim().split(/\s+/);
    el.innerHTML = words.map((w, i) => `<span class="w"><i style="--i:${i}">${w}</i></span>`).join(' ');
    el.dataset.splitDone = '1';
    return VS.$$('.w > i', el);
  };

  // ---------- Reveal on enter ----------
  VS.reveal = (els, cls = 'is-in', opts = {}) => {
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add(cls)); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add(cls); io.unobserve(en.target); } });
    }, { rootMargin: opts.margin || '0px 0px -12% 0px', threshold: opts.threshold || 0 });
    els.forEach(e => io.observe(e));
  };

  // ---------- Visibility helper ----------
  VS.whenVisible = (el, on, off, margin = '200px') => {
    const io = new IntersectionObserver(es => es.forEach(e => (e.isIntersecting ? on() : off && off())), { rootMargin: margin });
    io.observe(el); return io;
  };

  VS.toast = msg => {
    const t = VS.$('#toast'); if (!t) return;
    t.textContent = msg; t.classList.add('is-on');
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('is-on'), 2600);
  };
})();
