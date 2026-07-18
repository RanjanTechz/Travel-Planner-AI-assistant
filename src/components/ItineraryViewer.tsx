import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Compass, MapPin, Calendar, DollarSign, Users, Sparkles, 
  CheckCircle, Clock, Lightbulb, ShieldAlert, BookOpen, Printer, Save,
  CheckSquare, Square, FileText, ChevronDown, ChevronUp, RefreshCw
} from "lucide-react";
import { Itinerary } from "../types";

interface ItineraryViewerProps {
  itinerary: Itinerary;
  onSave: (updated: Itinerary) => void;
  isSaved: boolean;
  onGenerateNew: () => void;
}

export default function ItineraryViewer({ itinerary, onSave, isSaved, onGenerateNew }: ItineraryViewerProps) {
  const [activeDay, setActiveDay] = useState<number>(1);
  const [completedActivities, setCompletedActivities] = useState<Record<string, boolean>>({});
  const [packedItems, setPackedItems] = useState<Record<string, boolean>>({});
  const [dayNotes, setDayNotes] = useState<Record<number, string>>({});
  const [savedStatus, setSavedStatus] = useState(isSaved);

  // Sync internal saved state when prop changes
  useEffect(() => {
    setSavedStatus(isSaved);
  }, [isSaved]);

  const toggleActivity = (dayKey: string) => {
    setCompletedActivities(prev => {
      const next = { ...prev, [dayKey]: !prev[dayKey] };
      triggerAutoSave(next, packedItems, dayNotes);
      return next;
    });
  };

  const togglePacked = (itemKey: string) => {
    setPackedItems(prev => {
      const next = { ...prev, [itemKey]: !prev[itemKey] };
      triggerAutoSave(completedActivities, next, dayNotes);
      return next;
    });
  };

  const handleNoteChange = (dayNumber: number, note: string) => {
    setDayNotes(prev => {
      const next = { ...prev, [dayNumber]: note };
      triggerAutoSave(completedActivities, packedItems, next);
      return next;
    });
  };

  const triggerAutoSave = (
    acts: Record<string, boolean>,
    pkd: Record<string, boolean>,
    notes: Record<number, string>
  ) => {
    // Standard auto-save logic placeholders
  };

  const handlePrint = () => {
    window.print();
  };

  // Safe save handler
  const handleSaveClick = () => {
    const annotated: Itinerary = {
      ...itinerary,
      id: itinerary.id || `${itinerary.recommendedDestination.city.toLowerCase()}-${Date.now()}`,
      createdAt: itinerary.createdAt || new Date().toISOString(),
      dayWiseItinerary: itinerary.dayWiseItinerary.map(day => ({
        ...day,
      }))
    };
    onSave(annotated);
    setSavedStatus(true);
  };

  // Parse costs to numbers for beautiful visual display
  const getProgressWidth = (costStr: string, maxVal: number = 500): number => {
    const num = parseInt(costStr.replace(/[^0-9]/g, "")) || 50;
    return Math.min(100, Math.max(15, (num / maxVal) * 100));
  };

  // Count packing checklist progress
  const totalItems = 
    itinerary.packingChecklist.essentials.length + 
    itinerary.packingChecklist.gearTech.length;
  const packedCount = 
    itinerary.packingChecklist.essentials.filter(i => packedItems[`ess-${i}`]).length + 
    itinerary.packingChecklist.gearTech.filter(i => packedItems[`gear-${i}`]).length;
  const packingPercent = totalItems > 0 ? Math.round((packedCount / totalItems) * 100) : 0;

  return (
    <div className="space-y-12 animate-fade-in" id="itinerary-print-area">
      {/* Header Info Card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        <div className="absolute top-0 right-0 h-32 w-32 translate-x-12 -translate-y-12 rounded-full bg-indigo-500/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 h-32 w-32 -translate-x-12 translate-y-12 rounded-full bg-purple-500/10 blur-3xl"></div>

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-indigo-400 uppercase tracking-widest border border-indigo-500/30">
                Destination Curation
              </span>
              <span className="font-mono text-[10px] font-bold text-slate-500">
                Created {new Date().toLocaleDateString()}
              </span>
            </div>
            <h1 className="mt-3 font-display text-3xl font-light tracking-tight text-white sm:text-4xl lg:text-5xl">
              {itinerary.recommendedDestination.city}, <span className="text-indigo-400 italic font-medium">{itinerary.recommendedDestination.country}</span>
            </h1>
            <p className="mt-4 font-sans text-sm text-slate-300 max-w-3xl leading-relaxed italic border-l-2 border-indigo-500/40 pl-4 bg-white/[0.01] py-2.5 rounded-r-lg">
              "{itinerary.vibeMatch}"
            </p>
          </div>

          <div className="flex flex-row md:flex-col gap-3 flex-wrap print:hidden">
            <button
              onClick={handleSaveClick}
              disabled={savedStatus}
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-sans text-xs font-bold transition-all shadow-lg ${
                savedStatus
                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]"
              }`}
              id="save-trip-btn"
            >
              {savedStatus ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Trip Saved!</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save to My Trips</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-4 py-2.5 font-sans text-xs font-bold transition-all shadow-md"
              id="print-trip-btn"
            >
              <Printer className="h-4 w-4" />
              <span>Print Plan</span>
            </button>

            <button
              onClick={onGenerateNew}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white px-4 py-2.5 font-sans text-xs font-bold transition-all shadow-md"
              id="new-trip-btn"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Plan Another</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Timeline / Right Sidebar */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Timeline Column (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="font-display text-xl font-light tracking-tight text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-400" />
              Day-by-Day Schedule
            </h2>
            <div className="flex flex-wrap gap-1" id="day-nav-group">
              {itinerary.dayWiseItinerary.map(day => (
                <button
                  key={day.dayNumber}
                  onClick={() => setActiveDay(day.dayNumber)}
                  className={`flex h-8 min-w-8 items-center justify-center rounded-lg font-mono text-xs font-bold transition-all duration-300 border ${
                    activeDay === day.dayNumber
                      ? "bg-indigo-600 text-white shadow-[0_0_8px_#6366f1] border-indigo-500"
                      : "bg-white/[0.03] text-slate-400 hover:bg-white/10 hover:text-white border-white/5"
                  }`}
                  id={`day-nav-${day.dayNumber}`}
                >
                  D{day.dayNumber}
                </button>
              ))}
            </div>
          </div>

          {/* Staggered Day Cards */}
          <div className="space-y-4">
            {itinerary.dayWiseItinerary.map(day => {
              const isExpanded = activeDay === day.dayNumber;
              return (
                <div
                  key={day.dayNumber}
                  className={`overflow-hidden rounded-xl border transition-all duration-300 ${
                    isExpanded 
                      ? "border-indigo-500/30 bg-white/[0.03] shadow-[0_0_15px_rgba(99,102,241,0.1)]" 
                      : "border-white/5 bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/10 cursor-pointer"
                  }`}
                  onClick={() => {
                    if (!isExpanded) setActiveDay(day.dayNumber);
                  }}
                  id={`day-card-${day.dayNumber}`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white font-mono text-sm font-bold shadow-[0_0_8px_rgba(99,102,241,0.4)]">
                        {day.dayNumber}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold uppercase text-indigo-400">
                            Day {day.dayNumber}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded px-2 py-0.2 font-mono text-[9px] font-bold uppercase ${
                            day.paceLevel === "Low" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" :
                            day.paceLevel === "Medium" ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/20" :
                            "bg-red-500/20 text-red-400 border border-red-500/20"
                          }`}>
                            Pace: {day.paceLevel}
                          </span>
                        </div>
                        <h3 className="font-display text-base font-bold text-slate-100 mt-0.5">
                          {day.theme}
                        </h3>
                      </div>
                    </div>

                    <button className="text-slate-500 hover:text-white transition-colors" id={`day-toggle-${day.dayNumber}`}>
                      {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Body Details (Animated) */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-white/5 bg-white/[0.01]"
                      >
                        <div className="p-5 sm:p-6 space-y-6">
                          {/* Timeline segments */}
                          <div className="space-y-6 relative before:absolute before:left-4.5 before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
                            
                            {/* Morning Slot */}
                            <div className="flex gap-4 relative">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 z-10 font-mono text-xs font-bold shadow-[0_0_8px_rgba(99,102,241,0.1)]">
                                AM
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-indigo-400" />
                                    Morning Exploration
                                  </span>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleActivity(`${day.dayNumber}-morning`);
                                    }}
                                    className="text-slate-500 hover:text-white transition-colors"
                                    id={`check-morning-d${day.dayNumber}`}
                                  >
                                    {completedActivities[`${day.dayNumber}-morning`] ? (
                                      <CheckSquare className="h-4 w-4 text-indigo-400" />
                                    ) : (
                                      <Square className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                                <h4 className={`font-display text-sm font-bold text-white ${completedActivities[`${day.dayNumber}-morning`] ? "line-through text-slate-500" : ""}`}>
                                  {day.timeline.morning.activity}
                               </h4>
                                <p className="font-sans text-xs text-slate-400">
                                  📍 <span className="font-semibold text-slate-300">{day.timeline.morning.location}</span>
                                </p>
                                <p className="font-sans text-xs text-slate-400 bg-white/[0.02] p-2.5 rounded-lg border border-white/5 flex items-start gap-1.5 mt-1.5">
                                  <Lightbulb className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                                  <span>{day.timeline.morning.tip}</span>
                                </p>
                              </div>
                            </div>

                            {/* Afternoon Slot */}
                            <div className="flex gap-4 relative">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 z-10 font-mono text-xs font-bold shadow-[0_0_8px_rgba(99,102,241,0.1)]">
                                PM
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-indigo-400" />
                                    Afternoon & Local Gastronomy
                                  </span>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleActivity(`${day.dayNumber}-afternoon`);
                                    }}
                                    className="text-slate-500 hover:text-white transition-colors"
                                    id={`check-afternoon-d${day.dayNumber}`}
                                  >
                                    {completedActivities[`${day.dayNumber}-afternoon`] ? (
                                      <CheckSquare className="h-4 w-4 text-indigo-400" />
                                    ) : (
                                      <Square className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                                <h4 className={`font-display text-sm font-bold text-white ${completedActivities[`${day.dayNumber}-afternoon`] ? "line-through text-slate-500" : ""}`}>
                                  {day.timeline.afternoon.activity}
                                </h4>
                                <p className="font-sans text-xs text-slate-400">
                                  🍴 <span className="font-semibold text-slate-300">{day.timeline.afternoon.location}</span>
                                </p>
                                <p className="font-sans text-xs text-slate-400 bg-white/[0.02] p-2.5 rounded-lg border border-white/5 flex items-start gap-1.5 mt-1.5">
                                  <Lightbulb className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                                  <span>{day.timeline.afternoon.tip}</span>
                                </p>
                              </div>
                            </div>

                            {/* Evening Slot */}
                            <div className="flex gap-4 relative">
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 z-10 font-mono text-xs font-bold shadow-[0_0_8px_rgba(99,102,241,0.1)]">
                                EV
                              </div>
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                                    <Clock className="h-3 w-3 text-indigo-400" />
                                    Evening & Wind Down
                                  </span>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleActivity(`${day.dayNumber}-evening`);
                                    }}
                                    className="text-slate-500 hover:text-white transition-colors"
                                    id={`check-evening-d${day.dayNumber}`}
                                  >
                                    {completedActivities[`${day.dayNumber}-evening`] ? (
                                      <CheckSquare className="h-4 w-4 text-indigo-400" />
                                    ) : (
                                      <Square className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>
                                <h4 className={`font-display text-sm font-bold text-white ${completedActivities[`${day.dayNumber}-evening`] ? "line-through text-slate-500" : ""}`}>
                                  {day.timeline.evening.activity}
                                </h4>
                                <p className="font-sans text-xs text-slate-400">
                                  🥂 <span className="font-semibold text-slate-300">{day.timeline.evening.location}</span>
                                </p>
                                <p className="font-sans text-xs text-slate-400 bg-white/[0.02] p-2.5 rounded-lg border border-white/5 flex items-start gap-1.5 mt-1.5">
                                  <Lightbulb className="h-3.5 w-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                                  <span>{day.timeline.evening.tip}</span>
                                </p>
                              </div>
                            </div>

                          </div>

                          {/* Hidden Gem Panel */}
                          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-1 backdrop-blur-md">
                            <span className="font-mono text-[9px] uppercase font-extrabold text-indigo-400 tracking-wider flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              Hidden Gem of the Day
                            </span>
                            <h4 className="font-display text-sm font-bold text-white italic">
                              {day.hiddenGem.name}
                            </h4>
                            <p className="font-sans text-xs text-slate-400 leading-relaxed">
                              {day.hiddenGem.description}
                            </p>
                          </div>

                          {/* Personal Notes Box */}
                          <div className="space-y-1.5 pt-4 border-t border-white/10 print:hidden">
                            <label className="font-display text-xs font-semibold text-slate-400 flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5 text-indigo-400" />
                              Personal Notes for Day {day.dayNumber}
                            </label>
                            <textarea
                              className="w-full rounded-lg border border-white/10 bg-white/[0.02] p-2.5 font-sans text-xs text-white outline-none transition-all focus:border-indigo-500 focus:bg-white/[0.05]"
                              rows={2}
                              placeholder="Write dining bookings, meeting times, or key reminders here..."
                              value={dayNotes[day.dayNumber] || ""}
                              onChange={(e) => handleNoteChange(day.dayNumber, e.target.value)}
                              id={`day-notes-input-d${day.dayNumber}`}
                            />
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Column (Right 1 col) */}
        <div className="space-y-8">
          {/* Cost Estimates Visual Card */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-6">
            <div>
              <span className="font-mono text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                Cost Breakdown
              </span>
              <h2 className="mt-1 font-display text-lg font-light text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-indigo-400" />
                Budget Estimates
              </h2>
            </div>

            <div className="space-y-4">
              {/* Accommodation */}
              <div className="space-y-1">
                <div className="flex justify-between font-sans text-xs">
                  <span className="font-medium text-slate-400">Accommodation</span>
                  <span className="font-mono font-bold text-white">{itinerary.budgetEstimate.accommodation.cost}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full shadow-[0_0_8px_#6366f1]" 
                    style={{ width: `${getProgressWidth(itinerary.budgetEstimate.accommodation.cost, 300)}%` }}
                  ></div>
                </div>
                <p className="font-mono text-[9px] text-slate-500">{itinerary.budgetEstimate.accommodation.style}</p>
              </div>

              {/* Food & Drink */}
              <div className="space-y-1">
                <div className="flex justify-between font-sans text-xs">
                  <span className="font-medium text-slate-400">Dining & Refreshments</span>
                  <span className="font-mono font-bold text-white">{itinerary.budgetEstimate.foodAndDrink.cost}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <div 
                    className="h-full bg-indigo-400 rounded-full shadow-[0_0_8px_#818cf8]" 
                    style={{ width: `${getProgressWidth(itinerary.budgetEstimate.foodAndDrink.cost, 150)}%` }}
                  ></div>
                </div>
                <p className="font-mono text-[9px] text-slate-500">{itinerary.budgetEstimate.foodAndDrink.style}</p>
              </div>

              {/* Transportation */}
              <div className="space-y-1">
                <div className="flex justify-between font-sans text-xs">
                  <span className="font-medium text-slate-400">Local Transport</span>
                  <span className="font-mono font-bold text-white">{itinerary.budgetEstimate.transportation.cost}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <div 
                    className="h-full bg-indigo-400 rounded-full" 
                    style={{ width: `${getProgressWidth(itinerary.budgetEstimate.transportation.cost, 100)}%` }}
                  ></div>
                </div>
                <p className="font-mono text-[9px] text-slate-500">{itinerary.budgetEstimate.transportation.style}</p>
              </div>

              {/* Activities */}
              <div className="space-y-1">
                <div className="flex justify-between font-sans text-xs">
                  <span className="font-medium text-slate-400">Leisure & Activities</span>
                  <span className="font-mono font-bold text-white">{itinerary.budgetEstimate.activities.cost}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full shadow-[0_0_8px_#6366f1]" 
                    style={{ width: `${getProgressWidth(itinerary.budgetEstimate.activities.cost, 250)}%` }}
                  ></div>
                </div>
                <p className="font-mono text-[9px] text-slate-500">{itinerary.budgetEstimate.activities.style}</p>
              </div>
            </div>

            {/* Total Estimated Box */}
            <div className="border-t border-dashed border-white/10 pt-5 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-slate-500 uppercase font-bold">Estimated Trip Total</span>
                <p className="font-display text-3xl font-light tracking-tighter text-white mt-0.5">
                  {itinerary.budgetEstimate.totalCost}
                </p>
              </div>
              <div className="h-10 w-10 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-lg flex items-center justify-center font-display text-lg font-black">
                $
              </div>
            </div>
          </div>

          {/* Local Insights Area */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-6">
            <h2 className="font-display text-lg font-light text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-400" />
              Local Insights
            </h2>

            {/* Cultural Etiquette */}
            <div className="space-y-2">
              <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">Cultural Etiquette</span>
              <ul className="space-y-1.5">
                {itinerary.localInsights.culturalEtiquette.map((tip, idx) => (
                  <li key={idx} className="font-sans text-xs text-slate-400 flex items-start gap-2 leading-relaxed">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500 shadow-[0_0_6px_#6366f1]"></span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Tipping & Currency */}
            <div className="space-y-1.5">
              <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">Tipping & Currency</span>
              <p className="font-sans text-xs text-slate-400 leading-relaxed">
                {itinerary.localInsights.tippingAndCurrency}
              </p>
            </div>

            {/* Safety/Scam Warning */}
            <div className="border-t border-white/10 pt-4 space-y-1.5">
              <span className="font-mono text-[10px] font-bold text-red-400 uppercase flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                Scam & Safety Alert
              </span>
              <p className="font-sans text-xs text-slate-400 leading-relaxed bg-red-500/5 p-3 rounded-xl border border-red-500/10">
                {itinerary.localInsights.safetyScamAlert}
              </p>
            </div>
          </div>

          {/* Packing Checklist Tracker */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-light text-white flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-indigo-400" />
                Packing Tracker
              </h2>
              <span className="font-mono text-xs font-bold text-indigo-300 bg-indigo-600/30 border border-indigo-500/30 px-2 py-0.5 rounded-md">
                {packingPercent}%
              </span>
            </div>

            <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-300 shadow-[0_0_8px_#10b981]" 
                style={{ width: `${packingPercent}%` }}
              ></div>
            </div>

            {/* Clothing Vibe */}
            <div className="rounded-xl border border-white/10 bg-white/[0.01] p-3">
              <span className="font-mono text-[9px] uppercase font-bold text-indigo-400">Style & Vibe</span>
              <p className="font-sans text-xs text-slate-400 leading-relaxed mt-0.5">
                {itinerary.packingChecklist.clothingVibe}
              </p>
            </div>

            {/* Essentials */}
            <div className="space-y-2.5">
              <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">Absolute Essentials</span>
              <div className="space-y-1.5">
                {itinerary.packingChecklist.essentials.map((item, idx) => {
                  const key = `ess-${item}`;
                  const isPacked = packedItems[key];
                  return (
                    <div 
                      key={idx} 
                      onClick={() => togglePacked(key)}
                      className="flex items-center gap-2.5 cursor-pointer group text-left"
                    >
                      <button className="text-slate-500 group-hover:text-white transition-colors">
                        {isPacked ? (
                          <CheckSquare className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-600" />
                        )}
                      </button>
                      <span className={`font-sans text-xs ${isPacked ? "line-through text-slate-500" : "text-slate-300 hover:text-white transition-colors"}`}>
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gear & Tech */}
            <div className="space-y-2.5 border-t border-white/10 pt-4">
              <span className="font-mono text-[10px] font-bold text-slate-500 uppercase">Gear & Tech</span>
              <div className="space-y-1.5">
                {itinerary.packingChecklist.gearTech.map((item, idx) => {
                  const key = `gear-${item}`;
                  const isPacked = packedItems[key];
                  return (
                    <div 
                      key={idx} 
                      onClick={() => togglePacked(key)}
                      className="flex items-center gap-2.5 cursor-pointer group text-left"
                    >
                      <button className="text-slate-500 group-hover:text-white transition-colors">
                        {isPacked ? (
                          <CheckSquare className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-600" />
                        )}
                      </button>
                      <span className={`font-sans text-xs ${isPacked ? "line-through text-slate-500" : "text-slate-300 hover:text-white transition-colors"}`}>
                        {item}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
