'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../firebase/auth-context';
import DashboardPreferencesService from '../../services/DashboardPreferencesService';

const ParentChildDetailsModal = ({ child, onClose, isOpen }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState(null);

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.uid) return;
      
      try {
        const userPreferences = await DashboardPreferencesService.getUserPreferences(user.uid);
        setPreferences(userPreferences);
      } catch (error) {
        console.error('Error loading preferences:', error);
      }
    };

    loadPreferences();
  }, [user?.uid]);

  // Check if content should be shown based on preferences
  const shouldShowContent = (contentType) => {
    if (!preferences) return true; // Show everything if no preferences loaded yet
    return DashboardPreferencesService.shouldShowContent(preferences, contentType);
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

  const formatDate = (date) => {
    if (!date) return 'Unknown date';
    
    try {
      let dateObj;
      if (date.seconds) {
        dateObj = new Date(date.seconds * 1000);
      } else {
        dateObj = new Date(date);
      }
      return dateObj.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (!isOpen || !child) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {child.firstName} {child.lastName} - Complete Profile
          </h2>
          <button 
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Enhanced View Details Content */}
        <div className="space-y-6">
          {/* Child Overview Card */}
          <div className="card bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/20">
            <div className="card-body">
              <div className="flex items-center gap-6 mb-6">
                <div className="text-8xl">
                  {child.gender === 'Female' ? '👧' : '👦'}
                </div>
                <div className="flex-1">
                  <h3 className="text-3xl font-bold text-primary">
                    {child.firstName} {child.lastName}
                  </h3>
                  <p className="text-xl text-base-content/70 mb-2">
                    Age: {calculateAge(child.dateOfBirth)} • Group: {child.group || 'Not assigned'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="badge badge-primary badge-lg">Child ID: {child.id?.slice(-8)}</span>
                    {child.parentRegistered && (
                      <span className="badge badge-success badge-lg">✓ Parent Registered</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="stat bg-base-100 rounded-lg">
                  <div className="stat-title text-base-content/70">Date of Birth</div>
                  <div className="stat-value text-xl text-primary">
                    {child.dateOfBirth ? formatDate(child.dateOfBirth) : 'Not specified'}
                  </div>
                </div>
                <div className="stat bg-base-100 rounded-lg">
                  <div className="stat-title text-base-content/70">Gender</div>
                  <div className="stat-value text-xl text-secondary">
                    {child.gender || 'Not specified'}
                  </div>
                </div>
                <div className="stat bg-base-100 rounded-lg">
                  <div className="stat-title text-base-content/70">Age</div>
                  <div className="stat-value text-xl text-accent">
                    {calculateAge(child.dateOfBirth)} years old
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Health & Safety Information */}
          {shouldShowContent('attendanceStatus') && (
            <div className="card bg-base-100 shadow-xl border-l-4 border-l-accent">
              <div className="card-body">
                <h4 className="card-title text-xl text-accent mb-6 flex items-center gap-2">
                  🏥 Health & Safety Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-bold text-base-content mb-2 flex items-center gap-2">
                        <span className="text-red-500">⚠️</span> Allergies
                      </h5>
                      <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                        {child.allergies && typeof child.allergies === 'string' && child.allergies.trim() ? (
                          <p className="text-red-700">{child.allergies}</p>
                        ) : (
                          <p className="text-green-600 font-medium">✓ No allergies reported</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-bold text-base-content mb-2 flex items-center gap-2">
                        <span className="text-orange-500">💊</span> Medical Conditions
                      </h5>
                      <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                        {child.medicalConditions && typeof child.medicalConditions === 'string' && child.medicalConditions.trim() ? (
                          <p className="text-orange-700">{child.medicalConditions}</p>
                        ) : (
                          <p className="text-green-600 font-medium">✓ No medical conditions reported</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-bold text-base-content mb-2 flex items-center gap-2">
                        <span className="text-blue-500">💊</span> Current Medications
                      </h5>
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                        {child.medications && typeof child.medications === 'string' && child.medications.trim() ? (
                          <p className="text-blue-700">{child.medications}</p>
                        ) : (
                          <p className="text-green-600 font-medium">✓ No medications reported</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h5 className="font-bold text-base-content mb-2 flex items-center gap-2">
                        <span className="text-purple-500">🚨</span> Emergency Contact
                      </h5>
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <p className="font-medium">{child.emergencyContact || 'Not specified'}</p>
                        <p className="text-sm text-base-content/70 mt-1">
                          {child.emergencyRelationship ? `(${child.emergencyRelationship})` : ''}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-bold text-base-content mb-2 flex items-center gap-2">
                        <span className="text-purple-500">📞</span> Emergency Phone
                      </h5>
                      <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                        <p className="font-medium">{child.emergencyPhone || 'Not specified'}</p>
                      </div>
                    </div>

                    <div>
                      <h5 className="font-bold text-base-content mb-2 flex items-center gap-2">
                        <span className="text-indigo-500">👨‍⚕️</span> Doctor Information
                      </h5>
                      <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                        <p className="font-medium">{child.doctorName || 'Not specified'}</p>
                        {child.doctorPhone && (
                          <p className="text-sm text-base-content/70 mt-1">{child.doctorPhone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pickup & Transportation */}
          <div className="card bg-base-100 shadow-xl border-l-4 border-l-success">
            <div className="card-body">
              <h4 className="card-title text-xl text-success mb-6 flex items-center gap-2">
                🚗 Pickup & Transportation
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-bold text-base-content mb-2">Authorized Pickup Person</h5>
                  <div className="bg-success/10 p-3 rounded-lg border border-success/20">
                    <p className="font-medium">{child.pickupPersonName || 'Not specified'}</p>
                    <p className="text-sm text-base-content/70 mt-1">
                      {child.pickupPersonRelationship ? `(${child.pickupPersonRelationship})` : ''}
                    </p>
                    {child.pickupPersonPhone && (
                      <p className="text-sm text-base-content/70 mt-1">📞 {child.pickupPersonPhone}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h5 className="font-bold text-base-content mb-2">Special Instructions</h5>
                  <div className="bg-info/10 p-3 rounded-lg border border-info/20">
                    {child.notes && typeof child.notes === 'string' && child.notes.trim() ? (
                      <p className="text-base-content">{child.notes}</p>
                    ) : (
                      <p className="text-base-content/70 italic">No special instructions</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dietary & Special Needs */}
          <div className="card bg-base-100 shadow-xl border-l-4 border-l-warning">
            <div className="card-body">
              <h4 className="card-title text-xl text-warning mb-6 flex items-center gap-2">
                🍽️ Dietary & Special Needs
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-bold text-base-content mb-2">Dietary Restrictions</h5>
                  <div className="bg-warning/10 p-3 rounded-lg border border-warning/20">
                                            {child.dietaryRestrictions && typeof child.dietaryRestrictions === 'string' && child.dietaryRestrictions.trim() ? (
                          <p className="text-base-content">{child.dietaryRestrictions}</p>
                        ) : (
                          <p className="text-green-600 font-medium">✓ No dietary restrictions</p>
                        )}
                  </div>
                </div>
                
                <div>
                  <h5 className="font-bold text-base-content mb-2">Special Needs</h5>
                  <div className="bg-warning/10 p-3 rounded-lg border border-warning/20">
                                            {child.specialNeeds && typeof child.specialNeeds === 'string' && child.specialNeeds.trim() ? (
                          <p className="text-base-content">{child.specialNeeds}</p>
                        ) : (
                          <p className="text-green-600 font-medium">✓ No special needs reported</p>
                        )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preferences Notice */}
          {!shouldShowContent('attendanceStatus') && (
            <div className="alert alert-info shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-bold">Content Hidden</h4>
                <p>Some information is hidden based on your dashboard preferences. 
                You can change this in <strong>System Preferences</strong>.</p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-action">
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParentChildDetailsModal; 