import { Compass, Globe, Sparkles } from "lucide-react";

interface NavbarProps {
  onNewItinerary: () => void;
  onViewHistory: () => void;
  savedCount: number;
  currentTab: "plan" | "view" | "history";
}

export default function Navbar({ onNewItinerary, onViewHistory, savedCount, currentTab }: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#05070A]/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand logo */}
        <div 
          onClick={onNewItinerary} 
          className="flex cursor-pointer items-center gap-2.5 transition-opacity hover:opacity-95"
          id="navbar-logo"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]">
            <Compass className="h-5 w-5 animate-spin-[spin_12s_linear_infinite]" />
          </div>
          <div>
            <span className="font-display text-lg font-bold tracking-wider text-white">
              VALISE
            </span>
            <span className="ml-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-indigo-400">
              AI Travel
            </span>
          </div>
        </div>

        {/* Dynamic Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={onNewItinerary}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-sans text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              currentTab === "plan"
                ? "bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
            id="nav-btn-plan"
          >
            <Sparkles className="h-4 w-4" />
            <span>Plan Itinerary</span>
          </button>

          <button
            onClick={onViewHistory}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-sans text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
              currentTab === "history"
                ? "bg-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                : "text-slate-400 hover:bg-white/5 hover:text-white"
            }`}
            id="nav-btn-history"
          >
            <Globe className="h-4 w-4" />
            <span>My Trips</span>
            {savedCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-500 px-1 font-mono text-[10px] font-black text-white">
                {savedCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
