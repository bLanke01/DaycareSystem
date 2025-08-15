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

// Event categories with colors and emojis
const eventCategories = [
  { id: 'meeting', name: 'Meeting', color: '#3B82F6', emoji: '📅', bgColor: '#EFF6FF' },
  { id: 'training', name: 'Training', color: '#10B981', emoji: '📚', bgColor: '#ECFDF5' },
  { id: 'event', name: 'Special Event', color: '#F59E0B', emoji: '🎉', bgColor: '#FFFBEB' },
  { id: 'holiday', name: 'Holiday', color: '#EF4444', emoji: '🏖️', bgColor: '#FEF2F2' },
  { id: 'maintenance', name: 'Maintenance', color: '#8B5CF6', emoji: '🔧', bgColor: '#F5F3FF' },
  { id: 'activity', name: 'Activity', color: '#EC4899', emoji: '🎨', bgColor: '#FDF2F8' },
  { id: 'field-trip', name: 'Field Trip', color: '#06B6D4', emoji: '🚌', bgColor: '#ECFEFF' },
  { id: 'parent-meeting', name: 'Parent Meeting', color: '#84CC16', emoji: '👨‍👩‍👧‍👦', bgColor: '#F7FEE7' }
];

export default function StaffSchedulePage() {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ title: "", start: "", end: "", category: "meeting" });
  const [editingEventId, setEditingEventId] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("month");
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Load events from Firebase
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "calendarEvents"), (snapshot) => {
      const eventsData = snapshot.docs.map((doc) => {
        const data = doc.data();
        const category = eventCategories.find(cat => cat.id === data.category) || eventCategories[0];
        return {
          id: doc.id,
          ...data,
          start: new Date(data.start),
          end: new Date(data.end),
          category: data.category || 'meeting',
          resource: {
            color: category.color,
            bgColor: category.bgColor,
            emoji: category.emoji
          }
        };
      });
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
      category: newEvent.category,
    });
    toast.success("Event added successfully! 🎉");
    setNewEvent({ title: "", start: "", end: "", category: "meeting" });
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
        category: newEvent.category,
      });
      toast.success("Event updated successfully! ✨");
      setEditingEventId(null);
      setNewEvent({ title: "", start: "", end: "", category: "meeting" });
    } catch (err) {
      console.error("Failed to update event:", err);
      toast.error("Failed to update event.");
    }
  };

  // Delete event
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "calendarEvents", id));
      toast.success("Event deleted successfully! 🗑️");
    } catch (error) {
      console.error("Failed to delete event:", error);
      toast.error("Failed to delete event.");
    }
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event); 
  };

  // Custom event style function
  const eventStyleGetter = (event, start, end, isSelected) => {
    const category = eventCategories.find(cat => cat.id === event.category) || eventCategories[0];
    
    return {
      style: {
        backgroundColor: category.color + ' !important',
        color: 'white !important',
        opacity: 0.9
      }
    };
  };

  // Get current category details
  const getCurrentCategory = () => {
    return eventCategories.find(cat => cat.id === newEvent.category) || eventCategories[0];
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      {/* Add custom styles */}
      <style jsx global>{`
        .rbc-calendar {
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          border: none;
        }
        
        .rbc-header {
          background: linear-gradient(135deg, #e0e7ff 0%, #f0f9ff 100%);
          color: #4f46e5;
          font-weight: 600;
          padding: 4px 6px;
          border: 1px solid #c7d2fe;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          font-size: 13px;
        }
        
        .rbc-month-view {
          border-radius: 0 0 12px 12px;
          overflow: hidden;
        }
        
        /* Let RBC compute heights naturally */
        .rbc-date-cell { padding: 4px 8px !important; font-weight: 500; }
        .rbc-month-row { height: auto !important; }
        .rbc-day-bg { height: auto !important; }
        .rbc-row-content { padding: 2px !important; height: auto !important; overflow: visible !important; }
        .rbc-row { height: auto !important; }
        .rbc-row-content-scrollable { height: auto !important; overflow: visible !important; }
        
        .rbc-toolbar {
          background: white;
          padding: 20px;
          border-radius: 12px 12px 0 0;
          margin-bottom: 0;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .rbc-toolbar button {
          background: linear-gradient(135deg, #e0e7ff 0%, #f0f9ff 100%);
          border: 2px solid #c7d2fe;
          color: #4f46e5;
          border-radius: 8px;
          padding: 8px 16px;
          font-weight: 500;
          transition: all 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .rbc-toolbar button:hover {
          background: linear-gradient(135deg, #c7d2fe 0%, #dbeafe 100%);
          border-color: #a5b4fc;
          color: #3730a3;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .rbc-toolbar button.rbc-active {
          background: linear-gradient(135deg, #a5b4fc 0%, #93c5fd 100%);
          border-color: #6366f1;
          color: #1e1b4b;
          box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
        }
        
        .rbc-event {
          border-radius: 4px !important;
          border: none !important;
          padding: 1px 4px !important;
          font-weight: 600 !important;
          font-size: 10px !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.15) !important;
          min-height: 16px !important;
          height: 16px !important;
          display: flex !important;
          align-items: center !important;
          color: white !important;
          margin: 1px 0 !important;
          line-height: 1 !important;
          position: relative !important;
          z-index: 1 !important;
        }
        
        .rbc-event-content {
          overflow: hidden !important;
          text-overflow: ellipsis !important;
          white-space: nowrap !important;
          color: white !important;
          font-size: 10px !important;
          line-height: 1 !important;
          font-weight: 600 !important;
        }
        
        .rbc-events-container {
          margin: 0 !important;
          padding: 0 !important;
        }
        
        .rbc-row-segment {
          padding: 0 1px !important;
        }
        
        .rbc-event-label {
          display: none !important;
        }
        
        .rbc-show-more {
          background: #6366f1 !important;
          color: white !important;
          border-radius: 4px !important;
          font-size: 9px !important;
          padding: 1px 3px !important;
          margin: 1px 0 !important;
          font-weight: 600 !important;
          border: none !important;
          cursor: pointer !important;
          height: 14px !important;
          line-height: 1 !important;
        }
        
        .rbc-show-more:hover {
          background: #4f46e5 !important;
          transform: scale(1.05) !important;
        }
        
        .rbc-date-cell button {
          font-weight: 600 !important;
          font-size: 14px !important;
          color: #374151 !important;
          padding: 4px 8px !important;
          border-radius: 6px !important;
          transition: all 0.2s ease !important;
          background: rgba(255,255,255,0.8) !important;
          border: 1px solid rgba(0,0,0,0.1) !important;
          position: relative !important;
          z-index: 2 !important;
        }
        
        .rbc-date-cell button:hover {
          background: #f3f4f6 !important;
          color: #1f2937 !important;
        }
        
        .rbc-off-range button {
          color: #9ca3af !important;
        }
        
        .rbc-today button {
          background: #4f46e5 !important;
          color: white !important;
          border: 2px solid #6366f1 !important;
          box-shadow: 0 2px 8px rgba(79, 70, 229, 0.3) !important;
        }
        
        .rbc-today button:hover {
          background: #4338ca !important;
          border-color: #4f46e5 !important;
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 flex items-center gap-3">
            📅 <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Staff Schedule & Calendar</span>
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
            {/* Event Title */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-2 text-gray-700">📝 Event Title</label>
              <input
                type="text"
                placeholder="Enter event title..."
                value={newEvent.title}
                onChange={(e) =>
                  setNewEvent((prev) => ({ ...prev, title: e.target.value }))
                }
                className="border-2 border-gray-200 p-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>

            {/* Event Category */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-2 text-gray-700">🎨 Category</label>
              <select
                value={newEvent.category}
                onChange={(e) =>
                  setNewEvent((prev) => ({ ...prev, category: e.target.value }))
                }
                className="border-2 border-gray-200 p-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                style={{ 
                  backgroundColor: getCurrentCategory().bgColor,
                  borderColor: getCurrentCategory().color 
                }}
              >
                {eventCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.emoji} {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-2 text-gray-700">⏰ Start Date & Time</label>
              <input
                type="datetime-local"
                value={newEvent.start}
                onChange={(e) =>
                  setNewEvent((prev) => ({ ...prev, start: e.target.value }))
                }
                className="border-2 border-gray-200 p-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col">
              <label className="text-sm font-semibold mb-2 text-gray-700">🏁 End Date & Time</label>
              <input
                type="datetime-local"
                value={newEvent.end}
                onChange={(e) =>
                  setNewEvent((prev) => ({ ...prev, end: e.target.value }))
                }
                className="border-2 border-gray-200 p-3 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-end">
              {editingEventId ? (
                <button
                  onClick={handleUpdateEvent}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg w-full font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  ✨ Update Event
                </button>
              ) : (
                <button
                  onClick={handleAddEvent}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg w-full font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  ➕ Add Event
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
                  setNewEvent({ title: "", start: "", end: "", category: "meeting" });
                }}
                className="text-sm text-gray-600 hover:text-gray-800 underline bg-gray-100 px-4 py-2 rounded-lg transition-colors duration-200"
              >
                ❌ Cancel Editing
              </button>
            </div>
          )}


        </div>

        {/* Calendar */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 760 }}
            date={currentDate}
            view={currentView}
            onNavigate={(date) => setCurrentDate(date)}
            onView={(view) => setCurrentView(view)}
            eventPropGetter={eventStyleGetter}
            tooltipAccessor={(event) => {
              const category = eventCategories.find(cat => cat.id === event.category);
              return `${category?.emoji} ${event.title} (${format(event.start, "hh:mm a")} - ${format(event.end, "hh:mm a")})`;
            }}
            onSelectEvent={handleSelectEvent}
            popup={true}
            popupOffset={30}
            />
        </div>

        {/* Enhanced Modal for Edit/Delete Options */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 w-[400px] shadow-2xl transform transition-all duration-300">
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">
                  {eventCategories.find(cat => cat.id === selectedEvent.category)?.emoji || '📅'}
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Event Options</h2>
                <div 
                  className="inline-block px-4 py-2 rounded-full text-sm font-semibold text-white mb-4"
                  style={{ backgroundColor: eventCategories.find(cat => cat.id === selectedEvent.category)?.color || '#3B82F6' }}
                >
                  {eventCategories.find(cat => cat.id === selectedEvent.category)?.name || 'Event'}
                </div>
                <p className="text-lg text-gray-700 font-medium">{selectedEvent.title}</p>
                <p className="text-sm text-gray-500 mt-2">
                  {format(selectedEvent.start, "PPP p")} - {format(selectedEvent.end, "p")}
                </p>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                  onClick={() => setSelectedEvent(null)}
                >
                  ❌ Cancel
                </button>

                <button
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                  onClick={() => {
                    setNewEvent({
                      title: selectedEvent.title,
                      start: new Date(selectedEvent.start)
                        .toISOString()
                        .slice(0, 16),
                      end: new Date(selectedEvent.end)
                        .toISOString()
                        .slice(0, 16),
                      category: selectedEvent.category || 'meeting',
                    });
                    setEditingEventId(selectedEvent.id);
                    setSelectedEvent(null);
                  }}
                >
                  ✏️ Edit
                </button>

                <button
                  className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105"
                  onClick={() => {
                    handleDelete(selectedEvent.id);
                    setSelectedEvent(null);
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
    
