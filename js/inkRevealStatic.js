export default function initInkReveal(canvasId, options = {}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const settings = {
    maskColor: [8, 12, 24],
    brushSize: 160,
    lifetime: 900,
    rStart: 10,
    rVary: 0.45,
    stampStep: 10,
    maxStamps: 200,
    segments: 36,
    wobble: [0.14, 0.08, 0.05],
    gradientInnerRadius: 0.2,
    gradientStops: [0.95, 0.88, 0],
    ...options,
  };

  const stamps = [];
  let running = false;
  let lastPos = null;
  let dims = { w: 0, h: 0 };

  const fillMask = (ctx) => {
    const [r, g, b] = settings.maskColor;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0, 0, dims.w, dims.h);
  };

  const resize = () => {
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = parent.getBoundingClientRect();
    dims = { w: rect.width, h: rect.height };
    canvas.width = Math.round(dims.w * dpr);
    canvas.height = Math.round(dims.h * dpr);
    canvas.style.width = `${dims.w}px`;
    canvas.style.height = `${dims.h}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fillMask(ctx);
  };

  const carveInk = (ctx, x, y, r, seed, alpha) => {
    const g = ctx.createRadialGradient(
      x,
      y,
      r * settings.gradientInnerRadius,
      x,
      y,
      r
    );

    g.addColorStop(0, `rgba(0,0,0,${settings.gradientStops[0] * alpha})`);
    g.addColorStop(0.5, `rgba(0,0,0,${settings.gradientStops[1] * alpha})`);
    g.addColorStop(1, `rgba(0,0,0,${settings.gradientStops[2] * alpha})`);
    ctx.fillStyle = g;

    ctx.beginPath();
    for (let i = 0; i <= settings.segments; i++) {
      const a = (i / settings.segments) * Math.PI * 2;
      const wob =
        0.78 +
        settings.wobble[0] * Math.sin(a * 3 + seed) +
        settings.wobble[1] * Math.sin(a * 5 + seed * 2.1) +
        settings.wobble[2] * Math.sin(a * 7 + seed * 0.7);
      const px = x + Math.cos(a) * r * wob;
      const py = y + Math.sin(a) * r * wob;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  };

  const addStamp = (x, y) => {
    if (stamps.length >= settings.maxStamps) stamps.shift();
    stamps.push({
      x,
      y,
      born: performance.now(),
      seed: Math.random() * Math.PI * 2,
      rmax:
        settings.brushSize *
        (1 - settings.rVary + Math.random() * settings.rVary),
    });
  };

  const stampAlong = (x, y) => {
    if (!lastPos) {
      addStamp(x, y);
    } else {
      const dx = x - lastPos.x;
      const dy = y - lastPos.y;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(1, Math.ceil(dist / settings.stampStep));

      for (let i = 1; i <= steps; i++) {
        addStamp(lastPos.x + (dx * i) / steps, lastPos.y + (dy * i) / steps);
      }
    }
    lastPos = { x, y };
  };

  const loop = () => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const now = performance.now();
    fillMask(ctx);
    ctx.globalCompositeOperation = 'destination-out';

    for (let i = stamps.length - 1; i >= 0; i--) {
      const t = (now - stamps[i].born) / settings.lifetime;
      if (t >= 1) {
        stamps.splice(i, 1);
        continue;
      }

      const ease = 1 - Math.pow(1 - t, 3);
      const r = settings.rStart + (stamps[i].rmax - settings.rStart) * ease;
      const alpha = 1 - t * t;
      carveInk(ctx, stamps[i].x, stamps[i].y, r, stamps[i].seed, alpha);
    }

    if (stamps.length) {
      requestAnimationFrame(loop);
    } else {
      running = false;
    }
  };

  const startLoop = () => {
    if (!running) {
      running = true;
      requestAnimationFrame(loop);
    }
  };

  const getRelativePos = (event) => {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  window.addEventListener('mousemove', (event) => {
    const pos = getRelativePos(event);
    stampAlong(pos.x, pos.y);
    startLoop();
  });

  window.addEventListener('mouseout', (event) => {
    if (!event.relatedTarget) {
      lastPos = null;
    }
  });

  window.addEventListener('blur', () => {
    lastPos = null;
  });

  window.addEventListener('resize', resize);
  resize();
}
