// components/admin/ChildDetailsModal.js
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase/config';

const ChildDetailsModal = ({ child, onClose, onAddSibling }) => {
  const [childData, setChildData] = useState(child);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [siblings, setSiblings] = useState([]);
  const [loadingSiblings, setLoadingSiblings] = useState(false);

  // Fetch siblings when component mounts
  useEffect(() => {
    if (childData.parentId) {
      fetchSiblings();
    }
  }, [childData.parentId]);

  // Fetch siblings from the same parent
  const fetchSiblings = async () => {
    if (!childData.parentId) return;
    
    try {
      setLoadingSiblings(true);
      const siblingsQuery = query(
        collection(db, 'children'),
        where('parentId', '==', childData.parentId)
      );
      
      const siblingsSnapshot = await getDocs(siblingsQuery);
      const siblingsData = [];
      
      siblingsSnapshot.forEach(doc => {
        const siblingData = doc.data();
        if (doc.id !== childData.id) { // Exclude current child
          siblingsData.push({ id: doc.id, ...siblingData });
        }
      });
      
      setSiblings(siblingsData);
    } catch (error) {
      console.error('Error fetching siblings:', error);
    } finally {
      setLoadingSiblings(false);
    }
  };

  // Update child data
  const handleUpdateChild = async (updatedData) => {
    try {
      setLoading(true);
      setError('');
      
      await updateDoc(doc(db, 'children', child.id), {
        ...updatedData,
        updatedAt: new Date().toISOString()
      });
      
      setChildData({ ...childData, ...updatedData });
      setEditing(false);
    } catch (error) {
      console.error('Error updating child:', error);
      setError('Failed to update child information');
    } finally {
      setLoading(false);
    }
  };

  // Calculate age
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 1) {
      const ageMonths = (today.getMonth() + 12 - birthDate.getMonth()) % 12;
      return `${ageMonths} month${ageMonths !== 1 ? 's' : ''}`;
    }
    
    return `${age} year${age !== 1 ? 's' : ''}`;
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-6xl w-11/12 max-h-[90vh] overflow-y-auto bg-gradient-to-br from-base-100 to-base-200">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-base-300">
          <div className="flex items-center gap-4">
            <div className="text-6xl">
              {childData.gender === 'Female' ? '👧' : childData.gender === 'Male' ? '👦' : '🧒'}
            </div>
            <div>
              <h2 className="text-3xl font-bold text-primary">{childData.firstName} {childData.lastName}</h2>
              <p className="text-lg text-base-content/70">Child Profile</p>
            </div>
          </div>
          <div className="flex gap-2">
            {!editing ? (
              <>
                {childData.parentRegistered && onAddSibling && (
                  <button 
                    className="btn btn-secondary btn-lg gap-2" 
                    onClick={() => onAddSibling(childData)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Sibling
                  </button>
                )}
                <button className="btn btn-primary btn-lg gap-2" onClick={() => setEditing(true)}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit Information
                </button>
              </>
            ) : (
              <div className="flex gap-3">
                <button className="btn btn-success btn-lg gap-2" onClick={() => handleUpdateChild(childData)} disabled={loading}>
                  {loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
                <button className="btn btn-outline btn-lg" onClick={() => {
                  setChildData(child);
                  setEditing(false);
                }}>
                  Cancel
                </button>
              </div>
            )}
            <button className="btn btn-circle btn-ghost btn-lg hover:btn-error" onClick={onClose}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error mb-6 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Quick Info Card */}
        <div className="card bg-gradient-to-r from-primary/10 to-secondary/10 shadow-xl border border-primary/20 mb-6">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="avatar placeholder">
                  <div className="bg-primary text-primary-content rounded-full w-20 h-20 text-4xl">
                    {childData.gender === 'Female' ? '👧' : childData.gender === 'Male' ? '👦' : '🧒'}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-primary">{childData.firstName} {childData.lastName}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="badge badge-lg badge-primary">{calculateAge(childData.dateOfBirth)}</div>
                    <div className="badge badge-lg badge-secondary">{childData.group}</div>
                    <div className="badge badge-lg badge-outline">
                      Born: {childData.dateOfBirth ? new Date(childData.dateOfBirth).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Siblings Section */}
        {childData.parentRegistered && (
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow mb-6">
            <div className="card-body">
              <h4 className="card-title text-xl text-primary flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Siblings
              </h4>
              
              {loadingSiblings ? (
                <div className="flex justify-center items-center py-4">
                  <span className="loading loading-spinner loading-md"></span>
                </div>
              ) : siblings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {siblings.map(sibling => (
                    <div key={sibling.id} className="card bg-base-200 shadow-md">
                      <div className="card-body p-4">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">
                            {sibling.gender === 'Female' ? '👧' : sibling.gender === 'Male' ? '👦' : '🧒'}
                          </div>
                          <div>
                            <h5 className="font-semibold">{sibling.firstName} {sibling.lastName}</h5>
                            <p className="text-sm opacity-75">Age: {calculateAge(sibling.dateOfBirth)}</p>
                            <div className="badge badge-outline badge-sm">{sibling.group}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-base-content/70">No siblings found</p>
                  {onAddSibling && (
                    <button 
                      className="btn btn-secondary btn-sm mt-2"
                      onClick={() => onAddSibling(childData)}
                    >
                      Add First Sibling
                    </button>
                  )}
                </div>
              )}
              
              {onAddSibling && siblings.length > 0 && (
                <div className="flex justify-center mt-4">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => onAddSibling(childData)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Another Sibling
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Child Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="card-body">
              <h4 className="card-title text-xl text-primary flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Basic Information
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Full Name:</span>
                  <span>{childData.firstName} {childData.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Date of Birth:</span>
                  <span>{childData.dateOfBirth ? new Date(childData.dateOfBirth).toLocaleDateString() : 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Gender:</span>
                  <span>{childData.gender || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Age:</span>
                  <span>{calculateAge(childData.dateOfBirth)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Group:</span>
                  <span className="badge badge-outline">{childData.group}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Parent Information */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="card-body">
              <h4 className="card-title text-xl text-primary flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Parent Information
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Parent Name:</span>
                  <span>{childData.parentFirstName} {childData.parentLastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Email:</span>
                  <span>{childData.parentEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Phone:</span>
                  <span>{childData.parentPhone || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Registration Status:</span>
                  <span className={`badge ${childData.parentRegistered ? 'badge-success' : 'badge-warning'}`}>
                    {childData.parentRegistered ? 'Registered' : 'Awaiting Registration'}
                  </span>
                </div>
                {!childData.parentRegistered && (
                  <div className="flex justify-between">
                    <span className="font-medium">Access Code:</span>
                    <span className="font-mono">{childData.accessCode}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="card-body">
              <h4 className="card-title text-xl text-primary flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Medical Information
              </h4>
              <div className="space-y-3">
                <div>
                  <span className="font-medium">Allergies:</span>
                  <div className="mt-1">
                    {childData.allergies && childData.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {childData.allergies.map((allergy, index) => (
                          <span key={index} className="badge badge-error badge-sm">{allergy}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-base-content/70">None specified</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Medical Conditions:</span>
                  <div className="mt-1">
                    {childData.medicalConditions && childData.medicalConditions.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {childData.medicalConditions.map((condition, index) => (
                          <span key={index} className="badge badge-warning badge-sm">{condition}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-base-content/70">None specified</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Medications:</span>
                  <div className="mt-1">
                    {childData.medications && childData.medications.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {childData.medications.map((medication, index) => (
                          <span key={index} className="badge badge-info badge-sm">{medication}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-base-content/70">None specified</span>
                    )}
                  </div>
                </div>
                {childData.dietaryRestrictions && (
                  <div>
                    <span className="font-medium">Dietary Restrictions:</span>
                    <p className="mt-1">{childData.dietaryRestrictions}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="card-body">
              <h4 className="card-title text-xl text-primary flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Emergency Contact
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Name:</span>
                  <span>{childData.emergencyContact || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Phone:</span>
                  <span>{childData.emergencyPhone || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Relationship:</span>
                  <span>{childData.emergencyRelationship || 'Not specified'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Designated Pickup Person */}
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
            <div className="card-body">
              <h4 className="card-title text-xl text-primary flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Designated Pickup Person
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium">Name:</span>
                  <span>{childData.pickupPersonName || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Phone:</span>
                  <span>{childData.pickupPersonPhone || 'Not provided'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Relationship:</span>
                  <span>{childData.pickupPersonRelationship || 'Not specified'}</span>
                </div>
                {(childData.pickupPersonName || childData.pickupPersonPhone || childData.pickupPersonRelationship) && (
                  <div className="alert alert-info">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm">This person is authorized to pick up {childData.firstName}. Verify ID before release.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Notes */}
        {(childData.specialNeeds || childData.notes) && (
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow mt-6">
            <div className="card-body">
              <h4 className="card-title text-xl text-primary flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Additional Information
              </h4>
              <div className="space-y-3">
                {childData.specialNeeds && (
                  <div>
                    <span className="font-medium">Special Needs:</span>
                    <p className="mt-1">{childData.specialNeeds}</p>
                  </div>
                )}
                {childData.notes && (
                  <div>
                    <span className="font-medium">Notes:</span>
                    <p className="mt-1">{childData.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChildDetailsModal;