"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import TripSetup from "@/components/personal/TripSetup";
import TripCalendar from "@/components/personal/TripCalendar";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

interface ItineraryActivity {
  id: string;
  time: string;
  title: string;
  description: string;
  category: string;
  estimatedCost: string;
}

interface ItineraryDay {
  day: number;
  title: string;
  activities: ItineraryActivity[];
}

interface Accommodation {
  area: string;
  description: string;
  budgetRange: string;
  searchUrl: string;
  chosenPlace?: string;
  userNotes?: string;
}

export interface TripPlan {
  title: string;
  summary: string;
  days: ItineraryDay[];
  accommodation: Accommodation[];
  tips: string[];
  estimatedBudget: Record<string, string>;
  countryName: string;
  countryCode: string;
  hasTransport: boolean;
  tripDays: number;
}

export default function NewPlanClient() {
  const searchParams = useSearchParams();
  const countryCode = searchParams.get("country") || "";
  const countryName = searchParams.get("name") || "";

  const [step, setStep] = useState<"setup" | "generating" | "calendar">("setup");
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [savedActivities, setSavedActivities] = useState<string[]>([]);

  // Load saved activities from country detail page
  useEffect(() => {
    if (countryCode) {
      try {
        const data = localStorage.getItem(`plan_setup_${countryCode}`);
        if (data) {
          const parsed = JSON.parse(data);
          setSavedActivities(parsed.selectedActivities || []);
        }
      } catch { /* ignore */ }
    }
  }, [countryCode]);

  const handleGenerate = async (config: {
    days: number;
    hasTransport: boolean;
    interests: string;
    selectedActivities: string[];
    customActivities: string[];
  }) => {
    setStep("generating");

    const allActivities = [...config.selectedActivities, ...config.customActivities];

    try {
      const res = await fetch("/api/plan-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryName,
          countryCode,
          activities: allActivities,
          days: config.days,
          interests: config.interests,
          hasTransport: config.hasTransport,
        }),
      });

      if (!res.ok) throw new Error("Failed to generate");
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Add IDs to activities for drag-drop
      const planWithIds: TripPlan = {
        ...data,
        countryName,
        countryCode,
        hasTransport: config.hasTransport,
        tripDays: config.days,
        days: (data.days || []).map((day: ItineraryDay) => ({
          ...day,
          activities: (day.activities || []).map((act: ItineraryActivity) => ({
            ...act,
            id: crypto.randomUUID(),
          })),
        })),
      };

      setPlan(planWithIds);
      setStep("calendar");
    } catch (e) {
      console.error(e);
      setStep("setup");
    }
  };

  return (
    <div>
      <Link href="/personal" className="text-sm text-gray-500 hover:text-teal-600 transition-colors mb-6 inline-block">
        &larr; Back to My Trips
      </Link>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Plan Your Trip to {countryName}
        </h1>
        <p className="text-gray-500 mt-1">
          {step === "setup" && "Set up your preferences and let AI create your perfect itinerary."}
          {step === "generating" && "AI is crafting your personalized itinerary..."}
          {step === "calendar" && "Your itinerary is ready! Drag items to rearrange, edit, or refine."}
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {["Preferences", "Generate", "Itinerary"].map((label, i) => {
          const stepIndex = i === 0 ? "setup" : i === 1 ? "generating" : "calendar";
          const isActive = step === stepIndex;
          const isPast = (step === "generating" && i === 0) || (step === "calendar" && i < 2);
          return (
            <div key={label} className="flex items-center gap-2">
              {i > 0 && <div className={`w-8 h-0.5 ${isPast || isActive ? "bg-teal-500" : "bg-gray-200"}`} />}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                isActive ? "bg-teal-500 text-white" : isPast ? "bg-teal-100 text-teal-700" : "bg-gray-100 text-gray-500"
              }`}>
                {isPast ? "✓" : i + 1}. {label}
              </div>
            </div>
          );
        })}
      </div>

      {step === "setup" && (
        <TripSetup
          countryName={countryName}
          countryCode={countryCode}
          savedActivities={savedActivities}
          onGenerate={handleGenerate}
        />
      )}

      {step === "generating" && (
        <LoadingSpinner message="AI is planning your perfect trip..." />
      )}

      {step === "calendar" && plan && (
        <TripCalendar
          plan={plan}
          onUpdatePlan={setPlan}
          onRegenerate={() => setStep("setup")}
        />
      )}
    </div>
  );
}
