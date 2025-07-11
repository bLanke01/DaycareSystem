// app/admin/page.js
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState({
    totalChildren: 0,
    todayAttendance: 0,
    pendingInvoices: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        <div>
          <h1 className="text-3xl font-bold text-base-content mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-base-content/70">
            Here's what's happening at your daycare today
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="btn btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
            </svg>
            View Reports
          </button>
          <button className="btn btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
            </svg>
            New Entry
          </button>
        </div>
      </div>

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
        <div className="stats shadow-lg bg-base-100 border border-base-300">
          <div className="stat place-items-center py-6">
            <div className="stat-figure text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
              </svg>
            </div>
            <div className="stat-title text-sm">Total Children</div>
            <div className="stat-value text-primary text-2xl">{dashboardData.totalChildren}</div>
            <div className="stat-desc">Active Enrollments</div>
          </div>
        </div>

        <div className="stats shadow-lg bg-base-100 border border-base-300">
          <div className="stat place-items-center py-6">
            <div className="stat-figure text-success">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="stat-title text-sm">Today's Attendance</div>
            <div className="stat-value text-success text-2xl">{dashboardData.todayAttendance}</div>
            <div className="stat-desc">Present Today</div>
          </div>
        </div>

        <div className="stats shadow-lg bg-base-100 border border-base-300">
          <div className="stat place-items-center py-6">
            <div className="stat-figure text-warning">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="stat-title text-sm">Pending Invoices</div>
            <div className="stat-value text-warning text-2xl">{dashboardData.pendingInvoices}</div>
            <div className="stat-desc">Awaiting Payment</div>
          </div>
        </div>

        <div className="stats shadow-lg bg-base-100 border border-base-300">
          <div className="stat place-items-center py-6">
            <div className="stat-figure text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
              </svg>
            </div>
            <div className="stat-title text-sm">Today's Events</div>
            <div className="stat-value text-secondary text-2xl">{todaySchedule.length}</div>
            <div className="stat-desc">Scheduled Activities</div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Recent Activities */}
        <div className="card bg-base-100 shadow-lg border border-base-300">
          <div className="card-body p-6">
            <h2 className="card-title text-xl mb-6 text-primary flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
              </svg>
              Recent Activities
            </h2>
            <div className="space-y-4">
              {recentActivities.length > 0 ? recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-base-200/50 rounded-lg hover:bg-base-200 transition-all duration-200">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary text-sm font-medium">
                        {activity.time.split(':')[0]}:{activity.time.split(':')[1]}
                      </span>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <p className="text-base-content font-medium">{activity.activity}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">📝</div>
                  <p className="text-base-content/70">No recent activities</p>
                </div>
              )}
            </div>
            <div className="card-actions justify-end mt-6">
              <a href="/admin/activity-log" className="btn btn-primary btn-sm">
                View All Activities
              </a>
            </div>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="card bg-base-100 shadow-lg border border-base-300">
          <div className="card-body p-6">
            <h2 className="card-title text-xl mb-6 text-secondary flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
              </svg>
              Today's Schedule
            </h2>
            <div className="space-y-4">
              {todaySchedule.map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-4 bg-base-200/50 rounded-lg hover:bg-base-200 transition-all duration-200">
                  <div className="flex-shrink-0">
                    <div className="w-24 text-center py-2 bg-secondary/10 rounded-lg border border-secondary/20">
                      <span className="text-secondary font-medium text-sm">{item.time}</span>
                    </div>
                  </div>
                  <div className="flex-grow">
                    <p className="text-base-content font-medium">{item.activity}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="card-actions justify-end mt-6">
              <a href="/admin/schedules" className="btn btn-secondary btn-sm">
                View Full Schedule
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card bg-base-100 shadow-lg border border-base-300">
        <div className="card-body p-6">
          <h2 className="card-title text-xl mb-6 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <a href="/admin/children" className="btn btn-outline btn-primary h-auto py-4 flex flex-col gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
              </svg>
              <span className="text-sm">Manage Children</span>
            </a>
            <a href="/admin/attendance" className="btn btn-outline btn-success h-auto py-4 flex flex-col gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm">Mark Attendance</span>
            </a>
            <a href="/admin/messages" className="btn btn-outline btn-info h-auto py-4 flex flex-col gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm">Send Message</span>
            </a>
            <a href="/admin/invoices" className="btn btn-outline btn-warning h-auto py-4 flex flex-col gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
              <span className="text-sm">Manage Invoices</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}