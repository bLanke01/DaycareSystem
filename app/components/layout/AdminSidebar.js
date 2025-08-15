// components/layout/AdminSidebar.js (ENHANCED ACCESSIBILITY VERSION)
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../firebase/auth-context';

const AdminSidebar = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { logOut } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState({});
  const sidebarRef = useRef(null);
  const closeButtonRef = useRef(null);
  
  // Define menu items with groups and metadata
  const menuItems = [
    { 
      icon: '📊', 
      label: 'Dashboard', 
      path: '/admin',
      description: 'View overview and statistics'
    },
    { 
      icon: '📅', 
      label: 'Schedules & Calendar', 
      path: '/admin/schedules',
      description: 'Manage schedules and events'
    },
    { 
      icon: '💰', 
      label: 'Invoices', 
      path: '/admin/invoices',
      description: 'Manage billing and payments'
    },
    { 
      icon: '💬', 
      label: 'Messages', 
      path: '/admin/messages',
      description: 'Communicate with parents'
    },
    { 
      icon: '👶', 
      label: 'Manage Children', 
      path: '/admin/children',
      description: 'Add and manage children profiles'
    },
  ];

  const childRecordsItems = [
    { 
      icon: '✓', 
      label: 'Attendance', 
      path: '/admin/attendance',
      description: 'Track daily attendance'
    },
    { 
      icon: '📝', 
      label: 'Activity Log', 
      path: '/admin/activity-log',
      description: 'Record child activities and development'
    },
    { 
      icon: '🍽️', 
      label: 'Meals', 
      path: '/admin/meals',
      description: 'Track meal consumption'
    },
    { 
      icon: '😴', 
      label: 'Nap Tracking', 
      path: '/admin/nap-track',
      description: 'Monitor nap times and quality'
    },
  ];
  
  const otherItems = [
    { 
      icon: '⚙️', 
      label: 'Settings', 
      path: '/admin/settings',
      description: 'Configure system settings'
    },
    { 
      icon: '👤', 
      label: 'Account', 
      path: '/admin/account',
      description: 'Manage your profile'
    },
    { 
      icon: '❓', 
      label: 'Help', 
      path: '/admin/help',
      description: 'Get help and support'
    },
  ];

  // Check if a menu item is active
  const isActive = (path) => {
    return pathname === path;
  };

  // Handle keyboard navigation
  const handleKeyDown = (e, action) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        action();
        break;
      case 'Escape':
        if (onClose) {
          onClose();
        }
        break;
    }
  };

  // Handle expand/collapse of groups
  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  // Handle logout
  const handleLogout = async () => {
    const { success } = await logOut();
    if (success && onClose) {
      onClose();
    }
  };

  // Focus management for mobile
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // Trap focus within sidebar when open on mobile
  useEffect(() => {
    if (!isOpen) return;

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      const focusableElements = sidebarRef.current?.querySelectorAll(
        'a[href], button, [tabindex]:not([tabindex="-1"])'
      );
      
      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const renderMenuItems = (items, groupName = null) => (
    <ul className="menu menu-sm" role="group" aria-labelledby={groupName ? `${groupName}-heading` : undefined}>
      {items.map((item, index) => (
        <li key={item.path} role="none">
          <Link 
            href={item.path}
            className={`flex items-center gap-3 py-3 px-3 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              isActive(item.path) 
                ? 'active bg-primary text-primary-content shadow-md' 
                : 'hover:bg-base-300 focus:bg-base-300'
            }`}
            role="menuitem"
            aria-current={isActive(item.path) ? 'page' : undefined}
            aria-describedby={`${item.path.replace(/\//g, '-')}-desc`}
            onClick={() => onClose && onClose()}
          >
            <span className="text-xl flex-shrink-0" aria-hidden="true">{item.icon}</span>
            <span className="font-medium flex-1">{item.label}</span>
            <span className="sr-only" id={`${item.path.replace(/\//g, '-')}-desc`}>
              {item.description}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="drawer-side z-40">
      <label 
        htmlFor="admin-drawer" 
        className="drawer-overlay"
        aria-label="Close sidebar"
        onClick={onClose}
      ></label>
      
      <aside 
        ref={sidebarRef}
        className="bg-base-200 w-80 min-h-screen shadow-xl"
        role="navigation"
        aria-label="Admin navigation sidebar"
      >
        {/* Header */}
        <div className="p-4 bg-base-100 border-b border-base-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary text-primary-content flex items-center justify-center text-xl font-bold">
                <span aria-hidden="true">D</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold">Daycare Management</span>
                <span className="text-sm text-base-content/70">Admin Panel</span>
              </div>
            </div>
            
            {/* Close button for mobile */}
            <button
              ref={closeButtonRef}
              className="btn btn-sm btn-ghost lg:hidden"
              onClick={onClose}
              aria-label="Close navigation sidebar"
              onKeyDown={(e) => handleKeyDown(e, onClose)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Navigation Menu */}
        <nav className="px-4 py-6 overflow-y-auto" role="menubar" aria-label="Admin navigation menu">
          {/* Main Menu Section */}
          <div className="mb-6">
            <h3 
              id="main-menu-heading"
              className="px-3 text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-3"
            >
              Main Menu
            </h3>
            {renderMenuItems(menuItems, 'main-menu')}
          </div>
          
          {/* Child Records Section - Collapsible */}
          <div className="mb-6">
            <button
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-base-content/50 uppercase tracking-wider hover:text-base-content transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              onClick={() => toggleGroup('childRecords')}
              aria-expanded={expandedGroups.childRecords || false}
              aria-controls="child-records-menu"
              onKeyDown={(e) => handleKeyDown(e, () => toggleGroup('childRecords'))}
            >
              <span id="child-records-heading">Child Records</span>
              <svg 
                className={`w-4 h-4 transition-transform ${expandedGroups.childRecords ? 'rotate-90' : ''}`}
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            <div 
              id="child-records-menu"
              className={`mt-2 transition-all duration-200 ${
                expandedGroups.childRecords ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'
              }`}
              aria-hidden={!expandedGroups.childRecords}
            >
              {renderMenuItems(childRecordsItems, 'child-records')}
            </div>
          </div>
          
          {/* Other Section */}
          <div className="mb-6">
            <h3 
              id="other-menu-heading"
              className="px-3 text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-3"
            >
              Other
            </h3>
            {renderMenuItems(otherItems, 'other-menu')}
          </div>

          {/* Logout Button */}
          <div className="pt-4 border-t border-base-300">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 py-3 px-3 rounded-lg text-error hover:bg-error/10 focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2 transition-all duration-200"
              role="menuitem"
              aria-label="Log out of admin account"
              onKeyDown={(e) => handleKeyDown(e, handleLogout)}
            >
              <span className="text-xl" aria-hidden="true">🚪</span>
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </nav>
      </aside>
    </div>
  );
};

export default AdminSidebar;