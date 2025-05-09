// components/auth/LoginForm.js
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userType = searchParams.get('type') || 'parent'; // Default to parent if not specified
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login submitted:', { ...formData, userType });
    
    // Redirect to the appropriate dashboard (to be implemented with actual authentication)
    if (userType === 'admin') {
      router.push('/admin');
    } else {
      router.push('/parent');
    }
  };

  const handleGoogleLogin = () => {
    // Google login would be implemented here
    console.log('Google login clicked');
  };
  
  return (
    <div className="auth-form-container">
      <div className="auth-tabs">
        <Link href={`/auth/signup?type=${userType}`} className="tab">
          Sign up
        </Link>
        <Link href={`/auth/login?type=${userType}`} className="tab active">
          Log in
        </Link>
      </div>
      
      <h2 className="auth-title">Login</h2>
      
      <button className="google-auth-btn" onClick={handleGoogleLogin}>
        <img src="/google-icon.svg" alt="Google" className="google-icon" />
        Login with Google
      </button>
      
      <div className="divider">
        <span>OR</span>
      </div>
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="auth-input"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="auth-input"
          />
        </div>
        
        <button type="submit" className="submit-btn">Login</button>
      </form>
    </div>
  );
};

export default LoginForm;