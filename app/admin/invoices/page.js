"use client";


import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase/config";

// 1. Update the StatusBadge color logic:
function StatusBadge({ status, isOverdue = false }) {
  // If invoice is overdue and unpaid, show "overdue" instead of "unpaid"
  const displayStatus = isOverdue && status === "unpaid" ? "overdue" : status;

  const color =
    displayStatus === "paid"
      ? "#4caf50"
      : displayStatus === "unpaid"
      ? "#ff9800"
      : displayStatus === "overdue"
      ? "#f44336"
      : "#bdbdbd"; // Red for overdue

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
      {displayStatus}
    </span>
  );
}

// Helper to generate a unique invoice number
function generateInvoiceNo(existingInvoiceNos) {
  // Format: INV-<timestamp>
  let invoiceNo;
  let unique = false;
  let tries = 0;
  while (!unique && tries < 5) {
    invoiceNo = `INV-${Date.now() + tries}`; // Add tries to avoid collision in rare cases
    if (!existingInvoiceNos.includes(invoiceNo)) {
      unique = true;
    } else {
      tries++;
    }
  }
  return invoiceNo;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [modalPayment, setModalPayment] = useState(null);
  const [search, setSearch] = useState("");
  const [editingStatusId, setEditingStatusId] = useState(null);

  // Add the isOverdue function
  const isOverdue = (payment) => {
    if (payment.status === "paid") return false;
    const today = new Date().toISOString().split("T")[0];
    return payment.dueDate < today;
  };

  // NEW: State for editing invoice items
  const [editItems, setEditItems] = useState([]);
  // NEW: Track which invoice is being edited
  const [editingInvoiceId, setEditingInvoiceId] = useState(null);
  const [isEditingItems, setIsEditingItems] = useState(false);
  const [editNotes, setEditNotes] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteIdx, setDeleteIdx] = useState(null);
  const [showSavedNotice, setShowSavedNotice] = useState(false);
  const [editDueDate, setEditDueDate] = useState("");

  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    parentName: "",
    paymentEmail: "",
    dueDate: "",
    items: [{ description: "", notes: "", amount: 0, quantity: 1 }],
    additionalNotes: "",
  });
  const [creating, setCreating] = useState(false);

  // Add state for invoice delete confirmation
  const [showDeleteInvoiceConfirm, setShowDeleteInvoiceConfirm] =
    useState(false);

  // For warning message
  const [uidWarning, setUidWarning] = useState("");

  // Add state
  const [uidLoading, setUidLoading] = useState(false);

  // Add validation state
  const [validationErrors, setValidationErrors] = useState([]);

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

  // When opening modal, set editItems and editingInvoiceId
  const handleOpenModal = (payment) => {
    setModalPayment(payment);
    setEditItems(
      Array.isArray(payment.items)
        ? payment.items.map((item) => ({ ...item }))
        : []
    );
    setEditingInvoiceId(payment.id);
    setIsEditingItems(false);
    setEditNotes(payment.additionalNotes || "");
    setEditDueDate(payment.dueDate || "");
  };

  // Add new item
  const handleAddItem = () => {
    setEditItems([
      ...editItems,
      { description: "", notes: "", amount: 0, quantity: 1 },
    ]);
  };

  // Remove item
  const handleRemoveItem = (idx) => {
    setDeleteIdx(idx);
    setShowDeleteConfirm(true);
  };

  const confirmRemoveItem = () => {
    setEditItems(editItems.filter((_, i) => i !== deleteIdx));
    setShowDeleteConfirm(false);
    setDeleteIdx(null);
  };

  const cancelRemoveItem = () => {
    setShowDeleteConfirm(false);
    setDeleteIdx(null);
  };

  // Edit item field
  const handleItemChange = (idx, field, value) => {
    setEditItems(
      editItems.map((item, i) =>
        i === idx
          ? {
              ...item,
              [field]:
                field === "amount" || field === "quantity"
                  ? Number(value)
                  : value,
            }
          : item
      )
    );
  };

  // Save changes (update Firestore)
  const handleSaveItems = async () => {
    try {
      const invoiceRef = doc(db, "invoices", editingInvoiceId);
      await updateDoc(invoiceRef, {
        items: editItems,
        additionalNotes: editNotes,
        dueDate: editDueDate,
        parentName: modalPayment.parentName,
        paymentEmail: modalPayment.paymentEmail,
        userUID: modalPayment.userUID,
      });

      setModalPayment((prev) => ({
        ...prev,
        items: editItems,
        additionalNotes: editNotes,
        dueDate: editDueDate,
      }));

      setPayments((prev) =>
        prev.map((inv) =>
          inv.id === editingInvoiceId
            ? {
                ...inv,
                items: editItems,
                additionalNotes: editNotes,
                dueDate: editDueDate,
                parentName: modalPayment.parentName,
                paymentEmail: modalPayment.paymentEmail,
                userUID: modalPayment.userUID,
              }
            : inv
        )
      );

      setIsEditingItems(false);
      setShowSavedNotice(true);
      setTimeout(() => setShowSavedNotice(false), 2000);
    } catch (err) {
      alert("Failed to update invoice items.");
    }
  };

  // Calculate total
  const total = editItems.reduce(
    (sum, item) => sum + Number(item.amount ?? 0) * Number(item.quantity ?? 0),
    0
  );

  // Update the filtering logic to include overdue
  const filteredPayments = payments
    .filter((payment) => {
      if (statusFilter === "All") return true;
      if (statusFilter === "overdue") return isOverdue(payment);
      return payment.status === statusFilter;
    })
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

  // NEW: Handle creating a new invoice
  const handleCreateInvoice = async () => {
    if (creating) return;

    // Validate before creating
    const errors = validateInvoice();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors([]);
    setCreating(true);

    try {
      // Always get the latest invoice numbers from state (in case of concurrent adds)
      let invoiceNo;
      let tries = 0;
      let unique = false;

      while (!unique && tries < 5) {
        const currentInvoiceNos = payments.map((p) => p.invoiceNo);
        invoiceNo = generateInvoiceNo(currentInvoiceNos);

        // Check if this invoiceNo already exists in Firestore (for extra safety)
        const querySnapshot = await getDocs(collection(db, "invoices"));
        const allInvoiceNos = querySnapshot.docs.map(
          (doc) => doc.data().invoiceNo
        );
        if (!allInvoiceNos.includes(invoiceNo)) {
          unique = true;
        } else {
          tries++;
        }
      }

      if (!unique) {
        alert("Failed to generate a unique invoice number. Please try again.");
        setCreating(false);
        return;
      }

      // Add new invoice to Firestore
      const docRef = await addDoc(collection(db, "invoices"), {
        ...newInvoice,
        invoiceNo,
        createdAt: new Date().toISOString(),
        status: "unpaid", // <-- ensure status is set here
      });

      setPayments((prev) => [
        ...prev,
        {
          id: docRef.id,
          ...newInvoice,
          invoiceNo,
          createdAt: new Date().toISOString(),
          status: "unpaid", // <-- ensure status is set here too
        },
      ]);
      setShowNewInvoiceModal(false);
      setNewInvoice({
        parentName: "",
        paymentEmail: "",
        dueDate: "",
        items: [{ description: "", notes: "", amount: 0, quantity: 1 }],
        additionalNotes: "",
      });

      setShowSavedNotice(true);
      setTimeout(() => setShowSavedNotice(false), 2000);
    } catch (error) {
      alert("Failed to create new invoice.");
    } finally {
      setCreating(false);
    }
  };

  // Delete invoice handler
  const handleDeleteInvoice = async () => {
    if (!editingInvoiceId) return;
    try {
      await deleteDoc(doc(db, "invoices", editingInvoiceId));
      setPayments((prev) => prev.filter((inv) => inv.id !== editingInvoiceId));
      setModalPayment(null);
      setIsEditingItems(false);
      setShowDeleteInvoiceConfirm(false);
      setEditingInvoiceId(null);
    } catch (err) {
      alert("Failed to delete invoice.");
    }
  };

  // When closing the modal, also clear the saved notice
  const handleCloseModal = () => {
    if (isEditingItems && hasUnsavedInvoiceChanges()) {
      setShowDiscardInvoiceConfirm(true);
    } else {
      setModalPayment(null);
      setShowSavedNotice(false);
      setIsEditingItems(false);
    }
  };

  // Handler for Parent UID input
  async function handleParentUidChange(e) {
    const uid = e.target.value.trim();
    setNewInvoice((prev) => ({ ...prev, userUID: uid }));
    setUidWarning("");
    setUidLoading(true);
    if (!uid) {
      setNewInvoice((prev) => ({
        ...prev,
        parentName: "",
        paymentEmail: "",
      }));
      setUidLoading(false);
      return;
    }
    try {
      // Now using "users" collection
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setNewInvoice((prev) => ({
          ...prev,
          parentName: `${data.firstName || ""} ${data.lastName || ""}`.trim(),
          paymentEmail: data.email || "", // <-- Only use the root "email" field
        }));
        setUidWarning("");
      } else {
        setNewInvoice((prev) => ({
          ...prev,
          parentName: "",
          paymentEmail: "",
        }));
        setUidWarning("Not an existing parent UID!");
      }
    } catch {
      setUidWarning("Not an existing parent UID!");
      setNewInvoice((prev) => ({
        ...prev,
        parentName: "",
        paymentEmail: "",
      }));
    } finally {
      setUidLoading(false);
    }
  }

  // Add validation function
  const validateInvoice = () => {
    const errors = [];

    if (!newInvoice.parentName.trim()) {
      errors.push("Parent name is required");
    }

    if (!newInvoice.paymentEmail.trim()) {
      errors.push("Parent email is required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newInvoice.paymentEmail)) {
      errors.push("Please enter a valid email address");
    }

    if (!newInvoice.dueDate) {
      errors.push("Due date is required");
    }

    const hasValidCharge = newInvoice.items.some(
      (item) => item.description.trim() && item.amount > 0
    );

    if (!hasValidCharge) {
      errors.push(
        "At least one charge with description and amount > 0 is required"
      );
    }

    return errors;
  };

  // Add function to check if modal has unsaved changes
  const hasUnsavedChanges = () => {
    return (
      newInvoice.parentName.trim() ||
      newInvoice.paymentEmail.trim() ||
      newInvoice.dueDate ||
      newInvoice.additionalNotes.trim() ||
      newInvoice.userUID ||
      newInvoice.items.some(
        (item) =>
          item.description.trim() ||
          item.notes.trim() ||
          item.amount > 0 ||
          item.quantity !== 1
      )
    );
  };

  // Add function to check if existing invoice modal has unsaved changes
  const hasUnsavedInvoiceChanges = () => {
    if (!modalPayment || !isEditingItems) return false;

    // Check if items have changed
    const originalItems = Array.isArray(modalPayment.items)
      ? modalPayment.items
      : [];
    if (editItems.length !== originalItems.length) return true;

    const itemsChanged = editItems.some((item, idx) => {
      const original = originalItems[idx];
      if (!original) return true;
      return (
        item.description !== (original.description || "") ||
        item.notes !== (original.notes || "") ||
        Number(item.amount) !== Number(original.amount || 0) ||
        Number(item.quantity) !== Number(original.quantity || 0)
      );
    });

    // Check if other fields have changed
    const notesChanged = editNotes !== (modalPayment.additionalNotes || "");
    const dueDateChanged = editDueDate !== (modalPayment.dueDate || "");
    const nameChanged =
      modalPayment.parentName !== (modalPayment.parentName || "");
    const emailChanged =
      modalPayment.paymentEmail !== (modalPayment.paymentEmail || "");
    const uidChanged = modalPayment.userUID !== (modalPayment.userUID || "");

    return (
      itemsChanged ||
      notesChanged ||
      dueDateChanged ||
      nameChanged ||
      emailChanged ||
      uidChanged
    );
  };

  // Add confirmation modal state
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  // Add confirmation modal state for existing invoice
  const [showDiscardInvoiceConfirm, setShowDiscardInvoiceConfirm] =
    useState(false);

  // Update modal close handler
  const handleCloseNewInvoiceModal = () => {
    if (hasUnsavedChanges()) {
      setShowDiscardConfirm(true);
    } else {
      setShowNewInvoiceModal(false);
    }
  };

  return (
    <div>
      {/* Header with button on the right */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1.5rem",
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: "2em",
          }}
        >
          Invoices
        </h1>
        <button
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
          onClick={() => setShowNewInvoiceModal(true)}
        >
          + New Invoice
        </button>
      </div>
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
          style={{ display: "flex", alignItems: "center", gap: 6, margin: 0 }}
        >
          <span style={{ fontWeight: 500, color: "#333" }}>
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
          style={{ display: "flex", alignItems: "center", gap: 6, margin: 0 }}
        >
          <span style={{ fontWeight: 500, color: "#333" }}>Status:</span>
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
            <option value="overdue">Overdue</option>
          </select>
        </label>
        <input
          type="text"
          placeholder="Search by parent or invoice no..."
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
      ) : (
        <table
          border="1"
          cellPadding="12"
          style={{
            width: "100%",
            marginTop: "1rem", // <-- Add this for consistent spacing below filters
            borderCollapse: "separate",
            borderSpacing: "0 12px",
            background: "#fff",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            borderRadius: "10px",
            overflow: "hidden",
            tableLayout: "fixed",
          }}
        >
          <colgroup>
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
            <col style={{ width: "20%" }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ textAlign: "center", padding: "16px 0" }}>
                Invoice No
              </th>
              <th style={{ textAlign: "center", padding: "16px 0" }}>Parent</th>
              <th style={{ textAlign: "center", padding: "16px 0" }}>
                Due Date
              </th>
              <th style={{ textAlign: "center", padding: "16px 0" }}>Total</th>
              <th style={{ textAlign: "center", padding: "16px 0" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.map((payment) => (
              <tr
                key={payment.id}
                style={{
                  background: isOverdue(payment) ? "#fff5f5" : "#fafbfc",
                  borderRadius: 8,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                  transition: "background 0.2s, box-shadow 0.2s",
                  cursor: "pointer",
                  border: isOverdue(payment) ? "1px solid #feb2b2" : "none",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = isOverdue(payment)
                    ? "#fef5f5"
                    : "#f0f6ff")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = isOverdue(payment)
                    ? "#fff5f5"
                    : "#fafbfc")
                }
                onClick={() => handleOpenModal(payment)} // Open modal on row click
              >
                <td style={{ textAlign: "center", padding: "14px 0" }}>
                  {payment.invoiceNo}
                </td>
                <td style={{ textAlign: "center", padding: "14px 0" }}>
                  {payment.parentName}
                </td>
                <td style={{ textAlign: "center", padding: "14px 0" }}>
                  {payment.dueDate}
                </td>
                <td style={{ textAlign: "center", padding: "14px 0" }}>
                  $
                  {(Array.isArray(payment.items) ? payment.items : []).reduce(
                    (sum, item) =>
                      sum +
                      Number(item.amount ?? 0) * Number(item.quantity ?? 0),
                    0
                  )}
                </td>
                <td style={{ textAlign: "center", padding: "14px 0" }}>
                  {/* Remove the div wrapper and emoji, just show the status badge */}
                  <StatusBadge
                    status={payment.status}
                    isOverdue={isOverdue(payment)}
                  />
                </td>
                {/* Removed the View button cell */}
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
            overflowY: "auto",
            maxHeight: "100vh",
            paddingTop: "3vh",
            paddingBottom: "3vh",
          }}
          onClick={handleCloseModal}
        >
          <div
            id="admin-invoice-modal-content"
            style={{
              background: "#fff",
              padding: "2.5rem 2rem",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "900px",
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
                {/* <img src="/logo.png" alt="Daycare Logo" style={{ height: 48, marginBottom: 8 }} /> */}
                <div style={{ fontWeight: 700, fontSize: 20, marginBottom: 2 }}>
                  TinyLog Daycare
                </div>
                <div style={{ fontSize: "0.95em", color: "#555" }}>
                  123 Main St, City, State
                </div>
                <div style={{ fontSize: "0.95em", color: "#555" }}>
                  info@tinylog.com
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
                    <b>Invoice #:</b> {modalPayment.invoiceNo}
                  </div>
                  <div>
                    <b>Invoice Date:</b>{" "}
                    {modalPayment.createdAt
                      ? modalPayment.createdAt.slice(0, 10)
                      : ""}
                  </div>
                  <div>
                    <b>Due Date:</b>{" "}
                    {isEditingItems ? (
                      <input
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                        style={{ padding: "0.2em 0.5em", fontSize: "1em" }}
                      />
                    ) : (
                      modalPayment.dueDate
                    )}
                  </div>
                  <div>
                    <b>Status:</b>{" "}
                    {isEditingItems ? (
                      <select
                        value={modalPayment.status}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          try {
                            const invoiceRef = doc(
                              db,
                              "invoices",
                              modalPayment.id
                            );
                            await updateDoc(invoiceRef, { status: newStatus });
                            setModalPayment((prev) => ({
                              ...prev,
                              status: newStatus,
                            }));
                            setPayments((prev) =>
                              prev.map((inv) =>
                                inv.id === modalPayment.id
                                  ? { ...inv, status: newStatus }
                                  : inv
                              )
                            );
                          } catch {
                            alert("Failed to update status.");
                          }
                        }}
                        style={{ padding: "0.2em 0.5em", fontSize: "1em" }}
                      >
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                      </select>
                    ) : (
                      <StatusBadge
                        status={modalPayment.status}
                        isOverdue={isOverdue(modalPayment)}
                      />
                    )}
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
              <div style={{ marginBottom: 2 }}>
                {isEditingItems ? (
                  <input
                    type="text"
                    value={modalPayment.parentName}
                    onChange={(e) => {
                      setModalPayment((prev) => ({
                        ...prev,
                        parentName: e.target.value,
                      }));
                      setPayments((prev) =>
                        prev.map((inv) =>
                          inv.id === modalPayment.id
                            ? { ...inv, parentName: e.target.value }
                            : inv
                        )
                      );
                    }}
                    style={{
                      width: "100%",
                      padding: "0.3rem",
                      marginBottom: 4,
                      background: "#f5f5f5",
                      border: "1px solid #ccc",
                      borderRadius: 4,
                    }}
                    placeholder="Parent's full name"
                  />
                ) : (
                  modalPayment.parentName
                )}
              </div>
              <div style={{ marginBottom: 2 }}>
                {isEditingItems ? (
                  <input
                    type="email"
                    value={modalPayment.paymentEmail || ""}
                    onChange={(e) => {
                      setModalPayment((prev) => ({
                        ...prev,
                        paymentEmail: e.target.value,
                      }));
                      setPayments((prev) =>
                        prev.map((inv) =>
                          inv.id === modalPayment.id
                            ? { ...inv, paymentEmail: e.target.value }
                            : inv
                        )
                      );
                    }}
                    style={{
                      width: "100%",
                      padding: "0.3rem",
                      marginBottom: 4,
                      background: "#f5f5f5",
                      border: "1px solid #ccc",
                      borderRadius: 4,
                    }}
                    placeholder="Parent's email"
                  />
                ) : (
                  modalPayment.paymentEmail
                )}
              </div>
              <div style={{ marginTop: 8 }}>
                <span style={{ fontWeight: 600 }}>Parent UID: </span>
                {isEditingItems ? (
                  <input
                    type="text"
                    value={modalPayment.userUID || ""}
                    onChange={(e) => {
                      setModalPayment((prev) => ({
                        ...prev,
                        userUID: e.target.value,
                      }));
                      setPayments((prev) =>
                        prev.map((inv) =>
                          inv.id === modalPayment.id
                            ? { ...inv, userUID: e.target.value }
                            : inv
                        )
                      );
                    }}
                    style={{
                      width: "100%",
                      padding: "0.3rem",
                      marginBottom: 4,
                      background: "#f5f5f5",
                      border: "1px solid #ccc",
                      borderRadius: 4,
                    }}
                    placeholder="Parent's UID"
                  />
                ) : (
                  <span style={{ color: "#555" }}>
                    {modalPayment.userUID || (
                      <span style={{ color: "#bbb" }}>N/A</span>
                    )}
                  </span>
                )}
              </div>
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
                    <th style={{ textAlign: "center" }}>Charge</th>
                    <th style={{ textAlign: "center" }}>Description</th>
                    <th style={{ textAlign: "center" }}>Unit Price</th>
                    <th style={{ textAlign: "center" }}>Quantity</th>
                    <th style={{ textAlign: "center" }}>Subtotal</th>
                    <th style={{ textAlign: "center" }}></th>
                  </tr>
                </thead>
                <tbody>
                  {editItems.map((item, idx) => {
                    const amount = Number(item.amount ?? 0);
                    const quantity = Number(item.quantity ?? 0);
                    const itemTotal = amount * quantity;
                    return (
                      <tr key={idx}>
                        <td style={{ textAlign: "center" }}>
                          {isEditingItems ? (
                            <input
                              value={item.description}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "description",
                                  e.target.value
                                )
                              }
                              style={{ width: "120px" }}
                            />
                          ) : (
                            item.description
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {isEditingItems ? (
                            <input
                              value={item.notes || ""}
                              onChange={(e) =>
                                handleItemChange(idx, "notes", e.target.value)
                              }
                              style={{ width: "180px" }}
                            />
                          ) : (
                            item.notes
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {isEditingItems ? (
                            <input
                              type="number"
                              min="0"
                              value={amount}
                              onChange={(e) =>
                                handleItemChange(idx, "amount", e.target.value)
                              }
                              style={{ width: "80px" }}
                            />
                          ) : (
                            `$${amount.toFixed(2)}`
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {isEditingItems ? (
                            <input
                              type="number"
                              min="1"
                              value={quantity}
                              onChange={(e) =>
                                handleItemChange(
                                  idx,
                                  "quantity",
                                  e.target.value
                                )
                              }
                              style={{ width: "60px" }}
                            />
                          ) : (
                            quantity
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          ${itemTotal.toFixed(2)}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {isEditingItems && (
                            <button
                              style={{ color: "red" }}
                              onClick={() => handleRemoveItem(idx)}
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {isEditingItems && (
                <button onClick={handleAddItem} style={{ marginTop: 12 }}>
                  Add Item
                </button>
              )}
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
                      ${total.toFixed(2)}
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
                <a href="mailto:info@tinylog.com">info@tinylog.com</a> or{" "}
                <a href="tel:+15551234567">(555) 123-4567</a>.
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
              <div style={{ marginTop: 8 }}>
                {isEditingItems ? (
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      fontSize: "1em",
                    }}
                    placeholder="Enter any additional notes for this invoice..."
                  />
                ) : (
                  <div style={{ whiteSpace: "pre-wrap", color: "#444" }}>
                    {modalPayment.additionalNotes || editNotes || (
                      <span style={{ color: "#bbb" }}>
                        No additional notes.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "1rem",
                marginTop: "2rem",
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
                onClick={handleCloseModal}
              >
                Close
              </button>
              {!isEditingItems ? (
                <button
                  className="no-print"
                  style={{
                    padding: "0.7rem 1.5rem",
                    fontSize: "1em",
                    fontWeight: 600,
                    color: "#fff",
                    backgroundColor: "#ffc107",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "background-color 0.3s",
                  }}
                  onClick={() => setIsEditingItems(true)}
                >
                  Edit
                </button>
              ) : (
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
                    handleSaveItems();
                    setIsEditingItems(false);
                  }}
                >
                  Save
                </button>
              )}
              {isEditingItems && (
                <button
                  className="no-print"
                  style={{
                    padding: "0.7rem 1.5rem",
                    fontSize: "1em",
                    fontWeight: 600,
                    color: "#fff",
                    backgroundColor: "#f44336",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    transition: "background-color 0.3s",
                  }}
                  onClick={() => setShowDeleteInvoiceConfirm(true)}
                >
                  Delete Invoice
                </button>
              )}
              <button
                className="no-print"
                style={{
                  padding: "0.7rem 1.5rem",
                  fontSize: "1em",
                  fontWeight: 600,
                  color: "#fff",
                  backgroundColor: "#17a2b8",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "background-color 0.3s",
                }}
                onClick={() => {
                  const printContents = document.getElementById(
                    "admin-invoice-modal-content"
                  ).innerHTML;
                  const printWindow = window.open(
                    "",
                    "",
                    "height=800,width=800"
                  );
                  printWindow.document.write(`
                    <html>
                      <head>
                        <title>Invoice</title>
                        <style>
                          @media print {
                            .no-print { display: none !important; }
                            body { font-family: Arial, sans-serif; margin: 2rem; }
                            table { border-collapse: collapse; width: 100%; }
                            th, td { border: 1px solid #ccc; padding: 8px; text-align: center; }
                            th { background: #f5f5f5; }
                          }
                        </style>
                      </head>
                      <body>
                        ${printContents}
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
      {showDeleteConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "2rem 2.5rem",
              borderRadius: 8,
              boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
              minWidth: 320,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: 18,
                marginBottom: 16,
              }}
            >
              Are you sure you want to delete this item?
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 16,
              }}
            >
              <button
                style={{
                  background: "#f44336",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "0.5rem 1.5rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={confirmRemoveItem}
              >
                Delete
              </button>
              <button
                style={{
                  background: "#eee",
                  color: "#333",
                  border: "none",
                  borderRadius: 4,
                  padding: "0.5rem 1.5rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={cancelRemoveItem}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeleteInvoiceConfirm && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "2rem 2.5rem",
              borderRadius: 8,
              boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
              minWidth: 320,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: 18,
                marginBottom: 16,
              }}
            >
              Are you sure you want to delete this invoice?
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 16,
              }}
            >
              <button
                style={{
                  background: "#f44336",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "0.5rem 1.5rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={handleDeleteInvoice}
              >
                Delete
              </button>
              <button
                style={{
                  background: "#eee",
                  color: "#333",
                  border: "none",
                  borderRadius: 4,
                  padding: "0.5rem 1.5rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => setShowDeleteInvoiceConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showSavedNotice && (
        <div
          style={{
            position: "fixed",
            top: 24,
            left: "50%",
            transform: "translateX(-50%)",
            background: "#28a745",
            color: "#fff",
            padding: "0.75rem 2rem",
            borderRadius: 6,
            fontWeight: 600,
            fontSize: 16,
            zIndex: 3000,
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          }}
        >
          {isEditingItems === false && modalPayment
            ? "Invoice updated!"
            : "Invoice created!"}
        </div>
      )}
      {showNewInvoiceModal && (
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
            zIndex: 2000,
          }}
          onClick={handleCloseNewInvoiceModal}
        >
          <div
            style={{
              background: "#fff",
              padding: "2rem 2.5rem",
              borderRadius: 8,
              minWidth: 400,
              maxWidth: "90vw",
              maxHeight: "90vh", // Limit modal height
              overflowY: "auto", // Enable vertical scrolling
              boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: 16 }}>Create New Invoice</h2>
            {validationErrors.length > 0 && (
              <div
                style={{
                  background: "#fee",
                  border: "1px solid #fcc",
                  borderRadius: 4,
                  padding: "0.75rem",
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    color: "#c33",
                    marginBottom: 4,
                  }}
                >
                  Please fix the following errors:
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: "1.2rem",
                    color: "#c33",
                  }}
                >
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <label>
                Parent UID:
                <br />
                <input
                  type="text"
                  value={newInvoice.userUID || ""}
                  onChange={handleParentUidChange}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    background: "#f5f5f5",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    marginTop: 4,
                  }}
                  placeholder="Paste the parent's UID here"
                />
                {uidWarning && (
                  <div
                    style={{
                      color: "red",
                      marginTop: 4,
                      fontWeight: 500,
                    }}
                  >
                    {uidWarning}
                  </div>
                )}
              </label>
              {uidLoading && (
                <div
                  style={{
                    color: "#888",
                    marginTop: 4,
                    fontWeight: 500,
                  }}
                >
                  Looking up parent info...
                </div>
              )}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>
                Parent Name:
                <br />
                <input
                  type="text"
                  value={newInvoice.parentName}
                  onChange={(e) =>
                    setNewInvoice({ ...newInvoice, parentName: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    background: "#f5f5f5",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    marginTop: 4,
                  }}
                  placeholder="Enter parent's full name"
                  disabled={!!newInvoice.userUID && !uidWarning}
                />
              </label>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>
                Parent Email:
                <br />
                <input
                  type="email"
                  value={newInvoice.paymentEmail}
                  onChange={(e) =>
                    setNewInvoice({
                      ...newInvoice,
                      paymentEmail: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    background: "#f5f5f5",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    marginTop: 4,
                  }}
                  placeholder="Enter parent's email address"
                  disabled={!!newInvoice.userUID && !uidWarning}
                />
              </label>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>
                Due Date:
                <br />
                <input
                  type="date"
                  value={newInvoice.dueDate}
                  onChange={(e) =>
                    setNewInvoice({ ...newInvoice, dueDate: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    background: "#f5f5f5",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    marginTop: 4,
                  }}
                />
              </label>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>
                <span
                  style={{
                    fontWeight: 700,
                    display: "inline-block",
                    marginBottom: 4,
                  }}
                >
                  Charges:
                </span>
                {/* Table-like layout for charge fields */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 2fr 80px 60px 32px",
                    gap: 8,
                    fontWeight: 600,
                    color: "#555",
                    fontSize: "0.95em",
                    marginBottom: 4,
                    alignItems: "center",
                  }}
                >
                  <div>Charge</div>
                  <div>Description</div>
                  <div style={{ textAlign: "left", paddingLeft: 2 }}>
                    Unit Price
                  </div>
                  <div style={{ textAlign: "left", paddingLeft: 2 }}>
                    Quantity
                  </div>
                  <div></div>
                </div>
                {newInvoice.items.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2fr 2fr 80px 60px 32px",
                      gap: 8,
                      marginBottom: 4,
                      alignItems: "center",
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Charge"
                      value={item.description}
                      onChange={(e) => {
                        const items = [...newInvoice.items];
                        items[idx].description = e.target.value;
                        setNewInvoice({ ...newInvoice, items });
                      }}
                      style={{
                        width: "100%",
                        padding: "0.3rem",
                        background: "#f5f5f5",
                        border: "1px solid #ccc",
                        borderRadius: 4,
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.notes}
                      onChange={(e) => {
                        const items = [...newInvoice.items];
                        items[idx].notes = e.target.value;
                        setNewInvoice({ ...newInvoice, items });
                      }}
                      style={{
                        width: "100%",
                        padding: "0.3rem",
                        background: "#f5f5f5",
                        border: "1px solid #ccc",
                        borderRadius: 4,
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Amount"
                      value={item.amount}
                      min={0}
                      onChange={(e) => {
                        const items = [...newInvoice.items];
                        items[idx].amount = Number(e.target.value);
                        setNewInvoice({ ...newInvoice, items });
                      }}
                      style={{
                        width: "100%",
                        padding: "0.3rem",
                        background: "#f5f5f5",
                        border: "1px solid #ccc",
                        borderRadius: 4,
                        textAlign: "center",
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Quantity"
                      value={item.quantity}
                      min={1}
                      onChange={(e) => {
                        const items = [...newInvoice.items];
                        items[idx].quantity = Number(e.target.value);
                        setNewInvoice({ ...newInvoice, items });
                      }}
                      style={{
                        width: "100%",
                        padding: "0.3rem",
                        background: "#f5f5f5",
                        border: "1px solid #ccc",
                        borderRadius: 4,
                        textAlign: "center",
                      }}
                    />
                    <button
                      style={{
                        color: "red",
                        border: "none",
                        background: "none",
                        cursor: "pointer",
                        fontSize: "1.2em",
                      }}
                      onClick={() => {
                        setNewInvoice({
                          ...newInvoice,
                          items: newInvoice.items.filter((_, i) => i !== idx),
                        });
                      }}
                      disabled={newInvoice.items.length === 1}
                      title="Remove item"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  style={{
                    marginTop: 4,
                    background: "#eee",
                    border: "none",
                    borderRadius: 4,
                    padding: "0.3rem 1rem",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                  onClick={() =>
                    setNewInvoice({
                      ...newInvoice,
                      items: [
                        ...newInvoice.items,
                        { description: "", notes: "", amount: 0, quantity: 1 },
                      ],
                    })
                  }
                >
                  + Add Charge
                </button>
              </label>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>
                Additional Notes:
                <br />
                <textarea
                  value={newInvoice.additionalNotes}
                  onChange={(e) =>
                    setNewInvoice({
                      ...newInvoice,
                      additionalNotes: e.target.value,
                    })
                  }
                  rows={2}
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    background: "#f5f5f5",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    marginTop: 4,
                  }}
                  placeholder="Enter any additional notes for this invoice..."
                />
              </label>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label>
                Status:
                <br />
                <input
                  type="text"
                  value="unpaid"
                  readOnly
                  style={{
                    width: "100%",
                    padding: "0.5rem",
                    background: "#f5f5f5",
                    border: "1px solid #ccc",
                    borderRadius: 4,
                    marginTop: 4,
                    color: "#ff9800",
                    fontWeight: 600,
                    letterSpacing: 1,
                  }}
                />
              </label>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 12,
                marginTop: "auto", // Push buttons to bottom
                paddingTop: "1rem", // Add some spacing
              }}
            >
              <button
                style={{
                  background: "#eee",
                  color: "#333",
                  border: "none",
                  borderRadius: 4,
                  padding: "0.5rem 1.5rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={handleCloseNewInvoiceModal}
              >
                Cancel
              </button>
              <button
                style={{
                  background: "#28a745",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "0.5rem 1.5rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                disabled={creating}
                onClick={handleCreateInvoice}
              >
                Create Invoice
              </button>
            </div>
          </div>
        </div>
      )}
      {showDiscardConfirm && (
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
            zIndex: 3500,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "2rem 2.5rem",
              borderRadius: 8,
              boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
              minWidth: 320,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: 18,
                marginBottom: 16,
              }}
            >
              Discard changes?
            </div>
            <div style={{ marginBottom: 16, color: "#666" }}>
              You have unsaved changes. Are you sure you want to close without
              saving?
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 16,
              }}
            >
              <button
                style={{
                  background: "#f44336",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "0.5rem 1.5rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => {
                  setShowDiscardConfirm(false);
                  setShowNewInvoiceModal(false);
                  setNewInvoice({
                    parentName: "",
                    paymentEmail: "",
                    dueDate: "",
                    items: [
                      { description: "", notes: "", amount: 0, quantity: 1 },
                    ],
                    additionalNotes: "",
                  });
                  setValidationErrors([]);
                }}
              >
                Discard
              </button>
              <button
                style={{
                  background: "#007bff",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "0.5rem 1.5rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => setShowDiscardConfirm(false)}
              >
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}
      {showDiscardInvoiceConfirm && (
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
            zIndex: 4000,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: "2rem 2.5rem",
              borderRadius: 8,
              boxShadow: "0 2px 16px rgba(0,0,0,0.2)",
              minWidth: 320,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: 18,
                marginBottom: 16,
              }}
            >
              Discard changes?
            </div>
            <div style={{ marginBottom: 16, color: "#666" }}>
              You have unsaved changes to this invoice. Are you sure you want to
              close without saving?
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 16,
              }}
            >
              <button
                style={{
                  background: "#f44336",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "0.5rem 1.5rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => {
                  setShowDiscardInvoiceConfirm(false);
                  setModalPayment(null);
                  setShowSavedNotice(false);
                  setIsEditingItems(false);
                }}
              >
                Discard
              </button>
              <button
                style={{
                  background: "#007bff",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "0.5rem 1.5rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
                onClick={() => setShowDiscardInvoiceConfirm(false)}
              >
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
