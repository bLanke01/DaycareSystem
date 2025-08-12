// app/admin/page.js
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit, Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../firebase/auth-context';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    totalChildren: 0,
    todayAttendance: 0,
    pendingInvoices: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
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
        const todayStr = today.toISOString().split('T')[0];

        // Get all attendance records for today
        const attendanceQuery = query(
          collection(db, 'attendance'),
          where('date', '>=', todayStr + 'T00:00:00.000Z'),
          where('date', '<=', todayStr + 'T23:59:59.999Z')
        );

        const attendanceSnapshot = await getDocs(attendanceQuery);
        let presentCount = 0;
        
        // Count present and late students (case insensitive)
        attendanceSnapshot.forEach(doc => {
          const status = doc.data().status?.toLowerCase();
          if (status === 'present' || status === 'late') {
            presentCount++;
          }
        });

        // 3. Fetch pending invoices
        const invoicesQuery = query(
          collection(db, 'invoices'),
          where('status', '==', 'pending')
        );
        const invoicesSnapshot = await getDocs(invoicesQuery);
        const pendingInvoices = invoicesSnapshot.size;

        // Update dashboard data
        setDashboardData({
          totalChildren,
          todayAttendance: presentCount,
          pendingInvoices
        });

        // 4. Fetch today's schedule
        const scheduleQuery = query(
          collection(db, 'events'),
          where('date', '>=', Timestamp.fromDate(today)),
          where('date', '<=', Timestamp.fromDate(new Date(today.getTime() + 24 * 60 * 60 * 1000)))
        );
        
        const scheduleSnapshot = await getDocs(scheduleQuery);
        const scheduleEvents = [];
        
        if (scheduleSnapshot.empty) {
          // Use default schedule if no custom schedule is set
          setTodaySchedule([
            { time: '09:00 AM', activity: 'Morning Circle Time' },
            { time: '10:30 AM', activity: 'Outdoor Play' },
            { time: '12:00 PM', activity: 'Lunch Time' },
            { time: '01:00 PM', activity: 'Nap Time' },
            { time: '03:00 PM', activity: 'Afternoon Snack' },
            { time: '03:30 PM', activity: 'Structured Activities' },
            { time: '05:00 PM', activity: 'Free Play & Pick-up' }
          ]);
        } else {
          scheduleSnapshot.forEach(doc => {
            const data = doc.data();
            scheduleEvents.push({
              time: data.time,
              activity: data.title || data.description
            });
          });
          // Sort events by time
          scheduleEvents.sort((a, b) => {
            return new Date('1970/01/01 ' + a.time) - new Date('1970/01/01 ' + b.time);
          });
          setTodaySchedule(scheduleEvents);
        }

        // 5. Fetch recent activities
        const activitiesQuery = query(
          collection(db, 'activities'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        
        const activitiesSnapshot = await getDocs(activitiesQuery);
        const activities = [];
        
        activitiesSnapshot.forEach(doc => {
          const data = doc.data();
          activities.push({
            id: doc.id,
            time: new Date(data.createdAt || data.date || Date.now()).toLocaleTimeString(),
            activity: data.title || data.description || 'Activity recorded'
          });
        });

        setRecentActivities(activities);

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
    const today = new Date().toLocaleDateString();
    
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
                <div class="stat-value">${todaySchedule.length}</div>
                <div>Today's Events</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <h3>Recent Activities</h3>
            ${recentActivities.length > 0 ? 
              recentActivities.map(activity => `
                <div class="activity-item">
                  <strong>${activity.time}</strong> - ${activity.activity}
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
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
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
                <div className="stat-value text-secondary text-3xl font-bold">{todaySchedule.length}</div>
                <div className="stat-title text-sm font-semibold">Today's Events</div>
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
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                        <span className="text-primary text-sm font-bold">
                          {activity.time.split(':')[0]}:{activity.time.split(':')[1]}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div className="stat-value text-secondary text-3xl font-bold">{todaySchedule.length}</div>
            <div className="stat-desc">Scheduled Activities</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
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
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                      <span className="text-primary text-sm font-bold">
                        {activity.time.split(':')[0]}:{activity.time.split(':')[1]}
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
      </div>

      {/* Quick Actions */}
      <div className="card bg-gradient-to-br from-base-100 to-base-200 shadow-xl border border-base-300 hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300">
        <div className="card-body p-8">
          <h2 className="card-title text-2xl mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center border border-accent/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <a href="/admin/children" className="btn btn-outline btn-primary h-auto py-6 flex flex-col gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
              </svg>
              <span className="text-sm font-semibold">Manage Children</span>
            </a>
            <a href="/admin/attendance" className="btn btn-outline btn-success h-auto py-6 flex flex-col gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm font-semibold">Mark Attendance</span>
            </a>
            <a href="/admin/messages" className="btn btn-outline btn-info h-auto py-6 flex flex-col gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm font-semibold">Send Message</span>
            </a>
            <a href="/admin/invoices" className="btn btn-outline btn-warning h-auto py-6 flex flex-col gap-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm font-semibold">Manage Invoices</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}