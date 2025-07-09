"use client";

import React, { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase";
import { getAuth } from "firebase/auth";

function StatusBadge({ status }) {
  const color =
    status === "paid" ? "#4caf50" : status === "unpaid" ? "#ff9800" : "#bdbdbd";
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

export default function ParentInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalInvoice, setModalInvoice] = useState(null);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("All");

  useEffect(() => {
    const auth = getAuth();
    const userUID = auth.currentUser?.uid;
    if (!userUID) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "invoices"),
      where("userUID", "==", userUID)
    );
    // Listen for real-time updates
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setInvoices(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching invoices:", err);
        setLoading(false);
      }
    );

    // Cleanup on unmount
    return () => unsubscribe();
  }, []);

  // Filter and sort
  const filteredInvoices = invoices
    .filter((inv) =>
      statusFilter === "All" ? true : inv.status === statusFilter
    )
    .filter((inv) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return inv.invoiceNo && inv.invoiceNo.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (sortOrder === "desc") {
        return (b.dueDate || "").localeCompare(a.dueDate || "");
      } else {
        return (a.dueDate || "").localeCompare(b.dueDate || "");
      }
    });

  return (
    <div>
      <h1
        style={{
          margin: 0,
          fontSize: "2em",
          marginBottom: "1.5rem", // Add this line for spacing below header
        }}
      >
        Invoices
      </h1>
      <div
        style={{
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          gap: "1rem",
          background: "#f7fafd",
          padding: "1rem 1.5rem",
          borderRadius: "8px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
          flexWrap: "wrap",
        }}
      >
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            margin: 0,
          }}
        >
          <span
            style={{
              fontWeight: 500,
              color: "#333",
            }}
          >
            Sort by due date:
          </span>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            style={{
              marginRight: 0,
              padding: "0.45rem 1.2rem 0.45rem 0.7rem",
              borderRadius: 6,
              border: "1px solid #d0d7de",
              background: "#fff",
              fontSize: "1em",
              fontWeight: 500,
              color: "#222",
              outline: "none",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              transition: "border 0.2s",
            }}
          >
            <option value="desc">Most Recent</option>
            <option value="asc">Oldest First</option>
          </select>
        </label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            margin: 0,
          }}
        >
          <span
            style={{
              fontWeight: 500,
              color: "#333",
            }}
          >
            Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              marginRight: 0,
              padding: "0.45rem 1.2rem 0.45rem 0.7rem",
              borderRadius: 6,
              border: "1px solid #d0d7de",
              background: "#fff",
              fontSize: "1em",
              fontWeight: 500,
              color: "#222",
              outline: "none",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
              transition: "border 0.2s",
            }}
          >
            <option value="All">All</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </label>
        <input
          type="text"
          placeholder="Search by invoice no..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "0.45rem 1rem",
            borderRadius: 6,
            border: "1px solid #d0d7de",
            background: "#fff",
            fontSize: "1em",
            color: "#222",
            minWidth: 220,
            boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            transition: "border 0.2s",
            outline: "none",
          }}
        />
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : filteredInvoices.length === 0 ? (
        <p>No invoices found.</p>
      ) : (
        <table
          border="1"
          cellPadding="8"
          style={{
            width: "100%",
            marginTop: "1rem",
            borderCollapse: "separate",
            borderSpacing: "0 10px",
            background: "#fff",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)", // Subtle table shadow
            borderRadius: "10px",
            overflow: "hidden",
            tableLayout: "fixed", // <-- Add this for even column widths
          }}
        >
          <colgroup>
            <col style={{ width: "25%" }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "25%" }} />
            <col style={{ width: "25%" }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ textAlign: "center" }}>Invoice No</th>
              <th style={{ textAlign: "center" }}>Due Date</th>
              <th style={{ textAlign: "center" }}>Total</th>
              <th style={{ textAlign: "center" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((invoice) => (
              <tr
                key={invoice.id}
                style={{
                  background: "#fafbfc",
                  borderRadius: 8,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)", // Subtle row shadow
                  transition: "background 0.2s, box-shadow 0.2s",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f0f6ff")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "#fafbfc")
                }
                onClick={() => setModalInvoice(invoice)} // Open modal on row click
              >
                <td style={{ textAlign: "center" }}>{invoice.invoiceNo}</td>
                <td style={{ textAlign: "center" }}>{invoice.dueDate}</td>
                <td style={{ textAlign: "center" }}>
                  $
                  {(Array.isArray(invoice.items) ? invoice.items : []).reduce(
                    (sum, item) =>
                      sum +
                      Number(item.amount ?? 0) * Number(item.quantity ?? 0),
                    0
                  )}
                </td>
                <td style={{ textAlign: "center" }}>
                  <StatusBadge status={invoice.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {modalInvoice && (
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
            overflowY: "auto",
            maxHeight: "100vh",
            paddingTop: "3vh",
            paddingBottom: "3vh",
          }}
          onClick={() => setModalInvoice(null)}
        >
          <div
            id="parent-invoice-modal-content"
            style={{
              background: "#fff",
              padding: "2.5rem 2rem",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "700px",
              maxHeight: "95vh",
              overflowY: "auto",
              boxShadow: "0 4px 32px rgba(0,0,0,0.13)", // More prominent modal shadow
              position: "relative",
              margin: "auto",
              display: "flex",
              flexDirection: "column",
              boxSizing: "border-box",
              transition: "box-shadow 0.2s",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                borderBottom: "1px solid #eee",
                paddingBottom: 18,
                marginBottom: 24,
              }}
            >
              <div>
                <img
                  src="/logo.png"
                  alt="Daycare Logo"
                  style={{ height: 48, marginBottom: 8 }}
                />
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 20,
                    marginBottom: 2,
                  }}
                >
                  BrightStart Daycare
                </div>
                <div style={{ fontSize: "0.95em", color: "#555" }}>
                  123 Main St, City, State
                </div>
                <div style={{ fontSize: "0.95em", color: "#555" }}>
                  info@brightstart.com
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 30,
                    fontWeight: 700,
                    letterSpacing: 1,
                    marginBottom: 6,
                    color: "#007bff",
                  }}
                >
                  INVOICE
                </div>
                <div style={{ fontSize: "1em", color: "#333" }}>
                  <div>
                    <b>Invoice #:</b> {modalInvoice.invoiceNo}
                  </div>
                  <div>
                    <b>Invoice Date:</b>{" "}
                    {modalInvoice.createdAt
                      ? modalInvoice.createdAt.slice(0, 10)
                      : ""}
                  </div>
                  <div>
                    <b>Due Date:</b> {modalInvoice.dueDate}
                  </div>
                  <div>
                    <b>Status:</b> <StatusBadge status={modalInvoice.status} />
                  </div>
                </div>
              </div>
            </div>

            {/* Bill To */}
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "1.1em",
                  marginBottom: 4,
                }}
              >
                Bill to:
              </div>
              <div style={{ marginBottom: 2 }}>{modalInvoice.parentName}</div>
              {modalInvoice.paymentEmail && (
                <div style={{ color: "#555" }}>{modalInvoice.paymentEmail}</div>
              )}
            </div>

            {/* Items Table */}
            <div style={{ marginBottom: 24 }}>
              <table
                border="1"
                cellPadding="10"
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  background: "#fafbfc",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <thead style={{ background: "#f5f5f5" }}>
                  <tr>
                    <th style={{ textAlign: "center" }}>Item</th>
                    <th style={{ textAlign: "center" }}>Description / Notes</th>
                    <th style={{ textAlign: "center" }}>Unit Price</th>
                    <th style={{ textAlign: "center" }}>Qty</th>
                    <th style={{ textAlign: "center" }}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(Array.isArray(modalInvoice.items)
                    ? modalInvoice.items
                    : []
                  ).map((item, idx) => {
                    const amount = Number(item.amount ?? 0);
                    const quantity = Number(item.quantity ?? 0);
                    const itemTotal = amount * quantity;
                    return (
                      <tr key={idx}>
                        <td style={{ textAlign: "center" }}>
                          {item.description}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {item.notes || "-"}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          ${amount.toFixed(2)}
                        </td>
                        <td style={{ textAlign: "center" }}>{quantity}</td>
                        <td style={{ textAlign: "center" }}>
                          ${itemTotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 24,
              }}
            >
              <table style={{ width: "auto" }}>
                <tbody>
                  <tr>
                    <td
                      style={{
                        fontWeight: 700,
                        textAlign: "right",
                        paddingRight: 12,
                        fontSize: "1.1em",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Total:
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        fontWeight: 700,
                        paddingLeft: 12,
                        fontSize: "1.1em",
                        color: "#007bff",
                      }}
                    >
                      $
                      {(Array.isArray(modalInvoice.items)
                        ? modalInvoice.items
                        : []
                      )
                        .reduce(
                          (sum, item) =>
                            sum +
                            Number(item.amount ?? 0) *
                              Number(item.quantity ?? 0),
                          0
                        )
                        .toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment Instructions */}
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "1.05em",
                  marginBottom: 4,
                }}
              >
                Payment Instructions:
              </div>
              <div>
                Please pay by the due date. For questions, contact us at{" "}
                <a href="mailto:info@brightstart.com">info@brightstart.com</a>{" "}
                or <a href="tel:+15551234567">(555) 123-4567</a>.
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontStyle: "italic",
                  color: "#888",
                  fontSize: "0.95em",
                }}
              >
                Deposit amount is non-refundable.
              </div>
            </div>

            {/* Additional Notes */}
            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "1.05em",
                  marginBottom: 4,
                }}
              >
                Additional Notes:
              </div>
              <div style={{ whiteSpace: "pre-wrap", color: "#444" }}>
                {modalInvoice.additionalNotes || (
                  <span style={{ color: "#bbb" }}>No additional notes.</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "1rem",
                marginTop: "1.5rem",
              }}
            >
              <button
                className="no-print"
                style={{
                  padding: "0.7rem 1.5rem",
                  fontSize: "1em",
                  fontWeight: 600,
                  color: "#fff",
                  backgroundColor: "#007bff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                }}
                onClick={() => setModalInvoice(null)}
              >
                Close
              </button>
              <button
                className="no-print"
                style={{
                  padding: "0.7rem 1.5rem",
                  fontSize: "1em",
                  fontWeight: 600,
                  color: "#fff",
                  backgroundColor: "#28a745",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                }}
                onClick={() => {
                  const printContents = document.getElementById(
                    "parent-invoice-modal-content"
                  ).innerHTML;
                  const printWindow = window.open(
                    "",
                    "_blank",
                    "width=900,height=700"
                  );
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Invoice ${modalInvoice.invoiceNo}</title>
                        <style>
                          @media print {
                            .no-print { display: none !important; }
                            body { font-family: Arial, sans-serif; margin: 2rem; }
                            table { border-collapse: collapse; width: 100%; }
                            th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
                            th { background: #f5f5f5; }
                            #parent-invoice-modal-content, #parent-invoice-modal-content * {
                              visibility: visible !important;
                            }
                            body * {
                              visibility: hidden !important;
                            }
                            #parent-invoice-modal-content {
                              position: absolute !important;
                              left: 0; top: 0;
                              width: 21cm !important;
                              min-height: 29.7cm !important;
                              box-shadow: none !important;
                              margin: 0 !important;
                              padding: 2.5cm 2cm !important;
                              background: #fff !important;
                              z-index: 9999 !important;
                            }
                          }
                        </style>
                      </head>
                      <body>
                        <div id="parent-invoice-modal-content">
                          ${printContents}
                        </div>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                  printWindow.focus();
                  printWindow.print();
                }}
              >
                Print
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
