import katex from 'katex'
import 'katex/dist/katex.min.css'
import { useState, useEffect, useRef, useCallback, Fragment } from "react";

// ─── KATEX ────────────────────────────────────────────────────────────────────
const Katex = ({ tex, display = false, style = {} }) => {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(tex, ref.current, { displayMode: display, throwOnError: false })
      } catch {
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
  brandMono:  "'IBM Plex Mono', monospace",
  brandSerif: "'Libre Baskerville', Georgia, serif",
  cardSans:   "'DM Sans', 'Inter', system-ui, sans-serif",
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// ─── API KEY (configured via .env / .env.local — not exposed in UI) ───────────
const API_KEY = import.meta.env.VITE_ANTHROPIC_KEY;
const API_KEY_MISSING_MESSAGE = "API key not found. Add VITE_ANTHROPIC_KEY=your-key to your .env file and restart the dev server.";

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400;500&family=Libre+Baskerville:ital,wght@0,400;1,400&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');

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
      { id: "motion1d",   label: "Position, Displacement & Distance" },
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
    title: "Position, Displacement & Distance",
    summary: "Before anything else in physics, you need to answer one question: where is the object? Position is the answer — it's a number that tells you where something is along an axis at a specific moment in time. But a number alone means nothing without a reference point. That reference point is called the origin, marked as zero on your axis. Everything is measured relative to it. Move right of the origin, your position is positive. Move left, it's negative. Physics doesn't care which direction you call positive — but you must pick one and stay consistent throughout the problem.",
    equations: [
      { tex: "x(t)", label: "Position as a function of time" },
    ],
    sections: [
      {
        id: "position",
        title: "1. Position",
        theory: "Before anything else in physics, you need to answer one question: where is the object? Position is the answer — it's a number that tells you where something is along an axis at a specific moment in time. But a number alone means nothing without a reference point. That reference point is called the origin, marked as zero on your axis. Everything is measured relative to it. Move right of the origin, your position is positive. Move left, it's negative. Physics doesn't care which direction you call positive — but you must pick one and stay consistent throughout the problem.",
        realWorld: "Think of it like a number line drawn on a highway. You pick a landmark — say, mile marker 0 at the city center. Your position is simply how far you are from that marker, and in which direction. If you're 3 km east, x = +3 km. If you drove 2 km west, x = −2 km. The sign is the direction.",
        equations: [
          { tex: "x(t)", label: "position as a function of time" },
        ],
        note: "x is used for horizontal motion, y for vertical. Both are positions — just along different axes.",
      },
      {
        id: "displacement",
        title: "2. Displacement",
        theory: "Displacement is the change in position — where you ended up minus where you started. It is a vector, meaning it carries both a magnitude (how far) and a direction (which way). The Greek letter delta (Δ) always means 'change in' — so Δx means 'change in x.' Crucially, displacement does not care about the path you took to get there. Only the start and end points matter.",
        realWorld: "You walk 3 blocks east, then 3 blocks back west. You're exactly where you started. Your distance traveled is 6 blocks. Your displacement is zero. This is why your GPS distance and your displacement are often completely different numbers — one tracks the path, the other tracks the result.",
        equations: [
          { tex: "\\Delta x = x_f - x_i", label: "displacement = final position minus initial" },
          { tex: "\\Delta x > 0", label: "means motion in the positive direction" },
          { tex: "\\Delta x < 0", label: "means motion in the negative direction" },
          { tex: "|\\Delta x|", label: "magnitude of displacement (always positive)" },
        ],
        insight: "Displacement can be zero even after significant motion. A marathon runner who completes a loop course has zero displacement. An object that returns to its starting point always has Δx = 0, no matter how far it traveled.",
      },
      {
        id: "distance-vs-displacement",
        title: "3. Distance vs. Displacement",
        theory: "Distance is a scalar — it has magnitude only, no direction, and no sign. It is the total length of the path traveled, regardless of direction changes along the way. Distance is always positive or zero. Displacement is a vector — it has both magnitude and direction, and can be negative. These two quantities are equal only when the object moves in a straight line without reversing direction.",
        realWorld: "A dog runs around a circular park once and returns to the starting point. Distance traveled = circumference of the park. Displacement = 0. This is not a trick — this is the precise physical difference between 'how much ground you covered' and 'how far from home you ended up.'",
        table: {
          headers: ["", "Displacement", "Distance"],
          rows: [
            ["Type", "Vector", "Scalar"],
            ["Sign", "Can be + or −", "Always ≥ 0"],
            ["Depends on path?", "No", "Yes"],
            ["Symbol", "Δx", "d"],
            ["When equal", "Straight-line, no reversal", "Same condition"],
          ],
        },
        consequence: "In 1998, NASA lost the $125 million Mars Climate Orbiter because one engineering team used metric units and another used imperial units for the same position data. The spacecraft missed its orbital insertion by 170 km and burned up. Unit consistency and sign conventions in position calculations are not academic exercises — they are life and death in applied physics.",
      },
      {
        id: "reference-frames",
        title: "4. Reference Frames",
        theory: "Position is always measured relative to a reference frame — a chosen coordinate system with an origin and defined positive directions. There is no 'absolute' position in physics. The same object can have a position of +5 m in one frame and −5 m in another frame, and both are equally valid. What matters is that all measurements in a problem use the same frame consistently. For most Physics I problems, Earth's surface is the reference frame.",
        realWorld: "When you're on a train and you walk toward the front, you're moving at +2 m/s relative to the train. But the train is moving at +30 m/s relative to the ground. Your position and motion depend entirely on what you measure from. This is why physics always asks: relative to what? Choose your reference frame before solving any problem.",
      },
      {
        id: "position-time-graphs",
        title: "5. Reading Position-Time Graphs",
        theory: "A position-time graph (x vs. t) is one of the most powerful tools in kinematics. The value of x at any time t tells you where the object is. The slope of the line between two points gives the average velocity. A steeper slope means faster motion. A horizontal line means the object is stationary. A negative slope means motion in the negative direction. When the graph crosses x = 0, the object is at the origin.",
        keyBehaviors: [
          "Horizontal line → object at rest",
          "Positive slope → moving in positive direction",
          "Negative slope → moving in negative direction",
          "Steeper slope → faster speed",
          "Curved line → changing velocity (acceleration)",
          "Returns to same x value → displacement = 0 for that interval",
        ],
        equations: [
          { tex: "\\bar{v} = \\frac{\\Delta x}{\\Delta t} = \\frac{x_2 - x_1}{t_2 - t_1}", label: "slope of the x-t graph between two points = average velocity" },
        ],
      },
    ],
    summaryBox: {
      title: "What to Remember",
      bullets: [
        "Position (x): where you are, measured from an origin. Needs a reference frame. Can be positive or negative.",
        "Displacement (Δx = x_f − x_i): how far and in what direction you moved from start to finish. A vector. Path-independent.",
        "Distance (d): total path length. A scalar. Always ≥ 0. Path-dependent.",
        "The sign of Δx tells you direction, not just magnitude.",
        "Always choose a reference frame and positive direction before solving any problem.",
      ],
    },
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

const AI_tutor = {
  name: "Brown"
}

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
  {
    id: "f5", label: "Position",
    display: "x(t)",
    what: "Position as a function of time — where the object is on the axis at time t, measured from the origin.",
    real: "x(3s) = +12m means: at t=3 seconds, the object is 12 meters to the right of where we defined zero to be.",
    vars: [
      { tex: "x",     meaning: "position (m)" },
      { tex: "t",     meaning: "time (s)" },
      { tex: "x = 0", meaning: "origin (chosen reference point)" },
    ],
    group: [
      { tex: "x(t)", label: "Position function" },
    ]
  },
  {
    id: "f6", label: "Displacement",
    display: "\\Delta x = x_f - x_i",
    what: "Change in position. End minus start. Direction encoded in the sign.",
    real: "Start at x=2m, end at x=-1m: Δx = -1 - 2 = -3m. Moved 3 meters in the negative direction.",
    vars: [
      { tex: "\\Delta x", meaning: "displacement (m), can be negative" },
      { tex: "x_f",       meaning: "final position (m)" },
      { tex: "x_i",       meaning: "initial position (m)" },
    ],
    group: [
      { tex: "\\Delta x = x_f - x_i", label: "End minus start" },
    ]
  },
  {
    id: "f7", label: "Average Velocity (from graph slope)",
    display: "\\bar{v} = \\dfrac{\\Delta x}{\\Delta t}",
    what: "Average rate of position change over a time interval. This is the slope of the x-t graph.",
    real: "Move 60m east in 10 seconds: v̄ = 60/10 = 6 m/s east. Move 60m and come back in 10s: v̄ = 0/10 = 0 m/s.",
    vars: [
      { tex: "\\bar{v}",  meaning: "average velocity (m/s), can be negative" },
      { tex: "\\Delta x", meaning: "displacement (m)" },
      { tex: "\\Delta t", meaning: "time elapsed (s), always positive" },
    ],
    group: [
      { tex: "\\bar{v} = \\frac{\\Delta x}{\\Delta t}", label: "Average velocity from displacement and elapsed time" },
    ]
  },
];

const VIZ_CONCEPT_IDS = new Set(
  CURRICULUM.flatMap((group) => group.concepts.filter((concept) => concept.hasViz).map((concept) => concept.id))
);

const PANEL_DEFAULTS = {
  sidebar: 220,
  concept: 380,
  formulas: 300,
  tutor: 320,
};

const PANEL_LIMITS = {
  sidebar: { min: 160, max: 320 },
  concept: { min: 200, max: 600 },
  formulas: { min: 240, max: 480 },
  tutor: { min: 260, max: 480 },
};

const MIN_MAIN_WIDTH = 320;

const useResponsiveCanvasSize = (
  containerRef,
  { minWidth = 220, minHeight = 280, maxHeight = 420, ratio = 0.42 } = {}
) => {
  const [size, setSize] = useState({ width: 900, height: 380 });

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateSize = (rect) => {
      const nextWidth = Math.max(minWidth, Math.floor(rect.width));
      const nextHeight = Math.min(maxHeight, Math.max(minHeight, Math.floor(nextWidth * ratio)));
      setSize((prev) => (
        prev.width === nextWidth && prev.height === nextHeight
          ? prev
          : { width: nextWidth, height: nextHeight }
      ));
    };

    updateSize(node.getBoundingClientRect());

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver((entries) => {
        entries.forEach((entry) => updateSize(entry.contentRect));
      });
      observer.observe(node);
      return () => observer.disconnect();
    }

    const onResize = () => updateSize(node.getBoundingClientRect());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [containerRef, minWidth, minHeight, maxHeight, ratio]);

  return size;
};

// ─── SHARED SLIDER ───────────────────────────────────────────────────────────
const SimSlider = ({ label, value, min, max, step, unit, decimals = 2, onChange }) => (
  <div style={{
    flex: "1 1 220px",
    minWidth: 210,
    background: T.bg1,
    border: `1px solid ${T.border}`,
    borderRadius: 8,
    padding: "8px 10px",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span className="label" style={{ whiteSpace: "nowrap" }}>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={onChange}
        style={{ flex: 1, accentColor: T.blue, cursor: "pointer" }}
      />
      <span style={{ fontFamily: T.mono, fontSize: 11, color: T.blue, whiteSpace: "nowrap" }}>
        {value.toFixed(decimals)} {unit}
      </span>
    </div>
  </div>
);

// ─── SPRING-MASS SIMULATION ───────────────────────────────────────────────────
const SHOSim = () => {
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const stateRef = useRef({ t: 0, running: true });
  const animRef  = useRef(null);
  const [params, setParams] = useState({ mass: 1.0, k: 8.0, damping: 0.1, amplitude: 80 });
  const [readouts, setReadouts] = useState({ x: "0.000", v: "0.000", ke: "0.00", pe: "0.00" });
  const canvasSize = useResponsiveCanvasSize(canvasContainerRef, {
    minWidth: 220,
    minHeight: 300,
    maxHeight: 420,
    ratio: 0.42,
  });

  const omega  = Math.sqrt(params.k / params.mass);
  const period = (2 * Math.PI / omega).toFixed(2);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      const cx = W * 0.52, cy = H * 0.44;
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
  }, [params, omega, period, canvasSize.width, canvasSize.height]);

  const reset  = useCallback(() => { stateRef.current.t = 0; }, []);
  const toggle = useCallback(() => { stateRef.current.running = !stateRef.current.running; }, []);

  const onSlider = useCallback((param, value) => {
    stateRef.current.t = 0;
    setParams(p => ({ ...p, [param]: value }));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, gap: 10 }}>
      <div ref={canvasContainerRef} style={{ flex: 1, minHeight: 300 }}>
        <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height}
          style={{ width: "100%", height: canvasSize.height, borderRadius: 8, border: `1px solid ${T.border}` }} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={toggle} style={{
          padding: "7px 14px", borderRadius: 999,
          border: `1px solid ${T.border2}`, background: T.bg1,
          color: T.text1, fontSize: 11, fontWeight: 500,
          transition: "all 0.15s ease",
        }}>Pause</button>
        <button onClick={reset} style={{
          padding: "7px 14px", borderRadius: 999,
          border: `1px solid ${T.border2}`, background: T.bg1,
          color: T.text1, fontSize: 11, fontWeight: 500,
          transition: "all 0.15s ease",
        }}>Reset</button>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <SimSlider label="Mass"      value={params.mass}      min={0.2} max={4}   step={0.1}  unit="kg"  onChange={e => onSlider("mass", parseFloat(e.target.value))} />
        <SimSlider label="Spring k"  value={params.k}         min={1}   max={30}  step={0.5}  unit="N/m" onChange={e => onSlider("k", parseFloat(e.target.value))} />
        <SimSlider label="Damping"   value={params.damping}   min={0}   max={0.8} step={0.02} unit=""     onChange={e => onSlider("damping", parseFloat(e.target.value))} />
        <SimSlider label="Amplitude" value={params.amplitude} min={10}  max={120} step={5}    unit="px"  decimals={0} onChange={e => onSlider("amplitude", parseFloat(e.target.value))} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {[["x(t)", readouts.x, "m"], ["v(t)", readouts.v, "m/s"], ["KE", readouts.ke, "J"], ["PE", readouts.pe, "J"], ["T", period, "s"]].map(([l, v, u]) => (
          <div key={l} style={{
            padding: "6px 10px",
            background: T.bg1,
            borderRadius: 999,
            border: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}>
            <span style={{ fontFamily: T.mono, fontSize: 10, color: T.text2 }}>{l}</span>
            <span style={{ fontFamily: T.mono, fontSize: 10, color: T.blue }}>
              {v} <span style={{ color: T.text3 }}>{u}</span>
            </span>
          </div>
        ))}
      </div>

      <div style={{ padding: "10px 12px", background: T.blueLight, borderRadius: 8, border: `1px solid ${T.border2}` }}>
        <div className="label" style={{ marginBottom: 5, color: T.blue }}>Key Insight</div>
        <div style={{ fontSize: 11, color: T.text1, lineHeight: 1.55 }}>
          Period = {period} s regardless of amplitude. Change mass or k and it shifts. Amplitude is irrelevant.
        </div>
        <div style={{ marginTop: 6 }}>
          <Katex tex={`T = 2\\pi\\sqrt{\\frac{m}{k}}`} style={{ fontSize: 13, color: T.blue }} />
        </div>
      </div>
    </div>
  );
};

// ─── PROJECTILE SIMULATION ────────────────────────────────────────────────────
const ProjectileSim = () => {
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const animRef   = useRef(null);
  const [params, setParams] = useState({ angle: 45, v0: 20, g: 9.81 });
  const [running, setRunning] = useState(true);
  const tRef = useRef(0);
  const canvasSize = useResponsiveCanvasSize(canvasContainerRef, {
    minWidth: 220,
    minHeight: 300,
    maxHeight: 420,
    ratio: 0.42,
  });

  const angleRad = params.angle * Math.PI / 180;
  const vx   = params.v0 * Math.cos(angleRad);
  const vy0  = params.v0 * Math.sin(angleRad);
  const tF   = (2 * vy0) / params.g;
  const range = vx * tF;
  const maxH  = (vy0 * vy0) / (2 * params.g);
  const metrics = { range: range.toFixed(1), maxH: maxH.toFixed(1), tFlight: tF.toFixed(2) };

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
  }, [params, drawFrame, canvasSize.width, canvasSize.height]);

  const onProjSlider = useCallback((param, value) => {
    setRunning(false);
    setParams(p => ({ ...p, [param]: value }));
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0, gap: 10 }}>
      <div ref={canvasContainerRef} style={{ flex: 1, minHeight: 300 }}>
        <canvas ref={canvasRef} width={canvasSize.width} height={canvasSize.height}
          style={{ width: "100%", height: canvasSize.height, borderRadius: 8, border: `1px solid ${T.border}` }} />
      </div>
      <button onClick={() => setRunning(true)} style={{
        width: "100%", padding: "9px 0", borderRadius: 999,
        border: `1px solid ${T.blue}`, background: T.blue,
        color: "#fff", fontSize: 12, fontWeight: 600, letterSpacing: "0.03em",
        transition: "all 0.15s ease",
      }}>Launch</button>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <SimSlider label="Launch Angle" value={params.angle} min={5}   max={85}   step={1}   unit="°"    decimals={0} onChange={e => onProjSlider("angle", parseFloat(e.target.value))} />
        <SimSlider label="Init. Speed"  value={params.v0}    min={5}   max={50}   step={1}   unit="m/s"  decimals={0} onChange={e => onProjSlider("v0", parseFloat(e.target.value))} />
        <SimSlider label="Gravity"      value={params.g}     min={1.6} max={24.8} step={0.1} unit="m/s²"              onChange={e => onProjSlider("g", parseFloat(e.target.value))} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {[["Range", metrics.range, "m"], ["Max Height", metrics.maxH, "m"],
          ["Flight Time", metrics.tFlight, "s"], ["vₓ", vx.toFixed(2), "m/s"], ["v_y₀", vy0.toFixed(2), "m/s"]
        ].map(([l, v, u]) => (
          <div key={l} style={{
            padding: "6px 10px",
            background: T.bg1,
            borderRadius: 999,
            border: `1px solid ${T.border}`,
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}>
            <span style={{ fontFamily: T.mono, fontSize: 10, color: T.text2 }}>{l}</span>
            <span style={{ fontFamily: T.mono, fontSize: 10, color: T.blue }}>
              {v} <span style={{ color: T.text3 }}>{u}</span>
            </span>
          </div>
        ))}
      </div>

      <div style={{ padding: "10px 12px", background: T.blueLight, borderRadius: 8, border: `1px solid ${T.border2}` }}>
        <div className="label" style={{ marginBottom: 5, color: T.blue }}>Key Insight</div>
        <div style={{ fontSize: 11, color: T.text1, lineHeight: 1.55, marginBottom: 6 }}>
          x and y are independent. Try Moon gravity (1.62 m/s²) — same formula, different physics.
        </div>
        <Katex tex={`R = \\frac{v_0^2 \\sin 2\\theta}{g}`} style={{ fontSize: 13 }} />
      </div>
    </div>
  );
};

// ─── FORMULA CARD ─────────────────────────────────────────────────────────────
const FormulaCard = ({ formula, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

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
const ProblemsTab = () => {
  const [topic,      setTopic]      = useState("projectile");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [problem,    setProblem]    = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [showSol,    setShowSol]    = useState(false);

  const generate = async () => {
    if (!API_KEY) { setProblem({ noKey: true }); return; }
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
          "x-api-key": API_KEY,
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
          {API_KEY_MISSING_MESSAGE}
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

const TutorPanel = ({ starterPrompts = [], minHeight = 0 }) => {
  const [msgs, setMsgs] = useState([
    {
      role: "assistant",
      text: "I'm Phasora. Ask me anything about the physics you're exploring, or ask for an intuitive walk-through.",
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hoveredStarter, setHoveredStarter] = useState(null);
  const [hoverSend, setHoverSend] = useState(false);
  const bottomRef = useRef(null);
  const msgsRef = useRef(msgs);

  useEffect(() => {
    msgsRef.current = msgs;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const renderMsg = (text) => {
    const parts = text.split(/(\$[^$]+\$)/g);
    return parts.map((part, i) => {
      if (part.startsWith("$") && part.endsWith("$")) {
        return <Katex key={i} tex={part.slice(1, -1)} />;
      }
      return <span key={i}>{part}</span>;
    });
  };

  const send = async (overrideText) => {
    if (loading) return;
    const userMsg = (overrideText ?? input).trim();
    if (!userMsg) return;

    setInput("");
    setMsgs((m) => [...m, { role: "user", text: userMsg }]);
    setLoading(true);

    if (!API_KEY) {
      setMsgs((m) => [...m, { role: "assistant", text: API_KEY_MISSING_MESSAGE }]);
      setLoading(false);
      return;
    }

    try {
      const history = msgsRef.current.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.text,
      }));
      history.push({ role: "user", content: userMsg });

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 600,
          system: TUTOR_SYSTEM,
          messages: history
        })
      });
      const data = await res.json();
      setMsgs((m) => [...m, { role: "assistant", text: data.content?.[0]?.text || "Something went wrong." }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", text: "API error - please try again." }]);
    }
    setLoading(false);
  };

  const startersVisible =
    starterPrompts.length > 0 &&
    msgs.length === 1 &&
    msgs[0].role === "assistant";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 10, minHeight }}>
      <div style={{
        flex: 1,
        minHeight: 0,
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        paddingRight: 4
      }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            padding: "11px 14px",
            borderRadius: 10,
            fontSize: 13,
            lineHeight: 1.72,
            background: m.role === "user" ? T.blueLight : T.bg2,
            border: `1px solid ${m.role === "user" ? T.border2 : T.border}`,
            color: m.role === "user" ? T.navy : T.text1,
            alignSelf: m.role === "user" ? "flex-end" : "flex-start",
            maxWidth: "95%"
          }}>
            {m.role === "assistant" && (
              <div style={{ fontFamily: T.brandMono, fontSize: 9, color: T.text3, marginBottom: 5, letterSpacing: "0.11em" }}>
                PHASORA
              </div>
            )}
            {renderMsg(m.text)}
          </div>
        ))}
        {loading && (
          <div style={{
            padding: "10px 14px",
            background: T.bg2,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            fontSize: 12,
            color: T.text3
          }}>
            thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {startersVisible && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {starterPrompts.map((prompt, i) => (
            <button
              key={prompt}
              onClick={() => send(prompt)}
              onMouseEnter={() => setHoveredStarter(i)}
              onMouseLeave={() => setHoveredStarter(null)}
              style={{
                padding: "6px 11px",
                borderRadius: 999,
                border: `1px solid ${hoveredStarter === i ? T.blue : T.border}`,
                background: hoveredStarter === i ? T.blueLight : T.bg1,
                color: hoveredStarter === i ? T.blue : T.text2,
                fontSize: 12,
                transition: "all 0.15s ease"
              }}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder="Ask anything about physics..."
          style={{
            flex: 1,
            padding: "10px 11px",
            background: T.bg2,
            border: `1px solid ${T.border2}`,
            borderRadius: 8,
            color: T.text0,
            fontSize: 13,
            outline: "none",
            transition: "border-color 0.15s ease"
          }}
        />
        <button
          onClick={() => send()}
          onMouseEnter={() => setHoverSend(true)}
          onMouseLeave={() => setHoverSend(false)}
          style={{
            padding: "10px 18px",
            background: hoverSend ? T.blueDim : T.blue,
            borderRadius: 8,
            color: "#fff",
            fontSize: 12,
            fontWeight: 500,
            transition: "all 0.15s ease"
          }}
        >
          Ask
        </button>
      </div>
    </div>
  );
};

// ─── ANIMATION BLOCK ─────────────────────────────────────────────────────────
const AnimationBlock = ({ src, label, videoRef: externalVideoRef, containerRef: externalContainerRef }) => {
  const internalVideoRef = useRef(null);
  const internalContainerRef = useRef(null);
  const videoRef = externalVideoRef || internalVideoRef;
  const containerRef = externalContainerRef || internalContainerRef;
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (videoRef.current) {
            videoRef.current.play().catch(() => {});
          }
        } else {
          if (videoRef.current) {
            videoRef.current.pause();
          }
        }
      },
      { threshold: 0.3, rootMargin: '0px 0px -10% 0px' }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [videoRef, containerRef]);

  if (hasError) {
    return (
      <div
        ref={containerRef}
        style={{
          margin: '24px 0',
          borderRadius: 8,
          overflow: 'hidden',
          border: `1px solid ${T.border}`,
          background: T.bg2,
        }}
      >
        <div style={{
          padding: '8px 14px',
          borderBottom: `1px solid ${T.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: T.bg1,
        }}>
          <span style={{ fontFamily: T.mono, fontSize: 10, color: T.blue, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            ▶ Animation
          </span>
          <span style={{ fontSize: 11, color: T.text2 }}>{label}</span>
        </div>
        <div style={{ padding: '48px 24px', textAlign: 'center', background: T.bg2 }}>
          <div style={{ fontFamily: T.mono, fontSize: 11, color: T.text3, marginBottom: 8 }}>
            ANIMATION NOT YET RENDERED
          </div>
          <div style={{ fontSize: 12, color: T.text2 }}>
            Run: manim -pql animations/1_1_position_displacement.py PositionDisplacement
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        margin: '24px 0',
        borderRadius: 8,
        overflow: 'hidden',
        border: `1px solid ${T.border}`,
        background: T.bg2,
      }}
    >
      <div style={{
        padding: '8px 14px',
        borderBottom: `1px solid ${T.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: T.bg1,
      }}>
        <span style={{ fontFamily: T.mono, fontSize: 10, color: T.blue, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          ▶ Animation
        </span>
        <span style={{ fontSize: 11, color: T.text2 }}>{label}</span>
      </div>
      <video
        ref={videoRef}
        src={src}
        style={{ width: '100%', display: 'block', maxHeight: 400, background: '#ffffff' }}
        loop
        muted
        playsInline
        onLoadedData={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        preload="metadata"
      />
      {!isLoaded && !hasError && (
        <div style={{ padding: 40, textAlign: 'center', color: T.text3, fontFamily: T.mono, fontSize: 11 }}>
          Loading animation...
        </div>
      )}
    </div>
  );
};

const ConceptView = ({ conceptId, compact = false, library = false }) => {
  const c = CONCEPT_TEXT[conceptId];
  const animVideoRef = useRef(null);
  const animContainerRef = useRef(null);

  const scrollToAnimation = () => {
    if (animContainerRef.current) {
      animContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (animVideoRef.current) {
        animVideoRef.current.play().catch(() => {});
      }
    }
  };

  if (!c) return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: T.text3, fontSize: 14 }}>
      Select a topic from the left panel.
    </div>
  );

  const outerPadding = library
    ? "52px 64px 52px"
    : compact
      ? "30px 30px 34px"
      : "48px 60px 56px";
  const hasStructuredSections = Array.isArray(c.sections) && c.sections.length > 0;
  const contentMaxWidth = library ? 760 : compact ? "100%" : 860;
  const cardMaxWidth = library ? 760 : compact ? "100%" : 860;
  const centerReading = !library && !compact;

  return (
    <div key={conceptId} className="fadeIn" style={{
      padding: outerPadding,
      transition: "padding 0.35s ease",
      minHeight: "100%",
    }}>
      <div style={{
        fontSize: 10, fontWeight: 600, color: T.blue,
        letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 12,
      }}>
        Classical Mechanics
      </div>
      <div style={{ borderTop: `1px solid ${T.border}`, marginBottom: library ? 24 : 18 }} />

      <h1 style={{
        fontFamily: T.serif, fontStyle: "italic",
        fontSize: library ? 34 : 28, color: T.navy,
        lineHeight: 1.22, marginBottom: library ? 20 : 18, fontWeight: 400,
      }}>
        {c.title}
      </h1>

      {hasStructuredSections ? (
        <div style={{ maxWidth: cardMaxWidth, margin: centerReading ? "0 auto" : 0 }}>
          {c.sections.map((section, sectionIndex) => (
            <Fragment key={section.id || section.title || sectionIndex}>
            <section
              style={{ marginBottom: sectionIndex < c.sections.length - 1 ? 28 : 0 }}
            >
              <h2 style={{
                fontFamily: T.cardSans,
                fontSize: library ? 22 : 20,
                fontWeight: 600,
                color: T.navy,
                marginBottom: 10,
              }}>
                {section.title}
              </h2>

              {section.theory && (
                <p style={{
                  fontSize: 14,
                  color: T.text1,
                  lineHeight: 1.75,
                  marginBottom: 14,
                  maxWidth: "100%",
                }}>
                  {section.theory}
                  {conceptId === "motion1d" && section.id === "position" && (
                    <button
                      onClick={scrollToAnimation}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        marginLeft: 8,
                        border: `1px solid ${T.blueDim}`,
                        background: T.blueLight,
                        color: T.blue,
                        borderRadius: 12,
                        padding: '3px 10px',
                        fontSize: 11,
                        fontFamily: T.mono,
                        cursor: 'pointer',
                        verticalAlign: 'middle',
                      }}
                    >
                      ▶ See this animated
                    </button>
                  )}
                </p>
              )}

              {section.realWorld && (
                <div style={{
                  marginBottom: 14,
                  background: T.bg2,
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  padding: "12px 14px",
                  width: "100%",
                }}>
                  <div className="label" style={{ marginBottom: 6, color: T.blue }}>
                    Real-World Translation
                  </div>
                  <div style={{ fontSize: 13, color: T.text1, lineHeight: 1.7, fontStyle: "italic" }}>
                    {section.realWorld}
                  </div>
                </div>
              )}

              {section.table && (
                <div style={{
                  marginBottom: 14,
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  overflow: "hidden",
                  background: T.bg1,
                  width: "100%",
                }}>
                  <table style={{ width: "100%", tableLayout: "fixed", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: T.blueLight }}>
                        {section.table.headers.map((header, idx) => (
                          <th
                            key={`${section.id}-head-${idx}`}
                            style={{
                              padding: "9px 10px",
                              borderBottom: `1px solid ${T.border}`,
                              borderRight: idx < section.table.headers.length - 1 ? `1px solid ${T.border}` : "none",
                              fontFamily: T.brandMono,
                              fontSize: 10,
                              letterSpacing: "0.08em",
                              textTransform: "uppercase",
                              color: T.blue,
                              textAlign: idx === 0 ? "left" : "center",
                              fontWeight: 600,
                            }}
                          >
                            {header || " "}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.rows.map((row, rowIdx) => (
                        <tr key={`${section.id}-row-${rowIdx}`}>
                          {row.map((cell, cellIdx) => (
                            <td
                              key={`${section.id}-cell-${rowIdx}-${cellIdx}`}
                              style={{
                                padding: "9px 10px",
                                borderBottom: rowIdx < section.table.rows.length - 1 ? `1px solid ${T.border}` : "none",
                                borderRight: cellIdx < row.length - 1 ? `1px solid ${T.border}` : "none",
                                fontSize: 13,
                                color: cellIdx === 0 ? T.text1 : T.text2,
                                fontWeight: cellIdx === 0 ? 500 : 400,
                                textAlign: cellIdx === 0 ? "left" : "center",
                                lineHeight: 1.6,
                              }}
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {section.keyBehaviors?.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div className="label" style={{ marginBottom: 8, color: T.blue }}>
                    Key Graph Behaviors
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {section.keyBehaviors.map((behavior, behaviorIdx) => (
                      <li
                        key={`${section.id}-behavior-${behaviorIdx}`}
                        style={{
                          fontSize: 13,
                          color: T.text1,
                          lineHeight: 1.75,
                          marginBottom: 5,
                        }}
                      >
                        {behavior}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {section.equations?.length > 0 && (
                <div style={{
                  marginBottom: 14,
                  background: T.blueLight,
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  padding: "14px 16px",
                }}>
                  <div className="label" style={{ marginBottom: 10, color: T.blue }}>
                    Core Equations
                  </div>
                  {section.equations.map((eq, i) => (
                    <div key={`${section.id}-eq-${i}`} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 0",
                      borderBottom: i < section.equations.length - 1 ? `1px solid ${T.border}` : "none",
                    }}>
                      <div style={{ minWidth: 0, overflowX: "auto" }}>
                        <Katex tex={eq.tex} style={{ fontSize: library ? 17 : 15, color: T.navy }} />
                      </div>
                      {eq.label && (
                        <span style={{ fontSize: 12, color: T.text3, fontStyle: "italic", flex: 1 }}>
                          {eq.label}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {section.note && (
                <div style={{
                  marginBottom: 14,
                  fontSize: 12,
                  color: T.text2,
                  lineHeight: 1.65,
                }}>
                  {section.note}
                </div>
              )}

              {section.insight && (
                <div style={{
                  marginBottom: 14,
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #fcd34d",
                  borderLeft: "4px solid #d97706",
                  background: "#fffbeb",
                  width: "100%",
                }}>
                  <div className="label" style={{ marginBottom: 6, color: "#b45309" }}>
                    Key Insight
                  </div>
                  <div style={{ fontSize: 13, color: T.text1, lineHeight: 1.7 }}>
                    {section.insight}
                  </div>
                </div>
              )}

              {section.consequence && (
                <div style={{
                  marginBottom: 14,
                  padding: "12px 14px",
                  borderRadius: 8,
                  border: "1px solid #fcd34d",
                  borderLeft: "4px solid #d97706",
                  background: "#fffbeb",
                  width: "100%",
                }}>
                  <div className="label" style={{ marginBottom: 6, color: "#b45309" }}>
                    Real Consequence
                  </div>
                  <div style={{ fontSize: 13, color: T.text1, lineHeight: 1.72 }}>
                    {section.consequence}
                  </div>
                </div>
              )}
            </section>
            {conceptId === "motion1d" && section.id === "displacement" && (
              <AnimationBlock
                src="/animations/1_1_position_displacement.mp4"
                label="Position vectors and displacement"
                videoRef={animVideoRef}
                containerRef={animContainerRef}
              />
            )}
            </Fragment>
          ))}

          {c.summaryBox && (
            <div style={{
              marginTop: 28,
              background: T.blueLight,
              borderRadius: 10,
              border: `1px solid ${T.border2}`,
              padding: library ? "20px 22px" : "18px 20px",
            }}>
              <div style={{
                fontFamily: T.cardSans,
                fontSize: 18,
                fontWeight: 600,
                color: T.navy,
                marginBottom: 10,
              }}>
                {c.summaryBox.title}
              </div>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                {c.summaryBox.bullets?.map((bullet, i) => (
                  <li key={`${conceptId}-summary-${i}`} style={{
                    fontSize: 13,
                    color: T.text1,
                    lineHeight: 1.75,
                    marginBottom: i < c.summaryBox.bullets.length - 1 ? 6 : 0,
                  }}>
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <>
          <div style={{ maxWidth: cardMaxWidth, margin: centerReading ? "0 auto" : 0 }}>
            <p style={{
              fontSize: 14, color: T.text1,
              lineHeight: 1.75, marginBottom: library ? 34 : 28,
              maxWidth: contentMaxWidth,
            }}>
              {c.summary}
            </p>

            <div style={{
              background: T.blueLight, borderRadius: 10,
              padding: library ? "24px 28px" : "20px 24px", border: `1px solid ${T.border}`,
              maxWidth: cardMaxWidth,
            }}>
              <div style={{
                fontSize: 10, fontWeight: 600, color: T.blue,
                letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: library ? 18 : 14,
              }}>
                Core Equations
              </div>
              {c.equations.map((eq, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: library ? 22 : 16,
                  padding: "12px 0",
                  borderBottom: i < c.equations.length - 1 ? `1px solid ${T.border}` : "none",
                }}>
                  <div style={{ minWidth: 0, overflowX: "auto" }}>
                    <Katex tex={eq.tex} style={{ fontSize: library ? 17 : 15, color: T.navy }} />
                  </div>
                  <span style={{ fontSize: library ? 14 : 13, color: T.text3, fontStyle: "italic", flex: 1 }}>
                    {eq.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
const TUTOR_STARTERS = [
  "Why does acceleration stay constant in free fall?",
  "Explain Newton's second law like I am new to vectors.",
  "When do I use energy methods instead of force methods?",
  "Can you walk me through projectile motion step by step?",
];

const MODE_CARDS = [
  {
    id: "canvas",
    icon: "▦",
    title: "Physics Canvas",
    description: "Free exploration. Simulations, formulas, and AI tutor all in one place.",
  },
  {
    id: "library",
    icon: "☰",
    title: "Topic Library",
    description: "Structured curriculum. Read concepts, explore formulas, learn step by step.",
  },
  {
    id: "problems",
    icon: "∑",
    title: "Problem Mode",
    description: "Practice with AI-generated problems. Choose topic and difficulty.",
  },
  {
    id: "tutor",
    icon: "✦",
    title: "AI Tutor",
    description: "Ask anything about physics. Get intuitive explanations and worked examples.",
  },
];

const CurriculumSidebar = ({
  activeConcept,
  expandedGroup,
  setExpandedGroup,
  onSelectConcept,
  width = 240,
  collapsed = false,
  onClose = null,
}) => {
  const [hoveredConcept, setHoveredConcept] = useState(null);
  const [hoverClose, setHoverClose] = useState(false);

  return (
    <aside style={{
      width: collapsed ? 0 : width,
      minWidth: collapsed ? 0 : undefined,
      flexShrink: 0,
      background: T.bg1,
      borderRight: collapsed ? "none" : `1px solid ${T.border}`,
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
      padding: collapsed ? 0 : undefined,
      transition: "width 0.25s ease",
    }}>
      {!collapsed && (
        <>
          <div style={{
            padding: "16px 14px 14px",
            borderBottom: `1px solid ${T.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <div>
              <div style={{
                fontFamily: T.brandMono,
                fontSize: 10,
                fontWeight: 500,
                color: T.text3,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}>
                Classical Mechanics
              </div>
              <div style={{ marginTop: 4, fontSize: 14, fontWeight: 500, color: T.text1 }}>
                Curriculum
              </div>
            </div>
            {onClose && (
              <button
                aria-label="Close topics panel"
                onClick={onClose}
                onMouseEnter={() => setHoverClose(true)}
                onMouseLeave={() => setHoverClose(false)}
                style={{
                  padding: "4px 6px",
                  color: hoverClose ? T.text0 : T.text2,
                  fontSize: 16,
                  lineHeight: 1,
                  transition: "all 0.15s ease",
                }}
              >
                ×
              </button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "6px 0 10px" }}>
            {CURRICULUM.map((group) => {
              const groupExpanded = expandedGroup === group.id;
              const canOpen = group.active;

              return (
                <div key={group.id}>
                  <button
                    onClick={() => canOpen && setExpandedGroup((g) => g === group.id ? null : group.id)}
                    title={!canOpen ? "Coming soon" : undefined}
                    aria-expanded={canOpen ? groupExpanded : undefined}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "10px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                      fontFamily: T.brandMono,
                      fontSize: 10,
                      lineHeight: 1.4,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: !canOpen ? T.text2 : groupExpanded ? T.text1 : T.text2,
                      background: "transparent",
                      borderBottom: `1px solid ${T.border}`,
                      opacity: canOpen ? 1 : 0.35,
                      cursor: canOpen ? "pointer" : "default",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span style={{
                      flex: 1,
                      minWidth: 0,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}>
                      {group.label}
                    </span>
                    {canOpen && (
                      <span style={{
                        fontSize: 16,
                        color: T.text3,
                        lineHeight: 1,
                        display: "inline-block",
                        transform: groupExpanded ? "rotate(90deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}>
                        ›
                      </span>
                    )}
                  </button>

                  <div style={{
                    overflow: "hidden",
                    maxHeight: groupExpanded ? 500 : 0,
                    opacity: groupExpanded ? 1 : 0,
                    transition: groupExpanded
                      ? "max-height 0.25s ease, opacity 0.2s ease"
                      : "max-height 0.25s ease, opacity 0.1s ease",
                  }}>
                    {group.concepts.map((concept) => {
                      const active = activeConcept === concept.id;
                      const conceptHover = hoveredConcept === concept.id;
                      return (
                        <button
                          key={concept.id}
                          onClick={() => onSelectConcept(concept.id)}
                          onMouseEnter={() => setHoveredConcept(concept.id)}
                          onMouseLeave={() => setHoveredConcept(null)}
                          style={{
                            width: "100%",
                            textAlign: "left",
                            padding: "7px 14px 7px 24px",
                            fontSize: 13,
                            lineHeight: 1.65,
                            color: active ? T.blue : T.text1,
                            background: active
                              ? "rgba(29, 78, 216, 0.06)"
                              : conceptHover
                                ? "rgba(0,0,0,0.04)"
                                : "transparent",
                            borderLeft: `2px solid ${active ? T.blue : "transparent"}`,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <span style={{
                            display: "block",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}>
                            {concept.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </aside>
  );
};
const HomePage = ({ onSelectMode }) => {
  const [hoveredCard, setHoveredCard] = useState(null);
  return (
    <div style={{
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 28px",
      background: T.bg0,
      overflowY: "auto",
    }}>
      <div style={{ width: "min(1140px, 100%)", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 34 }}>
          <div style={{
            fontFamily: T.brandMono,
            fontSize: 52,
            fontWeight: 500,
            letterSpacing: "0.2em",
            color: T.blue,
            lineHeight: 1.1,
          }}>
            PHASORA
          </div>
          <div style={{
            marginTop: 12,
            fontFamily: T.brandSerif,
            fontStyle: "italic",
            fontSize: 24,
            color: T.navy,
          }}>
            Physics, understood — not memorized.
          </div>
          <div style={{
            marginTop: 10,
            fontFamily: T.brandMono,
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: T.text2,
          }}>
            Choose how you want to learn today.
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
          gap: 16,
        }}>
          {MODE_CARDS.map((card) => {
            const hover = hoveredCard === card.id;
            return (
              <button
                key={card.id}
                onClick={() => onSelectMode(card.id)}
                onMouseEnter={() => setHoveredCard(card.id)}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  position: "relative",
                  minHeight: 188,
                  background: T.bg1,
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  padding: 24,
                  textAlign: "left",
                  boxShadow: hover ? "0 8px 22px rgba(15,23,42,0.10)" : "0 1px 6px rgba(15,23,42,0.04)",
                  transition: "all 0.2s ease",
                  overflow: "hidden",
                }}
              >
                <span style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: hover ? 4 : 0,
                  background: T.blue,
                  transition: "width 0.2s ease",
                }} />
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: T.blueLight,
                  color: T.blue,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 17,
                  marginBottom: 14,
                }}>
                  {card.icon}
                </div>
                <div style={{
                  fontFamily: T.cardSans,
                  fontSize: 18,
                  fontWeight: 600,
                  color: T.navy,
                  marginBottom: 8,
                }}>
                  {card.title}
                </div>
                <div style={{
                  fontFamily: T.cardSans,
                  fontSize: 14,
                  color: T.text2,
                  lineHeight: 1.7,
                }}>
                  {card.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const TopNav = ({
  activeMode,
  onGoHome,
  showSidebar,
  onToggleSidebar,
  showSim,
  canvasView,
  onToggleSim,
  onToggleProblems,
  showFormulas,
  onToggleFormulas,
  showTutor,
  onToggleTutor,
}) => {
  const [hoverWordmark, setHoverWordmark] = useState(false);
  const [hoverTab, setHoverTab] = useState(null);
  const [hoverUtility, setHoverUtility] = useState(null);

  const tabs = [
    { id: "visualize", label: "VISUALIZE", active: canvasView === "learn" && showSim, onClick: onToggleSim },
    { id: "problems", label: "PROBLEMS", active: canvasView === "problems", onClick: onToggleProblems },
  ];

  const utilityBtnStyle = (active, hover) => ({
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "5px 14px",
    borderRadius: 20,
    border: `1px solid ${active ? T.blue : T.border}`,
    background: active ? T.blueLight : hover ? T.bg2 : T.bg1,
    color: active ? T.blue : T.text1,
    fontFamily: T.brandMono,
    fontSize: 10,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    transition: "all 0.15s ease",
  });

  return (
    <nav style={{
      display: "flex",
      alignItems: "center",
      minHeight: 56,
      flexShrink: 0,
      background: T.bg1,
      borderBottom: `1px solid ${T.border}`,
      padding: "0 18px",
      gap: 14,
      boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
    }}>
      <button
        onClick={onGoHome}
        onMouseEnter={() => setHoverWordmark(true)}
        onMouseLeave={() => setHoverWordmark(false)}
        style={{
          fontFamily: T.brandMono,
          fontSize: 16,
          fontWeight: 500,
          letterSpacing: "0.18em",
          color: T.blue,
          opacity: hoverWordmark ? 0.76 : 1,
          textDecoration: hoverWordmark ? "underline" : "none",
          textUnderlineOffset: 3,
          transition: "all 0.15s ease",
          flexShrink: 0,
        }}
      >
        PHASORA
      </button>

      {activeMode === "canvas" ? (
        <>
          <button
            onClick={onToggleSidebar}
            onMouseEnter={() => setHoverUtility("topics")}
            onMouseLeave={() => setHoverUtility(null)}
            style={utilityBtnStyle(showSidebar, hoverUtility === "topics")}
          >
            ⊞ TOPICS
          </button>
          <div style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={tab.onClick}
                onMouseEnter={() => setHoverTab(tab.id)}
                onMouseLeave={() => setHoverTab(null)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 999,
                  fontFamily: T.brandMono,
                  fontSize: 11,
                  letterSpacing: "0.08em",
                  color: tab.active ? "#fff" : hoverTab === tab.id ? T.text1 : T.text2,
                  background: tab.active ? T.blue : hoverTab === tab.id ? "rgba(0,0,0,0.04)" : "transparent",
                  transition: "all 0.15s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div style={{
          fontFamily: T.brandMono,
          fontSize: 11,
          color: T.text3,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}>
          Topic Library
        </div>
      )}

      <div style={{ flex: 1 }} />

      {activeMode === "canvas" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={onToggleFormulas}
            onMouseEnter={() => setHoverUtility("formulas")}
            onMouseLeave={() => setHoverUtility(null)}
            style={utilityBtnStyle(showFormulas, hoverUtility === "formulas")}
          >
            ⊞ Formulas
          </button>
          <button
            onClick={onToggleTutor}
            onMouseEnter={() => setHoverUtility("tutor")}
            onMouseLeave={() => setHoverUtility(null)}
            style={utilityBtnStyle(showTutor, hoverUtility === "tutor")}
          >
            ◈ Ask Phasora
          </button>
        </div>
      )}
    </nav>
  );
};

const BackHomeButton = ({ onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      aria-label="Return to home"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "8px 13px",
        borderRadius: 8,
        border: `1px solid ${hovered ? T.blue : T.border}`,
        background: hovered ? T.blueLight : T.bg1,
        color: hovered ? T.blue : T.text1,
        fontSize: 12,
        fontFamily: T.brandMono,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        transition: "all 0.15s ease",
      }}
    >
      ← Back Home
    </button>
  );
};

const ResizeHandle = ({
  id,
  side = "right",
  disabled = false,
  onMouseDown,
  onDoubleClick,
}) => {
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) return undefined;
    const onUp = () => setDragging(false);
    document.addEventListener("mouseup", onUp);
    window.addEventListener("mouseleave", onUp);
    return () => {
      document.removeEventListener("mouseup", onUp);
      window.removeEventListener("mouseleave", onUp);
    };
  }, [dragging]);

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={`${id} resize handle`}
      onMouseDown={disabled ? undefined : (e) => { setDragging(true); onMouseDown?.(e); }}
      onMouseEnter={disabled ? undefined : () => setHovered(true)}
      onMouseLeave={disabled ? undefined : () => setHovered(false)}
      onDoubleClick={disabled ? undefined : onDoubleClick}
      style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        width: 12,
        [side]: -6,
        marginLeft: -6,
        marginRight: -6,
        zIndex: 20,
        cursor: disabled ? "default" : "col-resize",
        background: "transparent",
        flexShrink: 0,
      }}
    >
      <div style={{
        position: "absolute",
        top: 0,
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        width: 2,
        background: hovered || dragging
          ? "rgba(29, 78, 216, 0.35)"
          : "transparent",
        transition: "background 0.15s ease",
        pointerEvents: "none",
      }} />
    </div>
  );
};

export default function App() {
  const [activeMode, setActiveMode] = useState("home"); // home | canvas | library | problems | tutor
  const [activeConcept, setActiveConcept] = useState("projectile");
  const [expandedGroup, setExpandedGroup] = useState("kinematics");
  const [showSim, setShowSim] = useState(false);
  const [showFormulas, setShowFormulas] = useState(false);
  const [showTutor, setShowTutor] = useState(false);
  const [canvasView, setCanvasView] = useState("learn"); // learn | problems
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(PANEL_DEFAULTS.sidebar);
  const [conceptWidth, setConceptWidth] = useState(PANEL_DEFAULTS.concept);
  const [formulaWidth, setFormulaWidth] = useState(PANEL_DEFAULTS.formulas);
  const [tutorWidth, setTutorWidth] = useState(PANEL_DEFAULTS.tutor);
  const [mainContentWidth, setMainContentWidth] = useState(0);
  const [showConceptInTightLayout, setShowConceptInTightLayout] = useState(false);
  const [activeHandle, setActiveHandle] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem("phasora_onboarded"));
  const mainContentRef = useRef(null);
  const dragRef = useRef({
    dragging: false,
    boundary: null,
    startX: 0,
    startWidth: 0,
    min: 0,
    max: 0,
    direction: 1,
  });
  const bodyUserSelectRef = useRef("");

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 900;
      setIsMobile(mobile);
      if (mobile && dragRef.current.dragging) {
        document.body.style.userSelect = bodyUserSelectRef.current;
        document.body.style.cursor = "";
        dragRef.current.dragging = false;
        setActiveHandle(null);
        document.removeEventListener("mousemove", dragRef.current.onMouseMove);
        document.removeEventListener("mouseup", dragRef.current.onMouseUp);
        window.removeEventListener("mouseleave", dragRef.current.onMouseLeave);
      }
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const node = mainContentRef.current;
    if (!node) return;

    const updateWidth = (width) => {
      const next = Math.floor(width);
      setMainContentWidth((prev) => (prev === next ? prev : next));
    };

    updateWidth(node.getBoundingClientRect().width);

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver((entries) => {
        entries.forEach((entry) => updateWidth(entry.contentRect.width));
      });
      observer.observe(node);
      return () => observer.disconnect();
    }

    const onResize = () => updateWidth(node.getBoundingClientRect().width);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [activeMode, showFormulas, showTutor, sidebarOpen]);

  const panelOpen = showSim && canvasView === "learn";
  const constrainedCanvas = panelOpen && mainContentWidth > 0 && mainContentWidth < 700;
  const showConceptOnlyInConstrained = constrainedCanvas && showConceptInTightLayout;
  const vizMode = activeConcept === "sho" ? "sho" : "projectile";
  const isDragging = activeHandle !== null;
  const sidebarUsedWidth = (sidebarOpen || activeMode !== "canvas")
    ? clamp(sidebarWidth, PANEL_LIMITS.sidebar.min, PANEL_LIMITS.sidebar.max)
    : 0;

  const getSidebarMax = useCallback(() => {
    const rightOccupied = (activeMode === "canvas" && showFormulas ? formulaWidth : 0)
      + (activeMode === "canvas" && showTutor ? tutorWidth : 0);
    return clamp(window.innerWidth - rightOccupied - MIN_MAIN_WIDTH, PANEL_LIMITS.sidebar.min, PANEL_LIMITS.sidebar.max);
  }, [activeMode, showFormulas, showTutor, formulaWidth, tutorWidth]);

  const getFormulaMax = useCallback(() => (
    clamp(
      window.innerWidth - sidebarUsedWidth - (showTutor ? tutorWidth : 0) - MIN_MAIN_WIDTH,
      PANEL_LIMITS.formulas.min,
      PANEL_LIMITS.formulas.max
    )
  ), [sidebarUsedWidth, showTutor, tutorWidth]);

  const getTutorMax = useCallback(() => (
    Math.max(
      0,
      Math.min(
        PANEL_LIMITS.tutor.max,
        window.innerWidth - sidebarUsedWidth - (showFormulas ? formulaWidth : 0) - MIN_MAIN_WIDTH
      )
    )
  ), [sidebarUsedWidth, showFormulas, formulaWidth]);

  const getConceptMax = useCallback(() => (
    clamp(mainContentWidth - 260, PANEL_LIMITS.concept.min, PANEL_LIMITS.concept.max)
  ), [mainContentWidth]);

  const sidebarRenderWidth = (sidebarOpen || activeMode !== "canvas")
    ? clamp(sidebarWidth, PANEL_LIMITS.sidebar.min, getSidebarMax())
    : 0;
  const formulaRenderWidth = showFormulas
    ? clamp(formulaWidth, PANEL_LIMITS.formulas.min, getFormulaMax())
    : 0;
  const tutorRenderWidth = showTutor
    ? Math.max(0, Math.min(tutorWidth, getTutorMax()))
    : 0;
  const conceptRenderWidth = panelOpen
    ? clamp(conceptWidth, PANEL_LIMITS.concept.min, getConceptMax())
    : conceptWidth;

  const stopDragging = useCallback(() => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    setActiveHandle(null);
    document.body.style.userSelect = bodyUserSelectRef.current;
    document.body.style.cursor = "";
    document.removeEventListener("mousemove", dragRef.current.onMouseMove);
    document.removeEventListener("mouseup", dragRef.current.onMouseUp);
    window.removeEventListener("mouseleave", dragRef.current.onMouseLeave);
  }, []);

  const onDragMove = useCallback((e) => {
    if (!dragRef.current.dragging || !dragRef.current.boundary) return;
    const {
      boundary,
      startX,
      startWidth,
      min,
      max,
      direction,
    } = dragRef.current;
    const delta = (e.clientX - startX) * direction;
    const nextWidth = clamp(startWidth + delta, min, max);

    if (boundary === "A") {
      setSidebarWidth((prev) => (prev === nextWidth ? prev : nextWidth));
      return;
    }
    if (boundary === "B") {
      setConceptWidth((prev) => (prev === nextWidth ? prev : nextWidth));
      return;
    }
    if (boundary === "C") {
      setFormulaWidth((prev) => (prev === nextWidth ? prev : nextWidth));
      return;
    }
    if (boundary === "D") {
      setTutorWidth((prev) => (prev === nextWidth ? prev : nextWidth));
    }
  }, []);

  const onDragUp = useCallback(() => {
    stopDragging();
  }, [stopDragging]);

  const onDragLeave = useCallback(() => {
    stopDragging();
  }, [stopDragging]);

  const startDragging = useCallback((boundary, e) => {
    if (isMobile) return;
    e.preventDefault();
    stopDragging();

    let startWidth = 0;
    let min = 0;
    let max = 0;
    let direction = 1;

    if (boundary === "A") {
      startWidth = sidebarRenderWidth;
      min = PANEL_LIMITS.sidebar.min;
      max = getSidebarMax();
      direction = 1;
    } else if (boundary === "B") {
      startWidth = conceptRenderWidth;
      min = PANEL_LIMITS.concept.min;
      max = getConceptMax();
      direction = 1;
    } else if (boundary === "C") {
      startWidth = formulaRenderWidth;
      min = PANEL_LIMITS.formulas.min;
      max = getFormulaMax();
      direction = 1;
    } else if (boundary === "D") {
      startWidth = tutorRenderWidth;
      min = Math.min(PANEL_LIMITS.tutor.min, getTutorMax());
      max = getTutorMax();
      direction = -1;
    } else {
      return;
    }

    dragRef.current = {
      dragging: true,
      boundary,
      startX: e.clientX,
      startWidth,
      min,
      max,
      direction,
      onMouseMove: onDragMove,
      onMouseUp: onDragUp,
      onMouseLeave: onDragLeave,
    };
    setActiveHandle(boundary);

    bodyUserSelectRef.current = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";

    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", onDragUp);
    window.addEventListener("mouseleave", onDragLeave);
  }, [
    conceptRenderWidth,
    formulaRenderWidth,
    getConceptMax,
    getFormulaMax,
    getSidebarMax,
    getTutorMax,
    isMobile,
    onDragLeave,
    onDragMove,
    onDragUp,
    sidebarRenderWidth,
    stopDragging,
    tutorRenderWidth,
  ]);

  const resetBoundary = useCallback((boundary) => {
    if (boundary === "A") {
      setSidebarWidth(clamp(PANEL_DEFAULTS.sidebar, PANEL_LIMITS.sidebar.min, getSidebarMax()));
      return;
    }
    if (boundary === "B") {
      setConceptWidth(clamp(PANEL_DEFAULTS.concept, PANEL_LIMITS.concept.min, getConceptMax()));
      return;
    }
    if (boundary === "C") {
      setFormulaWidth(clamp(PANEL_DEFAULTS.formulas, PANEL_LIMITS.formulas.min, getFormulaMax()));
      return;
    }
    if (boundary === "D") {
      setTutorWidth(clamp(PANEL_DEFAULTS.tutor, PANEL_LIMITS.tutor.min, getTutorMax()));
    }
  }, [getConceptMax, getFormulaMax, getSidebarMax, getTutorMax]);

  useEffect(() => () => stopDragging(), [stopDragging]);

  const toggleSim = () => {
    if (canvasView !== "learn") setCanvasView("learn");
    setShowConceptInTightLayout(false);
    setShowSim((s) => !s);
  };

  const toggleFormulas = () => setShowFormulas((s) => !s);
  const toggleTutor = () => setShowTutor((s) => !s);

  const toggleCanvasProblems = () => {
    setShowConceptInTightLayout(false);
    setCanvasView((v) => v === "problems" ? "learn" : "problems");
  };

  const selectConcept = (conceptId) => {
    const hasVisualization = VIZ_CONCEPT_IDS.has(conceptId);
    setActiveConcept(conceptId);
    if (activeMode === "canvas") {
      if (canvasView !== "learn") setCanvasView("learn");
      if (hasVisualization) {
        setShowConceptInTightLayout(false);
        setShowSim(true);
      }
    }
  };

  const openMode = (mode) => {
    setActiveMode(mode);
    if (mode !== "canvas") {
      setShowFormulas(false);
      setShowTutor(false);
    }
    if (mode === "canvas") {
      setCanvasView("learn");
    }
  };

  const goHome = () => openMode("home");

  if (isMobile) {
    return (
      <div style={{
        height: "100vh", width: "100vw",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: T.bg0, padding: "40px 32px", textAlign: "center",
      }}>
        <GlobalStyle />
        <div style={{ fontFamily: T.brandMono, fontSize: 18, fontWeight: 500, letterSpacing: "0.18em", color: T.blue, marginBottom: 8 }}>
          PHASORA
        </div>
        <div style={{ fontFamily: T.brandSerif, fontStyle: "italic", fontSize: 13, color: T.text3, marginBottom: 32 }}>
          Desktop learning environment
        </div>
        <div style={{
          padding: "28px 24px", background: T.bg1, borderRadius: 12,
          border: `1px solid ${T.border}`, maxWidth: 360,
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        }}>
          <div style={{ fontSize: 28, marginBottom: 12 }}>&#9000;</div>
          <div style={{ fontSize: 16, fontWeight: 500, color: T.navy, marginBottom: 8 }}>
            Desktop Required
          </div>
          <div style={{ fontSize: 13, color: T.text2, lineHeight: 1.7 }}>
            Phasora's simulations and structured study layouts are designed for screens 900px or wider.
          </div>
        </div>
      </div>
    );
  }

  const showTopNav = activeMode === "canvas" || activeMode === "library";

  return (
    <div style={{
      display: "flex", flexDirection: "column",
      height: "100vh", width: "100vw",
      background: T.bg0, overflow: "hidden",
    }}>
      <GlobalStyle />

      {showTopNav && (
      <TopNav
          activeMode={activeMode}
          onGoHome={goHome}
          showSidebar={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
          showSim={showSim}
          showFormulas={showFormulas}
          showTutor={showTutor}
          canvasView={canvasView}
          onToggleSim={toggleSim}
          onToggleFormulas={toggleFormulas}
          onToggleProblems={toggleCanvasProblems}
          onToggleTutor={toggleTutor}
        />
      )}

      {activeMode === "home" && (
        <HomePage onSelectMode={openMode} />
      )}

      {activeMode === "canvas" && (
        <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
          <div style={{ position: "relative", display: "flex", height: "100%", flexShrink: 0 }}>
            <div style={{ pointerEvents: isDragging ? "none" : "auto" }}>
              <CurriculumSidebar
                activeConcept={activeConcept}
                expandedGroup={expandedGroup}
                setExpandedGroup={setExpandedGroup}
                onSelectConcept={selectConcept}
                collapsed={!sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                width={sidebarRenderWidth}
              />
            </div>
            {sidebarOpen && (
              <ResizeHandle
                id="Boundary A"
                side="right"
                onMouseDown={(e) => startDragging("A", e)}
                onDoubleClick={() => resetBoundary("A")}
              />
            )}
          </div>

          <div style={{
            width: formulaRenderWidth,
            flexShrink: 0,
            overflow: "visible",
            transition: activeHandle === "C" ? "none" : "width 0.25s ease",
            position: "relative",
          }}>
            {showFormulas && (
              <div style={{
                width: "100%",
                height: "100%",
                background: T.bg1,
                borderRight: `1px solid ${T.border}`,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                pointerEvents: isDragging ? "none" : "auto",
              }}>
                <div style={{
                  padding: "12px 14px",
                  borderBottom: `1px solid ${T.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexShrink: 0,
                }}>
                  <div style={{
                    fontFamily: T.brandMono,
                    fontSize: 10,
                    color: T.text2,
                    letterSpacing: "0.09em",
                    textTransform: "uppercase",
                  }}>
                    Formula Reference
                  </div>
                  <button
                    aria-label="Close formula panel"
                    onClick={() => setShowFormulas(false)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      color: T.text2,
                      fontSize: 16,
                      lineHeight: 1,
                      transition: "all 0.15s ease",
                    }}
                  >
                    ×
                  </button>
                </div>
                <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 12px 14px" }}>
                  {FORMULAS.map((formula) => (
                    <FormulaCard key={formula.id} formula={formula} />
                  ))}
                </div>
              </div>
            )}
            {showFormulas && (
              <ResizeHandle
                id="Boundary C"
                side="right"
                onMouseDown={(e) => startDragging("C", e)}
                onDoubleClick={() => resetBoundary("C")}
              />
            )}
          </div>

          <div
            ref={mainContentRef}
            style={{
              flex: 1,
              width: "100%",
              minWidth: MIN_MAIN_WIDTH,
              display: "flex",
              overflow: "hidden",
              transition: "all 0.25s ease",
            }}
          >
            {canvasView === "problems" ? (
              <div
                className="fadeIn"
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "40px 34px",
                  pointerEvents: isDragging ? "none" : "auto",
                }}
              >
                <div style={{ maxWidth: 720, margin: "0 auto" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: T.blue, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                    Practice
                  </div>
                  <h1 style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: 30, color: T.navy, marginBottom: 10, fontWeight: 400 }}>
                    Practice Problems
                  </h1>
                  <p style={{ fontSize: 14, color: T.text2, marginBottom: 28, lineHeight: 1.75 }}>
                    AI-generated physics problems with step-by-step solutions. Select a topic and difficulty, then generate.
                  </p>
                  <ProblemsTab />
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, width: "100%", minWidth: 0, display: "flex", overflow: "hidden", height: "100%" }}>
                {(!panelOpen || showConceptOnlyInConstrained || !constrainedCanvas) && (
                  <div style={{
                    position: "relative",
                    flex: panelOpen ? "0 0 auto" : 1,
                    flexShrink: panelOpen ? 0 : 1,
                    width: panelOpen ? conceptRenderWidth : "100%",
                    minWidth: panelOpen ? PANEL_LIMITS.concept.min : 0,
                    maxWidth: panelOpen ? PANEL_LIMITS.concept.max : "100%",
                    transition: activeHandle === "B" ? "none" : "width 0.25s ease",
                    height: "100%",
                    overflow: "visible",
                    display: "flex",
                    flexDirection: "column",
                    borderRight: panelOpen && !constrainedCanvas ? `1px solid ${T.border}` : "none",
                    background: T.bg1,
                    boxShadow: panelOpen && !constrainedCanvas ? "2px 0 8px rgba(0,0,0,0.04)" : "none",
                    zIndex: panelOpen ? 1 : "auto",
                    pointerEvents: isDragging ? "none" : "auto",
                  }}>
                    <div style={{ flex: 1, minHeight: 0, overflowY: "auto", overflowX: "hidden" }}>
                      {constrainedCanvas && panelOpen && showConceptOnlyInConstrained && (
                        <div style={{ padding: "12px 14px 0" }}>
                          <button
                            onClick={() => setShowConceptInTightLayout(false)}
                            style={{
                              padding: "5px 10px",
                              borderRadius: 999,
                              border: `1px solid ${T.border}`,
                              background: T.bg1,
                              color: T.text1,
                              fontFamily: T.brandMono,
                              fontSize: 10,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              transition: "all 0.15s ease",
                            }}
                          >
                            Back To Simulation
                          </button>
                        </div>
                      )}
                      <ConceptView conceptId={activeConcept} compact={panelOpen} />
                    </div>
                    {panelOpen && !constrainedCanvas && !showConceptOnlyInConstrained && (
                      <ResizeHandle
                        id="Boundary B"
                        side="right"
                        onMouseDown={(e) => startDragging("B", e)}
                        onDoubleClick={() => resetBoundary("B")}
                      />
                    )}
                  </div>
                )}

                {panelOpen && (!constrainedCanvas || !showConceptOnlyInConstrained) && (
                  <div style={{
                    flex: 1,
                    minWidth: 0,
                    overflowY: "auto",
                    overflowX: "hidden",
                    height: "100%",
                    background: T.bg0,
                    pointerEvents: isDragging ? "none" : "auto",
                  }}>
                    <div style={{
                      animation: "slideInRight 0.3s ease",
                      padding: "20px 22px 18px",
                      minWidth: 0,
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                    }}>
                      {constrainedCanvas && (
                        <div style={{ marginBottom: 8 }}>
                          <button
                            onClick={() => setShowConceptInTightLayout(true)}
                            style={{
                              padding: "5px 10px",
                              borderRadius: 999,
                              border: `1px solid ${T.border}`,
                              background: T.bg1,
                              color: T.text1,
                              fontFamily: T.brandMono,
                              fontSize: 10,
                              letterSpacing: "0.06em",
                              textTransform: "uppercase",
                              transition: "all 0.15s ease",
                            }}
                          >
                            Show Concept
                          </button>
                        </div>
                      )}
                      {vizMode === "sho" ? <SHOSim /> : <ProjectileSim />}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{
            width: tutorRenderWidth,
            flexShrink: 0,
            overflow: "visible",
            transition: activeHandle === "D" ? "none" : "width 0.25s ease",
            position: "relative",
          }}>
            {showTutor && (
              <div style={{
                width: "100%",
                height: "100%",
                background: T.bg1,
                borderLeft: `1px solid ${T.border}`,
                boxShadow: "-2px 0 8px rgba(0,0,0,0.05)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                pointerEvents: isDragging ? "none" : "auto",
              }}>
                <div style={{
                  padding: "12px 14px",
                  borderBottom: `1px solid ${T.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexShrink: 0,
                }}>
                  <div style={{
                    fontFamily: T.brandMono,
                    fontSize: 10,
                    color: T.blue,
                    letterSpacing: "0.09em",
                    textTransform: "uppercase",
                  }}>
                    Phasora Tutor
                  </div>
                  <button
                    aria-label="Close tutor panel"
                    onClick={() => setShowTutor(false)}
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 6,
                      color: T.text2,
                      fontSize: 16,
                      lineHeight: 1,
                      transition: "all 0.15s ease",
                    }}
                  >
                    ×
                  </button>
                </div>
                <div style={{ flex: 1, minHeight: 0, padding: 12, overflow: "hidden" }}>
                  <TutorPanel minHeight={0} />
                </div>
              </div>
            )}
            {showTutor && (
              <ResizeHandle
                id="Boundary D"
                side="left"
                onMouseDown={(e) => startDragging("D", e)}
                onDoubleClick={() => resetBoundary("D")}
              />
            )}
          </div>
        </div>
      )}
      {activeMode === "library" && (
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <div style={{ position: "relative", display: "flex", height: "100%", flexShrink: 0 }}>
            <div style={{ pointerEvents: isDragging ? "none" : "auto" }}>
              <CurriculumSidebar
                activeConcept={activeConcept}
                expandedGroup={expandedGroup}
                setExpandedGroup={setExpandedGroup}
                onSelectConcept={selectConcept}
                collapsed={false}
                width={sidebarRenderWidth}
              />
            </div>
            <ResizeHandle
              id="Boundary A"
              side="right"
              onMouseDown={(e) => startDragging("A", e)}
              onDoubleClick={() => resetBoundary("A")}
            />
          </div>
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", pointerEvents: isDragging ? "none" : "auto" }}>
            <ConceptView conceptId={activeConcept} library />
          </div>
        </div>
      )}

      {activeMode === "problems" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 24px 42px" }}>
          <div style={{ maxWidth: 1040, margin: "0 auto" }}>
            <BackHomeButton onClick={goHome} />
            <div style={{ maxWidth: 800, margin: "18px auto 0" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.blue, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                Problem Mode
              </div>
              <h1 style={{ fontFamily: T.serif, fontStyle: "italic", fontSize: 32, color: T.navy, marginBottom: 10, fontWeight: 400 }}>
                Focused Problem Practice
              </h1>
              <p style={{ fontSize: 14, color: T.text2, marginBottom: 24, lineHeight: 1.75 }}>
                Choose a topic and difficulty, then generate a fresh problem with a worked solution.
              </p>
              <div style={{
                background: T.bg1,
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                padding: "22px 22px 24px",
                boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
              }}>
                <ProblemsTab />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeMode === "tutor" && (
        <div style={{ flex: 1, overflow: "hidden", padding: "24px 24px 34px" }}>
          <div style={{ maxWidth: 1000, height: "100%", margin: "0 auto", display: "flex", flexDirection: "column" }}>
            <BackHomeButton onClick={goHome} />
            <div style={{
              margin: "16px auto 0",
              width: "100%",
              maxWidth: 700,
              minHeight: 0,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              background: T.bg1,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
              padding: "18px 18px 16px",
            }}>
              <div style={{
                fontFamily: T.brandMono,
                fontSize: 10,
                color: T.blue,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 6,
              }}>
                AI Tutor
              </div>
              <div style={{ fontSize: 14, color: T.text2, marginBottom: 14 }}>
                Ask concept questions, request intuition, or get step-by-step help.
              </div>
              <div style={{ flex: 1, minHeight: 0 }}>
                <TutorPanel starterPrompts={TUTOR_STARTERS} minHeight={540} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeMode === "canvas" && showOnboarding && (
        <>
          <div style={{
            position: "fixed", inset: 0,
            background: "rgba(15,23,42,0.35)",
            backdropFilter: "blur(4px)",
            zIndex: 200,
          }} />
          <div style={{
            position: "fixed", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 440, background: T.bg1, borderRadius: 14,
            border: `1px solid ${T.border}`,
            boxShadow: "0 8px 40px rgba(15,23,42,0.18)",
            zIndex: 201, padding: "36px 32px 28px",
            animation: "fadeIn 0.3s ease",
          }}>
            <div style={{ fontFamily: T.brandMono, fontSize: 16, fontWeight: 500, letterSpacing: "0.18em", color: T.blue, marginBottom: 4 }}>
              PHASORA
            </div>
            <div style={{ fontFamily: T.brandSerif, fontStyle: "italic", fontSize: 13, color: T.text3, marginBottom: 20 }}>
              Your interactive physics canvas
            </div>
            <div style={{ fontSize: 14, color: T.text1, lineHeight: 1.75, marginBottom: 22 }}>
              Welcome! Here's how to get started:
            </div>
            {[
              ["1", "Pick a topic", "Use the sidebar on the left to browse Classical Mechanics concepts."],
              ["2", "Explore visually", "Use Visualize and Formulas tabs to open dynamic panels."],
              ["3", "Practice", "Use Problems in the tab bar or Problem Mode on Home."],
              ["4", "Ask the tutor", "Open Ask Phasora for quick intuition and derivations."],
            ].map(([n, title, desc]) => (
              <div key={n} style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                  background: T.blueGlow, border: `1px solid ${T.border2}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: T.brandMono, fontSize: 12, fontWeight: 600, color: T.blue,
                }}>{n}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.navy }}>{title}</div>
                  <div style={{ fontSize: 12, color: T.text2, lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
            <button
              onClick={() => { localStorage.setItem("phasora_onboarded", "1"); setShowOnboarding(false); }}
              style={{
                width: "100%", marginTop: 10, padding: "10px 0",
                borderRadius: 8, border: "none",
                background: T.blue, color: "#fff",
                fontSize: 13, fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(29,78,216,0.22)",
                transition: "all 0.15s ease",
              }}
            >Get Started</button>
          </div>
        </>
      )}
    </div>
  );
}
