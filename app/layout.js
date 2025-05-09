// app/layout.js
import './globals.css';
import Link from 'next/link';
import Footer from './components/layout/Footer';

export const metadata = {
  title: 'Daycare Management System',
  description: 'A comprehensive solution for managing daycare operations',
};

export default function RootLayout({
  children,
}) {
  return (
    <html lang="en">
      <body>
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
                <Link href="/auth" className="login-btn">
                  Login
                </Link>
                <Link href="/auth" className="signup-btn">
                  Sign up
                </Link>
              </div>
            </nav>
          </header>
          <main>
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}