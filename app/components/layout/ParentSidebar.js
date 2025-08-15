// components/layout/ParentSidebar.js (ENHANCED ACCESSIBILITY VERSION)
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../firebase/auth-context';
import Image from 'next/image';

const ParentSidebar = ({ isOpen, onClose }) => {
  const pathname = usePathname();
  const { logOut } = useAuth();
  const [expandedGroups, setExpandedGroups] = useState({});
  const sidebarRef = useRef(null);
  const closeButtonRef = useRef(null);
  
  // Define menu items with groups and metadata
  const menuItems = [
    {
      title: 'My Children',
      path: '/parent',
      icon: <Image src="/Emojis/Baby_emoji-Photoroom.png" alt="Baby Emoji" width={24} height={24} />
    },
    {
      title: 'Schedule',
      path: '/parent/schedules',
      icon: <Image src="/Emojis/Calendar_emoji-Photoroom.png" alt="Calendar Emoji" width={24} height={24} />
    },
    {
      title: 'Messages',
      path: '/parent/messages',
      icon: <Image src="/Emojis/Contact_emoji-Photoroom.png" alt="Contact Emoji" width={24} height={24} />
    },
    {
      title: 'Accounts',
      path: '/parent/accounts',
      icon: <Image src="/Emojis/Staff_emoji-Photoroom.png" alt="Staff Emoji" width={24} height={24} />
    },
    {
      title: 'Invoices',
      path: '/parent/invoices',
      icon: <Image src="/Emojis/Enroll_emoji-Photoroom.png" alt="Enroll Emoji" width={24} height={24} />
    }
  ];
  
  const otherItems = [
    { 
      title: 'Settings', 
      path: '/parent/settings',
      icon: <Image src="/Emojis/About_Emoji-Photoroom.png" alt="About Emoji" width={24} height={24} />
    },
    { 
      title: 'Account', 
      path: '/parent/account',
      icon: <Image src="/Emojis/Staff_emoji-Photoroom.png" alt="Staff Emoji" width={24} height={24} />
    },
    { 
      title: 'Help', 
      path: '/parent/help',
      icon: <Image src="/Emojis/QA_emoji-Photoroom.png" alt="Question Emoji" width={24} height={24} />
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
            onClick={() => onClose && onClose()}
          >
            <span className="text-xl" aria-hidden="true">{item.icon}</span>
            <div className="flex flex-col items-start">
              <span className="font-medium">{item.title}</span>
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
              Main Menu
            </h3>
            {renderMenuItems(menuItems, 'main-menu')}
          </div>
          
          {/* Support Section */}
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