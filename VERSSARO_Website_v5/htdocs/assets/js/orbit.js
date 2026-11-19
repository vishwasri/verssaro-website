/* Tee Orbit Selector — fashion adaptation of the supplied "Dish Orbit Carousel".
 * The garment sits in an arched frame on the left; changing design swings it out over
 * the top on a wide orbit while the next swings in. The two-weight title wipes out and
 * back in, the details card cross-fades, and a band along the orbit takes the design's
 * colour. Page scroll drives it (the stage pins); arrows, thumbs, pager, keys and swipes jump too.
 */
(function () {
  'use strict';
  const { $, $$, clamp, ease, tween } = VS;

  const ORBIT_X = 279, ORBIT_Y = -492, ORBIT_R = 702, SWING = 50, ITEM = 118, VISIBLE = 4, SCROLL_PER = 0.75;
  const ARC_REST = [[50, 98], [46, 124], [60, 126], [40, 100]], ARC_SWEEP = [38, 146];
  const HIDE_1 = 'inset(0% 0% 0% 100%)', HIDE_2 = 'inset(0% 100% 0% 0%)', SHOW = 'inset(0% 0% 0% 0%)';
  const arcRest = i => ARC_REST[((i % 4) + 4) % 4];
  const fitSize = (chars, max, width, em) => Math.min(max, width / (Math.max(1, chars) * em));
  function arcPath(a0, a1, cx, cy, r, w, steps = 48) {
    const o = [], n = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, a = ((a0 + (a1 - a0) * t) * Math.PI) / 180;
      const h = (w / 2) * Math.pow(Math.sin(Math.PI * t), .45), c = Math.cos(a), s = Math.sin(a);
      o.push((cx + c * (r + h)).toFixed(1) + ' ' + (cy + s * (r + h)).toFixed(1));
      n.push((cx + c * (r - h)).toFixed(1) + ' ' + (cy + s * (r - h)).toFixed(1));
    }
    return 'M' + o.join('L') + 'L' + n.reverse().join('L') + 'Z';
  }
  const anim = (el, kf, opts) => el && el.animate ? el.animate(kf, Object.assign({ fill: 'forwards' }, opts)) : null;

  function OrbitSelector(opts) {
    const P = opts.products, n = P.length;
    const track = $('#selTrack'), root = $('#selRoot'), canvas = $('#selCanvas');
    const plates = $('#selPlates'), head = $('#selHead'), bodies = $('#selBodies'), thumbs = $('#selThumbs'), pager = $('#selPager');
    const arcEl = $('#selArc'), sr = $('#selSr');
    let index = 0, shown = -1, seg = 0, tab = 'story', running = [];
    const arc = { a0: 0, a1: 0, col: VS.hex(P[0].accent) };
    const steps = Math.max(0, n - 1);
    track.style.height = `calc(100svh * ${1 + steps * SCROLL_PER})`;

    // ---- build DOM ----
    plates.innerHTML = P.map((p, i) => `<div class="sel-orbit" aria-hidden="${i !== 0}"><div class="sel-arch"><img src="${p.photo}" alt="${p.name} tee" draggable="false"></div><span class="sel-num">${String(i + 1).padStart(3, '0')}</span></div>`).join('');
    head.innerHTML = P.map((p, i) => `<div class="sel-hd" aria-hidden="${i !== 0}"><p class="sel-eye">${p.edition}</p><h3><span class="sel-t1" style="font-size:${fitSize(p.t1.length, 50, 300, .8)}px">${p.t1}</span><span class="sel-t2" style="font-size:${fitSize(p.t2.length, 62, 300, .86)}px">${p.t2}</span></h3></div>`).join('');
    const bodyHtml = (p, i) => `<div class="sel-badge" style="--c:${p.accent}"><b>${String(i + 1).padStart(2, '0')}</b><span>/ ${String(n).padStart(2, '0')}</span></div>
      <p class="sel-name">${p.name}</p><p class="sel-col">${p.colour} · ${p.edition}</p>
      <div class="sel-txt" data-story><p>${p.story}</p></div>
      <ul class="sel-list" data-details>${p.details.map(d => `<li>${d}</li>`).join('')}</ul>
      <div class="sel-sizes" role="radiogroup" aria-label="Size">${p.sizes.map((s, k) => `<button type="button" role="radio" aria-checked="${k === 1}" data-size="${s}">${s}</button>`).join('')}</div>
      <button type="button" class="sel-add" data-add="${p.id}">Add to enquiry <svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>`;
    bodies.innerHTML = P.map((p, i) => `<div class="sel-body" aria-hidden="${i !== 0}">${bodyHtml(p, i)}</div>`).join('');
    thumbs.innerHTML = P.map((p, i) => `<div class="sel-th"><button type="button" ${i === 0 ? 'aria-current="true"' : ''} data-go="${i}"><img src="${p.photo}" alt="" draggable="false"><span>${p.name}</span></button></div>`).join('');
    pager.innerHTML = P.map((p, i) => `<button type="button" role="tab" class="sel-dot" aria-selected="${i === 0}" ${i === 0 ? 'aria-current="true"' : ''} aria-label="${p.name}" data-go="${i}"><i></i></button>`).join('');

    const orbits = $$('.sel-orbit', plates), heads = $$('.sel-hd', head), bodyEls = $$('.sel-body', bodies);
    const parts = i => ({ orbit: orbits[i], head: heads[i], eye: $('.sel-eye', heads[i]), t1: $('.sel-t1', heads[i]), t2: $('.sel-t2', heads[i]), body: bodyEls[i] });
    const drawArc = () => {
      arcEl.setAttribute('d', arcPath(arc.a0, arc.a1, ORBIT_X, ORBIT_Y, ORBIT_R, 150));
      arcEl.setAttribute('fill', `rgb(${arc.col.map(Math.round).join(',')})`);
    };
    const setVis = (el, v) => { if (!el) return; el.style.visibility = v ? 'visible' : 'hidden'; el.style.opacity = v ? 1 : 0; };
    const applyTab = () => { bodyEls.forEach(b => { $('[data-story]', b).hidden = tab !== 'story'; $('[data-details]', b).hidden = tab !== 'details'; }); $$('.sel-tab').forEach(t => t.setAttribute('aria-selected', t.dataset.tab === tab)); };
    applyTab();

    // ---- fit 960x520 canvas ----
    const fit = () => {
      const w = root.clientWidth, h = root.clientHeight;
      root.style.setProperty('--sel-s', String(Math.min(w / 980, (h - 70) / 580, 1.6)));
    };
    fit(); new ResizeObserver(fit).observe(root);

    function swap(dir) {
      const from = shown, to = index;
      running.forEach(a => a && a.cancel && a.finish && a.finish()); running = [];
      const rest = arcRest(to), tint = VS.hex(P[to].accent);
      const b = parts(to);
      if (from === -1 || from === to || VS.reduced) {
        for (let i = 0; i < n; i++) if (i !== to) { const p = parts(i); [p.orbit, p.head, p.body].forEach(e => setVis(e, false)); }
        [b.orbit, b.head, b.body, b.eye].forEach(e => setVis(e, true));
        b.orbit.style.transform = 'rotate(0deg)'; b.t1.style.clipPath = SHOW; b.t2.style.clipPath = SHOW;
        arc.a0 = rest[0]; arc.a1 = rest[1]; arc.col = tint.slice(); drawArc();
        shown = to; return;
      }
      const a = parts(from), d = dir;
      // plates on the orbit
      setVis(b.orbit, true);
      running.push(anim(a.orbit, [{ transform: 'rotate(0deg)' }, { transform: `rotate(${SWING * d}deg)` }], { duration: 620, easing: 'cubic-bezier(.55,0,.9,.45)' }));
      setTimeout(() => { if (shown === to) { setVis(a.orbit, false); } }, 640);
      b.orbit.style.transform = `rotate(${-SWING * d}deg)`;
      running.push(anim(b.orbit, [{ transform: `rotate(${-SWING * d}deg)` }, { transform: 'rotate(0deg)' }], { duration: 950, delay: 300, easing: 'cubic-bezier(.16,1,.3,1)' }));
      // titles
      running.push(anim(a.t1, [{ clipPath: SHOW }, { clipPath: HIDE_1 }], { duration: 420, easing: 'cubic-bezier(.55,0,.9,.45)' }));
      running.push(anim(a.t2, [{ clipPath: SHOW }, { clipPath: HIDE_2 }], { duration: 420, delay: 60, easing: 'cubic-bezier(.55,0,.9,.45)' }));
      running.push(anim(a.eye, [{ opacity: 1 }, { opacity: 0 }], { duration: 250 }));
      setTimeout(() => { if (shown !== to) return; setVis(a.head, false); setVis(b.head, true); }, 500);
      b.t1.style.clipPath = HIDE_1; b.t2.style.clipPath = HIDE_2;
      running.push(anim(b.eye, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 400, delay: 550, easing: 'ease-out' }));
      running.push(anim(b.t1, [{ clipPath: HIDE_1 }, { clipPath: SHOW }], { duration: 700, delay: 550, easing: 'cubic-bezier(.16,1,.3,1)' }));
      running.push(anim(b.t2, [{ clipPath: HIDE_2 }, { clipPath: SHOW }], { duration: 700, delay: 620, easing: 'cubic-bezier(.16,1,.3,1)' }));
      // card
      running.push(anim(a.body, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-6px)' }], { duration: 300, delay: 50 }));
      setTimeout(() => { if (shown !== to) return; setVis(a.body, false); setVis(b.body, true); a.body.getAnimations && a.body.getAnimations().forEach(x => x.cancel()); }, 400);
      Array.from(b.body.children).forEach((c, k) => running.push(anim(c, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 500, delay: 400 + k * 60, easing: 'cubic-bezier(.2,.7,.2,1)' })));
      // band
      const s0 = [arc.a0, arc.a1], c0 = arc.col.slice();
      tween({ duration: 600, ease: ease.inOutCubic, update: (v, e) => { arc.a0 = s0[0] + (ARC_SWEEP[0] - s0[0]) * e; arc.a1 = s0[1] + (ARC_SWEEP[1] - s0[1]) * e; drawArc(); },
        complete: () => tween({ duration: 850, ease: ease.outCubic, update: (v, e) => { arc.a0 = ARC_SWEEP[0] + (rest[0] - ARC_SWEEP[0]) * e; arc.a1 = ARC_SWEEP[1] + (rest[1] - ARC_SWEEP[1]) * e; drawArc(); } }) });
      tween({ duration: 1100, delay: 100, ease: ease.inOutCubic, update: (v, e) => { arc.col = c0.map((c, k) => c + (tint[k] - c) * e); } });
      shown = to;
    }

    function select(next, dir) {
      if (next === index) return;
      index = next;
      orbits.forEach((o, i) => o.setAttribute('aria-hidden', i !== index));
      heads.forEach((o, i) => o.setAttribute('aria-hidden', i !== index));
      bodyEls.forEach((o, i) => { o.setAttribute('aria-hidden', i !== index); $$('button', o).forEach(b => (b.tabIndex = i === index ? 0 : -1)); });
      $$('button', thumbs).forEach((b, i) => (i === index ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));
      $$('.sel-dot', pager).forEach((b, i) => { b.setAttribute('aria-selected', i === index); i === index ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current'); });
      const start = n <= VISIBLE ? 0 : Math.max(0, Math.min(index - 1, n - VISIBLE));
      thumbs.style.transform = `translateX(${-start * ITEM}px)`;
      sr.textContent = `Design ${index + 1} of ${n}: ${P[index].name}`;
      swap(dir);
      opts.onChange && opts.onChange(index);
    }

    // ---- scroll drives selection ----
    VS.onScroll(() => {
      const t = VS.top(track), h = track.offsetHeight - VS.scroll.vh;
      if (h <= 0) return;
      const p = clamp((VS.scroll.y - t) / h, 0, 1);
      root.style.setProperty('--sel-p', p.toFixed(4));
      const s = Math.round(p * steps);
      if (s !== seg) { const d = s > seg ? 1 : -1; seg = s; select(s, d); }
    });
    // gentle snap when scrolling stops inside the track
    let snapT = 0;
    window.addEventListener('scroll', () => {
      clearTimeout(snapT);
      snapT = setTimeout(() => {
        if (VS.reduced || window.innerWidth < 700) return;
        const t = VS.top(track), h = track.offsetHeight - VS.scroll.vh, y = window.scrollY;
        if (y <= t + 4 || y >= t + h - 4) return;
        const target = t + (h * Math.round(((y - t) / h) * steps)) / steps;
        if (Math.abs(target - y) > 6 && Math.abs(target - y) < h / steps * .45) window.scrollTo({ top: target, behavior: 'smooth' });
      }, 160);
    }, { passive: true });

    function go(to, dir) {
      if (n < 2) return;
      const next = ((to % n) + n) % n;
      if (next === index) return;
      const t = VS.top(track), h = track.offsetHeight - VS.scroll.vh, y = window.scrollY;
      const d = dir || (next > index ? 1 : -1);
      if (y >= t - 2 && y <= t + h + 2) { seg = next; window.scrollTo({ top: t + (h * next) / steps, behavior: VS.reduced ? 'auto' : 'smooth' }); }
      else seg = next;
      select(next, d);
    }
    const step = d => go(index + d, d);
    $('#selPrev').addEventListener('click', () => step(-1));
    $('#selNext').addEventListener('click', () => step(1));
    root.addEventListener('click', e => {
      const g = e.target.closest('[data-go]'); if (g) go(+g.dataset.go);
      const t = e.target.closest('.sel-tab'); if (t) { tab = t.dataset.tab; applyTab(); }
      const sz = e.target.closest('[data-size]'); if (sz) { $$('[data-size]', sz.parentNode).forEach(b => b.setAttribute('aria-checked', b === sz)); }
      const add = e.target.closest('[data-add]');
      if (add) { const b = add.closest('.sel-body'); const s = $('[aria-checked="true"]', b); opts.onAdd && opts.onAdd(P[index], s ? s.dataset.size : P[index].sizes[1]); }
    });
    root.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); step(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); } });
    let sw = null;
    plates.addEventListener('pointerdown', e => { sw = { x: e.clientX, y: e.clientY }; });
    plates.addEventListener('pointerup', e => { if (!sw) return; const dx = e.clientX - sw.x; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - sw.y) * 1.4) step(dx < 0 ? 1 : -1); sw = null; });
    // pointer parallax on the arch
    root.addEventListener('pointermove', e => {
      if (VS.touch) return;
      const r = root.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      root.style.setProperty('--mx', x.toFixed(3)); root.style.setProperty('--my', y.toFixed(3));
    });

    index = 0; swap(1);
    return { go, get index() { return index; } };
  }
  window.OrbitSelector = OrbitSelector;
})();
