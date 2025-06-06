"use client";

import { useState } from "react";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const defaultMeals = {
  Monday: { breakfast: "", lunch: "", snack: "" },
  Tuesday: { breakfast: "", lunch: "", snack: "" },
  Wednesday: { breakfast: "", lunch: "", snack: "" },
  Thursday: { breakfast: "", lunch: "", snack: "" },
  Friday: { breakfast: "", lunch: "", snack: "" },
};

export default function AdminMealsPage() {
  const [selectedDay, setSelectedDay] = useState("Monday");
  const [meals, setMeals] = useState(defaultMeals);

  const handleChange = (mealType, value) => {
    setMeals((prev) => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [mealType]: value,
      },
    }));
  };

  const handleDeleteDay = (day) => {
    setMeals((prev) => ({
      ...prev,
      [day]: { breakfast: "", lunch: "", snack: "" },
    }));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Meal Editor</h1>

      {/* Day Selector */}
      <div className="mb-4">
        <label className="font-semibold mr-2">Select Day:</label>
        <select
          className="border p-2 rounded"
          value={selectedDay}
          onChange={(e) => setSelectedDay(e.target.value)}
        >
          {weekdays.map((day) => (
            <option key={day} value={day}>
              {day}
            </option>
          ))}
        </select>
      </div>

      {/* Meal Inputs */}
      <div className="grid gap-4 max-w-md mb-8">
        {["breakfast", "lunch", "snack"].map((mealType) => (
          <div key={mealType}>
            <label className="block font-semibold capitalize mb-1">
              {mealType}
            </label>
            <input
              type="text"
              value={meals[selectedDay][mealType]}
              onChange={(e) => handleChange(mealType, e.target.value)}
              className="w-full border p-2 rounded"
              placeholder={`Enter ${mealType}`}
            />
          </div>
        ))}
      </div>

      {/* Preview Table */}
      <h2 className="text-xl font-semibold mb-2">Weekly Meal Plan Preview</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">Day</th>
              <th className="border px-4 py-2">Breakfast</th>
              <th className="border px-4 py-2">Lunch</th>
              <th className="border px-4 py-2">Snack</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {weekdays.map((day) => (
              <tr key={day}>
                <td className="border px-4 py-2 font-medium">{day}</td>
                <td className="border px-4 py-2">{meals[day].breakfast || "-"}</td>
                <td className="border px-4 py-2">{meals[day].lunch || "-"}</td>
                <td className="border px-4 py-2">{meals[day].snack || "-"}</td>
                <td className="border px-4 py-2">
                  <button
                    onClick={() => handleDeleteDay(day)}
                    className="text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
// This code provides an admin interface for editing weekly meals, allowing the selection of a day and inputting meals for breakfast, lunch, and snack. It also includes a preview table of the weekly meal plan with options to delete meals for specific days. The design is responsive and user-friendly, suitable for managing meal plans in a childcare setting.