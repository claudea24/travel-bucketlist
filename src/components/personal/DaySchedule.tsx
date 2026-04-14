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

function SortableItem({ item, planId }: { item: ItineraryItem; planId: string }) {
  const { dispatch } = useTravelPlans();
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editTime, setEditTime] = useState(item.startTime || "");
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  const saveEdit = () => {
    dispatch({ type: "UPDATE_ITINERARY_ITEM", payload: { id: item.id, title: editTitle, startTime: editTime || null } });
    setEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style}
      className={`bg-white rounded-xl border-l-4 ${catColors[item.category] || "border-l-gray-300"} shadow-sm overflow-hidden group hover:shadow-md transition-all`}>

      {editing ? (
        <div className="p-4 space-y-2">
          <div className="flex gap-2">
            <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)}
              className="px-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm w-28 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
              className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              onKeyDown={(e) => e.key === "Enter" && saveEdit()} />
          </div>
          <div className="flex gap-2">
            <button onClick={saveEdit} className="px-3 py-1.5 bg-teal-500 text-white text-xs rounded-lg">Save</button>
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs rounded-lg">Cancel</button>
            <button onClick={() => dispatch({ type: "DELETE_ITINERARY_ITEM", payload: { id: item.id, planId } })}
              className="px-3 py-1.5 bg-rose-50 text-rose-600 text-xs rounded-lg ml-auto">Delete</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Drag handle */}
          <button {...attributes} {...listeners}
            className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing touch-none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
              <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
            </svg>
          </button>

          {/* Time */}
          <div className="w-16 flex-shrink-0">
            {item.startTime ? (
              <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">{item.startTime}</span>
            ) : (
              <span className="text-xs text-gray-300 italic">no time</span>
            )}
          </div>

          {/* Icon + Content */}
          <span className="text-lg flex-shrink-0">{catEmoji[item.category] || "📌"}</span>
          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setEditing(true)}>
            <h5 className="text-sm font-medium text-gray-900 hover:text-teal-600 transition-colors">{item.title}</h5>
            {item.description && <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.description}</p>}
          </div>

          {/* Cost */}
          {item.estimatedCost && (
            <span className="text-xs text-teal-600 flex-shrink-0">${item.estimatedCost}</span>
          )}

          {/* Quick delete */}
          <button onClick={() => dispatch({ type: "DELETE_ITINERARY_ITEM", payload: { id: item.id, planId } })}
            className="text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}

interface DayScheduleProps {
  planId: string;
  dayNumber: number;
  items: ItineraryItem[];
  countryName: string;
}

export default function DaySchedule({ planId, dayNumber, items, countryName }: DayScheduleProps) {
  const { dispatch } = useTravelPlans();
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newCat, setNewCat] = useState<string>("activity");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...items];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);
    reordered.forEach((item, idx) => {
      dispatch({ type: "UPDATE_ITINERARY_ITEM", payload: { id: item.id, sortOrder: idx } });
    });
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
    setNewTitle("");
    setNewTime("");
    setAdding(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Day header */}
      <div className="bg-gradient-to-r from-gray-50 to-white px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500 text-white rounded-xl flex items-center justify-center font-bold text-lg">{dayNumber}</div>
          <div>
            <h3 className="font-semibold text-gray-900">Day {dayNumber}</h3>
            <p className="text-xs text-gray-400">{items.length} {items.length === 1 ? "activity" : "activities"} · Click to edit · Drag to reorder</p>
          </div>
        </div>
        <button onClick={() => setAdding(true)}
          className="text-sm px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100">+ Add</button>
      </div>

      <div className="p-4 space-y-2">
        {/* Add form */}
        {adding && (
          <div className="p-4 bg-teal-50 rounded-xl space-y-2 mb-2">
            <div className="flex gap-2">
              <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)}
                className="px-2 py-2 bg-white border border-gray-200 rounded-lg text-sm w-28 focus:outline-none focus:ring-2 focus:ring-teal-500" />
              <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="What are you doing?"
                className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()} autoFocus />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {(["activity", "food", "transport", "accommodation", "sightseeing", "shopping", "other"] as const).map((c) => (
                <button key={c} onClick={() => setNewCat(c)}
                  className={`text-xs px-2.5 py-1 rounded-full ${newCat === c ? "bg-teal-500 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
                  {catEmoji[c]} {c}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} className="px-3 py-1.5 bg-teal-500 text-white text-xs rounded-lg">Add</button>
              <button onClick={() => setAdding(false)} className="px-3 py-1.5 bg-white text-gray-600 text-xs rounded-lg border border-gray-200">Cancel</button>
            </div>
          </div>
        )}

        {/* Sortable activities */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            {items.map((item) => (
              <SortableItem key={item.id} item={item} planId={planId} />
            ))}
          </SortableContext>
        </DndContext>

        {items.length === 0 && !adding && (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">📋</p>
            <p className="text-sm text-gray-400 mb-2">Nothing planned for this day yet</p>
            <button onClick={() => setAdding(true)}
              className="text-sm px-4 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100">+ Add Activity</button>
          </div>
        )}
      </div>
    </div>
  );
}
