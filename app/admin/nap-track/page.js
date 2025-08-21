// app/admin/nap-track/page.js - Fixed Nap Tracking System
'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  query, 
  where, 
  orderBy,
  updateDoc 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import Image from 'next/image';

export default function NapTrackingPage() {
  const [children, setChildren] = useState([]);
  const [napSessions, setNapSessions] = useState({});
  const [napHistory, setNapHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Fix date issue by using local date instead of UTC
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [activeView, setActiveView] = useState('live');
  const [error, setError] = useState('');

  // Live nap tracking state with persistence
  const [activeNaps, setActiveNaps] = useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('activeNaps');
        if (saved) {
          const parsed = JSON.parse(saved);
          // Convert back to Map and ensure data is still valid (within 24 hours)
          const now = new Date();
          const activeMap = new Map();
          
          Object.entries(parsed).forEach(([childId, napData]) => {
            const startTime = new Date(napData.startTime);
            const hoursDiff = (now - startTime) / (1000 * 60 * 60);
            
            // Only restore if nap started within the last 24 hours
            if (hoursDiff < 24 && napData.status === 'sleeping') {
              activeMap.set(childId, napData);
            }
          });
          
          return activeMap;
        }
      } catch (error) {
        console.warn('Failed to load active naps from localStorage:', error);
      }
    }
    return new Map();
  });
  
  const [napTimers, setNapTimers] = useState(new Map());

  // Schedule state
  const [napSchedules] = useState({
    'Infant': [
      { name: 'Morning Nap', startTime: '09:30', endTime: '11:00' },
      { name: 'Afternoon Nap', startTime: '13:30', endTime: '15:00' }
    ],
    'Toddler': [
      { name: 'Afternoon Nap', startTime: '12:30', endTime: '14:30' }
    ],
    'Pre-K': [
      { name: 'Quiet Time', startTime: '13:00', endTime: '14:00' }
    ]
  });

  const sleepQualityOptions = ['excellent', 'good', 'fair', 'restless', 'difficult'];

  // Persist active naps to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && activeNaps.size > 0) {
      try {
        // Convert Map to object for storage
        const activeNapsObj = Object.fromEntries(activeNaps);
        localStorage.setItem('activeNaps', JSON.stringify(activeNapsObj));
      } catch (error) {
        console.warn('Failed to save active naps to localStorage:', error);
      }
    } else if (typeof window !== 'undefined' && activeNaps.size === 0) {
      // Clear localStorage when no active naps
      localStorage.removeItem('activeNaps');
    }
  }, [activeNaps]);

  // Load children and nap data with improved error handling
  useEffect(() => {
    const loadData = async () => {
      try {
        setError('');
        console.log('Loading nap tracking data...');

        // Load children
        const childrenSnapshot = await getDocs(collection(db, 'children'));
        const childrenList = [];
        childrenSnapshot.forEach(doc => {
          childrenList.push({ id: doc.id, ...doc.data() });
        });
        
        console.log(`Loaded ${childrenList.length} children`);
        setChildren(childrenList);

        // Load today's nap sessions - using simpler query
        try {
          const today = (() => {
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          })();
          const napSessionsSnapshot = await getDocs(collection(db, 'napSessions'));
          
          const sessionsData = {};
          const activeNapsMap = new Map();
          
          napSessionsSnapshot.forEach(doc => {
            const data = doc.data();
            // Filter by today's date - handle both ISO and local date formats
            if (data.date) {
              let matchesDate = false;
              
              // Check if date matches today (handle both ISO strings and local date strings)
              if (data.date.includes(today)) {
                matchesDate = true;
              } else if (data.date.length === 10 && data.date === today) {
                // Exact match for YYYY-MM-DD format
                matchesDate = true;
              }
              
              if (matchesDate) {
                sessionsData[data.childId] = data;
                if (data.status === 'sleeping') {
                  activeNapsMap.set(data.childId, data);
                }
              }
            }
          });
          
          console.log(`Loaded ${Object.keys(sessionsData).length} nap sessions`);
          setNapSessions(sessionsData);
          
          // Merge database active naps with localStorage active naps, giving priority to database
          setActiveNaps(prev => {
            const mergedMap = new Map(prev); // Start with localStorage data
            
            // Override with database data (more authoritative)
            activeNapsMap.forEach((value, key) => {
              mergedMap.set(key, value);
            });
            
            // Remove any localStorage entries that aren't in the database anymore
            const dbChildIds = new Set(activeNapsMap.keys());
            for (const [childId] of prev) {
              if (!dbChildIds.has(childId)) {
                // Check if this nap is still valid (less than 24 hours old)
                const napData = prev.get(childId);
                if (napData && napData.startTime) {
                  const startTime = new Date(napData.startTime);
                  const hoursDiff = (new Date() - startTime) / (1000 * 60 * 60);
                  if (hoursDiff >= 24) {
                    mergedMap.delete(childId);
                  }
                }
              }
            }
            
            return mergedMap;
          });
        } catch (sessionError) {
          console.warn('Could not load nap sessions:', sessionError);
          // Continue without nap sessions
        }

        // Load nap history - using simpler approach
        try {
          const historySnapshot = await getDocs(collection(db, 'naps'));
          const historyData = [];
          
          historySnapshot.forEach(doc => {
            const data = doc.data();
            // Filter by selected date - handle both ISO and local date formats
            if (data.date) {
              let matchesDate = false;
              
              // Check if date matches selected date (handle both ISO strings and local date strings)
              if (data.date.includes(selectedDate)) {
                matchesDate = true;
              } else if (data.date.length === 10 && data.date === selectedDate) {
                // Exact match for YYYY-MM-DD format
                matchesDate = true;
              }
              
              if (matchesDate) {
                historyData.push({ id: doc.id, ...data });
              }
            }
          });
          
          // Sort by date
          historyData.sort((a, b) => new Date(b.date) - new Date(a.date));
          
          console.log(`Loaded ${historyData.length} nap history records`);
          setNapHistory(historyData);
        } catch (historyError) {
          console.warn('Could not load nap history:', historyError);
          // Continue without history
        }

      } catch (error) {
        console.error('Error loading nap data:', error);
        setError(`Failed to load data: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDate]);

  // Timer effect for active naps
  useEffect(() => {
    const interval = setInterval(() => {
      setNapTimers(prev => {
        const newTimers = new Map(prev);
        activeNaps.forEach((napData, childId) => {
          if (napData.status === 'sleeping') {
            const startTime = new Date(napData.startTime);
            const now = new Date();
            const duration = Math.floor((now - startTime) / 1000 / 60);
            newTimers.set(childId, duration);
          }
        });
        return newTimers;
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [activeNaps]);

  // Start nap session
  const startNap = async (child, napType = 'regular') => {
    try {
      const napSessionId = `${child.id}_${Date.now()}`;
      const now = new Date();
      const startTime = now.toISOString();
      
      // Create date string in YYYY-MM-DD format using local time to avoid timezone issues
      const localDateStr = (() => {
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })();
      
      const napSessionData = {
        id: napSessionId,
        childId: child.id,
        childName: `${child.firstName} ${child.lastName}`,
        date: localDateStr, // Use local date string instead of ISO
        startTime: startTime,
        napType: napType,
        status: 'sleeping',
        group: child.group || 'Unknown',
        createdBy: 'admin',
        environment: 'quiet',
        notes: ''
      };
      
      await setDoc(doc(db, 'napSessions', napSessionId), napSessionData);
      
      // Update local state
      setActiveNaps(prev => new Map(prev.set(child.id, napSessionData)));
      setNapSessions(prev => ({
        ...prev,
        [child.id]: napSessionData
      }));
      
    } catch (error) {
      console.error('Error starting nap:', error);
      setError('Failed to start nap session');
    }
  };

  // End nap session
  const endNap = async (child, quality = 'good', notes = '') => {
    try {
      const activeNap = activeNaps.get(child.id) || napSessions[child.id];
      if (!activeNap) return;
      
      const now = new Date();
      const endTime = now.toISOString();
      const startTime = new Date(activeNap.startTime);
      const duration = Math.floor((new Date(endTime) - startTime) / 1000 / 60);
      
      // Create date string in YYYY-MM-DD format using local time to avoid timezone issues
      const localDateStr = (() => {
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })();
      
      // Update nap session
      await updateDoc(doc(db, 'napSessions', activeNap.id), {
        endTime: endTime,
        duration: duration,
        quality: quality,
        status: 'completed',
        notes: notes,
        completedAt: endTime
      });
      
      // Create nap history record
      const napHistoryId = `${child.id}_${Date.now()}`;
      const napHistoryData = {
        id: napHistoryId,
        childId: child.id,
        childName: `${child.firstName} ${child.lastName}`,
        date: localDateStr, // Use local date string instead of ISO
        startTime: new Date(activeNap.startTime).toTimeString().slice(0, 5),
        endTime: new Date(endTime).toTimeString().slice(0, 5),
        duration: duration,
        quality: quality,
        napType: activeNap.napType || 'regular',
        environment: activeNap.environment || 'quiet',
        notes: notes,
        recordedBy: 'admin',
        recordedAt: endTime
      };
      
      await setDoc(doc(db, 'naps', napHistoryId), napHistoryData);
      
      // Update local state
      setActiveNaps(prev => {
        const newMap = new Map(prev);
        newMap.delete(child.id);
        return newMap;
      });
      
      setNapSessions(prev => {
        const updated = { ...prev };
        delete updated[child.id];
        return updated;
      });
      
      setNapHistory(prev => [napHistoryData, ...prev]);
      
    } catch (error) {
      console.error('Error ending nap:', error);
      setError('Failed to end nap session');
    }
  };

  // Wake child
  const wakeChild = async (child, reason = 'scheduled') => {
    await endNap(child, 'interrupted', `Woken up: ${reason}`);
  };

  // Calculate total nap time for a child today
  const getTodayNapTime = (childId) => {
    const today = (() => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })();
    const todayNaps = napHistory.filter(nap => 
      nap.childId === childId && 
      nap.date.includes(today)
    );
    
    const totalMinutes = todayNaps.reduce((sum, nap) => sum + (nap.duration || 0), 0);
    return formatDuration(totalMinutes);
  };

  // Format duration
  const formatDuration = (minutes) => {
    if (!minutes || minutes <= 0) return '0m';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    } else {
      return `${mins}m`;
    }
  };

  // Get nap status for child
  const getNapStatus = (child) => {
    const activeNap = activeNaps.get(child.id) || napSessions[child.id];
    if (activeNap && activeNap.status === 'sleeping') {
      return 'sleeping';
    }
    return 'awake';
  };

  // Get sleep quality color
  const getQualityColor = (quality) => {
    const colors = {
      'excellent': '#28a745',
      'good': '#6c757d',
      'fair': '#ffc107',
      'restless': '#fd7e14',
      'difficult': '#dc3545'
    };
    return colors[quality] || '#6c757d';
  };

  // Group children by age group
  const groupedChildren = children.reduce((groups, child) => {
    const group = child.group || 'Unknown';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(child);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">😴 Nap Tracking & Sleep Management</h1>
        <div className="flex items-center gap-4">
          <input
            type="date"
            className="input input-bordered"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <div className="tabs tabs-boxed">
            <button 
              className={`tab ${activeView === 'live' ? 'tab-active' : ''}`}
              onClick={() => setActiveView('live')}
            >
              🔴 Live Tracking
            </button>
            <button 
              className={`tab ${activeView === 'schedule' ? 'tab-active' : ''}`}
              onClick={() => setActiveView('schedule')}
            >
              <Image src="/Emojis/Calendar_emoji-Photoroom.png" alt="Calendar Emoji" width={24} height={24} className="inline-block mr-2" /> Nap Schedule
            </button>
            <button 
              className={`tab ${activeView === 'history' ? 'tab-active' : ''}`}
              onClick={() => setActiveView('history')}
            >
              <Image src="/Emojis/Programs_emoji-Photoroom.png" alt="Programs Emoji" width={24} height={24} className="inline-block mr-2" /> Sleep History
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button 
            className="btn btn-error btn-sm"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      )}

      {/* Live Tracking View */}
      {activeView === 'live' && (
        <div className="space-y-6">
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">Currently Sleeping</div>
              <div className="stat-value">{activeNaps.size}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Awake</div>
              <div className="stat-value">{children.length - activeNaps.size}</div>
            </div>
            <div className="stat">
              <div className="stat-title">Naps Today</div>
              <div className="stat-value">
                {napHistory.filter(nap => 
                  nap.date.includes((() => {
                    const date = new Date();
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${year}-${month}-${day}`;
                  })())
                ).length}
              </div>
            </div>
          </div>

          {children.length === 0 ? (
            <div className="card bg-base-200 p-8 text-center">
              <p className="text-lg">No children found. Please add children to the system first.</p>
            </div>
          ) : (
            Object.entries(groupedChildren).map(([group, groupChildren]) => (
              <div key={group} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <h2 className="card-title"><Image src="/Emojis/Baby_emoji-Photoroom.png" alt="Baby Emoji" width={24} height={24} className="mr-2" /> {group} Room</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupChildren.map(child => {
                      const napStatus = getNapStatus(child);
                      const activeNap = activeNaps.get(child.id) || napSessions[child.id];
                      const napDuration = napTimers.get(child.id) || 0;
                      const todayTotal = getTodayNapTime(child.id);
                      
                      return (
                        <div key={child.id} className={`card bg-base-200 ${napStatus === 'sleeping' ? 'border-primary border-2' : ''}`}>
                          <div className="card-body">
                            <div className="flex items-center gap-4">
                              <div className="text-2xl">
                                {child.gender === 'Female' ? '👧' : '👦'}
                              </div>
                              <div>
                                <h3 className="font-bold">{child.firstName} {child.lastName}</h3>
                                <p className={`text-sm ${napStatus === 'sleeping' ? 'text-primary' : ''}`}>
                                  {napStatus === 'sleeping' ? '😴 Sleeping' : '😊 Awake'}
                                </p>
                              </div>
                              <div className={`badge badge-${napStatus === 'sleeping' ? 'primary' : 'ghost'} ml-auto`}>
                                {napStatus}
                              </div>
                            </div>
                            
                            <div className="divider"></div>
                            
                            {napStatus === 'sleeping' && activeNap ? (
                              <div className="space-y-2">
                                <p>
                                  <strong>Sleeping for:</strong> {formatDuration(napDuration)}
                                </p>
                                <p>
                                  <strong>Started:</strong> {new Date(activeNap.startTime).toLocaleTimeString()}
                                </p>
                                <div className="card-actions justify-end">
                                  <button 
                                    className="btn btn-warning btn-sm"
                                    onClick={() => wakeChild(child, 'manual')}
                                  >
                                    👋 Wake Up
                                  </button>
                                  <button 
                                    className="btn btn-primary btn-sm"
                                    onClick={() => endNap(child, 'good')}
                                  >
                                    <Image src="/Emojis/Star_emoji-Photoroom.png" alt="Star Emoji" width={20} height={20} className="mr-1" /> End Nap
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <p>
                                  <strong>Today's Sleep:</strong> {todayTotal}
                                </p>
                                <div className="card-actions justify-end">
                                  <button 
                                    className="btn btn-primary btn-sm"
                                    onClick={() => startNap(child, 'regular')}
                                  >
                                    😴 Start Nap
                                  </button>
                                  <button 
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => startNap(child, 'quiet-time')}
                                  >
                                    🤫 Quiet Time
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Schedule View */}
      {activeView === 'schedule' && (
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title"><Image src="/Emojis/Calendar_emoji-Photoroom.png" alt="Calendar Emoji" width={24} height={24} className="mr-2" /> Daily Nap Schedule</h2>
              <p className="text-sm opacity-70">Recommended nap times by age group</p>

              <div className="space-y-8 mt-4">
                {Object.entries(napSchedules).map(([group, schedules]) => (
                  <div key={group} className="card bg-base-200">
                    <div className="card-body">
                      <h3 className="card-title"><Image src="/Emojis/Baby_emoji-Photoroom.png" alt="Baby Emoji" width={24} height={24} className="mr-2" /> {group} Room</h3>
                      <div className="space-y-4">
                        {schedules.map((schedule, index) => (
                          <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-base-100 rounded-lg">
                            <div className="flex-1">
                              <div className="font-bold">{schedule.name}</div>
                              <div className="text-sm opacity-70">
                                {schedule.startTime} - {schedule.endTime}
                              </div>
                            </div>
                            <div className="badge badge-primary">
                              Duration: {formatDuration(
                                (new Date(`2024-01-01T${schedule.endTime}`) - 
                                 new Date(`2024-01-01T${schedule.startTime}`)) / 1000 / 60
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="font-bold mb-2">Children in this group:</h4>
                        <div className="flex flex-wrap gap-2">
                          {(groupedChildren[group] || []).map(child => (
                            <span key={child.id} className="badge badge-ghost">
                              {child.firstName}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h4 className="card-title">🌙 Environment</h4>
                <p>Keep rooms dim, quiet, and at comfortable temperature (68-72°F)</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h4 className="card-title">⏰ Consistency</h4>
                <p>Try to maintain consistent nap times to help establish sleep patterns</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h4 className="card-title">🎵 Calming</h4>
                <p>Soft music or white noise can help children fall asleep faster</p>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h4 className="card-title"><Image src="/Emojis/Baby_emoji-Photoroom.png" alt="Baby Emoji" width={24} height={24} className="mr-2" /> Individual Needs</h4>
                <p>Some children may need longer or shorter naps - adjust as needed</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History View */}
      {activeView === 'history' && (
        <div className="space-y-6">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title"><Image src="/Emojis/Programs_emoji-Photoroom.png" alt="Programs Emoji" width={24} height={24} className="mr-2" /> Sleep History - {(() => {
                const dateParts = selectedDate.split('-');
                const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                return localDate.toLocaleDateString();
              })()}</h2>

              {napHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-lg mb-4">No nap records found for this date.</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => {
                      // Could add sample data creation here
                      console.log('Create sample nap data');
                    }}
                  >
                    <Image src="/Emojis/Programs_emoji-Photoroom.png" alt="Programs Emoji" width={20} height={20} className="mr-1" /> View Different Date
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="stats shadow">
                    <div className="stat">
                      <div className="stat-title">Total Naps</div>
                      <div className="stat-value">{napHistory.length}</div>
                    </div>
                    <div className="stat">
                      <div className="stat-title">Average Duration</div>
                      <div className="stat-value">
                        {formatDuration(
                          Math.round(
                            napHistory.reduce((sum, nap) => sum + (nap.duration || 0), 0) / 
                            napHistory.length
                          )
                        )}
                      </div>
                    </div>
                    <div className="stat">
                      <div className="stat-title">Quality Sleep</div>
                      <div className="stat-value">
                        {napHistory.filter(nap => 
                          nap.quality === 'excellent' || nap.quality === 'good'
                        ).length} / {napHistory.length}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {napHistory.map(nap => (
                      <div key={nap.id} className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                          <div className="flex justify-between items-center">
                            <h4 className="card-title">{nap.childName}</h4>
                            <span 
                              className={`badge badge-${nap.quality === 'excellent' ? 'success' : 
                                nap.quality === 'good' ? 'info' : 
                                nap.quality === 'fair' ? 'warning' : 'error'}`}
                            >
                              {nap.quality}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm opacity-70">
                                {nap.startTime} - {nap.endTime}
                              </span>
                              <span className="badge badge-ghost">
                                {formatDuration(nap.duration)}
                              </span>
                            </div>
                            {nap.napType && nap.napType !== 'regular' && (
                              <span className="badge badge-outline">{nap.napType}</span>
                            )}
                            {nap.environment && (
                              <span className="badge badge-ghost">{nap.environment}</span>
                            )}
                            {nap.notes && (
                              <p className="text-sm italic">{nap.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>


        </div>
      )}
    </div>
  );
}