// components/auth/SignupForm.js
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { useAuth } from '../../firebase/auth-context';
import { db } from '../../firebase/config';

const SignupForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userType = searchParams.get('type') || 'parent'; // Default to parent
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    accessCode: '' // New field for access code
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { registerUser, signInWithGoogle } = useAuth();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Only allow parent signups
    if (userType === 'admin') {
      setError('Admin accounts can only be created by existing administrators');
      return;
    }
    
    // Password validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // For parent registration, verify access code
      if (userType === 'parent') {
        if (!formData.accessCode.trim()) {
          throw new Error('Access code is required for registration');
        }
        
        // Check if access code exists and is valid
        const accessCodesRef = collection(db, 'accessCodes');
        const q = query(
          accessCodesRef, 
          where('code', '==', formData.accessCode.trim()),
          where('usesLeft', '>', 0)
        );
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          throw new Error('Invalid or expired access code');
        }
        
        const accessCodeDoc = snapshot.docs[0];
        const accessCodeData = accessCodeDoc.data();
        
        // Check if code is expired
        const expiryDate = new Date(accessCodeData.expiresAt);
        if (expiryDate < new Date()) {
          throw new Error('This access code has expired');
        }
      }
      
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: userType // Always 'parent' for signup
      };
      
      const { user, error } = await registerUser(formData.email, formData.password, userData);
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Update access code usage
      if (userType === 'parent') {
        const accessCodesRef = collection(db, 'accessCodes');
        const q = query(accessCodesRef, where('code', '==', formData.accessCode.trim()));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
          const accessCodeDoc = snapshot.docs[0];
          
          // Update the access code document
          await updateDoc(doc(db, 'accessCodes', accessCodeDoc.id), {
            usesLeft: increment(-1),
            usedBy: [...(accessCodeDoc.data().usedBy || []), {
              userId: user.uid,
              email: user.email,
              usedAt: new Date().toISOString()
            }]
          });
        }
      }
      
      // Redirect to parent dashboard
      router.push('/parent');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      setError('');
      setLoading(true);
      
      // Google signup still requires an access code for parents
      if (!formData.accessCode.trim()) {
        throw new Error('Access code is required for registration');
      }
      
      // Check if access code exists and is valid
      const accessCodesRef = collection(db, 'accessCodes');
      const q = query(
        accessCodesRef, 
        where('code', '==', formData.accessCode.trim()),
        where('usesLeft', '>', 0)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('Invalid or expired access code');
      }
      
      const accessCodeDoc = snapshot.docs[0];
      const accessCodeData = accessCodeDoc.data();
      
      // Check if code is expired
      const expiryDate = new Date(accessCodeData.expiresAt);
      if (expiryDate < new Date()) {
        throw new Error('This access code has expired');
      }
      
      const { user, error } = await signInWithGoogle();
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Update access code usage
      await updateDoc(doc(db, 'accessCodes', accessCodeDoc.id), {
        usesLeft: increment(-1),
        usedBy: [...(accessCodeDoc.data().usedBy || []), {
          userId: user.uid,
          email: user.email,
          usedAt: new Date().toISOString()
        }]
      });
      
      // Google signup is only for parents
      router.push('/parent');
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Don't allow admin signup
  if (userType === 'admin') {
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
        
        <h2 className="auth-title">Admin Sign Up</h2>
        
        <div className="error-message">
          <p>Admin accounts can only be created by existing administrators.</p>
          <p>Please contact the daycare administrator for assistance.</p>
        </div>
        
        <div className="auth-redirect">
          <p>Already have an admin account?</p>
          <Link href={`/auth/login?type=admin`}>
            <button className="auth-button login-btn">
              Go to Admin Login
            </button>
          </Link>
        </div>
      </div>
    );
  }
  
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
      
      <h2 className="auth-title">Parent Sign Up</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label htmlFor="accessCode">Registration Access Code*</label>
          <input
            type="text"
            id="accessCode"
            name="accessCode"
            value={formData.accessCode}
            onChange={handleChange}
            required
            className="auth-input"
            disabled={loading}
            placeholder="Enter the access code provided by the daycare"
          />
          <small>Contact the daycare to obtain an access code</small>
        </div>
        
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
              disabled={loading}
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
              disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
            minLength="6"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="auth-input"
            disabled={loading}
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-btn"
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <div className="divider">
        <span>OR</span>
      </div>
      
      <button 
        className="google-auth-btn" 
        onClick={handleGoogleSignup}
        disabled={loading || !formData.accessCode.trim()}
      >
        <img src="/google-icon.svg" alt="Google" className="google-icon" />
        Sign up with Google
      </button>
      
      <div className="auth-redirect">
        <p>Already have an account?</p>
        <Link href={`/auth/login?type=parent`}>
          Log in instead
        </Link>
      </div>
    </div>
  );
};

export default SignupForm;