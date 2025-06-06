"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase/firebaseconfig";

import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  "en-US": require("date-fns/locale/en-US"),
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function StaffSchedulePage() {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: "", start: "", end: "" });

  // Load events from Firebase
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "calendarEvents"), (snapshot) => {
      const eventsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        start: new Date(doc.data().start),
        end: new Date(doc.data().end),
      }));
      setEvents(eventsData);
    });

    return () => unsub();
  }, []);

  // Add new event
  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.start || !newEvent.end) return;
    await addDoc(collection(db, "calendarEvents"), {
      title: newEvent.title,
      start: new Date(newEvent.start).toISOString(),
      end: new Date(newEvent.end).toISOString(),
    });
    setNewEvent({ title: "", start: "", end: "" });
  };

  // Delete event
  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "calendarEvents", id));
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Staff Schedule & Calendar</h1>

      {/* Event Input */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <input
          type="text"
          placeholder="Event Title"
          value={newEvent.title}
          onChange={(e) =>
            setNewEvent((prev) => ({ ...prev, title: e.target.value }))
          }
          className="border p-2 rounded"
        />
        <input
          type="datetime-local"
          value={newEvent.start}
          onChange={(e) =>
            setNewEvent((prev) => ({ ...prev, start: e.target.value }))
          }
          className="border p-2 rounded"
        />
        <input
          type="datetime-local"
          value={newEvent.end}
          onChange={(e) =>
            setNewEvent((prev) => ({ ...prev, end: e.target.value }))
          }
          className="border p-2 rounded"
        />
        <button
          onClick={handleAddEvent}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Add Event
        </button>
      </div>

      {/* Calendar */}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        tooltipAccessor={(event) =>
          `${event.title} | ${event.start.toLocaleTimeString()} - ${event.end.toLocaleTimeString()}`
        }
        onDoubleClickEvent={(event) => handleDelete(event.id)}
      />
      <p className="text-sm text-gray-500 mt-2">
        💡 Double-click an event to delete it.
      </p>
    </div>
  );
}
