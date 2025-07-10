"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/config";

export default function ParentMealsPage() {
  const [mealPlans, setMealPlans] = useState({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(true);

  const mealTypes = ["breakfast", "morning-snack", "lunch", "afternoon-snack", "dinner"];

  const formatMealType = (mealType) =>
    mealType
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const getMealIcon = (mealType) => {
    const icons = {
      breakfast: "🌅",
      "morning-snack": "🍎",
      lunch: "🍽️",
      "afternoon-snack": "🥨",
      dinner: "🌙",
    };
    return icons[mealType] || "🍽️";
  };

  useEffect(() => {
    const fetchMealPlans = async () => {
      try {
        setLoading(true);
        const mealSnapshot = await getDocs(
          query(collection(db, "mealPlans"), where("date", "==", selectedDate))
        );
        const plans = {};
        mealSnapshot.forEach((doc) => {
          const data = doc.data();
          plans[data.mealType] = data;
        });
        setMealPlans(plans);
      } catch (err) {
        console.error("Failed to fetch meals:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMealPlans();
  }, [selectedDate]);

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">🍽️ Weekly Meal Plan</h1>

      <div className="mb-4">
        <label className="mr-2 font-semibold">Select Date:</label>
        <input
          type="date"
          className="input input-bordered"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {loading ? (
        <p>Loading meals...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mealTypes.map((mealType) => {
            const plan = mealPlans[mealType];
            return (
              <div key={mealType} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h3 className="card-title">
                    {getMealIcon(mealType)} {formatMealType(mealType)}
                  </h3>
                  {plan ? (
                    <div className="space-y-1">
                      {plan.mainDish && (
                        <p>
                          <strong>Main:</strong> {plan.mainDish}
                        </p>
                      )}
                      {plan.sideDish && (
                        <p>
                          <strong>Side:</strong> {plan.sideDish}
                        </p>
                      )}
                      {plan.drink && (
                        <p>
                          <strong>Drink:</strong> {plan.drink}
                        </p>
                      )}
                      {plan.dessert && (
                        <p>
                          <strong>Dessert:</strong> {plan.dessert}
                        </p>
                      )}
                      {plan.notes && (
                        <p>
                          <strong>Notes:</strong> {plan.notes}
                        </p>
                      )}
                      {plan.allergens?.length > 0 && (
                        <p className="text-sm text-red-500">
                          ⚠️ Contains allergens: {plan.allergens.join(", ")}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p>No meal planned.</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
