"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, Building2, Plane, Calendar, Bot, FileText } from "lucide-react";

// The three specialist agents and their color identities
const AGENTS = [
  {
    id: "hotel",
    label: "Hotel Specialist",
    icon: Building2,
    color: "#b45309",
    bg: "#fef3c7",
    border: "#f59e0b",
    doing: "Searching live hotel rates & reviews...",
    done: "Top hotels & pricing verified",
  },
  {
    id: "flight",
    label: "Flight Specialist",
    icon: Plane,
    color: "#0369a1",
    bg: "#e0f2fe",
    border: "#38bdf8",
    doing: "Scanning flight routes & schedules...",
    done: "Optimal routes & fares found",
  },
  {
    id: "itinerary",
    label: "Itinerary Specialist",
    icon: Calendar,
    color: "#15803d",
    bg: "#dcfce7",
    border: "#4ade80",
    doing: "Crafting your day-by-day plan...",
    done: "Day-by-day timeline crafted",
  },
];

// Animated SVG fan-out lines from coordinator → 3 agents
function FanOutLines({ active }) {
  return (
    <div className="w-full h-10 my-1">
      <svg viewBox="0 0 400 40" className="w-full h-full" preserveAspectRatio="none">
        {/* Left branch */}
        <motion.path
          d="M 200 0 Q 200 20 70 40"
          stroke="#d4603a" strokeWidth="1.5" fill="none"
          strokeDasharray="80"
          initial={{ strokeDashoffset: 80, opacity: 0 }}
          animate={active ? { strokeDashoffset: 0, opacity: 0.5 } : { strokeDashoffset: 80, opacity: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
        />
        {/* Center branch */}
        <motion.path
          d="M 200 0 L 200 40"
          stroke="#d4603a" strokeWidth="1.5" fill="none"
          strokeDasharray="40"
          initial={{ strokeDashoffset: 40, opacity: 0 }}
          animate={active ? { strokeDashoffset: 0, opacity: 0.5 } : { strokeDashoffset: 40, opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        />
        {/* Right branch */}
        <motion.path
          d="M 200 0 Q 200 20 330 40"
          stroke="#d4603a" strokeWidth="1.5" fill="none"
          strokeDasharray="80"
          initial={{ strokeDashoffset: 80, opacity: 0 }}
          animate={active ? { strokeDashoffset: 0, opacity: 0.5 } : { strokeDashoffset: 80, opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
      </svg>
    </div>
  );
}

// Animated SVG fan-in lines from 3 agents → composer
function FanInLines({ active }) {
  return (
    <div className="w-full h-10 my-1">
      <svg viewBox="0 0 400 40" className="w-full h-full" preserveAspectRatio="none">
        <motion.path
          d="M 70 0 Q 70 20 200 40"
          stroke="#d4603a" strokeWidth="1.5" fill="none"
          strokeDasharray="80"
          initial={{ strokeDashoffset: 80, opacity: 0 }}
          animate={active ? { strokeDashoffset: 0, opacity: 0.5 } : { strokeDashoffset: 80, opacity: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
        />
        <motion.path
          d="M 200 0 L 200 40"
          stroke="#d4603a" strokeWidth="1.5" fill="none"
          strokeDasharray="40"
          initial={{ strokeDashoffset: 40, opacity: 0 }}
          animate={active ? { strokeDashoffset: 0, opacity: 0.5 } : { strokeDashoffset: 40, opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        />
        <motion.path
          d="M 330 0 Q 330 20 200 40"
          stroke="#d4603a" strokeWidth="1.5" fill="none"
          strokeDasharray="80"
          initial={{ strokeDashoffset: 80, opacity: 0 }}
          animate={active ? { strokeDashoffset: 0, opacity: 0.5 } : { strokeDashoffset: 80, opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
      </svg>
    </div>
  );
}

export default function AgentProgressCard({ loading }) {
  // phase 0=idle, 1=coordinator, 2=agents running, 3=composing, 4=critic, 5=done
  const [phase, setPhase] = useState(1);

  useEffect(() => {
    if (!loading) return;

    const t1 = setTimeout(() => setPhase(2), 1200);   // trigger fan-out
    const t2 = setTimeout(() => setPhase(3), 6000);   // trigger fan-in + composer
    const t3 = setTimeout(() => setPhase(4), 8500);   // trigger critic validation

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [loading]);

  if (!loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="w-full bg-white border border-[#e8e2d8] rounded-2xl p-5 shadow-sm my-3"
    >
      {/* Header badge */}
      <div className="flex items-center gap-2 mb-5">
        <span className="w-2 h-2 rounded-full bg-[#d4603a] animate-pulse" />
        <span className="text-sm font-semibold text-[#1a1714]">Multi-Agent Engine Active</span>
        <span className="ml-auto text-xs text-[#7a6f65] bg-[#f8f6f2] border border-[#e8e2d8] px-2.5 py-0.5 rounded-full">
          3-Way Parallel
        </span>
      </div>

      {/* ── Step 1: Coordinator ── */}
      <motion.div
        animate={phase >= 1 ? { opacity: 1 } : { opacity: 0.4 }}
        className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 ${
          phase >= 1 ? "border-[#d4603a]/30 bg-[#fdf1ec]" : "border-[#e8e2d8] bg-[#f8f6f2]"
        }`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          phase >= 1 ? "bg-[#d4603a]/10" : "bg-[#e8e2d8]"
        }`}>
          {phase >= 2
            ? <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
            : <Bot className="w-4 h-4 text-[#d4603a]" />}
        </div>
        <div>
          <p className="text-sm font-semibold text-[#1a1714]">Coordinator Agent</p>
          <p className="text-xs text-[#7a6f65]">
            {phase >= 2
              ? "Requirements verified — dispatching 3 specialists"
              : "Analyzing your travel requirements..."}
          </p>
        </div>
        {phase === 1 && <Loader2 className="w-4 h-4 text-[#d4603a] animate-spin ml-auto shrink-0" />}
        {phase >= 2 && <CheckCircle2 className="w-4 h-4 text-[#16a34a] ml-auto shrink-0" />}
      </motion.div>

      {/* ── Fan-out lines ── */}
      <FanOutLines active={phase >= 2} />

      {/* ── Step 2: Three parallel agents ── */}
      <div className="grid grid-cols-3 gap-2.5">
        {AGENTS.map((agent, idx) => {
          const Icon = agent.icon;
          const isActive = phase >= 2;
          const isDone = phase >= 3;

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={isActive
                ? { opacity: 1, scale: 1 }
                : { opacity: 0.3, scale: 0.95 }}
              transition={{ delay: idx * 0.15, duration: 0.3 }}
              className="p-3 rounded-xl border-l-[3px] border border-[#e8e2d8] transition-all duration-500"
              style={{
                borderLeftColor: isActive ? agent.border : "#e8e2d8",
                backgroundColor: isActive ? agent.bg : "#f8f6f2",
              }}
            >
              {/* Agent header */}
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold flex items-center gap-1" style={{ color: agent.color }}>
                  <Icon className="w-3 h-3" />
                  {agent.label}
                </span>
                {isActive && !isDone && (
                  <Loader2 className="w-3 h-3 animate-spin" style={{ color: agent.color }} />
                )}
                {isDone && <CheckCircle2 className="w-3 h-3 text-[#16a34a]" />}
              </div>

              {/* Status text */}
              <p className="text-[11px] leading-relaxed" style={{ color: agent.color + "cc" }}>
                {!isActive ? "Waiting..." : isDone ? `✓ ${agent.done}` : agent.doing}
              </p>

              {/* Animated shimmer progress bar */}
              {isActive && !isDone && (
                <div className="mt-2 h-0.5 rounded-full overflow-hidden" style={{ backgroundColor: agent.border + "30" }}>
                  <motion.div
                    className="h-full rounded-full w-1/2"
                    style={{ backgroundColor: agent.border }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── Fan-in lines ── */}
      <FanInLines active={phase >= 3} />

      {/* ── Step 3: Response Composer ── */}
      <motion.div
        animate={phase >= 3 ? { opacity: 1 } : { opacity: 0.35 }}
        transition={{ duration: 0.4 }}
        className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 ${
          phase >= 3
            ? "border-[#16a34a]/30 bg-[#f0fdf4]"
            : "border-[#e8e2d8] bg-[#f8f6f2]"
        }`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          phase >= 3 ? "bg-[#16a34a]/10" : "bg-[#e8e2d8]"
        }`}>
          <FileText className={`w-4 h-4 ${phase >= 3 ? "text-[#16a34a]" : "text-[#7a6f65]"}`} />
        </div>
        <div className="flex-1">
          <p className={`text-sm font-semibold ${phase >= 3 ? "text-[#1a1714]" : "text-[#7a6f65]"}`}>
            Response Composer
          </p>
          <p className="text-xs text-[#7a6f65]">
            {phase >= 4
              ? "Draft completed"
              : phase >= 3
              ? "Merging hotels, flights & itinerary into your plan..."
              : "Waiting for all agents to finish..."}
          </p>
          {phase === 3 && (
            <div className="mt-2 h-0.5 rounded-full overflow-hidden bg-[#16a34a]/30">
              <motion.div
                className="h-full rounded-full w-1/2 bg-[#16a34a]"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          )}
        </div>
        {phase === 3 && <Loader2 className="w-4 h-4 text-[#16a34a] animate-spin ml-auto shrink-0" />}
        {phase >= 4 && <CheckCircle2 className="w-4 h-4 text-[#16a34a] ml-auto shrink-0" />}
      </motion.div>

      {/* ── NEW Step 4: Critic / Validator Agent ── */}
      <motion.div
        animate={phase >= 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
        className={`mt-2 flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-300 ${
          phase >= 4 ? "border-[#8b5cf6]/30 bg-[#f5f3ff]" : "hidden"
        }`}
      >
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-[#8b5cf6]/10">
          <Bot className="w-4 h-4 text-[#8b5cf6]" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-[#1a1714]">Critic Agent</p>
          <p className="text-xs text-[#7a6f65]">
            Validating budget, dates, and constraints...
          </p>
          {phase === 4 && (
            <div className="mt-2 h-0.5 rounded-full overflow-hidden bg-[#8b5cf6]/30">
              <motion.div
                className="h-full rounded-full w-1/2 bg-[#8b5cf6]"
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          )}
        </div>
        {phase === 4 && <Loader2 className="w-4 h-4 text-[#8b5cf6] animate-spin ml-auto shrink-0" />}
        {phase >= 5 && <CheckCircle2 className="w-4 h-4 text-[#8b5cf6] ml-auto shrink-0" />}
      </motion.div>
    </motion.div>
  );
}
