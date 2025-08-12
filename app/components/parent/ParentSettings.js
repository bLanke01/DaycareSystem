// components/parent/ParentSettings.js - System Preferences
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../firebase/auth-context';
import GoogleAccountLinking from './GoogleAccountLinking';
import DashboardPreferencesService from '../../services/DashboardPreferencesService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { updateProfile } from 'firebase/auth';

export default function ParentSettings() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [settings, setSettings] = useState({
    dashboardPreferences: {
      todayActivities: true,
      mealReports: true,
      napTimes: true,
      attendanceStatus: true,
      weeklySummary: false
    }
  });
  const [profileData, setProfileData] = useState({
    displayName: '',
    photoURL: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [updateTimeout, setUpdateTimeout] = useState(null);

  // Load existing settings when component mounts
  useEffect(() => {
    const loadSettings = async () => {
      if (!user?.uid) return;
      
      try {
        const preferences = await DashboardPreferencesService.getUserPreferences(user.uid);
        setSettings(prev => ({
          ...prev,
          dashboardPreferences: preferences
        }));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    loadSettings();
    if (user) {
      loadProfileData();
    }
    
    // Cleanup function
    return () => {
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }
    };
  }, [user?.uid]);

  // Load profile data
  const loadProfileData = async () => {
    if (!user) return;
    
    try {
      // First try to get profile data from Firestore (where we store the full image)
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      
      let firestorePhotoURL = '';
      if (userDoc.exists()) {
        firestorePhotoURL = userDoc.data().photoURL || '';
      }
      
      // Use Firestore photoURL if available, otherwise use Auth photoURL
      const newProfileData = {
        displayName: user.displayName || '',
        photoURL: firestorePhotoURL || user.photoURL || '',
        email: user.email || ''
      };
      
      setProfileData(newProfileData);
    } catch (error) {
      console.error('Error loading profile data from Firestore:', error);
      // Fallback to Auth data only
      const newProfileData = {
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        email: user.email || ''
      };
      
      setProfileData(newProfileData);
    }
  };

  // Debounced profile update
  const debouncedProfileUpdate = (field, value) => {
    // Clear existing timeout
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      handleProfileChange(field, value);
    }, 500); // 500ms delay
    
    setUpdateTimeout(timeout);
  };

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Only update if there are actual changes
      const hasChanges = 
        user?.displayName !== profileData.displayName ||
        user?.photoURL !== profileData.photoURL;

      if (!hasChanges) {
        setSuccess('No changes to update');
        setLoading(false);
        return;
      }

      // For Firebase Auth, we'll use an empty photoURL (will show initial)
      // The full image will be stored in Firestore
      await updateProfile(user, {
        displayName: profileData.displayName,
        photoURL: '' // Empty to avoid Firebase Auth length issues
      });

      // Store the full profile picture in Firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        displayName: profileData.displayName,
        photoURL: profileData.photoURL, // Full image stored here
        email: profileData.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      setSuccess('Profile updated successfully!');
      
      // Wait a moment before resetting loading state
      setTimeout(() => {
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile: ' + error.message);
      setLoading(false);
    }
  };

  // Convert image to base64 for storage with aggressive compression
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 100x100 for profile pictures to fit Firebase Auth)
        const maxSize = 100;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with very low quality (0.3 = 30%) to reduce size
        const base64 = canvas.toDataURL('image/jpeg', 0.3);
        resolve(base64);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 500KB for base64 storage to fit Firebase Auth)
    if (file.size > 500 * 1024) {
      setError('Image size must be less than 500KB. Images will be automatically compressed to fit Firebase Auth limits.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Convert image to base64
      const base64Image = await convertImageToBase64(file);
      console.log('Image converted to base64, size:', base64Image.length);

      // Update profile data locally
      setProfileData(prev => ({
        ...prev,
        photoURL: base64Image
      }));

      setSuccess('Profile picture uploaded successfully!');
      
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Failed to process image: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const removeProfilePicture = async () => {
    try {
      setUploading(true);
      setError(null);

      // Update profile data
      setProfileData(prev => ({
        ...prev,
        photoURL: ''
      }));

      setSuccess('Profile picture removed successfully!');
    } catch (error) {
      console.error('Error removing profile picture:', error);
      setError('Failed to remove profile picture');
    } finally {
      setUploading(false);
    }
  };

  const handleDashboardPreferenceChange = async (preference, value) => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      setSuccess('');
      
      const newDashboardPreferences = {
        ...settings.dashboardPreferences,
        [preference]: value
      };
      
      // Update local state immediately for better UX
      setSettings(prev => ({
        ...prev,
        dashboardPreferences: newDashboardPreferences
      }));
      
      // Save to Firebase using the service
      const success = await DashboardPreferencesService.saveUserPreferences(user.uid, newDashboardPreferences);
      
      if (success) {
        setSuccess(`✅ ${preference.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} preference updated successfully!`);
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Failed to save preferences');
      }
      
    } catch (error) {
      console.error('Error updating dashboard preferences:', error);
      // Revert local state on error
      setSettings(prev => ({
        ...prev,
        dashboardPreferences: {
          ...prev.dashboardPreferences,
          [preference]: !value // Revert to previous value
        }
      }));
      alert('Failed to update preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-base-content mb-8">⚙️ System Preferences</h1>

        {error && (
          <div className="alert alert-error shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Profile Management */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">👤 Profile Management</h2>
            
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                {/* Profile Picture Section */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-4xl font-bold shadow-xl">
                      {uploading ? (
                        <div className="flex items-center justify-center w-full h-full">
                          <span className="loading loading-spinner loading-lg"></span>
                        </div>
                      ) : profileData.photoURL ? (
                        <img 
                          src={profileData.photoURL} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to initial if image fails to load
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      
                      {/* Fallback initial - always present but conditionally shown */}
                      <span 
                        className={`text-4xl font-bold ${profileData.photoURL ? 'hidden' : ''}`}
                        style={{ display: profileData.photoURL ? 'none' : 'flex' }}
                      >
                        {profileData.displayName ? profileData.displayName.charAt(0).toUpperCase() : 'P'}
                      </span>
                    </div>
                    
                    {/* Upload/Remove Buttons */}
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-sm btn-primary rounded-full shadow-lg"
                        disabled={uploading}
                      >
                        {uploading ? (
                          <span className="loading loading-spinner loading-xs"></span>
                        ) : (
                          '📷'
                        )}
                      </button>
                      
                      {profileData.photoURL && (
                        <button
                          type="button"
                          onClick={removeProfilePicture}
                          className="btn btn-sm btn-error rounded-full shadow-lg"
                          disabled={uploading}
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  
                  <p className="text-sm text-base-content/70 text-center max-w-xs">
                    Click the camera button to upload a new profile picture. 
                    Maximum size: 500KB. Images will be compressed to 100x100 pixels.
                    <br />
                    <span className="text-info">Images are stored locally in your profile data.</span>
                  </p>
                </div>

                {/* Profile Information */}
                <div className="flex-1 space-y-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Display Name</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your display name"
                      className="input input-bordered w-full"
                      value={profileData.displayName}
                      onChange={(e) => debouncedProfileUpdate('displayName', e.target.value)}
                      required
                    />
                    <label className="label">
                      <span className="label-text-alt">This name will appear in the "Welcome back" message and throughout the app</span>
                    </label>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-semibold">Email</span>
                    </label>
                    <input
                      type="email"
                      className="input input-bordered w-full"
                      value={profileData.email}
                      disabled
                    />
                    <label className="label">
                      <span className="label-text-alt">Email cannot be changed from settings</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="card-actions justify-end">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading || uploading}
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    'Update Profile'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Content */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold">⚙️ System Preferences</h2>
                <p className="text-base-content/70">Manage your dashboard display preferences</p>
              </div>
            </div>

            {/* Content */}
            <div className="mt-6">
              <div className="space-y-6">
                {/* Google Account Linking Section */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <GoogleAccountLinking />
                  </div>
                </div>
                
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h2 className="card-title">👶 Child Information Display</h2>
                    <div className="mt-4">
                      <h3 className="font-bold mb-2">Dashboard Preferences</h3>
                      <p className="text-base-content/70 mb-4">Choose what information is prominently displayed on your dashboard:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="label cursor-pointer justify-start gap-4">
                          <input 
                            type="checkbox" 
                            className="checkbox" 
                            checked={settings.dashboardPreferences.todayActivities}
                            onChange={(e) => handleDashboardPreferenceChange('todayActivities', e.target.checked)}
                            disabled={loading}
                          />
                          <span className="label-text">Today's Activities</span>
                        </label>
                        <label className="label cursor-pointer justify-start gap-4">
                          <input 
                            type="checkbox" 
                            className="checkbox" 
                            checked={settings.dashboardPreferences.mealReports}
                            onChange={(e) => handleDashboardPreferenceChange('mealReports', e.target.checked)}
                            disabled={loading}
                          />
                          <span className="label-text">Meal Reports</span>
                        </label>
                        <label className="label cursor-pointer justify-start gap-4">
                          <input 
                            type="checkbox" 
                            className="checkbox" 
                            checked={settings.dashboardPreferences.napTimes}
                            onChange={(e) => handleDashboardPreferenceChange('napTimes', e.target.checked)}
                            disabled={loading}
                          />
                          <span className="label-text">Nap Times</span>
                        </label>
                        <label className="label cursor-pointer justify-start gap-4">
                          <input 
                            type="checkbox" 
                            className="checkbox" 
                            checked={settings.dashboardPreferences.attendanceStatus}
                            onChange={(e) => handleDashboardPreferenceChange('attendanceStatus', e.target.checked)}
                            disabled={loading}
                          />
                          <span className="label-text">Attendance Status</span>
                        </label>
                        <label className="label cursor-pointer justify-start gap-4">
                          <input 
                            type="checkbox" 
                            className="checkbox" 
                            checked={settings.dashboardPreferences.weeklySummary}
                            onChange={(e) => handleDashboardPreferenceChange('weeklySummary', e.target.checked)}
                            disabled={loading}
                          />
                          <span className="label-text">Weekly Summary</span>
                        </label>
                      </div>
                      
                      {loading && (
                        <div className="alert alert-info mt-4">
                          <span className="loading loading-spinner loading-sm"></span>
                          <span>Saving your preferences...</span>
                        </div>
                      )}

                      <div className="alert alert-info mt-6">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <h4 className="font-bold">💡 Dashboard Customization</h4>
                          <p className="text-sm mt-2">
                            These preferences control what information is displayed on your main dashboard. 
                            Changes are saved automatically and will take effect immediately.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}