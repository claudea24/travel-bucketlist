"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTravelPlans } from "@/context/TravelPlanContext";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { TripPlan } from "@/app/personal/plan/new/NewPlanClient";

const categoryEmoji: Record<string, string> = {
  sightseeing: "📸", food: "🍽️", adventure: "🎯", culture: "🏛️",
  relaxation: "🧘", shopping: "🛍️", nightlife: "🍸", nature: "🌿",
};

const categoryColors: Record<string, string> = {
  sightseeing: "border-l-violet-400", food: "border-l-amber-400", adventure: "border-l-orange-400",
  culture: "border-l-rose-400", relaxation: "border-l-blue-400", shopping: "border-l-teal-400",
  nightlife: "border-l-pink-400", nature: "border-l-green-400",
};

interface SortableItemProps {
  activity: { id: string; time: string; title: string; description: string; category: string; estimatedCost: string };
  onRemove: () => void;
  onEdit: (title: string) => void;
}

function SortableItem({ activity, onRemove, onEdit }: SortableItemProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(activity.title);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: activity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}
      className={`bg-white rounded-xl border-l-4 ${categoryColors[activity.category] || "border-l-gray-300"} shadow-sm px-4 py-3 flex items-start gap-3 group hover:shadow-md transition-all`}>
      {/* Drag handle */}
      <button {...attributes} {...listeners}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing mt-0.5 touch-none">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>

      <span className="text-lg flex-shrink-0">{categoryEmoji[activity.category] || "📌"}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-mono flex-shrink-0">{activity.time}</span>
          {editing ? (
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} autoFocus
              onBlur={() => { onEdit(editTitle); setEditing(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") { onEdit(editTitle); setEditing(false); } }}
              className="flex-1 text-sm font-medium px-2 py-0.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
          ) : (
            <h5 className="text-sm font-medium text-gray-900 cursor-pointer hover:text-teal-600"
              onClick={() => setEditing(true)}>{activity.title}</h5>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{activity.description}</p>
        {activity.estimatedCost && (
          <span className="text-xs text-teal-600 mt-1 inline-block">{activity.estimatedCost}</span>
        )}
      </div>

      <button onClick={onRemove}
        className="text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 mt-1">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

interface TripCalendarProps {
  plan: TripPlan;
  onUpdatePlan: (plan: TripPlan) => void;
  onRegenerate: () => void;
}

export default function TripCalendar({ plan, onUpdatePlan, onRegenerate }: TripCalendarProps) {
  const router = useRouter();
  const { saveAiPlan } = useTravelPlans();
  const [refineInput, setRefineInput] = useState("");
  const [refineLoading, setRefineLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeDay, setActiveDay] = useState(0);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent, dayIndex: number) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const day = plan.days[dayIndex];
    const oldIndex = day.activities.findIndex((a) => a.id === active.id);
    const newIndex = day.activities.findIndex((a) => a.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newActivities = [...day.activities];
    const [moved] = newActivities.splice(oldIndex, 1);
    newActivities.splice(newIndex, 0, moved);

    const updated = { ...plan };
    updated.days = updated.days.map((d, i) => i === dayIndex ? { ...d, activities: newActivities } : d);
    onUpdatePlan(updated);
    setSaved(false);
  };

  const removeActivity = (dayIndex: number, actId: string) => {
    const updated = { ...plan };
    updated.days = updated.days.map((d, i) =>
      i === dayIndex ? { ...d, activities: d.activities.filter((a) => a.id !== actId) } : d
    );
    onUpdatePlan(updated);
    setSaved(false);
  };

  const editActivity = (dayIndex: number, actId: string, newTitle: string) => {
    const updated = { ...plan };
    updated.days = updated.days.map((d, i) =>
      i === dayIndex ? { ...d, activities: d.activities.map((a) => a.id === actId ? { ...a, title: newTitle } : a) } : d
    );
    onUpdatePlan(updated);
    setSaved(false);
  };

  const removeDay = (dayIndex: number) => {
    const updated = { ...plan };
    updated.days = updated.days.filter((_, i) => i !== dayIndex).map((d, i) => ({ ...d, day: i + 1 }));
    onUpdatePlan(updated);
    if (activeDay >= updated.days.length) setActiveDay(Math.max(0, updated.days.length - 1));
    setSaved(false);
  };

  const handleRefine = async () => {
    if (!refineInput.trim()) return;
    setRefineLoading(true);
    try {
      const res = await fetch("/api/plan-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryName: plan.countryName,
          countryCode: plan.countryCode,
          days: plan.tripDays,
          currentItinerary: JSON.stringify(plan),
          refineRequest: refineInput.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      // Add IDs
      data.days = (data.days || []).map((day: { activities: { id?: string }[] }) => ({
        ...day,
        activities: (day.activities || []).map((a) => ({ ...a, id: a.id || crypto.randomUUID() })),
      }));
      onUpdatePlan({ ...plan, ...data });
      setRefineInput("");
      setSaved(false);
    } catch (e) {
      console.error(e);
    }
    setRefineLoading(false);
  };

  const [saveError, setSaveError] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const planId = await saveAiPlan({
        countryCode: plan.countryCode,
        countryName: plan.countryName,
        title: plan.title,
        summary: plan.summary,
        tips: plan.tips || [],
        estimatedBudget: plan.estimatedBudget || {},
        days: plan.days,
        accommodation: plan.accommodation || [],
      });
      if (planId) {
        setSaved(true);
        setTimeout(() => router.push(`/personal/plan/${planId}`), 1000);
      } else {
        setSaveError("Failed to save. Check browser console for details.");
      }
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">{plan.title}</h2>
        <p className="text-teal-100 mt-1">{plan.summary}</p>
        <div className="flex flex-wrap gap-3 mt-4">
          {plan.estimatedBudget && Object.entries(plan.estimatedBudget).map(([key, value]) => (
            <div key={key} className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <span className="text-xs text-teal-100 capitalize">{key}: </span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Refine bar */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex gap-2">
          <input value={refineInput} onChange={(e) => setRefineInput(e.target.value)}
            placeholder="Tell AI to change something... (e.g., 'make day 3 more relaxing')"
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            onKeyDown={(e) => e.key === "Enter" && handleRefine()} />
          <button onClick={handleRefine} disabled={refineLoading || !refineInput.trim()}
            className="px-5 py-2.5 bg-teal-500 text-white text-sm rounded-xl hover:bg-teal-600 disabled:opacity-50 transition-colors">
            {refineLoading ? "..." : "Refine"}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {["Make it shorter", "More food spots", "Add free activities", "More adventure", "Add rest time"].map((s) => (
            <button key={s} onClick={() => setRefineInput(s)}
              className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-full text-xs hover:bg-teal-50 hover:text-teal-700 transition-colors border border-gray-200">
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Day tabs */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
        {plan.days.map((day, i) => (
          <button key={day.day} onClick={() => setActiveDay(i)}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeDay === i
                ? "bg-teal-500 text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}>
            Day {day.day}
          </button>
        ))}
        <button onClick={() => setActiveDay(-1)}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
            activeDay === -1 ? "bg-teal-500 text-white" : "bg-white text-gray-600 border border-gray-200"
          }`}>
          All Days
        </button>
      </div>

      {/* Day cards — diary/calendar style */}
      <div className="space-y-6">
        {plan.days
          .filter((_, i) => activeDay === -1 || i === activeDay)
          .map((day, filteredIndex) => {
            const dayIndex = activeDay === -1 ? filteredIndex : activeDay;
            return (
              <div key={day.day} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Day header */}
                <div className="bg-gradient-to-r from-gray-50 to-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-teal-500 text-white rounded-xl flex items-center justify-center font-bold text-lg">
                        {day.day}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{day.title}</h3>
                        <p className="text-xs text-gray-400">{day.activities.length} activities planned</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeDay(dayIndex)}
                    className="text-xs text-gray-400 hover:text-rose-500 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors">
                    Remove day
                  </button>
                </div>

                {/* Activities — sortable */}
                <div className="p-4">
                  <DndContext sensors={sensors} collisionDetection={closestCenter}
                    onDragEnd={(e) => handleDragEnd(e, dayIndex)}>
                    <SortableContext items={day.activities.map((a) => a.id)} strategy={verticalListSortingStrategy}>
                      <div className="space-y-2">
                        {day.activities.map((activity) => (
                          <SortableItem
                            key={activity.id}
                            activity={activity}
                            onRemove={() => removeActivity(dayIndex, activity.id)}
                            onEdit={(title) => editActivity(dayIndex, activity.id, title)}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>

                  {day.activities.length === 0 && (
                    <p className="text-center py-6 text-gray-400 text-sm">No activities for this day. Use AI to add some!</p>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* Accommodation */}
      {plan.accommodation && plan.accommodation.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-bold text-gray-900 mb-4">Where to Stay</h3>
          <div className="grid gap-3">
            {plan.accommodation.map((acc, i) => (
              <div key={i} className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-xl">
                <div>
                  <h4 className="font-medium text-gray-900 text-sm">{acc.area}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{acc.description}</p>
                  <p className="text-xs text-teal-600 font-medium mt-1">{acc.budgetRange}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <a href={`https://www.airbnb.com/s/${encodeURIComponent(acc.area + " " + plan.countryName)}/homes`}
                    target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-medium hover:bg-rose-100">
                    🏠 Airbnb
                  </a>
                  <a href={acc.searchUrl || `https://www.google.com/travel/hotels/${encodeURIComponent(plan.countryName)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100">
                    🏨 Hotels
                  </a>
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

      {saveError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">{saveError}</div>
      )}

      {/* Action bar */}
      <div className="flex gap-3 sticky bottom-4">
        <button onClick={onRegenerate}
          className="px-5 py-3 bg-white text-gray-700 text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 shadow-sm transition-colors">
          Start Over
        </button>
        <button onClick={handleSave} disabled={saving || saved}
          className={`flex-1 py-3 text-sm font-medium rounded-xl shadow-sm transition-colors ${
            saved
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-50"
          }`}>
          {saving ? "Saving..." : saved ? "✅ Saved! Redirecting..." : "💾 Save to My Trips"}
        </button>
      </div>
    </div>
  );
}
