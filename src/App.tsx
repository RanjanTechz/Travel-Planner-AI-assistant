import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import ItineraryForm from "./components/ItineraryForm";
import ItineraryViewer from "./components/ItineraryViewer";
import SavedItineraries from "./components/SavedItineraries";
import { Itinerary } from "./types";
import { AlertTriangle, Sparkles, Compass, HelpCircle } from "lucide-react";

export default function App() {
  const [currentTab, setCurrentTab] = useState<"plan" | "view" | "history">("plan");
  const [currentItinerary, setCurrentItinerary] = useState<Itinerary | null>(null);
  const [savedTrips, setSavedTrips] = useState<Itinerary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved trips from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("valise_saved_trips");
      if (stored) {
        setSavedTrips(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load saved trips from localStorage:", e);
    }
  }, []);

  // Save trips to localStorage whenever list changes
  const updateSavedTrips = (newList: Itinerary[]) => {
    setSavedTrips(newList);
    try {
      localStorage.setItem("valise_saved_trips", JSON.stringify(newList));
    } catch (e) {
      console.error("Failed to save trips to localStorage:", e);
    }
  };

  const handleFormSubmit = async (params: {
    destination: string;
    vibe: string;
    duration: number;
    budgetLevel: string;
    travelParty: string;
    interests: string[];
  }) => {
    setIsLoading(true);
    setError(null);
    setCurrentItinerary(null);

    try {
      const res = await fetch("/api/generate-itinerary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${res.status}`);
      }

      const data: Itinerary = await res.json();
      
      // Inject search params for local historical context
      data.searchParams = params;
      data.id = `${data.recommendedDestination.city.toLowerCase()}-${Date.now()}`;
      data.createdAt = new Date().toISOString();

      setCurrentItinerary(data);
      setCurrentTab("view");
    } catch (err: any) {
      console.error("Generation error:", err);
      setError(
        err.message || "Failed to assemble your itinerary. Please ensure your query is complete or try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveItinerary = (itineraryToSave: Itinerary) => {
    // Check if already in list to prevent duplicates
    const exists = savedTrips.some((trip) => trip.id === itineraryToSave.id);
    if (!exists) {
      updateSavedTrips([itineraryToSave, ...savedTrips]);
    }
  };

  const handleDeleteItinerary = (id: string) => {
    const updated = savedTrips.filter((trip) => trip.id !== id);
    updateSavedTrips(updated);
    
    // If deleted the currently viewed itinerary, clear it or reset
    if (currentItinerary?.id === id) {
      setCurrentItinerary(null);
    }
  };

  const handleSelectItinerary = (itinerary: Itinerary) => {
    setCurrentItinerary(itinerary);
    setCurrentTab("view");
  };

  // Determine if the currently viewed itinerary is already saved
  const isCurrentlySaved = currentItinerary 
    ? savedTrips.some((trip) => trip.id === currentItinerary.id)
    : false;

  return (
    <div className="min-h-screen bg-[#05070A] text-slate-100 font-sans selection:bg-indigo-600 selection:text-white pb-24">
      {/* Navigation Header */}
      <Navbar
        onNewItinerary={() => {
          setError(null);
          setCurrentTab("plan");
        }}
        onViewHistory={() => {
          setError(null);
          setCurrentTab("history");
        }}
        savedCount={savedTrips.length}
        currentTab={currentTab}
      />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* Global Error Notice */}
        {error && (
          <div className="mb-8 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 flex items-start gap-3.5 max-w-3xl mx-auto backdrop-blur-md">
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-display text-sm font-bold text-red-200">
                Planning Interrupted
              </h3>
              <p className="font-sans text-xs text-red-300/80 leading-relaxed">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Dynamic Route views */}
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

        {/* Global Full-screen loading modal */}
        {isLoading && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#05070A]/95 backdrop-blur-md">
            <div className="flex flex-col items-center max-w-md p-8 text-center space-y-6">
              <div className="relative">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-indigo-400/30">
                  <Compass className="h-8 w-8 animate-spin" />
                </div>
                <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white shadow-md">
                  <Sparkles className="h-3 w-3 animate-pulse" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-display text-lg font-light tracking-tight text-white">
                  Assembling Your Custom <span className="text-indigo-400 italic">Journey</span>
                </h3>
                <p className="font-sans text-xs text-slate-400 animate-pulse">
                  Aligning local hotspots, verifying budget ranges, and securing off-the-beaten-path hidden gems...
                </p>
              </div>

              {/* Reassuring user-experience steps */}
              <div className="rounded-xl bg-white/[0.02] border border-white/10 p-4 w-full text-left font-mono text-[10px] text-slate-400 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                  <span className="text-indigo-300">Contacting world travel database...</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-700"></span>
                  <span>Analyzing transit networks & proximity...</span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-700"></span>
                  <span>Calibrating custom pacing parameters...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
