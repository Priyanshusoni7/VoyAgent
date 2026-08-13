import Link from "next/link";
import { MapPin, Building2, Plane, Calendar, ArrowRight, Sparkles } from "lucide-react";

// Static landing page — no "use client" needed, this is all static content
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f8f6f2] font-sans">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-[#e8e2d8] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#d4603a]" />
            <span className="text-base font-bold text-[#1a1714]">VoyAgent</span>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-[#7a6f65] hover:text-[#1a1714] transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold text-white bg-[#d4603a] hover:bg-[#bf5432] px-4 py-2 rounded-xl transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#d4603a] bg-[#fdf1ec] border border-[#d4603a]/20 px-3 py-1 rounded-full mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          Powered by LangGraph Multi-Agent AI
        </span>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[#1a1714] leading-tight mb-5">
          Your AI travel team,{" "}
          <span className="text-[#d4603a]">working in parallel.</span>
        </h1>

        {/* Subtext */}
        <p className="text-lg text-[#7a6f65] max-w-xl mx-auto mb-8 leading-relaxed">
          Just tell us where you want to go. Three specialist AI agents — Hotels,
          Flights, and Itinerary — research everything simultaneously and deliver
          your complete trip plan in seconds.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="flex items-center gap-2 bg-[#d4603a] hover:bg-[#bf5432] text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-md shadow-[#d4603a]/20 transition-all"
          >
            Start planning for free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-[#7a6f65] hover:text-[#1a1714] px-6 py-3 rounded-xl border border-[#e8e2d8] bg-white hover:bg-[#f8f6f2] transition-all"
          >
            Already have an account?
          </Link>
        </div>

        {/* ── Mini agent preview ── */}
        <div className="mt-14 grid grid-cols-3 gap-3 max-w-lg mx-auto">
          <div className="bg-white border border-[#e8e2d8] rounded-2xl p-4 text-left shadow-sm">
            <div className="w-8 h-8 bg-[#fef3c7] rounded-lg flex items-center justify-center mb-2">
              <Building2 className="w-4 h-4 text-[#b45309]" />
            </div>
            <p className="text-xs font-bold text-[#1a1714]">Hotel Agent</p>
            <p className="text-[11px] text-[#7a6f65] mt-0.5">Live rates & reviews</p>
          </div>
          <div className="bg-white border border-[#e8e2d8] rounded-2xl p-4 text-left shadow-sm">
            <div className="w-8 h-8 bg-[#e0f2fe] rounded-lg flex items-center justify-center mb-2">
              <Plane className="w-4 h-4 text-[#0369a1]" />
            </div>
            <p className="text-xs font-bold text-[#1a1714]">Flight Agent</p>
            <p className="text-[11px] text-[#7a6f65] mt-0.5">Routes & schedules</p>
          </div>
          <div className="bg-white border border-[#e8e2d8] rounded-2xl p-4 text-left shadow-sm">
            <div className="w-8 h-8 bg-[#dcfce7] rounded-lg flex items-center justify-center mb-2">
              <Calendar className="w-4 h-4 text-[#15803d]" />
            </div>
            <p className="text-xs font-bold text-[#1a1714]">Itinerary Agent</p>
            <p className="text-[11px] text-[#7a6f65] mt-0.5">Day-by-day plan</p>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-white border-y border-[#e8e2d8] py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#1a1714] text-center mb-2">
            How it works
          </h2>
          <p className="text-sm text-[#7a6f65] text-center mb-12">
            Three steps from idea to complete trip plan.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-[#fdf1ec] border-2 border-[#d4603a]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-extrabold text-[#d4603a]">1</span>
              </div>
              <h3 className="text-base font-bold text-[#1a1714] mb-2">Tell us your trip</h3>
              <p className="text-sm text-[#7a6f65] leading-relaxed">
                Just type where you want to go, for how many days, and your budget.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-[#fdf1ec] border-2 border-[#d4603a]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-extrabold text-[#d4603a]">2</span>
              </div>
              <h3 className="text-base font-bold text-[#1a1714] mb-2">3 agents work together</h3>
              <p className="text-sm text-[#7a6f65] leading-relaxed">
                Hotel, Flight and Itinerary specialists run simultaneously — not one by one.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="w-12 h-12 bg-[#fdf1ec] border-2 border-[#d4603a]/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-lg font-extrabold text-[#d4603a]">3</span>
              </div>
              <h3 className="text-base font-bold text-[#1a1714] mb-2">Get your full plan</h3>
              <p className="text-sm text-[#7a6f65] leading-relaxed">
                A complete itinerary with hotel options, flight details, and daily activities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA strip ── */}
      <section className="bg-[#1a1714] py-16 px-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-3">
          Ready to plan your next trip?
        </h2>
        <p className="text-sm text-white/50 mb-8 max-w-sm mx-auto">
          Free to use. No credit card needed. Just tell the agents where you want to go.
        </p>
        <Link
          href="/signup"
          className="inline-flex items-center gap-2 bg-[#d4603a] hover:bg-[#bf5432] text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all"
        >
          Start planning for free
          <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#1a1714] border-t border-white/5 px-6 py-5 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <MapPin className="w-4 h-4 text-[#d4603a]" />
          <span className="text-sm font-bold text-white">VoyAgent</span>
        </div>
        <p className="text-xs text-white/30">© 2025 VoyAgent. Built with LangGraph + Next.js.</p>
      </footer>
    </div>
  );
}
