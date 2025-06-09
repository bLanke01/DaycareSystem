"use client";
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../firebase";
import { getAuth } from "firebase/auth";

export default function ParentPaymentsPage() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const auth = getAuth();
    const parentId = auth.currentUser?.uid; // Get the logged-in user's UID

    if (!parentId) {
      setBills([]);
      setLoading(false);
      return;
    }

    async function fetchBills() {
      setLoading(true);
      const q = query(
        collection(db, "invoices"),
        where("parentId", "==", parentId)
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBills(data);
      setLoading(false);
    }
    fetchBills();
  }, []);

  // Helper to get the latest fee date for sorting
  function getBillDate(bill) {
    if (!bill.items || bill.items.length === 0) return bill.dueDate || "";
    return bill.items.reduce(
      (latest, item) => (item.date > latest ? item.date : latest),
      bill.items[0]?.date || bill.dueDate || ""
    );
  }

  const filteredBills = bills
    .filter((bill) =>
      statusFilter === "All"
        ? true
        : bill.status?.toLowerCase() === statusFilter.toLowerCase()
    )
    .sort((a, b) => {
      const dateA = getBillDate(a);
      const dateB = getBillDate(b);
      if (sortOrder === "desc") {
        return dateB.localeCompare(dateA);
      } else {
        return dateA.localeCompare(dateB);
      }
    });

  return (
    <div>
      <h1>Your Bills & Payment History</h1>
      <div style={{ marginBottom: "1rem" }}>
        <label>
          Sort by date:{" "}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{ marginRight: "1rem" }}
          >
            <option value="desc">Most Recent</option>
            <option value="asc">Oldest First</option>
          </select>
        </label>
        <label>
          Status:{" "}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </label>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        filteredBills.map((bill) => (
          <div
            key={bill.id}
            style={{
              border: "1px solid #ccc",
              margin: "1rem 0",
              padding: "1rem",
            }}
          >
            <h2>
              {bill.dueDate} — {bill.status}
            </h2>
            <table
              border="1"
              cellPadding="6"
              style={{ width: "100%", marginBottom: "0.5rem" }}
            >
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Quantity</th>
                  <th>Rate</th>
                  <th>Total</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {(bill.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.description}</td>
                    <td>${item.amount}</td>
                    <td>{item.quantity}</td>
                    <td>{item.rate}</td>
                    <td>{item.total}</td>
                    <td>{item.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <strong>Total: ${bill.amount}</strong>
          </div>
        ))
      )}
      {!loading && filteredBills.length === 0 && <p>No bills found.</p>}
    </div>
  );
}
