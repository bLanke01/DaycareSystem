// components/layout/ParentSidebar.js (ENHANCED ACCESSIBILITY VERSION)
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../firebase/auth-context';

const ParentSidebar = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { logOut } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState({});
  const sidebarRef = useRef(null);
  const closeButtonRef = useRef(null);
  
  // Define menu items with groups and metadata
  const menuItems = [
    { 
      icon: '👶', 
      label: 'Child Profile', 
      path: '/parent',
      description: 'View your child\'s overview and recent activities'
    },
    { 
      icon: '📝', 
      label: 'Activity Log', 
      path: '/parent/activity-log',
      description: 'View detailed activity logs and development tracking'
    },
    { 
      icon: '📅', 
      label: 'Schedules', 
      path: '/parent/schedules',
      description: 'View your child\'s daily schedule and events'
    },
    { 
      icon: '🍽️', 
      label: 'Meals', 
      path: '/parent/meals',
      description: 'Track your child\'s meal consumption'
    },
    { 
      icon: '✓', 
      label: 'Attendance', 
      path: '/parent/attendance',
      description: 'View attendance records and check-in times'
    },
    { 
      icon: '💬', 
      label: 'Messages', 
      path: '/parent/messages',
      description: 'Communicate with teachers and staff'
    },
  ];

  const managementItems = [
    { 
      icon: '👥', 
      label: 'Manage Children', 
      path: '/parent/manage-children',
      description: 'Update your children\'s information'
    },
    { 
      icon: '💰', 
      label: 'Invoices', 
      path: '/parent/invoices',
      description: 'View and pay invoices'
    },
  ];
  
  const otherItems = [
    { 
      icon: '⚙️', 
      label: 'Settings', 
      path: '/parent/settings',
      description: 'Configure your account preferences'
    },
    { 
      icon: '👤', 
      label: 'Account', 
      path: '/parent/account',
      description: 'Manage your profile information'
    },
    { 
      icon: '❓', 
      label: 'Help', 
      path: '/parent/help',
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
            <span className="text-xl" aria-hidden="true">{item.icon}</span>
            <div className="flex flex-col items-start">
              <span className="font-medium">{item.label}</span>
              <span className="sr-only" id={`${item.path.replace(/\//g, '-')}-desc`}>
                {item.description}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="drawer-side z-40">
      <label 
        htmlFor="parent-drawer" 
        className="drawer-overlay"
        aria-label="Close sidebar"
        onClick={onClose}
      ></label>
      
      <aside 
        ref={sidebarRef}
        className="bg-base-200 w-80 min-h-screen shadow-xl"
        role="navigation"
        aria-label="Parent navigation sidebar"
      >
        {/* Header */}
        <div className="p-4 bg-base-100 border-b border-base-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary text-secondary-content flex items-center justify-center text-xl font-bold">
                <span aria-hidden="true">D</span>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-semibold">Daycare Management</span>
                <span className="text-sm text-base-content/70">Parent Portal</span>
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
        <nav className="px-4 py-6 overflow-y-auto" role="menubar" aria-label="Parent navigation menu">
          {/* Main Menu Section */}
          <div className="mb-6">
            <h3 
              id="main-menu-heading"
              className="px-3 text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-3"
            >
              Child Information
            </h3>
            {renderMenuItems(menuItems, 'main-menu')}
          </div>
          
          {/* Management Section - Collapsible */}
          <div className="mb-6">
            <button
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-base-content/50 uppercase tracking-wider hover:text-base-content transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              onClick={() => toggleGroup('management')}
              aria-expanded={expandedGroups.management || false}
              aria-controls="management-menu"
              onKeyDown={(e) => handleKeyDown(e, () => toggleGroup('management'))}
            >
              <span id="management-heading">Account Management</span>
              <svg 
                className={`w-4 h-4 transition-transform ${expandedGroups.management ? 'rotate-90' : ''}`}
                fill="currentColor" 
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            <div 
              id="management-menu"
              className={`mt-2 transition-all duration-200 ${
                expandedGroups.management ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 overflow-hidden'
              }`}
              aria-hidden={!expandedGroups.management}
            >
              {renderMenuItems(managementItems, 'management')}
            </div>
          </div>
          
          {/* Other Section */}
          <div className="mb-6">
            <h3 
              id="other-menu-heading"
              className="px-3 text-xs font-semibold text-base-content/50 uppercase tracking-wider mb-3"
            >
              Support
            </h3>
            {renderMenuItems(otherItems, 'other-menu')}
          </div>

          {/* Logout Button */}
          <div className="pt-4 border-t border-base-300">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 py-3 px-3 rounded-lg text-error hover:bg-error/10 focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2 transition-all duration-200"
              role="menuitem"
              aria-label="Log out of parent account"
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

export default ParentSidebar;