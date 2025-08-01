'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../firebase/auth-context';
import { withAuth } from '../utils/with-auth';
import AdminSidebar from '../components/layout/AdminSidebar';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import SearchSystem from '../components/admin/SearchSystem';
import ChildDetailsModal from '../components/admin/ChildDetailsModal';

const AdminDashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showChildModal, setShowChildModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();
  const pathname = usePathname();
  const { user, logOut } = useAuth();
  
  const handleLogout = async () => {
    const { success, error } = await logOut();
    if (success) {
      router.push('/');
    } else if (error) {
      console.error('Logout error:', error);
    }
  };

  const handleChildClick = (child) => {
    setSelectedChild(child);
    setShowChildModal(true);
    setActiveTab('overview');
  };

  const handleCloseChildModal = () => {
    setShowChildModal(false);
    setSelectedChild(null);
  };

  // Close sidebar when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  // Get page title from pathname
  const getPageTitle = () => {
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length <= 1) return 'Dashboard';
    
    const pageMap = {
      'children': 'Children Management',
      'activity-log': 'Activity Log',
      'messages': 'Messages',
      'schedules': 'Schedules',
      'meals': 'Meal Planning',
      'nap-track': 'Nap Tracking',
      'attendance': 'Attendance',
      'invoices': 'Invoices',
      'settings': 'Settings',
      'account': 'Account',
      'help': 'Help Center'
    };
    
    const lastSegment = pathSegments[pathSegments.length - 1];
    return pageMap[lastSegment] || lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300">
      {/* Skip Links */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-primary text-primary-content px-4 py-2 rounded-md"
      >
        Skip to main content
      </a>
      
      <a 
        href="#admin-navigation" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-32 focus:z-50 bg-primary text-primary-content px-4 py-2 rounded-md"
      >
        Skip to navigation
      </a>

      {/* Enhanced Drawer Layout */}
      <div className="drawer lg:drawer-open">
        <input 
          id="admin-drawer" 
          type="checkbox" 
          className="drawer-toggle" 
          checked={sidebarOpen}
          onChange={(e) => setSidebarOpen(e.target.checked)}
        />
        
        {/* Main Content Area */}
        <div className="drawer-content flex flex-col">
          {/* Enhanced Top Navigation Bar */}
          <header className="navbar bg-base-100 shadow-lg border-b border-base-300 min-h-16 py-2" role="banner">
            <div className="flex-none lg:hidden">
              <button 
                className="btn btn-square btn-ghost drawer-button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={sidebarOpen}
                aria-controls="admin-navigation"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  className="inline-block w-5 h-5 stroke-current"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                </svg>
              </button>
            </div>
            
            {/* Logo and Title Section */}
            <div className="flex-1 px-3">
              
            </div>

            {/* Center Search */}
            <div className="flex-none hidden lg:block">
              <SearchSystem className="w-72" onChildClick={handleChildClick} />
            </div>

            {/* Right Actions */}
            <div className="flex-none flex items-center gap-2 px-3">
              {/* Notifications */}
              <div className="dropdown dropdown-end">
                <button 
                  tabIndex={0} 
                  className="btn btn-ghost btn-circle indicator"
                  aria-label="View notifications"
                  aria-haspopup="true"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="badge badge-xs badge-primary indicator-item">1</span>
                </button>
                <ul 
                  tabIndex={0} 
                  className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-base-100 rounded-box w-64 border border-base-300"
                  role="menu"
                  aria-label="Notifications menu"
                >
                  <li className="menu-title">
                    <span>Notifications</span>
                  </li>
                  <li role="none">
                    <a role="menuitem" className="flex items-start gap-3 py-3">
                      <div className="avatar placeholder">
                        <div className="bg-info text-info-content rounded-full w-8 h-8">
                          <span className="text-xs">💬</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">New message from parent</p>
                      </div>
                    </a>
                  </li>
                  <li role="none">
                    <Link href="/admin/messages" role="menuitem" className="text-sm text-primary">
                      View all notifications →
                    </Link>
                  </li>
                </ul>
              </div>

              {/* User Menu */}
              <div className="dropdown dropdown-end">
                <button 
                  tabIndex={0} 
                  className="btn btn-ghost btn-circle avatar"
                  aria-label={`User menu for ${user?.email || 'admin'}`}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-content flex items-center justify-center ring-1 ring-primary ring-offset-1 ring-offset-base-100">
                    <span className="text-sm font-bold">
                      {user?.email?.charAt(0).toUpperCase() || 'A'}
                    </span>
                  </div>
                </button>
                <ul 
                  tabIndex={0} 
                  className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-base-100 rounded-box w-52 border border-base-300"
                  role="menu"
                  aria-label="User account menu"
                >
                  <li className="menu-title">
                    <span className="truncate">{user?.email}</span>
                  </li>
                  <li role="none">
                    <Link href="/admin/account" role="menuitem" className="flex items-center gap-2">
                      <span>👤</span>
                      <span>Profile</span>
                    </Link>
                  </li>
                  <li role="none">
                    <Link href="/admin/settings" role="menuitem" className="flex items-center gap-2">
                      <span>⚙️</span>
                      <span>Settings</span>
                    </Link>
                  </li>
                  <li role="none">
                    <Link href="/admin/help" role="menuitem" className="flex items-center gap-2">
                      <span>❓</span>
                      <span>Help</span>
                    </Link>
                  </li>
                  <div className="divider my-1"></div>
                  <li role="none">
                    <button onClick={handleLogout} role="menuitem" className="text-error flex items-center gap-2">
                      <span>🚪</span>
                      <span>Logout</span>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </header>

          {/* Page Title Bar */}
          <div className="bg-base-100 border-b border-base-300 px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold text-base-content">{getPageTitle()}</h2>
                <Breadcrumbs className="text-sm" />
              </div>
              
              {/* Mobile Search */}
              <div className="sm:hidden">
                <SearchSystem className="w-60" onChildClick={handleChildClick} />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-6" role="main" id="main-content">
            {/* Page Content with enhanced styling */}
            <div className="bg-base-100 rounded-xl shadow-lg border border-base-300 p-6 min-h-[calc(100vh-16rem)]">
              {children}
            </div>
          </main>
        </div>

                {/* Enhanced Sidebar */}
        <AdminSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          id="admin-navigation"
        />
      </div>

      {/* Child Details Modal */}
      {showChildModal && selectedChild && (
        <ChildDetailsModal 
          child={selectedChild}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={handleCloseChildModal}
        />
      )}
    </div>
  );
};
  
export default withAuth(AdminDashboardLayout, 'admin');