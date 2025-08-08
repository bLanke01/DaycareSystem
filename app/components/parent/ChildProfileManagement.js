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
        const childrenData = [];
        snapshot.forEach(doc => {
          childrenData.push({ id: doc.id, ...doc.data() });
        });
        setChildren(childrenData);
        setLoading(false);
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
    setSelectedChild(child);
    setShowModal(true);
  };

  const handleEditChild = (child) => {
    setEditingChild({ ...child });
  };

  const handleSaveChildEdit = async () => {
    if (!editingChild) return;

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
    } catch (error) {
      console.error('Error updating child:', error);
      setError('Failed to update child information');
    }
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'Unknown';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
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
      <div className="alert alert-error">
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Children</h1>
      </div>

      {children.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">👶</div>
          <h3 className="text-xl font-semibold mb-2">No Children Found</h3>
          <p className="text-gray-600">
            Contact your daycare administrator to add your children to the system.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {children.map((child) => (
            <div key={child.id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">
                  {child.firstName} {child.lastName}
                </h2>
                <div className="space-y-2">
                  <p><strong>Age:</strong> {calculateAge(child.dateOfBirth)} years old</p>
                  <p><strong>Group:</strong> {child.group || 'Not assigned'}</p>
                  {child.allergies && (
                    <p><strong>Allergies:</strong> {child.allergies}</p>
                  )}
                  {child.medicalConditions && (
                    <p><strong>Medical:</strong> {child.medicalConditions}</p>
                  )}
                </div>
                <div className="card-actions justify-end mt-4">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleViewChild(child)}
                  >
                    View Details
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleEditChild(child)}
                  >
                    Edit Info
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Child Modal */}
      {editingChild && (
        <div className="modal modal-open">
          <div className="modal-box w-11/12 max-w-2xl">
            <h3 className="font-bold text-lg mb-4">
              Edit {editingChild.firstName}'s Information
            </h3>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Allergies</span>
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
                  <span className="label-text">Medical Conditions</span>
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
                  <span className="label-text">Medications</span>
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
                  <span className="label-text">Emergency Contact Name</span>
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
                  <span className="label-text">Emergency Contact Phone</span>
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
                  <span className="label-text">Emergency Contact Relationship</span>
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
                  <span className="label-text">Dietary Restrictions</span>
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
                  <span className="label-text">Additional Notes</span>
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