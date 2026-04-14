"use client";

import { useState, useEffect } from "react";
import { useTravelPlans } from "@/context/TravelPlanContext";
import { TravelPlan, ItineraryItem } from "@/lib/types";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

const ITEM_CATEGORIES = [
  { value: "activity", label: "Activity", emoji: "🎯" },
  { value: "food", label: "Food", emoji: "🍽️" },
  { value: "transport", label: "Transport", emoji: "✈️" },
  { value: "accommodation", label: "Stay", emoji: "🏨" },
  { value: "other", label: "Other", emoji: "📌" },
] as const;

export default function TripPlanner({ planId }: { planId: string }) {
  const { plans, itineraryItems, dispatch, fetchItinerary, isLoading } = useTravelPlans();
  const plan = plans.find((p) => p.id === planId);
  const items = itineraryItems[planId] || [];

  const [editingPlan, setEditingPlan] = useState(false);
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");

  const [newItem, setNewItem] = useState({ title: "", category: "activity" as ItineraryItem["category"], dayNumber: 1 });
  const [showAddItem, setShowAddItem] = useState(false);

  useEffect(() => {
    fetchItinerary(planId);
  }, [planId, fetchItinerary]);

  useEffect(() => {
    if (plan) {
      setTitle(plan.title);
      setStartDate(plan.startDate || "");
      setEndDate(plan.endDate || "");
      setBudget(plan.budgetAmount?.toString() || "");
    }
  }, [plan]);

  if (isLoading && !plan) return <LoadingSpinner message="Loading trip..." />;
  if (!plan) return <div className="text-center py-20 text-gray-500">Trip not found</div>;

  const totalDays = plan.startDate && plan.endDate
    ? Math.ceil((new Date(plan.endDate).getTime() - new Date(plan.startDate).getTime()) / 86400000) + 1
    : 0;

  const totalEstimatedCost = items.reduce((sum, item) => sum + (item.estimatedCost || 0), 0);

  const handleSavePlan = () => {
    dispatch({
      type: "UPDATE_PLAN",
      payload: {
        id: planId,
        title,
        startDate: startDate || null,
        endDate: endDate || null,
        budgetAmount: budget ? parseFloat(budget) : null,
      },
    });
    setEditingPlan(false);
  };

  const handleAddItem = () => {
    if (!newItem.title.trim()) return;
    const item: ItineraryItem = {
      id: crypto.randomUUID(),
      travelPlanId: planId,
      userId: "",
      dayNumber: newItem.dayNumber,
      title: newItem.title,
      description: null,
      category: newItem.category,
      startTime: null,
      endTime: null,
      estimatedCost: null,
      isBooked: false,
      sortOrder: items.filter((i) => i.dayNumber === newItem.dayNumber).length,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: "ADD_ITINERARY_ITEM", payload: item });
    setNewItem({ title: "", category: "activity", dayNumber: newItem.dayNumber });
    setShowAddItem(false);
  };

  const handleDeleteItem = (itemId: string) => {
    dispatch({ type: "DELETE_ITINERARY_ITEM", payload: { id: itemId, planId } });
  };

  const handleDeletePlan = () => {
    dispatch({ type: "DELETE_PLAN", payload: { id: planId } });
    window.history.back();
  };

  const dayGroups: Record<number, ItineraryItem[]> = {};
  items.forEach((item) => {
    const day = item.dayNumber || 0;
    if (!dayGroups[day]) dayGroups[day] = [];
    dayGroups[day].push(item);
  });

  return (
    <div className="space-y-6">
      {/* Plan header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        {editingPlan ? (
          <div className="space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xl font-bold px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Budget ({plan.budgetCurrency})</label>
              <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="0"
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSavePlan} className="px-4 py-2 bg-teal-500 text-white text-sm rounded-xl hover:bg-teal-600">Save</button>
              <button onClick={() => setEditingPlan(false)} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-xl hover:bg-gray-200">Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{plan.title}</h1>
                <p className="text-gray-500 mt-0.5">{plan.countryName}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditingPlan(true)} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">Edit</button>
                <button onClick={handleDeletePlan} className="text-xs px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100">Delete</button>
              </div>
            </div>
            <div className="flex gap-4 mt-4 text-sm">
              {totalDays > 0 && (
                <div className="bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg">
                  {totalDays} {totalDays === 1 ? "day" : "days"}
                </div>
              )}
              {plan.budgetAmount && (
                <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg">
                  Budget: {plan.budgetCurrency} {plan.budgetAmount.toLocaleString()}
                  {totalEstimatedCost > 0 && (
                    <span className="opacity-70"> (est. {plan.budgetCurrency} {totalEstimatedCost.toLocaleString()})</span>
                  )}
                </div>
              )}
              {!plan.startDate && (
                <button onClick={() => setEditingPlan(true)} className="text-teal-600 hover:text-teal-700">
                  Set dates
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Itinerary */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Itinerary</h2>
          <button
            onClick={() => setShowAddItem(true)}
            className="text-sm px-4 py-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors"
          >
            + Add Item
          </button>
        </div>

        {/* Add item form */}
        {showAddItem && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <input
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
              placeholder="What are you doing?"
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              autoFocus
            />
            <div className="flex gap-2 flex-wrap">
              {ITEM_CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  onClick={() => setNewItem({ ...newItem, category: cat.value })}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                    newItem.category === cat.value
                      ? "bg-teal-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs text-gray-500">Day</label>
              <input
                type="number"
                min={1}
                value={newItem.dayNumber}
                onChange={(e) => setNewItem({ ...newItem, dayNumber: parseInt(e.target.value) || 1 })}
                className="w-16 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAddItem} className="px-4 py-2 bg-teal-500 text-white text-sm rounded-xl hover:bg-teal-600">Add</button>
              <button onClick={() => setShowAddItem(false)} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-xl hover:bg-gray-200">Cancel</button>
            </div>
          </div>
        )}

        {/* Day groups */}
        {Object.keys(dayGroups)
          .sort((a, b) => Number(a) - Number(b))
          .map((day) => (
            <div key={day} className="space-y-2">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                {Number(day) === 0 ? "Unscheduled" : `Day ${day}`}
                {plan.startDate && Number(day) > 0 && (
                  <span className="font-normal text-gray-400 ml-2">
                    {new Date(new Date(plan.startDate).getTime() + (Number(day) - 1) * 86400000).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </span>
                )}
              </h3>
              {dayGroups[Number(day)].map((item) => {
                const catInfo = ITEM_CATEGORIES.find((c) => c.value === item.category);
                return (
                  <div key={item.id} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3">
                    <span className="text-lg">{catInfo?.emoji || "📌"}</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.title}</p>
                      {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                    </div>
                    {item.estimatedCost && (
                      <span className="text-xs text-gray-500">${item.estimatedCost}</span>
                    )}
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-gray-300 hover:text-rose-500 transition-colors"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          ))}

        {items.length === 0 && !showAddItem && (
          <div className="text-center py-12 text-gray-400">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm">No itinerary items yet. Start planning your trip!</p>
          </div>
        )}
      </div>
    </div>
  );
}
