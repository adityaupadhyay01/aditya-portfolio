import gsap from 'gsap';

/* ============================================================
   WEBGL BACKDROP - "The Signal"
   A domain-warped fbm field rendered on a fullscreen triangle.
   Raw WebGL, no library. The field starts as incoherent phosphor
   static and resolves into clean directional flow as the story
   progresses; scroll velocity drives an RGB split.
============================================================ */

const VERT = `
  attribute vec2 a_pos;
  void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
  precision highp float;

  uniform vec2  u_res;
  uniform float u_time;
  uniform float u_vel;
  uniform vec3  u_colA;
  uniform vec3  u_colB;
  uniform float u_warp;
  uniform float u_scan;
  uniform float u_glitch;
  uniform float u_amp;
  uniform float u_coh;

  // sin-free hash - trig in an inner loop this hot is the whole ballgame
  vec2 hash2(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
  }

  // gradient noise
  float gnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(dot(hash2(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
                   dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
               mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                   dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 3; i++) {
      v += a * gnoise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  // two-level domain warp
  float field(vec2 p, float t) {
    vec2 q = vec2(fbm(p + vec2(0.0, t * 0.10)),
                  fbm(p + vec2(5.2, 1.3)));
    vec2 r = vec2(fbm(p + u_warp * q + vec2(1.7, 9.2) + t * 0.06),
                  fbm(p + u_warp * q + vec2(8.3, 2.8) - t * 0.04));
    return fbm(p + u_warp * r);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / u_res.xy;
    vec2 p  = (gl_FragCoord.xy - 0.5 * u_res.xy) / u_res.y;
    float t = u_time;

    float smear = clamp(u_vel * 0.0016, -0.06, 0.06);
    vec2  sp    = p * 2.2;
    sp.x += smear * 2.0;

    // chromatic split grows with scroll speed and with the glitch mood
    float split = abs(smear) * 0.9 + u_glitch * 0.010;

    // split depends only on uniforms, so this branch is coherent across the
    // whole draw: when the page is still and the mood is clean we evaluate
    // the field once instead of three times (identical output, 3x cheaper).
    float fg = field(sp, t);
    float fr = fg, fb = fg;
    if (split > 0.0012) {
      fr = field(sp + vec2( split, 0.0), t);
      fb = field(sp + vec2(-split, 0.0), t);
    }

    // coherence: raw turbulence -> resolved directional flow
    vec3 f    = vec3(fr, fg, fb);
    vec3 turb = abs(f) * 1.6;
    vec3 flow = smoothstep(0.0, 1.0, f * 0.5 + 0.5);
    vec3 n    = mix(turb, flow, u_coh);

    vec3 col = mix(u_colA, u_colB, n);

    // horizontal tear lines (failures)
    if (u_glitch > 0.01) {
      float row  = floor(uv.y * 22.0 + t * 1.7);
      float band = step(0.985 - u_glitch * 0.03, fract(uv.y * 22.0 + t * 1.7));
      float jit  = fract(sin(row * 91.7) * 43758.5453) - 0.5;
      col += u_colB * band * u_glitch * abs(jit) * 1.4;
    }

    // scanlines (CRT)
    float scan = 0.5 + 0.5 * sin(gl_FragCoord.y * 1.7);
    col *= 1.0 - u_scan * 0.35 * scan;

    // vignette + grain
    col *= smoothstep(1.25, 0.25, length(p));
    float g = fract(sin(dot(gl_FragCoord.xy + t * 60.0, vec2(12.9898, 78.233))) * 43758.5453);
    col += (g - 0.5) * 0.022;

    gl_FragColor = vec4(max(col * u_amp, 0.0), 1.0);
  }
`;

/* Per-chapter mood. coh = how "resolved" the signal is. */
const MOODS = {
  intro:      { r1:.045,g1:.075,b1:.055, r2:.10,g2:.20,b2:.11, warp:1.2, scan:.50, glitch:.04, amp:.32, coh:.08 },
  ch1:        { r1:.055,g1:.125,b1:.055, r2:.16,g2:.38,b2:.14, warp:1.6, scan:.90, glitch:.10, amp:.55, coh:.14 },
  ch2:        { r1:.055,g1:.070,b1:.100, r2:.14,g2:.16,b2:.26, warp:2.0, scan:.22, glitch:.06, amp:.38, coh:.30 },
  ch3:        { r1:.050,g1:.080,b1:.130, r2:.12,g2:.20,b2:.34, warp:2.6, scan:.16, glitch:.08, amp:.44, coh:.42 },
  ch4:        { r1:.055,g1:.080,b1:.120, r2:.14,g2:.19,b2:.30, warp:2.2, scan:.12, glitch:.05, amp:.40, coh:.58 },
  ch5:        { r1:.120,g1:.045,b1:.045, r2:.30,g2:.09,b2:.09, warp:3.4, scan:.40, glitch:.90, amp:.55, coh:.18 },
  ch6:        { r1:.045,g1:.100,b1:.090, r2:.10,g2:.26,b2:.22, warp:1.8, scan:.28, glitch:.14, amp:.45, coh:.64 },
  ch7:        { r1:.050,g1:.090,b1:.160, r2:.16,g2:.30,b2:.55, warp:1.4, scan:.09, glitch:.03, amp:.50, coh:.86 },
  transition: { r1:.045,g1:.080,b1:.140, r2:.13,g2:.24,b2:.46, warp:1.0, scan:.07, glitch:.02, amp:.40, coh:.93 },
  explore:    { r1:.040,g1:.068,b1:.120, r2:.11,g2:.20,b2:.38, warp:0.9, scan:.06, glitch:.02, amp:.30, coh:.96 },
  ending:     { r1:.038,g1:.058,b1:.110, r2:.10,g2:.16,b2:.30, warp:0.9, scan:.06, glitch:.02, amp:.28, coh:.95 },
};

/* Returns { setVelocity, setMood, render, destroy } or null when WebGL is
   unavailable or motion is reduced - every caller already guards on null. */
export function createSignal(cv, reduced) {
  if (reduced || !cv) return null;

  let gl = null;
  try {
    const opts = { alpha: false, antialias: false, depth: false,
                   stencil: false, powerPreference: 'low-power' };
    gl = cv.getContext('webgl', opts) || cv.getContext('experimental-webgl', opts);
  } catch { return null; }
  if (!gl) return null;

  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('[gl] shader:', gl.getShaderInfoLog(sh));
      return null;
    }
    return sh;
  }

  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[gl] link:', gl.getProgramInfoLog(prog));
    return null;
  }
  gl.useProgram(prog);

  // fullscreen triangle
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  ['u_res', 'u_time', 'u_vel', 'u_colA', 'u_colB', 'u_warp', 'u_scan', 'u_glitch', 'u_amp', 'u_coh']
    .forEach(n => { U[n] = gl.getUniformLocation(prog, n); });

  const mood = Object.assign({}, MOODS.intro);
  let vel = 0, w = 0, h = 0;
  let lastDraw = 0, quality = 0.55, probe = 0, probeT0 = 0;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * quality;
    const nw = Math.max(1, Math.floor(window.innerWidth  * dpr));
    const nh = Math.max(1, Math.floor(window.innerHeight * dpr));
    if (nw !== w || nh !== h) {
      w = cv.width = nw; h = cv.height = nh;
      gl.viewport(0, 0, w, h);
    }
  }
  resize();

  return {
    setVelocity(v) { vel = v; },
    setMood(name) {
      const m = MOODS[name];
      if (!m) return;
      gsap.to(mood, Object.assign({ duration: 1.8, ease: 'power2.inOut', overwrite: 'auto' }, m));
    },
    render(ms) {
      if (document.hidden) return;
      /* The field drifts slowly, so 30fps is indistinguishable from 60
         and halves the GPU cost outright. */
      if (ms - lastDraw < 33.0) return;
      lastDraw = ms;
      resize();
      vel *= 0.88;
      gl.useProgram(prog);
      gl.uniform2f(U.u_res, w, h);
      gl.uniform1f(U.u_time, (ms * 0.001) % 3600.0);
      gl.uniform1f(U.u_vel, vel);
      gl.uniform3f(U.u_colA, mood.r1, mood.g1, mood.b1);
      gl.uniform3f(U.u_colB, mood.r2, mood.g2, mood.b2);
      gl.uniform1f(U.u_warp, mood.warp);
      gl.uniform1f(U.u_scan, mood.scan);
      gl.uniform1f(U.u_glitch, mood.glitch);
      gl.uniform1f(U.u_amp, mood.amp);
      gl.uniform1f(U.u_coh, mood.coh);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      /* One-shot probe: if this GPU can't hold the target, drop resolution
         once instead of staying janky. */
      if (probe < 40) {
        if (probe === 0) probeT0 = ms;
        probe++;
        if (probe === 40) {
          const fps = 39000.0 / Math.max(1.0, ms - probeT0);
          if (fps < 22.0 && quality > 0.4) { quality = 0.38; w = h = 0; }
        }
      }
    },
    /* The canvas outlives a dev remount and hands back this same context,
       so free what we allocated but keep the context alive. */
    destroy() {
      gsap.killTweensOf(mood);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };
}
