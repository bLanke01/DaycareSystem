// app/admin/page.js
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../firebase/auth-context';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalChildren: 0,
    todayAttendance: 0,
    pendingInvoices: 0,
    todayEvents: 0,
    todayMealPlans: 0,
    activeNaps: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [todayMealPlans, setTodayMealPlans] = useState([]);
  const [activeNapSessions, setActiveNapSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReports, setShowReports] = useState(false);
  const [profilePicture, setProfilePicture] = useState('');

  // Load profile picture from Firestore
  useEffect(() => {
    const loadProfilePicture = async () => {
      if (!user?.uid) return;
      
      try {
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

  // Get user's display name or fallback to email
  const getUserDisplayName = () => {
    if (user?.displayName) {
      return user.displayName;
    } else if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    } else if (user?.firstName) {
      return user.firstName;
    } else if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Admin';
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);

        // 1. Fetch total children
        const childrenSnapshot = await getDocs(collection(db, 'children'));
        const totalChildren = childrenSnapshot.size;

        // 2. Fetch today's attendance
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = (() => {
          const year = today.getFullYear();
          const month = String(today.getMonth() + 1).padStart(2, '0');
          const day = String(today.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        })();

        // Get all attendance records and filter manually (more reliable)
        console.log('📋 Fetching all attendance records for filtering...');
        const attendanceSnapshot = await getDocs(collection(db, 'attendance'));

        let presentCount = 0;
        
        // Count present and late students (case insensitive)
        console.log('📋 Checking attendance records for:', todayStr);
        console.log('📋 Total attendance records found:', attendanceSnapshot.size);
        attendanceSnapshot.forEach(doc => {
          const data = doc.data();
          const attendanceDate = data.date;
          
          // Check if attendance is for today - handle multiple date formats
          let isToday = false;
          let attDateStr = 'Unknown';
          
          if (attendanceDate) {
            try {
              let attDate;
              
              // Handle different date formats
              if (typeof attendanceDate === 'string') {
                if (attendanceDate.includes('T')) {
                  // ISO string format: "2025-08-20T00:00:00.000Z"
                  attDate = new Date(attendanceDate);
                } else if (attendanceDate.includes('-')) {
                  // Date string format: "2025-08-20"
                  const parts = attendanceDate.split('-');
                  attDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                } else {
                  // Try parsing as regular date
                  attDate = new Date(attendanceDate);
                }
              } else if (attendanceDate instanceof Date) {
                attDate = attendanceDate;
              } else {
                // Firestore Timestamp object
                attDate = attendanceDate.toDate ? attendanceDate.toDate() : new Date(attendanceDate);
              }
              
              // Extract date string for comparison
              if (attDate && !isNaN(attDate.getTime())) {
                const year = attDate.getFullYear();
                const month = String(attDate.getMonth() + 1).padStart(2, '0');
                const day = String(attDate.getDate()).padStart(2, '0');
                attDateStr = `${year}-${month}-${day}`;
                isToday = attDateStr === todayStr;
              }
            } catch (error) {
              console.log(`❌ Error parsing date for ${data.childName || 'Unknown'}:`, error);
            }
            
            console.log(`📅 Attendance record: ${data.childName || 'Unknown'} - Date: ${attDateStr} (${isToday ? 'TODAY' : 'NOT TODAY'}) - Status: ${data.status}`);
          }
          
          if (isToday) {
            const status = data.status?.toLowerCase();
            if (status === 'present' || status === 'late') {
              presentCount++;
              console.log(`✅ Counted ${data.childName || 'Unknown'} as present`);
            }
          }
        });
        
        console.log(`📊 Total present today: ${presentCount}`);

        // 3. Fetch pending invoices (unpaid invoices)
        const invoicesSnapshot = await getDocs(collection(db, 'invoices'));
        let pendingInvoices = 0;
        
        console.log('💰 Checking invoices...');
        invoicesSnapshot.forEach(doc => {
          const invoice = doc.data();
          console.log(`📄 Invoice ${invoice.invoiceNo || doc.id}: Status = ${invoice.status}`);
          if (invoice.status === 'unpaid' || invoice.status === 'pending') {
            pendingInvoices++;
          }
        });
        
        console.log(`💳 Total pending invoices: ${pendingInvoices}`);

        // 4. Fetch today's meal plans
        let todayMealPlansCount = 0;
        const todayMealPlansData = [];
        try {
          const mealPlansSnapshot = await getDocs(collection(db, 'mealPlans'));
          console.log('🍽️ Checking meal plans for today:', todayStr);
          
          mealPlansSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.date === todayStr) {
              todayMealPlansCount++;
              todayMealPlansData.push({
                mealType: data.mealType,
                mainDish: data.mainDish,
                time: data.mealType === 'breakfast' ? '8:00 AM' :
                      data.mealType === 'morning-snack' ? '10:00 AM' :
                      data.mealType === 'lunch' ? '12:00 PM' :
                      data.mealType === 'afternoon-snack' ? '3:00 PM' :
                      '5:00 PM'
              });
            }
          });
          setTodayMealPlans(todayMealPlansData);
          console.log(`🍽️ Found ${todayMealPlansCount} meal plans for today`);
        } catch (error) {
          console.log('❌ Error fetching meal plans:', error);
        }

        // 5. Fetch active nap sessions
        let activeNapsCount = 0;
        const activeNapsData = [];
        try {
          const napSessionsSnapshot = await getDocs(collection(db, 'napSessions'));
          console.log('😴 Checking active nap sessions...');
          
          napSessionsSnapshot.forEach(doc => {
            const data = doc.data();
            // Check if nap session is active (sleeping status) and for today
            if (data.status === 'sleeping' && data.date && data.date.includes(todayStr)) {
              activeNapsCount++;
              activeNapsData.push({
                childName: data.childName,
                startTime: new Date(data.startTime).toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                }),
                duration: Math.floor((new Date() - new Date(data.startTime)) / 1000 / 60)
              });
            }
          });
          setActiveNapSessions(activeNapsData);
          console.log(`😴 Found ${activeNapsCount} active nap sessions`);
        } catch (error) {
          console.log('❌ Error fetching nap sessions:', error);
        }

        // Update dashboard data (will be updated again after fetching schedule)
        setDashboardData({
          totalChildren,
          todayAttendance: presentCount,
          pendingInvoices,
          todayMealPlans: todayMealPlansCount,
          activeNaps: activeNapsCount
        });

        // Debug logging
        console.log('🔍 Dashboard Data Updated:', {
          totalChildren,
          todayAttendance: presentCount,
          pendingInvoices,
          todayStr
        });

        // 6. Fetch today's schedule from calendar events
        try {
          const calendarEventsSnapshot = await getDocs(collection(db, 'calendarEvents'));
          const scheduleEvents = [];
          
          console.log('📅 Checking calendar events for today:', todayStr);
          console.log('📅 Total calendar events found:', calendarEventsSnapshot.size);
          
          calendarEventsSnapshot.forEach(doc => {
            const data = doc.data();
            console.log('📋 Processing event:', {
              title: data.title,
              start: data.start,
              category: data.category
            });
            
            // Handle both Date objects and ISO strings
            let eventStart;
            if (data.start instanceof Date) {
              eventStart = data.start;
            } else if (typeof data.start === 'string') {
              eventStart = new Date(data.start);
            } else {
              console.log('⚠️ Invalid start date format:', data.start);
              return;
            }
            
            // Fix date comparison to avoid timezone issues
            const eventYear = eventStart.getFullYear();
            const eventMonth = String(eventStart.getMonth() + 1).padStart(2, '0');
            const eventDay = String(eventStart.getDate()).padStart(2, '0');
            const eventDateStr = `${eventYear}-${eventMonth}-${eventDay}`;
            
            console.log(`📅 Event ${data.title}: ${eventDateStr} vs Today: ${todayStr}`);
            
            // Check if event is today
            if (eventDateStr === todayStr) {
              const eventTime = eventStart.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              });
              
              scheduleEvents.push({
                time: eventTime,
                activity: data.title,
                category: data.category
              });
              
              console.log(`✅ Found today's event: ${data.title} at ${eventTime}`);
            } else {
              console.log(`❌ Event ${data.title} is not today (${eventDateStr} != ${todayStr})`);
            }
          });
          
          // Sort events by time
          scheduleEvents.sort((a, b) => {
            const timeA = new Date('1970/01/01 ' + a.time);
            const timeB = new Date('1970/01/01 ' + b.time);
            return timeA - timeB;
          });
          
          console.log(`📊 Total events for today: ${scheduleEvents.length}`);
          setTodaySchedule(scheduleEvents);
          
          // Update dashboard data with today's events count
          setDashboardData({
            totalChildren,
            todayAttendance: presentCount,
            pendingInvoices,
            todayEvents: scheduleEvents.length,
            todayMealPlans: todayMealPlansCount,
            activeNaps: activeNapsCount
          });
          
        } catch (error) {
          console.log('❌ Error fetching calendar events:', error);
          setTodaySchedule([]);
          
          // Update dashboard data with 0 events
          setDashboardData({
            totalChildren,
            todayAttendance: presentCount,
            pendingInvoices,
            todayEvents: 0,
            todayMealPlans: todayMealPlansCount,
            activeNaps: activeNapsCount
          });
        }

        // 7. Fetch recent activities from multiple sources
        const activities = [];
        
        try {
          // Try to get from activities collection first
          const activitiesSnapshot = await getDocs(collection(db, 'activities'));
          activitiesSnapshot.forEach(doc => {
            const data = doc.data();
            const activityDate = new Date(data.createdAt || data.date || Date.now());
            activities.push({
              id: doc.id,
              time: activityDate.toLocaleTimeString(),
              date: activityDate.toLocaleDateString(),
              activity: data.title || data.description || 'Activity recorded',
              timestamp: activityDate
            });
          });
        } catch (error) {
          console.log('Activities collection not found, checking other sources...');
        }

        // If no activities, get recent attendance changes as activities
        if (activities.length === 0) {
          try {
            const recentAttendance = await getDocs(collection(db, 'attendance'));
            const attendanceActivities = [];
            
            recentAttendance.forEach(doc => {
              const data = doc.data();
              if (data.updatedAt) {
                const updateDate = new Date(data.updatedAt);
                attendanceActivities.push({
                  id: doc.id,
                  time: updateDate.toLocaleTimeString(),
                  date: updateDate.toLocaleDateString(),
                  activity: `${data.childName || 'Student'} marked ${data.status}`,
                  timestamp: updateDate
                });
              }
            });
            
            // Sort by timestamp and take the 5 most recent
            attendanceActivities.sort((a, b) => b.timestamp - a.timestamp);
            activities.push(...attendanceActivities.slice(0, 5));
          } catch (error) {
            console.log('Could not fetch attendance activities:', error);
          }
        }

        // If still no activities, add some default ones
        if (activities.length === 0) {
          const now = new Date();
          activities.push(
            {
              id: '1',
              time: now.toLocaleTimeString(),
              date: now.toLocaleDateString(),
              activity: 'Dashboard initialized'
            }
          );
        }

        // Sort all activities by timestamp and take the 5 most recent
        activities.sort((a, b) => (b.timestamp || new Date()) - (a.timestamp || new Date()));
        setRecentActivities(activities.slice(0, 5));

        setLoading(false);
      } catch (error) {
        console.error('Error in fetchDashboardData:', error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Refresh data every minute
    const intervalId = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const printReports = () => {
    const printWindow = window.open('', '_blank');
    const today = (() => {
      const date = new Date();
      return date.toLocaleDateString();
    })();
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Daycare Daily Report - ${today}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 30px; }
            .section h3 { color: #2563eb; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 20px; }
            .stat-item { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
            .activity-item { padding: 10px 0; border-bottom: 1px solid #eee; }
            .schedule-item { padding: 10px 0; border-bottom: 1px solid #eee; }
            .time-badge { background: #e0e7ff; color: #3730a3; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            @media print { body { margin: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Daycare Daily Report</h1>
            <p><strong>Date:</strong> ${today}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="section">
            <h3>Today's Summary</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-value">${dashboardData.totalChildren}</div>
                <div>Total Children</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${dashboardData.todayAttendance}</div>
                <div>Present Today</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${dashboardData.pendingInvoices}</div>
                <div>Pending Invoices</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${dashboardData.todayEvents}</div>
                <div>Today's Events</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${dashboardData.todayMealPlans}</div>
                <div>Today's Meals</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">${dashboardData.activeNaps}</div>
                <div>Active Naps</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h3>Recent Activities</h3>
            ${recentActivities.length > 0 ? 
              recentActivities.map(activity => `
                <div class="activity-item">
                  <strong>${activity.date} at ${activity.time}</strong> - ${activity.activity}
                </div>
              `).join('') : 
              '<p>No recent activities</p>'
            }
          </div>
          
          <div class="section">
            <h3>Today's Schedule</h3>
            ${todaySchedule.map(item => `
              <div class="schedule-item">
                <span class="time-badge">${item.time}</span>
                <span style="margin-left: 10px;">${item.activity}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 40px;">
            <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer;">
              Print Report
            </button>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <span className="loading loading-spinner loading-lg text-primary" aria-label="Loading dashboard"></span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-primary to-primary-focus flex items-center justify-center shadow-lg">
              {profilePicture ? (
                <img 
                  src={profilePicture} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-primary-content">
                  {getUserDisplayName().charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Welcome back, {getUserDisplayName()}! 👋
              </h1>
              <p className="text-base-content/70 text-lg">
                Here's what's happening at your daycare today
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            className="btn btn-primary btn-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            onClick={() => setShowReports(!showReports)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
            </svg>
            {showReports ? 'Hide Reports' : 'View Reports'}
          </button>
        </div>
      </div>

      {/* Quick Actions - Moved to top for easy access */}
      <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-xl border border-base-300 hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
        <div className="card-body p-6">
          <h2 className="card-title text-xl mb-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="/admin/children" className="btn btn-outline btn-primary h-auto py-4 flex flex-col gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
              </svg>
              <span className="text-xs font-semibold">Manage Children</span>
            </a>
            <a href="/admin/attendance" className="btn btn-outline btn-success h-auto py-4 flex flex-col gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-xs font-semibold">Mark Attendance</span>
            </a>
            <a href="/admin/messages" className="btn btn-outline btn-info h-auto py-4 flex flex-col gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
              </svg>
              <span className="text-xs font-semibold">Send Message</span>
            </a>
            <a href="/admin/invoices" className="btn btn-outline btn-info h-auto py-4 flex flex-col gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
              <span className="text-xs font-semibold">Manage Invoices</span>
            </a>
          </div>
        </div>
      </div>

      {/* Today's Summary Report */}
      {showReports && (
        <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-2xl border border-base-300 transform transition-all duration-300">
          <div className="card-body p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="card-title text-2xl text-primary flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd"/>
                  </svg>
                </div>
                Today's Summary Report
              </h2>
              <button 
                className="btn btn-outline btn-primary btn-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                onClick={printReports}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v3h6v-3z" clipRule="evenodd"/>
                </svg>
                Print Report
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
              <div className="stat bg-gradient-to-br from-primary/10 to-primary/20 p-6 rounded-xl text-center border border-primary/30 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                <div className="stat-value text-primary text-3xl font-bold">{dashboardData.totalChildren}</div>
                <div className="stat-title text-sm font-semibold">Total Children</div>
              </div>
              <div className="stat bg-gradient-to-br from-success/10 to-success/20 p-6 rounded-xl text-center border border-success/30 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                <div className="stat-value text-success text-3xl font-bold">{dashboardData.todayAttendance}</div>
                <div className="stat-title text-sm font-semibold">Present Today</div>
              </div>
              <div className="stat bg-gradient-to-br from-warning/10 to-warning/20 p-6 rounded-xl text-center border border-warning/30 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                <div className="stat-value text-warning text-3xl font-bold">{dashboardData.pendingInvoices}</div>
                <div className="stat-title text-sm font-semibold">Pending Invoices</div>
              </div>
              <div className="stat bg-gradient-to-br from-secondary/10 to-secondary/20 p-6 rounded-xl text-center border border-secondary/30 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                <div className="stat-value text-secondary text-3xl font-bold">{dashboardData.todayEvents}</div>
                <div className="stat-title text-sm font-semibold">Today's Events</div>
              </div>
              <div className="stat bg-gradient-to-br from-info/10 to-info/20 p-6 rounded-xl text-center border border-info/30 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                <div className="stat-value text-info text-3xl font-bold">{dashboardData.todayMealPlans}</div>
                <div className="stat-title text-sm font-semibold">Today's Meals</div>
              </div>
              <div className="stat bg-gradient-to-br from-accent/10 to-accent/20 p-6 rounded-xl text-center border border-accent/30 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                <div className="stat-value text-accent text-3xl font-bold">{dashboardData.activeNaps}</div>
                <div className="stat-title text-sm font-semibold">Active Naps</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gradient-to-br from-base-100 to-base-200 p-6 rounded-xl border border-base-300 shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-primary flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  Recent Activities
                </h3>
                <div className="space-y-3">
                  {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-base-100/50 rounded-lg border border-base-200 hover:bg-base-100 transition-all duration-200">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex flex-col items-center justify-center border border-primary/20">
                        <span className="text-primary text-xs font-bold">
                          {activity.time.split(':')[0]}:{activity.time.split(':')[1]}
                        </span>
                        <span className="text-primary text-xs opacity-70">
                          {activity.date}
                        </span>
                      </div>
                      <span className="text-sm font-medium">{activity.activity}</span>
                    </div>
                  )) : (
                    <p className="text-base-content/70 text-sm text-center py-4">No recent activities</p>
                  )}
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-base-100 to-base-200 p-6 rounded-xl border border-base-300 shadow-lg">
                <h3 className="text-xl font-bold mb-4 text-secondary flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-secondary" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  Today's Schedule
                </h3>
                <div className="space-y-3">
                  {todaySchedule.map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-base-100/50 rounded-lg border border-base-200 hover:bg-base-100 transition-all duration-200">
                      <div className="w-24 text-center py-2 bg-secondary/10 rounded-lg border border-secondary/20 shadow-sm">
                        <span className="text-secondary font-bold text-sm">{item.time}</span>
                      </div>
                      <span className="text-sm font-medium">{item.activity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="stats shadow-xl bg-gradient-to-br from-base-100 to-base-200 border border-base-300 hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="stat place-items-center py-8">
            <div className="stat-figure text-primary">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                </svg>
              </div>
            </div>
            <div className="stat-title text-sm font-semibold">Total Children</div>
            <div className="stat-value text-primary text-3xl font-bold">{dashboardData.totalChildren}</div>
            <div className="stat-desc">Active Enrollments</div>
          </div>
        </div>

        <div className="stats shadow-xl bg-gradient-to-br from-base-100 to-base-200 border border-base-300 hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="stat place-items-center py-8">
            <div className="stat-figure text-success">
              <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center border border-success/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
            <div className="stat-title text-sm font-semibold">Today's Attendance</div>
            <div className="stat-value text-success text-3xl font-bold">{dashboardData.todayAttendance}</div>
            <div className="stat-desc">Present Today</div>
          </div>
        </div>

        <div className="stats shadow-xl bg-gradient-to-br from-base-100 to-base-200 border border-base-300 hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="stat place-items-center py-8">
            <div className="stat-figure text-warning">
              <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center border border-warning/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
              </div>
            </div>
            <div className="stat-title text-sm font-semibold">Pending Invoices</div>
            <div className="stat-value text-warning text-3xl font-bold">{dashboardData.pendingInvoices}</div>
            <div className="stat-desc">Awaiting Payment</div>
          </div>
        </div>

        <div className="stats shadow-xl bg-gradient-to-br from-base-100 to-base-200 border border-base-300 hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="stat place-items-center py-8">
            <div className="stat-figure text-secondary">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center border border-secondary/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
            <div className="stat-title text-sm font-semibold">Today's Events</div>
            <div className="stat-value text-secondary text-3xl font-bold">{dashboardData.todayEvents}</div>
            <div className="stat-desc">Scheduled Activities</div>
          </div>
        </div>

        <div className="stats shadow-xl bg-gradient-to-br from-base-100 to-base-200 border border-base-300 hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="stat place-items-center py-8">
            <div className="stat-figure text-info">
              <div className="w-12 h-12 rounded-full bg-info/20 flex items-center justify-center border border-info/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 1a1 1 0 011-1h2a1 1 0 011 1v1h4a2 2 0 012 2v1a1 1 0 01-1 1h-1v9a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 01-1-1V4a2 2 0 012-2h4V1z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
            <div className="stat-title text-sm font-semibold">Today's Meals</div>
            <div className="stat-value text-info text-3xl font-bold">{dashboardData.todayMealPlans}</div>
            <div className="stat-desc">Planned Meals</div>
          </div>
        </div>

        <div className="stats shadow-xl bg-gradient-to-br from-base-100 to-base-200 border border-base-300 hover:shadow-2xl transform hover:scale-105 transition-all duration-300">
          <div className="stat place-items-center py-8">
            <div className="stat-figure text-accent">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0v-.5A1.5 1.5 0 0114.5 6c.526 0 .988-.27 1.256-.679a6.012 6.012 0 011.912 2.706A8.003 8.003 0 0110 18a8.003 8.003 0 01-5.668-2.327z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
            <div className="stat-title text-sm font-semibold">Active Naps</div>
            <div className="stat-value text-accent text-3xl font-bold">{dashboardData.activeNaps}</div>
            <div className="stat-desc">Currently Sleeping</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
        {/* Recent Activities */}
        <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-xl border border-base-300 hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
          <div className="card-body p-8">
            <h2 className="card-title text-2xl mb-8 text-primary flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
              </div>
              Recent Activities
            </h2>
            <div className="space-y-4">
              {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-base-100/50 rounded-xl border border-base-200 hover:bg-base-100 hover:shadow-lg transition-all duration-200">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex flex-col items-center justify-center border border-primary/20">
                      <span className="text-primary text-sm font-bold">
                        {activity.time.split(':')[0]}:{activity.time.split(':')[1]}
                      </span>
                      <span className="text-primary text-xs opacity-70">
                        {activity.date}
                      </span>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <p className="text-base-content font-semibold">{activity.activity}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-base-content/70 text-lg">No recent activities</p>
                </div>
              )}
            </div>
            <div className="card-actions justify-end mt-8">
              <a href="/admin/activity-log" className="btn btn-primary btn-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                View All Activities
              </a>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-xl border border-base-300 hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
          <div className="card-body p-8">
            <h2 className="card-title text-2xl mb-8 text-secondary flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center border border-secondary/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                </svg>
              </div>
              Today's Schedule
            </h2>
            <div className="space-y-4">
              {todaySchedule.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-base-100/50 rounded-xl border border-base-200 hover:bg-base-100 hover:shadow-lg transition-all duration-200">
                  <div className="flex-shrink-0">
                    <div className="w-28 text-center py-3 bg-secondary/10 rounded-xl border border-secondary/20 shadow-sm">
                      <span className="text-secondary font-bold text-sm">{item.time}</span>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <p className="text-base-content font-semibold">{item.activity}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="card-actions justify-end mt-8">
              <a href="/admin/schedules" className="btn btn-secondary btn-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                View Full Schedule
              </a>
            </div>
          </div>
        </div>

        {/* Today's Meal Plans */}
        <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-xl border border-base-300 hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
          <div className="card-body p-8">
            <h2 className="card-title text-2xl mb-8 text-info flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-info/20 flex items-center justify-center border border-info/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8 1a1 1 0 011-1h2a1 1 0 011 1v1h4a2 2 0 012 2v1a1 1 0 01-1 1h-1v9a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 01-1-1V4a2 2 0 012-2h4V1z" clipRule="evenodd"/>
                </svg>
              </div>
              Today's Meals
            </h2>
            <div className="space-y-4">
              {todayMealPlans.length > 0 ? todayMealPlans.map((meal, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-base-100/50 rounded-xl border border-base-200 hover:bg-base-100 hover:shadow-lg transition-all duration-200">
                  <div className="flex-shrink-0">
                    <div className="w-20 text-center py-3 bg-info/10 rounded-xl border border-info/20 shadow-sm">
                      <span className="text-info font-bold text-sm">{meal.time}</span>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <p className="text-base-content font-semibold capitalize">{meal.mealType.replace('-', ' ')}</p>
                    <p className="text-sm text-base-content/70">{meal.mainDish}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🍽️</div>
                  <p className="text-base-content/70 text-lg">No meals planned</p>
                </div>
              )}
            </div>
            <div className="card-actions justify-end mt-8">
              <a href="/admin/meals" className="btn btn-info btn-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                Manage Meals
              </a>
            </div>
          </div>
        </div>

        {/* Active Nap Sessions */}
        <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-xl border border-base-300 hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
          <div className="card-body p-8">
            <h2 className="card-title text-2xl mb-8 text-accent flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0v-.5A1.5 1.5 0 0114.5 6c.526 0 .988-.27 1.256-.679a6.012 6.012 0 011.912 2.706A8.003 8.003 0 0110 18a8.003 8.003 0 01-5.668-2.327z" clipRule="evenodd"/>
                </svg>
              </div>
              Active Naps
            </h2>
            <div className="space-y-4">
              {activeNapSessions.length > 0 ? activeNapSessions.map((nap, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-base-100/50 rounded-xl border border-base-200 hover:bg-base-100 hover:shadow-lg transition-all duration-200">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-accent/10 flex flex-col items-center justify-center border border-accent/20">
                      <span className="text-accent text-xs font-bold">😴</span>
                      <span className="text-accent text-xs">{nap.duration}m</span>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <p className="text-base-content font-semibold">{nap.childName}</p>
                    <p className="text-sm text-base-content/70">Started at {nap.startTime}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">😴</div>
                  <p className="text-base-content/70 text-lg">No active naps</p>
                </div>
              )}
            </div>
            <div className="card-actions justify-end mt-8">
              <a href="/admin/nap-track" className="btn btn-accent btn-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
                Manage Naps
              </a>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}