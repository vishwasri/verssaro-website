/* Halftone field — vanilla port of the supplied "Halftone Wordmark Footer".
 * A shape (text or the official emblem) is printed as a field of dots, each sized by how
 * much of the shape covers its cell. Dots part around the pointer on springs, warm in
 * colour as they're pushed, and a click sends a shock ring through them.
 * Extra: setScatter(0..1) lifts the dots off into the air (scroll-driven exit).
 */
(function () {
  'use strict';
  const ARM = 'M 0,-106 L -36,-72 L -11,-35 L 5,-39 L 6,-20 C 6,-10 3,-4 0,0 C 11,-9 17,-25 17,-52 C 16,-54 14,-55 13,-54 L -5,-48 L -9,-51 L -20,-71 L -1,-90 L 14,-74 L 6,-61 L 31,-73 L 31,-76 Z';

  function radiusFor(c, gap) { c = c < 0 ? 0 : c > 1 ? 1 : c; return Math.sqrt(c) * gap * 0.56; }

  class Halftone {
    constructor(canvas, o) {
      this.c = canvas; this.ctx = canvas.getContext('2d');
      this.o = Object.assign({
        mode: 'text', text: 'HERITAGE', font: '800 100px Montserrat, Arial, sans-serif',
        align: 'bottom', crop: 0.2, fill: 1.0, letterSpacing: 0,
        ink: '#D9B25C', warm: '#FFF0C2', dotGap: 7, radius: 90, fadeTop: 0,
        target: canvas, interactive: true, emblemScale: 0.92, emblemX: 0.5
      }, o || {});
      this.ink = VS.hex(this.o.ink); this.warm = VS.hex(this.o.warm);
      this.px = -1e5; this.py = -1e5; this.ring = { x: 0, y: 0, t: -1 };
      this.scatter = 0; this.raf = 0; this.visible = true; this.awake = true;
      this.dots = new Float32Array(0); this.n = 0;
      this.reduced = VS.reduced;
      this._bind();
      this.layout();
      const ro = new ResizeObserver(() => { this.layout(); this.wake(); }); ro.observe(canvas);
      VS.whenVisible(canvas, () => { this.visible = true; this.wake(); }, () => { this.visible = false; }, '100px');
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { this.layout(); this.wake(); });
    }
    _bind() {
      const t = this.o.target;
      const loc = e => { const b = this.c.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
      t.addEventListener('pointermove', e => { if (!this.o.interactive || e.pointerType === 'touch' && !this.o.touch) return; const p = loc(e); this.px = p[0]; this.py = p[1]; this.wake(); });
      t.addEventListener('pointerleave', () => { this.px = this.py = -1e5; this.wake(); });
      t.addEventListener('pointerdown', e => {
        if (!this.o.interactive || this.reduced) return;
        if (e.target.closest && e.target.closest('a,button,input,figure')) return;
        const p = loc(e); this.ring = { x: p[0], y: p[1], t: performance.now() }; this.wake();
      });
    }
    layout() {
      const o = this.o, r = this.c.getBoundingClientRect();
      const w = this.w = Math.max(1, Math.round(r.width)), h = this.h = Math.max(1, Math.round(r.height));
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.c.width = Math.round(w * this.dpr); this.c.height = Math.round(h * this.dpr);
      const mask = document.createElement('canvas'); mask.width = w; mask.height = h;
      const m = mask.getContext('2d', { willReadFrequently: true });
      m.fillStyle = '#000';
      if (o.mode === 'text') {
        const base = o.font.replace(/\d+px/, '100px');
        m.font = base;
        if ('letterSpacing' in m) m.letterSpacing = o.letterSpacing + 'px';
        const mw = m.measureText(o.text).width;
        let size = (w * o.fill / mw) * 100;
        m.font = base.replace('100px', size + 'px');
        if ('letterSpacing' in m) m.letterSpacing = (o.letterSpacing * size / 100) + 'px';
        let box = m.measureText(o.text);
        let cap = box.actualBoundingBoxAscent || size * 0.72;
        if (o.maxCap && cap > h * o.maxCap) { size *= (h * o.maxCap) / cap; m.font = base.replace('100px', size + 'px'); if ('letterSpacing' in m) m.letterSpacing = (o.letterSpacing * size / 100) + 'px'; box = m.measureText(o.text); cap = box.actualBoundingBoxAscent || size * .72; }
        m.textBaseline = 'alphabetic';
        const x = (w - box.width) / 2;
        const y = o.align === 'bottom' ? h + cap * Math.max(0, Math.min(.6, o.crop)) : (h + cap) / 2;
        m.fillText(o.text, x, y);
      } else {
        const s = Math.min(w, h) / 212 * o.emblemScale;
        m.save(); m.translate(w * o.emblemX, h / 2); m.scale(s, s);
        const p = new Path2D(ARM);
        for (let i = 0; i < 6; i++) { m.save(); m.rotate(i * Math.PI / 3); m.fill(p); m.restore(); }
        m.restore();
      }
      const img = m.getImageData(0, 0, w, h).data;
      const gap = Math.max(3, o.dotGap), cols = Math.ceil(w / gap), rows = Math.ceil(h / gap), tmp = [];
      for (let gy = 0; gy < rows; gy++) for (let gx = 0; gx < cols; gx++) {
        let sum = 0;
        for (let sy = 0; sy < 3; sy++) for (let sx = 0; sx < 3; sx++) {
          const x = Math.min(w - 1, Math.floor(gx * gap + ((sx + .5) * gap) / 3));
          const y = Math.min(h - 1, Math.floor(gy * gap + ((sy + .5) * gap) / 3));
          sum += img[(y * w + x) * 4 + 3];
        }
        const cov = sum / (9 * 255);
        if (cov < 0.06) continue;
        const hx = gx * gap + gap / 2, hy = gy * gap + gap / 2;
        // x,y,vx,vy,hx,hy,r, scatterX, scatterY, seed
        tmp.push(hx, hy, 0, 0, hx, hy, radiusFor(cov, gap), (Math.random() - .5) * 260, -(80 + Math.random() * 420), Math.random());
      }
      this.dots = new Float32Array(tmp); this.n = tmp.length / 10;
      this.awake = true;
    }
    setScatter(v) { v = VS.clamp(v, 0, 1); if (Math.abs(v - this.scatter) > 0.001) { this.scatter = v; this.wake(); } }
    wake() { this.awake = true; if (!this.raf && this.visible) this.raf = requestAnimationFrame(t => this.loop(t)); }
    loop(now) { this.raf = 0; if (!this.visible) return; this.draw(now); if (this.awake) this.raf = requestAnimationFrame(t => this.loop(t)); }
    draw(now) {
      const o = this.o, ctx = this.ctx, d = this.dots, ink = this.ink, warm = this.warm;
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, this.w, this.h);
      const r = o.interactive && !this.reduced ? o.radius : 0;
      const age = this.ring.t < 0 ? 1e9 : now - this.ring.t, ringR = age * 0.9;
      const sc = this.scatter, se = sc * sc * (3 - 2 * sc);
      let moving = false;
      const inkStr = `rgb(${ink.join(',')})`;
      for (let i = 0; i < this.n; i++) {
        const j = i * 10;
        let x = d[j], y = d[j + 1], vx = d[j + 2], vy = d[j + 3];
        const hx = d[j + 4], hy = d[j + 5];
        if (!this.reduced) {
          if (age < 900) {
            const dx = hx - this.ring.x, dy = hy - this.ring.y, dd = Math.sqrt(dx * dx + dy * dy) + .001;
            const band = 1 - Math.min(1, Math.abs(dd - ringR) / 26);
            if (band > 0) { const f = band * 3.2 * (1 - age / 900); vx += dx / dd * f; vy += dy / dd * f; }
          }
          const dx = x - this.px, dy = y - this.py, d2 = dx * dx + dy * dy;
          if (r > 0 && d2 < r * r) { const dd = Math.sqrt(d2) + .001, f = (1 - dd / r) * 2.6; vx += dx / dd * f; vy += dy / dd * f; }
          vx = (vx + (hx - x) * .05) * .84; vy = (vy + (hy - y) * .05) * .84;
          x += vx; y += vy;
          if (Math.abs(vx) + Math.abs(vy) > .02 || Math.abs(x - hx) + Math.abs(y - hy) > .05) moving = true;
          else { x = hx; y = hy; vx = 0; vy = 0; }
          d[j] = x; d[j + 1] = y; d[j + 2] = vx; d[j + 3] = vy;
        }
        let rx = x, ry = y, rad = d[j + 6], alpha = 1;
        if (se > 0) {
          const k = VS.clamp((se * 1.4 - d[j + 9] * .4), 0, 1);
          rx += d[j + 7] * k; ry += d[j + 8] * k; rad *= 1 - k * .6; alpha = 1 - k;
          if (alpha <= .01) continue;
        }
        const dist = Math.hypot(x - hx, y - hy), kk = Math.min(1, dist / 28);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = kk > .02 ? `rgb(${Math.round(ink[0] + (warm[0] - ink[0]) * kk)},${Math.round(ink[1] + (warm[1] - ink[1]) * kk)},${Math.round(ink[2] + (warm[2] - ink[2]) * kk)})` : inkStr;
        ctx.beginPath(); ctx.arc(rx, ry, rad, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
      this.awake = moving || age < 900 || this.px > -1e4;
    }
  }
  window.Halftone = Halftone;
  window.VS_ARM = ARM;
})();
