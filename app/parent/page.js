// app/parent/page.js (Fixed - No Indexes Required)
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { useAuth } from '../firebase/auth-context';
import { db } from '../firebase/config';
import DashboardPreferencesService from '../services/DashboardPreferencesService';

export default function ParentDashboard() {
  const { user, logOut } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childActivities, setChildActivities] = useState([]);
  const [childAttendance, setChildAttendance] = useState([]);
  const [childMeals, setChildMeals] = useState([]);
  const [childNaps, setChildNaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [dashboardPreferences, setDashboardPreferences] = useState(null);
  const [profilePicture, setProfilePicture] = useState('');

  // Enhanced children loading with better error handling and debugging
  useEffect(() => {
    if (!user) {
      console.log('❌ No user found, cannot load children');
      setLoading(false);
      return;
    }

    console.log('🔍 Loading children for user:', user.uid);
    setDebugInfo(`Looking for children linked to user: ${user.uid}`);

    const loadChildren = async () => {
      try {
        // Multiple strategies to find children
        const strategies = [
          // Strategy 1: Children linked by parentId
          {
            name: 'parentId',
            query: query(collection(db, 'children'), where('parentId', '==', user.uid))
          },
          // Strategy 2: Children linked by access code (for newly registered parents)
          {
            name: 'accessCode',
            query: query(collection(db, 'children'), where('parentEmail', '==', user.email))
          }
        ];

        let allChildren = [];
        const foundStrategies = [];

        for (const strategy of strategies) {
          try {
            console.log(`🔍 Trying strategy: ${strategy.name}`);
            const snapshot = await getDocs(strategy.query);
            
            if (!snapshot.empty) {
              console.log(`✅ Found ${snapshot.size} children using ${strategy.name} strategy`);
              foundStrategies.push(`${strategy.name}: ${snapshot.size} children`);
              
              snapshot.forEach(doc => {
                const childData = { id: doc.id, ...doc.data() };
                // Avoid duplicates
                if (!allChildren.find(c => c.id === childData.id)) {
                  allChildren.push(childData);
                  console.log('👶 Found child:', {
                    id: childData.id,
                    name: `${childData.firstName} ${childData.lastName}`,
                    parentId: childData.parentId,
                    parentRegistered: childData.parentRegistered
                  });
                }
              });
            } else {
              console.log(`❌ No children found using ${strategy.name} strategy`);
            }
          } catch (strategyError) {
            console.warn(`⚠️ Strategy ${strategy.name} failed:`, strategyError);
          }
        }

        // If no children found with specific queries, try broader search
        if (allChildren.length === 0) {
          console.log('🔍 No children found with specific queries, trying broader search...');
          
          try {
            // Search for children by parent email in access codes
            const accessCodesSnapshot = await getDocs(
              query(collection(db, 'accessCodes'), where('parentEmail', '==', user.email))
            );
            
            if (!accessCodesSnapshot.empty) {
              console.log(`🔑 Found ${accessCodesSnapshot.size} access codes for email: ${user.email}`);
              
              // Get children IDs from access codes
              const childIds = [];
              accessCodesSnapshot.forEach(doc => {
                const accessCodeData = doc.data();
                if (accessCodeData.childId) {
                  childIds.push(accessCodeData.childId);
                  console.log('🔗 Access code links to child:', accessCodeData.childId);
                }
              });
              
              if (childIds.length > 0) {
                console.log('🔍 Fetching children by IDs from access codes...');
                
                // Fetch children by IDs
                for (const childId of childIds) {
                  try {
                    const childDoc = await getDocs(
                      query(collection(db, 'children'), where('__name__', '==', childId))
                    );
                    
                    if (!childDoc.empty) {
                      const childData = { id: childId, ...childDoc.docs[0].data() };
                      allChildren.push(childData);
                      console.log('👶 Found child via access code:', {
                        id: childData.id,
                        name: `${childData.firstName} ${childData.lastName}`
                      });
                    }
                  } catch (childError) {
                    console.warn(`⚠️ Could not fetch child ${childId}:`, childError);
                  }
                }
              }
            }
          } catch (accessCodeError) {
            console.warn('⚠️ Access code search failed:', accessCodeError);
          }
        }

        console.log(`📊 Final result: Found ${allChildren.length} children`);
        setDebugInfo(`Found ${allChildren.length} children using strategies: ${foundStrategies.join(', ')}`);
        
        if (allChildren.length > 0) {
          setChildren(allChildren);
          setSelectedChild(allChildren[0]); // Auto-select first child
        }
        
      } catch (error) {
        console.error('❌ Error loading children:', error);
        setError('Failed to load children. Please try refreshing the page.');
        setDebugInfo(`Error: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadChildren();
  }, [user]);

  // Load dashboard preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (!user?.uid) return;
      
      try {
        const preferences = await DashboardPreferencesService.getUserPreferences(user.uid);
        setDashboardPreferences(preferences);
        console.log('✅ Dashboard preferences loaded:', preferences);
      } catch (error) {
        console.error('Error loading dashboard preferences:', error);
      }
    };

    loadPreferences();
  }, [user?.uid]);

  // Load profile picture from Firestore
  useEffect(() => {
    const loadProfilePicture = async () => {
      if (!user?.uid) return;
      
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase/config');
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setProfilePicture(userDoc.data().photoURL || '');
        }
      } catch (error) {
        console.error('Error loading profile picture:', error);
      }
    };

    loadProfilePicture();
  }, [user?.uid]);

  // Helper functions to check if content should be shown based on preferences
  const shouldShowContent = (contentType) => {
    if (!dashboardPreferences) return true; // Show everything if preferences not loaded yet
    return DashboardPreferencesService.shouldShowContent(dashboardPreferences, contentType);
  };

  // FIXED: Real-time listeners for selected child's data (No orderBy to avoid index requirements)
  useEffect(() => {
    if (!selectedChild) return;

    console.log('📡 Setting up real-time listeners for child:', selectedChild.id);
    const unsubscribes = [];

    // Listen to activities (FIXED: no orderBy, will sort in memory)
    try {
      unsubscribes.push(
        onSnapshot(
          query(
            collection(db, 'activities'),
            where('childId', '==', selectedChild.id)
          ),
          (snapshot) => {
            const activitiesData = [];
            snapshot.forEach(doc => {
              activitiesData.push({ id: doc.id, ...doc.data() });
            });
            
            // Sort by date in memory (most recent first)
            activitiesData.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            setChildActivities(activitiesData.slice(0, 5)); // Show latest 5
            console.log(`📝 Loaded ${activitiesData.length} activities`);
          },
          (error) => {
            console.warn('⚠️ Activities listener error:', error);
          }
        )
      );
    } catch (activitiesError) {
      console.warn('⚠️ Could not set up activities listener:', activitiesError);
    }

    // Listen to attendance (FIXED: no orderBy, will sort in memory)
    try {
      unsubscribes.push(
        onSnapshot(
          query(
            collection(db, 'attendance'),
            where('childId', '==', selectedChild.id)
          ),
          (snapshot) => {
            const attendanceData = [];
            snapshot.forEach(doc => {
              attendanceData.push({ id: doc.id, ...doc.data() });
            });
            
            // Sort by date in memory (most recent first)
            attendanceData.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            setChildAttendance(attendanceData.slice(0, 7)); // Show latest week
            console.log(`📋 Loaded ${attendanceData.length} attendance records`);
          },
          (error) => {
            console.warn('⚠️ Attendance listener error:', error);
          }
        )
      );
    } catch (attendanceError) {
      console.warn('⚠️ Could not set up attendance listener:', attendanceError);
    }

    // Listen to meals (FIXED: no orderBy, will sort in memory)
    try {
      unsubscribes.push(
        onSnapshot(
          query(
            collection(db, 'childMeals'),
            where('childId', '==', selectedChild.id)
          ),
          (snapshot) => {
            const mealsData = [];
            snapshot.forEach(doc => {
              mealsData.push({ id: doc.id, ...doc.data() });
            });
            
            // Sort by date in memory (most recent first)
            mealsData.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            setChildMeals(mealsData.slice(0, 10)); // Show latest 10
            console.log(`🍽️ Loaded ${mealsData.length} meal records`);
          },
          (error) => {
            console.warn('⚠️ Meals listener error:', error);
          }
        )
      );
    } catch (mealsError) {
      console.warn('⚠️ Could not set up meals listener:', mealsError);
    }

    // Listen to naps (FIXED: no orderBy, will sort in memory)
    try {
      unsubscribes.push(
        onSnapshot(
          query(
            collection(db, 'naps'),
            where('childId', '==', selectedChild.id)
          ),
          (snapshot) => {
            const napsData = [];
            snapshot.forEach(doc => {
              napsData.push({ id: doc.id, ...doc.data() });
            });
            
            // Sort by date in memory (most recent first)
            napsData.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            setChildNaps(napsData.slice(0, 7)); // Show latest week
            console.log(`😴 Loaded ${napsData.length} nap records`);
          },
          (error) => {
            console.warn('⚠️ Naps listener error:', error);
          }
        )
      );
    } catch (napsError) {
      console.warn('⚠️ Could not set up naps listener:', napsError);
    }

    return () => {
      console.log('🧹 Cleaning up real-time listeners');
      unsubscribes.forEach(unsubscribe => {
        try {
          unsubscribe();
        } catch (error) {
          console.warn('⚠️ Error cleaning up listener:', error);
        }
      });
    };
  }, [selectedChild]);

  // Calculate age from date of birth
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

  const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return 'N/A';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  };

  const handleLogout = async () => {
    try {
      const { success, error } = await logOut();
      if (success) {
        window.location.href = '/';
      } else if (error) {
        console.error('Logout error:', error);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="alert alert-error shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="font-bold">Error</h3>
            <div className="text-sm">{error}</div>
          </div>
        </div>
        {debugInfo && (
          <div className="mt-4 p-4 bg-base-200 rounded-lg">
            <p className="text-sm opacity-70">Debug Info: {debugInfo}</p>
          </div>
        )}
        <button 
          onClick={() => window.location.reload()}
          className="btn btn-primary mt-4"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Welcome to Your Parent Dashboard</h1>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-warning">No Children Found</h2>
            <p>No children are currently linked to your account.</p>
            <p>If you just completed registration, please wait a moment and refresh the page.</p>
            <p>If the issue persists, please contact the daycare administration.</p>
            {debugInfo && (
              <div className="bg-base-200 p-4 rounded-lg mt-4">
                <p className="text-sm opacity-70">Debug Info: {debugInfo}</p>
              </div>
            )}
            <div className="card-actions justify-end mt-4">
              <button 
                onClick={() => window.location.reload()}
                className="btn btn-primary"
              >
                🔄 Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="card bg-base-100 shadow-2xl border-2 border-primary/30">
          <div className="card-body p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Profile Picture */}
              <div className="w-24 h-24 rounded-full overflow-hidden bg-primary flex items-center justify-center shadow-xl ring-4 ring-primary/20">
                {profilePicture ? (
                  <img 
                    src={profilePicture} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span className="text-3xl font-bold text-primary-content" style={{ display: profilePicture ? 'none' : 'flex' }}>
                  {user?.displayName?.charAt(0).toUpperCase() || user?.firstName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'P'}
                </span>
              </div>
              
              {/* Welcome Message */}
              <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  Welcome back, {user?.displayName || user?.firstName || 'Parent'}! 👋
                </h1>
                <p className="text-xl text-base-content/70">
                  Here's what's happening with your children today
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <div className="badge badge-primary badge-lg">Dashboard</div>
                  <div className="badge badge-secondary badge-lg">{children.length} Child{children.length !== 1 ? 'ren' : ''}</div>
                  <div className="badge badge-accent badge-lg">Real-time Updates</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Child Selection */}
        {children.length > 1 && (
          <div className="card bg-base-100 shadow-xl border-2 border-secondary/30">
            <div className="card-body p-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-base-content">Select Child</h2>
                  <p className="text-base-content/70">Choose which child's information to display</p>
                </div>
                <div className="form-control w-full md:w-auto">
                  <select 
                    className="select select-bordered select-lg w-full md:w-auto bg-base-100 border-2 border-primary/20 focus:border-primary transition-all duration-200"
                    value={selectedChild?.id || ''} 
                    onChange={(e) => {
                      const child = children.find(c => c.id === e.target.value);
                      setSelectedChild(child);
                    }}
                  >
                    <option value="">Select a child</option>
                    {children.map(child => (
                      <option key={child.id} value={child.id}>
                        {child.firstName} {child.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedChild && (
          <div className="grid gap-6">
            {/* Child Profile Card */}
            <div className="card bg-base-100 shadow-2xl border-2 border-accent/30">
              <div className="card-body p-8">
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-none w-40 h-40 rounded-2xl bg-primary/20 flex items-center justify-center text-6xl shadow-xl border-2 border-primary/20">
                    {selectedChild.gender === 'Female' ? '👧' : '👦'}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-3xl font-bold text-base-content mb-4">{selectedChild.firstName} {selectedChild.lastName}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="stat bg-base-100 rounded-xl p-4 shadow-lg border-2 border-primary/20">
                        <div className="stat-title text-base-content/70">Age</div>
                        <div className="stat-value text-2xl text-primary">{calculateAge(selectedChild.dateOfBirth)}</div>
                      </div>
                      <div className="stat bg-base-100 rounded-xl p-4 shadow-lg border-2 border-secondary/20">
                        <div className="stat-title text-base-content/70">Group</div>
                        <div className="stat-value text-2xl text-secondary">{selectedChild.group || 'Not assigned'}</div>
                      </div>
                      <div className="stat bg-base-100 rounded-xl p-4 shadow-lg border-2 border-accent/20">
                        <div className="stat-title text-base-content/70">Status</div>
                        <div className="stat-value">
                          <div className="badge badge-success badge-lg">Active</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Today's Summary */}
            <div className="card bg-base-100 shadow-2xl border-2 border-info/30">
              <div className="card-body p-8">
                <h3 className="card-title text-2xl mb-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary text-xl">📊</span>
                  </div>
                  Today's Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {shouldShowContent('attendanceStatus') && (
                    <div className="stat bg-base-100 rounded-xl p-6 shadow-lg border-2 border-primary/20 hover:shadow-xl transition-all duration-200">
                      <div className="stat-title text-base-content/70">Attendance</div>
                      <div className="stat-value text-2xl text-primary">
                        {childAttendance.length > 0 && 
                         childAttendance[0].date.split('T')[0] === new Date().toISOString().split('T')[0] 
                          ? childAttendance[0].status 
                          : 'Not marked'}
                      </div>
                    </div>
                  )}
                  {shouldShowContent('mealReports') && (
                    <div className="stat bg-base-100 rounded-xl p-6 shadow-lg border-2 border-secondary/20 hover:shadow-xl transition-all duration-200">
                      <div className="stat-title text-base-content/70">Meals Today</div>
                      <div className="stat-value text-2xl text-secondary">
                        {childMeals.filter(meal => 
                          meal.date.split('T')[0] === new Date().toISOString().split('T')[0]
                        ).length}
                      </div>
                    </div>
                  )}
                  {shouldShowContent('napTimes') && (
                    <div className="stat bg-base-100 rounded-xl p-6 shadow-lg border-2 border-accent/20 hover:shadow-xl transition-all duration-200">
                      <div className="stat-title text-base-content/70">Naps Today</div>
                      <div className="stat-value text-2xl text-accent">
                        {childNaps.filter(nap => 
                          nap.date.split('T')[0] === new Date().toISOString().split('T')[0]
                        ).length}
                      </div>
                    </div>
                  )}
                  {shouldShowContent('todayActivities') && (
                    <div className="stat bg-base-100 rounded-xl p-6 shadow-lg border-2 border-info/20 hover:shadow-xl transition-all duration-200">
                      <div className="stat-title text-base-content/70">Activities Today</div>
                      <div className="stat-value text-2xl text-info">
                        {childActivities.filter(activity => 
                          activity.date.split('T')[0] === new Date().toISOString().split('T')[0]
                        ).length}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recent Activities */}
            {shouldShowContent('todayActivities') && (
              <div className="card bg-base-100 shadow-2xl border-2 border-warning/30">
                <div className="card-body p-8">
                  <h3 className="card-title text-2xl mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="text-accent text-xl">🎨</span>
                    </div>
                    Recent Activities
                  </h3>
                  {childActivities.length === 0 ? (
                    <div className="alert alert-info shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>No activities recorded yet.</span>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {childActivities.map(activity => (
                        <div key={activity.id} className="card bg-base-100 shadow-lg border-2 border-warning/20 hover:shadow-xl transition-all duration-200">
                          <div className="card-body p-6">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-lg">{activity.title}</h4>
                                <p className="text-sm opacity-70">{new Date(activity.date).toLocaleDateString()}</p>
                              </div>
                              <div className="badge badge-lg" data-type={activity.activityType || activity.type || 'other'}>
                                {activity.activityType || activity.type || 'Activity'}
                              </div>
                            </div>
                            <p className="mt-3">{activity.description}</p>
                            {activity.notes && (
                              <p className="text-sm opacity-70 mt-3 p-3 bg-base-200 rounded-lg">Notes: {activity.notes}</p>
                            )}
                            {activity.photos && activity.photos.length > 0 && (
                              <div className="mt-4">
                                <p className="text-sm font-semibold mb-3">📸 Photos:</p>
                                <div className="flex gap-3 overflow-x-auto">
                                  {activity.photos.map((photo, index) => {
                                    // Handle both old URL format and new base64 format
                                    const photoSrc = typeof photo === 'string' ? photo : photo.data;
                                    const photoName = typeof photo === 'string' ? `Activity Photo ${index + 1}` : photo.name;
                                    
                                    return (
                                      <div key={index} className="relative flex-shrink-0 group">
                                        <img
                                          src={photoSrc}
                                          alt={photoName}
                                          className="w-20 h-20 object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity shadow-lg"
                                          onClick={() => {
                                            const newWindow = window.open();
                                            newWindow.document.write(`
                                              <html>
                                                <head><title>${photoName}</title></head>
                                                <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#000;">
                                                  <img src="${photoSrc}" style="max-width:100%; max-height:100vh; object-fit:contain;" />
                                                </body>
                                              </html>
                                            `);
                                          }}
                                        />
                                        {/* Show file info tooltip for new format */}
                                        {typeof photo === 'object' && (
                                          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                            {photo.name} ({(photo.size / 1024 / 1024).toFixed(1)}MB)
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Attendance */}
            {shouldShowContent('attendanceStatus') && (
              <div className="card bg-base-100 shadow-2xl border-2 border-success/30">
                <div className="card-body p-8">
                  <h3 className="card-title text-2xl mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-primary text-xl">📋</span>
                    </div>
                    Recent Attendance
                  </h3>
                  {childAttendance.length === 0 ? (
                    <div className="alert alert-info shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>No attendance records yet.</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table table-zebra w-full">
                        <thead>
                          <tr>
                            <th className="text-base font-semibold">Date</th>
                            <th className="text-base font-semibold">Status</th>
                            <th className="text-base font-semibold">Arrival</th>
                            <th className="text-base font-semibold">Departure</th>
                          </tr>
                        </thead>
                        <tbody>
                          {childAttendance.map(record => (
                            <tr key={record.id} className="hover:bg-base-200 transition-colors duration-200">
                              <td className="font-medium">{new Date(record.date).toLocaleDateString()}</td>
                              <td>
                                <div className="badge badge-lg" data-status={record.status}>
                                  {record.status}
                                </div>
                              </td>
                              <td>{record.arrivalTime || '-'}</td>
                              <td>{record.departureTime || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Meals */}
            {shouldShowContent('mealReports') && (
              <div className="card bg-base-100 shadow-2xl border-2 border-error/30">
                <div className="card-body p-8">
                  <h3 className="card-title text-2xl mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                      <span className="text-secondary text-xl">🍽️</span>
                    </div>
                    Recent Meals
                  </h3>
                  {childMeals.length === 0 ? (
                    <div className="alert alert-info shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>No meal records yet.</span>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {childMeals.map(meal => (
                        <div key={meal.id} className="card bg-base-100 shadow-lg border-2 border-error/20 hover:shadow-xl transition-all duration-200">
                          <div className="card-body p-6">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-lg capitalize">{meal.mealType}</h4>
                                <p className="text-sm opacity-70">
                                  {new Date(meal.date).toLocaleDateString()} at {meal.time}
                                </p>
                              </div>
                              <div className="badge badge-lg badge-secondary" data-amount={meal.amountEaten}>
                                {meal.amountEaten}
                              </div>
                            </div>
                            <p className="mt-3 p-3 bg-base-200 rounded-lg">
                              {Array.isArray(meal.foodItems) ? 
                                meal.foodItems.join(', ') : 
                                meal.foodItems}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent Naps */}
            {shouldShowContent('napTimes') && (
              <div className="card bg-base-100 shadow-2xl border-2 border-neutral/30">
                <div className="card-body p-8">
                  <h3 className="card-title text-2xl mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                      <span className="text-accent text-xl">😴</span>
                    </div>
                    Recent Naps
                  </h3>
                  {childNaps.length === 0 ? (
                    <div className="alert alert-info shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>No nap records yet.</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="table table-zebra w-full">
                        <thead>
                          <tr>
                            <th className="text-base font-semibold">Date</th>
                            <th className="text-base font-semibold">Duration</th>
                            <th className="text-base font-semibold">Quality</th>
                            <th className="text-base font-semibold">Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {childNaps.map(nap => (
                            <tr key={nap.id} className="hover:bg-base-200 transition-colors duration-200">
                              <td className="font-medium">{new Date(nap.date).toLocaleDateString()}</td>
                              <td className="font-medium">{formatDuration(nap.duration)}</td>
                              <td>
                                <div className="badge badge-lg" data-quality={nap.quality}>
                                  {nap.quality}
                                </div>
                              </td>
                              <td className="font-medium">{nap.startTime} - {nap.endTime}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Weekly Summary */}
            {shouldShowContent('weeklySummary') && (
              <div className="card bg-base-100 shadow-2xl border-2 border-warning/30">
                <div className="card-body p-8">
                  <h3 className="card-title text-2xl mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
                      <span className="text-warning text-xl">📅</span>
                    </div>
                    Weekly Summary
                  </h3>
                  
                  {(() => {
                    // Calculate date range for the past week
                    const today = new Date();
                    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                    
                    // Filter data for the past week
                    const weeklyActivities = childActivities.filter(activity => {
                      const activityDate = new Date(activity.date);
                      return activityDate >= weekAgo && activityDate <= today;
                    });
                    
                    const weeklyMeals = childMeals.filter(meal => {
                      const mealDate = new Date(meal.date);
                      return mealDate >= weekAgo && mealDate <= today;
                    });
                    
                    const weeklyNaps = childNaps.filter(nap => {
                      const napDate = new Date(nap.date);
                      return napDate >= weekAgo && napDate <= today;
                    });
                    
                    const weeklyAttendance = childAttendance.filter(record => {
                      const recordDate = new Date(record.date);
                      return recordDate >= weekAgo && recordDate <= today;
                    });
                    
                    // Calculate statistics
                    const totalActivities = weeklyActivities.length;
                    const totalMeals = weeklyMeals.length;
                    const totalNaps = weeklyNaps.length;
                    const attendanceRate = weeklyAttendance.length > 0 ? 
                      (weeklyAttendance.filter(r => r.status === 'Present').length / weeklyAttendance.length * 100).toFixed(1) : 0;
                    
                    // Get most common activity types
                    const activityTypes = weeklyActivities.reduce((acc, activity) => {
                      const type = activity.activityType || activity.type || 'Other';
                      acc[type] = (acc[type] || 0) + 1;
                      return acc;
                    }, {});
                    const topActivityType = Object.entries(activityTypes)
                      .sort(([,a], [,b]) => b - a)[0];
                    
                    // Get meal preferences
                    const mealTypes = weeklyMeals.reduce((acc, meal) => {
                      acc[meal.mealType] = (acc[meal.mealType] || 0) + 1;
                      return acc;
                    }, {});
                    const favoriteMeal = Object.entries(mealTypes)
                      .sort(([,a], [,b]) => b - a)[0];
                    
                    // Calculate average nap duration
                    const totalNapMinutes = weeklyNaps.reduce((acc, nap) => {
                      const duration = nap.duration || 0;
                      return acc + duration;
                    }, 0);
                    const avgNapDuration = weeklyNaps.length > 0 ? 
                      Math.round(totalNapMinutes / weeklyNaps.length) : 0;
                    
                    return (
                      <div className="space-y-6">
                        {/* Weekly Statistics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <div className="stat bg-base-100 rounded-xl p-6 shadow-lg border-2 border-primary/20">
                            <div className="stat-title text-base-content/70">Activities</div>
                            <div className="stat-value text-2xl text-primary">{totalActivities}</div>
                            <div className="stat-desc text-sm">
                              {topActivityType ? `${topActivityType[0]}: ${topActivityType[1]}` : 'No activities'}
                            </div>
                          </div>
                          
                          <div className="stat bg-base-100 rounded-xl p-6 shadow-lg border-2 border-secondary/20">
                            <div className="stat-title text-base-content/70">Meals</div>
                            <div className="stat-value text-2xl text-secondary">{totalMeals}</div>
                            <div className="stat-desc text-sm">
                              {favoriteMeal ? `${favoriteMeal[0]}: ${favoriteMeal[1]}` : 'No meals'}
                            </div>
                          </div>
                          
                          <div className="stat bg-base-100 rounded-xl p-6 shadow-lg border-2 border-accent/20">
                            <div className="stat-title text-base-content/70">Naps</div>
                            <div className="stat-value text-2xl text-accent">{totalNaps}</div>
                            <div className="stat-desc text-sm">
                              Avg: {avgNapDuration} min
                            </div>
                          </div>
                          
                          <div className="stat bg-base-100 rounded-xl p-6 shadow-lg border-2 border-info/20">
                            <div className="stat-title text-base-content/70">Attendance</div>
                            <div className="stat-value text-2xl text-info">{attendanceRate}%</div>
                            <div className="stat-desc text-sm">
                              {weeklyAttendance.length} days
                            </div>
                          </div>
                        </div>
                        
                        {/* Weekly Timeline */}
                        <div className="mt-8">
                          <h4 className="text-lg font-semibold mb-4">📊 Week Overview</h4>
                          <div className="grid grid-cols-7 gap-2">
                            {Array.from({ length: 7 }, (_, i) => {
                              const date = new Date(weekAgo.getTime() + i * 24 * 60 * 60 * 1000);
                              const dateStr = date.toISOString().split('T')[0];
                              const isToday = dateStr === today.toISOString().split('T')[0];
                              
                              const dayActivities = weeklyActivities.filter(a => 
                                a.date.split('T')[0] === dateStr
                              ).length;
                              const dayMeals = weeklyMeals.filter(m => 
                                m.date.split('T')[0] === dateStr
                              ).length;
                              const dayNaps = weeklyNaps.filter(n => 
                                n.date.split('T')[0] === dateStr
                              ).length;
                              
                              return (
                                <div key={i} className={`text-center p-3 rounded-lg border-2 ${
                                  isToday ? 'border-warning bg-warning/10' : 'border-base-300 bg-base-100'
                                }`}>
                                  <div className="text-xs font-medium text-base-content/70">
                                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                  </div>
                                  <div className="text-sm font-bold">
                                    {date.getDate()}
                                  </div>
                                  <div className="text-xs space-y-1 mt-2">
                                    {dayActivities > 0 && (
                                      <div className="badge badge-xs badge-primary">🎨 {dayActivities}</div>
                                    )}
                                    {dayMeals > 0 && (
                                      <div className="badge badge-xs badge-secondary">🍽️ {dayMeals}</div>
                                    )}
                                    {dayNaps > 0 && (
                                      <div className="badge badge-xs badge-accent">😴 {dayNaps}</div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Weekly Highlights */}
                        <div className="mt-6">
                          <h4 className="text-lg font-semibold mb-4">⭐ Weekly Highlights</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {weeklyActivities.length > 0 && (
                              <div className="card bg-base-200 border-2 border-primary/20">
                                <div className="card-body p-4">
                                  <h5 className="font-semibold text-primary">🎨 Most Active Day</h5>
                                  <p className="text-sm">
                                    {(() => {
                                      const dayCounts = weeklyActivities.reduce((acc, activity) => {
                                        const day = new Date(activity.date).toLocaleDateString('en-US', { weekday: 'long' });
                                        acc[day] = (acc[day] || 0) + 1;
                                        return acc;
                                      }, {});
                                      const mostActiveDay = Object.entries(dayCounts)
                                        .sort(([,a], [,b]) => b - a)[0];
                                      return mostActiveDay ? `${mostActiveDay[0]} (${mostActiveDay[1]} activities)` : 'No activities';
                                    })()}
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            {weeklyMeals.length > 0 && (
                              <div className="card bg-base-200 border-2 border-secondary/20">
                                <div className="card-body p-4">
                                  <h5 className="font-semibold text-secondary">🍽️ Meal Pattern</h5>
                                  <p className="text-sm">
                                    {(() => {
                                      const mealCounts = weeklyMeals.reduce((acc, meal) => {
                                        acc[meal.mealType] = (acc[meal.mealType] || 0) + 1;
                                        return acc;
                                      }, {});
                                      const mealSummary = Object.entries(mealCounts)
                                        .map(([type, count]) => `${type}: ${count}`)
                                        .join(', ');
                                      return mealSummary || 'No meal data';
                                    })()}
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            {weeklyNaps.length > 0 && (
                              <div className="card bg-base-200 border-2 border-accent/20">
                                <div className="card-body p-4">
                                  <h5 className="font-semibold text-accent">😴 Sleep Quality</h5>
                                  <p className="text-sm">
                                    {(() => {
                                      const qualityCounts = weeklyNaps.reduce((acc, nap) => {
                                        acc[nap.quality] = (acc[nap.quality] || 0) + 1;
                                        return acc;
                                      }, {});
                                      const avgQuality = Object.entries(qualityCounts)
                                        .map(([quality, count]) => `${quality}: ${count}`)
                                        .join(', ');
                                      return avgQuality || 'No nap data';
                                    })()}
                                  </p>
                                </div>
                              </div>
                            )}
                            
                            {weeklyAttendance.length > 0 && (
                              <div className="card bg-base-200 border-2 border-info/20">
                                <div className="card-body p-4">
                                  <h5 className="font-semibold text-info">📋 Attendance Trend</h5>
                                  <p className="text-sm">
                                    {(() => {
                                      const presentDays = weeklyAttendance.filter(r => r.status === 'Present').length;
                                      const totalDays = weeklyAttendance.length;
                                      const trend = presentDays === totalDays ? 'Perfect attendance!' :
                                        presentDays > totalDays / 2 ? 'Good attendance' : 'Some absences';
                                      return `${trend} (${presentDays}/${totalDays} days present)`;
                                    })()}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}