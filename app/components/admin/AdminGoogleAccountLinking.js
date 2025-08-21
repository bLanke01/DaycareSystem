// app/components/admin/AdminGoogleAccountLinking.js
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../firebase/auth-context';

export default function AdminGoogleAccountLinking() {
  const { user, hasGoogleLinked, disableGoogleSignIn, enableGoogleSignIn, logOut } = useAuth();
  const [isLinked, setIsLinked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user?.uid) {
      checkGoogleLinkStatus();
    }
  }, [user, hasGoogleLinked]);

  // Monitor user provider data changes
  useEffect(() => {
    if (user?.uid) {
      const currentProviders = user.providerData?.map(p => p.providerId) || [];
      console.log('👀 Admin user provider data changed:', currentProviders);
      
      // Check if Google provider is present
      const hasGoogle = currentProviders.includes('google.com');
      console.log('🔍 Admin Google provider present in user data:', hasGoogle);
      
      // Update local state if it differs from current
      if (hasGoogle !== isLinked) {
        console.log('🔄 Admin updating local state to match provider data:', hasGoogle);
        setIsLinked(hasGoogle);
      }
    }
  }, [user?.providerData, user?.uid]);

  // Monitor for user sign-out (user becomes null)
  useEffect(() => {
    if (user === null) {
      console.log('👤 Admin user signed out detected in AdminGoogleAccountLinking');
    } else if (user?.uid) {
      console.log('👤 Admin user signed in detected in AdminGoogleAccountLinking:', user.uid);
    }
  }, [user]);

  const checkGoogleLinkStatus = async () => {
    try {
      if (!user?.uid) {
        console.log('⚠️ No admin user UID available for checking Google link status');
        return;
      }
      
      console.log('🔍 Checking Google link status for admin user:', user.uid);
      const linked = await hasGoogleLinked(user.uid);
      console.log('📊 Admin Google link status result:', linked);
      
      // Also check current Firebase Auth session directly for debugging
      const currentUser = user;
      if (currentUser) {
        const currentProviders = currentUser.providerData?.map(p => p.providerId) || [];
        console.log('🔍 Admin current user providers:', currentProviders);
        console.log('🔍 Admin has Google provider in current session:', currentProviders.includes('google.com'));
      }
      
      setIsLinked(linked);
    } catch (error) {
      console.error('❌ Error checking admin Google link status:', error);
    }
  };

  const handleGoogleLink = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const result = await enableGoogleSignIn(user.uid);
      if (result.success) {
        setIsLinked(true);
        setMessage('Google account linked successfully! You can now sign in using Google.');
      } else {
        setMessage('Error linking Google account: ' + (result.error?.message || 'Unknown error'));
      }
    } catch (error) {
      setMessage('Error linking Google account: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleUnlink = async () => {
    setIsLoading(true);
    setMessage('');
    
    try {
      console.log('🔗 Attempting to unlink Google account for admin user:', user.uid);
      console.log('🔍 Admin current user provider data before unlink:', user.providerData?.map(p => p.providerId));
      
      const result = await disableGoogleSignIn(user.uid);
      console.log('📊 Admin unlink result:', result);
      
      if (result.success) {
        // Immediately update local state
        setIsLinked(false);
        setMessage('Google account unlinked successfully! Google sign-in is now disabled for this account. You can continue using your email/password to sign in.');
        
        // Refresh the link status to ensure UI is accurate
        console.log('✅ Admin unlinking completed, refreshing status...');
        setTimeout(async () => {
          try {
            await checkGoogleLinkStatus();
            console.log('🔄 Admin link status refreshed after unlink');
          } catch (error) {
            console.log('ℹ️ Could not refresh admin link status, but unlinking was successful');
          }
        }, 1000);
      } else {
        console.error('❌ Admin unlink failed with result:', result);
        setMessage('Error unlinking Google account: ' + (result.error?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error in admin handleGoogleUnlink:', error);
      setMessage('Error unlinking Google account: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card bg-base-100 shadow-lg">
      <div className="card-body">
        <h3 className="card-title text-lg mb-4">
          <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google Account Linking
        </h3>
        
        <p className="text-base-content/70 mb-4">
          Link your Google account to enable additional features and easier sign-in.
        </p>

        {message && (
          <div className={`alert ${message.includes('Error') ? 'alert-error' : 'alert-success'} mb-4`}>
            <span>{message}</span>
          </div>
        )}

        {/* Large centered Google icon */}
        <div className="flex justify-center mb-6">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
            isLinked 
              ? 'bg-green-100 border-4 border-green-300 shadow-lg' 
              : 'bg-base-300 border-4 border-base-200 shadow-lg'
          }`}>
            {isLinked ? (
              <svg className="w-16 h-16" viewBox="0 0 24 24" fill="currentColor">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            ) : (
              <svg className="w-16 h-16 opacity-50" viewBox="0 0 24 24" fill="currentColor">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
          </div>
        </div>

        {/* Status text centered below icon */}
        <div className="text-center mb-6">
          <h4 className="text-xl font-bold mb-2">
            {isLinked ? 'Google Account Linked' : 'Google Account Not Linked'}
          </h4>
          <p className="text-base-content/70">
            {isLinked 
              ? 'Your account is connected to Google services' 
              : 'Link your Google account for enhanced features'
            }
          </p>
          
        
        </div>

        <div className="card-actions justify-end">
          {!isLinked ? (
            <button
              onClick={handleGoogleLink}
              disabled={isLoading}
              className="btn btn-primary"
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Link Google Account
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleGoogleUnlink}
              disabled={isLoading}
              className="btn btn-outline btn-error"
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                'Unlink Google Account'
              )}
            </button>
          )}
        </div>

        <div className="mt-4 p-4 bg-base-200 rounded-lg">
          <h4 className="font-medium mb-2">Important Note:</h4>
          <p className="text-sm text-base-content/70">
            When you unlink your Google account, Google sign-in will be completely disabled for this account. 
            You will no longer be able to sign in using Google authentication. Make sure you have an alternative 
            sign-in method (email/password) before unlinking. You will remain logged in and can continue using 
            the application with your email/password authentication.
          </p>
        </div>
      </div>
    </div>
  );
}
