"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, ArrowLeft, MapPin, RefreshCw, Sparkles, AlertCircle } from "lucide-react";
import { planTrip } from "@/services/trip.service";
import AgentProgressCard from "@/components/trip/AgentProgressCard";
import MessageContent from "@/components/trip/MessageContent";

// Quick replies (a greeting, a clarification) come back fast. Only escalate to
// the full multi-agent card once a turn is clearly doing real planning work.
const HEAVY_WORK_THRESHOLD_MS = 2500;

// Starter prompt suggestions — shown before the user types anything
const STARTER_PROMPTS = [
  "3-day trip to Goa for 2 people under ₹25,000",
  "Weekend in Manali — Budget ₹15,000",
  "4 days Kerala backwaters, family of 4, ₹50,000",
  "5-day Rajasthan tour from Delhi under ₹40,000",
];

// Quick fill answers when agent asks for missing info
const QUICK_ANSWERS = {
  departure: "Departing from Mumbai",
  duration_days: "For 3 days",
  budget: "Budget is ₹30,000",
  travelers: "For 2 people",
  travel_style: "Comfort & leisure style",
};

export default function NewTripPage() {
  const router = useRouter();
  const bottomRef = useRef(null);

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState(() => `trip_${Date.now()}`);
  const [clarificationFields, setClarificationFields] = useState([]);
  const [hasStarted, setHasStarted] = useState(false); // tracks if user sent first message
  const [showAgentCard, setShowAgentCard] = useState(false);
  const [errorBanner, setErrorBanner] = useState(null);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm VoyAgent 👋 Tell me where you want to go, for how many days, and your budget — I'll have three AI agents build your complete trip plan.",
    },
  ]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (e, customText = null) => {
    if (e) e.preventDefault();
    const text = customText ?? prompt;
    if (!text.trim() || loading) return;

    setHasStarted(true); // hide starter prompts once user sends anything
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    if (customText === null) setPrompt("");
    setClarificationFields([]);
    setErrorBanner(null);
    setLoading(true);

    // Only reveal the heavy agent visualisation if the turn is actually slow.
    const heavyTimer = setTimeout(() => setShowAgentCard(true), HEAVY_WORK_THRESHOLD_MS);

    try {
      const data = await planTrip({ prompt: text, threadId });

      if (data.status === "clarification_needed") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.clarification?.question || "I need a few more details to build your plan.",
          },
        ]);
        setClarificationFields(data.clarification?.missing_fields || []);

      } else if (data.status === "completed" && data.trip) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "🎉 Your complete trip plan is ready! Taking you there now...",
          },
        ]);
        setTimeout(() => router.push(`/trip/${data.trip._id}`), 1500);

      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "⚠️ Got an unexpected response. Please try again." },
        ]);
      }
    } catch (error) {
      const serverMessage = error?.response?.data?.message;

      setErrorBanner(
        serverMessage ||
          "Couldn't reach the planning service. Check that the backend and AI service are running."
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            serverMessage ||
            "I couldn't reach the planning service just now. Your conversation is saved — try sending that again in a moment.",
        },
      ]);
    } finally {
      clearTimeout(heavyTimer);
      setShowAgentCard(false);
      setLoading(false);
    }
  };

  // When user clicks a starter prompt — fill input and auto-send
  const handleStarterClick = (promptText) => {
    setPrompt(promptText);
    handleSend(null, promptText);
  };

  // When user clicks a quick-fill pill — append to current input
  const handleQuickAnswer = (field) => {
    const answer = QUICK_ANSWERS[field] || `My ${field} is standard`;
    setPrompt((prev) => (prev ? `${prev}, ${answer}` : answer));
  };

  const resetThread = () => {
    setMessages([
      { role: "assistant", content: "Fresh start! Where do you want to travel?" },
    ]);
    setThreadId(`trip_${Date.now()}`);
    setClarificationFields([]);
    setPrompt("");
    setHasStarted(false);
  };

  return (
    <div className="h-screen bg-[#f8f6f2] flex flex-col font-sans">

      {/* ── Header ── */}
      <header className="sticky top-0 z-20 bg-white border-b border-[#e8e2d8] px-5 py-3.5 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/dashboard")}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#f8f6f2] border border-[#e8e2d8] text-[#7a6f65] hover:text-[#1a1714] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#d4603a]" />
                <span className="text-sm font-bold text-[#1a1714]">VoyAgent — Trip Planner</span>
              </div>
              <p className="text-[11px] text-[#7a6f65]">
                Thread: <span className="font-mono">{threadId || "..."}</span>
              </p>
            </div>
          </div>

          <button
            onClick={resetThread}
            className="flex items-center gap-1.5 text-xs text-[#7a6f65] hover:text-[#1a1714] px-3 py-1.5 rounded-lg border border-[#e8e2d8] hover:bg-[#f8f6f2] transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            New thread
          </button>
        </div>
      </header>

      {/* ── Messages area ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">

          {/* Chat messages */}
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-end gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  msg.role === "user"
                    ? "bg-[#d4603a] text-white"
                    : "bg-white border border-[#e8e2d8] text-[#d4603a]"
                }`}>
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm ${
                  msg.role === "user"
                    ? "bg-[#d4603a] text-white rounded-br-sm"
                    : "bg-white border border-[#e8e2d8] text-[#1a1714] rounded-bl-sm shadow-sm"
                }`}>
                  <MessageContent content={msg.content} tone={msg.role} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Thinking indicator — lightweight for quick replies */}
          {loading && !showAgentCard && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-end gap-2.5"
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-white border border-[#e8e2d8] text-[#d4603a]">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-[#e8e2d8] rounded-2xl rounded-bl-sm shadow-sm px-4 py-3.5">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-[#c8bfb5]"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                      transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Full multi-agent visualisation — only for real planning work */}
          {loading && showAgentCard && <AgentProgressCard loading={loading} />}

          {/* Connection error banner */}
          {errorBanner && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="ml-10 flex items-start gap-2.5 rounded-xl border border-[#f5c2b8] bg-[#fdf1ec] px-4 py-3 max-w-lg"
            >
              <AlertCircle className="w-4 h-4 text-[#d4603a] shrink-0 mt-0.5" />
              <p className="text-xs text-[#8a4a33] leading-relaxed">{errorBanner}</p>
            </motion.div>
          )}

          {/* Quick-fill pills (when agent needs more info) */}
          {clarificationFields.length > 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="ml-10 bg-white border border-[#e8e2d8] rounded-2xl p-4 max-w-lg shadow-sm"
            >
              <p className="text-xs font-semibold text-[#7a6f65] uppercase tracking-wide mb-2.5">
                Quick suggestions — click to add
              </p>
              <div className="flex flex-wrap gap-2">
                {clarificationFields.map((field) => (
                  <button
                    key={field}
                    onClick={() => handleQuickAnswer(field)}
                    className="px-3 py-1.5 rounded-lg bg-[#f8f6f2] border border-[#e8e2d8] hover:border-[#d4603a]/40 text-xs text-[#1a1714] hover:text-[#d4603a] transition-all"
                  >
                    + {field.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Starter prompt suggestions ── */}
          {/* Only shown before user sends any message */}
          {!hasStarted && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="ml-10 max-w-lg"
            >
              <p className="text-xs font-semibold text-[#7a6f65] uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#d4603a]" />
                Try one of these to get started
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STARTER_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleStarterClick(p)}
                    className="text-left p-3 rounded-xl bg-white border border-[#e8e2d8] hover:border-[#d4603a]/40 text-xs text-[#1a1714] hover:text-[#d4603a] transition-all shadow-sm"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* ── Input bar ── */}
      <footer className="bg-white border-t border-[#e8e2d8] p-4 shrink-0">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto">
          <div className="flex gap-2.5">
            <input
              type="text"
              placeholder="e.g. 3-day trip to Goa for 2 under ₹25,000..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              disabled={loading}
              className="flex-1 bg-[#f8f6f2] border border-[#e8e2d8] rounded-xl px-4 py-3 text-sm text-[#1a1714] placeholder-[#b8b0a6] focus:outline-none focus:border-[#d4603a]/60 focus:ring-2 focus:ring-[#d4603a]/10 transition-all"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-2 bg-[#d4603a] hover:bg-[#bf5432] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm px-5 py-3 rounded-xl transition-all active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
          {/* Format hint */}
          <p className="text-[11px] text-[#b8b0a6] mt-2 pl-1">
            Tip: Include destination · days · budget · no. of people for best results
          </p>
        </form>
      </footer>
    </div>
  );
}
