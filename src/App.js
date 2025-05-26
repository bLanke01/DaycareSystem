 

//firebase try3
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Card, Row, Col } from "react-bootstrap";
import { db } from "./firebase-config";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import 'bootstrap/dist/css/bootstrap.min.css';




function App() {
  // Form states
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [parent1Name, setParent1Name] = useState('');
  const [parent2Name, setParent2Name] = useState('');
  const [email, setEmail] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [cellNumber, setCellNumber] = useState('');
  const [allergy, setAllergy] = useState('');
  const [img, setImg] = useState('');
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');

  // Data and modal/editing state
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editUserId, setEditUserId] = useState(null);

  const usersCollectionRef = collection(db, "users");

  // Fetch users
  const fetchUsers = async () => {
    const data = await getDocs(usersCollectionRef);
    setUsers(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Clear form fields
  const clearForm = () => {
    setName('');
    setAge('');
    setGender('');
    setParent1Name('');
    setParent2Name('');
    setEmail('');
    setEmergencyContact('');
    setCellNumber('');
    setAllergy('');
    setImg('');
    setAddress('');
    setIsEditing(false);
    setEditUserId(null);
  };

  // Open modal for add or edit
  const openModal = (user = null) => {
    if (user) {
      setIsEditing(true);
      setEditUserId(user.id);
      setName(user.name);
      setAge(user.age);
      setGender(user.gender);
      setParent1Name(user.parent1Name);
      setParent2Name(user.parent2Name);
      setEmail(user.email);
      setEmergencyContact(user.emergencyContact);
      setCellNumber(user.cellNumber);
      setAllergy(user.allergy);
      setImg(user.img);
      setAddress(user.address);
    } else {
      clearForm();
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    clearForm();
  };

  // Create or update user
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isEditing) {
      const userDoc = doc(db, "users", editUserId);
      await updateDoc(userDoc, {
        name,
        age: Number(age),
        gender,
        parent1Name,
        parent2Name,
        email,
        emergencyContact,
        cellNumber,
        allergy,
        img,
        address,
      });
    } else {
      await addDoc(usersCollectionRef, {
        name,
        age: Number(age),
        gender,
        parent1Name,
        parent2Name,
        email,
        emergencyContact,
        cellNumber,
        allergy,
        img,
        address,
      });
    }
    closeModal();
    fetchUsers();
  };

  // Delete user (optional, not shown in your screenshot)
  const handleDelete = async (id) => {
    const userDoc = doc(db, "users", id);
    await deleteDoc(userDoc);
    fetchUsers();
  };

  return (
    <div className="container py-4">
      <Row className="justify-content-center">
        {users.map(user => (
          <Col key={user.id} md={4} className="mb-4">
            <Card style={{ background: "#F5D7B4", borderRadius: "20px" }}>
              <Card.Body className="d-flex flex-column align-items-center">
                <img
                  src={user.img || "https://via.placeholder.com/100"}
                  alt={user.name}
                  style={{
                    width: 100,
                    height: 100,
                    objectFit: "cover",
                    borderRadius: "50%",
                    marginBottom: 12,
                  }}
                />
                <Card.Title style={{ fontWeight: 600 }}>{user.name}</Card.Title>
                <Card.Text style={{ color: "#555", fontWeight: 500 }}>
                  age: {user.age}
                </Card.Text>
                <Button
                  variant="secondary"
                  style={{ background: "#800080", border: "none" }}
                  onClick={() => openModal(user)}
                >
                  Edit
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
        <Col md={4} className="mb-4 d-flex align-items-center justify-content-center">
          <Button
            variant="link"
            style={{ fontSize: 22, color: "#000", textDecoration: "none" }}
            onClick={() => openModal()}
          >
            + Add Child
          </Button>
        </Col>
      </Row>

      {/* Modal for Add/Edit */}
      <Modal show={showModal} onHide={closeModal} centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{isEditing ? "Edit Child" : "Add Child"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control value={name} onChange={e => setName(e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Age</Form.Label>
              <Form.Control type="number" value={age} onChange={e => setAge(e.target.value)} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Gender</Form.Label>
              <Form.Control value={gender} onChange={e => setGender(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Parent 1 Name</Form.Label>
              <Form.Control value={parent1Name} onChange={e => setParent1Name(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Parent 2 Name</Form.Label>
              <Form.Control value={parent2Name} onChange={e => setParent2Name(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Emergency Contact</Form.Label>
              <Form.Control value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Cell Number</Form.Label>
              <Form.Control value={cellNumber} onChange={e => setCellNumber(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Address</Form.Label>
              <Form.Control value={address} onChange={e => setAddress(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Allergy</Form.Label>
              <Form.Control as="textarea" value={allergy} onChange={e => setAllergy(e.target.value)} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Image URL</Form.Label>
              <Form.Control value={img} onChange={e => setImg(e.target.value)} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {isEditing ? "Save" : "Add"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}

export default App;



