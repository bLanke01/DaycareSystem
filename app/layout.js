// app/layout.js (ENHANCED ACCESSIBILITY VERSION)
'use client';

import './globals.css';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Footer from './components/layout/Footer';
import Header from './components/layout/Header';
import { AuthProvider, useAuth } from './firebase/auth-context';
import { Toaster } from "react-hot-toast";

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="val">
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

  // Otherwise, show the public layout with modern header and footer
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
      
      {/* Modern Header Component */}
      <Header />
      
      {/* Main content with proper landmarks */}
      <main 
        className="flex-grow" 
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