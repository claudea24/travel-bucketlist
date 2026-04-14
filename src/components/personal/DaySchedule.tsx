"use client";

import { useState } from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ItineraryItem } from "@/lib/types";
import { useTravelPlans } from "@/context/TravelPlanContext";

const catEmoji: Record<string, string> = {
  food: "🍽️", transport: "✈️", accommodation: "🏨", activity: "🎯", other: "📌",
};
const catBg: Record<string, string> = {
  food: "bg-amber-50 border-amber-200", transport: "bg-sky-50 border-sky-200",
  accommodation: "bg-indigo-50 border-indigo-200", activity: "bg-teal-50 border-teal-200",
  other: "bg-gray-50 border-gray-200",
};

function SortableActivity({ item, planId, isOverlay }: { item: ItineraryItem; planId: string; isOverlay?: boolean }) {
  const { dispatch } = useTravelPlans();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [desc, setDesc] = useState(item.description || "");
  const [time, setTime] = useState(item.startTime?.slice(0, 5) || "");
  const [cat, setCat] = useState(item.category);
  const [cost, setCost] = useState(item.estimatedCost?.toString() || "");

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = isOverlay ? {} : { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };
  const bg = catBg[item.category] || catBg.other;

  const save = () => {
    dispatch({
      type: "UPDATE_ITINERARY_ITEM",
      payload: {
        id: item.id,
        title: title.trim() || item.title,
        description: desc.trim() || null,
        startTime: time ? `${time}:00` : null,
        category: cat,
        estimatedCost: cost ? parseFloat(cost) || null : null,
      },
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="bg-white rounded-xl border-2 border-teal-400 p-4 shadow-lg space-y-3 ml-[4.5rem]">
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
          placeholder="Activity name" onKeyDown={(e) => e.key === "Enter" && save()} autoFocus />
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
          placeholder="Description or notes..." />
        <div className="flex gap-2 flex-wrap">
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
            className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm w-28 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <select value={cat} onChange={(e) => setCat(e.target.value as ItineraryItem["category"])}
            className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="activity">🎯 Activity</option>
            <option value="food">🍽️ Food</option>
            <option value="transport">✈️ Transport</option>
            <option value="accommodation">🏨 Stay</option>
            <option value="other">📌 Other</option>
          </select>
          <input value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Cost"
            className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm w-20 focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="px-4 py-1.5 bg-teal-500 text-white text-xs font-medium rounded-lg">Save</button>
          <button onClick={() => setEditing(false)} className="px-4 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg">Cancel</button>
          <button onClick={() => dispatch({ type: "DELETE_ITINERARY_ITEM", payload: { id: item.id, planId } })}
            className="px-4 py-1.5 bg-rose-50 text-rose-600 text-xs rounded-lg ml-auto">Delete</button>
        </div>
      </div>
    );
  }

  const displayTime = item.startTime ? (() => {
    const h = parseInt(item.startTime!.slice(0, 2));
    const m = item.startTime!.slice(3, 5);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m} ${ampm}`;
  })() : null;

  return (
    <div ref={isOverlay ? undefined : setNodeRef} style={style} className="flex gap-3 items-start group">
      {/* Time column */}
      <div className="w-16 flex-shrink-0 text-right pt-3">
        {displayTime ? (
          <span className="text-xs font-mono text-gray-500 font-medium">{displayTime}</span>
        ) : (
          <span className="text-xs text-gray-300 italic">---</span>
        )}
      </div>

      {/* Timeline dot */}
      <div className="flex flex-col items-center flex-shrink-0 pt-3">
        <div className={`w-3 h-3 rounded-full border-2 ${displayTime ? "bg-teal-500 border-teal-500" : "bg-white border-gray-300"}`} />
        <div className="w-px flex-1 bg-gray-200 min-h-[1rem]" />
      </div>

      {/* Activity card */}
      <div className={`flex-1 rounded-xl border ${bg} p-3 flex items-center gap-2 hover:shadow-md transition-all ${isOverlay ? "shadow-xl" : ""}`}>
        <button {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}
          className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
          </svg>
        </button>
        <span className="flex-shrink-0">{catEmoji[item.category] || "📌"}</span>
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditing(true)}>
          <p className="text-sm font-medium text-gray-900 hover:text-teal-600 transition-colors">{item.title}</p>
          {item.description && <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>}
        </div>
        {item.estimatedCost && <span className="text-xs text-teal-600 flex-shrink-0">${item.estimatedCost}</span>}
        <button onClick={() => dispatch({ type: "DELETE_ITINERARY_ITEM", payload: { id: item.id, planId } })}
          className="text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
        </button>
      </div>
    </div>
  );
}

interface DayScheduleProps {
  planId: string;
  dayNumber: number;
  items: ItineraryItem[];
  countryName: string;
  hotelInfo?: string;
  onHotelChange?: (val: string) => void;
}

export default function DaySchedule({ planId, dayNumber, items, hotelInfo, onHotelChange }: DayScheduleProps) {
  const { dispatch } = useTravelPlans();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("09:00");
  const [newCat, setNewCat] = useState("activity");
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Sort items by time, then sortOrder
  const sorted = [...items].sort((a, b) => {
    const tA = a.startTime || "99:99";
    const tB = b.startTime || "99:99";
    if (tA !== tB) return tA.localeCompare(tB);
    return a.sortOrder - b.sortOrder;
  });

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIdx = sorted.findIndex((i) => i.id === active.id);
    const newIdx = sorted.findIndex((i) => i.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;

    // Reorder and update sortOrder for all items
    const reordered = [...sorted];
    const [moved] = reordered.splice(oldIdx, 1);
    reordered.splice(newIdx, 0, moved);

    reordered.forEach((item, idx) => {
      if (item.sortOrder !== idx) {
        dispatch({ type: "UPDATE_ITINERARY_ITEM", payload: { id: item.id, sortOrder: idx } });
      }
    });
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    dispatch({
      type: "ADD_ITINERARY_ITEM",
      payload: {
        id: crypto.randomUUID(), travelPlanId: planId, userId: "", dayNumber,
        title: newTitle.trim(), description: null, category: newCat as ItineraryItem["category"],
        startTime: newTime ? `${newTime}:00` : null, endTime: null, estimatedCost: null,
        isBooked: false, sortOrder: items.length, createdAt: new Date().toISOString(),
      },
    });
    setNewTitle("");
    setNewTime("");
    setAdding(false);
  };

  const activeItem = activeId ? sorted.find((i) => i.id === activeId) : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Day header + hotel */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center font-bold text-xl">{dayNumber}</div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">Day {dayNumber}</h3>
            <p className="text-teal-100 text-xs">{items.length} activities · Click to edit · Drag to reorder</p>
          </div>
          <button onClick={() => setAdding(true)} className="px-3 py-1.5 bg-white/20 text-white text-sm rounded-lg hover:bg-white/30 transition-colors">+ Add</button>
        </div>
        <div className="mt-3 bg-white/15 backdrop-blur rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span>🏨</span>
            <input value={hotelInfo || ""} onChange={(e) => onHotelChange?.(e.target.value)}
              placeholder="Hotel / Airbnb for tonight (auto-saved)"
              className="flex-1 bg-transparent text-white placeholder:text-white/50 text-sm focus:outline-none" />
          </div>
        </div>
      </div>

      <div className="p-5">
        {/* Add form */}
        {adding && (
          <div className="mb-5 p-4 bg-teal-50 rounded-xl border border-teal-200 space-y-3">
            <div className="flex gap-2">
              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)}
                className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm w-32 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="What are you doing?"
                className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()} autoFocus />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {(["activity", "food", "transport", "accommodation", "other"] as const).map((c) => (
                <button key={c} onClick={() => setNewCat(c)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all ${newCat === c ? "bg-teal-500 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
                  {catEmoji[c]} {c}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="px-4 py-2 bg-teal-500 text-white text-sm font-medium rounded-lg">Add Activity</button>
              <button onClick={() => setAdding(false)} className="px-4 py-2 bg-white text-gray-600 text-sm rounded-lg border border-gray-200">Cancel</button>
            </div>
          </div>
        )}

        {/* Timeline list — single flat sortable list */}
        <DndContext sensors={sensors} collisionDetection={closestCenter}
          onDragStart={(e) => setActiveId(e.active.id as string)}
          onDragEnd={handleDragEnd}>
          <SortableContext items={sorted.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-1">
              {sorted.map((item) => (
                <SortableActivity key={item.id} item={item} planId={planId} />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>{activeItem ? <SortableActivity item={activeItem} planId={planId} isOverlay /> : null}</DragOverlay>
        </DndContext>

        {items.length === 0 && !adding && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm text-gray-400 mb-3">Nothing planned for this day</p>
            <button onClick={() => setAdding(true)}
              className="text-sm px-5 py-2.5 bg-teal-50 text-teal-700 rounded-xl hover:bg-teal-100 transition-colors">+ Add Activity</button>
          </div>
        )}

        <p className="text-xs text-gray-300 text-center mt-5">All changes saved automatically</p>
      </div>
    </div>
  );
}
