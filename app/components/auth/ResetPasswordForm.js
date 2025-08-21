'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../../firebase/auth-context';

const ResetPasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userType = searchParams.get('type') || 'parent';
  const action = searchParams.get('action'); // 'request' or 'confirm'
  const oobCode = searchParams.get('oobCode'); // Firebase password reset code
  const { resetPassword, confirmPasswordReset } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ 
      ...formData,
      [name]: value
    });
  };
  
  const handleRequestReset = async (e) => {
    e.preventDefault();
    
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      const result = await resetPassword(formData.email);
      
      if (result.error) {
        throw result.error;
      }
      setSuccess('Password reset email sent! Check your inbox for further instructions.');
      
      // Clear email field after successful request
      setFormData(prev => ({ ...prev, email: '' }));
      
    } catch (err) {
      console.error('Password reset error:', err);
      
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many password reset attempts. Please try again later.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError('Failed to send password reset email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleConfirmReset = async (e) => {
    e.preventDefault();
    
    if (!formData.password) {
      setError('Please enter a new password');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    try {
      setError('');
      setSuccess('');
      setLoading(true);
      
      // Confirm the password reset using auth context
      const result = await confirmPasswordReset(oobCode, formData.password);
      
      if (result.error) {
        throw result.error;
      }
      
      setSuccess('Password reset successfully! You can now log in with your new password.');
      
      // Clear form after successful reset
      setFormData({ email: '', password: '', confirmPassword: '' });
      
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push(`/auth/login?type=${userType}`);
      }, 3000);
      
    } catch (err) {
      console.error('Password reset confirmation error:', err);
      
      if (err.code === 'auth/invalid-action-code') {
        setError('Invalid or expired reset link. Please request a new password reset.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.');
      } else {
        setError('Failed to reset password. Please try again or request a new reset link.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // If we have an oobCode, show the password confirmation form
  if (action === 'confirm' && oobCode) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-base-200">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="text-center mb-6">
              <Image 
                src="/Emojis/Security_emoji-Photoroom.png" 
                alt="Security Emoji" 
                width={48} 
                height={48} 
                className="mx-auto mb-4"
              />
              <h2 className="card-title justify-center">Reset Your Password</h2>
              <p className="text-sm text-gray-600">Enter your new password below</p>
            </div>
            
            {error && (
              <div className="alert alert-error mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="alert alert-success mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{success}</span>
              </div>
            )}
            
            <form onSubmit={handleConfirmReset} className="form-control gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">New Password</span>
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="input input-bordered w-full"
                  disabled={loading}
                  placeholder="Enter new password"
                  minLength={6}
                />
                <label className="label">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={showPassword}
                    onChange={() => setShowPassword(!showPassword)}
                  />
                  <span className="label-text-alt">Show password</span>
                </label>
              </div>
              
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Confirm New Password</span>
                </label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="input input-bordered w-full"
                  disabled={loading}
                  placeholder="Confirm new password"
                  minLength={6}
                />
                <label className="label">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm"
                    checked={showConfirmPassword}
                    onChange={() => setShowConfirmPassword(!showConfirmPassword)}
                  />
                  <span className="label-text-alt">Show password</span>
                </label>
              </div>
              
              <button 
                type="submit" 
                className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
            
            <div className="divider"></div>
            
            <div className="text-center">
              <Link href={`/auth/login?type=${userType}`} className="link link-primary">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Default view - password reset request form
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="tabs tabs-boxed justify-center mb-6">
            <Link href={`/auth/signup?type=${userType}`} className="tab">
              Sign up
            </Link>
            <Link href={`/auth/login?type=${userType}`} className="tab">
              Log in
            </Link>
            <Link href={`/auth/reset-password?type=${userType}`} className="tab tab-active">
              Reset Password
            </Link>
          </div>
          
          <div className="text-center mb-6">
            <Image 
              src="/Emojis/Security_emoji-Photoroom.png" 
              alt="Security Emoji" 
              width={48} 
              height={48} 
              className="mx-auto mb-4"
            />
            <h2 className="card-title justify-center">Forgot Your Password?</h2>
            <p className="text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          
          {error && (
            <div className="alert alert-error mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="alert alert-success mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{success}</span>
            </div>
          )}
          
          <form onSubmit={handleRequestReset} className="form-control gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email address</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input input-bordered w-full"
                disabled={loading}
                placeholder="Enter your email"
              />
            </div>
            
            <button 
              type="submit" 
              className={`btn btn-primary w-full ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
            </button>
          </form>
          
          <div className="divider"></div>
          
          <div className="space-y-4 text-center text-sm">
            <p>
              Remember your password?{' '}
              <Link href={`/auth/login?type=${userType}`} className="link link-primary">
                Log in here
              </Link>
            </p>
            
            <p>
              Don't have an account?{' '}
              <Link href={`/auth/signup?type=${userType}`} className="link link-primary">
                Sign up here
              </Link>
            </p>
            
            {userType === 'parent' && (
              <p>
                Are you a staff member?{' '}
                <Link href="/auth/reset-password?type=admin" className="link link-primary">
                  Staff/Admin Password Reset
                </Link>
              </p>
            )}
            
            {userType === 'admin' && (
              <p>
                Are you a parent?{' '}
                <Link href="/auth/reset-password?type=parent" className="link link-primary">
                  Parent Password Reset
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordForm;
