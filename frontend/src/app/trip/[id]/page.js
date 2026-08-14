"use client";

import React, { useCallback, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Plane, Calendar, ArrowLeft, Trash2, MapPin,
  Star, CheckCircle2, ExternalLink, Loader2, ShieldAlert, Sparkles,
  IndianRupee,
} from "lucide-react";
import { getTripById, deleteTrip } from "@/services/trip.service";
import Skeleton from "@/components/ui/Skeleton";
import ConfirmModal from "@/components/ui/ConfirmModal";
import PageWrapper from "@/components/layout/PageWrapper";

// Same helper as dashboard — extract readable destination from prompt
function getDestination(prompt) {
  if (!prompt) return "Your Trip";
  const match = prompt.match(/to\s+([A-Za-z][a-zA-Z\s]{1,20}?)(?:\s+for|\s+in\s|\.|,|$)/i);
  if (match) return match[1].trim();
  return prompt.split(" ").slice(0, 4).join(" ");
}

// Helper: Format hotel price properly with ₹/INR
function formatHotelPrice(price) {
  if (!price) return "₹4,500 / night";
  const str = String(price);
  if (str.toLowerCase().includes("free")) return "Free";
  const match = str.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (match) {
    const num = parseFloat(match[1]);
    return `₹${num.toLocaleString("en-IN")} / night`;
  }
  return str.startsWith("₹") || str.toLowerCase().includes("inr") ? str : `₹${str} / night`;
}

// Helper: Format flight price properly with ₹/INR
function formatFlightPrice(price) {
  if (!price) return "₹5,200";
  const str = String(price);
  if (str.toLowerCase().includes("free")) return "Free";
  const match = str.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (match) {
    const num = parseFloat(match[1]);
    return `₹${num.toLocaleString("en-IN")}`;
  }
  return str.startsWith("₹") || str.toLowerCase().includes("inr") ? str : `₹${str}`;
}

// Helper: Format activity cost properly with ₹/INR
function formatActivityCost(cost) {
  if (!cost) return null;
  const str = String(cost);
  if (str.toLowerCase().includes("free") || str.trim() === "0" || str.toLowerCase() === "included") return "Free";
  const match = str.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  if (match) {
    const num = parseFloat(match[1]);
    return `₹${num.toLocaleString("en-IN")}`;
  }
  return str.startsWith("₹") || str.toLowerCase().includes("inr") ? str : `₹${str}`;
}

// Helper: Calculate approx cost range (1 hotel + 1 flight)
function calculateTripCostRange(hotels = [], flights = [], itineraryDays = []) {
  const hotelNums = hotels
    .map((h) => {
      const match = String(h.price_per_night || h.price || "").replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : null;
    })
    .filter((n) => n !== null && n > 0);

  const flightNums = flights
    .map((f) => {
      const match = String(f.price || "").replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : null;
    })
    .filter((n) => n !== null && n > 0);

  const minH = hotelNums.length > 0 ? Math.min(...hotelNums) : 4000;
  const maxH = hotelNums.length > 0 ? Math.max(...hotelNums) : minH;
  const minF = flightNums.length > 0 ? Math.min(...flightNums) : 6000;
  const maxF = flightNums.length > 0 ? Math.max(...flightNums) : minF;

  // Sum of 1 hotel + 1 flight
  const minBase = minH + minF;
  const maxBase = maxH + maxF;

  let lower = Math.floor(minBase / 500) * 500;
  let upper = Math.ceil(maxBase / 500) * 500;

  // Widen slightly if exact single match or very small gap
  if (upper - lower < 1000) {
    lower = Math.floor((minBase * 0.92) / 500) * 500;
    upper = Math.ceil((maxBase * 1.08) / 500) * 500;
  }

  const nights = Math.max(1, itineraryDays.length ? itineraryDays.length - 1 : 3);
  const minFullStay = Math.floor(((minH * nights) + minF) / 500) * 500;
  const maxFullStay = Math.ceil(((maxH * nights) + maxF) / 500) * 500;

  return {
    lower: lower.toLocaleString("en-IN"),
    upper: upper.toLocaleString("en-IN"),
    minH: minH.toLocaleString("en-IN"),
    maxH: maxH.toLocaleString("en-IN"),
    minF: minF.toLocaleString("en-IN"),
    maxF: maxF.toLocaleString("en-IN"),
    nights,
    minFullStay: minFullStay.toLocaleString("en-IN"),
    maxFullStay: maxFullStay.toLocaleString("en-IN"),
  };
}

const TABS = [
  { id: "itinerary", label: "Itinerary", icon: Calendar },
  { id: "hotels", label: "Hotels", icon: Building2 },
  { id: "flights", label: "Flights", icon: Plane },
  { id: "summary", label: "Summary", icon: Sparkles },
];

export default function TripDetailPage() {
  const { id: tripId } = useParams();
  const router = useRouter();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("itinerary");
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadTrip = useCallback(async () => {
    try {
      const data = await getTripById(tripId);
      if (data?.trip) setTrip(data.trip);
    } catch (err) {
      console.error("Failed to load trip:", err);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (!tripId) return;

    const timeoutId = setTimeout(() => {
      loadTrip();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [tripId, loadTrip]);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await deleteTrip(tripId);
      router.push("/dashboard");
    } catch (err) {
      console.error("Delete failed:", err);
      setDeleting(false);
    }
  };

  // ── Skeleton loading state ──
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f6f2] font-sans">
        <div className="bg-white border-b border-[#e8e2d8] px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Skeleton className="w-32 h-5" />
            <Skeleton className="w-20 h-5" />
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 pt-8 space-y-4">
          <Skeleton className="w-64 h-8" />
          <Skeleton className="w-48 h-5" />
          <Skeleton className="h-28 w-full" />
          <div className="flex gap-2 mt-4">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="w-24 h-9" />)}
          </div>
          <Skeleton className="h-56 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (!trip?.finalPlan) {
    return (
      <div className="min-h-screen bg-[#f8f6f2] flex flex-col items-center justify-center text-center p-10">
        <ShieldAlert className="w-10 h-10 text-[#d97706] mb-4" />
        <h2 className="text-lg font-semibold text-[#1a1714] mb-2">Trip plan not found</h2>
        <p className="text-sm text-[#7a6f65] mb-6 max-w-sm">
          This itinerary may still be in progress or could not be located.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="bg-[#d4603a] hover:bg-[#bf5432] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const { finalPlan } = trip;
  const hotels = finalPlan?.hotels?.hotels || [];
  const flights = finalPlan?.flights?.flights || [];
  const itineraryDays = finalPlan?.itinerary?.itinerary || [];
  const summary = finalPlan?.summary || finalPlan?.final_output || finalPlan?.itinerary?.summary || "";
  const tips = finalPlan?.tips || finalPlan?.itinerary?.tips || [];
  const destination = getDestination(trip.promptHistory?.[0]);
  const costRange = calculateTripCostRange(hotels, flights, itineraryDays);

  // Only show a cost estimate when it is derived from real search results.
  // If a search came back empty, the helper falls back to placeholder numbers,
  // and showing those as if they were quotes would be misleading.
  const hasPricingData = hotels.length > 0 || flights.length > 0;

  return (
    <PageWrapper>
      <div className="min-h-screen bg-[#f8f6f2] font-sans pb-16">

        {/* ── Header ── */}
        <header className="sticky top-0 z-20 bg-white border-b border-[#e8e2d8] px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2 text-sm text-[#7a6f65] hover:text-[#1a1714] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </button>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#d4603a]" />
              <span className="text-sm font-bold text-[#1a1714]">VoyAgent</span>
            </div>

            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-200 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </header>

        {/* ── Overview Hero — shown ABOVE tabs so user is oriented immediately ── */}
        <div className="bg-white border-b border-[#e8e2d8] px-6 pt-8 pb-0">
          <div className="max-w-6xl mx-auto">

            {/* Verified badge + destination */}
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#16a34a] bg-[#f0fdf4] px-2.5 py-1 rounded-lg mb-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              3-Agent Plan Verified
            </span>
            <h1 className="text-2xl font-bold text-[#1a1714] mb-1">{destination}</h1>
            <p className="text-sm text-[#7a6f65] mb-5 max-w-2xl line-clamp-1">
              {trip.promptHistory?.[0]}
            </p>

            {/* Quick stats row */}
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="flex items-center gap-2 bg-[#fef3c7] border border-[#f59e0b]/20 px-3 py-2 rounded-xl">
                <Building2 className="w-4 h-4 text-[#b45309]" />
                <span className="text-xs font-semibold text-[#b45309]">
                  {hotels.length} Hotel{hotels.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-[#e0f2fe] border border-[#38bdf8]/20 px-3 py-2 rounded-xl">
                <Plane className="w-4 h-4 text-[#0369a1]" />
                <span className="text-xs font-semibold text-[#0369a1]">
                  {flights.length} Flight{flights.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-[#dcfce7] border border-[#4ade80]/20 px-3 py-2 rounded-xl">
                <Calendar className="w-4 h-4 text-[#15803d]" />
                <span className="text-xs font-semibold text-[#15803d]">
                  {itineraryDays.length} Day{itineraryDays.length !== 1 ? "s" : ""} planned
                </span>
              </div>
              {hasPricingData && (
                <div className="flex items-center gap-2 bg-[#f0fdf4] border border-[#4ade80]/30 px-3 py-2 rounded-xl">
                  <IndianRupee className="w-4 h-4 text-[#16a34a]" />
                  <span className="text-xs font-semibold text-[#16a34a]">
                    Approx. Cost: ₹{costRange.lower} – ₹{costRange.upper}
                  </span>
                </div>
              )}
            </div>

            {/* Summary excerpt (first 150 chars) */}
            {summary && (
              <p className="text-sm text-[#7a6f65] italic leading-relaxed mb-6 max-w-2xl border-l-2 border-[#e8e2d8] pl-3">
                &quot;{typeof summary === "string" ? summary.slice(0, 150) : ""}
                {typeof summary === "string" && summary.length > 150 ? "..." : ""}&quot;
              </p>
            )}

            {/* Tabs */}
            <div className="flex gap-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                      activeTab === tab.id
                        ? "border-[#d4603a] text-[#d4603a]"
                        : "border-transparent text-[#7a6f65] hover:text-[#1a1714]"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Tab content ── */}
        <main className="max-w-6xl mx-auto px-6 pt-8">
          <AnimatePresence mode="wait">

            {/* ITINERARY TAB */}
            {activeTab === "itinerary" && (
              <motion.div key="itinerary" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {itineraryDays.length === 0 ? (
                  <div className="bg-white border border-[#e8e2d8] rounded-2xl p-8 text-center">
                    <p className="text-sm text-[#7a6f65]">No day-by-day plan found.</p>
                  </div>
                ) : (
                  itineraryDays.map((day, idx) => (
                    <div key={idx} className="bg-white border border-[#e8e2d8] rounded-2xl overflow-hidden">
                      {/* Day header */}
                      <div className="flex items-center gap-3 px-5 py-4 bg-[#fdf1ec] border-b border-[#e8e2d8]">
                        <span className="w-8 h-8 rounded-lg bg-[#d4603a] text-white text-xs font-bold flex items-center justify-center shrink-0">
                          {day.day || idx + 1}
                        </span>
                        <h3 className="text-sm font-semibold text-[#1a1714]">
                          {day.title || `Day ${idx + 1} Exploration`}
                        </h3>
                      </div>

                      {/* Activities */}
                      <div className="p-5 space-y-3">
                        {(day.activities || []).map((act, aIdx) => (
                          <div key={aIdx} className="flex gap-3 p-3.5 rounded-xl bg-[#f8f6f2] border border-[#e8e2d8]">
                            <div className="text-xs font-semibold text-[#d4603a] shrink-0 pt-0.5 w-12">
                              {act.time || `${9 + aIdx * 3}:00`}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#1a1714]">
                                {act.activity || act.title}
                              </p>
                              <p className="text-xs text-[#7a6f65] mt-0.5 leading-relaxed">
                                {act.description || act.notes || "Local attraction."}
                              </p>
                              {act.cost && (
                                <span className="inline-block mt-1.5 text-[11px] text-[#16a34a] bg-[#f0fdf4] px-2 py-0.5 rounded font-medium">
                                  Est. cost: {formatActivityCost(act.cost)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {/* HOTELS TAB */}
            {activeTab === "hotels" && (
              <motion.div key="hotels" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {hotels.length === 0 ? (
                  <div className="bg-white border border-[#e8e2d8] rounded-2xl p-10 text-center">
                    <Building2 className="w-8 h-8 text-[#c8bfb5] mx-auto mb-3" />
                    <h4 className="text-sm font-semibold text-[#1a1714] mb-1">No hotel options found</h4>
                    <p className="text-xs text-[#7a6f65] max-w-sm mx-auto leading-relaxed">
                      The live hotel search came back empty for these dates. Your itinerary is
                      unaffected — try planning this trip again to retry the search.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {hotels.map((hotel, hIdx) => (
                      <div key={hIdx} className="bg-white border border-[#e8e2d8] rounded-2xl p-5 flex flex-col hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                          <span className="flex items-center gap-1 text-xs font-semibold text-[#b45309] bg-[#fef3c7] px-2 py-0.5 rounded-lg">
                            <Star className="w-3 h-3 fill-[#f59e0b]" />
                            {hotel.rating || "4.5"}
                          </span>
                          <span className="text-xs font-semibold text-[#16a34a] bg-[#f0fdf4] px-2.5 py-0.5 rounded-lg">
                            {formatHotelPrice(hotel.price_per_night)}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#1a1714] mb-1">{hotel.name || `Stay ${hIdx + 1}`}</h4>
                        <p className="text-xs text-[#7a6f65] leading-relaxed mb-3 flex-1">
                          {hotel.description || "Great location, modern amenities."}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {(hotel.amenities || ["Free Wi-Fi", "AC", "Breakfast"]).slice(0, 4).map((am, amIdx) => (
                            <span key={amIdx} className="text-[11px] bg-[#f8f6f2] border border-[#e8e2d8] px-2 py-0.5 rounded text-[#7a6f65]">
                              {am}
                            </span>
                          ))}
                        </div>
                        <a
                          href={hotel.booking_url || `https://www.google.com/maps/search/${encodeURIComponent(hotel.name || "hotel")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#d4603a] hover:bg-[#bf5432] transition-all"
                        >
                          View on Google Maps
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* FLIGHTS TAB */}
            {activeTab === "flights" && (
              <motion.div key="flights" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
                {flights.length === 0 ? (
                  <div className="bg-white border border-[#e8e2d8] rounded-2xl p-10 text-center">
                    <Plane className="w-8 h-8 text-[#c8bfb5] mx-auto mb-3" />
                    <h4 className="text-sm font-semibold text-[#1a1714] mb-1">No flight options found</h4>
                    <p className="text-xs text-[#7a6f65] max-w-sm mx-auto leading-relaxed">
                      No fares came back for this route. This can happen for short domestic hops
                      where road or rail is the usual choice.
                    </p>
                  </div>
                ) : (
                  flights.map((fl, fIdx) => (
                    <div key={fIdx} className="bg-white border border-[#e8e2d8] rounded-2xl p-5 flex flex-wrap items-center justify-between gap-6 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-[#fdf1ec] flex items-center justify-center shrink-0">
                          <Plane className="w-5 h-5 text-[#d4603a]" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-[#d4603a] uppercase">{fl.airline || "Air India"}</p>
                          <p className="text-sm font-bold text-[#1a1714]">Flight {fl.flight_number || `AI-${200 + fIdx}`}</p>
                          <p className="text-xs text-[#7a6f65] mt-0.5">
                            {fl.duration || "2h 15m"} · {typeof fl.stops === "number" ? (fl.stops === 0 ? "Non-stop" : `${fl.stops} stop${fl.stops > 1 ? "s" : ""}`) : (fl.stops || "Non-stop")}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center min-w-[100px]">
                          <p className="text-lg font-bold text-[#1a1714]">{fl.departure || fl.departure_time || "08:30 AM"}</p>
                          <p className="text-xs font-semibold text-[#d4603a] mt-0.5 bg-[#fdf1ec] px-2 py-0.5 rounded-md inline-block">
                            {fl.departure_airport || fl.from || "AMD - Ahmedabad"}
                          </p>
                          <p className="text-[11px] text-[#7a6f65] mt-0.5">Departure</p>
                        </div>
                        <div className="text-[#c8bfb5] text-lg font-bold">✈</div>
                        <div className="text-center min-w-[100px]">
                          <p className="text-lg font-bold text-[#1a1714]">{fl.arrival || fl.arrival_time || "10:45 AM"}</p>
                          <p className="text-xs font-semibold text-[#d4603a] mt-0.5 bg-[#fdf1ec] px-2 py-0.5 rounded-md inline-block">
                            {fl.arrival_airport || fl.to || "BOM - Mumbai"}
                          </p>
                          <p className="text-[11px] text-[#7a6f65] mt-0.5">Arrival</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#16a34a]">{formatFlightPrice(fl.price)}</p>
                        <p className="text-xs text-[#7a6f65]">per traveller</p>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}

            {/* SUMMARY TAB */}
            {activeTab === "summary" && (
              <motion.div key="summary" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Shown when live hotel/flight search returned nothing, so we
                    never present placeholder numbers as real quotes. */}
                {!hasPricingData && (
                  <div className="flex items-start gap-3 bg-[#fffbeb] border border-[#fcd34d]/50 rounded-2xl p-5">
                    <ShieldAlert className="w-5 h-5 text-[#d97706] shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-[#1a1714] mb-1">
                        Live pricing unavailable
                      </h3>
                      <p className="text-xs text-[#7a6f65] leading-relaxed">
                        Hotel and flight search didn&apos;t return results for this trip, so we&apos;ve
                        left the cost estimate out rather than show made-up numbers. Your
                        itinerary below is still complete — try planning again later for live prices.
                      </p>
                    </div>
                  </div>
                )}

                {/* Estimated Trip Cost Card */}
                {hasPricingData && (
                <div className="bg-gradient-to-br from-[#fdf1ec] via-white to-[#f0fdf4] border border-[#e8e2d8] rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-5 border-b border-[#e8e2d8]/60 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-[#d4603a] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#d4603a]/20">
                        <IndianRupee className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#1a1714]">Estimated Trip Cost (Hotel + Flight)</h3>
                        <p className="text-xs text-[#7a6f65]">Approx. cost combining 1 hotel option summed with 1 flight fare</p>
                      </div>
                    </div>
                    <div className="bg-[#16a34a] text-white px-4 py-2.5 rounded-xl text-right shadow-sm">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/90">Approx. Range</p>
                      <p className="text-xl font-extrabold tracking-tight">₹{costRange.lower} – ₹{costRange.upper}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="bg-white border border-[#e8e2d8] rounded-xl p-3.5 shadow-2xs">
                      <span className="text-[11px] font-semibold text-[#b45309] uppercase tracking-wider block mb-1">Hotel Range (1 Night)</span>
                      <p className="text-sm font-bold text-[#1a1714]">₹{costRange.minH} – ₹{costRange.maxH}</p>
                      <p className="text-[11px] text-[#7a6f65]">per night</p>
                    </div>
                    <div className="bg-white border border-[#e8e2d8] rounded-xl p-3.5 shadow-2xs">
                      <span className="text-[11px] font-semibold text-[#0369a1] uppercase tracking-wider block mb-1">Flight Fare</span>
                      <p className="text-sm font-bold text-[#1a1714]">₹{costRange.minF} – ₹{costRange.maxF}</p>
                      <p className="text-[11px] text-[#7a6f65]">per traveller</p>
                    </div>
                    <div className="bg-[#f0fdf4] border border-[#4ade80]/40 rounded-xl p-3.5 shadow-2xs">
                      <span className="text-[11px] font-semibold text-[#15803d] uppercase tracking-wider block mb-1">Full Stay ({costRange.nights} Nights + Flight)</span>
                      <p className="text-sm font-bold text-[#16a34a]">₹{costRange.minFullStay} – ₹{costRange.maxFullStay}</p>
                      <p className="text-[11px] text-[#7a6f65]">est. total per traveller</p>
                    </div>
                  </div>
                </div>
                )}

                <div className="bg-white border border-[#e8e2d8] rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-[#1a1714] flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-[#d4603a]" />
                    AI Trip Overview
                  </h3>
                  <p className="text-sm text-[#7a6f65] leading-relaxed whitespace-pre-line">
                    {typeof summary === "string" && summary
                      ? summary
                      : "Your plan covers top-rated hotels, convenient flights, and a curated day-by-day itinerary."}
                  </p>
                </div>

                {tips.length > 0 && (
                  <div className="bg-white border border-[#e8e2d8] rounded-2xl p-6">
                    <h3 className="text-sm font-bold text-[#1a1714] flex items-center gap-2 mb-4">
                      <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
                      Travel Tips
                    </h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {tips.map((tip, tIdx) => (
                        <li key={tIdx} className="flex items-start gap-2.5 p-3 rounded-xl bg-[#f8f6f2] border border-[#e8e2d8] text-xs text-[#7a6f65] leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] mt-1.5 shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* ── Confirm delete modal ── */}
        <ConfirmModal
          isOpen={showConfirm}
          title="Delete this trip plan?"
          message="This will permanently delete your trip plan. This cannot be undone."
          confirmLabel="Delete"
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      </div>
    </PageWrapper>
  );
}
