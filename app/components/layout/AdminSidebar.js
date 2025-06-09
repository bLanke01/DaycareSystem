// components/layout/AdminSidebar.js
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';

const AdminSidebar = () => {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  // Define menu items
  const menuItems = [
    { icon: '📊', label: 'Dashboard', path: '/admin' },
    { icon: '📅', label: 'View Schedules & Calendar', path: '/admin/schedules' },
    { icon: '💰', label: 'Payment', path: '/admin/payment' },
    { icon: '💬', label: 'Message system', path: '/admin/messages' },
    { icon: '👶', label: 'Manage Children', path: '/admin/children' },
    { icon: '✓', label: 'Attendance', path: '/admin/attendance' },
    { icon: '📝', label: 'Activity Log', path: '/admin/activity-log' },
    { icon: '🍽️', label: 'Meals', path: '/admin/meals' },
    { icon: '😴', label: 'Nap Track', path: '/admin/nap-track' },
  ];
  
  const otherItems = [
    { icon: '⚙️', label: 'Settings', path: '/admin/settings' },
    { icon: '👤', label: 'Accounts', path: '/admin/accounts' },
    { icon: '❓', label: 'Help', path: '/admin/help' },
  ];
  
  // Check if a menu item is active
  const isActive = (path) => {
    return pathname === path;
  };

  useEffect(() => {
    const q = query(collection(db, 'messages'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let count = 0;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.recipient === 'Admin' && !data.read) {
          count += 1;
        }
      });
      setUnreadCount(count);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">D</div>
          <div className="logo-text">Daycare Management</div>
        </div>
      </div>
      
      <div className="sidebar-menu">
        <div className="menu-label">MENU</div>
        
        <ul className="menu-items">
          {menuItems.map((item, index) => (
            <li 
              key={index} 
              className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <Link href={item.path}>
                <div className="menu-link">
                  <div className="menu-icon">{item.icon}</div>
                  <div className="menu-text">{item.label}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
        
        <div className="menu-label">OTHERS</div>
        
        <ul className="menu-items">
          {otherItems.map((item, index) => (
            <li 
              key={index} 
              className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <Link href={item.path}>
                <div className="menu-link">
                  <div className="menu-icon">{item.icon}</div>
                  <div className="menu-text">{item.label}</div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="notification-bell">
        <span className="notification-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>
    </div>
  );
};

export default AdminSidebar;