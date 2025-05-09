// components/auth/SignupForm.js
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

const SignupForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userType = searchParams.get('type') || 'parent'; // Default to parent if not specified
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
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
    console.log('Signup submitted:', { ...formData, userType });
    
    // Only allow parent signups
    if (userType === 'admin') {
      alert('Admin accounts can only be created by existing administrators. Please contact the daycare administrator for assistance.');
      return;
    }
    
    // Redirect to parent dashboard (to be implemented with actual authentication)
    router.push('/parent');
  };

  const handleGoogleSignup = () => {
    // Google signup would be implemented here
    console.log('Google signup clicked');
  };
  
  return (
    <div className="auth-form-container">
      <div className="auth-tabs">
        <Link href={`/auth/signup?type=${userType}`} className="tab active">
          Sign up
        </Link>
        <Link href={`/auth/login?type=${userType}`} className="tab">
          Log in
        </Link>
      </div>
      
      <h2 className="auth-title">Sign Up</h2>
      
      <button className="google-auth-btn" onClick={handleGoogleSignup}>
        <img src="/google-icon.svg" alt="Google" className="google-icon" />
        Sign up with Google
      </button>
      
      <div className="divider">
        <span>OR</span>
      </div>
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="name-inputs">
          <div className="form-group half-width">
            <label htmlFor="firstName">First name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>
          
          <div className="form-group half-width">
            <label htmlFor="lastName">Last name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              className="auth-input"
            />
          </div>
        </div>
        
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
        
        <button type="submit" className="submit-btn">Sign Up</button>
      </form>
    </div>
  );
};

export default SignupForm;