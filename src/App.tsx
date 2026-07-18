import { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import ItineraryForm from "./components/ItineraryForm";
import ItineraryViewer from "./components/ItineraryViewer";
import SavedItineraries from "./components/SavedItineraries";
import { Itinerary } from "./types";
import { AlertTriangle, Sparkles, Compass } from "lucide-react";

/** Local-storage key for persisted trips */
const STORAGE_KEY = "valise_saved_trips";

/** Tabs the app supports */
type AppTab = "plan" | "view" | "history";

/** Parameters accepted by the itinerary form */
interface PlanParams {
  destination: string;
  vibe: string;
  duration: number;
  budgetLevel: string;
  travelParty: string;
  interests: string[];
}

/**
 * Sanitises a raw error value into a safe, user-facing string.
 * Prevents leaking internal stack-traces or server internals.
 */
function toUserMessage(err: unknown): string {
  if (err instanceof Error) {
    // Only expose the message; never expose stack or internal details.
    const msg = err.message || "";
    // Strip any accidental stack lines
    const firstLine = msg.split("\n")[0].trim();
    return firstLine || "An unexpected error occurred. Please try again.";
  }
  return "An unexpected error occurred. Please try again.";
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>("plan");
  const [currentItinerary, setCurrentItinerary] = useState<Itinerary | null>(null);
  const [savedTrips, setSavedTrips] = useState<Itinerary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load saved trips from localStorage on mount ──────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedTrips(JSON.parse(stored) as Itinerary[]);
      }
    } catch {
      // Silently ignore — localStorage may be unavailable or corrupt.
    }
  }, []);

  // ── Persist saved trips whenever the list changes ─────────────────────────
  const updateSavedTrips = useCallback((newList: Itinerary[]) => {
    setSavedTrips(newList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch {
      // localStorage write failed (e.g. private mode quota) — ignore silently.
    }
  }, []);

  // ── Form submission: call backend, then switch to viewer ──────────────────
  const handleFormSubmit = useCallback(async (params: PlanParams) => {
    setIsLoading(true);
    setError(null);
    setCurrentItinerary(null);

    try {
      const res = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(
          errorData.error || `Server responded with status ${res.status}`
        );
      }

      const data = await res.json() as Itinerary;
      data.searchParams = params;
      data.id = `${data.recommendedDestination.city.toLowerCase()}-${Date.now()}`;
      data.createdAt = new Date().toISOString();

      setCurrentItinerary(data);
      setCurrentTab("view");
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Save / delete helpers ─────────────────────────────────────────────────
  const handleSaveItinerary = useCallback((itineraryToSave: Itinerary) => {
    setSavedTrips((prev) => {
      if (prev.some((t) => t.id === itineraryToSave.id)) return prev;
      const next = [itineraryToSave, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  const handleDeleteItinerary = useCallback((id: string) => {
    updateSavedTrips(savedTrips.filter((t) => t.id !== id));
    if (currentItinerary?.id === id) setCurrentItinerary(null);
  }, [savedTrips, currentItinerary, updateSavedTrips]);

  const handleSelectItinerary = useCallback((itinerary: Itinerary) => {
    setCurrentItinerary(itinerary);
    setCurrentTab("view");
  }, []);

  const isCurrentlySaved = currentItinerary
    ? savedTrips.some((t) => t.id === currentItinerary.id)
    : false;

  return (
    <div className="min-h-screen bg-[#05070A] text-slate-100 font-sans selection:bg-indigo-600 selection:text-white pb-24">
      {/* ── Navigation ────────────────────────────────────────────────────── */}
      <Navbar
        onNewItinerary={() => { setError(null); setCurrentTab("plan"); }}
        onViewHistory={() => { setError(null); setCurrentTab("history"); }}
        savedCount={savedTrips.length}
        currentTab={currentTab}
      />

      {/* ── Main content area ─────────────────────────────────────────────── */}
      <main
        id="main-content"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10"
        aria-busy={isLoading}
      >
        {/* Global Error Notice — role="alert" so screen readers announce it */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 flex items-start gap-3.5 max-w-3xl mx-auto backdrop-blur-md"
          >
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <h2 className="font-display text-sm font-bold text-red-200">
                Planning Interrupted
              </h2>
              <p className="font-sans text-xs text-red-300/80 leading-relaxed">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* ── Route views ───────────────────────────────────────────────── */}
        {currentTab === "plan" && (
          <div className="max-w-4xl mx-auto">
            <ItineraryForm onSubmit={handleFormSubmit} isLoading={isLoading} />
          </div>
        )}

        {currentTab === "view" && currentItinerary && (
          <ItineraryViewer
            itinerary={currentItinerary}
            onSave={handleSaveItinerary}
            isSaved={isCurrentlySaved}
            onGenerateNew={() => setCurrentTab("plan")}
          />
        )}

        {currentTab === "history" && (
          <SavedItineraries
            savedList={savedTrips}
            onSelect={handleSelectItinerary}
            onDelete={handleDeleteItinerary}
            onStartNew={() => setCurrentTab("plan")}
          />
        )}

        {/* ── Full-screen loading overlay ───────────────────────────────── */}
        {isLoading && (
          <div
            role="status"
            aria-live="polite"
            aria-label="Assembling your custom itinerary, please wait…"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05070A]/95 backdrop-blur-md"
          >
            <div className="flex flex-col items-center max-w-md p-8 text-center space-y-6">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-indigo-400/30">
                  <Compass className="h-8 w-8 animate-spin" aria-hidden="true" />
                </div>
                <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white shadow-md" aria-hidden="true">
                  <Sparkles className="h-3 w-3 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="font-display text-lg font-light tracking-tight text-white">
                  Assembling Your Custom{" "}
                  <span className="text-indigo-400 italic">Journey</span>
                </h2>
                <p className="font-sans text-xs text-slate-400 animate-pulse">
                  Aligning local hotspots, verifying budget ranges, and securing
                  off-the-beaten-path hidden gems…
                </p>
              </div>

              <div
                className="rounded-xl bg-white/[0.02] border border-white/10 p-4 w-full text-left font-mono text-[10px] text-slate-400 space-y-2"
                aria-hidden="true"
              >
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping" />
                  <span className="text-indigo-300">Contacting world travel database…</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                  <span>Analyzing transit networks &amp; proximity…</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-700" />
                  <span>Calibrating custom pacing parameters…</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
