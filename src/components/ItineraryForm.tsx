import React, { useState, useCallback } from "react";
import { motion } from "motion/react";
import {
  Compass, MapPin, Calendar, DollarSign, Users, Sparkles,
  Utensils, Palette, Landmark, Trees, ShoppingBag, Zap, Heart, Moon,
  ChevronRight, Backpack, Hotel, Info,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface SubmitParams {
  destination: string;
  vibe: string;
  duration: number;
  budgetLevel: string;
  travelParty: string;
  interests: string[];
}

interface ItineraryFormProps {
  onSubmit: (params: SubmitParams) => void;
  isLoading: boolean;
}

interface InterestOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface Preset {
  title: string;
  destination: string;
  vibe: string;
  duration: number;
  budgetLevel: string;
  travelParty: string;
  interests: string[];
}

interface BudgetTier {
  tier: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const TRAVEL_PARTIES = ["Solo", "Couple", "Family with kids", "Friends"] as const;

const BUDGET_TIERS: BudgetTier[] = [
  { tier: "Backpacker", icon: Backpack, desc: "Hostels, street food, public transit" },
  { tier: "Mid-range",  icon: Hotel,    desc: "Boutique hotels, casual dining, mix of transit" },
  { tier: "Luxury",     icon: Sparkles, desc: "High-end resorts, gourmet meals, private tours" },
];

const INTEREST_OPTIONS: InterestOption[] = [
  { id: "Food & Dining",           label: "Food & Dining",    icon: Utensils },
  { id: "Arts & Culture",          label: "Arts & Culture",   icon: Palette },
  { id: "History & Architecture",  label: "History",          icon: Landmark },
  { id: "Nature & Outdoors",       label: "Nature & Outdoors",icon: Trees },
  { id: "Shopping & Fashion",      label: "Shopping",         icon: ShoppingBag },
  { id: "Adventure & Sports",      label: "Adventure",        icon: Zap },
  { id: "Wellness & Relaxation",   label: "Wellness",         icon: Heart },
  { id: "Nightlife",               label: "Nightlife",        icon: Moon },
];

const PRESETS: Preset[] = [
  {
    title: "Kyoto Zen & Cozy Tea Houses",
    destination: "Kyoto, Japan",
    vibe: "Quiet moss gardens, matcha tea ceremonies, small artisanal neighborhoods, traditional wooden townhouses, and peaceful bamboo groves.",
    duration: 5, budgetLevel: "Mid-range", travelParty: "Solo",
    interests: ["Food & Dining", "Arts & Culture", "History & Architecture", "Wellness & Relaxation"],
  },
  {
    title: "Amalfi Coast Romantic Escape",
    destination: "Amalfi Coast, Italy",
    vibe: "Stunning cliffside dinners, sunset yacht cruises, fresh seafood, winding coastal drives, lemon orchards, and absolute luxury relaxation.",
    duration: 7, budgetLevel: "Luxury", travelParty: "Couple",
    interests: ["Food & Dining", "Arts & Culture", "Wellness & Relaxation"],
  },
  {
    title: "Icelandic Volcanoes & Waterfalls",
    destination: "Reykjavík, Iceland",
    vibe: "Chasing majestic waterfalls, exploring geothermal black sand beaches, taking warm dips in natural hot springs, and rugged scenic drives.",
    duration: 6, budgetLevel: "Luxury", travelParty: "Friends",
    interests: ["Nature & Outdoors", "Adventure & Sports", "Wellness & Relaxation"],
  },
  {
    title: "Oaxaca Gastronomic Explorer",
    destination: "Oaxaca, Mexico",
    vibe: "Diving deep into vibrant local markets, mezcal tastings, historic architectural squares, handmade mole workshops, and colorful street art.",
    duration: 4, budgetLevel: "Backpacker", travelParty: "Solo",
    interests: ["Food & Dining", "Arts & Culture", "History & Architecture"],
  },
];

/** Max character lengths for user inputs (Security: prevent huge payloads) */
const MAX_DESTINATION_LEN = 120;
const MAX_VIBE_LEN = 1200;
const MIN_DURATION = 1;
const MAX_DURATION = 14;

// ── Component ──────────────────────────────────────────────────────────────

export default function ItineraryForm({ onSubmit, isLoading }: ItineraryFormProps) {
  const [destination, setDestination] = useState("");
  const [duration, setDuration]       = useState(5);
  const [vibe, setVibe]               = useState("");
  const [budgetLevel, setBudgetLevel] = useState("Mid-range");
  const [travelParty, setTravelParty] = useState("Couple");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const handleInterestToggle = useCallback((id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const applyPreset = useCallback((p: Preset) => {
    setDestination(p.destination);
    setVibe(p.vibe);
    setDuration(p.duration);
    setBudgetLevel(p.budgetLevel);
    setTravelParty(p.travelParty);
    setSelectedInterests(p.interests);
  }, []);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!vibe.trim()) return;
    onSubmit({ destination, vibe, duration, budgetLevel, travelParty, interests: selectedInterests });
  };

  const vibeCharLeft = MAX_VIBE_LEN - vibe.length;

  return (
    <div className="space-y-12">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="text-center md:text-left">
        <p className="text-[10px] uppercase tracking-[0.3em] text-indigo-400 font-black mb-2.5">
          AI Premium Concierge
        </p>
        <h1 className="font-display text-4xl font-light tracking-tight text-white sm:text-5xl lg:text-6xl">
          Craft your{" "}
          <span className="text-indigo-400 italic font-normal">enchanted escape</span>
        </h1>
        <p className="mt-4 text-base text-slate-400 max-w-2xl font-sans leading-relaxed">
          Our elite AI planner creates custom, geographically optimised day-by-day schedules
          with cost estimations, cultural tips, and secret local spots.
        </p>
      </div>

      {/* ── Presets ───────────────────────────────────────────────────────── */}
      <section aria-labelledby="presets-heading">
        <h2
          id="presets-heading"
          className="font-display text-xs font-bold uppercase tracking-widest text-slate-500 mb-4"
        >
          Need immediate inspiration? Try a curation
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRESETS.map((p, idx) => (
            <motion.button
              key={idx}
              type="button"
              whileHover={{ y: -4, borderColor: "rgba(99, 102, 241, 0.4)" }}
              className="group cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-all shadow-lg backdrop-blur-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070A]"
              onClick={() => applyPreset(p)}
              id={`preset-card-${idx}`}
              aria-label={`Apply preset: ${p.title} — ${p.duration} days, ${p.budgetLevel}, ${p.travelParty}`}
            >
              <h3 className="font-display text-sm font-bold text-slate-200 group-hover:text-white transition-colors">
                {p.title}
              </h3>
              <p className="mt-1.5 line-clamp-2 font-sans text-xs text-slate-400">
                {p.vibe}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-mono text-[10px] font-medium text-indigo-400 uppercase">
                  {p.duration} days · {p.budgetLevel}
                </span>
                <span
                  className="font-mono text-[10px] font-bold text-indigo-300 group-hover:translate-x-1 transition-transform flex items-center gap-0.5"
                  aria-hidden="true"
                >
                  Load <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* ── Main Form ─────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        id="planner-form"
        noValidate
        aria-label="Travel itinerary planner"
        className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-8"
      >
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">

          {/* ── Left column ─────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Destination */}
            <div className="space-y-2">
              <label
                htmlFor="destination"
                className="block font-display text-sm font-semibold text-slate-300 flex items-center gap-2"
              >
                <MapPin className="h-4 w-4 text-indigo-400" aria-hidden="true" />
                Where would you like to go?
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="destination"
                  name="destination"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 pl-10 font-sans text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white/[0.06] focus:ring-1 focus:ring-indigo-500"
                  placeholder="e.g. Tokyo, Rome, Costa Rica (Leave blank to let AI choose!)"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value.slice(0, MAX_DESTINATION_LEN))}
                  maxLength={MAX_DESTINATION_LEN}
                  autoComplete="off"
                  spellCheck="false"
                  aria-describedby="destination-hint"
                />
                <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500 pointer-events-none" aria-hidden="true" />
              </div>
              <p id="destination-hint" className="font-sans text-[11px] text-slate-500 flex items-center gap-1">
                <Info className="h-3 w-3 flex-shrink-0 text-indigo-400" aria-hidden="true" />
                Leaving it blank lets Valise suggest the perfect destination based on your vibe!
              </p>
            </div>

            {/* Duration Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="duration-slider"
                  className="font-display text-sm font-semibold text-slate-300 flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4 text-indigo-400" aria-hidden="true" />
                  Trip Duration
                </label>
                <span
                  className="font-mono text-xs font-bold text-white bg-indigo-600/30 border border-indigo-500/30 px-2 py-0.5 rounded-md"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {duration} {duration === 1 ? "Day" : "Days"}
                </span>
              </div>
              <div className="flex items-center gap-4 py-2">
                <input
                  type="range"
                  id="duration-slider"
                  name="duration"
                  min={MIN_DURATION}
                  max={MAX_DURATION}
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-indigo-500 outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#05070A]"
                  aria-valuemin={MIN_DURATION}
                  aria-valuemax={MAX_DURATION}
                  aria-valuenow={duration}
                  aria-valuetext={`${duration} day${duration !== 1 ? "s" : ""}`}
                />
              </div>
              <div className="flex justify-between font-mono text-[10px] text-slate-500" aria-hidden="true">
                <span>1 Day</span>
                <span>5 Days</span>
                <span>10 Days</span>
                <span>14 Days</span>
              </div>
            </div>

            {/* Travel Party */}
            <fieldset className="space-y-2">
              <legend className="font-display text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-400" aria-hidden="true" />
                Who is in your travel party?
              </legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" role="group" aria-label="Travel party options">
                {TRAVEL_PARTIES.map((party) => (
                  <button
                    key={party}
                    type="button"
                    onClick={() => setTravelParty(party)}
                    aria-pressed={travelParty === party}
                    className={`flex flex-col items-center justify-center rounded-xl border p-3 font-sans text-xs font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070A] ${
                      travelParty === party
                        ? "border-indigo-500 bg-indigo-600/20 text-white shadow-[0_0_10px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500"
                        : "border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
                    }`}
                    id={`party-btn-${party.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {party}
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Budget Tier */}
            <fieldset className="space-y-2">
              <legend className="font-display text-sm font-semibold text-slate-300 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-indigo-400" aria-hidden="true" />
                Select Budget Level
              </legend>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" role="group" aria-label="Budget tier options">
                {BUDGET_TIERS.map(({ tier, icon: Icon, desc }) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setBudgetLevel(tier)}
                    aria-pressed={budgetLevel === tier}
                    className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070A] ${
                      budgetLevel === tier
                        ? "border-indigo-500 bg-indigo-600/25 text-white shadow-[0_0_12px_rgba(99,102,241,0.2)] ring-1 ring-indigo-500"
                        : "border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/10 hover:bg-white/[0.05]"
                    }`}
                    id={`budget-btn-${tier.toLowerCase()}`}
                  >
                    <div className="flex items-center gap-2 font-display text-sm font-bold">
                      <Icon className={`h-4 w-4 ${budgetLevel === tier ? "text-indigo-400" : "text-slate-500"}`} aria-hidden="true" />
                      <span>{tier}</span>
                    </div>
                    <span className={`mt-1 font-sans text-[11px] leading-tight ${budgetLevel === tier ? "text-slate-300" : "text-slate-500"}`}>
                      {desc}
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
          </div>

          {/* ── Right column ────────────────────────────────────────────── */}
          <div className="space-y-6">

            {/* Vibe textarea */}
            <div className="space-y-2">
              <label
                htmlFor="vibe-description"
                className="block font-display text-sm font-semibold text-slate-300 flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4 text-indigo-400" aria-hidden="true" />
                Describe your dream itinerary and vibe
                <span className="text-red-400 ml-0.5" aria-label="required">*</span>
              </label>
              <textarea
                id="vibe-description"
                name="vibe"
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-sans text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white/[0.06] focus:ring-1 focus:ring-indigo-500"
                placeholder="Describe your ideal day. Are you exploring historic alleys? Sipping coffee in hipster cafes? Swimming under waterfalls? Are there specific things you want to avoid?"
                value={vibe}
                onChange={(e) => setVibe(e.target.value.slice(0, MAX_VIBE_LEN))}
                required
                maxLength={MAX_VIBE_LEN}
                aria-required="true"
                aria-describedby="vibe-hint vibe-counter"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span id="vibe-hint">Try to be as descriptive as possible</span>
                <span
                  id="vibe-counter"
                  aria-live="polite"
                  aria-atomic="true"
                  className={vibe.length > 0 ? "text-indigo-400 font-bold" : "text-slate-500"}
                >
                  {vibeCharLeft < 100
                    ? `${vibeCharLeft} characters remaining`
                    : `${vibe.length} characters`}
                </span>
              </div>
            </div>

            {/* Interests */}
            <fieldset className="space-y-2.5">
              <legend className="block font-display text-sm font-semibold text-slate-300">
                Select your primary travel interests
              </legend>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label="Travel interest options">
                {INTEREST_OPTIONS.map((interest) => {
                  const Icon = interest.icon;
                  const isSelected = selectedInterests.includes(interest.id);
                  return (
                    <button
                      key={interest.id}
                      type="button"
                      onClick={() => handleInterestToggle(interest.id)}
                      aria-pressed={isSelected}
                      className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left font-sans text-xs font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070A] ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-600/20 text-white ring-1 ring-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.15)]"
                          : "border-white/5 bg-white/[0.01] text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-slate-200"
                      }`}
                      id={`interest-btn-${interest.id.toLowerCase().replace(/[\s&]+/g, "-")}`}
                    >
                      <Icon className={`h-4 w-4 ${isSelected ? "text-indigo-400" : "text-slate-500"}`} aria-hidden="true" />
                      <span>{interest.label}</span>
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        </div>

        {/* ── Submit ──────────────────────────────────────────────────────── */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-end">
          <button
            type="submit"
            disabled={isLoading || !vibe.trim()}
            className="w-full sm:w-auto min-w-[220px] flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 px-6 font-sans text-sm font-bold tracking-wide uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(99,102,241,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070A]"
            id="planner-submit-btn"
            aria-disabled={isLoading || !vibe.trim()}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  focusable="false"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Assembling Itinerary…</span>
              </>
            ) : (
              <>
                <span>Generate Custom Itinerary</span>
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
