"use client";
import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../../../firebase";

function StatusBadge({ status }) {
  const color =
    status === "paid"
      ? "#4caf50"
      : status === "pending"
      ? "#ff9800"
      : status === "void"
      ? "#f44336" // red for void
      : "#bdbdbd";
  return (
    <span
      style={{
        background: color,
        color: "#fff",
        borderRadius: "12px",
        padding: "2px 12px",
        fontSize: "0.95em",
        fontWeight: 600,
        display: "inline-block",
        minWidth: "60px",
        textAlign: "center",
      }}
    >
      {status}
    </span>
  );
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [modalPayment, setModalPayment] = useState(null);
  const [search, setSearch] = useState("");
  const [editingStatusId, setEditingStatusId] = useState(null);

  useEffect(() => {
    async function fetchPayments() {
      setLoading(true);
      const querySnapshot = await getDocs(collection(db, "invoices"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPayments(data);
      setLoading(false);
    }
    fetchPayments();
  }, []);

  const filteredPayments = payments
    .filter((p) => (statusFilter === "All" ? true : p.status === statusFilter))
    .filter((p) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        (p.parentName && p.parentName.toLowerCase().includes(q)) ||
        (p.invoiceNo && p.invoiceNo.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortOrder === "desc") {
        return (b.dueDate || "").localeCompare(a.dueDate || "");
      } else {
        return (a.dueDate || "").localeCompare(b.dueDate || "");
      }
    });

  const handleStatusChange = async (id, newStatus) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
    setEditingStatusId(null);

    // Update Firestore
    try {
      const invoiceRef = doc(db, "invoices", id);
      await updateDoc(invoiceRef, { status: newStatus });
    } catch (error) {
      alert("Failed to update status in Firestore.");
      // Optionally, revert local state here if needed
    }
  };

  return (
    <div>
      <h1>All Payments</h1>
      <div style={{ marginBottom: "1rem" }}>
        <label>
          Sort by due date:{" "}
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
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
            <option value="void">Void</option>
          </select>
        </label>
        <div style={{ marginTop: "0.5rem" }}>
          <input
            type="text"
            placeholder="Search by parent or invoice no..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "0.5rem",
              width: "250px",
              marginRight: "1rem",
            }}
          />
        </div>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table
          border="1"
          cellPadding="8"
          style={{ width: "100%", marginTop: "1rem" }}
        >
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Parent</th>
              <th>Amount</th>
              <th>Due Date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => (
              <tr key={payment.id}>
                <td>{payment.invoiceNo}</td>
                <td>{payment.parentName}</td>
                <td>
                  $
                  {(Array.isArray(payment.items) ? payment.items : []).reduce(
                    (sum, item) =>
                      sum +
                      Number(item.amount ?? 0) * Number(item.quantity ?? 0),
                    0
                  )}
                </td>
                <td>{payment.dueDate}</td>
                <td
                  style={{ cursor: "pointer" }}
                  onClick={() => setEditingStatusId(payment.id)}
                >
                  {editingStatusId === payment.id ? (
                    <select
                      value={payment.status}
                      autoFocus
                      onBlur={() => setEditingStatusId(null)}
                      onChange={(e) =>
                        handleStatusChange(payment.id, e.target.value)
                      }
                    >
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="void">Void</option>
                    </select>
                  ) : (
                    <StatusBadge status={payment.status} />
                  )}
                </td>
                <td>
                  <button onClick={() => setModalPayment(payment)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {!loading && filteredPayments.length === 0 && <p>No payments found.</p>}
      {modalPayment && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setModalPayment(null)}
        >
          <div
            style={{
              background: "#fff",
              padding: "2rem",
              borderRadius: "8px",
              minWidth: "400px",
              maxWidth: "90vw",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Invoice Items for {modalPayment.invoiceNo}</h2>
            <table
              border="1"
              cellPadding="6"
              style={{ width: "100%", marginTop: "0.5rem" }}
            >
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Quantity</th>
                  <th>Item Total</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(modalPayment.items)
                  ? modalPayment.items
                  : []
                ).map((item, idx) => {
                  const amount = Number(item.amount ?? 0);
                  const quantity = Number(item.quantity ?? 0);
                  const itemTotal = amount * quantity;
                  return (
                    <tr key={idx}>
                      <td>{item.description}</td>
                      <td>${amount}</td>
                      <td>{quantity}</td>
                      <td>${itemTotal}</td>
                      <td>{item.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div style={{ marginTop: "0.5rem", textAlign: "right" }}>
              <strong>
                Invoice Total: $
                {(Array.isArray(modalPayment.items)
                  ? modalPayment.items
                  : []
                ).reduce(
                  (sum, item) =>
                    sum + Number(item.amount ?? 0) * Number(item.quantity ?? 0),
                  0
                )}
              </strong>
            </div>
            <button
              style={{ marginTop: "1rem" }}
              onClick={() => setModalPayment(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
