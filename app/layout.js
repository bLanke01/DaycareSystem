// app/layout.js (ENHANCED ACCESSIBILITY VERSION)
'use client';

import './globals.css';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Footer from './components/layout/Footer';
import { AuthProvider, useAuth } from './firebase/auth-context';
import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Professional daycare management system for families and administrators" />
      </head>
      <body>
        <AuthProvider>
          <MainContent>{children}</MainContent>
        </AuthProvider>
      </body>
    </html>
  );
}

function MainContent({ children }) {
  const { user, userRole, loading, adminSetupComplete } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [redirecting, setRedirecting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check admin setup on load - but be more specific about when to redirect
  useEffect(() => {
    // Skip this check for admin-setup page to avoid infinite loops
    if (pathname === '/admin-setup') {
      setRedirecting(false);
      return;
    }
    
    const checkAndRedirect = async () => {
      if (!loading && adminSetupComplete === false) {
        const isAdminDashboard = pathname.startsWith('/admin') && pathname !== '/admin-setup';
        const isJustTryingToLogin = pathname.startsWith('/auth');
        const isAlreadyAdmin = user && userRole === 'admin';
        
        if (isAdminDashboard && !isAlreadyAdmin) {
          console.log('Redirecting to admin setup - dashboard access without admin user');
          setRedirecting(true);
          router.push('/admin-setup');
        } else {
          setRedirecting(false);
        }
      } else {
        setRedirecting(false);
      }
    };

    checkAndRedirect();
  }, [loading, adminSetupComplete, router, pathname, user, userRole]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Handle escape key for mobile menu
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  // If we're still loading auth or redirecting, show loading
  if (loading || redirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-live="polite">
        <span className="loading loading-spinner loading-lg text-primary" aria-label="Loading application"></span>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  // If user is logged in, don't show the header/footer on dashboard pages
  if (user && (userRole === 'admin' || userRole === 'parent')) {
    const isAdminPage = pathname.startsWith('/admin');
    const isParentPage = pathname.startsWith('/parent');
    
    if (isAdminPage || isParentPage) {
      return (
        <>
          <Toaster position="top-right" />
          {children}
        </>
      );
    }
  }

  // Navigation items for easier management
  const navigationItems = [
    { href: '/', label: 'Home', isActive: pathname === '/' },
    { href: '/location', label: 'Location', isActive: pathname === '/location' },
    { href: '/program', label: 'Program', isActive: pathname === '/program' },
    { href: '/contact', label: 'Contact', isActive: pathname === '/contact' },
    { href: '/about', label: 'About', isActive: pathname === '/about' },
    { href: '/faq', label: 'FAQ', isActive: pathname === '/faq' }
  ];

  // Otherwise, show the public layout with header and footer
  return (
    <div className="min-h-screen flex flex-col">
      {/* Skip Links for Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-primary text-primary-content px-4 py-2 rounded-md"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            document.getElementById('main-content')?.focus();
          }
        }}
      >
        Skip to main content
      </a>
      
      <a 
        href="#navigation" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-32 focus:z-50 bg-primary text-primary-content px-4 py-2 rounded-md"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            document.getElementById('navigation')?.focus();
          }
        }}
      >
        Skip to navigation
      </a>

      <Toaster position="top-right" />
      
      {/* Header with improved accessibility */}
      <header className="bg-base-100 shadow-md" role="banner">
        <nav className="navbar container mx-auto" role="navigation" aria-label="Main navigation" id="navigation">
          {/* Mobile menu button */}
          <div className="navbar-start">
            <div className="dropdown">
              <button 
                tabIndex={0} 
                role="button" 
                className="btn btn-ghost lg:hidden"
                aria-label={mobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setMobileMenuOpen(!mobileMenuOpen);
                  }
                }}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-5 w-5" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
              </button>
              
              {/* Mobile dropdown menu */}
              <ul 
                tabIndex={0} 
                className={`menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 ${
                  mobileMenuOpen ? 'block' : 'hidden'
                }`}
                id="mobile-menu"
                role="menu"
                aria-label="Mobile navigation menu"
              >
                {navigationItems.map((item, index) => (
                  <li key={item.href} role="none">
                    <Link 
                      href={item.href}
                      className={`${item.isActive ? 'active bg-primary text-primary-content' : ''}`}
                      role="menuitem"
                      aria-current={item.isActive ? 'page' : undefined}
                      tabIndex={mobileMenuOpen ? 0 : -1}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Logo */}
            <Link 
              href="/" 
              className="btn btn-ghost text-xl"
              aria-label="Daycare Management - Go to homepage"
            >
              <span aria-hidden="true">🏠</span>
              Daycare Management
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal px-1" role="menubar">
              {navigationItems.map((item) => (
                <li key={item.href} role="none">
                  <Link 
                    href={item.href}
                    className={`${item.isActive ? 'active bg-primary text-primary-content' : ''}`}
                    role="menuitem"
                    aria-current={item.isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* User actions */}
          <div className="navbar-end gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <div className="text-sm" aria-label={`Logged in as ${user.email}`}>
                  <span className="sr-only">Welcome, </span>
                  <span className="hidden sm:inline">Welcome, </span>
                  {user.email}
                </div>
                <button 
                  onClick={() => useAuth().logOut()} 
                  className="btn btn-ghost"
                  aria-label="Log out of your account"
                >
                  Logout
                </button>
                {userRole === 'admin' ? (
                  <Link 
                    href="/admin" 
                    className="btn btn-primary"
                    aria-label="Go to Admin Dashboard"
                  >
                    <span className="hidden sm:inline">Admin Dashboard</span>
                    <span className="sm:hidden">Admin</span>
                  </Link>
                ) : (
                  <Link 
                    href="/parent" 
                    className="btn btn-primary"
                    aria-label="Go to Parent Dashboard"
                  >
                    <span className="hidden sm:inline">Parent Dashboard</span>
                    <span className="sm:hidden">Parent</span>
                  </Link>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link 
                  href="/auth" 
                  className="btn btn-ghost"
                  aria-label="Log in to your account"
                >
                  Login
                </Link>
                <Link 
                  href="/auth" 
                  className="btn btn-primary"
                  aria-label="Create a new account"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </nav>
      </header>
      
      {/* Main content with proper landmarks */}
      <main 
        className="flex-grow container mx-auto px-4 py-8" 
        role="main" 
        id="main-content"
        tabIndex={-1}
        aria-label="Main content"
      >
        {children}
      </main>
      
      <Footer />
    </div>
  );
}