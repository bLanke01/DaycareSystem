// app/layout.js (updated to avoid immediate redirection)
'use client';

import './globals.css';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Footer from './components/layout/Footer';
import { AuthProvider, useAuth } from './firebase/auth-context';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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

  // Check admin setup on load - but only redirect under specific conditions
  useEffect(() => {
    // Skip this check for admin-setup page to avoid infinite loops
    if (pathname === '/admin-setup') return;

    // Check for admin-related pages that need setup
    const isAdminPage = pathname.startsWith('/admin');
    const isAuthPage = pathname.startsWith('/auth');
    
    const checkAndRedirect = async () => {
      // Only redirect if:
      // 1. We're done loading
      // 2. We know adminSetupComplete is false (not null)
      // 3. We're trying to access admin or auth pages
      if (!loading && adminSetupComplete === false && (isAdminPage || isAuthPage)) {
        setRedirecting(true);
        router.push('/admin-setup');
      } else {
        setRedirecting(false);
      }
    };

    checkAndRedirect();
  }, [loading, adminSetupComplete, router, pathname]);

  // If we're still loading or redirecting, show a loading indicator
  if (loading || redirecting) {
    return <div className="loading-spinner">Loading...</div>;
  }

  // If user is logged in, don't show the header/footer on dashboard pages
  if (user && (userRole === 'admin' || userRole === 'parent')) {
    // Check if we're on a dashboard page
    const isAdminPage = pathname.startsWith('/admin');
    const isParentPage = pathname.startsWith('/parent');
    
    if (isAdminPage || isParentPage) {
      return <>{children}</>;
    }
  }

  // Otherwise, show the public layout with header and footer
  return (
    <div className="main-container">
      <header className="header">
        <nav className="nav-container">
          <ul className="nav-links">
            <li><Link href="/">Home</Link></li>
            <li><Link href="/location">Location</Link></li>
            <li><Link href="/program">Program</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/faq">FAQ</Link></li>
          </ul>
          <div className="auth-buttons">
            {user ? (
              <>
                <div className="user-welcome">Welcome, {user.email}</div>
                <button onClick={() => useAuth().logOut()} className="logout-btn">Logout</button>
                {userRole === 'admin' ? (
                  <Link href="/admin" className="dashboard-btn">
                    Admin Dashboard
                  </Link>
                ) : (
                  <Link href="/parent" className="dashboard-btn">
                    Parent Dashboard
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/auth" className="login-btn">
                  Login
                </Link>
                <Link href="/auth" className="signup-btn">
                  Sign up
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>
      <main>
        {children}
      </main>
      <Footer />
    </div>
  );
}