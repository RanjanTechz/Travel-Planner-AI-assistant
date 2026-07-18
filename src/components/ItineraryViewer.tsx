import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calendar, DollarSign, Sparkles,
  CheckCircle, Clock, Lightbulb, ShieldAlert, BookOpen, Printer, Save,
  CheckSquare, Square, FileText, ChevronDown, ChevronUp, RefreshCw,
} from "lucide-react";
import { Itinerary } from "../types";

// ── Types ──────────────────────────────────────────────────────────────────

interface ItineraryViewerProps {
  itinerary: Itinerary;
  onSave: (updated: Itinerary) => void;
  isSaved: boolean;
  onGenerateNew: () => void;
}

// ── Helper ─────────────────────────────────────────────────────────────────

/** Convert a cost string like "$150/night" → a 0-100 progress percentage. */
function getProgressWidth(costStr: string, maxVal = 500): number {
  const num = parseInt(costStr.replace(/[^0-9]/g, ""), 10) || 50;
  return Math.min(100, Math.max(15, (num / maxVal) * 100));
}

// ── Sub-components ─────────────────────────────────────────────────────────

interface ActivityRowProps {
  timeLabel: string;
  timeCode: string; // "AM" | "PM" | "EV"
  activity: string;
  location: string;
  locationEmoji: string;
  tip: string;
  isCompleted: boolean;
  onToggle: () => void;
  checkId: string;
  activityId: string;
}

function ActivityRow({
  timeLabel, timeCode, activity, location, locationEmoji,
  tip, isCompleted, onToggle, checkId, activityId,
}: ActivityRowProps) {
  return (
    <div className="flex gap-4 relative">
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 z-10 font-mono text-xs font-bold shadow-[0_0_8px_rgba(99,102,241,0.1)]"
        aria-hidden="true"
      >
        {timeCode}
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
            <Clock className="h-3 w-3 text-indigo-400" aria-hidden="true" />
            {timeLabel}
          </span>
          <button
            onClick={onToggle}
            className="text-slate-500 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm p-0.5"
            id={checkId}
            aria-pressed={isCompleted}
            aria-label={`Mark ${timeLabel} as ${isCompleted ? "incomplete" : "complete"}`}
          >
            {isCompleted
              ? <CheckSquare className="h-4 w-4 text-indigo-400" aria-hidden="true" />
              : <Square className="h-4 w-4" aria-hidden="true" />
            }
          </button>
        </div>
        <h4
          id={activityId}
          className={`font-display text-sm font-bold text-white ${isCompleted ? "line-through text-slate-500" : ""}`}
        >
          {activity}
        </h4>
        <p className="font-sans text-xs text-slate-400">
          <span aria-hidden="true">{locationEmoji} </span>
          <span className="font-semibold text-slate-300">{location}</span>
        </p>
        <p className="font-sans text-xs text-slate-400 bg-white/[0.02] p-2.5 rounded-lg border border-white/5 flex items-start gap-1.5 mt-1.5">
          <Lightbulb className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>{tip}</span>
        </p>
      </div>
    </div>
  );
}

interface PackingItemProps {
  label: string;
  isPacked: boolean;
  onToggle: () => void;
  itemKey: string;
}

function PackingItem({ label, isPacked, onToggle, itemKey }: PackingItemProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full flex items-center gap-2.5 text-left rounded-lg p-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070A] ${
        isPacked ? "opacity-70" : "hover:bg-white/[0.03]"
      }`}
      id={`pack-btn-${itemKey}`}
      aria-pressed={isPacked}
      aria-label={`${isPacked ? "Unmark" : "Mark"} "${label}" as packed`}
    >
      {isPacked
        ? <CheckSquare className="h-4 w-4 text-emerald-400 flex-shrink-0" aria-hidden="true" />
        : <Square className="h-4 w-4 text-slate-600 flex-shrink-0" aria-hidden="true" />
      }
      <span className={`font-sans text-xs ${isPacked ? "line-through text-slate-500" : "text-slate-300"}`}>
        {label}
      </span>
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ItineraryViewer({
  itinerary, onSave, isSaved, onGenerateNew,
}: ItineraryViewerProps) {
  const [activeDay, setActiveDay]           = useState<number>(1);
  const [completedActivities, setCompletedActivities] = useState<Record<string, boolean>>({});
  const [packedItems, setPackedItems]       = useState<Record<string, boolean>>({});
  const [dayNotes, setDayNotes]             = useState<Record<number, string>>({});
  const [savedStatus, setSavedStatus]       = useState(isSaved);

  useEffect(() => { setSavedStatus(isSaved); }, [isSaved]);

  const toggleActivity = useCallback((dayKey: string) => {
    setCompletedActivities((prev) => ({ ...prev, [dayKey]: !prev[dayKey] }));
  }, []);

  const togglePacked = useCallback((itemKey: string) => {
    setPackedItems((prev) => ({ ...prev, [itemKey]: !prev[itemKey] }));
  }, []);

  const handleNoteChange = useCallback((dayNumber: number, note: string) => {
    setDayNotes((prev) => ({ ...prev, [dayNumber]: note }));
  }, []);

  const handleSaveClick = useCallback(() => {
    const annotated: Itinerary = {
      ...itinerary,
      id: itinerary.id ?? `${itinerary.recommendedDestination.city.toLowerCase()}-${Date.now()}`,
      createdAt: itinerary.createdAt ?? new Date().toISOString(),
    };
    onSave(annotated);
    setSavedStatus(true);
  }, [itinerary, onSave]);

  // Packing progress
  const totalItems =
    itinerary.packingChecklist.essentials.length +
    itinerary.packingChecklist.gearTech.length;
  const packedCount =
    itinerary.packingChecklist.essentials.filter((i) => packedItems[`ess-${i}`]).length +
    itinerary.packingChecklist.gearTech.filter((i) => packedItems[`gear-${i}`]).length;
  const packingPercent = totalItems > 0 ? Math.round((packedCount / totalItems) * 100) : 0;

  const destinationLabel = `${itinerary.recommendedDestination.city}, ${itinerary.recommendedDestination.country}`;

  return (
    <div className="space-y-12 animate-fade-in" id="itinerary-print-area">

      {/* ── Header card ─────────────────────────────────────────────────── */}
      <section
        aria-labelledby="itinerary-title"
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 shadow-2xl backdrop-blur-md"
      >
        <div className="absolute top-0 right-0 h-32 w-32 translate-x-12 -translate-y-12 rounded-full bg-indigo-500/10 blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 h-32 w-32 -translate-x-12 translate-y-12 rounded-full bg-purple-500/10 blur-3xl" aria-hidden="true" />

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-indigo-400 uppercase tracking-widest border border-indigo-500/30">
                Destination Curation
              </span>
              <span className="font-mono text-[10px] font-bold text-slate-500">
                <time dateTime={new Date().toISOString().split("T")[0]}>
                  Created {new Date().toLocaleDateString()}
                </time>
              </span>
            </div>
            <h1
              id="itinerary-title"
              className="mt-3 font-display text-3xl font-light tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              {itinerary.recommendedDestination.city},{" "}
              <span className="text-indigo-400 italic font-medium">
                {itinerary.recommendedDestination.country}
              </span>
            </h1>
            <blockquote className="mt-4 font-sans text-sm text-slate-300 max-w-3xl leading-relaxed italic border-l-2 border-indigo-500/40 pl-4 bg-white/[0.01] py-2.5 rounded-r-lg">
              "{itinerary.vibeMatch}"
            </blockquote>
          </div>

          <div className="flex flex-row md:flex-col gap-3 flex-wrap print:hidden">
            <button
              onClick={handleSaveClick}
              disabled={savedStatus}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-sans text-xs font-bold transition-all shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070A] ${
                savedStatus
                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]"
              }`}
              id="save-trip-btn"
              aria-label={savedStatus ? "Trip already saved" : `Save ${destinationLabel} to My Trips`}
              aria-pressed={savedStatus}
            >
              {savedStatus
                ? <><CheckCircle className="h-4 w-4" aria-hidden="true" /><span>Trip Saved!</span></>
                : <><Save className="h-4 w-4" aria-hidden="true" /><span>Save to My Trips</span></>
              }
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-4 py-2.5 font-sans text-xs font-bold transition-all shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070A]"
              id="print-trip-btn"
              aria-label="Print this itinerary"
            >
              <Printer className="h-4 w-4" aria-hidden="true" />
              <span>Print Plan</span>
            </button>

            <button
              onClick={onGenerateNew}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-4 py-2.5 font-sans text-xs font-bold transition-all shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070A]"
              id="new-trip-btn"
              aria-label="Plan a new trip"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>Plan Another</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Main grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">

        {/* ── Day-by-day timeline ──────────────────────────────────────── */}
        <section className="lg:col-span-2 space-y-6" aria-labelledby="schedule-heading">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2
              id="schedule-heading"
              className="font-display text-xl font-light tracking-tight text-white flex items-center gap-2"
            >
              <Calendar className="h-5 w-5 text-indigo-400" aria-hidden="true" />
              Day-by-Day Schedule
            </h2>
            <div
              className="flex flex-wrap gap-1"
              id="day-nav-group"
              role="tablist"
              aria-label="Select day"
            >
              {itinerary.dayWiseItinerary.map((day) => (
                <button
                  key={day.dayNumber}
                  role="tab"
                  onClick={() => setActiveDay(day.dayNumber)}
                  aria-selected={activeDay === day.dayNumber}
                  aria-controls={`day-card-${day.dayNumber}`}
                  className={`flex h-8 min-w-8 items-center justify-center rounded-lg font-mono text-xs font-bold transition-all duration-300 border focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070A] ${
                    activeDay === day.dayNumber
                      ? "bg-indigo-600 text-white shadow-[0_0_8px_#6366f1] border-indigo-500"
                      : "bg-white/[0.03] text-slate-400 hover:bg-white/10 hover:text-white border-white/5"
                  }`}
                  id={`day-nav-${day.dayNumber}`}
                  aria-label={`Day ${day.dayNumber}: ${day.theme}`}
                >
                  D{day.dayNumber}
                </button>
              ))}
            </div>
          </div>

          {/* Day cards */}
          <div className="space-y-4" role="tabpanel" aria-label="Day details">
            {itinerary.dayWiseItinerary.map((day) => {
              const isExpanded = activeDay === day.dayNumber;
              return (
                <article
                  key={day.dayNumber}
                  id={`day-card-${day.dayNumber}`}
                  aria-labelledby={`day-heading-${day.dayNumber}`}
                  className={`overflow-hidden rounded-xl border transition-all duration-300 ${
                    isExpanded
                      ? "border-indigo-500/30 bg-white/[0.03] shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                      : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10"
                  }`}
                >
                  {/* Card header */}
                  <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white font-mono text-sm font-bold shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                        aria-hidden="true"
                      >
                        {day.dayNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold uppercase text-indigo-400">
                            Day {day.dayNumber}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[9px] font-bold uppercase ${
                              day.paceLevel === "Low"
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                                : day.paceLevel === "Medium"
                                ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20"
                                : "bg-red-500/20 text-red-400 border border-red-500/20"
                            }`}
                          >
                            Pace: {day.paceLevel}
                          </span>
                        </div>
                        <h3
                          id={`day-heading-${day.dayNumber}`}
                          className="font-display text-base font-bold text-slate-100 mt-0.5"
                        >
                          {day.theme}
                        </h3>
                      </div>
                    </div>

                    <button
                      onClick={() => setActiveDay(isExpanded ? 0 : day.dayNumber)}
                      className="text-slate-500 hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-sm p-1"
                      id={`day-toggle-${day.dayNumber}`}
                      aria-expanded={isExpanded}
                      aria-controls={`day-body-${day.dayNumber}`}
                      aria-label={`${isExpanded ? "Collapse" : "Expand"} Day ${day.dayNumber}: ${day.theme}`}
                    >
                      {isExpanded
                        ? <ChevronUp className="h-5 w-5" aria-hidden="true" />
                        : <ChevronDown className="h-5 w-5" aria-hidden="true" />
                      }
                    </button>
                  </div>

                  {/* Expandable body */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        id={`day-body-${day.dayNumber}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-white/5 bg-white/[0.01]"
                      >
                        <div className="p-5 sm:p-6 space-y-6">
                          <div className="space-y-6 relative before:absolute before:left-4.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
                            <ActivityRow
                              timeLabel="Morning Exploration"
                              timeCode="AM"
                              activity={day.timeline.morning.activity}
                              location={day.timeline.morning.location}
                              locationEmoji="📍"
                              tip={day.timeline.morning.tip}
                              isCompleted={!!completedActivities[`${day.dayNumber}-morning`]}
                              onToggle={() => toggleActivity(`${day.dayNumber}-morning`)}
                              checkId={`check-morning-d${day.dayNumber}`}
                              activityId={`activity-morning-d${day.dayNumber}`}
                            />
                            <ActivityRow
                              timeLabel="Afternoon & Local Gastronomy"
                              timeCode="PM"
                              activity={day.timeline.afternoon.activity}
                              location={day.timeline.afternoon.location}
                              locationEmoji="🍴"
                              tip={day.timeline.afternoon.tip}
                              isCompleted={!!completedActivities[`${day.dayNumber}-afternoon`]}
                              onToggle={() => toggleActivity(`${day.dayNumber}-afternoon`)}
                              checkId={`check-afternoon-d${day.dayNumber}`}
                              activityId={`activity-afternoon-d${day.dayNumber}`}
                            />
                            <ActivityRow
                              timeLabel="Evening & Wind Down"
                              timeCode="EV"
                              activity={day.timeline.evening.activity}
                              location={day.timeline.evening.location}
                              locationEmoji="🥂"
                              tip={day.timeline.evening.tip}
                              isCompleted={!!completedActivities[`${day.dayNumber}-evening`]}
                              onToggle={() => toggleActivity(`${day.dayNumber}-evening`)}
                              checkId={`check-evening-d${day.dayNumber}`}
                              activityId={`activity-evening-d${day.dayNumber}`}
                            />
                          </div>

                          {/* Hidden Gem */}
                          <aside
                            className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-1 backdrop-blur-md"
                            aria-label={`Hidden gem: ${day.hiddenGem.name}`}
                          >
                            <span className="font-mono text-[9px] uppercase font-extrabold text-indigo-400 tracking-wider flex items-center gap-1">
                              <Sparkles className="h-3 w-3" aria-hidden="true" />
                              Hidden Gem of the Day
                            </span>
                            <h4 className="font-display text-sm font-bold text-white italic">
                              {day.hiddenGem.name}
                            </h4>
                            <p className="font-sans text-xs text-slate-400 leading-relaxed">
                              {day.hiddenGem.description}
                            </p>
                          </aside>

                          {/* Personal notes */}
                          <div className="space-y-1.5 pt-4 border-t border-white/10 print:hidden">
                            <label
                              htmlFor={`day-notes-input-d${day.dayNumber}`}
                              className="font-display text-xs font-semibold text-slate-400 flex items-center gap-1"
                            >
                              <FileText className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />
                              Personal Notes for Day {day.dayNumber}
                            </label>
                            <textarea
                              id={`day-notes-input-d${day.dayNumber}`}
                              name={`day-notes-d${day.dayNumber}`}
                              className="w-full rounded-lg border border-white/10 bg-white/[0.02] p-2.5 font-sans text-xs text-white outline-none transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:bg-white/[0.05]"
                              rows={2}
                              placeholder="Write dining bookings, meeting times, or key reminders here…"
                              value={dayNotes[day.dayNumber] ?? ""}
                              onChange={(e) => handleNoteChange(day.dayNumber, e.target.value)}
                              maxLength={500}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </article>
              );
            })}
          </div>
        </section>

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <aside className="space-y-8" aria-label="Trip details sidebar">

          {/* Budget breakdown */}
          <section
            aria-labelledby="budget-heading"
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-6"
          >
            <div>
              <span className="font-mono text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                Cost Breakdown
              </span>
              <h2
                id="budget-heading"
                className="mt-1 font-display text-lg font-light text-white flex items-center gap-2"
              >
                <DollarSign className="h-5 w-5 text-indigo-400" aria-hidden="true" />
                Budget Estimates
              </h2>
            </div>

            <dl className="space-y-4">
              {(
                [
                  { key: "accommodation", label: "Accommodation",       max: 300, colorClass: "bg-indigo-500 shadow-[0_0_8px_#6366f1]" },
                  { key: "foodAndDrink",  label: "Dining & Refreshments",max: 150, colorClass: "bg-indigo-400 shadow-[0_0_8px_#818cf8]" },
                  { key: "transportation",label: "Local Transport",      max: 100, colorClass: "bg-indigo-400" },
                  { key: "activities",    label: "Leisure & Activities", max: 250, colorClass: "bg-indigo-500 shadow-[0_0_8px_#6366f1]" },
                ] as const
              ).map(({ key, label, max, colorClass }) => {
                const entry = itinerary.budgetEstimate[key];
                const pct = getProgressWidth(entry.cost, max);
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between font-sans text-xs">
                      <dt className="font-medium text-slate-400">{label}</dt>
                      <dd className="font-mono font-bold text-white">{entry.cost}</dd>
                    </div>
                    <div
                      className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden"
                      role="progressbar"
                      aria-valuenow={Math.round(pct)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${label}: ${entry.cost}`}
                    >
                      <div className={`h-full ${colorClass} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="font-mono text-[9px] text-slate-500">{entry.style}</p>
                  </div>
                );
              })}
            </dl>

            <div className="border-t border-dashed border-white/10 pt-5 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-slate-500 uppercase font-bold">
                  Estimated Trip Total
                </span>
                <p className="font-display text-3xl font-light tracking-tighter text-white mt-0.5">
                  {itinerary.budgetEstimate.totalCost}
                </p>
              </div>
              <div
                className="h-10 w-10 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg flex items-center justify-center font-display text-lg font-black"
                aria-hidden="true"
              >
                $
              </div>
            </div>
          </section>

          {/* Local insights */}
          <section
            aria-labelledby="insights-heading"
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-6"
          >
            <h2
              id="insights-heading"
              className="font-display text-lg font-light text-white flex items-center gap-2"
            >
              <BookOpen className="h-5 w-5 text-indigo-400" aria-hidden="true" />
              Local Insights
            </h2>

            <div className="space-y-2">
              <h3 className="font-mono text-[10px] font-bold text-slate-500 uppercase">
                Cultural Etiquette
              </h3>
              <ul className="space-y-1.5">
                {itinerary.localInsights.culturalEtiquette.map((tip, idx) => (
                  <li key={idx} className="font-sans text-xs text-slate-400 flex items-start gap-2 leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500 shadow-[0_0_6px_#6366f1]" aria-hidden="true" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <h3 className="font-mono text-[10px] font-bold text-slate-500 uppercase">
                Tipping &amp; Currency
              </h3>
              <p className="font-sans text-xs text-slate-400 leading-relaxed">
                {itinerary.localInsights.tippingAndCurrency}
              </p>
            </div>

            <div className="border-t border-white/10 pt-4 space-y-1.5">
              <h3 className="font-mono text-[10px] font-bold text-red-400 uppercase flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-red-400" aria-hidden="true" />
                Scam &amp; Safety Alert
              </h3>
              <p className="font-sans text-xs text-slate-400 leading-relaxed bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                {itinerary.localInsights.safetyScamAlert}
              </p>
            </div>
          </section>

          {/* Packing tracker */}
          <section
            aria-labelledby="packing-heading"
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-6"
          >
            <div className="flex items-center justify-between">
              <h2
                id="packing-heading"
                className="font-display text-lg font-light text-white flex items-center gap-2"
              >
                <CheckSquare className="h-5 w-5 text-indigo-400" aria-hidden="true" />
                Packing Tracker
              </h2>
              <span
                className="font-mono text-xs font-bold text-indigo-300 bg-indigo-600/30 border border-indigo-500/30 px-2 py-0.5 rounded-md"
                aria-live="polite"
                aria-atomic="true"
                aria-label={`${packingPercent}% packed`}
              >
                {packingPercent}%
              </span>
            </div>

            <div
              className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden"
              role="progressbar"
              aria-valuenow={packingPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Packing progress: ${packingPercent}%`}
            >
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300 shadow-[0_0_8px_#10b981]"
                style={{ width: `${packingPercent}%` }}
              />
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.01] p-3">
              <h3 className="font-mono text-[9px] uppercase font-bold text-indigo-400">
                Style &amp; Vibe
              </h3>
              <p className="font-sans text-xs text-slate-400 leading-relaxed mt-0.5">
                {itinerary.packingChecklist.clothingVibe}
              </p>
            </div>

            <div className="space-y-2.5">
              <h3 className="font-mono text-[10px] font-bold text-slate-500 uppercase">
                Absolute Essentials
              </h3>
              <div className="space-y-1">
                {itinerary.packingChecklist.essentials.map((item) => (
                  <PackingItem
                    key={`ess-${item}`}
                    label={item}
                    isPacked={!!packedItems[`ess-${item}`]}
                    onToggle={() => togglePacked(`ess-${item}`)}
                    itemKey={`ess-${item}`}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2.5 border-t border-white/10 pt-4">
              <h3 className="font-mono text-[10px] font-bold text-slate-500 uppercase">
                Gear &amp; Tech
              </h3>
              <div className="space-y-1">
                {itinerary.packingChecklist.gearTech.map((item) => (
                  <PackingItem
                    key={`gear-${item}`}
                    label={item}
                    isPacked={!!packedItems[`gear-${item}`]}
                    onToggle={() => togglePacked(`gear-${item}`)}
                    itemKey={`gear-${item}`}
                  />
                ))}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
