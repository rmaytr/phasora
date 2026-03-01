import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useState, useEffect, useRef, useCallback } from "react";

// ─── KATEX ────────────────────────────────────────────────────────────────────
const Katex = ({ tex, display = false, style = {} }) => {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(tex, ref.current, { displayMode: display, throwOnError: false })
      } catch (e) {
        if (ref.current) ref.current.textContent = tex
      }
    }
  }, [tex, display])
  return <span ref={ref} style={style} />
}

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  bg0:        "#f0f4f8",
  bg1:        "#ffffff",
  bg2:        "#f4f7fc",
  bg3:        "#e8eef8",
  border:     "#d0d9ea",
  border2:    "#b8c8e0",
  blue:       "#1d4ed8",
  blueDim:    "#3b82f6",
  blueLight:  "#eff6ff",
  blueGlow:   "rgba(29,78,216,0.07)",
  navy:       "#0f2151",
  teal:       "#0e7490",
  tealLight:  "#ecfeff",
  green:      "#16a34a",
  greenLight: "#f0fdf4",
  red:        "#dc2626",
  redLight:   "#fef2f2",
  text0:      "#0f172a",
  text1:      "#334155",
  text2:      "#64748b",
  text3:      "#94a3b8",
  mono:       "'JetBrains Mono', monospace",
  serif:      "'Lora', Georgia, serif",
  sans:       "'Inter', system-ui, sans-serif",
};

// ─── API KEY (configured via .env.local — not exposed in UI) ──────────────────
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || "";

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Lora:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@300;400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    html, body, #root { height: 100%; width: 100%; }

    body {
      background: ${T.bg0};
      color: ${T.text0};
      font-family: ${T.sans};
      font-size: 14px;
      line-height: 1.6;
      overflow: hidden;
    }

    ::-webkit-scrollbar { width: 5px; height: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 6px; }
    ::-webkit-scrollbar-thumb:hover { background: ${T.border2}; }

    button { cursor: pointer; border: none; background: none; font-family: inherit; }
    input, textarea { font-family: inherit; }

    .fadeIn { animation: fadeIn 0.25s ease forwards; }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(5px); }
      to   { opacity: 1; transform: none; }
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(16px); }
      to   { opacity: 1; transform: none; }
    }
    @keyframes drawerIn {
      from { transform: translateX(100%); }
      to   { transform: translateX(0); }
    }
    @keyframes slideInFromLeft {
      from { transform: translateX(-100%); }
      to   { transform: translateX(0); }
    }
    @keyframes slideOutToLeft {
      from { transform: translateX(0); }
      to   { transform: translateX(-100%); }
    }

    canvas { display: block; }
    .katex { font-size: 1em; }
    .katex-display { margin: 0.4em 0; }

    .label {
      font-family: ${T.sans};
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.07em;
      text-transform: uppercase;
      color: ${T.text2};
    }
  `}</style>
);

// ─── CURRICULUM DATA ──────────────────────────────────────────────────────────
const CURRICULUM = [
  {
    id: "kinematics", label: "Kinematics", active: true,
    concepts: [
      { id: "motion1d",   label: "1D Motion & Displacement" },
      { id: "projectile", label: "Projectile Motion",        hasViz: true },
      { id: "velocity",   label: "Velocity & Acceleration"  },
    ]
  },
  {
    id: "dynamics", label: "Dynamics", active: true,
    concepts: [
      { id: "newton1",  label: "Newton's Laws"           },
      { id: "friction", label: "Friction & Normal Force"  },
      { id: "sho",      label: "Simple Harmonic Motion",  hasViz: true },
    ]
  },
  { id: "energy",   label: "Energy & Work",        active: false, concepts: [] },
  { id: "rotation", label: "Rotational Motion",    active: false, concepts: [] },
  { id: "waves",    label: "Waves & Oscillations", active: false, concepts: [] },
  { id: "em",       label: "Electromagnetism",     active: false, concepts: [] },
];

// ─── CONCEPT TEXT ─────────────────────────────────────────────────────────────
const CONCEPT_TEXT = {
  motion1d: {
    title: "1D Motion & Displacement",
    summary: "Displacement is a vector quantity — it's not how far you traveled, but where you ended up relative to where you started. An object can travel 100 m and have zero displacement.",
    equations: [
      { tex: "\\Delta x = x_f - x_i",                    label: "Displacement" },
      { tex: "\\bar{v} = \\frac{\\Delta x}{\\Delta t}",  label: "Average velocity" },
      { tex: "v(t) = \\frac{dx}{dt}",                     label: "Instantaneous velocity" },
    ],
  },
  projectile: {
    title: "Projectile Motion",
    summary: "Horizontal and vertical motion are completely independent. Gravity acts only vertically. This superposition principle is the entire secret of projectile motion.",
    equations: [
      { tex: "x(t) = v_0 \\cos\\theta \\cdot t",                        label: "Horizontal (constant)" },
      { tex: "y(t) = v_0 \\sin\\theta \\cdot t - \\tfrac{1}{2}g t^2", label: "Vertical" },
      { tex: "R = \\frac{v_0^2 \\sin 2\\theta}{g}",                     label: "Range — max at 45°" },
    ],
  },
  velocity: {
    title: "Velocity & Acceleration",
    summary: "Velocity tells you speed AND direction. Acceleration is any change in velocity — including direction changes at constant speed.",
    equations: [
      { tex: "a(t) = \\frac{dv}{dt} = \\frac{d^2 x}{dt^2}", label: "Acceleration" },
      { tex: "v = v_0 + at",                                  label: "Constant acceleration" },
      { tex: "x = x_0 + v_0 t + \\tfrac{1}{2}at^2",          label: "Position" },
    ],
  },
  newton1: {
    title: "Newton's Laws",
    summary: "Newton's 2nd law is a vector equation. Forces add as vectors. Always draw a free-body diagram and decompose forces into components before solving.",
    equations: [
      { tex: "\\sum \\vec{F} = m\\vec{a}",      label: "Newton's 2nd Law" },
      { tex: "\\vec{F}_{12} = -\\vec{F}_{21}", label: "Newton's 3rd Law" },
    ],
  },
  friction: {
    title: "Friction & Normal Force",
    summary: "Normal force is perpendicular to the contact surface. Friction is parallel, opposing relative motion. Static friction adjusts to prevent motion up to its maximum.",
    equations: [
      { tex: "f_s \\leq \\mu_s N", label: "Static friction (adjusts)" },
      { tex: "f_k = \\mu_k N",     label: "Kinetic friction (constant)" },
    ],
  },
  sho: {
    title: "Simple Harmonic Motion",
    summary: "Any system with a restoring force proportional to displacement oscillates harmonically. Springs, pendulums, LC circuits — same equation, different variables.",
    equations: [
      { tex: "F = -kx",                          label: "Hooke's Law (restoring force)" },
      { tex: "x(t) = A\\cos(\\omega t + \\phi)", label: "General solution" },
      { tex: "T = 2\\pi\\sqrt{\\frac{m}{k}}",    label: "Period — independent of amplitude" },
    ],
  },
};

// ─── FORMULA CARDS DATA ───────────────────────────────────────────────────────
const FORMULAS = [
  {
    id: "f1", label: "Kinematic Equations",
    display: "v = v_0 + at",
    what: "Final velocity after constant acceleration over time.",
    real: "A car accelerating from rest at 3 m/s² for 5 seconds reaches 15 m/s (54 km/h). This equation is the complete story — no calculus needed when acceleration is constant.",
    vars: [
      { tex: "v",   meaning: "final velocity (m/s)" },
      { tex: "v_0", meaning: "initial velocity (m/s)" },
      { tex: "a",   meaning: "acceleration (m/s²) — must be constant" },
      { tex: "t",   meaning: "elapsed time (s)" },
    ],
    group: [
      { tex: "v = v_0 + at",                        label: "" },
      { tex: "x = x_0 + v_0 t + \\tfrac{1}{2}at^2", label: "" },
      { tex: "v^2 = v_0^2 + 2a\\Delta x",            label: "" },
    ]
  },
  {
    id: "f2", label: "Newton's 2nd Law",
    display: "\\vec{F}_{\\text{net}} = m\\vec{a}",
    what: "Net force required to give a mass a particular acceleration.",
    real: "To accelerate a 1000 kg car at 2 m/s², the engine must produce 2000 N net force after friction. This single vector equation is the engine of all classical mechanics.",
    vars: [
      { tex: "\\vec{F}_{\\text{net}}", meaning: "sum of all forces (N)" },
      { tex: "m",                      meaning: "mass (kg) — inertia" },
      { tex: "\\vec{a}",               meaning: "resulting acceleration (m/s²)" },
    ],
    group: [
      { tex: "\\sum \\vec{F} = m\\vec{a}",     label: "Vector form" },
      { tex: "F_x = ma_x,\\quad F_y = ma_y", label: "Component form" },
    ]
  },
  {
    id: "f3", label: "Hooke's Law",
    display: "F = -kx",
    what: "The restoring force a spring exerts when displaced from equilibrium.",
    real: "The negative sign is everything — force opposes displacement. Stretch the spring right, it pulls left. This opposition creates oscillation. Without the minus sign, the spring would explode.",
    vars: [
      { tex: "F", meaning: "restoring force (N)" },
      { tex: "k", meaning: "spring constant (N/m) — stiffness" },
      { tex: "x", meaning: "displacement from equilibrium (m)" },
    ],
    group: [
      { tex: "F = -kx",               label: "Hooke's Law" },
      { tex: "U = \\tfrac{1}{2}kx^2", label: "Elastic potential energy" },
    ]
  },
  {
    id: "f4", label: "SHM Period",
    display: "T = 2\\pi\\sqrt{\\dfrac{m}{k}}",
    what: "Time for one complete oscillation of a spring-mass system.",
    real: "A heavier mass oscillates slower. A stiffer spring oscillates faster. But the amplitude doesn't appear in this equation at all — a 1 cm oscillation and a 10 cm oscillation have exactly the same period.",
    vars: [
      { tex: "T", meaning: "period (s) — time for one full cycle" },
      { tex: "m", meaning: "mass (kg)" },
      { tex: "k", meaning: "spring constant (N/m)" },
    ],
    group: [
      { tex: "T = 2\\pi\\sqrt{\\frac{m}{k}}",  label: "Spring-mass" },
      { tex: "\\omega = \\sqrt{\\frac{k}{m}}", label: "Angular frequency" },
      { tex: "f = \\frac{1}{T}",               label: "Frequency" },
    ]
  },
];

// ─── FORMULA → CONCEPT MAPPING ────────────────────────────────────────────────
const CONCEPT_FORMULA_IDS = {
  motion1d:   ["f1"],
  projectile: ["f1"],
  velocity:   ["f1"],
  newton1:    ["f2"],
  friction:   ["f2"],
  sho:        ["f3", "f4"],
};

// ─── SPRING-MASS SIMULATION ───────────────────────────────────────────────────
const SHOSim = () => {
  const canvasRef = useRef(null);
  const stateRef = useRef({ t: 0, running: true });
  const animRef  = useRef(null);
  const [params, setParams] = useState({ mass: 1.0, k: 8.0, damping: 0.1, amplitude: 80 });
  const [readouts, setReadouts] = useState({ x: "0.000", v: "0.000", ke: "0.00", pe: "0.00" });

  const omega  = Math.sqrt(params.k / params.mass);
  const period = (2 * Math.PI / omega).toFixed(2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const cx = W * 0.52, cy = H * 0.44;

    const draw = () => {
      const s = stateRef.current;
      if (s.running) s.t += 0.016;

      const { damping: gamma, amplitude: A, mass: m, k } = params;
      const decay = Math.exp(-gamma * s.t);
      const x     = A * decay * Math.cos(omega * s.t);
      const v_val = A * decay * (-gamma * Math.cos(omega * s.t) - omega * Math.sin(omega * s.t));
      const ke    = 0.5 * m * v_val * v_val;
      const pe    = 0.5 * k * (x / 100) ** 2 * 10000;

      setReadouts({
        x:  (x / 100).toFixed(3),
        v:  (v_val / 100).toFixed(3),
        ke: ke.toFixed(2),
        pe: pe.toFixed(2),
      });

      ctx.fillStyle = T.bg2;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = T.border;
      ctx.lineWidth = 0.5;
      for (let gx = 0; gx < W; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
      }
      for (let gy = 0; gy < H; gy += 40) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }

      const maxE = 0.5 * k * (A / 100) ** 2 * 10000 || 1;
      const barX = 18, barW = 150, barH = 12;
      ctx.fillStyle = T.bg3;
      ctx.fillRect(barX, H - 52, barW, barH);
      ctx.fillStyle = T.blue;
      ctx.fillRect(barX, H - 52, Math.min(ke / maxE, 1) * barW, barH);
      ctx.fillStyle = T.bg3;
      ctx.fillRect(barX, H - 34, barW, barH);
      ctx.fillStyle = T.teal;
      ctx.fillRect(barX, H - 34, Math.min(pe / maxE, 1) * barW, barH);

      ctx.font = `9px ${T.mono}`;
      ctx.fillStyle = T.text2;
      ctx.fillText("KE", barX + barW + 6, H - 43);
      ctx.fillText("PE", barX + barW + 6, H - 25);

      ctx.fillStyle = T.border2;
      ctx.fillRect(cx - 55, 28, 110, 10);
      ctx.strokeStyle = T.border2;
      ctx.lineWidth = 1;
      for (let hx = cx - 55; hx <= cx + 55; hx += 10) {
        ctx.beginPath(); ctx.moveTo(hx, 28); ctx.lineTo(hx - 8, 20); ctx.stroke();
      }

      const springTop = 38;
      const bobY   = cy + x;
      const springH = bobY - springTop - 22;
      const coils   = 14;
      const coilW   = 14;
      ctx.beginPath();
      ctx.strokeStyle = T.blue;
      ctx.lineWidth = 2;
      ctx.moveTo(cx, springTop);
      for (let i = 0; i <= coils; i++) {
        const fy = springTop + (springH * i) / coils;
        const fx = cx + (i % 2 === 0 ? -coilW : coilW) * (i > 0 && i < coils ? 1 : 0);
        ctx.lineTo(fx, fy);
      }
      ctx.lineTo(cx, bobY - 22);
      ctx.stroke();

      const bobR = 16 + params.mass * 3.5;
      ctx.beginPath();
      ctx.fillStyle = T.blue;
      ctx.globalAlpha = 0.15;
      ctx.arc(cx, bobY, bobR + 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.beginPath();
      ctx.fillStyle = T.blue;
      ctx.arc(cx, bobY, bobR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.arc(cx - bobR * 0.3, bobY - bobR * 0.3, bobR * 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = T.text3;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - 70, cy); ctx.lineTo(cx + 70, cy); ctx.stroke();
      ctx.setLineDash([]);

      if (Math.abs(x) > 8) {
        const arrowX = cx + bobR + 12;
        const dir    = x > 0 ? 1 : -1;
        ctx.strokeStyle = T.red;
        ctx.lineWidth   = 1.5;
        ctx.beginPath(); ctx.moveTo(arrowX, cy); ctx.lineTo(arrowX, bobY); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(arrowX, bobY);
        ctx.lineTo(arrowX - 5, bobY - dir * 10);
        ctx.lineTo(arrowX + 5, bobY - dir * 10);
        ctx.closePath();
        ctx.fillStyle = T.red;
        ctx.fill();
        ctx.font = `9px ${T.mono}`;
        ctx.fillStyle = T.red;
        ctx.fillText("x", arrowX + 7, (cy + bobY) / 2 + 4);
      }

      ctx.globalAlpha = 0.08;
      for (let trail = 1; trail <= 6; trail++) {
        const tt = s.t - trail * 0.05;
        if (tt < 0) continue;
        const decT = Math.exp(-gamma * tt);
        const xt   = A * decT * Math.cos(omega * tt) + cy;
        ctx.beginPath();
        ctx.fillStyle = T.blue;
        ctx.arc(cx, xt, bobR * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      ctx.font = `10px ${T.mono}`;
      ctx.fillStyle = T.text2;
      ctx.fillText(`ω = ${omega.toFixed(2)} rad/s`, W - 130, 24);
      ctx.fillText(`T = ${period} s`,               W - 130, 40);

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [params, omega, period]);

  const reset  = () => { stateRef.current.t = 0; };
  const toggle = () => { stateRef.current.running = !stateRef.current.running; };

  const SliderRow = ({ label, param, min, max, step, unit }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span className="label">{label}</span>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.blue }}>
          {params[param].toFixed(2)} {unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={params[param]}
        onChange={e => { stateRef.current.t = 0; setParams(p => ({ ...p, [param]: parseFloat(e.target.value) })); }}
        style={{ width: "100%", accentColor: T.blue, cursor: "pointer" }}
      />
    </div>
  );

  return (
    <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
      <div style={{ flex: 1 }}>
        <canvas ref={canvasRef} width={340} height={390}
          style={{ width: "100%", height: 390, borderRadius: 6, border: `1px solid ${T.border}` }} />
      </div>
      <div style={{ width: 205 }}>
        <div className="label" style={{ marginBottom: 8 }}>Parameters</div>
        <SliderRow label="Mass"      param="mass"      min={0.2} max={4}   step={0.1}  unit="kg"  />
        <SliderRow label="Spring k"  param="k"         min={1}   max={30}  step={0.5}  unit="N/m" />
        <SliderRow label="Damping"   param="damping"   min={0}   max={0.8} step={0.02} unit=""    />
        <SliderRow label="Amplitude" param="amplitude" min={10}  max={120} step={5}    unit="px"  />

        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          {[["Pause", toggle], ["Reset", reset]].map(([lbl, fn]) => (
            <button key={lbl} onClick={fn} style={{
              flex: 1, padding: "5px 0", borderRadius: 4,
              border: `1px solid ${T.border2}`, background: T.bg1,
              color: T.text1, fontSize: 11, fontWeight: 500,
            }}>{lbl}</button>
          ))}
        </div>

        <div style={{ marginTop: 10, padding: 10, background: T.bg1, borderRadius: 6, border: `1px solid ${T.border}` }}>
          <div className="label" style={{ marginBottom: 6 }}>Live Readout</div>
          {[["x(t)", readouts.x, "m"], ["v(t)", readouts.v, "m/s"], ["KE", readouts.ke, "J"], ["PE", readouts.pe, "J"]].map(([l, v, u]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontFamily: T.mono, fontSize: 10, color: T.text2 }}>{l}</span>
              <span style={{ fontFamily: T.mono, fontSize: 10, color: T.blue }}>
                {v} <span style={{ color: T.text3 }}>{u}</span>
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 8, padding: "10px 12px", background: T.blueLight, borderRadius: 6, border: `1px solid ${T.border2}` }}>
          <div className="label" style={{ marginBottom: 5, color: T.blue }}>Key Insight</div>
          <div style={{ fontSize: 11, color: T.text1, lineHeight: 1.55 }}>
            Period = {period} s regardless of amplitude. Change mass or k and it shifts. Amplitude is irrelevant.
          </div>
          <div style={{ marginTop: 6 }}>
            <Katex tex={`T = 2\\pi\\sqrt{\\frac{m}{k}}`} style={{ fontSize: 13, color: T.blue }} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PROJECTILE SIMULATION ────────────────────────────────────────────────────
const ProjectileSim = () => {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const [params, setParams] = useState({ angle: 45, v0: 20, g: 9.81 });
  const [running, setRunning] = useState(false);
  const [metrics, setMetrics] = useState({ range: "0", maxH: "0", tFlight: "0.00" });
  const tRef = useRef(0);

  const angleRad = params.angle * Math.PI / 180;
  const vx   = params.v0 * Math.cos(angleRad);
  const vy0  = params.v0 * Math.sin(angleRad);
  const tF   = (2 * vy0) / params.g;
  const range = vx * tF;
  const maxH  = (vy0 * vy0) / (2 * params.g);

  useEffect(() => {
    setMetrics({ range: range.toFixed(1), maxH: maxH.toFixed(1), tFlight: tF.toFixed(2) });
  }, [params]);

  const drawFrame = useCallback((ctx, W, H, progress = 1) => {
    const groundY = H - 48;
    const scale   = Math.min((W - 90) / Math.max(range, 1), (groundY - 60) / Math.max(maxH, 1)) * 0.82;
    const originX = 52;

    ctx.fillStyle = T.bg2;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = T.border;
    ctx.lineWidth = 0.5;
    for (let gy = groundY; gy > 40; gy -= 40) {
      ctx.beginPath(); ctx.moveTo(42, gy); ctx.lineTo(W - 16, gy); ctx.stroke();
    }
    for (let gx = originX; gx < W - 16; gx += 50) {
      ctx.beginPath(); ctx.moveTo(gx, 40); ctx.lineTo(gx, groundY); ctx.stroke();
    }

    ctx.strokeStyle = T.border2;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(originX, 30); ctx.lineTo(originX, groundY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(originX, groundY); ctx.lineTo(W - 14, groundY); ctx.stroke();

    ctx.fillStyle = T.bg3;
    ctx.fillRect(0, groundY, W, H - groundY);

    const tEnd  = tF * progress;
    const steps = 150;
    ctx.beginPath();
    ctx.strokeStyle = T.blueDim;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    for (let i = 0; i <= steps; i++) {
      const tt = (tEnd * i) / steps;
      const px = originX + vx * tt * scale;
      const py = groundY - (vy0 * tt - 0.5 * params.g * tt * tt) * scale;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    const ballX  = originX + vx * tEnd * scale;
    const ballY  = groundY - (vy0 * tEnd - 0.5 * params.g * tEnd * tEnd) * scale;
    const vxNow  = vx;
    const vyNow  = vy0 - params.g * tEnd;
    const vScale = 2.8;

    ctx.strokeStyle = T.teal;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(ballX, ballY); ctx.lineTo(ballX + vxNow * vScale, ballY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ballX, ballY); ctx.lineTo(ballX, ballY - vyNow * vScale); ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = T.blue;
    ctx.lineWidth   = 2;
    ctx.beginPath(); ctx.moveTo(ballX, ballY); ctx.lineTo(ballX + vxNow * vScale, ballY - vyNow * vScale); ctx.stroke();
    const ang = Math.atan2(-vyNow, vxNow);
    const aLen = 7;
    ctx.beginPath();
    ctx.moveTo(ballX + vxNow * vScale, ballY - vyNow * vScale);
    ctx.lineTo(
      ballX + vxNow * vScale - aLen * Math.cos(ang - 0.4),
      ballY - vyNow * vScale + aLen * Math.sin(ang - 0.4)
    );
    ctx.lineTo(
      ballX + vxNow * vScale - aLen * Math.cos(ang + 0.4),
      ballY - vyNow * vScale + aLen * Math.sin(ang + 0.4)
    );
    ctx.closePath();
    ctx.fillStyle = T.blue;
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = "rgba(29,78,216,0.12)";
    ctx.arc(ballX, ballY, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = T.blue;
    ctx.arc(ballX, ballY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    if (progress > 0.48) {
      const peakT = vy0 / params.g;
      const peakX = originX + vx * peakT * scale;
      const peakY = groundY - maxH * scale;
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = T.green;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(originX, peakY); ctx.lineTo(peakX, peakY); ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = `9px ${T.mono}`;
      ctx.fillStyle = T.green;
      ctx.fillText(`H = ${maxH.toFixed(1)} m`, originX + 4, peakY - 4);
    }

    if (progress >= 0.99) {
      const landX = originX + range * scale;
      ctx.strokeStyle = T.red;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(landX, groundY - 6); ctx.lineTo(landX, groundY + 6); ctx.stroke();
      ctx.font = `9px ${T.mono}`;
      ctx.fillStyle = T.red;
      ctx.fillText(`R = ${range.toFixed(1)} m`, landX - 28, groundY + 16);
    }

    ctx.strokeStyle = T.blueDim;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(originX, groundY, 32, -angleRad, 0, true);
    ctx.stroke();
    ctx.font = `9px ${T.mono}`;
    ctx.fillStyle = T.text2;
    ctx.fillText(`${params.angle}°`, originX + 20, groundY - 12);

    ctx.font = `9px ${T.mono}`;
    ctx.fillStyle = T.text3;
    ctx.fillText("x (m)", W - 28, groundY + 14);
    ctx.fillText("y (m)", 8, 44);
  }, [params, vx, vy0, tF, range, maxH, angleRad]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!running) { drawFrame(ctx, canvas.width, canvas.height, 0); return; }
    tRef.current = 0;
    const animate = () => {
      tRef.current += 0.013;
      const p = Math.min(tRef.current, 1);
      drawFrame(ctx, canvas.width, canvas.height, p);
      if (p < 1) animRef.current = requestAnimationFrame(animate);
      else setRunning(false);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [running, drawFrame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawFrame(canvas.getContext("2d"), canvas.width, canvas.height, 0);
  }, [params, drawFrame]);

  const SliderRow = ({ label, param, min, max, step, unit }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span className="label">{label}</span>
        <span style={{ fontFamily: T.mono, fontSize: 11, color: T.blue }}>
          {params[param].toFixed(param === "g" ? 2 : 0)} {unit}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={params[param]}
        onChange={e => { setRunning(false); setParams(p => ({ ...p, [param]: parseFloat(e.target.value) })); }}
        style={{ width: "100%", accentColor: T.blue }}
      />
    </div>
  );

  return (
    <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
      <div style={{ flex: 1 }}>
        <canvas ref={canvasRef} width={390} height={320}
          style={{ width: "100%", height: 320, borderRadius: 6, border: `1px solid ${T.border}` }} />
      </div>
      <div style={{ width: 205 }}>
        <div className="label" style={{ marginBottom: 8 }}>Parameters</div>
        <SliderRow label="Launch Angle" param="angle" min={5}   max={85}   step={1}   unit="°"    />
        <SliderRow label="Init. Speed"  param="v0"    min={5}   max={50}   step={1}   unit="m/s"  />
        <SliderRow label="Gravity"      param="g"     min={1.6} max={24.8} step={0.1} unit="m/s²" />

        <button onClick={() => setRunning(true)} style={{
          width: "100%", padding: "7px 0", marginTop: 6, borderRadius: 4,
          border: `1px solid ${T.blue}`, background: T.blueGlow,
          color: T.blue, fontSize: 11, fontWeight: 500,
        }}>▶ Launch</button>

        <div style={{ marginTop: 10, padding: 10, background: T.bg1, borderRadius: 6, border: `1px solid ${T.border}` }}>
          <div className="label" style={{ marginBottom: 6 }}>Computed</div>
          {[["Range", metrics.range, "m"], ["Max Height", metrics.maxH, "m"],
            ["Flight Time", metrics.tFlight, "s"], ["vₓ", vx.toFixed(2), "m/s"], ["v_y₀", vy0.toFixed(2), "m/s"]
          ].map(([l, v, u]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
              <span style={{ fontFamily: T.mono, fontSize: 10, color: T.text2 }}>{l}</span>
              <span style={{ fontFamily: T.mono, fontSize: 10, color: T.blue }}>
                {v} <span style={{ color: T.text3 }}>{u}</span>
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 8, padding: "10px 12px", background: T.blueLight, borderRadius: 6, border: `1px solid ${T.border2}` }}>
          <div className="label" style={{ marginBottom: 5, color: T.blue }}>Key Insight</div>
          <div style={{ fontSize: 11, color: T.text1, lineHeight: 1.55, marginBottom: 6 }}>
            x and y are independent. Try Moon gravity (1.62 m/s²) — same formula, different physics.
          </div>
          <Katex tex={`R = \\frac{v_0^2 \\sin 2\\theta}{g}`} style={{ fontSize: 13 }} />
        </div>
      </div>
    </div>
  );
};

// ─── FORMULA CARD ─────────────────────────────────────────────────────────────
const FormulaCard = ({ formula }) => {
  const [open, setOpen] = useState(false);

  return (
    <div onClick={() => setOpen(o => !o)} style={{
      background: open ? T.bg1 : T.bg2,
      border: `1px solid ${open ? T.blueDim : T.border}`,
      borderRadius: 8, padding: "14px 16px", cursor: "pointer",
      transition: "all 0.2s ease", marginBottom: 10,
      boxShadow: open ? `0 2px 12px rgba(29,78,216,0.07)` : "none",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div className="label">{formula.label}</div>
          <div style={{ marginTop: 6 }}>
            <Katex tex={formula.display} display={false} style={{ fontSize: 20, color: T.blue }} />
          </div>
        </div>
        <div style={{ fontSize: 11, color: T.text3, fontWeight: 500 }}>
          {open ? "▲ Close" : "▼ Explore"}
        </div>
      </div>

      {open && (
        <div className="fadeIn" style={{ marginTop: 14, borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
          <div style={{ marginBottom: 10 }}>
            <div className="label" style={{ marginBottom: 4 }}>What it says</div>
            <div style={{ color: T.text0, fontSize: 13, lineHeight: 1.65 }}>{formula.what}</div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <div className="label" style={{ marginBottom: 6 }}>Equations</div>
            <div style={{ background: T.blueLight, borderRadius: 6, padding: "10px 14px", border: `1px solid ${T.border}` }}>
              {formula.group.map((eq, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < formula.group.length - 1 ? 8 : 0 }}>
                  <Katex tex={eq.tex} display={false} style={{ fontSize: 15, color: T.navy }} />
                  {eq.label && <span style={{ fontSize: 10, color: T.text3 }}>{eq.label}</span>}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <div className="label" style={{ marginBottom: 4 }}>Real world</div>
            <div style={{ color: T.text1, fontSize: 12, lineHeight: 1.65, fontStyle: "italic" }}>{formula.real}</div>
          </div>

          <div>
            <div className="label" style={{ marginBottom: 6 }}>Variables</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {formula.vars.map((v, i) => (
                <div key={i} style={{
                  padding: "5px 10px", background: T.bg0,
                  border: `1px solid ${T.border}`, borderRadius: 4,
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <Katex tex={v.tex} style={{ fontSize: 13, color: T.blue }} />
                  <span style={{ fontSize: 11, color: T.text2 }}>{v.meaning}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PROBLEMS TAB ─────────────────────────────────────────────────────────────
const ProblemsTab = ({ apiKey }) => {
  const [topic,      setTopic]      = useState("projectile");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [problem,    setProblem]    = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [showSol,    setShowSol]    = useState(false);

  const generate = async () => {
    if (!apiKey) { setProblem({ noKey: true }); return; }
    setLoading(true); setProblem(null); setShowSol(false);

    const topicMap = {
      projectile: "projectile motion",
      sho:        "simple harmonic motion (spring-mass system)",
      newton:     "Newton's laws and force analysis",
      kinematics: "1D kinematics with constant acceleration",
    };
    const diffMap = {
      intro:        "introductory — single concept, one or two steps",
      intermediate: "intermediate — requires full setup and 2–3 steps",
      advanced:     "advanced — multi-part, careful analysis required",
    };

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 900,
          messages: [{
            role: "user",
            content: `Generate a physics problem on: ${topicMap[topic]}. Difficulty: ${diffMap[difficulty]}.

Return ONLY valid JSON (no markdown, no backticks) in this exact structure:
{
  "problem": "Full problem statement with all given values",
  "given": ["quantity = value unit", ...],
  "find": "what to solve for",
  "hint": "one concise hint, no solution given",
  "solution": "Step-by-step solution. Write all equations in LaTeX notation wrapped in $ signs."
}`
          }]
        })
      });
      const data = await res.json();
      const text = data.content[0].text.replace(/```json|```/g, "").trim();
      setProblem(JSON.parse(text));
    } catch {
      setProblem({ error: true });
    }
    setLoading(false);
  };

  const chip = (active) => ({
    padding: "4px 12px", borderRadius: 4, fontSize: 12, fontWeight: 500,
    cursor: "pointer", transition: "all 0.15s",
    border: `1px solid ${active ? T.blue : T.border}`,
    background: active ? T.blueGlow : T.bg1,
    color: active ? T.blue : T.text1,
  });

  const renderWithLatex = (text) => {
    if (!text) return null;
    const parts = text.split(/(\$[^$]+\$)/g);
    return parts.map((part, i) => {
      if (part.startsWith("$") && part.endsWith("$")) {
        return <Katex key={i} tex={part.slice(1, -1)} />;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 20, alignItems: "flex-end", flexWrap: "wrap" }}>
        <div>
          <div className="label" style={{ marginBottom: 6 }}>Topic</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[["projectile","Projectile"],["sho","SHM"],["newton","Newton's Laws"],["kinematics","Kinematics"]].map(([v,l]) => (
              <button key={v} style={chip(topic===v)} onClick={() => setTopic(v)}>{l}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="label" style={{ marginBottom: 6 }}>Difficulty</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[["intro","Intro"],["intermediate","Mid"],["advanced","Advanced"]].map(([v,l]) => (
              <button key={v} style={chip(difficulty===v)} onClick={() => setDifficulty(v)}>{l}</button>
            ))}
          </div>
        </div>
        <button onClick={generate} disabled={loading} style={{
          padding: "6px 20px", borderRadius: 4, border: `1px solid ${T.blue}`,
          background: T.blue, color: "#fff", fontSize: 12, fontWeight: 500,
          cursor: "pointer", opacity: loading ? 0.6 : 1,
        }}>{loading ? "Generating…" : "Generate ▶"}</button>
      </div>

      {problem?.noKey && (
        <div style={{ padding: 14, background: T.bg2, borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 13, color: T.text1 }}>
          AI features are not configured. Set <code>VITE_ANTHROPIC_API_KEY</code> in your <code>.env.local</code> file.
        </div>
      )}
      {problem?.error && (
        <div style={{ padding: 14, background: T.redLight, borderRadius: 8, border: `1px solid ${T.red}`, fontSize: 13, color: T.red }}>
          Generation failed — check your API key configuration.
        </div>
      )}

      {problem && !problem.noKey && !problem.error && (
        <div className="fadeIn">
          <div style={{ padding: 18, background: T.bg1, borderRadius: 10, border: `1px solid ${T.border}`, marginBottom: 12,
            boxShadow: "0 1px 8px rgba(29,78,216,0.06)" }}>
            <div className="label" style={{ marginBottom: 8 }}>Problem</div>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: T.text0, marginBottom: 14 }}>
              {renderWithLatex(problem.problem)}
            </div>

            {problem.given?.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div className="label" style={{ marginBottom: 6 }}>Given</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {problem.given.map((g, i) => (
                    <span key={i} style={{
                      padding: "3px 10px", background: T.blueLight,
                      border: `1px solid ${T.border2}`, borderRadius: 4,
                      fontSize: 12, color: T.blue,
                    }}>{renderWithLatex(g)}</span>
                  ))}
                </div>
              </div>
            )}

            {problem.find && (
              <div style={{ marginBottom: 12 }}>
                <div className="label" style={{ marginBottom: 4 }}>Find</div>
                <div style={{ fontSize: 13, color: T.navy }}>{renderWithLatex(problem.find)}</div>
              </div>
            )}

            {problem.hint && (
              <div style={{ padding: "8px 12px", background: T.bg2, borderRadius: 4, border: `1px solid ${T.border}` }}>
                <span className="label">Hint — </span>
                <span style={{ fontSize: 12, color: T.text2, fontStyle: "italic" }}>{problem.hint}</span>
              </div>
            )}
          </div>

          <button onClick={() => setShowSol(s => !s)} style={{
            padding: "7px 18px", borderRadius: 4, border: `1px solid ${T.teal}`,
            background: T.tealLight, color: T.teal, fontSize: 12, fontWeight: 500, cursor: "pointer",
          }}>{showSol ? "▲ Hide Solution" : "▼ Show Solution"}</button>

          {showSol && problem.solution && (
            <div className="fadeIn" style={{ marginTop: 12, padding: 18, background: T.bg1, borderRadius: 10,
              border: `1px solid ${T.teal}`, boxShadow: "0 1px 8px rgba(14,116,144,0.06)" }}>
              <div className="label" style={{ marginBottom: 8, color: T.teal }}>Solution</div>
              <div style={{ fontSize: 13, lineHeight: 1.85, color: T.text1, whiteSpace: "pre-wrap" }}>
                {renderWithLatex(problem.solution)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── AI TUTOR ─────────────────────────────────────────────────────────────────
const TUTOR_SYSTEM = `You are Phasora, a physics tutor. Your personality: brilliant but approachable — you explain physics the way a great professor would explain it to a curious friend.

Rules:
1. Physical intuition first, math second.
2. Use simple analogies freely.
3. Keep responses focused (3–6 sentences for most questions). Go longer only for full derivations.
4. Write all equations in LaTeX notation wrapped in $ signs: e.g. $F = ma$, $v = v_0 + at$.
5. End difficult explanations with: "In short: ..."
6. If confused, offer a simpler analogy.

Current domain: Classical Mechanics.`;

const TutorPanel = ({ apiKey }) => {
  const [msgs,    setMsgs]    = useState([{
    role: "assistant",
    text: "I'm Phasora. Ask me anything about the physics you're exploring — or say 'explain like I'm 5' for any concept.",
  }]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const renderMsg = (text) => {
    const parts = text.split(/(\$[^$]+\$)/g);
    return parts.map((part, i) => {
      if (part.startsWith("$") && part.endsWith("$")) {
        return <Katex key={i} tex={part.slice(1, -1)} />;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMsgs(m => [...m, { role: "user", text: userMsg }]);
    setLoading(true);

    if (!apiKey) {
      setMsgs(m => [...m, { role: "assistant", text: "AI features are not configured — no API key found." }]);
      setLoading(false); return;
    }

    try {
      const history = msgs.map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.text }));
      history.push({ role: "user", content: userMsg });

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 600, system: TUTOR_SYSTEM, messages: history })
      });
      const data = await res.json();
      setMsgs(m => [...m, { role: "assistant", text: data.content?.[0]?.text || "Something went wrong." }]);
    } catch {
      setMsgs(m => [...m, { role: "assistant", text: "API error — please try again." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 8 }}>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 2 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            padding: "9px 11px", borderRadius: 8, fontSize: 13, lineHeight: 1.65,
            background: m.role === "user" ? T.blueGlow : T.bg2,
            border: `1px solid ${m.role === "user" ? T.border2 : T.border}`,
            color: m.role === "user" ? T.blue : T.text1,
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "94%",
          }}>
            {m.role === "assistant" && (
              <div style={{ fontFamily: T.mono, fontSize: 9, color: T.text3, marginBottom: 4, letterSpacing: "0.1em" }}>PHASORA</div>
            )}
            {renderMsg(m.text)}
          </div>
        ))}
        {loading && (
          <div style={{ padding: "8px 11px", background: T.bg2, border: `1px solid ${T.border}`,
            borderRadius: 8, fontSize: 12, color: T.text3 }}>
            thinking…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: 6 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask anything about physics…"
          style={{
            flex: 1, padding: "8px 10px", background: T.bg2,
            border: `1px solid ${T.border2}`, borderRadius: 6,
            color: T.text0, fontSize: 13, outline: "none",
          }}
        />
        <button onClick={send} style={{
          padding: "8px 16px", background: T.blue, borderRadius: 6,
          color: "#fff", fontSize: 12, fontWeight: 500,
        }}>Ask</button>
      </div>
    </div>
  );
};

// ─── CONCEPT VIEW ─────────────────────────────────────────────────────────────
const ConceptView = ({ conceptId, compact }) => {
  const c = CONCEPT_TEXT[conceptId];

  if (!c) return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: T.text3, fontSize: 14 }}>
      Select a topic from the left panel.
    </div>
  );

  return (
    <div key={conceptId} className="fadeIn" style={{
      padding: compact ? "32px 28px 32px 32px" : "56px 80px",
      transition: "padding 0.35s ease",
    }}>
      <div style={{
        fontSize: 10, fontWeight: 600, color: T.blue,
        letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12,
      }}>
        Classical Mechanics
      </div>

      <h1 style={{
        fontFamily: T.serif, fontStyle: "italic",
        fontSize: compact ? 22 : 30, color: T.navy,
        lineHeight: 1.25, marginBottom: 16, fontWeight: 400,
      }}>
        {c.title}
      </h1>

      <p style={{
        fontSize: compact ? 13 : 15, color: T.text1,
        lineHeight: 1.85, marginBottom: 28,
        maxWidth: compact ? "100%" : 560,
      }}>
        {c.summary}
      </p>

      <div style={{
        background: T.blueLight, borderRadius: 10,
        padding: "18px 22px", border: `1px solid ${T.border}`,
        maxWidth: compact ? "100%" : 520,
      }}>
        <div style={{
          fontSize: 10, fontWeight: 600, color: T.blue,
          letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14,
        }}>
          Core Equations
        </div>
        {c.equations.map((eq, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 16,
            padding: "10px 0",
            borderBottom: i < c.equations.length - 1 ? `1px solid ${T.border}` : "none",
          }}>
            <div style={{ minWidth: 0 }}>
              <Katex tex={eq.tex} style={{ fontSize: 14, color: T.navy }} />
            </div>
            <span style={{ fontSize: 12, color: T.text3, fontStyle: "italic", flex: 1 }}>
              {eq.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── AI DRAWER ────────────────────────────────────────────────────────────────
const AIDrawer = ({ apiKey, onClose }) => (
  <>
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15,23,42,0.18)",
        backdropFilter: "blur(2px)",
        zIndex: 98,
      }}
    />
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0,
      width: 368, background: T.bg1,
      borderLeft: `1px solid ${T.border}`,
      zIndex: 99, display: "flex", flexDirection: "column",
      animation: "drawerIn 0.28s cubic-bezier(0.4,0,0.2,1)",
      boxShadow: "-6px 0 32px rgba(15,23,42,0.1)",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 16px", borderBottom: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.blue }}>Phasora Tutor</div>
          <div style={{ fontSize: 11, color: T.text3, marginTop: 2 }}>Physics-grounded · Always explains why</div>
        </div>
        <button
          onClick={onClose}
          onMouseEnter={e => e.currentTarget.style.background = T.bg3}
          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          style={{
            width: 30, height: 30, borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: T.text2, fontSize: 20, lineHeight: 1,
            background: "transparent", transition: "background 0.15s",
          }}
        >×</button>
      </div>
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", padding: 14 }}>
        <TutorPanel apiKey={apiKey} />
      </div>
    </div>
  </>
);

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [activeConcept,  setActiveConcept]  = useState("projectile");
  const [expandedGroup,  setExpandedGroup]  = useState("kinematics");
  const [showSim,        setShowSim]        = useState(false);
  const [showFormulas,   setShowFormulas]   = useState(false);
  const [formulaLeaving, setFormulaLeaving] = useState(false);
  const [showAI,         setShowAI]         = useState(false);
  const [mainView,       setMainView]       = useState("learn"); // "learn" | "problems"

  // Right panel opens only for simulation now; formulas are a left overlay
  const panelOpen = showSim && mainView === "learn";
  const vizMode   = activeConcept === "sho" ? "sho" : "projectile";

  const closeFormulas = () => {
    setFormulaLeaving(true);
    setTimeout(() => {
      setShowFormulas(false);
      setFormulaLeaving(false);
    }, 270);
  };

  const toggleSim = () => {
    if (mainView !== "learn") setMainView("learn");
    setShowSim(s => !s);
  };

  const toggleFormulas = () => {
    if (mainView !== "learn") setMainView("learn");
    if (showFormulas) {
      closeFormulas();
    } else {
      setShowFormulas(true);
    }
  };

  // Resolve which formula cards to show for the active concept
  const formulaIds = CONCEPT_FORMULA_IDS[activeConcept] || [];
  const visibleFormulas = formulaIds.length > 0
    ? FORMULAS.filter(f => formulaIds.includes(f.id))
    : FORMULAS;

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", width: "100vw",
      background: T.bg0, overflow: "hidden",
    }}>
      <GlobalStyle />

      {/* ── TOP NAV ── */}
      <nav style={{
        display: "flex", alignItems: "center",
        height: 52, flexShrink: 0,
        background: T.bg1, borderBottom: `1px solid ${T.border}`,
        padding: "0 20px", gap: 12,
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginRight: 20, flexShrink: 0 }}>
          <span style={{ fontFamily: T.mono, fontSize: 15, fontWeight: 500, letterSpacing: "0.18em", color: T.blue }}>
            PHASORA
          </span>
          <span style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: 11, color: T.text3 }}>
            Physics Canvas
          </span>
        </div>

        {/* Center toolbar */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {[
            { label: "Simulation", icon: "⬡", active: showSim && mainView === "learn",     onClick: toggleSim },
            { label: "Formulas",   icon: "∑", active: showFormulas && mainView === "learn", onClick: toggleFormulas },
          ].map(btn => (
            <button key={btn.label} onClick={btn.onClick} style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 14px", borderRadius: 20,
              border: `1px solid ${btn.active ? T.blue : T.border}`,
              background: btn.active ? T.blueGlow : "transparent",
              color: btn.active ? T.blue : T.text2,
              fontSize: 12, fontWeight: 500,
              transition: "all 0.15s ease",
            }}>
              <span>{btn.icon}</span> {btn.label}
            </button>
          ))}

          <div style={{ width: 1, height: 18, background: T.border, margin: "0 2px" }} />

          <button
            onClick={() => setMainView(v => v === "problems" ? "learn" : "problems")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 14px", borderRadius: 20,
              border: `1px solid ${mainView === "problems" ? T.blue : T.border}`,
              background: mainView === "problems" ? T.blueGlow : "transparent",
              color: mainView === "problems" ? T.blue : T.text2,
              fontSize: 12, fontWeight: 500,
              transition: "all 0.15s ease",
            }}
          >
            ◈ Problems
          </button>
        </div>

        <div style={{ flex: 1 }} />

        {/* AI button */}
        <button onClick={() => setShowAI(o => !o)} style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "6px 16px", borderRadius: 20,
          border: `1px solid ${showAI ? T.blue : T.border2}`,
          background: showAI ? T.blue : T.bg2,
          color: showAI ? "#fff" : T.text1,
          fontSize: 12, fontWeight: 500,
          transition: "all 0.15s ease",
          boxShadow: showAI ? "0 2px 10px rgba(29,78,216,0.22)" : "none",
        }}>
          ✦ Ask Phasora
        </button>
      </nav>

      {/* ── MAIN LAYOUT ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT SIDEBAR */}
        <aside style={{
          width: 224, flexShrink: 0,
          background: T.bg1, borderRight: `1px solid ${T.border}`,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <div style={{ padding: "14px 16px 10px", borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: T.text3, letterSpacing: "0.07em", textTransform: "uppercase" }}>
              Classical Mechanics
            </div>
            <div style={{ fontSize: 14, color: T.text0, fontWeight: 500, marginTop: 3 }}>Topics</div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", paddingTop: 4 }}>
            {CURRICULUM.map(group => (
              <div key={group.id}>
                <button
                  onClick={() => group.active && setExpandedGroup(g => g === group.id ? null : group.id)}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: "9px 16px",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    fontSize: 13, fontWeight: 500,
                    color: group.active ? T.text0 : T.text3,
                    background: expandedGroup === group.id && group.active ? T.blueLight : "none",
                    borderLeft: `2px solid ${expandedGroup === group.id && group.active ? T.blue : "transparent"}`,
                    cursor: group.active ? "pointer" : "default",
                    transition: "all 0.15s",
                  }}
                >
                  {group.label}
                  {group.active
                    ? <span style={{ fontSize: 12, color: T.text3 }}>{expandedGroup === group.id ? "▾" : "▸"}</span>
                    : <span style={{ fontSize: 9, color: T.text3, background: T.bg3, padding: "1px 6px", borderRadius: 3 }}>Soon</span>
                  }
                </button>

                {expandedGroup === group.id && group.concepts.map(c => (
                  <button key={c.id}
                    onClick={() => {
                      setActiveConcept(c.id);
                      if (mainView !== "learn") setMainView("learn");
                    }}
                    style={{
                      width: "100%", textAlign: "left",
                      padding: "7px 16px 7px 30px",
                      fontSize: 13,
                      color: activeConcept === c.id ? T.blue : T.text1,
                      background: activeConcept === c.id ? T.blueGlow : "none",
                      borderLeft: `2px solid ${activeConcept === c.id ? T.blue : "transparent"}`,
                      cursor: "pointer",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      transition: "all 0.12s",
                    }}
                  >
                    {c.label}
                    {c.hasViz && (
                      <span style={{
                        fontSize: 9, color: T.teal, background: T.tealLight,
                        padding: "1px 6px", borderRadius: 3, fontWeight: 500,
                      }}>viz</span>
                    )}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </aside>

        {/* FORMULA OVERLAY — slides in from left over the sidebar */}
        {showFormulas && (
          <div style={{
            position: "fixed",
            top: 52,
            left: 0,
            bottom: 0,
            width: 320,
            background: T.bg1,
            borderRight: `1px solid ${T.border}`,
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "4px 0 24px rgba(15,23,42,0.10)",
            animation: formulaLeaving
              ? "slideOutToLeft 0.27s cubic-bezier(0.4,0,0.2,1) forwards"
              : "slideInFromLeft 0.27s cubic-bezier(0.4,0,0.2,1) forwards",
          }}>
            {/* Header */}
            <div style={{
              padding: "14px 16px 10px",
              borderBottom: `1px solid ${T.border}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
              flexShrink: 0,
            }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 600, color: T.text3, letterSpacing: "0.07em", textTransform: "uppercase" }}>
                  Formula Sheet
                </div>
                <div style={{ fontSize: 14, color: T.text0, fontWeight: 500, marginTop: 3 }}>
                  {CONCEPT_TEXT[activeConcept]?.title || "All Formulas"}
                </div>
              </div>
              <button
                onClick={closeFormulas}
                onMouseEnter={e => e.currentTarget.style.background = T.bg3}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                style={{
                  width: 28, height: 28, borderRadius: 6,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: T.text2, fontSize: 18, lineHeight: 1,
                  background: "transparent", transition: "background 0.15s",
                }}
              >×</button>
            </div>

            {/* Formula cards */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 12px" }}>
              {visibleFormulas.length > 0
                ? visibleFormulas.map(f => <FormulaCard key={f.id} formula={f} />)
                : (
                  <div style={{ fontSize: 13, color: T.text3, padding: "20px 4px", textAlign: "center" }}>
                    No formulas for this topic yet.
                  </div>
                )
              }
            </div>
          </div>
        )}

        {/* CENTER — learn or problems */}
        {mainView === "problems" ? (
          <div className="fadeIn" style={{ flex: 1, overflowY: "auto", padding: "40px 48px" }}>
            <div style={{ maxWidth: 720, margin: "0 auto" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.blue, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                Practice
              </div>
              <h1 style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: 28, color: T.navy, marginBottom: 8, fontWeight: 400 }}>
                Practice Problems
              </h1>
              <p style={{ fontSize: 14, color: T.text2, marginBottom: 28, lineHeight: 1.7, maxWidth: 520 }}>
                AI-generated physics problems with step-by-step solutions. Select a topic and difficulty, then generate.
              </p>
              <ProblemsTab apiKey={API_KEY} />
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

            {/* Concept text — width shrinks when simulation panel opens */}
            <div style={{
              flexShrink: 0,
              width: panelOpen ? "40%" : "100%",
              transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)",
              overflowY: "auto", overflowX: "hidden",
              borderRight: panelOpen ? `1px solid ${T.border}` : "none",
            }}>
              <ConceptView conceptId={activeConcept} compact={panelOpen} />
            </div>

            {/* Right panel — simulation only */}
            <div style={{ flex: 1, minWidth: 0, overflowY: "auto", overflowX: "hidden" }}>
              {panelOpen && (
                <div style={{ animation: "slideInRight 0.3s ease", padding: "28px 24px", minWidth: 480 }}>
                  <div style={{
                    fontSize: 10, fontWeight: 600, color: T.text3,
                    letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16,
                  }}>Simulation</div>
                  {vizMode === "sho" ? <SHOSim /> : <ProjectileSim />}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* AI DRAWER */}
      {showAI && (
        <AIDrawer apiKey={API_KEY} onClose={() => setShowAI(false)} />
      )}
    </div>
  );
}
