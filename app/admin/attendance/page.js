// app/admin/attendance/page.js - Attendance Sheet Design
'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

export default function AttendancePage() {
  const [children, setChildren] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    // Fix date issue by using local date instead of UTC
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [filterGroup, setFilterGroup] = useState('All');

  // Load children and attendance data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load all children
        const childrenSnapshot = await getDocs(
          query(collection(db, 'children'), orderBy('firstName'))
        );
        
        const childrenList = [];
        childrenSnapshot.forEach(doc => {
          childrenList.push({ id: doc.id, ...doc.data() });
        });
        
        setChildren(childrenList);
        
        // Load attendance for selected date
        const attendanceSnapshot = await getDocs(
          query(
            collection(db, 'attendance'),
            where('date', '>=', selectedDate + 'T00:00:00.000Z'),
            where('date', '<=', selectedDate + 'T23:59:59.999Z')
          )
        );
        
        const todayAttendance = {};
        attendanceSnapshot.forEach(doc => {
          const data = doc.data();
          todayAttendance[data.childId] = {
            id: doc.id,
            ...data
          };
        });
        
        setAttendanceData(todayAttendance);
        
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedDate]);

  // Update attendance status
  const updateAttendanceStatus = async (childId, status) => {
    setSaving(true);
    
    try {
      const child = children.find(c => c.id === childId);
      const attendanceId = `${childId}_${selectedDate}`;
      
      const attendanceRecord = {
        childId,
        childName: `${child.firstName} ${child.lastName}`,
        date: new Date(selectedDate).toISOString(),
        status,
        arrivalTime: status === 'present' || status === 'late' ? 
          new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
        departureTime: null,
        notes: '',
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin'
      };
      
      await setDoc(doc(db, 'attendance', attendanceId), attendanceRecord);
      
      // Update local state
      setAttendanceData(prev => ({
        ...prev,
        [childId]: { id: attendanceId, ...attendanceRecord }
      }));
      
    } catch (error) {
      console.error('Error updating attendance:', error);
      alert('Failed to update attendance');
    } finally {
      setSaving(false);
    }
  };

  // Print attendance sheet
  const printAttendanceSheet = () => {
    const printWindow = window.open('', '_blank');
    // Fix date formatting by using local date instead of UTC
    const dateParts = selectedDate.split('-');
    const localDate = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
    const selectedDateFormatted = localDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    // Calculate stats for the selected date
    const presentCount = filteredChildren.filter(child => attendanceData[child.id]?.status === 'present').length;
    const lateCount = filteredChildren.filter(child => attendanceData[child.id]?.status === 'late').length;
    const absentCount = filteredChildren.filter(child => attendanceData[child.id]?.status === 'absent').length;
    const totalCount = filteredChildren.length;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Attendance Sheet - ${selectedDateFormatted}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #333;
            }
            .header { 
              text-align: center; 
              border-bottom: 3px solid #2563eb; 
              padding-bottom: 20px; 
              margin-bottom: 30px; 
            }
            .header h1 {
              margin: 0;
              color: #2563eb;
              font-size: 28px;
            }
            .header p {
              margin: 5px 0;
              font-size: 16px;
              color: #666;
            }
            .stats {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin-bottom: 30px;
              text-align: center;
            }
            .stat-card {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #e9ecef;
            }
            .stat-value {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .stat-label {
              font-size: 14px;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .present { color: #16a34a; }
            .late { color: #ea580c; }
            .absent { color: #dc2626; }
            .total { color: #2563eb; }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 30px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 12px 8px; 
              text-align: left; 
            }
            th { 
              background: #f8f9fa; 
              font-weight: bold;
              color: #333;
            }
            tr:nth-child(even) { 
              background: #f9f9f9; 
            }
            .status-badge {
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .status-present { background: #dcfce7; color: #16a34a; }
            .status-late { background: #fed7aa; color: #ea580c; }
            .status-absent { background: #fecaca; color: #dc2626; }
            .status-unmarked { background: #f3f4f6; color: #6b7280; }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 14px;
            }
            @media print { 
              body { margin: 0; } 
              .no-print { display: none; } 
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>TinyLog Daycare</h1>
            <p><strong>Daily Attendance Sheet</strong></p>
            <p><strong>Date:</strong> ${selectedDateFormatted}</p>
            <p><strong>Group:</strong> ${filterGroup === 'All' ? 'All Groups' : filterGroup}</p>
            <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="stats">
            <div class="stat-card">
              <div class="stat-value total">${totalCount}</div>
              <div class="stat-label">Total Children</div>
            </div>
            <div class="stat-card">
              <div class="stat-value present">${presentCount}</div>
              <div class="stat-label">Present</div>
            </div>
            <div class="stat-card">
              <div class="stat-value late">${lateCount}</div>
              <div class="stat-label">Late</div>
            </div>
            <div class="stat-card">
              <div class="stat-value absent">${absentCount}</div>
              <div class="stat-label">Absent</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th>Child Name</th>
                <th>Child ID</th>
                <th>Age Group</th>
                <th>Age</th>
                <th>Status</th>
                <th>Arrival Time</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${filteredChildren.map((child, index) => {
                const attendance = attendanceData[child.id];
                const status = attendance?.status || 'unmarked';
                const arrivalTime = attendance?.arrivalTime || '-';
                const age = child.dateOfBirth ? (() => {
                  const today = new Date();
                  const birthDate = new Date(child.dateOfBirth);
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
                })() : 'Unknown';
                
                return `
                  <tr>
                    <td>${index + 1}</td>
                    <td><strong>${child.firstName} ${child.lastName}</strong></td>
                    <td>#${child.id.slice(-6)}</td>
                    <td>${child.group || 'N/A'}</td>
                    <td>${age}</td>
                    <td>
                      <span class="status-badge status-${status}">
                        ${status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </td>
                    <td>${arrivalTime}</td>
                    <td>${attendance?.notes || ''}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>TinyLog Daycare Management System</p>
            <p>21 Everdige Court SW, Calgary, Alberta | (403) 542-5531</p>
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 40px;">
            <button onclick="window.print()" style="padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 16px;">
              Print Attendance Sheet
            </button>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
  };

  // Filter children by group
  const filteredChildren = children.filter(child => 
    filterGroup === 'All' || child.group === filterGroup
  );

  // Calculate age for grouping
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'Unknown';
    
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

  if (loading) {
    return (
      <div className="min-h-screen bg-base-200 flex justify-center items-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-base-content">
          <span className="text-primary">Daily</span> Attendance
        </h1>
        
        {/* Filter Controls */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="admin-form-grid">
              <div className="admin-form-control">
                <label className="label">
                  <span className="label-text">Age Group</span>
                </label>
                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value)}
                  className="select select-bordered w-full"
                >
                  <option value="All">All Groups</option>
                  <option value="Infant">Infant</option>
                  <option value="Toddler">Toddler</option>
                  <option value="Pre-K">Pre-K</option>
                </select>
              </div>
              
              <div className="admin-form-control">
                <label className="label">
                  <span className="label-text">Date</span>
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input input-bordered w-full"
                />
              </div>
              
              <div className="admin-form-control">
                <label className="label">
                  <span className="label-text">Actions</span>
                </label>
                <button 
                  className="btn btn-primary w-full"
                  onClick={printAttendanceSheet}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v3h6v-3z" clipRule="evenodd" />
                  </svg>
                  Print Sheet
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Sheet */}
        <div className="card bg-base-100 shadow-xl overflow-x-auto">
          <div className="card-body p-0">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th className="bg-base-200">
                    <label>
                      <input type="checkbox" className="checkbox" />
                    </label>
                  </th>
                  <th className="bg-base-200">#</th>
                  <th className="bg-base-200">Child Name</th>
                  <th className="bg-base-200">Child ID</th>
                  <th className="bg-base-200">Age</th>
                  <th className="bg-base-200">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredChildren.map((child, index) => {
                  const attendance = attendanceData[child.id];
                  const status = attendance?.status;
                  
                  return (
                    <tr key={child.id} className="hover">
                      <td>
                        <label>
                          <input type="checkbox" className="checkbox" />
                        </label>
                      </td>
                      <td>{index + 1}</td>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="avatar placeholder">
                            <div className="bg-neutral-focus text-neutral-content rounded-full w-8">
                              <span>{child.gender === 'Female' ? '👧' : '👦'}</span>
                            </div>
                          </div>
                          <div>
                            <div className="font-bold">{child.firstName} {child.lastName}</div>
                            <div className="text-sm opacity-50">{child.group}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="badge badge-ghost">#{child.id.slice(-6)}</div>
                      </td>
                      <td>{calculateAge(child.dateOfBirth)}</td>
                      <td>
                        <div className="join">
                          <button
                            className={`btn btn-sm join-item ${status === 'present' ? 'btn-success' : 'btn-ghost'}`}
                            onClick={() => updateAttendanceStatus(child.id, 'present')}
                            disabled={saving}
                          >
                            Present
                          </button>
                          <button
                            className={`btn btn-sm join-item ${status === 'late' ? 'btn-warning' : 'btn-ghost'}`}
                            onClick={() => updateAttendanceStatus(child.id, 'late')}
                            disabled={saving}
                          >
                            Late
                          </button>
                          <button
                            className={`btn btn-sm join-item ${status === 'absent' ? 'btn-error' : 'btn-ghost'}`}
                            onClick={() => updateAttendanceStatus(child.id, 'absent')}
                            disabled={saving}
                          >
                            Absent
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total Children</div>
            <div className="stat-value">{filteredChildren.length}</div>
            <div className="stat-desc">In selected group</div>
          </div>
          
          <div className="stat">
            <div className="stat-title">Present</div>
            <div className="stat-value text-success">
              {filteredChildren.filter(child => attendanceData[child.id]?.status === 'present').length}
            </div>
            <div className="stat-desc text-success">On time</div>
          </div>
          
          <div className="stat">
            <div className="stat-title">Late</div>
            <div className="stat-value text-warning">
              {filteredChildren.filter(child => attendanceData[child.id]?.status === 'late').length}
            </div>
            <div className="stat-desc text-warning">Arrived late</div>
          </div>
          
          <div className="stat">
            <div className="stat-title">Absent</div>
            <div className="stat-value text-error">
              {filteredChildren.filter(child => attendanceData[child.id]?.status === 'absent').length}
            </div>
            <div className="stat-desc text-error">Not present</div>
          </div>
        </div>


      </div>
    </div>
  );
}