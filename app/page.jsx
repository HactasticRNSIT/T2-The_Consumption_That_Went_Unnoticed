"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types & Constants ───────────────────────────────────────────────────────

const WASTE_FACTORS = {
  foodDelivery: { packaging: 0.18, cost: 220 },      // kg per order, ₹ per order
  bottles: { weight: 0.025, cost: 15 },               // kg per bottle
  shopping: { packaging: 0.22, cost: 800 },           // kg per order, ₹ per order
  clothing: { weight: 0.45, cost: 1200 },             // kg per item
  electronics: { weight: 0.8, yearlyFactor: 1 },      // kg per device per year
  disposable: { low: 0.5, medium: 1.2, high: 2.5 },  // kg per month
};

const CHALLENGES = [
  { id: 1, icon: "🫙", title: "No Plastic Bottle Week", desc: "Use a reusable bottle for 7 days", points: 50, color: "#0E3B2E" },
  { id: 2, icon: "🛍️", title: "Reusable Bag Challenge", desc: "Ditch single-use bags for a month", points: 40, color: "#1a4d3e" },
  { id: 3, icon: "🥗", title: "Zero Waste Lunch Challenge", desc: "Pack a waste-free lunch every day", points: 60, color: "#0c3028" },
  { id: 4, icon: "👗", title: "Fashion Freeze Challenge", desc: "No new clothing purchases this month", points: 80, color: "#0e3b2e" },
];

const WASTE_COMPARISONS = [
  { max: 10, icon: "💻", label: "25 laptops", desc: "Your waste is feather-light" },
  { max: 25, icon: "🪑", label: "Full office chair", desc: "Something you sit on daily" },
  { max: 60, icon: "🛵", label: "Small scooter", desc: "A vehicle you could ride" },
  { max: 120, icon: "🧊", label: "2 refrigerators", desc: "Appliances that cool your home" },
  { max: 500, icon: "🌋", label: "Small volcano of waste", desc: "A significant environmental impact" },
  { max: 999, icon: "⛰️", label: "Mini mountain of trash", desc: "A serious environmental burden" },
  { max: Infinity, icon: "🏔️", label: "Massive mountain of waste", desc: "An urgent call to action" },
];

const CHAT_RESPONSES = {
  "kitchen waste": "Great question! Start by composting food scraps — fruit peels, coffee grounds, and vegetable cuttings make excellent compost. Store groceries properly to avoid spoilage, plan meals weekly, and buy only what you need. Even small changes can cut kitchen waste by 40%.",
  "wet waste":"Great question! Start by composting food scraps — fruit peels, coffee grounds, and vegetable cuttings make excellent compost. Store groceries properly to avoid spoilage, plan meals weekly, and buy only what you need. Even small changes can cut kitchen waste by 40%.",
  "bottled water": "Switch to a stainless steel or glass bottle with a filter. A ₹800 bottle pays for itself in 2 months vs. buying ₹20 water bottles daily. In India, a Tata Swach or Kent filter can also purify tap water safely and cheaply.",
  "food delivery": "Batch your food orders to 1-2 times a week instead of daily. Ask restaurants to skip cutlery and extra packaging. Opt for delivery platforms that use eco-packaging. Cooking even 3 meals at home per week can cut delivery waste by 43%.",
  "clothing": "Buy fewer, better-quality pieces. Explore second-hand shops, clothing swaps, and brands like No Nasties or Doodlage that use sustainable materials. Extend garment life by washing in cold water and air drying.",
  "electronic": "Before replacing a device, explore repair. iFixit guides help for phones and laptops. Many Indian cities have affordable repair shops. Extending your phone's life by just one year saves ~50kg of e-waste.",
  "paper": "Adopting digital paperless workflow,printing double-sided, reusing scrap paper,and recycling whenever possible.",
  "metal":"Reduce metal waste by prioritizing the 5 Rs—refuse, reduce, reuse, repurpose, and recycle—such as buying in bulk, repairing items, and properly segregating scrap for recycling.",
  "plastic":"Minimize plastic waste by using reusable alternatives, avoiding single-use plastics, supporting brands with sustainable packaging, and participating in local recycling programs to ensure proper disposal.",
  "toys":"Minimize plastic waste by using reusable alternatives, avoiding single-use plastics, supporting brands with sustainable packaging, and participating in local recycling programs to ensure proper disposal.",
  "default": "I'm EcoLens AI! Ask me about reducing kitchen waste, alternatives to bottled water, food delivery impact, sustainable clothing, or electronics longevity. I'm here to help you live lighter on the planet. 🌱",
};



// ─── Utility Functions ───────────────────────────────────────────────────────

function calculateResults(inputs) {
  const foodWaste = inputs.foodDeliveries * 52 * WASTE_FACTORS.foodDelivery.packaging;
  const bottleWaste = inputs.plasticBottles * 52 * WASTE_FACTORS.bottles.weight;
  const shoppingWaste = inputs.shoppingOrders * 12 * WASTE_FACTORS.shopping.packaging;
  const clothingWaste = inputs.clothingPurchases * 12 * WASTE_FACTORS.clothing.weight;
  const electronicsWaste = (12 / Math.max(inputs.electronicsFreq, 1)) * WASTE_FACTORS.electronics.weight;
  const disposableWaste = 12 * WASTE_FACTORS.disposable[inputs.disposable] * inputs.householdSize;

  const annualWaste = foodWaste + bottleWaste + shoppingWaste + clothingWaste + electronicsWaste + disposableWaste;
  const monthlyWaste = annualWaste / 12;

  const foodCost = inputs.foodDeliveries * 52 * WASTE_FACTORS.foodDelivery.cost;
  const bottleCost = inputs.plasticBottles * 52 * WASTE_FACTORS.bottles.cost;
  const shoppingCost = inputs.shoppingOrders * 12 * WASTE_FACTORS.shopping.cost * 0.15;
  const clothingCost = inputs.clothingPurchases * 12 * WASTE_FACTORS.clothing.cost * 0.2;
  const moneyWasted = foodCost + bottleCost + shoppingCost + clothingCost;

  const maxWaste = 500;
  const ecoScore = Math.max(0, Math.min(100, Math.round(100 - (annualWaste / maxWaste) * 100)));

  const carbonRisk = annualWaste < 80 ? "Low" : annualWaste < 200 ? "Medium" : "High";

  const breakdown = {
    "Food Packaging": Math.round(foodWaste),
    "Plastic Bottles": Math.round(bottleWaste),
    "Shopping Pkg": Math.round(shoppingWaste),
    "Clothing Waste": Math.round(clothingWaste),
    "Electronics": Math.round(electronicsWaste + disposableWaste),
  };

  return { annualWaste: Math.round(annualWaste), monthlyWaste: Math.round(monthlyWaste), moneyWasted: Math.round(moneyWasted), ecoScore, carbonRisk, breakdown };
}

function simulateSavings(inputs, reductions) {
  const base = calculateResults(inputs);
  const modified = {
    ...inputs,
    foodDeliveries: inputs.foodDeliveries * (1 - reductions.food / 100),
    plasticBottles: inputs.plasticBottles * (1 - reductions.bottles / 100),
    shoppingOrders: inputs.shoppingOrders * (1 - reductions.shopping / 100),
    clothingPurchases: inputs.clothingPurchases * (1 - reductions.clothing / 100),
  };
  const improved = calculateResults(modified);
  const wasteReduced = Math.round(((base.annualWaste - improved.annualWaste) / base.annualWaste) * 100);
  const moneySaved = Math.round(base.moneyWasted - improved.moneyWasted);
  return { improved, wasteReduced, moneySaved };
}

function getInsights(inputs, results) {
  const tips = [];
  if (inputs.plasticBottles > 5) tips.push({ icon: "🫙", title: "Switch to Reusable Bottle", desc: `Save ₹${Math.round(inputs.plasticBottles * 52 * WASTE_FACTORS.bottles.cost).toLocaleString("en-IN")}/year by replacing plastic bottles with a steel bottle.` });
  if (inputs.foodDeliveries > 3) tips.push({ icon: "📦", title: "Batch Your Deliveries", desc: `Order once or twice a week instead of daily — cuts packaging waste by ~${Math.round(inputs.foodDeliveries * 0.4)} kg/year.` });
  if (inputs.clothingPurchases > 2) tips.push({ icon: "👗", title: "Embrace Slow Fashion", desc: "Buy 2 quality pieces instead of 8 cheap ones. Reduce textile waste and save ₹" + Math.round(inputs.clothingPurchases * 12 * WASTE_FACTORS.clothing.cost * 0.15).toLocaleString("en-IN") + "/year." });
  if (inputs.electronicsFreq < 3) tips.push({ icon: "📱", title: "Extend Device Lifecycle", desc: "Adding just 1 more year to your device lifespan avoids ~0.8kg of e-waste and saves ₹8,000–20,000." });
  if (inputs.shoppingOrders > 6) tips.push({ icon: "🛒", title: "Consolidate Online Orders", desc: "Combine multiple carts into one order per week to reduce packaging and delivery emissions." });
  if (results.ecoScore < 50) tips.push({ icon: "🌱", title: "Start Small — Pick One Habit", desc: "Focus on the single biggest waste source first. Even a 20% reduction in your top category adds up to meaningful change." });
  return tips.slice(0, 4);
}

function getChatResponse(message) {
  const lower = message.toLowerCase();
  for (const [key, response] of Object.entries(CHAT_RESPONSES)) {
    if (key !== "default" && lower.includes(key)) return response;
  }
  return CHAT_RESPONSES.default;
}

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useCountUp(target, duration = 1500, active = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active || target === 0) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, active, duration]);
  return value;
}

function useInView(threshold = 0.1) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AnimatedCounter({ value, prefix = "", suffix = "", active }) {
  const count = useCountUp(value, 1500, active);
  return <span>{prefix}{count.toLocaleString("en-IN")}{suffix}</span>;
}

function EcoScoreRing({ score, active }) {
  const animated = useCountUp(score, 1800, active);
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animated / 100) * circumference;
  const color = score < 41 ? "#ef4444" : score < 71 ? "#f59e0b" : "#7EE7C1";
  const label = score < 41 ? "Needs Attention" : score < 71 ? "Improving" : "Excellent";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{ position: "relative", width: 200, height: 200 }}>
        <svg width="200" height="200" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="12" />
          <circle cx="100" cy="100" r={radius} fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 1.8s cubic-bezier(0.34,1.56,0.64,1)", strokeLinecap: "round" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 42, fontWeight: 800, color, fontFamily: "Montserrat, sans-serif", lineHeight: 1 }}>{animated}</span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", letterSpacing: 2, marginTop: 4 }}>ECO SCORE</span>
        </div>
      </div>
      <div style={{ background: color + "22", border: `1px solid ${color}44`, borderRadius: 20, padding: "6px 20px" }}>
        <span style={{ color, fontSize: 13, fontWeight: 600 }}>{label}</span>
      </div>
    </div>
  );
}

function DonutChart({ data }) {
  const colors = ["#7EE7C1", "#4CAF82", "#2E8B6A", "#1a5c47", "#0E3B2E"];
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  const entries = Object.entries(data);
  let cumulative = 0;
  const slices = entries.map(([label, value], i) => {
    const pct = value / total;
    const start = cumulative;
    cumulative += pct;
    return { label, value, pct, start, color: colors[i] };
  });

  const size = 220;
  const cx = size / 2, cy = size / 2, r = 80, inner = 50;

  function polarToXY(cx, cy, r, angle) {
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  }

  function slicePath(cx, cy, r, inner, startFrac, endFrac) {
    const s = startFrac * 2 * Math.PI - Math.PI / 2;
    const e = endFrac * 2 * Math.PI - Math.PI / 2;
    const large = endFrac - startFrac > 0.5 ? 1 : 0;
    const p1 = polarToXY(cx, cy, r, s);
    const p2 = polarToXY(cx, cy, r, e);
    const p3 = polarToXY(cx, cy, inner, e);
    const p4 = polarToXY(cx, cy, inner, s);
    return `M ${p1.x} ${p1.y} A ${r} ${r} 0 ${large} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${inner} ${inner} 0 ${large} 0 ${p4.x} ${p4.y} Z`;
  }

  const [hovered, setHovered] = useState(null);

  return (
    <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        {slices.map((s, i) => (
          <path key={s.label}
            d={slicePath(cx, cy, hovered === i ? r + 8 : r, inner, s.start, s.start + s.pct)}
            fill={s.color} style={{ transition: "d 0.2s ease", cursor: "pointer" }}
            onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} />
        ))}
        <text x={cx} y={cy - 8} textAnchor="middle" fill="white" fontSize="18" fontWeight="700" fontFamily="Montserrat">
          {total}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="11">kg/year</text>
        {hovered !== null && (
          <text x={cx} y={cy + 30} textAnchor="middle" fill={slices[hovered].color} fontSize="12">
            {slices[hovered].label}: {slices[hovered].value}kg
          </text>
        )}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {slices.map((s, i) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 10, opacity: hovered === null || hovered === i ? 1 : 0.4, transition: "opacity 0.2s" }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>{s.label}</span>
            <span style={{ fontSize: 13, color: s.color, fontWeight: 600, marginLeft: "auto" }}>{s.value}kg</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function FiveYearChart({ original, current, improved }) {
  const years = [0, 1, 2, 3, 4, 5];
  const maxVal = Math.max(original, current,improved) * 5 * 1.15;
  const W = 500, H = 220, pad = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  function toX(i) { return pad.left + (i / 5) * chartW; }
  function toY(v) { return pad.top + chartH - (v / maxVal) * chartH; }

  const originalPoints = years.map(y => ({ x: toX(y), y: toY(original * y) }));
  const currentPoints  = years.map(y => ({ x: toX(y), y: toY(current  * y) }));
  const improvedPoints = years.map(y => ({ x: toX(y), y: toY(improved * y) }));

  const originalPath = originalPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const currentPath  = currentPoints.map((p, i)  => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const improvedPath = improvedPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", maxWidth: W }}>
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map(pct => (
        <line key={pct} x1={pad.left} x2={W - pad.right}
          y1={pad.top + chartH * (1 - pct)} y2={pad.top + chartH * (1 - pct)}
          stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      ))}

      {/* X-axis labels */}
      {years.map(y => (
        <text key={y} x={toX(y)} y={H - 10} textAnchor="middle"
          fill="rgba(255,255,255,0.4)" fontSize="11">
          {y === 0 ? "Now" : `Y${y}`}
        </text>
      ))}

      {/* Max value label */}
      <text x={pad.left - 8} y={pad.top + 4} textAnchor="end"
        fill="rgba(255,255,255,0.4)" fontSize="10">
        {Math.round(maxVal)}kg
      </text>

      {/* ── PREVIOUS PATH (grey dashed) — always rendered ── */}
      <>
        <path d={originalPath} fill="none" stroke="rgba(255,255,255,0.35)"
          strokeWidth="2" strokeDasharray="4,4" />
        {originalPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3.5"
            fill="rgba(255,255,255,0.35)" />
        ))}
      </>

      {/* ── CURRENT PATH (red dashed) ── */}
      <path d={currentPath} fill="none" stroke="#ef4444"
        strokeWidth="2.5" strokeDasharray="6,3" />
      {currentPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#ef4444" />
      ))}

      {/* ── SUSTAINABLE PATH (mint green solid) ── */}
      <path d={improvedPath} fill="none" stroke="#7EE7C1" strokeWidth="2.5" />
      {improvedPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#7EE7C1" />
      ))}
      <rect x={W - 185} y={pad.top} width="165" height={90}
        rx="6" fill="rgba(0,0,0,0.35)" />

      {/* Legend — Previous (always shown) */}
      <>
        <circle cx={W - 173} cy={pad.top + 14} r="4" fill="rgba(255,255,255,0.4)" />
        <text x={W - 163} y={pad.top + 18} fill="rgba(255,255,255,0.5)" fontSize="11">
          Previous path
        </text>
      </>

      
      

      {/* Legend — Current */}
     
      <circle cx={W - 173} cy={pad.top + 54} r="4" fill="#7EE7C1" />
      <text x={W - 163} y={pad.top + 58}
        fill="rgba(255,255,255,0.7)" fontSize="11">
        Sustainable path
      </text>
      {/* Legend — Sustainable */}
      <circle cx={W - 173} cy={pad.top + (original !== current ? 54 : 34)} r="4" fill="#7EE7C1" />
      <text x={W - 163} y={pad.top + (original !== current ? 58 : 38)}
        fill="rgba(255,255,255,0.7)" fontSize="11">
        Sustainable path
      </text>
    </svg>
  );
}

function FloatingBot({ chatOpen, setChatOpen }) {
  const [messages, setMessages] = useState([{ from: "bot", text: "Hi! I'm your EcoLens AI assistant 🌿 Ask me how to reduce your waste, find greener alternatives, or understand your impact." }]);
  const [input, setInput] = useState("");
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  function send() {
    if (!input.trim()) return;
    const userMsg = { from: "user", text: input };
    const botMsg = { from: "bot", text: getChatResponse(input) };
    setMessages(prev => [...prev, userMsg, botMsg]);
    setInput("");
  }

  return (
    <>
      <button onClick={() => setChatOpen(!chatOpen)}
        style={{ position: "fixed", bottom: 28, right: 28, width: 60, height: 60, borderRadius: "50%", background: "linear-gradient(135deg, #0E3B2E, #7EE7C1)", border: "none", cursor: "pointer", fontSize: 26, boxShadow: "0 8px 32px rgba(126,231,193,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.2s" }}
        onMouseEnter={e => e.target.style.transform = "scale(1.1)"}
        onMouseLeave={e => e.target.style.transform = "scale(1)"}>
        {chatOpen ? "✕" : "🌱"}
      </button>
      {chatOpen && (
        <div style={{ position: "fixed", bottom: 100, right: 28, width: 340, maxHeight: 480, background: "#0f2d24", border: "1px solid rgba(126,231,193,0.2)", borderRadius: 20, display: "flex", flexDirection: "column", zIndex: 999, boxShadow: "0 24px 80px rgba(0,0,0,0.5)" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #0E3B2E, #7EE7C1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌿</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#7EE7C1" }}>EcoLens AI</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Always here to help</div>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.from === "user" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "82%", background: m.from === "user" ? "linear-gradient(135deg, #0E3B2E, #1a5c47)" : "rgba(255,255,255,0.05)", border: `1px solid ${m.from === "user" ? "rgba(126,231,193,0.2)" : "rgba(255,255,255,0.08)"}`, borderRadius: m.from === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "10px 14px", fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.5 }}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 8 }}>
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask about reducing waste..."
              style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "white", outline: "none" }} />
            <button onClick={send} style={{ width: 40, height: 40, borderRadius: 12, background: "#7EE7C1", border: "none", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>↑</button>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function EcoLensApp() {
  const [inputs, setInputs] = useState({
    foodDeliveries: 5, plasticBottles: 7, shoppingOrders: 4,
    clothingPurchases: 3, householdSize: 2, electronicsFreq: 24, disposable: "medium",
  });
  const [originalResults, setOriginalResults] = useState(null);
  const [results, setResults] = useState(null);
  const [reductions, setReductions] = useState({ food: 30, bottles: 80, shopping: 40, clothing: 50 });
  const [chatOpen, setChatOpen] = useState(false);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [dashRef, dashInView] = useInView(0.1);
  const [heroRef, heroInView] = useInView(0.1);

  const handleAnalyze = () => {
    const r = calculateResults(inputs);
    setResults(r);
    setOriginalResults(r);
    setTimeout(() => { setShowResults(true); document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }); }, 100);
  };

  const sim = results ? simulateSavings(inputs, reductions) : null;

  const wasteComparison = results ? WASTE_COMPARISONS.find(w => results.annualWaste <= w.max) || WASTE_COMPARISONS[WASTE_COMPARISONS.length - 1] : null;

  const insights = results ? getInsights(inputs, results) : [];

  const SliderInput = ({ label, field, min, max, step = 1, unit = "" }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: "Montserrat, sans-serif" }}>{label}</label>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#7EE7C1" }}>{inputs[field]}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={inputs[field]}
        onChange={e => setInputs(p => ({ ...p, [field]: Number(e.target.value) }))}
        style={{ width: "100%", accentColor: "#7EE7C1", cursor: "pointer" }} />
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{min}{unit}</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{max}{unit}</span>
      </div>
    </div>
  );

  const SimSlider = ({ label, field }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{label}</label>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#7EE7C1" }}>{reductions[field]}% less</span>
      </div>
      <input type="range" min={0} max={100} step={5} value={reductions[field]}
        onChange={e => setReductions(p => ({ ...p, [field]: Number(e.target.value) }))}
        style={{ width: "100%", accentColor: "#7EE7C1", cursor: "pointer" }} />
    </div>
  );

  const cardStyle = (extra = {}) => ({
    background: "rgba(14,59,46,0.3)", backdropFilter: "blur(20px)",
    border: "1px solid rgba(126,231,193,0.15)", borderRadius: 20,
    padding: 28, ...extra,
  });

  const sectionTitleStyle = {
    fontSize: 28, fontWeight: 800, color: "white", fontFamily: "Montserrat, sans-serif",
    marginBottom: 8, lineHeight: 1.2,
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050f0c", fontFamily: "'Montserrat', 'Inter', sans-serif", color: "white", overflowX: "hidden" }}>
      

      {/* Background mesh */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: -200, left: -200, width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(14,59,46,0.4) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", top: "40%", right: -150, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(126,231,193,0.08) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -100, left: "30%", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(14,59,46,0.3) 0%, transparent 70%)" }} />
      </div>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(20px)", background: "rgba(5,15,12,0.8)", borderBottom: "1px solid rgba(126,231,193,0.1)", padding: "16px 48px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #0E3B2E, #7EE7C1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌿</div>
          <span style={{ fontSize: 20, fontWeight: 800, background: "linear-gradient(135deg, #7EE7C1, #4CAF82)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>EcoLens AI</span>
        </div>
        <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
          {["Dashboard", "Features", "Contact"].map(link => (
            <a key={link} href="#" style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => e.target.style.color = "#7EE7C1"}
              onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.5)"}>{link}</a>
          ))}
        </div>
      </nav>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── HERO ─────────────────────────────────── */}
        <section ref={heroRef} style={{ minHeight: "92vh", display: "flex", alignItems: "center", padding: "80px 48px", maxWidth: 1280, margin: "0 auto", gap: 60 }}>
          <div style={{ flex: 1, opacity: heroInView ? 1 : 0, transform: heroInView ? "translateY(0)" : "translateY(40px)", transition: "all 0.9s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(126,231,193,0.1)", border: "1px solid rgba(126,231,193,0.3)", borderRadius: 20, padding: "6px 16px", marginBottom: 24 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#7EE7C1", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 12, color: "#7EE7C1", letterSpacing: 1, fontWeight: 600 }}>AI-POWERED SUSTAINABILITY PLATFORM</span>
            </div>
            <h1 style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 900, lineHeight: 1.1, marginBottom: 24, color: "white" }}>
              Your Everyday Choices Create{" "}
              <span style={{ background: "linear-gradient(135deg, #7EE7C1, #4CAF82)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Hidden Mountains</span>
              {" "}of Waste
            </h1>
            <p style={{ fontSize: 18, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, maxWidth: 560, marginBottom: 40 }}>
              EcoLens AI reveals your waste footprint, money leakage, and future environmental impact in seconds. See what you've been missing.
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <button onClick={() => document.getElementById("assessment")?.scrollIntoView({ behavior: "smooth" })}
                style={{ background: "linear-gradient(135deg, #0E3B2E, #1a5c47)", border: "1px solid rgba(126,231,193,0.3)", color: "#7EE7C1", padding: "16px 36px", borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.3s", fontFamily: "Montserrat, sans-serif" }}
                onMouseEnter={e => { e.target.style.transform = "translateY(-3px)"; e.target.style.boxShadow = "0 16px 48px rgba(126,231,193,0.25)"; }}
                onMouseLeave={e => { e.target.style.transform = "translateY(0)"; e.target.style.boxShadow = "none"; }}>
                🌱 Start Assessment
              </button>
              <button onClick={() => { const demo = { foodDeliveries: 8, plasticBottles: 14, shoppingOrders: 7, clothingPurchases: 5, householdSize: 3, electronicsFreq: 18, disposable: "high" }; setInputs(demo); setTimeout(() => { const r = calculateResults(demo); setResults(r); setShowResults(true); setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100); }, 100); }}
                style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.7)", padding: "16px 36px", borderRadius: 14, fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "all 0.3s", fontFamily: "Montserrat, sans-serif" }}
                onMouseEnter={e => { e.target.style.borderColor = "rgba(126,231,193,0.4)"; e.target.style.color = "#7EE7C1"; }}
                onMouseLeave={e => { e.target.style.borderColor = "rgba(255,255,255,0.15)"; e.target.style.color = "rgba(255,255,255,0.7)"; }}>
                View Demo
              </button>
            </div>

            <div style={{ display: "flex", gap: 40, marginTop: 60, paddingTop: 40, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              {[["12M+", "kg Waste Analyzed"], ["₹2.4B", "Money Saved"], ["98%", "Accuracy Rate"]].map(([val, lbl]) => (
                <div key={lbl}>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "#7EE7C1" }}>{val}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual */}
          <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", opacity: heroInView ? 1 : 0, transition: "opacity 1.2s ease 0.3s" }}>
            <div style={{ position: "relative", width: 380, height: 380 }}>
              <svg viewBox="0 0 400 400" style={{ width: "100%", height: "100%" }}>
                {/* Outer rings */}
                {[160, 140, 120].map((r, i) => (
                  <circle key={r} cx="200" cy="200" r={r} fill="none"
                    stroke={`rgba(126,231,193,${0.06 + i * 0.03})`} strokeWidth={i === 0 ? 1 : 0.5}
                    strokeDasharray={i === 1 ? "4,8" : i === 2 ? "2,12" : "none"} />
                ))}
                {/* Orbiting dots */}
                {[0, 60, 120, 180, 240, 300].map((deg, i) => {
                  const r = 160;
                  const rad = (deg * Math.PI) / 180;
                  const x = 200 + r * Math.cos(rad);
                  const y = 200 + r * Math.sin(rad);
                  const icons = ["🍕", "🛍️", "👗", "📱", "🫙", "🚚"];
                  return (
                    <g key={deg}>
                      <circle cx={x} cy={y} r="24" fill="rgba(14,59,46,0.8)" stroke="rgba(126,231,193,0.3)" strokeWidth="1" />
                      <text x={x} y={y + 7} textAnchor="middle" fontSize="18">{icons[i]}</text>
                    </g>
                  );
                })}
                {/* Center */}
                <circle cx="200" cy="200" r="60" fill="rgba(14,59,46,0.9)" stroke="rgba(126,231,193,0.4)" strokeWidth="2" />
                <text x="200" y="190" textAnchor="middle" fontSize="32">🌍</text>
                <text x="200" y="218" textAnchor="middle" fill="#7EE7C1" fontSize="11" fontWeight="700" fontFamily="Montserrat">ECOLENS</text>
                {/* Arrows */}
                {[30, 150, 270].map(deg => {
                  const r1 = 72, r2 = 108;
                  const rad = (deg * Math.PI) / 180;
                  return (
                    <line key={deg} x1={200 + r1 * Math.cos(rad)} y1={200 + r1 * Math.sin(rad)}
                      x2={200 + r2 * Math.cos(rad)} y2={200 + r2 * Math.sin(rad)}
                      stroke="rgba(126,231,193,0.4)" strokeWidth="1.5" markerEnd="url(#arrow)" />
                  );
                })}
                <defs>
                  <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="rgba(126,231,193,0.4)" />
                  </marker>
                </defs>
              </svg>
            </div>
          </div>
        </section>

        {/* ── ASSESSMENT INPUT ──────────────────────── */}
        <section id="assessment" style={{ maxWidth: 900, margin: "0 auto", padding: "60px 48px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 style={sectionTitleStyle}>Analyze Your Lifestyle Impact</h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>Adjust the sliders below to match your weekly habits</p>
          </div>
          <div style={{ ...cardStyle(), display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 32 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <SliderInput label="🍕 Food Deliveries / Week" field="foodDeliveries" min={0} max={21} />
              <SliderInput label="🫙 Plastic Bottles / Week" field="plasticBottles" min={0} max={28} />
              <SliderInput label="🛍️ Online Shopping Orders / Month" field="shoppingOrders" min={0} max={30} />
              <SliderInput label="👗 Clothing Purchases / Month" field="clothingPurchases" min={0} max={15} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <SliderInput label="👨‍👩‍👧 Household Size" field="householdSize" min={1} max={8} unit=" people" />
              <SliderInput label="📱 Electronics Replacement Every" field="electronicsFreq" min={6} max={60} unit=" months" />
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <label style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>🧻 Disposable Product Usage</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {["low", "medium", "high"].map(level => (
                    <button key={level} onClick={() => setInputs(p => ({ ...p, disposable: level }))}
                      style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: `1px solid ${inputs.disposable === level ? "#7EE7C1" : "rgba(255,255,255,0.1)"}`, background: inputs.disposable === level ? "rgba(126,231,193,0.15)" : "transparent", color: inputs.disposable === level ? "#7EE7C1" : "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, cursor: "pointer", textTransform: "capitalize", transition: "all 0.2s", fontFamily: "Montserrat" }}>
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ border: "2px dashed rgba(126,231,193,0.15)", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <span style={{ fontSize: 24 }}>📄</span>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Upload Receipt / Shopping History</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>Mock feature — coming soon</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button onClick={handleAnalyze}
              style={{ background: "linear-gradient(135deg, #0E3B2E 0%, #1a6644 50%, #7EE7C1 100%)", border: "none", color: "white", padding: "18px 56px", borderRadius: 16, fontSize: 17, fontWeight: 800, cursor: "pointer", transition: "all 0.3s", fontFamily: "Montserrat, sans-serif", letterSpacing: 0.5 }}
              onMouseEnter={e => { e.target.style.transform = "translateY(-4px) scale(1.02)"; e.target.style.boxShadow = "0 20px 60px rgba(126,231,193,0.35)"; }}
              onMouseLeave={e => { e.target.style.transform = "translateY(0) scale(1)"; e.target.style.boxShadow = "none"; }}>
              🔍 Analyze My Impact
            </button>
          </div>
        </section>

        {/* ── RESULTS DASHBOARD ──────────────────────── */}
        {results && (
          <section id="results" ref={dashRef} style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 48px" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <h2 style={sectionTitleStyle}>Your Environmental Footprint</h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>Here's what your current lifestyle generates</p>
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
              {[
                { label: "Monthly Waste", value: results.monthlyWaste, suffix: " kg", icon: "🗑️", color: "#ef4444" },
                { label: "Annual Waste", value: results.annualWaste, suffix: " kg", icon: "📊", color: "#f59e0b" },
                { label: "Money Wasted / Year", value: results.moneyWasted, prefix: "₹", suffix: "", icon: "💸", color: "#a78bfa" },
                { label: "Carbon Risk", value: results.carbonRisk === "Low" ? 1 : results.carbonRisk === "Medium" ? 2 : 3, suffix: "", icon: results.carbonRisk === "Low" ? "✅" : results.carbonRisk === "Medium" ? "⚠️" : "🚨", color: results.carbonRisk === "Low" ? "#7EE7C1" : results.carbonRisk === "Medium" ? "#f59e0b" : "#ef4444", display: results.carbonRisk },
              ].map((card, i) => (
                <div key={card.label} style={{ ...cardStyle({ padding: "24px 20px" }), opacity: showResults ? 1 : 0, transform: showResults ? "translateY(0)" : "translateY(30px)", transition: `all 0.6s ease ${i * 0.1}s` }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{card.icon}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1, marginBottom: 8 }}>{card.label.toUpperCase()}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: card.color, fontFamily: "Montserrat" }}>
                    {card.display ? card.display : (
                      <AnimatedCounter value={card.value} prefix={card.prefix || ""} suffix={card.suffix} active={showResults} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Eco Score + Donut + Waste Scaler */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 32 }}>
              <div style={cardStyle({ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300 })}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", letterSpacing: 2, marginBottom: 20 }}>YOUR ECO SCORE</div>
                <EcoScoreRing score={results.ecoScore} active={showResults} />
              </div>

              <div style={cardStyle()}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 20, letterSpacing: 1 }}>WASTE BREAKDOWN</div>
                <DonutChart data={results.breakdown} />
              </div>

              <div style={cardStyle({ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", minHeight: 300 })}>
                <div style={{ fontSize: 72, marginBottom: 16 }}>{wasteComparison.icon}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Your yearly waste weighs as much as</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#7EE7C1", marginBottom: 8 }}>{wasteComparison.label}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)" }}>{wasteComparison.desc}</div>
                <div style={{ marginTop: 20, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, padding: "12px 20px" }}>
                  <span style={{ fontSize: 22, fontWeight: 800, color: "#ef4444" }}>{results.annualWaste} kg</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", display: "block" }}>total annual waste</span>
                </div>
              </div>
            </div>

            {/* AI Insights */}
            {insights.length > 0 && (
              <div style={cardStyle({ marginBottom: 32 })}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 1, marginBottom: 20 }}>🤖 PERSONALIZED AI INSIGHTS</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
                  {insights.map((tip, i) => (
                    <div key={i} style={{ background: "rgba(126,231,193,0.05)", border: "1px solid rgba(126,231,193,0.15)", borderRadius: 14, padding: 20 }}>
                      <div style={{ fontSize: 24, marginBottom: 10 }}>{tip.icon}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#7EE7C1", marginBottom: 8 }}>{tip.title}</div>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{tip.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Before vs After */}
            <div style={{ ...cardStyle(), marginBottom: 32 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 1, marginBottom: 24 }}>⚖️ BEFORE vs AFTER POTENTIAL</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 24, alignItems: "center" }}>
                <div style={{ textAlign: "center", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 16, padding: 28 }}>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>CURRENT YOU</div>
                  <div style={{ fontSize: 42, fontWeight: 900, color: "#ef4444" }}>{results.annualWaste}kg</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>per year</div>
                  <div style={{ fontSize: 14, color: "#a78bfa", marginTop: 12 }}>₹{results.moneyWasted.toLocaleString("en-IN")} wasted</div>
                </div>
                <div style={{ fontSize: 32, color: "rgba(255,255,255,0.2)" }}>→</div>
                <div style={{ textAlign: "center", background: "rgba(126,231,193,0.08)", border: "1px solid rgba(126,231,193,0.2)", borderRadius: 16, padding: 28 }}>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>IMPROVED YOU</div>
                  <div style={{ fontSize: 42, fontWeight: 900, color: "#7EE7C1" }}>{Math.round(results.annualWaste * 0.55)}kg</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>per year</div>
                  <div style={{ fontSize: 14, color: "#7EE7C1", marginTop: 12 }}>₹{Math.round(results.moneyWasted * 0.4).toLocaleString("en-IN")} saved</div>
                </div>
              </div>
            </div>

            {/* Future Simulator */}
            <div style={cardStyle({ marginBottom: 32 })}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 1, marginBottom: 24 }}>🔮 FUTURE SIMULATOR</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 32 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <SimSlider label="🍕 Reduce Food Orders" field="food" />
                  <SimSlider label="🫙 Replace Plastic Bottles" field="bottles" />
                  <SimSlider label="🛍️ Reduce Shopping Frequency" field="shopping" />
                  <SimSlider label="👗 Buy Durable Clothing" field="clothing" />
                </div>
                {sim && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      {[
                        { label: "Waste Reduced", value: `${sim.wasteReduced}%`, color: "#7EE7C1" },
                        { label: "Money Saved / Year", value: `₹${sim.moneySaved.toLocaleString("en-IN")}`, color: "#a78bfa" },
                        { label: "New Annual Waste", value: `${sim.improved.annualWaste}kg`, color: "#4CAF82" },
                        { label: "New Eco Score", value: `${sim.improved.ecoScore}/100`, color: "#f59e0b" },
                      ].map(stat => (
                        <div key={stat.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 14px" }}>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 6 }}>{stat.label}</div>
                          <div style={{ fontSize: 22, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 12 }}>5-Year Waste Projection</div>
                      <FiveYearChart 
                        original={originalResults?.annualWaste || results.annualWaste}
                        current={results.annualWaste} 
                        improved={sim.improved.annualWaste} 
                     />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Challenges */}
            <div style={cardStyle({ marginBottom: 32 })}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.6)", letterSpacing: 1, marginBottom: 24 }}>🏆 WEEKLY SUSTAINABILITY CHALLENGES</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {CHALLENGES.map(c => (
                  <div key={c.id} onClick={() => setActiveChallenge(activeChallenge === c.id ? null : c.id)}
                    style={{ background: activeChallenge === c.id ? "rgba(126,231,193,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${activeChallenge === c.id ? "rgba(126,231,193,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 16, padding: 20, cursor: "pointer", transition: "all 0.3s", userSelect: "none" }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>{c.icon}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: activeChallenge === c.id ? "#7EE7C1" : "white", marginBottom: 6 }}>{c.title}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: 1.5, marginBottom: 12 }}>{c.desc}</div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "#f59e0b", fontWeight: 700 }}>+{c.points} pts</span>
                      {activeChallenge === c.id && <span style={{ fontSize: 11, color: "#7EE7C1", background: "rgba(126,231,193,0.15)", borderRadius: 8, padding: "3px 10px" }}>✓ Accepted</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── FOOTER ──────────────────────────────────── */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "48px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #0E3B2E, #7EE7C1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🌿</div>
            <span style={{ fontSize: 20, fontWeight: 800, background: "linear-gradient(135deg, #7EE7C1, #4CAF82)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>EcoLens AI</span>
          </div>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginBottom: 20 }}>Built for Hackathon Innovation · See the Waste You Never Noticed</p>
          <div style={{ display: "flex", gap: 32, justifyContent: "center" }}>
            {["Dashboard", "Features", "Contact"].map(link => (
              <a key={link} href="#" style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>{link}</a>
            ))}
          </div>
          <p style={{ color: "rgba(255,255,255,0.15)", fontSize: 11, marginTop: 32 }}>© 2024 EcoLens AI. All rights reserved.</p>
        </footer>
      </div>

      <FloatingBot chatOpen={chatOpen} setChatOpen={setChatOpen} />

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }
        input[type=range] { -webkit-appearance:none; height:4px; border-radius:4px; background:rgba(255,255,255,0.1); outline:none; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance:none; width:18px; height:18px; border-radius:50%; background:#7EE7C1; cursor:pointer; box-shadow:0 0 8px rgba(126,231,193,0.4); }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:6px; } ::-webkit-scrollbar-track { background:transparent; } ::-webkit-scrollbar-thumb { background:rgba(126,231,193,0.2); border-radius:3px; }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}
