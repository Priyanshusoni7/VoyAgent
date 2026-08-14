"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin, Plus, LogOut, Clock, ChevronRight,
  Loader2, Trash2, Compass, Copy, CheckCheck,
} from "lucide-react";
import { getCurrentUser, logout } from "@/services/auth.service";
import { getUserTrips, deleteTrip } from "@/services/trip.service";
import Skeleton from "@/components/ui/Skeleton";
import ConfirmModal from "@/components/ui/ConfirmModal";
import PageWrapper from "@/components/layout/PageWrapper";

// ── Helper: pull a short destination name out of a prompt string
// e.g. "Plan a 3-day trip to Goa for 2 people" → "Goa"
function getDestination(prompt) {
  if (!prompt) return "Trip";
  const match = prompt.match(/to\s+([A-Za-z][a-zA-Z\s]{1,20}?)(?:\s+for|\s+in\s|\.|,|$)/i);
  if (match) return match[1].trim();
  // fallback — first 4 words
  return prompt.split(" ").slice(0, 4).join(" ");
}

// Example prompts to help first-time users know what to type
const EXAMPLE_PROMPTS = [
  "3-day trip to Goa for 2 people under ₹25,000",
  "Weekend in Manali with a budget of ₹15,000",
  "4 days in Kerala backwaters — family of 4, ₹50,000",
  "5-day Rajasthan tour from Delhi under ₹40,000",
];

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Confirm modal state — stores which trip to delete
  const [confirmModal, setConfirmModal] = useState({ open: false, tripId: null });
  const [deleting, setDeleting] = useState(false);

  // For copying example prompts
  const [copiedIdx, setCopiedIdx] = useState(null);

  const loadPage = useCallback(async () => {
    try {
      const authData = await getCurrentUser();
      if (!authData?.user) return router.replace("/login");
      setUser(authData.user);

      const tripsData = await getUserTrips();
      if (tripsData?.trips) setTrips(tripsData.trips);
    } catch {
      router.replace("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadPage();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [loadPage]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  // Opens the confirm modal for a specific trip
  const askDeleteTrip = (e, tripId) => {
    e.stopPropagation();
    setConfirmModal({ open: true, tripId });
  };

  // Actually deletes after user confirms in the modal
  const confirmDelete = async () => {
    try {
      setDeleting(true);
      await deleteTrip(confirmModal.tripId);
      setTrips((prev) => prev.filter((t) => t._id !== confirmModal.tripId));
      setConfirmModal({ open: false, tripId: null });
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  };

  // Copy example prompt to clipboard and show a tick briefly
  const copyPrompt = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // ── Skeleton loading state ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f6f2] font-sans">
        {/* Skeleton header */}
        <div className="bg-white border-b border-[#e8e2d8] px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Skeleton className="w-28 h-5" />
            <Skeleton className="w-20 h-5" />
          </div>
        </div>
        {/* Skeleton content */}
        <div className="max-w-6xl mx-auto px-6 pt-10">
          <Skeleton className="w-48 h-7 mb-2" />
          <Skeleton className="w-72 h-4 mb-10" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-44 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <PageWrapper>
      <div className="min-h-screen bg-[#f8f6f2] font-sans pb-20">

        {/* ── Header ── */}
        <header className="sticky top-0 z-20 bg-white border-b border-[#e8e2d8] px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#d4603a]" />
              <span className="text-base font-bold text-[#1a1714]">VoyAgent</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#7a6f65] hidden sm:block">
                Hi, <strong className="text-[#1a1714]">{user.name.split(" ")[0]}</strong>
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-[#7a6f65] hover:text-[#d4603a] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 pt-10">

          {/* ── Welcome + New trip button ── */}
          <div className="flex flex-wrap items-start justify-between gap-6 mb-10">
            <div>
              <h1 className="text-2xl font-bold text-[#1a1714]">
                Welcome back, {user.name.split(" ")[0]} 👋
              </h1>
              <p className="text-sm text-[#7a6f65] mt-1">
                {trips.length > 0
                  ? `You have ${trips.length} saved trip plan${trips.length > 1 ? "s" : ""}.`
                  : "Plan your first AI trip below."}
              </p>
            </div>
            <button
              onClick={() => router.push("/trip/new")}
              className="flex items-center gap-2 bg-[#d4603a] hover:bg-[#bf5432] active:scale-[0.98] text-white font-semibold text-sm px-5 py-3 rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Plan New Trip
            </button>
          </div>

          {/* ── EMPTY STATE / ONBOARDING ── */}
          {trips.length === 0 && (
            <div className="bg-white border border-[#e8e2d8] rounded-2xl p-8 mb-8">
              <div className="flex items-center gap-2.5 mb-4">
                <Compass className="w-5 h-5 text-[#d4603a]" />
                <h2 className="text-base font-bold text-[#1a1714]">
                  How to get started
                </h2>
              </div>

              {/* Steps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {[
                  { num: "1", label: "Type your trip idea", desc: "Destination, days, budget & travelers" },
                  { num: "2", label: "Watch 3 agents work", desc: "Hotels, Flights & Itinerary in parallel" },
                  { num: "3", label: "Get your full plan", desc: "Hotel options, flights & day-by-day schedule" },
                ].map((step) => (
                  <div key={step.num} className="flex items-start gap-3 p-4 bg-[#f8f6f2] rounded-xl">
                    <span className="w-7 h-7 bg-[#d4603a] text-white rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
                      {step.num}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#1a1714]">{step.label}</p>
                      <p className="text-xs text-[#7a6f65] mt-0.5">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Example prompt chips */}
              <p className="text-xs font-semibold text-[#7a6f65] uppercase tracking-wide mb-3">
                Try one of these examples — click to copy
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {EXAMPLE_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => copyPrompt(prompt, idx)}
                    className="flex items-center justify-between gap-2 p-3 rounded-xl bg-[#f8f6f2] border border-[#e8e2d8] hover:border-[#d4603a]/40 text-left transition-all group"
                  >
                    <span className="text-sm text-[#1a1714]">&quot;{prompt}&quot;</span>
                    {copiedIdx === idx
                      ? <CheckCheck className="w-4 h-4 text-[#16a34a] shrink-0" />
                      : <Copy className="w-4 h-4 text-[#c8bfb5] group-hover:text-[#d4603a] shrink-0 transition-colors" />}
                  </button>
                ))}
              </div>

              <button
                onClick={() => router.push("/trip/new")}
                className="mt-6 w-full bg-[#d4603a] hover:bg-[#bf5432] text-white font-semibold text-sm py-3 rounded-xl transition-all"
              >
                Open AI Trip Planner →
              </button>
            </div>
          )}

          {/* ── Trip cards grid (only when trips exist) ── */}
          {trips.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Compass className="w-4 h-4 text-[#7a6f65]" />
                <h2 className="text-base font-semibold text-[#1a1714]">Your saved plans</h2>
                <span className="text-xs bg-[#e8e2d8] text-[#7a6f65] px-2 py-0.5 rounded-full font-medium">
                  {trips.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trips.map((trip, idx) => {
                  const isCompleted = trip.status === "completed";
                  const destination = getDestination(trip.promptHistory?.[0]);
                  const rawPrompt = trip.promptHistory?.[0] || "";
                  const dateStr = new Date(trip.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric", month: "short", year: "numeric",
                  });

                  return (
                    <motion.div
                      key={trip._id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => router.push(isCompleted ? `/trip/${trip._id}` : "/trip/new")}
                      className="group bg-white border border-[#e8e2d8] hover:border-[#d4603a]/40 hover:shadow-lg hover:shadow-[#d4603a]/5 rounded-2xl p-5 cursor-pointer transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Status + delete */}
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                            isCompleted
                              ? "bg-[#f0fdf4] text-[#16a34a]"
                              : "bg-[#fffbeb] text-[#d97706]"
                          }`}>
                            {isCompleted ? "Completed" : "In Progress"}
                          </span>
                          <button
                            onClick={(e) => askDeleteTrip(e, trip._id)}
                            className="text-[#c8bfb5] hover:text-red-400 p-1.5 rounded-lg transition-colors"
                            title="Delete trip"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Destination name (extracted) */}
                        <h3 className="text-base font-bold text-[#1a1714] group-hover:text-[#d4603a] transition-colors mb-1">
                          {destination}
                        </h3>

                        {/* Raw prompt as subtitle */}
                        <p className="text-xs text-[#7a6f65] line-clamp-2">{rawPrompt}</p>
                      </div>

                      {/* Card footer */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#f0ece6]">
                        <span className="flex items-center gap-1.5 text-xs text-[#7a6f65]">
                          <Clock className="w-3.5 h-3.5" />
                          {dateStr}
                        </span>
                        <span className="text-xs font-semibold text-[#d4603a] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          {isCompleted ? "View plan" : "Continue"}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </main>

        {/* ── Confirm delete modal ── */}
        <ConfirmModal
          isOpen={confirmModal.open}
          title="Delete this trip?"
          message="This will permanently remove the trip plan and cannot be undone."
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmModal({ open: false, tripId: null })}
        />
      </div>
    </PageWrapper>
  );
}
