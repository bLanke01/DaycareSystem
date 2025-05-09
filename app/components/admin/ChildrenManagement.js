// components/admin/ChildrenManagement.js
'use client';

import { useState } from 'react';

const ChildrenManagement = () => {
  // Mock data for children
  const [children, setChildren] = useState([
    { id: 1, name: 'Emma Thompson', age: 4, group: 'Pre-K', parent: 'Sarah Thompson', contactPhone: '(555) 123-4567', allergies: 'None' },
    { id: 2, name: 'Noah Garcia', age: 3, group: 'Toddler', parent: 'Maria Garcia', contactPhone: '(555) 234-5678', allergies: 'Peanuts' },
    { id: 3, name: 'Olivia Martinez', age: 2, group: 'Toddler', parent: 'Juan Martinez', contactPhone: '(555) 345-6789', allergies: 'Dairy' },
    { id: 4, name: 'William Johnson', age: 5, group: 'Pre-K', parent: 'James Johnson', contactPhone: '(555) 456-7890', allergies: 'None' },
    { id: 5, name: 'Sophia Wilson', age: 1, group: 'Infant', parent: 'Emily Wilson', contactPhone: '(555) 567-8901', allergies: 'None' }
  ]);

  // State for modal and form
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('All');
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    group: 'Infant',
    parent: '',
    contactPhone: '',
    allergies: ''
  });

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const newChild = {
      id: children.length + 1,
      ...formData
    };
    setChildren([...children, newChild]);
    setShowModal(false);
    setFormData({
      name: '',
      age: '',
      group: 'Infant',
      parent: '',
      contactPhone: '',
      allergies: ''
    });
  };

  // Filter children based on search and group filter
  const filteredChildren = children.filter(child => {
    const matchesSearch = child.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          child.parent.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = filterGroup === 'All' || child.group === filterGroup;
    
    return matchesSearch && matchesGroup;
  });

  return (
    <div className="children-management">
      <div className="page-header">
        <h1>Manage Children</h1>
        <button 
          className="add-child-btn" 
          onClick={() => setShowModal(true)}
        >
          Add New Child
        </button>
      </div>
      
      <div className="filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by child or parent name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="group-filter">
          <label htmlFor="groupFilter">Filter by Group:</label>
          <select 
            id="groupFilter"
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
          >
            <option value="All">All Groups</option>
            <option value="Infant">Infant</option>
            <option value="Toddler">Toddler</option>
            <option value="Pre-K">Pre-K</option>
          </select>
        </div>
      </div>
      
      <div className="children-list">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Group</th>
              <th>Parent</th>
              <th>Contact</th>
              <th>Allergies</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredChildren.map(child => (
              <tr key={child.id}>
                <td>{child.name}</td>
                <td>{child.age}</td>
                <td>{child.group}</td>
                <td>{child.parent}</td>
                <td>{child.contactPhone}</td>
                <td>{child.allergies}</td>
                <td>
                  <button className="view-btn">View</button>
                  <button className="edit-btn">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Add Child Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Child</h2>
              <button 
                className="close-btn"
                onClick={() => setShowModal(false)}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Child's Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input
                  type="number"
                  id="age"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="0"
                  max="12"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="group">Group</label>
                <select
                  id="group"
                  name="group"
                  value={formData.group}
                  onChange={handleChange}
                  required
                >
                  <option value="Infant">Infant</option>
                  <option value="Toddler">Toddler</option>
                  <option value="Pre-K">Pre-K</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="parent">Parent's Name</label>
                <input
                  type="text"
                  id="parent"
                  name="parent"
                  value={formData.parent}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="contactPhone">Contact Phone</label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="allergies">Allergies</label>
                <input
                  type="text"
                  id="allergies"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  placeholder="If none, enter 'None'"
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" className="submit-btn">Add Child</button>
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChildrenManagement;