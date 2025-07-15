'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

const ParentChildDetailsModal = ({ child, onClose, isOpen }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Load child's recent activities
  useEffect(() => {
    if (!child?.id || !isOpen) return;

    setLoading(true);

    const activitiesQuery = query(
      collection(db, 'activities'),
      where('childId', '==', child.id),
      orderBy('date', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(
      activitiesQuery,
      (snapshot) => {
        const activitiesData = [];
        snapshot.forEach(doc => {
          activitiesData.push({ id: doc.id, ...doc.data() });
        });
        setActivities(activitiesData);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading activities:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [child?.id, isOpen]);

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

  const getActivityIcon = (type) => {
    const icons = {
      'Learning': '📚',
      'Physical': '🏃',
      'Creative': '🎨',
      'Social': '👥',
      'Emotional': '💝',
      'Life Skills': '🏠',
      'Special Events': '🎉'
    };
    return icons[type] || '📝';
  };

  if (!isOpen || !child) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box w-11/12 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {child.firstName} {child.lastName} - Details
          </h2>
          <button 
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-bordered mb-6">
          <button 
            className={`tab tab-bordered ${activeTab === 'overview' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab tab-bordered ${activeTab === 'activities' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('activities')}
          >
            Recent Activities
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Child Overview */}
              <div className="card bg-base-200">
                <div className="card-body">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="text-6xl">
                      {child.gender === 'Female' ? '👧' : '👦'}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {child.firstName} {child.lastName}
                      </h3>
                      <p className="text-base-content/70">
                        Age: {calculateAge(child.dateOfBirth)} • Group: {child.group || 'Not assigned'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="stat">
                      <div className="stat-title">Date of Birth</div>
                      <div className="stat-value text-lg">
                        {child.dateOfBirth ? formatDate(child.dateOfBirth) : 'Not specified'}
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-title">Gender</div>
                      <div className="stat-value text-lg">
                        {child.gender || 'Not specified'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Health Information */}
              <div className="card bg-base-100">
                <div className="card-body">
                  <h4 className="card-title text-lg mb-4">Health & Safety Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-semibold mb-2">Allergies</h5>
                      <p className="text-base-content/70">
                        {Array.isArray(child.allergies) && child.allergies.length > 0 
                          ? child.allergies.join(', ') 
                          : 'None reported'}
                      </p>
                    </div>
                    <div>
                      <h5 className="font-semibold mb-2">Medical Conditions</h5>
                      <p className="text-base-content/70">
                        {Array.isArray(child.medicalConditions) && child.medicalConditions.length > 0 
                          ? child.medicalConditions.join(', ') 
                          : 'None reported'}
                      </p>
                    </div>
                    <div>
                      <h5 className="font-semibold mb-2">Emergency Contact</h5>
                      <p className="text-base-content/70">
                        {child.emergencyContact || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <h5 className="font-semibold mb-2">Emergency Phone</h5>
                      <p className="text-base-content/70">
                        {child.emergencyPhone || 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <span className="loading loading-spinner loading-lg"></span>
                </div>
              ) : activities.length > 0 ? (
                <div className="space-y-3">
                  {activities.map((activity) => (
                    <div key={activity.id} className="card bg-base-100 border">
                      <div className="card-body p-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">
                            {getActivityIcon(activity.activityType)}
                          </span>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-semibold">
                                  {activity.title || activity.activityType || 'Activity'}
                                </h5>
                                <p className="text-sm text-base-content/70 mb-2">
                                  {formatDate(activity.date)}
                                </p>
                              </div>
                              <div className="badge badge-outline">
                                {activity.activityType}
                              </div>
                            </div>
                            {activity.description && (
                              <p className="text-sm text-base-content/80">
                                {activity.description}
                              </p>
                            )}
                            {activity.skills && activity.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {activity.skills.map((skill, index) => (
                                  <span key={index} className="badge badge-sm badge-secondary">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-base-content/70">
                  <div className="text-4xl mb-4">📝</div>
                  <p className="text-lg">No activities recorded yet</p>
                  <p className="text-sm">Activities will appear here once your child's teachers start logging them</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParentChildDetailsModal; 