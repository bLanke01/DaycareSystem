'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { getAuth } from "firebase/auth";
import { useRouter } from 'next/navigation';

export default function ParentDashboardLayout({ children }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [parentName, setParentName] = useState("");
  const router = useRouter();
  
  // Get logged-in parent name/email/uid
  useEffect(() => {
    const auth = getAuth();
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setParentName(user.displayName || user.email || user.uid);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Listen for unread messages for this parent
  useEffect(() => {
    if (!parentName) return;
    const q = query(collection(db, 'messages'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let count = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.recipient === parentName && !data.read) {
          count += 1;
        }
      });
      setUnreadCount(count);
    });
    return () => unsubscribe();
  }, [parentName]);
  
  const handleSearch = (e) => {
    e.preventDefault();
    // Search functionality would be implemented here
    console.log('Searching for:', searchQuery);
  };
  
  const handleLogout = () => {
    // Logout functionality would be implemented here with Firebase
    console.log('Logging out');
    router.push('/');
  };
  
  return (
    <div className="dashboard-layout">
      <header className="dashboard-header">
        <div className="dashboard-title">Parents Dashboard</div>
      </header>
      
      <div className="dashboard-container">
        <aside className="dashboard-sidebar">
          <div className="sidebar-logo">
            <div className="logo-circle">D</div>
            <span className="logo-text">Daycare Management</span>
          </div>
          
          <nav className="sidebar-nav">
            <div className="nav-section">
              <div className="section-header">MENU</div>
              <ul className="nav-items">
                <li className="nav-item active">
                  <Link href="/parent">
                    <div className="nav-link">
                      <div className="nav-icon">👶</div>
                      <span>Child Profile</span>
                    </div>
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link href="/parent/schedules">
                    <div className="nav-link">
                      <div className="nav-icon">📅</div>
                      <span>View Schedules & Calendar</span>
                    </div>
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link href="/parent/payment">
                    <div className="nav-link">
                      <div className="nav-icon">💰</div>
                      <span>Make Payment</span>
                    </div>
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link href="/parent/messages">
                    <div className="nav-link" style={{ display: 'flex', alignItems: 'center' }}>
                      <div className="nav-icon">💬</div>
                      <span>Message system</span>
                      {unreadCount > 0 && (
                        <span style={{
                          marginLeft: 8,
                          background: 'red',
                          color: 'white',
                          borderRadius: '50%',
                          padding: '2px 8px',
                          fontSize: 12,
                          fontWeight: 'bold',
                          lineHeight: 1,
                          display: 'inline-block'
                        }}>
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              </ul>
            </div>
            
            <div className="nav-section">
              <div className="section-header">OTHERS</div>
              <ul className="nav-items">
                <li className="nav-item">
                  <Link href="/parent/settings">
                    <div className="nav-link">
                      <div className="nav-icon">⚙️</div>
                      <span>Settings</span>
                    </div>
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link href="/parent/account">
                    <div className="nav-link">
                      <div className="nav-icon">👤</div>
                      <span>Accounts</span>
                    </div>
                  </Link>
                </li>
                
                <li className="nav-item">
                  <Link href="/parent/help">
                    <div className="nav-link">
                      <div className="nav-icon">❓</div>
                      <span>Help</span>
                    </div>
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </aside>
        
        <main className="dashboard-main">
          <div className="main-header">
            <div className="search-bar">
              <form onSubmit={handleSearch}>
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="search-btn">
                  <span className="search-icon">🔍</span>
                </button>
              </form>
            </div>
            
            <div className="user-menu">
              <div className="notification-bell">
                <Link href="/parent/messages" style={{ textDecoration: 'none' }}>
                  <span className="notification-icon" style={{ cursor: 'pointer' }}>🔔</span>
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </Link>
              </div>
              
              <div className="user-profile">
                <span className="user-name">Delicious Burger</span>
                <div className="user-avatar">🍔</div>
              </div>
            </div>
          </div>
          
          <div className="main-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}