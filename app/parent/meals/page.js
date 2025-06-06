"use client";

export default function ParentMealsPage() {
  const weeklyMeals = {
    Monday: "Pasta with tomato sauce",
    Tuesday: "Grilled chicken with rice",
    Wednesday: "Mac & Cheese with broccoli",
    Thursday: "Fish sticks and carrots",
    Friday: "Pizza and fruit cup",
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Weekly Meal Plan</h1>
      <table className="min-w-full border border-gray-300 rounded-lg shadow-md">
        <thead className="bg-gray-100">
          <tr>
            <th className="text-left px-4 py-2">Day</th>
            <th className="text-left px-4 py-2">Meal</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(weeklyMeals).map(([day, meal]) => (
            <tr key={day} className="border-t">
              <td className="px-4 py-2 font-medium">{day}</td>
              <td className="px-4 py-2">{meal}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
