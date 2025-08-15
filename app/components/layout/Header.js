'use client'; // This directive is necessary for client components

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '/', label: 'Home', emoji: '🏠' },
    { href: '/about', label: 'About', emoji: '🌟' },
    { href: '/program', label: 'Programs', emoji: '📚' },
    { href: '/location', label: 'Location', emoji: '📍' },
    { href: '/contact', label: 'Contact', emoji: '📞' },
    { href: '/faq', label: 'FAQ', emoji: '❓' }
  ];

  return (
    <div className={`navbar bg-base-100/90 backdrop-blur-md shadow-lg sticky top-0 z-50 transition-all duration-300 ${
      isScrolled ? 'py-2' : 'py-4'
    }`}>
      <div className="navbar-start">
        {/* Mobile Menu */}
        <div className="dropdown">
          <label 
            tabIndex={0} 
            className="btn btn-ghost lg:hidden hover:bg-primary/10" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
          </label>
          <ul tabIndex={0} className={`menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-2xl bg-base-100 rounded-2xl w-64 border border-primary/10 ${isMenuOpen ? 'block' : 'hidden'}`}>
            {navItems.map((item) => (
              <li key={item.href}>
                <Link 
                  href={item.href} 
                  className="flex items-center space-x-3 hover:bg-primary/10 rounded-xl p-3 transition-all duration-200"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
            <div className="divider my-2"></div>
            <li>
              <Link 
                href="/auth/login" 
                className="flex items-center space-x-3 hover:bg-base-200 rounded-xl p-3"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="text-2xl">👤</span>
                <span>Login</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/auth/signup" 
                className="flex items-center space-x-3 bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg rounded-xl p-3 transition-all duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                <span className="text-2xl">🚀</span>
                <span className="font-semibold">Sign Up</span>
              </Link>
            </li>
          </ul>
        </div>
        
        {/* Brand Logo */}
        <Link href="/" className="btn btn-ghost normal-case hover:bg-transparent group">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <Image
                  src="/TinyLog_LOGO.png"
                  alt="TinyLog"
                  fill
                  className="object-contain"
                />
              </div>
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-warning rounded-full flex items-center justify-center text-xs animate-pulse">
                ✨
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                TinyLog
              </h1>
              <p className="text-xs text-base-content -mt-1">Daycare & Learning Center</p>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Desktop Navigation */}
      <div className="navbar-center hidden lg:flex">
        <div className="flex items-center space-x-6">
          {navItems.map((item) => (
            <Link 
              key={item.href}
              href={item.href} 
              className="flex items-center space-x-2 hover:bg-primary/10 rounded-xl px-4 py-2 transition-all duration-200 group"
            >
              <span className="text-xl group-hover:scale-110 transition-transform duration-200">{item.emoji}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Desktop Auth Buttons */}
      <div className="navbar-end hidden lg:flex space-x-3">
        <Link href="/auth/login">
          <button className="btn btn-ghost hover:bg-primary/10 transition-all duration-200">
            <span className="mr-2">👤</span>
            Login
          </button>
        </Link>
        <Link href="/auth/signup">
          <button className="btn bg-gradient-to-r from-primary to-secondary text-white hover:shadow-lg hover:scale-105 transition-all duration-200 border-none">
            <span className="mr-2">🚀</span>
            Sign Up
          </button>
        </Link>
      </div>

      {/* Mobile Auth Buttons */}
      <div className="navbar-end lg:hidden">
        <Link href="/auth/signup">
          <button className="btn btn-primary btn-sm">
            <span className="mr-1">🚀</span>
            Join
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Header;
