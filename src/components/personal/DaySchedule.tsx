"use client";

import { useState } from "react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
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

const TIME_SLOTS = [
  "07:00", "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
  "19:00", "20:00", "21:00",
];

function SortableItem({ item, planId }: { item: ItineraryItem; planId: string }) {
  const { dispatch } = useTravelPlans();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editTime, setEditTime] = useState(item.startTime || "");
  const [editCat, setEditCat] = useState(item.category);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };

  const save = () => {
    dispatch({ type: "UPDATE_ITINERARY_ITEM", payload: { id: item.id, title: editTitle, startTime: editTime || null, category: editCat } });
    setEditing(false);
  };

  const bg = catBg[item.category] || catBg.other;

  if (editing) {
    return (
      <div className="bg-white rounded-xl border-2 border-teal-300 p-3 space-y-2 shadow-md">
        <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
          onKeyDown={(e) => e.key === "Enter" && save()} autoFocus />
        <div className="flex gap-2">
          <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)}
            className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm w-28 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          <select value={editCat} onChange={(e) => setEditCat(e.target.value as ItineraryItem["category"])}
            className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option value="activity">🎯 Activity</option>
            <option value="food">🍽️ Food</option>
            <option value="transport">✈️ Transport</option>
            <option value="other">📌 Other</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={save} className="px-3 py-1.5 bg-teal-500 text-white text-xs rounded-lg">Save</button>
          <button onClick={() => setEditing(false)} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg">Cancel</button>
          <button onClick={() => dispatch({ type: "DELETE_ITINERARY_ITEM", payload: { id: item.id, planId } })}
            className="px-3 py-1.5 bg-rose-50 text-rose-600 text-xs rounded-lg ml-auto">Delete</button>
        </div>
      </div>
    );
  }

  return (
    <div ref={setNodeRef} style={style}
      className={`rounded-xl border ${bg} p-3 flex items-center gap-3 group hover:shadow-sm transition-all cursor-pointer`}
      onClick={() => setEditing(true)}>
      <button {...attributes} {...listeners} onClick={(e) => e.stopPropagation()}
        className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
          <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
          <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
        </svg>
      </button>
      <span>{catEmoji[item.category] || "📌"}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{item.title}</p>
        {item.description && <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>}
      </div>
      {item.estimatedCost && <span className="text-xs text-teal-600">${item.estimatedCost}</span>}
      <button onClick={(e) => { e.stopPropagation(); dispatch({ type: "DELETE_ITINERARY_ITEM", payload: { id: item.id, planId } }); }}
        className="text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
      </button>
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
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((i) => i.id === active.id);
    const newIdx = items.findIndex((i) => i.id === over.id);
    if (oldIdx === -1 || newIdx === -1) return;
    const reordered = [...items];
    const [moved] = reordered.splice(oldIdx, 1);
    reordered.splice(newIdx, 0, moved);
    reordered.forEach((item, idx) => dispatch({ type: "UPDATE_ITINERARY_ITEM", payload: { id: item.id, sortOrder: idx } }));
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    dispatch({
      type: "ADD_ITINERARY_ITEM",
      payload: {
        id: crypto.randomUUID(), travelPlanId: planId, userId: "", dayNumber,
        title: newTitle.trim(), description: null, category: newCat as ItineraryItem["category"],
        startTime: newTime || null, endTime: null, estimatedCost: null,
        isBooked: false, sortOrder: items.length, createdAt: new Date().toISOString(),
      },
    });
    setNewTitle(""); setAdding(false);
  };

  // Group items by time slot for calendar view
  const itemsByTime: Record<string, ItineraryItem[]> = {};
  const unscheduled: ItineraryItem[] = [];
  items.forEach((item) => {
    if (item.startTime) {
      const hour = item.startTime.slice(0, 5);
      if (!itemsByTime[hour]) itemsByTime[hour] = [];
      itemsByTime[hour].push(item);
    } else {
      unscheduled.push(item);
    }
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Day header with hotel */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center font-bold text-xl">{dayNumber}</div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">Day {dayNumber}</h3>
            <p className="text-teal-100 text-xs">{items.length} {items.length === 1 ? "activity" : "activities"} planned</p>
          </div>
        </div>
        {/* Hotel for this day */}
        <div className="mt-3 bg-white/15 backdrop-blur rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span>🏨</span>
            <input value={hotelInfo || ""} onChange={(e) => onHotelChange?.(e.target.value)}
              placeholder="Where are you staying tonight?"
              className="flex-1 bg-transparent text-white placeholder:text-white/50 text-sm focus:outline-none" />
          </div>
        </div>
      </div>

      {/* Calendar timeline */}
      <div className="p-4">
        {/* Timeline view */}
        <div className="space-y-1">
          {TIME_SLOTS.map((slot) => {
            const slotItems = itemsByTime[slot] || [];
            const isActive = slotItems.length > 0;
            return (
              <div key={slot} className={`flex gap-3 min-h-[2.5rem] ${isActive ? "" : "opacity-40 hover:opacity-70"} transition-opacity`}>
                {/* Time label */}
                <div className="w-14 flex-shrink-0 text-right pt-2">
                  <span className="text-xs font-mono text-gray-400">{slot}</span>
                </div>
                {/* Divider */}
                <div className="w-px bg-gray-200 flex-shrink-0 relative">
                  <div className={`absolute top-2.5 -left-1 w-2 h-2 rounded-full ${isActive ? "bg-teal-500" : "bg-gray-200"}`} />
                </div>
                {/* Activities */}
                <div className="flex-1 py-1">
                  {slotItems.length > 0 ? (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={slotItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-1.5">
                          {slotItems.map((item) => (
                            <SortableItem key={item.id} item={item} planId={planId} />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    <button onClick={() => { setNewTime(slot); setAdding(true); }}
                      className="w-full h-6 rounded-lg border border-dashed border-gray-200 hover:border-teal-300 hover:bg-teal-50 transition-all text-xs text-gray-300 hover:text-teal-500">
                      +
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Unscheduled items */}
        {unscheduled.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">Unscheduled</p>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={unscheduled.map((i) => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1.5">
                  {unscheduled.map((item) => (
                    <SortableItem key={item.id} item={item} planId={planId} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {/* Add activity */}
        {adding ? (
          <div className="mt-3 p-3 bg-teal-50 rounded-xl space-y-2">
            <div className="flex gap-2">
              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)}
                className="px-2 py-2 bg-white border border-gray-200 rounded-lg text-sm w-28 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Activity name..."
                className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()} autoFocus />
            </div>
            <div className="flex gap-1.5">
              {(["activity", "food", "transport", "other"] as const).map((c) => (
                <button key={c} onClick={() => setNewCat(c)}
                  className={`text-xs px-2.5 py-1 rounded-full ${newCat === c ? "bg-teal-500 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
                  {catEmoji[c]} {c}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="px-3 py-1.5 bg-teal-500 text-white text-xs rounded-lg">Add</button>
              <button onClick={() => setAdding(false)} className="px-3 py-1.5 bg-white text-gray-600 text-xs rounded-lg border">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            className="mt-3 w-full py-2.5 border border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:text-teal-600 hover:border-teal-300 hover:bg-teal-50 transition-all">
            + Add Activity
          </button>
        )}
      </div>
    </div>
  );
}
