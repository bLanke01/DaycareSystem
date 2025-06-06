"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
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

export default function ParentSchedulePage() {
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
