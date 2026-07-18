import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  Compass, MapPin, Calendar, DollarSign, Users, Sparkles, 
  Utensils, Palette, Landmark, Trees, ShoppingBag, Zap, Heart, Moon, 
  ChevronRight, Backpack, Hotel, Info
} from "lucide-react";

interface ItineraryFormProps {
  onSubmit: (params: {
    destination: string;
    vibe: string;
    duration: number;
    budgetLevel: string;
    travelParty: string;
    interests: string[];
  }) => void;
  isLoading: boolean;
}

const INTEREST_OPTIONS = [
  { id: "Food & Dining", label: "Food & Dining", icon: Utensils },
  { id: "Arts & Culture", label: "Arts & Culture", icon: Palette },
  { id: "History & Architecture", label: "History", icon: Landmark },
  { id: "Nature & Outdoors", label: "Nature & Outdoors", icon: Trees },
  { id: "Shopping & Fashion", label: "Shopping", icon: ShoppingBag },
  { id: "Adventure & Sports", label: "Adventure", icon: Zap },
  { id: "Wellness & Relaxation", label: "Wellness", icon: Heart },
  { id: "Nightlife", label: "Nightlife", icon: Moon },
];

const PRESETS = [
  {
    title: "Kyoto Zen & Cozy Tea Houses",
    destination: "Kyoto, Japan",
    vibe: "Quiet moss gardens, matcha tea ceremonies, small artisanal neighborhoods, traditional wooden townhouses, and peaceful bamboo groves.",
    duration: 5,
    budgetLevel: "Mid-range",
    travelParty: "Solo",
    interests: ["Food & Dining", "Arts & Culture", "History & Architecture", "Wellness & Relaxation"],
  },
  {
    title: "Amalfi Coast Romantic Escape",
    destination: "Amalfi Coast, Italy",
    vibe: "Stunning cliffside dinners, sunset yacht cruises, fresh seafood, winding coastal drives, lemon orchards, and absolute luxury relaxation.",
    duration: 7,
    budgetLevel: "Luxury",
    travelParty: "Couple",
    interests: ["Food & Dining", "Arts & Culture", "Wellness & Relaxation"],
  },
  {
    title: "Icelandic Volcanoes & Waterfalls",
    destination: "Reykjavík, Iceland",
    vibe: "Chasing majestic waterfalls, exploring geothermal black sand beaches, taking warm dips in natural hot springs, and rugged scenic drives.",
    duration: 6,
    budgetLevel: "Luxury",
    travelParty: "Friends",
    interests: ["Nature & Outdoors", "Adventure & Sports", "Wellness & Relaxation"],
  },
  {
    title: "Oaxaca Gastronomic Explorer",
    destination: "Oaxaca, Mexico",
    vibe: "Diving deep into vibrant local markets, mezcal tastings, historic architectural squares, handmade mole workshops, and colorful street art.",
    duration: 4,
    budgetLevel: "Backpacker",
    travelParty: "Solo",
    interests: ["Food & Dining", "Arts & Culture", "History & Architecture"],
  },
];

export default function ItineraryForm({ onSubmit, isLoading }: ItineraryFormProps) {
  const [destination, setDestination] = useState("");
  const [duration, setDuration] = useState(5);
  const [vibe, setVibe] = useState("");
  const [budgetLevel, setBudgetLevel] = useState("Mid-range");
  const [travelParty, setTravelParty] = useState("Couple");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const handleInterestToggle = (interestId: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interestId)
        ? prev.filter((id) => id !== interestId)
        : [...prev, interestId]
    );
  };

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setDestination(preset.destination);
    setVibe(preset.vibe);
    setDuration(preset.duration);
    setBudgetLevel(preset.budgetLevel);
    setTravelParty(preset.travelParty);
    setSelectedInterests(preset.interests);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vibe.trim()) return;
    onSubmit({
      destination,
      vibe,
      duration,
      budgetLevel,
      travelParty,
      interests: selectedInterests,
    });
  };

  return (
    <div className="space-y-12">
      {/* Hero Welcome */}
      <div className="text-center md:text-left">
        <div className="text-[10px] uppercase tracking-[0.3em] text-indigo-400 font-black mb-2.5">
          AI Premium Concierge
        </div>
        <h1 className="font-display text-4xl font-light tracking-tight text-white sm:text-5xl lg:text-6xl">
          Craft your <span className="text-indigo-400 italic font-normal">enchanted escape</span>
        </h1>
        <p className="mt-4 text-base text-slate-400 max-w-2xl font-sans leading-relaxed">
          Our elite AI planner creates custom, geographically optimized day-by-day schedules with cost estimations, cultural tips, and secret local spots.
        </p>
      </div>

      {/* Quick Presets Section */}
      <div className="space-y-4">
        <h2 className="font-display text-xs font-bold uppercase tracking-widest text-slate-500">
          Need immediate inspiration? Try a curation
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRESETS.map((p, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4, borderColor: "rgba(99, 102, 241, 0.4)" }}
              className="group cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-all shadow-lg backdrop-blur-sm"
              onClick={() => applyPreset(p)}
              id={`preset-card-${idx}`}
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
                <span className="font-mono text-[10px] font-bold text-indigo-300 group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                  Load <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Interactive Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 shadow-2xl backdrop-blur-md space-y-8" id="planner-form">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Left Column: Core Fields */}
          <div className="space-y-6">
            {/* Destination Input */}
            <div className="space-y-2">
              <label htmlFor="destination" className="block font-display text-sm font-semibold text-slate-300 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-indigo-400" />
                Where would you like to go?
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="destination"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 pl-10 font-sans text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white/[0.06]"
                  placeholder="e.g. Tokyo, Rome, Costa Rica (Leave blank to let AI choose!)"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
                <MapPin className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
              </div>
              <p className="font-sans text-[11px] text-slate-500 flex items-center gap-1">
                <Info className="h-3 w-3 flex-shrink-0 text-indigo-400" />
                Leaving it blank lets Valise suggest the perfect destination based on your vibe!
              </p>
            </div>

            {/* Duration Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-display text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-indigo-400" />
                  Trip Duration
                </label>
                <span className="font-mono text-xs font-bold text-white bg-indigo-600/30 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                  {duration} Days
                </span>
              </div>
              <div className="flex items-center gap-4 py-2">
                <input
                  type="range"
                  min="1"
                  max="14"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-indigo-500 outline-none"
                  id="duration-slider"
                />
              </div>
              <div className="flex justify-between font-mono text-[10px] text-slate-500">
                <span>1 Day</span>
                <span>5 Days</span>
                <span>10 Days</span>
                <span>14 Days</span>
              </div>
            </div>

            {/* Travel Party */}
            <div className="space-y-2">
              <label className="block font-display text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-400" />
                Who is in your travel party?
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {["Solo", "Couple", "Family with kids", "Friends"].map((party) => (
                  <button
                    key={party}
                    type="button"
                    onClick={() => setTravelParty(party)}
                    className={`flex flex-col items-center justify-center rounded-xl border p-3 font-sans text-xs font-semibold transition-all duration-300 ${
                      travelParty === party
                        ? "border-indigo-500 bg-indigo-600/20 text-white shadow-[0_0_10px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500"
                        : "border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
                    }`}
                    id={`party-btn-${party.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <span>{party}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Tier */}
            <div className="space-y-2">
              <label className="block font-display text-sm font-semibold text-slate-300 flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-indigo-400" />
                Select Budget Level
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { tier: "Backpacker", icon: Backpack, desc: "Hostels, street food, public transit" },
                  { tier: "Mid-range", icon: Hotel, desc: "Boutique hotels, casual dining, mix of transit" },
                  { tier: "Luxury", icon: Sparkles, desc: "High-end resorts, gourmet meals, private tours" },
                ].map(({ tier, icon: Icon, desc }) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setBudgetLevel(tier)}
                    className={`flex flex-col items-start rounded-xl border p-3.5 text-left transition-all duration-300 ${
                      budgetLevel === tier
                        ? "border-indigo-500 bg-indigo-600/25 text-white shadow-[0_0_12px_rgba(99,102,241,0.2)] ring-1 ring-indigo-500"
                        : "border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/10 hover:bg-white/[0.05]"
                    }`}
                    id={`budget-btn-${tier.toLowerCase()}`}
                  >
                    <div className="flex items-center gap-2 font-display text-sm font-bold">
                      <Icon className={`h-4 w-4 ${budgetLevel === tier ? "text-indigo-400" : "text-slate-500"}`} />
                      <span>{tier}</span>
                    </div>
                    <span className={`mt-1 font-sans text-[11px] leading-tight ${budgetLevel === tier ? "text-slate-300" : "text-slate-500"}`}>
                      {desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Vibe & Interests */}
          <div className="space-y-6">
            {/* Vibe / Preferences Textarea */}
            <div className="space-y-2">
              <label htmlFor="vibe-description" className="block font-display text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                Describe your dream itinerary and vibe
              </label>
              <textarea
                id="vibe-description"
                rows={4}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 font-sans text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-indigo-500 focus:bg-white/[0.06]"
                placeholder="Describe your ideal day. Are you exploring historic alleys? Sipping coffee in hipster cafes? Swimming under waterfalls? Are there specific things you want to avoid?"
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                required
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Try to be as descriptive as possible</span>
                <span className={vibe.length > 0 ? "text-indigo-400 font-bold" : "text-slate-500"}>
                  {vibe.length} characters
                </span>
              </div>
            </div>

            {/* Core Interests Selection */}
            <div className="space-y-2.5">
              <label className="block font-display text-sm font-semibold text-slate-300">
                Select your primary travel interests
              </label>
              <div className="grid grid-cols-2 gap-2">
                {INTEREST_OPTIONS.map((interest) => {
                  const Icon = interest.icon;
                  const isSelected = selectedInterests.includes(interest.id);
                  return (
                    <button
                      key={interest.id}
                      type="button"
                      onClick={() => handleInterestToggle(interest.id)}
                      className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left font-sans text-xs font-semibold transition-all duration-300 ${
                        isSelected
                          ? "border-indigo-500 bg-indigo-600/20 text-white ring-1 ring-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.15)]"
                          : "border-white/5 bg-white/[0.01] text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-slate-200"
                      }`}
                      id={`interest-btn-${interest.id.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon className={`h-4 w-4 ${isSelected ? "text-indigo-400" : "text-slate-500"}`} />
                      <span>{interest.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Form Submission Button */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-end">
          <button
            type="submit"
            disabled={isLoading || !vibe.trim()}
            className="w-full sm:w-auto min-w-[220px] flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 px-6 font-sans text-sm font-bold tracking-wide uppercase transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(99,102,241,0.35)]"
            id="planner-submit-btn"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Assembling Itinerary...</span>
              </>
            ) : (
              <>
                <span>Generate Custom Itinerary</span>
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
