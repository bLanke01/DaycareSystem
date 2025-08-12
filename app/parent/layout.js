'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../firebase/auth-context';
import { withAuth } from '../utils/with-auth';
import ParentSidebar from '../components/layout/ParentSidebar';
import Breadcrumbs from '../components/layout/Breadcrumbs';
import ParentChildDetailsModal from '../components/parent/ParentChildDetailsModal';
import NotificationBell from '../components/shared/NotificationBell';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

const ParentDashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showChildModal, setShowChildModal] = useState(false);
  const [profilePicture, setProfilePicture] = useState('');
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

  // Get page title from pathname
  const getPageTitle = () => {
    const pathSegments = pathname.split('/').filter(Boolean);
    if (pathSegments.length <= 1) return 'Dashboard';
    
    const pageMap = {
      'manage-children': 'My Children',
      'messages': 'Messages',
      'schedules': 'Schedules',
      'meals': 'Meal Plans',
      'invoices': 'Invoices',
      'settings': 'Settings',
      'account': 'Account',
      'help': 'Help Center'
    };
    
    const lastSegment = pathSegments[pathSegments.length - 1];
    return pageMap[lastSegment] || lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Skip Links */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-secondary text-secondary-content px-4 py-2 rounded-md"
      >
        Skip to main content
      </a>
      
      <a 
        href="#parent-navigation" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-32 focus:z-50 bg-secondary text-secondary-content px-4 py-2 rounded-md"
      >
        Skip to navigation
      </a>

      {/* Enhanced Drawer Layout */}
      <div className="drawer lg:drawer-open">
        <input 
          id="parent-drawer" 
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
                aria-controls="parent-navigation"
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
              
            </div>

            {/* Right Actions */}
            <div className="flex-none flex items-center gap-3 px-3">
              {/* Notification Bell */}
              <NotificationBell />

              {/* User Menu */}
              <div className="dropdown dropdown-end">
                <button 
                  tabIndex={0} 
                  className="btn btn-ghost btn-circle avatar hover:scale-110 transition-transform duration-200 group"
                  aria-label={`User menu for ${user?.displayName || user?.email || 'parent'}`}
                  aria-haspopup="true"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden gradient-primary text-primary-content flex items-center justify-center ring-2 ring-primary ring-offset-2 ring-offset-base-100 shadow-xl group-hover:shadow-2xl transition-all duration-300">
                    {profilePicture ? (
                      <img 
                        src={profilePicture} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-bold">
                        {user?.displayName?.charAt(0).toUpperCase() || user?.firstName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'P'}
                      </span>
                    )}
                  </div>
                </button>
                <ul 
                  tabIndex={0} 
                  className="menu menu-sm dropdown-content mt-3 z-[1] p-3 shadow-2xl bg-gradient-to-br from-base-100 to-base-200 rounded-xl w-64 border border-base-300 backdrop-blur-sm"
                  role="menu"
                  aria-label="User account menu"
                >
                  <li className="menu-title mb-2">
                    <div className="flex flex-col items-start gap-1 p-2 bg-base-200/50 rounded-lg border border-base-300">
                      <span className="text-sm font-bold text-base-content truncate w-full">
                        {user?.displayName || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.firstName) || 'Parent User'}
                      </span>
                      <span className="text-xs text-base-content/70 truncate w-full">{user?.email}</span>
                    </div>
                  </li>
                  <li role="none" className="my-1">
                    <Link href="/parent/account" role="menuitem" className="flex items-center gap-3 p-3 rounded-lg hover:bg-primary/10 hover:text-primary transition-all duration-200">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-primary text-sm">👤</span>
                      </div>
                      <span className="font-medium">Profile</span>
                    </Link>
                  </li>
                  <li role="none" className="my-1">
                    <Link href="/parent/settings" role="menuitem" className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/10 hover:text-secondary transition-all duration-200">
                      <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                        <span className="text-secondary text-sm">⚙️</span>
                      </div>
                      <span className="font-medium">Settings</span>
                    </Link>
                  </li>
                  <li role="none" className="my-1">
                    <Link href="/parent/help" role="menuitem" className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/10 hover:text-accent transition-all duration-200">
                      <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                        <span className="text-accent text-sm">❓</span>
                      </div>
                      <span className="font-medium">Help</span>
                    </Link>
                  </li>
                  <div className="divider my-2"></div>
                  <li role="none">
                    <button 
                      onClick={handleLogout} 
                      role="menuitem" 
                      className="text-error flex items-center gap-3 p-3 rounded-lg hover:bg-error/10 transition-all duration-200 w-full"
                    >
                      <div className="w-8 h-8 rounded-full bg-error/20 flex items-center justify-center">
                        <span className="text-error text-sm">🚪</span>
                      </div>
                      <span className="font-medium">Logout</span>
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </header>

          {/* Page Title Bar */}
          <div className="bg-base-100 border-b border-base-300 px-4 lg:px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl lg:text-2xl font-bold text-base-content">{getPageTitle()}</h2>
                <Breadcrumbs className="text-sm" />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="flex-1 p-4 lg:p-6" role="main" id="main-content">
            {/* Page Content with enhanced styling */}
            <div className="bg-base-200 rounded-xl shadow-lg border-4 border-primary p-6 min-h-[calc(100vh-16rem)]">
              {children}
            </div>
          </main>
        </div>

                {/* Enhanced Sidebar */}
        <ParentSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)}
          id="parent-navigation"
        />
      </div>

      {/* Child Details Modal */}
      <ParentChildDetailsModal 
        child={selectedChild}
        isOpen={showChildModal}
        onClose={handleCloseChildModal}
      />
    </div>
  );
};
  
export default withAuth(ParentDashboardLayout, 'parent');