"use client";

import { useState } from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TravelPlan, ItineraryItem, PlanAccommodation } from "@/lib/types";
import { useTravelPlans } from "@/context/TravelPlanContext";

const catEmoji: Record<string, string> = {
  sightseeing: "📸", food: "🍽️", adventure: "🎯", culture: "🏛️",
  relaxation: "🧘", shopping: "🛍️", nightlife: "🍸", nature: "🌿",
  transport: "✈️", accommodation: "🏨", activity: "🎯", other: "📌",
};
const catColors: Record<string, string> = {
  sightseeing: "border-l-violet-400", food: "border-l-amber-400", adventure: "border-l-orange-400",
  culture: "border-l-rose-400", relaxation: "border-l-blue-400", shopping: "border-l-teal-400",
  transport: "border-l-sky-400", accommodation: "border-l-indigo-400", activity: "border-l-orange-400",
  nature: "border-l-green-400", nightlife: "border-l-pink-400", other: "border-l-gray-400",
};

function SortableActivity({ item, onRemove, onEdit }: { item: ItineraryItem; onRemove: () => void; onEdit: (title: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style}
      className={`bg-white rounded-xl border-l-4 ${catColors[item.category] || "border-l-gray-300"} shadow-sm px-4 py-3 flex items-start gap-3 group hover:shadow-md transition-all`}>
      <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing mt-0.5 touch-none">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>
      <span className="text-lg flex-shrink-0">{catEmoji[item.category] || "📌"}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {item.startTime && <span className="text-xs text-gray-400 font-mono flex-shrink-0">{item.startTime}</span>}
          {editing ? (
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} autoFocus
              onBlur={() => { onEdit(editTitle); setEditing(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") { onEdit(editTitle); setEditing(false); } }}
              className="flex-1 text-sm font-medium px-2 py-0.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
          ) : (
            <h5 className="text-sm font-medium text-gray-900 cursor-pointer hover:text-teal-600" onClick={() => setEditing(true)}>{item.title}</h5>
          )}
        </div>
        {item.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>}
        {item.estimatedCost && <span className="text-xs text-teal-600 mt-1 inline-block">${item.estimatedCost}</span>}
      </div>
      <button onClick={onRemove} className="text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 mt-1">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
    </div>
  );
}

interface Props {
  plan: TravelPlan;
  items: ItineraryItem[];
  accoms: PlanAccommodation[];
  onDelete: () => void;
}

export default function SavedPlanEditor({ plan, items, accoms, onDelete }: Props) {
  const { dispatch } = useTravelPlans();
  const [activeDay, setActiveDay] = useState(0);
  const [editingPlan, setEditingPlan] = useState(false);
  const [title, setTitle] = useState(plan.title);
  const [startDate, setStartDate] = useState(plan.startDate || "");
  const [endDate, setEndDate] = useState(plan.endDate || "");
  const [editingAccom, setEditingAccom] = useState<string | null>(null);
  const [refineInput, setRefineInput] = useState("");
  const [refineLoading, setRefineLoading] = useState(false);
  const [addingItem, setAddingItem] = useState(false);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemDay, setNewItemDay] = useState(1);
  const [newItemCat, setNewItemCat] = useState<ItineraryItem["category"]>("activity");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Group items by day
  const dayGroups: Record<number, ItineraryItem[]> = {};
  items.forEach((item) => {
    const day = item.dayNumber || 1;
    if (!dayGroups[day]) dayGroups[day] = [];
    dayGroups[day].push(item);
  });
  // Sort within each day
  Object.values(dayGroups).forEach((group) => group.sort((a, b) => a.sortOrder - b.sortOrder));
  const dayNumbers = Object.keys(dayGroups).map(Number).sort((a, b) => a - b);

  const handleDragEnd = (event: DragEndEvent, dayNum: number) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const group = dayGroups[dayNum];
    if (!group) return;
    const oldIndex = group.findIndex((i) => i.id === active.id);
    const newIndex = group.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Update sort orders
    const reordered = [...group];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    reordered.forEach((item, idx) => {
      dispatch({ type: "UPDATE_ITINERARY_ITEM", payload: { id: item.id, sortOrder: idx } });
    });
  };

  const handleSavePlanDetails = () => {
    dispatch({
      type: "UPDATE_PLAN",
      payload: { id: plan.id, title, startDate: startDate || null, endDate: endDate || null },
    });
    setEditingPlan(false);
  };

  const handleDeletePlan = () => {
    dispatch({ type: "DELETE_PLAN", payload: { id: plan.id } });
    onDelete();
  };

  const handleAddItem = () => {
    if (!newItemTitle.trim()) return;
    dispatch({
      type: "ADD_ITINERARY_ITEM",
      payload: {
        id: crypto.randomUUID(),
        travelPlanId: plan.id,
        userId: "",
        dayNumber: newItemDay,
        title: newItemTitle.trim(),
        description: null,
        category: newItemCat,
        startTime: null,
        endTime: null,
        estimatedCost: null,
        isBooked: false,
        sortOrder: (dayGroups[newItemDay]?.length || 0),
        createdAt: new Date().toISOString(),
      },
    });
    setNewItemTitle("");
    setAddingItem(false);
  };

  const handleRefine = async () => {
    if (!refineInput.trim()) return;
    setRefineLoading(true);
    try {
      const currentPlan = { title: plan.title, summary: plan.summary, days: dayNumbers.map((d) => ({ day: d, title: `Day ${d}`, activities: (dayGroups[d] || []).map((i) => ({ time: i.startTime, title: i.title, description: i.description, category: i.category, estimatedCost: i.estimatedCost ? `$${i.estimatedCost}` : "" })) })) };
      const res = await fetch("/api/plan-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryName: plan.countryName, countryCode: plan.countryCode, currentItinerary: JSON.stringify(currentPlan), refineRequest: refineInput.trim() }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();

      // Delete old items and insert new ones
      for (const item of items) {
        dispatch({ type: "DELETE_ITINERARY_ITEM", payload: { id: item.id, planId: plan.id } });
      }
      for (const day of (data.days || [])) {
        for (let i = 0; i < (day.activities || []).length; i++) {
          const act = day.activities[i];
          dispatch({
            type: "ADD_ITINERARY_ITEM",
            payload: {
              id: crypto.randomUUID(), travelPlanId: plan.id, userId: "", dayNumber: day.day,
              title: act.title, description: act.description || null,
              category: act.category || "activity", startTime: act.time || null,
              endTime: null, estimatedCost: act.estimatedCost ? parseFloat(act.estimatedCost.replace(/[^0-9.]/g, "")) || null : null,
              isBooked: false, sortOrder: i, createdAt: new Date().toISOString(),
            },
          });
        }
      }
      if (data.summary) dispatch({ type: "UPDATE_PLAN", payload: { id: plan.id, summary: data.summary } });
      setRefineInput("");
    } catch (e) { console.error(e); }
    setRefineLoading(false);
  };

  const parsedBudget = plan.notes ? (() => { try { return JSON.parse(plan.notes); } catch { return null; } })() : null;

  return (
    <div className="space-y-6">
      {/* Plan header */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-6 text-white">
        {editingPlan ? (
          <div className="space-y-3">
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xl font-bold px-3 py-2 bg-white/20 backdrop-blur rounded-xl text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-teal-100 mb-1 block">Start Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white/20 backdrop-blur rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50" />
              </div>
              <div>
                <label className="text-xs text-teal-100 mb-1 block">End Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white/20 backdrop-blur rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSavePlanDetails} className="px-4 py-2 bg-white text-teal-600 text-sm font-medium rounded-xl">Save</button>
              <button onClick={() => setEditingPlan(false)} className="px-4 py-2 bg-white/20 text-white text-sm rounded-xl">Cancel</button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold">{plan.title}</h1>
                <p className="text-teal-100 mt-0.5">{plan.countryName}</p>
                {plan.summary && <p className="text-teal-50 text-sm mt-2">{plan.summary}</p>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditingPlan(true)} className="px-3 py-1.5 bg-white/20 text-white text-xs rounded-lg hover:bg-white/30">Edit</button>
                <button onClick={handleDeletePlan} className="px-3 py-1.5 bg-white/20 text-white text-xs rounded-lg hover:bg-rose-500/50">Delete</button>
              </div>
            </div>
            {parsedBudget && (
              <div className="flex flex-wrap gap-2 mt-4">
                {Object.entries(parsedBudget).map(([k, v]) => (
                  <div key={k} className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
                    <span className="text-xs text-teal-100 capitalize">{k}: </span>
                    <span className="text-sm font-medium">{v as string}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Refine */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex gap-2">
          <input value={refineInput} onChange={(e) => setRefineInput(e.target.value)}
            placeholder="Ask AI to change the schedule... (e.g., 'add a beach day')"
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            onKeyDown={(e) => e.key === "Enter" && handleRefine()} />
          <button onClick={handleRefine} disabled={refineLoading || !refineInput.trim()}
            className="px-5 py-2.5 bg-teal-500 text-white text-sm rounded-xl hover:bg-teal-600 disabled:opacity-50">{refineLoading ? "..." : "Refine"}</button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {["Add free activities", "More food spots", "Add rest time", "Make it shorter", "Add adventure"].map((s) => (
            <button key={s} onClick={() => setRefineInput(s)}
              className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-full text-xs hover:bg-teal-50 hover:text-teal-700 border border-gray-200">{s}</button>
          ))}
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {dayNumbers.map((d, i) => (
          <button key={d} onClick={() => setActiveDay(i)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeDay === i ? "bg-teal-500 text-white shadow-sm" : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"}`}>
            Day {d}
          </button>
        ))}
        <button onClick={() => setActiveDay(-1)}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeDay === -1 ? "bg-teal-500 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
          All Days
        </button>
        <button onClick={() => setAddingItem(true)}
          className="px-4 py-2.5 bg-teal-50 text-teal-700 rounded-xl text-sm font-medium hover:bg-teal-100 whitespace-nowrap">+ Add</button>
      </div>

      {/* Add item form */}
      {addingItem && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <input value={newItemTitle} onChange={(e) => setNewItemTitle(e.target.value)} placeholder="Activity name..."
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" autoFocus />
          <div className="flex gap-2 flex-wrap">
            {(["activity", "food", "transport", "accommodation", "other"] as const).map((c) => (
              <button key={c} onClick={() => setNewItemCat(c)}
                className={`text-xs px-3 py-1.5 rounded-full ${newItemCat === c ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                {catEmoji[c]} {c}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-gray-500">Day</label>
            <input type="number" min={1} value={newItemDay} onChange={(e) => setNewItemDay(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddItem} className="px-4 py-2 bg-teal-500 text-white text-sm rounded-xl">Add</button>
            <button onClick={() => setAddingItem(false)} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-xl">Cancel</button>
          </div>
        </div>
      )}

      {/* Day cards — calendar/diary view */}
      <div className="space-y-6">
        {dayNumbers
          .filter((_, i) => activeDay === -1 || i === activeDay)
          .map((dayNum) => (
            <div key={dayNum} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-teal-500 text-white rounded-xl flex items-center justify-center font-bold text-lg">{dayNum}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Day {dayNum}</h3>
                    <p className="text-xs text-gray-400">{(dayGroups[dayNum] || []).length} activities</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => handleDragEnd(e, dayNum)}>
                  <SortableContext items={(dayGroups[dayNum] || []).map((i) => i.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2">
                      {(dayGroups[dayNum] || []).map((item) => (
                        <SortableActivity key={item.id} item={item}
                          onRemove={() => dispatch({ type: "DELETE_ITINERARY_ITEM", payload: { id: item.id, planId: plan.id } })}
                          onEdit={(t) => dispatch({ type: "UPDATE_ITINERARY_ITEM", payload: { id: item.id, title: t } })} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                {(dayGroups[dayNum] || []).length === 0 && (
                  <p className="text-center py-6 text-gray-400 text-sm">No activities. Click "+ Add" to add some!</p>
                )}
              </div>
            </div>
          ))}
      </div>

      {/* Accommodations */}
      {accoms.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-4">Where to Stay</h3>
          <div className="space-y-3">
            {accoms.map((acc) => (
              <div key={acc.id} className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 text-sm">{acc.area}</h4>
                    {acc.description && <p className="text-xs text-gray-500 mt-0.5">{acc.description}</p>}
                    {acc.budgetRange && <p className="text-xs text-teal-600 font-medium mt-1">{acc.budgetRange}</p>}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <a href={`https://www.airbnb.com/s/${encodeURIComponent(acc.area + " " + plan.countryName)}/homes`}
                      target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-medium hover:bg-rose-100">🏠 Airbnb</a>
                    <a href={acc.searchUrl || `https://www.google.com/travel/hotels/${encodeURIComponent(plan.countryName)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100">🏨 Hotels</a>
                  </div>
                </div>
                {/* User's chosen place */}
                <div className="mt-3">
                  {editingAccom === acc.id ? (
                    <div className="space-y-2">
                      <input value={acc.chosenPlace || ""} placeholder="Your chosen hotel/Airbnb name or link..."
                        onChange={(e) => dispatch({ type: "UPDATE_ACCOMMODATION", payload: { id: acc.id, chosenPlace: e.target.value } })}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      <input value={acc.userNotes || ""} placeholder="Notes (confirmation #, check-in time, price...)"
                        onChange={(e) => dispatch({ type: "UPDATE_ACCOMMODATION", payload: { id: acc.id, userNotes: e.target.value } })}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      <div className="flex gap-2">
                        <label className="flex items-center gap-2 text-xs text-gray-600">
                          <input type="checkbox" checked={acc.isBooked}
                            onChange={(e) => dispatch({ type: "UPDATE_ACCOMMODATION", payload: { id: acc.id, isBooked: e.target.checked } })}
                            className="rounded border-gray-300 text-teal-500 focus:ring-teal-500" />
                          Booked
                        </label>
                        <button onClick={() => setEditingAccom(null)} className="text-xs px-3 py-1.5 bg-teal-500 text-white rounded-lg">Done</button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setEditingAccom(acc.id)} className="text-xs text-teal-600 hover:text-teal-700">
                      {acc.chosenPlace ? (
                        <span className="flex flex-col items-start gap-0.5">
                          <span className="font-medium">{acc.isBooked ? "✅" : "📝"} {acc.chosenPlace}</span>
                          {acc.userNotes && <span className="text-gray-500">{acc.userNotes}</span>}
                          <span className="text-gray-400">Click to edit</span>
                        </span>
                      ) : "📝 Add your chosen place..."}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      {plan.tips && plan.tips.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-3">Travel Tips</h3>
          <div className="space-y-2">
            {plan.tips.map((tip, i) => (
              <div key={i} className="flex gap-2.5 text-sm">
                <span className="text-teal-500">💡</span>
                <p className="text-gray-600">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
