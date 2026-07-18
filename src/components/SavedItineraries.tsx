import { useCallback } from "react";
import { MapPin, Calendar, Trash2, ArrowRight, Compass } from "lucide-react";
import { Itinerary } from "../types";

// ── Types ──────────────────────────────────────────────────────────────────

interface SavedItinerariesProps {
  savedList: Itinerary[];
  onSelect: (itinerary: Itinerary) => void;
  onDelete: (id: string) => void;
  onStartNew: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function SavedItineraries({
  savedList,
  onSelect,
  onDelete,
  onStartNew,
}: SavedItinerariesProps) {

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      onDelete(id);
    },
    [onDelete]
  );

  // ── Empty state ──────────────────────────────────────────────────────────
  if (savedList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto space-y-6">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.03] text-indigo-400 border border-white/10 shadow-[0_0_15px_rgba(99,102,241,0.15)] animate-pulse"
          aria-hidden="true"
        >
          <Compass className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-xl font-bold text-white">
            No Saved Trips Yet
          </h1>
          <p className="font-sans text-sm text-slate-400 leading-relaxed">
            You haven't generated or saved any dream itineraries yet. Use our planner
            to create your next custom adventure!
          </p>
        </div>
        <button
          onClick={onStartNew}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-sans text-xs font-bold uppercase tracking-wider py-3 px-6 transition-all duration-300 shadow-[0_0_12px_rgba(99,102,241,0.3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070A]"
          id="saved-start-new-btn"
        >
          Plan a New Trip
        </button>
      </div>
    );
  }

  // ── List ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header>
        <p className="text-[10px] uppercase tracking-[0.3em] text-indigo-400 font-bold mb-1">
          AI Premium Concierge
        </p>
        <h1 className="font-display text-3xl font-light tracking-tight text-white">
          Your Saved <span className="text-indigo-400 italic">Escapes</span>
        </h1>
        <p className="mt-1.5 text-sm text-slate-400 font-sans">
          Manage and review all your previously curated itineraries and travel plans.
        </p>
      </header>

      {/* Announce live count for screen readers */}
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {savedList.length} saved trip{savedList.length !== 1 ? "s" : ""} found.
      </p>

      <ul className="grid gap-4" aria-label="Saved itineraries">
        {savedList.map((itinerary) => {
          const destinationLabel = `${itinerary.recommendedDestination.city}, ${itinerary.recommendedDestination.country}`;
          const dateLabel = itinerary.createdAt
            ? new Date(itinerary.createdAt).toLocaleDateString()
            : "Saved Plan";

          return (
            <li key={itinerary.id}>
              <article
                className="group flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/10 bg-white/[0.02] p-5 hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all duration-300 backdrop-blur-md"
                id={`saved-row-${itinerary.id}`}
                aria-label={`Saved trip: ${destinationLabel}, ${itinerary.dayWiseItinerary.length} days`}
              >
                {/* ── Metadata ────────────────────────────────────────── */}
                <div className="space-y-2.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-600/20 px-2.5 py-0.5 font-mono text-[10px] font-bold text-indigo-300 uppercase border border-indigo-500/30">
                      {itinerary.searchParams?.budgetLevel ?? "Custom"} Tier
                    </span>
                    <time
                      dateTime={itinerary.createdAt ?? ""}
                      className="font-mono text-[10px] text-slate-500"
                    >
                      {dateLabel}
                    </time>
                  </div>

                  <div>
                    <h2 className="font-display text-lg font-bold text-slate-200 group-hover:text-white transition-colors flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-indigo-400 flex-shrink-0" aria-hidden="true" />
                      {destinationLabel}
                    </h2>
                    <p className="mt-1.5 font-sans text-xs text-slate-400 line-clamp-1 max-w-xl italic">
                      "{itinerary.vibeMatch}"
                    </p>
                  </div>

                  <div className="flex items-center gap-4 font-mono text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-indigo-400" aria-hidden="true" />
                      {itinerary.dayWiseItinerary.length} Days
                    </span>
                    <span>Est. Total: {itinerary.budgetEstimate.totalCost}</span>
                  </div>
                </div>

                {/* ── Actions ─────────────────────────────────────────── */}
                <div className="flex items-center justify-end gap-3 mt-4 sm:mt-0 sm:ml-4 print:hidden">
                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, itinerary.id ?? "")}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all border border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070A]"
                    id={`saved-delete-btn-${itinerary.id}`}
                    aria-label={`Delete saved trip to ${destinationLabel}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelect(itinerary)}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-sans text-xs font-bold py-2.5 px-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070A]"
                    id={`saved-view-btn-${itinerary.id}`}
                    aria-label={`Open trip plan for ${destinationLabel}`}
                  >
                    <span>Open Plan</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
