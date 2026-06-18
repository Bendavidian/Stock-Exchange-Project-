/**
 * Falling particles / shooting-star layer — vanilla JS, zero dependencies.
 *
 * Renders 60 slow-falling glowing dots on a transparent canvas that sits
 * directly above the shader background (same z-index:0, later in DOM).
 * ~28% of particles have a fading shooting-star trail.
 *
 * Colors: cyan, blue, purple, soft white-blue — matching the finance theme.
 * pointer-events:none — never blocks clicks, hover, or ink-reveal.
 */

const COUNT = 60;

// [r, g, b] — cyan | blue | purple | soft white-blue
const PALETTE = [
  [0,   212, 255],
  [68,  153, 255],
  [170, 119, 255],
  [224, 234, 255],
];

function rand(min, max) { return Math.random() * (max - min) + min; }

function newParticle(W, H, spreadAcrossHeight) {
  const hasTrail = Math.random() < 0.28;
  return {
    x:       rand(0, W),
    y:       spreadAcrossHeight ? rand(-60, H) : rand(-120, -4),
    vx:      rand(-0.22, 0.22),
    vy:      rand(0.35, 1.05),
    r:       rand(0.8, 2.5),
    alpha:   rand(0.22, 0.72),
    col:     PALETTE[Math.floor(Math.random() * PALETTE.length)],
    trail:   hasTrail,
    tLen:    hasTrail ? rand(8, 24) : 0,
  };
}

function drawDot(ctx, p) {
  const [r, g, b] = p.col;

  // Fading trail (shooting-star effect)
  if (p.trail && p.tLen > 0) {
    const tx = p.x - p.vx * p.tLen;
    const ty = p.y - p.vy * p.tLen;
    const grad = ctx.createLinearGradient(tx, ty, p.x, p.y);
    grad.addColorStop(0, `rgba(${r},${g},${b},0)`);
    grad.addColorStop(1, `rgba(${r},${g},${b},${p.alpha * 0.5})`);
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = grad;
    ctx.lineWidth   = p.r * 0.5;
    ctx.lineCap     = 'round';
    ctx.stroke();
  }

  ctx.fillStyle = `rgb(${r},${g},${b})`;

  // Soft glow aura (low alpha, larger radius)
  ctx.globalAlpha = p.alpha * 0.20;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r * 3.8, 0, Math.PI * 2);
  ctx.fill();

  // Bright core dot
  ctx.globalAlpha = p.alpha;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;  // reset for next particle
}

function init() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let W = 0, H = 0;
  let particles = [];

  // ── Resize ──────────────────────────────────────────────────
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width        = Math.round(W * dpr);
    canvas.height       = Math.round(H * dpr);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ── Populate ────────────────────────────────────────────────
  function populate(spread) {
    particles = Array.from({ length: COUNT }, () => newParticle(W, H, spread));
  }

  // ── Render loop ─────────────────────────────────────────────
  function tick() {
    requestAnimationFrame(tick);
    ctx.clearRect(0, 0, W, H);

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;

      // Recycle particle that left the bottom of the screen
      if (p.y > H + p.tLen + 10) {
        Object.assign(p, newParticle(W, H, false));
      }

      drawDot(ctx, p);
    }
  }

  resize();
  populate(true);   // initial fill: spread particles across full viewport height
  tick();

  window.addEventListener('resize', () => {
    resize();
    populate(true);
  });
}

document.addEventListener('DOMContentLoaded', init);
