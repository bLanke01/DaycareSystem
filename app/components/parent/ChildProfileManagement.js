'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../firebase/auth-context';
import ParentChildDetailsModal from './ParentChildDetailsModal';

export default function ChildProfileManagement() {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingChild, setEditingChild] = useState(null);

  // Load children for the current parent
  useEffect(() => {
    if (!user?.uid) return;

    const childrenQuery = query(
      collection(db, 'children'),
      where('parentId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(
      childrenQuery,
      (snapshot) => {
        try {
          const childrenData = [];
          snapshot.forEach(doc => {
            const data = doc.data();
            // Ensure all required fields exist with safe defaults and convert to strings
            childrenData.push({ 
              id: doc.id, 
              firstName: data.firstName || 'Unknown',
              lastName: data.lastName || 'Unknown',
              dateOfBirth: data.dateOfBirth || null,
              gender: data.gender || 'Not specified',
              group: data.group || 'Not assigned',
              allergies: String(data.allergies || ''),
              medicalConditions: String(data.medicalConditions || ''),
              medications: String(data.medications || ''),
              emergencyContact: String(data.emergencyContact || ''),
              emergencyPhone: String(data.emergencyPhone || ''),
              emergencyRelationship: String(data.emergencyRelationship || ''),
              dietaryRestrictions: String(data.dietaryRestrictions || ''),
              notes: String(data.notes || ''),
              parentRegistered: data.parentRegistered || false,
              ...data
            });
          });
          setChildren(childrenData);
          setLoading(false);
        } catch (err) {
          console.error('Error processing children data:', err);
          setError('Error processing children data');
          setLoading(false);
        }
      },
      (error) => {
        console.error('Error fetching children:', error);
        setError('Failed to load children');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const handleViewChild = (child) => {
    if (!child || !child.id) {
      setError('Invalid child data');
      return;
    }
    setSelectedChild(child);
    setShowModal(true);
  };

  const handleEditChild = (child) => {
    if (!child || !child.id) {
      setError('Invalid child data');
      return;
    }
    setEditingChild({ ...child });
  };

  const handleSaveChildEdit = async () => {
    if (!editingChild || !editingChild.id) {
      setError('Invalid child data for editing');
      return;
    }

    try {
      const childRef = doc(db, 'children', editingChild.id);
      await updateDoc(childRef, {
        allergies: editingChild.allergies || '',
        medicalConditions: editingChild.medicalConditions || '',
        medications: editingChild.medications || '',
        emergencyContact: editingChild.emergencyContact || '',
        emergencyPhone: editingChild.emergencyPhone || '',
        emergencyRelationship: editingChild.emergencyRelationship || '',
        dietaryRestrictions: editingChild.dietaryRestrictions || '',
        notes: editingChild.notes || '',
        updatedAt: new Date()
      });
      setEditingChild(null);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Error updating child:', error);
      setError('Failed to update child information');
    }
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'Unknown';
    
    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      
      // Check if the date is valid
      if (isNaN(birthDate.getTime())) {
        return 'Invalid date';
      }
      
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1;
      }
      return age;
    } catch (error) {
      console.error('Error calculating age:', error);
      return 'Error';
    }
  };

  const getChildStatus = (child) => {
    if (!child) return 'Unknown';
    
    if (child.parentRegistered) {
      return { text: '✓ Registered', color: 'badge-success' };
    } else {
      return { text: '⏳ Pending Registration', color: 'badge-warning' };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error shadow-lg">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{error}</span>
        <button className="btn btn-sm" onClick={() => setError('')}>Dismiss</button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary">My Children</h1>
          <p className="text-base-content/70 mt-2">Manage your children's information and profiles</p>
        </div>
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total Children</div>
            <div className="stat-value text-primary">{children.length}</div>
          </div>
        </div>
      </div>

      {children.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👶</div>
          <h3 className="text-xl font-semibold mb-2">No Children Found</h3>
          <p className="text-gray-600 mb-4">
            Contact your daycare administrator to add your children to the system.
          </p>
          <div className="alert alert-info max-w-md mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Once children are added, you'll be able to view and manage their information here.</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => {
            const status = getChildStatus(child);
            return (
              <div key={child.id} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 border-l-4 border-l-primary">
                <div className="card-body">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="card-title text-xl text-primary">
                      {child.firstName} {child.lastName}
                    </h2>
                    <span className={`badge ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👶</span>
                      <span><strong>Age:</strong> {calculateAge(child.dateOfBirth)} years old</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-lg">👥</span>
                      <span><strong>Group:</strong> {child.group}</span>
                    </div>
                    
                    {child.allergies && typeof child.allergies === 'string' && child.allergies.trim() && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">⚠️</span>
                        <span><strong>Allergies:</strong> {child.allergies}</span>
                      </div>
                    )}
                    
                    {child.medicalConditions && typeof child.medicalConditions === 'string' && child.medicalConditions.trim() && (
                      <div className="flex items-center gap-2">
                        <span className="text-lg">💊</span>
                        <span><strong>Medical:</strong> {child.medicalConditions}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="card-actions justify-end mt-4">
                    <button
                      className="btn btn-primary btn-sm gap-2"
                      onClick={() => handleViewChild(child)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </button>
                    <button
                      className="btn btn-secondary btn-sm gap-2"
                      onClick={() => handleEditChild(child)}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Info
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Child Modal */}
      {editingChild && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-2xl">
            <h3 className="font-bold text-lg mb-4 text-primary">
              Edit {editingChild.firstName}'s Information
            </h3>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Allergies</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  placeholder="List any allergies..."
                  value={editingChild.allergies || ''}
                  onChange={(e) => setEditingChild({
                    ...editingChild,
                    allergies: e.target.value
                  })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Medical Conditions</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  placeholder="List any medical conditions..."
                  value={editingChild.medicalConditions || ''}
                  onChange={(e) => setEditingChild({
                    ...editingChild,
                    medicalConditions: e.target.value
                  })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Medications</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  placeholder="List any medications..."
                  value={editingChild.medications || ''}
                  onChange={(e) => setEditingChild({
                    ...editingChild,
                    medications: e.target.value
                  })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Emergency Contact Name</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="Emergency contact name..."
                  value={editingChild.emergencyContact || ''}
                  onChange={(e) => setEditingChild({
                    ...editingChild,
                    emergencyContact: e.target.value
                  })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Emergency Contact Phone</span>
                </label>
                <input
                  type="tel"
                  className="input input-bordered"
                  placeholder="Emergency contact phone..."
                  value={editingChild.emergencyPhone || ''}
                  onChange={(e) => setEditingChild({
                    ...editingChild,
                    emergencyPhone: e.target.value
                  })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Emergency Contact Relationship</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  placeholder="Relationship to child..."
                  value={editingChild.emergencyRelationship || ''}
                  onChange={(e) => setEditingChild({
                    ...editingChild,
                    emergencyRelationship: e.target.value
                  })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Dietary Restrictions</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  placeholder="Any dietary restrictions..."
                  value={editingChild.dietaryRestrictions || ''}
                  onChange={(e) => setEditingChild({
                    ...editingChild,
                    dietaryRestrictions: e.target.value
                  })}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-semibold">Additional Notes</span>
                </label>
                <textarea
                  className="textarea textarea-bordered"
                  placeholder="Any additional notes..."
                  value={editingChild.notes || ''}
                  onChange={(e) => setEditingChild({
                    ...editingChild,
                    notes: e.target.value
                  })}
                />
              </div>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-primary"
                onClick={handleSaveChildEdit}
              >
                Save Changes
              </button>
              <button
                className="btn"
                onClick={() => setEditingChild(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Child Details Modal */}
      {selectedChild && (
        <ParentChildDetailsModal
          child={selectedChild}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedChild(null);
          }}
        />
      )}
    </div>
  );
} 