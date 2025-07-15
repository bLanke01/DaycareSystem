// app/admin/schedules/page.js
'use client';


import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase/config";

import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import "react-big-calendar/lib/css/react-big-calendar.css";
import toast from "react-hot-toast";

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
  const [editingEventId, setEditingEventId] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("month");
  const [selectedEvent, setSelectedEvent] = useState(null);

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
    toast.success("Event added successfully.");
    setNewEvent({ title: "", start: "", end: "" });
  };


  // Edit event
  const handleUpdateEvent = async () => {
    if (!editingEventId) return;

    try {
      const eventRef = doc(db, "calendarEvents", editingEventId);
      await updateDoc(eventRef, {
        title: newEvent.title,
        start: new Date(newEvent.start).toISOString(),
        end: new Date(newEvent.end).toISOString(),
      });
      toast.success("Event updated successfully.");
      setEditingEventId(null);
      setNewEvent({ title: "", start: "", end: "" });
    } catch (err) {
      console.error("Failed to update event:", err);
      toast.error("Failed to update event.");
    }
  };

  // Delete event
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "calendarEvents", id));
      toast.success("Event deleted successfully.");
    } catch (error) {
      console.error("Failed to delete event:", error);
      toast.error("Failed to delete event.");
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event); 
  };
  

  


  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Staff Schedule & Calendar</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        {/* Event Title */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Event Title</label>
          <input
            type="text"
            placeholder="Event Title"
            value={newEvent.title}
            onChange={(e) =>
              setNewEvent((prev) => ({ ...prev, title: e.target.value }))
            }
            className="border p-2 rounded"
          />
        </div>

        {/* Start Date */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">Start Date & Time</label>
          <input
            type="datetime-local"
            value={newEvent.start}
            onChange={(e) =>
              setNewEvent((prev) => ({ ...prev, start: e.target.value }))
            }
            className="border p-2 rounded"
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col">
          <label className="text-sm font-medium mb-1">End Date & Time</label>
          <input
            type="datetime-local"
            value={newEvent.end}
            onChange={(e) =>
              setNewEvent((prev) => ({ ...prev, end: e.target.value }))
            }
            className="border p-2 rounded"
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-end">
          {editingEventId ? (
            <button
              onClick={handleUpdateEvent}
              className="bg-yellow-500 text-white px-4 py-2 rounded w-full"
            >
              Update Event
            </button>
          ) : (
            <button
              onClick={handleAddEvent}
              className="bg-blue-500 text-white px-4 py-2 rounded w-full"
            >
              Add Event
            </button>
          )}
        </div>
      </div>

      {/* Cancel Edit */}
      {editingEventId && (
        <div className="mb-4">
          <button
            onClick={() => {
              setEditingEventId(null);
              setNewEvent({ title: "", start: "", end: "" });
            }}
            className="text-sm text-gray-500 underline"
          >
            Cancel Editing
          </button>
        </div>
      )}


      {/* Calendar */}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        date={currentDate}
        view={currentView}
        onNavigate={(date) => setCurrentDate(date)}
        onView={(view) => setCurrentView(view)}
        tooltipAccessor={(event) =>
          `${event.title} (${format(event.start, "hh:mm a")} - ${format(event.end, "hh:mm a")})`
        }
        onSelectEvent= {handleSelectEvent}     
        />
      

      {/* Modal for Edit/Delete Options */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[300px] shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Do you want to edit or <br />
              delete this event?</h2>
            <p className="text-sm mb-4">{selectedEvent.title}</p>

            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-300 text-black px-3 py-1 rounded"
                onClick={() => setSelectedEvent(null)}
              >
                Cancel
              </button>

              <button
                className="bg-yellow-500 text-white px-3 py-1 rounded"
                onClick={() => {
                  setNewEvent({
                    title: selectedEvent.title,
                    start: new Date(selectedEvent.start)
                      .toISOString()
                      .slice(0, 16),
                    end: new Date(selectedEvent.end)
                      .toISOString()
                      .slice(0, 16),
                  });
                  setEditingEventId(selectedEvent.id);
                  setSelectedEvent(null);
                }}
              >
                Edit
              </button>

              <button
                className="bg-red-500 text-white px-3 py-1 rounded"
                onClick={() => {
                  handleDelete(selectedEvent.id);
                  setSelectedEvent(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
    
