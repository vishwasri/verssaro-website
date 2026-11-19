/* Cloth Studio — native WebGL port of the supplied "Woven Cloth" effect.
 * Same Verlet scheme (pinned top, travelling wind, iterative distance constraints),
 * applied to a T-shirt hanging from a hanger. Adds lighting with knit sheen, pointer
 * drag, tap ripples, breeze + light controls, and offscreen suspension. No libraries.
 */
(function () {
  'use strict';
  const { clamp } = VS;

  // ---- tiny mat4 ----
  const M = {
    persp(f, a, n, fa) { const t = 1 / Math.tan(f / 2), nf = 1 / (n - fa); return [t / a, 0, 0, 0, 0, t, 0, 0, 0, 0, (fa + n) * nf, -1, 0, 0, 2 * fa * n * nf, 0]; },
    mul(a, b) { const o = new Array(16); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + j] * b[i * 4 + k]; o[i * 4 + j] = s; } return o; },
    trans(x, y, z) { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]; },
    rotY(r) { const c = Math.cos(r), s = Math.sin(r); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; },
    rotX(r) { const c = Math.cos(r), s = Math.sin(r); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; }
  };

  const VSH = `attribute vec3 aPos;attribute vec3 aNor;attribute vec2 aUv;
uniform mat4 uP;uniform mat4 uV;uniform mat4 uM;varying vec3 vN;varying vec2 vUv;varying vec3 vW;varying float vZ;
void main(){vec4 w=uM*vec4(aPos,1.);vW=w.xyz;vN=mat3(uM)*aNor;vUv=aUv;vZ=aPos.z;gl_Position=uP*uV*w;}`;
  const FSH = `precision highp float;
uniform sampler2D uTex;uniform int uSolid;uniform vec3 uColor;uniform vec3 uL;uniform vec3 uEye;uniform float uWarm;
varying vec3 vN;varying vec2 vUv;varying vec3 vW;varying float vZ;
void main(){
 vec4 t=uSolid==1?vec4(uColor,1.):texture2D(uTex,vUv);
 if(t.a<.08)discard;
 vec3 n=normalize(vN);float side=1.;
 if(!gl_FrontFacing){n=-n;side=.42;}
 vec3 base=pow(t.rgb,vec3(2.2));
 vec3 L=normalize(uL);vec3 V=normalize(uEye-vW);
 float key=max(dot(n,L),0.);
 float wrap=max((dot(n,L)+.45)/1.45,0.);
 float fill=max(dot(n,normalize(vec3(.8,-.15,.9))),0.);
 float rim=pow(1.-max(dot(n,V),0.),3.);
 vec3 H=normalize(L+V);float sheen=pow(max(dot(n,H),0.),22.)*.07;
 vec3 keyC=mix(vec3(1.,.97,.92),vec3(1.,.86,.62),uWarm);
 vec3 col=base*(vec3(.09,.085,.08)+wrap*.42*keyC+key*.62*keyC+fill*.14*vec3(.75,.8,.9));
 col+=sheen*keyC+rim*.14*vec3(.85,.66,.32)*(uSolid==1?.4:1.);
 float ao=1.-clamp(-vZ*1.6,0.,.35);
 col*=ao*side;
 gl_FragColor=vec4(pow(col,vec3(1./2.2)),uSolid==1?1.:smoothstep(.3,.7,t.a));
}`;

  function Cloth(canvas, opts) {
    const gl = canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false }) || canvas.getContext('experimental-webgl');
    if (!gl) return null;
    const TW = 1024, TH = 1152;
    const BW = 2.0, BH = BW * TH / TW, GX = 34, GY = 40, N = (GX + 1) * (GY + 1);
    const idx = (x, y) => x + y * (GX + 1);
    const sh = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(o); return o; };
    const prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VSH)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FSH)); gl.linkProgram(prog); gl.useProgram(prog);
    const loc = n => gl.getAttribLocation(prog, n), uni = n => gl.getUniformLocation(prog, n);
    const A = { pos: loc('aPos'), nor: loc('aNor'), uv: loc('aUv') };
    const U = { P: uni('uP'), V: uni('uV'), M: uni('uM'), tex: uni('uTex'), solid: uni('uSolid'), color: uni('uColor'), L: uni('uL'), eye: uni('uEye'), warm: uni('uWarm') };
    gl.enable(gl.DEPTH_TEST);
    if (gl.getContextAttributes().antialias) gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);

    // ---- cloth data ----
    const cur = new Float32Array(N * 3), prev = new Float32Array(N * 3), rest = new Float32Array(N * 3), nor = new Float32Array(N * 3), uv = new Float32Array(N * 2);
    const pinned = new Uint8Array(N);
    const shoulderY = px => { const d = Math.abs(px - 512); return d <= 120 ? 46 : 46 + (d - 120) / 224 * 50; };
    for (let y = 0; y <= GY; y++) for (let x = 0; x <= GX; x++) {
      const i = idx(x, y), u = x / GX, v = y / GY;
      rest[i * 3] = (u - .5) * BW; rest[i * 3 + 1] = (.5 - v) * BH; rest[i * 3 + 2] = 0;
      uv[i * 2] = u; uv[i * 2 + 1] = v;
      const px = u * TW, py = v * TH;
      if (px >= 160 && px <= 864 && py <= shoulderY(px) + 16) pinned[i] = 1;
    }
    cur.set(rest); prev.set(rest);
    const indices = [];
    for (let y = 0; y < GY; y++) for (let x = 0; x < GX; x++) { const a = idx(x, y), b = idx(x + 1, y), c = idx(x, y + 1), d = idx(x + 1, y + 1); indices.push(a, c, b, b, c, d); }
    const cons = [];
    const rH = BW / GX, rV = BH / GY, rD = Math.hypot(rH, rV);
    for (let y = 0; y <= GY; y++) for (let x = 0; x <= GX; x++) {
      if (x < GX) cons.push(idx(x, y), idx(x + 1, y), rH);
      if (y < GY) cons.push(idx(x, y), idx(x, y + 1), rV);
      if (x < GX && y < GY) { cons.push(idx(x, y), idx(x + 1, y + 1), rD); cons.push(idx(x + 1, y), idx(x, y + 1), rD); }
      if (x < GX - 1) cons.push(idx(x, y), idx(x + 2, y), rH * 2); // bend
      if (y < GY - 1) cons.push(idx(x, y), idx(x, y + 2), rV * 2);
    }
    const C = new Float32Array(cons);

    // ---- hanger geometry (solid) ----
    const hang = []; const hy = px => (.5 - (shoulderY(px) - 12) / TH) * BH;
    const hx = px => (px / TW - .5) * BW;
    const bar = (pts, w, z) => { for (let k = 0; k < pts.length - 1; k++) { const [x0, y0] = pts[k], [x1, y1] = pts[k + 1]; const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy) || 1, nx = -dy / l * w, ny = dx / l * w; hang.push(x0 + nx, y0 + ny, z, x0 - nx, y0 - ny, z, x1 + nx, y1 + ny, z, x1 + nx, y1 + ny, z, x0 - nx, y0 - ny, z, x1 - nx, y1 - ny, z); } };
    const barPts = []; for (let px = 150; px <= 874; px += 18) barPts.push([hx(px), hy(px)]);
    bar(barPts, .028, -.035);
    const topY = hy(512);
    const hookPts = [[0, topY + .02], [0, topY + .13]]; for (let a = 180; a >= -40; a -= 10) { const r = a * Math.PI / 180; hookPts.push([.07 * Math.cos(r) + .07, topY + .13 + .07 * Math.sin(r) * -1 * -1]); }
    bar(hookPts, .011, -.03);
    const hangBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, hangBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(hang), gl.STATIC_DRAW);
    const hangCount = hang.length / 3, barCount = (barPts.length - 1) * 6;
    const hangNor = new Float32Array(hang.length); for (let i = 0; i < hangNor.length; i += 3) { hangNor[i + 2] = 1; }
    const hangNorBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, hangNorBuf); gl.bufferData(gl.ARRAY_BUFFER, hangNor, gl.STATIC_DRAW);
    const hangUvBuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, hangUvBuf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(hang.length / 3 * 2), gl.STATIC_DRAW);

    const posBuf = gl.createBuffer(), norBuf = gl.createBuffer(), uvBuf = gl.createBuffer(), iBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf); gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuf); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    // ---- texture ----
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    let texReady = false;
    function setTexture(src) {
      return new Promise(res => {
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas'); c.width = 1024; c.height = 1024;
          c.getContext('2d').drawImage(img, 0, 0, 1024, 1024);
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
          try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c); } catch (e) { res(false); return; }
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
          texReady = true; res(true); wake();
        };
        img.onerror = () => res(false);
        img.src = src;
      });
    }

    // ---- state ----
    const S = { wind: .45, light: .55, paused: false, yaw: 0, tyaw: 0, pitch: 0, tpitch: 0 };
    let pointer = null, grab = -1, grabSet = [], grabT = [0, 0, 0], down = null, t = 0, raf = 0, visible = false, w = 1, h = 1, proj, view, camZ = 4;
    const DT = .016, GRAV = -3.0, DAMP = .982;

    function wind(ix, iy, tt) {
      const cx = ix / GX, cy = iy / GY;
      const travel = tt * 1.5 - cy * 3.6;
      const gust = .6 + .42 * Math.sin(tt * .6) + .18 * Math.sin(tt * 1.9 + 1.3);
      const amp = 2.6 * cy * S.wind * 1.6;
      return [Math.sin(tt * .9 + cy * 2.2) * .35 * cy * S.wind, -.25 * cy, (Math.sin(travel + cx * 3.3) + .5 * Math.sin(travel * 1.7 + cx * 6.0)) * amp * gust];
    }
    function step() {
      for (let iy = 0; iy <= GY; iy++) for (let ix = 0; ix <= GX; ix++) {
        const i = idx(ix, iy); if (pinned[i]) continue;
        const f = wind(ix, iy, t);
        for (let k = 0; k < 3; k++) {
          const j = i * 3 + k, a = k === 0 ? f[0] : k === 1 ? f[1] + GRAV : f[2];
          const v = (cur[j] - prev[j]) * DAMP; prev[j] = cur[j];
          cur[j] += v + a * DT * DT + (rest[j] - cur[j]) * (k === 2 ? .004 : .012);
        }
        if (pointer && grab < 0) {
          const dx = cur[i * 3] - pointer[0], dy = cur[i * 3 + 1] - pointer[1], d = Math.hypot(dx, dy);
          if (d < .32) cur[i * 3 + 2] -= (1 - d / .32) * .006;
        }
      }
      if (grab >= 0) for (const g of grabSet) { const j = g.i * 3; const tx = [grabT[0] + g.ox, grabT[1] + g.oy, grabT[2] * g.w]; for (let k = 0; k < 3; k++) cur[j + k] += (tx[k] - cur[j + k]) * .45 * g.w; }
      for (let it = 0; it < 6; it++) {
        for (let c = 0; c < C.length; c += 3) {
          const a = C[c], b = C[c + 1], rl = C[c + 2];
          const ax = a * 3, bx = b * 3;
          let dx = cur[bx] - cur[ax], dy = cur[bx + 1] - cur[ax + 1], dz = cur[bx + 2] - cur[ax + 2];
          const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-6, diff = (d - rl) / d * .5;
          dx *= diff; dy *= diff; dz *= diff;
          const pa = pinned[a], pb = pinned[b];
          if (!pa && !pb) { cur[ax] += dx; cur[ax + 1] += dy; cur[ax + 2] += dz; cur[bx] -= dx; cur[bx + 1] -= dy; cur[bx + 2] -= dz; }
          else if (pa && !pb) { cur[bx] -= dx * 2; cur[bx + 1] -= dy * 2; cur[bx + 2] -= dz * 2; }
          else if (!pa && pb) { cur[ax] += dx * 2; cur[ax + 1] += dy * 2; cur[ax + 2] += dz * 2; }
        }
      }
      for (let i = 0; i < N; i++) if (pinned[i]) { for (let k = 0; k < 3; k++) { cur[i * 3 + k] = rest[i * 3 + k]; prev[i * 3 + k] = rest[i * 3 + k]; } }
    }
    function normals() {
      nor.fill(0);
      for (let k = 0; k < indices.length; k += 3) {
        const a = indices[k] * 3, b = indices[k + 1] * 3, c = indices[k + 2] * 3;
        const e1x = cur[b] - cur[a], e1y = cur[b + 1] - cur[a + 1], e1z = cur[b + 2] - cur[a + 2];
        const e2x = cur[c] - cur[a], e2y = cur[c + 1] - cur[a + 1], e2z = cur[c + 2] - cur[a + 2];
        const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
        for (const v of [a, b, c]) { nor[v] += nx; nor[v + 1] += ny; nor[v + 2] += nz; }
      }
    }
    function resize() {
      const r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(1, r.width); h = Math.max(1, r.height);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      const fov = 32 * Math.PI / 180, aspect = w / h, H = BH + .55;
      const vFit = (H / 2) / Math.tan(fov / 2), hFit = (BW * .62) / Math.tan(fov / 2) / aspect;
      camZ = Math.max(vFit, hFit) * 1.06;
      proj = M.persp(fov, aspect, .1, 50);
      view = M.trans(0, -.12, -camZ);
      wake();
    }
    function render() {
      S.yaw += (S.tyaw - S.yaw) * .06; S.pitch += (S.tpitch - S.pitch) * .06;
      const idle = VS.reduced ? 0 : Math.sin(t * .35) * .1;
      const model = M.mul(M.rotY(S.yaw + idle), M.rotX(S.pitch));
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniformMatrix4fv(U.P, false, proj); gl.uniformMatrix4fv(U.V, false, view); gl.uniformMatrix4fv(U.M, false, model);
      const la = (S.light - .5) * 2.4;
      gl.uniform3f(U.L, Math.sin(la) * 2.2, 2.4, Math.cos(la) * 2.6);
      gl.uniform3f(U.eye, 0, .12, camZ); gl.uniform1f(U.warm, .35 + S.light * .3);
      // hanger
      gl.uniform1i(U.solid, 1);
      const bind = (buf, a, s) => { gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a, s, gl.FLOAT, false, 0, 0); };
      bind(hangBuf, A.pos, 3); bind(hangNorBuf, A.nor, 3); bind(hangUvBuf, A.uv, 2);
      gl.uniform3f(U.color, .23, .14, .09); gl.drawArrays(gl.TRIANGLES, 0, barCount);
      gl.uniform3f(U.color, .85, .66, .33); gl.drawArrays(gl.TRIANGLES, barCount, hangCount - barCount);
      if (!texReady) return;
      // cloth
      gl.uniform1i(U.solid, 0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(U.tex, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuf); gl.bufferData(gl.ARRAY_BUFFER, cur, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(A.pos); gl.vertexAttribPointer(A.pos, 3, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, norBuf); gl.bufferData(gl.ARRAY_BUFFER, nor, gl.DYNAMIC_DRAW); gl.enableVertexAttribArray(A.nor); gl.vertexAttribPointer(A.nor, 3, gl.FLOAT, false, 0, 0);
      bind(uvBuf, A.uv, 2);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuf);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    }
    function loop() {
      raf = 0;
      if (!visible) return;
      if (!S.paused && !VS.reduced) { t += DT; step(); }
      else if (grab >= 0) step();
      normals(); render();
      raf = requestAnimationFrame(loop);
    }
    function wake() { if (!raf && visible) raf = requestAnimationFrame(loop); }

    // ---- pointer ----
    const toWorld = e => {
      const r = canvas.getBoundingClientRect();
      const nx = ((e.clientX - r.left) / r.width) * 2 - 1, ny = -(((e.clientY - r.top) / r.height) * 2 - 1);
      const th = Math.tan(16 * Math.PI / 180) * camZ;
      return [nx * th * (w / h), ny * th + .12, 0];
    };
    canvas.addEventListener('pointermove', e => {
      const p = toWorld(e); pointer = p;
      if (!VS.touch) { const r = canvas.getBoundingClientRect(); S.tyaw = ((e.clientX - r.left) / r.width - .5) * .5; S.tpitch = ((e.clientY - r.top) / r.height - .5) * .12; }
      if (grab >= 0) { grabT = [p[0], p[1], .35]; if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) down.moved = true; }
    });
    canvas.addEventListener('pointerleave', () => { pointer = null; S.tyaw = 0; S.tpitch = 0; });
    canvas.addEventListener('pointerdown', e => {
      const p = toWorld(e); down = { x: e.clientX, y: e.clientY, moved: false };
      let best = -1, bd = .28;
      for (let i = 0; i < N; i++) { if (pinned[i]) continue; const d = Math.hypot(cur[i * 3] - p[0], cur[i * 3 + 1] - p[1]); if (d < bd) { bd = d; best = i; } }
      grab = best; grabT = [p[0], p[1], .35]; grabSet = [];
      if (best >= 0) for (let i = 0; i < N; i++) { if (pinned[i]) continue; const ox = cur[i * 3] - cur[best * 3], oy = cur[i * 3 + 1] - cur[best * 3 + 1], d = Math.hypot(ox, oy); if (d < .3) grabSet.push({ i, ox, oy, w: Math.pow(1 - d / .3, 1.5) }); }
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
      opts.onInteract && opts.onInteract();
    });
    const up = e => {
      if (down && !down.moved) ripple(toWorld(e));
      grab = -1; down = null;
    };
    canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', () => { grab = -1; down = null; });
    function ripple(p) {
      for (let i = 0; i < N; i++) { if (pinned[i]) continue; const d = Math.hypot(rest[i * 3] - p[0], rest[i * 3 + 1] - p[1]); prev[i * 3 + 2] += Math.max(0, 1 - d / 1.1) * .05 * Math.cos(d * 9); }
    }
    function swing() { for (let i = 0; i < N; i++) { if (pinned[i]) continue; const k = (.5 - rest[i * 3 + 1] / BH); prev[i * 3] -= .04 * k; prev[i * 3 + 2] += .03 * k; } }

    new ResizeObserver(resize).observe(canvas);
    resize();
    // warm the simulation so it starts settled
    for (let s = 0; s < 60; s++) { t += DT; step(); }
    normals();
    VS.whenVisible(canvas, () => { visible = true; wake(); }, () => { visible = false; }, '150px');

    return {
      setTexture: src => setTexture(src).then(ok => { swing(); return ok; }),
      set wind(v) { S.wind = v; }, set light(v) { S.light = v; wake(); },
      pause(v) { S.paused = v; wake(); },
      reset() { cur.set(rest); prev.set(rest); t = 0; for (let s = 0; s < 40; s++) { t += DT; step(); } wake(); }
    };
  }
  window.Cloth = Cloth;
})();
