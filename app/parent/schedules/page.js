"use client";

// jun, just keep working here for the parent side of schedulecalendar. any changes you made on the file needs to have comment properly so that we know what else we missing before we push to your branch. see my imports below if you need help to fix your errors so you can connect your stuff properly.

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase/config";

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

export default function ParentSchedules() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "calendarEvents"), (snapshot) => {
      const eventsData = snapshot.docs.map((doc) => ({
        ...doc.data(),
        start: new Date(doc.data().start),
        end: new Date(doc.data().end),
      }));
      setEvents(eventsData);
    });

    return () => unsub();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Your Child's Schedule</h1>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 500 }}
        tooltipAccessor={(event) =>
          `${event.title} | ${event.start.toLocaleTimeString()} - ${event.end.toLocaleTimeString()}`
        }
      />
    </div>
  );
}



// 'use client';



// import { useState } from 'react';
// import { useEffect } from 'react';
// import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
// import { db } from '../../firebase/config';

// export default function ParentSchedules() {
//   const [events, setEvents] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
//   const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
//   const [selectedEvent, setSelectedEvent] = useState(null);
//   const [showEventDetails, setShowEventDetails] = useState(false);

//   // Fetch events from Firestore
//   useEffect(() => {
//     const fetchEvents = async () => {
//       try {
//         const startOfMonth = new Date(currentYear, currentMonth, 1);
//         const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
        
//         const eventsRef = collection(db, 'events');
//         const q = query(
//           eventsRef,
//           where('date', '>=', Timestamp.fromDate(startOfMonth)),
//           where('date', '<=', Timestamp.fromDate(endOfMonth))
//         );
        
//         const querySnapshot = await getDocs(q);
//         const fetchedEvents = [];
//         querySnapshot.forEach((doc) => {
//           const data = doc.data();
//           fetchedEvents.push({
//             id: doc.id,
//             ...data,
//             date: data.date.toDate() // Convert Timestamp to Date
//           });
//         });
        
//         setEvents(fetchedEvents);
//         setLoading(false);
//       } catch (error) {
//         console.error('Error fetching events:', error);
//         setLoading(false);
//       }
//     };

//     fetchEvents();
//   }, [currentMonth, currentYear]);

//   // Calendar navigation
//   const goToPreviousMonth = () => {
//     if (currentMonth === 0) {
//       setCurrentMonth(11);
//       setCurrentYear(currentYear - 1);
//     } else {
//       setCurrentMonth(currentMonth - 1);
//     }
//   };

//   const goToNextMonth = () => {
//     if (currentMonth === 11) {
//       setCurrentMonth(0);
//       setCurrentYear(currentYear + 1);
//     } else {
//       setCurrentMonth(currentMonth + 1);
//     }
//   };

//   // Get days in month
//   const getDaysInMonth = (month, year) => {
//     return new Date(year, month + 1, 0).getDate();
//   };

//   // Get first day of month (0 = Sunday, 1 = Monday, etc.)
//   const getFirstDayOfMonth = (month, year) => {
//     return new Date(year, month, 1).getDay();
//   };

//   // Generate calendar days
//   const generateCalendarDays = () => {
//     const daysInMonth = getDaysInMonth(currentMonth, currentYear);
//     const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
//     const calendarDays = [];
    
//     // Add empty cells for days before the first day of the month
//     for (let i = 0; i < firstDay; i++) {
//       calendarDays.push({ day: null, events: [] });
//     }
    
//     // Add cells for each day of the month
//     for (let day = 1; day <= daysInMonth; day++) {
//       const date = new Date(currentYear, currentMonth, day);
//       const dayEvents = events.filter(event => {
//         const eventDate = event.date;
//         return eventDate.getDate() === day &&
//                eventDate.getMonth() === currentMonth &&
//                eventDate.getFullYear() === currentYear;
//       });
      
//       calendarDays.push({ day, date, events: dayEvents });
//     }
    
//     return calendarDays;
//   };

//   const monthNames = [
//     'January', 'February', 'March', 'April', 'May', 'June',
//     'July', 'August', 'September', 'October', 'November', 'December'
//   ];

//   const calendarDays = generateCalendarDays();

//   return (
//     <div className="container mx-auto p-4">
//       <div className="card bg-base-100 shadow-xl mb-6">
//         <div className="card-body">
//           <h1 className="card-title text-2xl">Daycare Schedule</h1>
          
//           <div className="flex justify-between items-center mt-4">
//             <button className="btn btn-ghost" onClick={goToPreviousMonth}>
//               ← Previous
//             </button>
//             <h2 className="text-xl font-semibold">
//               {monthNames[currentMonth]} {currentYear}
//             </h2>
//             <button className="btn btn-ghost" onClick={goToNextMonth}>
//               Next →
//             </button>
//           </div>

//           <div className="overflow-x-auto mt-6">
//             <div className="grid grid-cols-7 gap-1">
//               {/* Calendar Header */}
//               {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
//                 <div key={day} className="p-2 text-center font-semibold bg-base-200">
//                   {day}
//                 </div>
//               ))}

//               {/* Calendar Days */}
//               {calendarDays.map((calendarDay, index) => (
//                 <div 
//                   key={index} 
//                   className={`min-h-[100px] p-2 border border-base-200 ${
//                     !calendarDay.day ? 'bg-base-200/50' : 
//                     calendarDay.day === new Date().getDate() && 
//                     currentMonth === new Date().getMonth() && 
//                     currentYear === new Date().getFullYear() ? 'bg-primary/10' : ''
//                   }`}
//                 >
//                   {calendarDay.day && (
//                     <>
//                       <div className="text-right mb-2">{calendarDay.day}</div>
//                       <div className="space-y-1">
//                         {calendarDay.events.map(event => (
//                           <div 
//                             key={event.id} 
//                             className="badge badge-primary cursor-pointer p-2 text-xs"
//                             onClick={() => {
//                               setSelectedEvent(event);
//                               setShowEventDetails(true);
//                             }}
//                           >
//                             {event.title}
//                           </div>
//                         ))}
//                       </div>
//                     </>
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>

//       {loading && (
//         <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
//           <span className="loading loading-spinner loading-lg text-primary"></span>
//         </div>
//       )}

//       {/* Event Details Modal */}
//       {showEventDetails && selectedEvent && (
//         <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
//           <div className="modal-box relative">
//             <button 
//               className="btn btn-sm btn-circle absolute right-2 top-2"
//               onClick={() => setShowEventDetails(false)}
//             >
//               ✕
//             </button>
            
//             <h3 className="text-lg font-bold mb-4">{selectedEvent.title}</h3>
            
//             <div className="space-y-4">
//               <div>
//                 <label className="text-sm font-semibold opacity-70">Date:</label>
//                 <p>
//                   {selectedEvent.date.toLocaleDateString('en-US', {
//                     weekday: 'long',
//                     year: 'numeric',
//                     month: 'long',
//                     day: 'numeric'
//                   })}
//                 </p>
//               </div>
              
//               <div>
//                 <label className="text-sm font-semibold opacity-70">Time:</label>
//                 <p>{selectedEvent.time}</p>
//               </div>
              
//               <div>
//                 <label className="text-sm font-semibold opacity-70">Group:</label>
//                 <p>{selectedEvent.group}</p>
//               </div>
              
//               <div>
//                 <label className="text-sm font-semibold opacity-70">Description:</label>
//                 <p className="whitespace-pre-wrap">{selectedEvent.description}</p>
//               </div>
//             </div>

//             <div className="modal-action">
//               <button 
//                 className="btn btn-primary"
//                 onClick={() => setShowEventDetails(false)}
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
