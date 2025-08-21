// app/components/admin/AdminAccount.js
'use client';

import { useState } from 'react';
import { useAuth } from '../../firebase/auth-context';
import { updatePassword } from 'firebase/auth';
import { auth } from '../../firebase/config';

export default function AdminAccount() {
  const { user } = useAuth();
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);



  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match!');
      return;
    }

    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      // Get current user from Firebase Auth
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      // Update password in Firebase Auth
      await updatePassword(currentUser, newPassword);
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordSuccess('Password updated successfully!');
    } catch (error) {
      console.error('Error updating password:', error);
      // Provide more specific error messages
      if (error.code === 'auth/requires-recent-login') {
        setPasswordError('For security reasons, please log out and log in again before changing your password.');
      } else {
        setPasswordError(`Failed to update password: ${error.message}`);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-96">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-base-content mb-8">Admin Account</h1>

        {passwordError && (
          <div className="alert alert-error shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="alert alert-success shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{passwordSuccess}</span>
          </div>
        )}

        {/* Change Password Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Change Password
            </h2>
            <form onSubmit={handlePasswordChange}>
              <div className="grid gap-4 max-w-md">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Current Password</span>
                  </label>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    className="input input-bordered w-full"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <label className="label cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={showCurrentPassword}
                      onChange={() => setShowCurrentPassword(!showCurrentPassword)}
                    />
                    <span className="label-text-alt">Show password</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">New Password</span>
                  </label>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="input input-bordered w-full"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <label className="label">
                    <span className="label-text-alt text-base-content/60">Minimum 6 characters</span>
                  </label>
                  <label className="label cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={showNewPassword}
                      onChange={() => setShowNewPassword(!showNewPassword)}
                    />
                    <span className="label-text-alt">Show password</span>
                  </label>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Confirm New Password</span>
                  </label>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="input input-bordered w-full"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <label className="label cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={showConfirmPassword}
                      onChange={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                    <span className="label-text-alt">Show password</span>
                  </label>
                </div>

                <div className="form-control mt-2">
                  <button type="submit" className="btn btn-accent" disabled={passwordLoading}>
                    {passwordLoading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      'Update Password'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
