/**
 * Animated WebGL shader background — vanilla JS, zero dependencies.
 *
 * Five slow-moving Gaussian glow orbs (indigo, purple, cyan, blue, accent)
 * on a deep-navy base, matching the site's dark finance palette.
 *
 * Layering strategy:
 *   - The canvas is placed AFTER .ink-page-bg in the DOM.  Both are
 *     position:fixed z-index:0, so the later DOM element paints on top.
 *   - When the mouse moves the canvas fades to opacity:0 (ink-reveal shows).
 *   - When the mouse is idle the canvas fades back to opacity:1 (shader shows).
 *   - pointer-events:none ensures no mouse or keyboard interaction is blocked.
 */

// ─── Shader sources ───────────────────────────────────────────

const VERT_SRC = `
  attribute vec2 a_pos;
  void main() {
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

const FRAG_SRC = `
  precision mediump float;
  uniform float u_time;
  uniform vec2  u_res;

  /* Smooth Gaussian blob */
  float blob(vec2 uv, vec2 center, float r) {
    float d = length(uv - center);
    return exp(-(d * d) / (r * r));
  }

  void main() {
    vec2  uv = gl_FragCoord.xy / u_res;
    float t  = u_time * 0.18;

    /* Base: deep navy  #080c18 = (8,12,24)/255 */
    vec3 col = vec3(0.0314, 0.0471, 0.0941);

    /* Orb 1 — indigo / blue-violet, large, upper-left */
    vec2 c1 = vec2(0.22 + 0.14 * sin(t * 0.73),  0.62 + 0.11 * cos(t * 0.51));
    col += vec3(0.20, 0.19, 0.68) * blob(uv, c1, 0.42) * 0.52;

    /* Orb 2 — deep purple, medium, centre-right */
    vec2 c2 = vec2(0.70 + 0.11 * cos(t * 0.62),  0.38 + 0.14 * sin(t * 0.44));
    col += vec3(0.30, 0.08, 0.62) * blob(uv, c2, 0.30) * 0.44;

    /* Orb 3 — cyan / teal, smaller, upper-centre (slightly faster) */
    vec2 c3 = vec2(0.50 + 0.20 * sin(t * 0.85 + 1.1),  0.18 + 0.09 * cos(t * 0.66));
    col += vec3(0.02, 0.40, 0.58) * blob(uv, c3, 0.22) * 0.36;

    /* Orb 4 — soft blue, subtle, lower-right */
    vec2 c4 = vec2(0.84 + 0.07 * cos(t * 0.39),  0.76 + 0.09 * sin(t * 0.55));
    col += vec3(0.10, 0.22, 0.52) * blob(uv, c4, 0.26) * 0.28;

    /* Orb 5 — accent purple, very subtle, lower-left */
    vec2 c5 = vec2(0.09 + 0.06 * sin(t * 0.34),  0.82 + 0.07 * cos(t * 0.48));
    col += vec3(0.26, 0.18, 0.55) * blob(uv, c5, 0.20) * 0.22;

    col = clamp(col, 0.0, 1.0);
    gl_FragColor = vec4(col, 1.0);
  }
`;

// ─── WebGL helpers ────────────────────────────────────────────

function compileShader(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn('[shader-bg] compile:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function buildProgram(gl) {
  const vert = compileShader(gl, gl.VERTEX_SHADER,   VERT_SRC);
  const frag = compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
  if (!vert || !frag) return null;

  const prog = gl.createProgram();
  gl.attachShader(prog, vert);
  gl.attachShader(prog, frag);
  gl.linkProgram(prog);
  gl.deleteShader(vert);
  gl.deleteShader(frag);

  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.warn('[shader-bg] link:', gl.getProgramInfoLog(prog));
    gl.deleteProgram(prog);
    return null;
  }
  return prog;
}

// ─── Initialisation ──────────────────────────────────────────

function initShaderBackground() {
  const canvas = document.getElementById('shader-bg-canvas');
  if (!canvas) return;

  const gl =
    canvas.getContext('webgl',              { alpha: false, antialias: false }) ||
    canvas.getContext('experimental-webgl', { alpha: false, antialias: false });

  if (!gl) {
    // WebGL unavailable — hide canvas; the body background (#080c18) acts as fallback
    canvas.style.display = 'none';
    return;
  }

  const program = buildProgram(gl);
  if (!program) { canvas.style.display = 'none'; return; }

  gl.useProgram(program);

  // Full-screen quad — two triangles that cover the entire clip space
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1,-1,  1,-1, -1, 1,  -1, 1,  1,-1,  1, 1]),
    gl.STATIC_DRAW,
  );

  const aPos  = gl.getAttribLocation(program, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(program, 'u_time');
  const uRes  = gl.getUniformLocation(program, 'u_res');
  const t0    = performance.now();
  let   rafId = null;

  // ── Resize ────────────────────────────────────────────────
  function onResize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = Math.round(window.innerWidth  * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    canvas.style.width  = window.innerWidth  + 'px';
    canvas.style.height = window.innerHeight + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  // ── Render loop ───────────────────────────────────────────
  function draw() {
    rafId = requestAnimationFrame(draw);
    gl.uniform1f(uTime, (performance.now() - t0) / 1000);
    gl.uniform2f(uRes,  canvas.width, canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  onResize();
  draw();
  window.addEventListener('resize', onResize);

  // ── Mouse-idle toggle ─────────────────────────────────────
  //
  // When the mouse moves, hide the shader so the ink-reveal layer below
  // is fully visible.  After the mouse has been idle for IDLE_MS, fade
  // the shader back in.  On mouseout (mouse leaves the page), restore
  // the shader immediately so there's no blank-screen moment.
  //
  const IDLE_MS = 500;
  let   idleTimer = null;

  function onMouseMove() {
    canvas.classList.add('shader-bg-canvas--hidden');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      canvas.classList.remove('shader-bg-canvas--hidden');
    }, IDLE_MS);
  }

  function onMouseOut(e) {
    // Only when the mouse actually leaves the browser window
    if (e.relatedTarget) return;
    clearTimeout(idleTimer);
    canvas.classList.remove('shader-bg-canvas--hidden');
  }

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseout',  onMouseOut);
}

document.addEventListener('DOMContentLoaded', initShaderBackground);
