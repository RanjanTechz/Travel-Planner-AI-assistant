export interface BudgetDetail {
  cost: string;
  style: string;
}

export interface BudgetEstimate {
  accommodation: BudgetDetail;
  foodAndDrink: BudgetDetail;
  transportation: BudgetDetail;
  activities: BudgetDetail;
  totalCost: string;
}

export interface TimelineSlot {
  activity: string;
  location: string;
  tip: string;
}

export interface Timeline {
  morning: TimelineSlot;
  afternoon: TimelineSlot;
  evening: TimelineSlot;
}

export interface HiddenGem {
  name: string;
  description: string;
}

export interface DayItinerary {
  dayNumber: number;
  theme: string;
  paceLevel: "Low" | "Medium" | "High" | string;
  timeline: Timeline;
  hiddenGem: HiddenGem;
}

export interface LocalInsights {
  culturalEtiquette: string[];
  tippingAndCurrency: string;
  safetyScamAlert: string;
}

export interface PackingChecklist {
  essentials: string[];
  clothingVibe: string;
  gearTech: string[];
}

export interface RecommendedDestination {
  city: string;
  country: string;
}

export interface Itinerary {
  id?: string;
  createdAt?: string;
  searchParams?: {
    destination: string;
    vibe: string;
    duration: number;
    budgetLevel: string;
    travelParty: string;
    interests: string[];
  };
  recommendedDestination: RecommendedDestination;
  vibeMatch: string;
  budgetEstimate: BudgetEstimate;
  dayWiseItinerary: DayItinerary[];
  localInsights: LocalInsights;
  packingChecklist: PackingChecklist;
}
