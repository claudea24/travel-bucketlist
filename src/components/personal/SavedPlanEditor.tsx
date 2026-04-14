"use client";

import { useState } from "react";
import { TravelPlan, ItineraryItem, PlanAccommodation } from "@/lib/types";
import { useTravelPlans } from "@/context/TravelPlanContext";
import DaySchedule from "./DaySchedule";

interface Props {
  plan: TravelPlan;
  items: ItineraryItem[];
  accoms: PlanAccommodation[];
  onDelete: () => void;
}

type Tab = "overview" | "hotels" | "transport" | number;

export default function SavedPlanEditor({ plan, items, accoms, onDelete }: Props) {
  const { dispatch } = useTravelPlans();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [editingHeader, setEditingHeader] = useState(false);
  const [title, setTitle] = useState(plan.title);
  const [startDate, setStartDate] = useState(plan.startDate || "");
  const [endDate, setEndDate] = useState(plan.endDate || "");
  const [showAiRefine, setShowAiRefine] = useState(false);
  const [refineInput, setRefineInput] = useState("");
  const [refineLoading, setRefineLoading] = useState(false);
  const [editingAccom, setEditingAccom] = useState<string | null>(null);

  // Group items by day
  const dayGroups: Record<number, ItineraryItem[]> = {};
  items.forEach((item) => { const d = item.dayNumber || 1; if (!dayGroups[d]) dayGroups[d] = []; dayGroups[d].push(item); });
  Object.values(dayGroups).forEach((g) => g.sort((a, b) => a.sortOrder - b.sortOrder));
  const dayNumbers = Object.keys(dayGroups).map(Number).sort((a, b) => a - b);
  const maxDay = dayNumbers.length > 0 ? Math.max(...dayNumbers) : 0;

  // Map accommodations to days (by sort_order as day index)
  const accomByDay: Record<number, PlanAccommodation | undefined> = {};
  accoms.forEach((a, i) => { accomByDay[dayNumbers[i] || i + 1] = a; });

  const handleSaveHeader = () => {
    dispatch({ type: "UPDATE_PLAN", payload: { id: plan.id, title, startDate: startDate || null, endDate: endDate || null } });
    setEditingHeader(false);
  };

  const handleAddDay = () => {
    const newDay = maxDay + 1;
    dispatch({
      type: "ADD_ITINERARY_ITEM",
      payload: { id: crypto.randomUUID(), travelPlanId: plan.id, userId: "", dayNumber: newDay, title: "Free time", description: null, category: "activity", startTime: "09:00", endTime: null, estimatedCost: null, isBooked: false, sortOrder: 0, createdAt: new Date().toISOString() },
    });
    setActiveTab(newDay);
  };

  const handleRefine = async () => {
    if (!refineInput.trim()) return;
    setRefineLoading(true);
    try {
      const currentPlan = { title: plan.title, days: dayNumbers.map((d) => ({ day: d, title: `Day ${d}`, activities: (dayGroups[d] || []).map((i) => ({ time: i.startTime, title: i.title, description: i.description, category: i.category, estimatedCost: i.estimatedCost ? `$${i.estimatedCost}` : "" })) })) };
      const res = await fetch("/api/plan-trip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ countryName: plan.countryName, currentItinerary: JSON.stringify(currentPlan), refineRequest: refineInput.trim() }) });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      const validCats = new Set(["transport", "accommodation", "activity", "food", "other"]);
      const parseTime = (t: string | null): string | null => { if (!t) return null; const m = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i); if (!m) return null; let h = parseInt(m[1]); if (m[3]?.toUpperCase() === "PM" && h < 12) h += 12; if (m[3]?.toUpperCase() === "AM" && h === 12) h = 0; return `${h.toString().padStart(2, "0")}:${m[2]}:00`; };
      for (const item of items) dispatch({ type: "DELETE_ITINERARY_ITEM", payload: { id: item.id, planId: plan.id } });
      for (const day of (data.days || [])) {
        for (let i = 0; i < (day.activities || []).length; i++) {
          const act = day.activities[i];
          dispatch({ type: "ADD_ITINERARY_ITEM", payload: { id: crypto.randomUUID(), travelPlanId: plan.id, userId: "", dayNumber: day.day, title: act.title, description: act.description || null, category: validCats.has(act.category) ? act.category : "activity", startTime: parseTime(act.time), endTime: null, estimatedCost: act.estimatedCost ? parseFloat(act.estimatedCost.replace(/[^0-9.]/g, "")) || null : null, isBooked: false, sortOrder: i, createdAt: new Date().toISOString() } });
        }
      }
      setRefineInput(""); setShowAiRefine(false);
    } catch (e) { console.error(e); }
    setRefineLoading(false);
  };

  const parsedBudget = (() => { try { return plan.notes ? JSON.parse(plan.notes) : null; } catch { return null; } })();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-5 text-white">
        {editingHeader ? (
          <div className="space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full text-xl font-bold px-3 py-2 bg-white/20 backdrop-blur rounded-xl text-white placeholder:text-white/60 focus:outline-none" />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-teal-100 mb-1 block">Start</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 bg-white/20 rounded-xl text-white text-sm focus:outline-none" /></div>
              <div><label className="text-xs text-teal-100 mb-1 block">End</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 bg-white/20 rounded-xl text-white text-sm focus:outline-none" /></div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSaveHeader} className="px-4 py-2 bg-white text-teal-600 text-sm font-medium rounded-xl">Save</button>
              <button onClick={() => setEditingHeader(false)} className="px-4 py-2 bg-white/20 text-white text-sm rounded-xl">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{plan.title}</h1>
              <p className="text-teal-100 text-sm mt-0.5">{plan.countryName}{plan.startDate && plan.endDate && ` · ${new Date(plan.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(plan.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`}</p>
              {plan.summary && <p className="text-teal-50 text-sm mt-2">{plan.summary}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditingHeader(true)} className="px-3 py-1.5 bg-white/20 text-white text-xs rounded-lg hover:bg-white/30">Edit</button>
              <button onClick={onDelete} className="px-3 py-1.5 bg-white/20 text-white text-xs rounded-lg hover:bg-rose-500/50">Delete</button>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto hide-scrollbar pb-1">
        <button onClick={() => setActiveTab("overview")} className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === "overview" ? "bg-teal-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>Overview</button>
        {dayNumbers.map((d) => (
          <button key={d} onClick={() => setActiveTab(d)} className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === d ? "bg-teal-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>Day {d}</button>
        ))}
        <button onClick={handleAddDay} className="px-4 py-2.5 bg-teal-50 text-teal-700 rounded-xl text-sm font-medium hover:bg-teal-100 whitespace-nowrap">+ Day</button>
        <button onClick={() => setActiveTab("hotels")} className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === "hotels" ? "bg-teal-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>🏨 Hotels</button>
        <button onClick={() => setActiveTab("transport")} className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === "transport" ? "bg-teal-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>🚗 Transport</button>
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {parsedBudget && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Budget Estimate</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(parsedBudget).map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500 capitalize">{k}</p>
                    <p className="text-sm font-semibold text-gray-900">{v as string}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Schedule</h3>
            <div className="space-y-2">
              {dayNumbers.map((d) => (
                <button key={d} onClick={() => setActiveTab(d)} className="w-full flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-teal-50 transition-colors text-left">
                  <div className="w-10 h-10 bg-teal-500 text-white rounded-xl flex items-center justify-center font-bold">{d}</div>
                  <div className="flex-1"><p className="text-sm font-medium text-gray-900">Day {d}</p><p className="text-xs text-gray-500">{(dayGroups[d] || []).length} activities</p></div>
                  <span className="text-gray-400 text-sm">→</span>
                </button>
              ))}
              {dayNumbers.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No days planned yet. Click "+ Day" to start.</p>}
            </div>
          </div>
          {plan.tips && plan.tips.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Travel Tips</h3>
              <div className="space-y-2">{plan.tips.map((tip, i) => (<div key={i} className="flex gap-2 text-sm"><span className="text-teal-500">💡</span><p className="text-gray-600">{tip}</p></div>))}</div>
            </div>
          )}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <button onClick={() => setShowAiRefine(!showAiRefine)} className="w-full px-5 py-3 flex items-center justify-between text-sm text-gray-500 hover:bg-gray-50">
              <span>✨ Refine with AI</span><span>{showAiRefine ? "▲" : "▼"}</span>
            </button>
            {showAiRefine && (
              <div className="px-5 pb-4 space-y-2">
                <div className="flex gap-2">
                  <input value={refineInput} onChange={(e) => setRefineInput(e.target.value)} placeholder="e.g., add a beach day..." className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" onKeyDown={(e) => e.key === "Enter" && handleRefine()} />
                  <button onClick={handleRefine} disabled={refineLoading} className="px-4 py-2 bg-teal-500 text-white text-sm rounded-xl disabled:opacity-50">{refineLoading ? "..." : "Go"}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Day calendar view */}
      {typeof activeTab === "number" && (
        <DaySchedule planId={plan.id} dayNumber={activeTab} items={dayGroups[activeTab] || []} countryName={plan.countryName}
          hotelInfo={accomByDay[activeTab]?.chosenPlace || accomByDay[activeTab]?.area || ""}
          onHotelChange={(val) => { const acc = accomByDay[activeTab]; if (acc) dispatch({ type: "UPDATE_ACCOMMODATION", payload: { id: acc.id, chosenPlace: val } }); }} />
      )}

      {/* Hotels */}
      {activeTab === "hotels" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Accommodations</h3>
            <button onClick={() => dispatch({ type: "ADD_ACCOMMODATION", payload: { id: crypto.randomUUID(), travelPlanId: plan.id, userId: "", area: "New accommodation", description: null, budgetRange: null, searchUrl: null, chosenPlace: null, chosenUrl: null, userNotes: null, isBooked: false, sortOrder: accoms.length, createdAt: new Date().toISOString() } })}
              className="text-sm px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100">+ Add</button>
          </div>
          {accoms.length === 0 ? (
            <div className="text-center py-8"><p className="text-3xl mb-2">🏨</p><p className="text-sm text-gray-500">No accommodations yet.</p></div>
          ) : (
            <div className="space-y-3">
              {accoms.map((acc) => (
                <div key={acc.id} className="p-4 bg-gray-50 rounded-xl">
                  {editingAccom === acc.id ? (
                    <div className="space-y-2">
                      <input value={acc.area} placeholder="Area / Hotel name" onChange={(e) => dispatch({ type: "UPDATE_ACCOMMODATION", payload: { id: acc.id, area: e.target.value } })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      <input value={acc.chosenPlace || ""} placeholder="Chosen hotel/Airbnb" onChange={(e) => dispatch({ type: "UPDATE_ACCOMMODATION", payload: { id: acc.id, chosenPlace: e.target.value } })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      <input value={acc.chosenUrl || ""} placeholder="Booking URL" onChange={(e) => dispatch({ type: "UPDATE_ACCOMMODATION", payload: { id: acc.id, chosenUrl: e.target.value } })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      <input value={acc.userNotes || ""} placeholder="Notes (confirmation #, check-in, price)" onChange={(e) => dispatch({ type: "UPDATE_ACCOMMODATION", payload: { id: acc.id, userNotes: e.target.value } })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs text-gray-600"><input type="checkbox" checked={acc.isBooked} onChange={(e) => dispatch({ type: "UPDATE_ACCOMMODATION", payload: { id: acc.id, isBooked: e.target.checked } })} className="rounded border-gray-300 text-teal-500" />Booked</label>
                        <div className="flex gap-2">
                          <button onClick={() => dispatch({ type: "DELETE_ACCOMMODATION", payload: { id: acc.id, planId: plan.id } })} className="text-xs text-rose-500">Delete</button>
                          <button onClick={() => setEditingAccom(null)} className="text-xs px-3 py-1.5 bg-teal-500 text-white rounded-lg">Done</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between cursor-pointer" onClick={() => setEditingAccom(acc.id)}>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm">{acc.area}</h4>
                        {acc.chosenPlace && <p className="text-xs text-teal-600 mt-0.5">{acc.isBooked ? "✅" : "📝"} {acc.chosenPlace}</p>}
                        {acc.userNotes && <p className="text-xs text-gray-500 mt-0.5">{acc.userNotes}</p>}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <a href={`https://www.airbnb.com/s/${encodeURIComponent(acc.area + " " + plan.countryName)}/homes`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs hover:bg-rose-100">Airbnb</a>
                        <a href={`https://www.google.com/travel/hotels/${encodeURIComponent(acc.area + " " + plan.countryName)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs hover:bg-blue-100">Hotels</a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Transport */}
      {activeTab === "transport" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">Transportation</h3>
          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="font-medium text-gray-900 text-sm mb-2">🚗 Car Rental</h4>
            <div className="flex gap-2">
              <a href={`https://www.google.com/search?q=car+rental+${encodeURIComponent(plan.countryName)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-sky-50 text-sky-600 rounded-lg text-xs font-medium hover:bg-sky-100">Search Rentals</a>
              <a href={`https://www.rentalcars.com/search/${encodeURIComponent(plan.countryName)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-lg text-xs font-medium hover:bg-orange-100">RentalCars</a>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <h4 className="font-medium text-gray-900 text-sm mb-2">✈️ Flights</h4>
            <a href={`https://www.google.com/travel/flights?q=flights+to+${encodeURIComponent(plan.countryName)}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1.5 bg-sky-50 text-sky-600 rounded-lg text-xs font-medium hover:bg-sky-100 inline-block">Search Flights</a>
          </div>
        </div>
      )}
    </div>
  );
}
