// components/admin/AdminSettings.js - Updated with system preferences and profile management
'use client';

import { useState, useEffect, useRef } from 'react';
import { doc, updateDoc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import AdminGoogleAccountLinking from './AdminGoogleAccountLinking';
import { useAuth } from '../../firebase/auth-context';
import { updateProfile } from 'firebase/auth';

export default function AdminSettings() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('profile'); // profile, preferences, debug
  const [settings, setSettings] = useState({
    daycare: {
      name: '',
      address: '',
      phone: '',
      email: '',
      openingHours: {
        start: '07:00',
        end: '18:00'
      },
      maxCapacity: 50,
      ageGroups: {
        infant: { min: 0, max: 18 },
        toddler: { min: 19, max: 35 },
        preschool: { min: 36, max: 60 }
      }
    },

    billing: {
      currency: 'USD',
      lateFeeAmount: 25,
      gracePeriod: 15, // minutes
      autoGenerateInvoices: true,
      paymentDueDay: 1
    },

    autoApproveRequests: false,
    darkMode: false,
    language: 'en',
    requireTwoFactor: false,
    sessionTimeout: true,
    showAdvancedFeatures: false,
    defaultNewUserView: 'pending',
    backupFrequency: 'weekly'
  });

  const [profileData, setProfileData] = useState({
    displayName: '',
    photoURL: '',
    email: ''
  });

  // Debug state
  const [debugResults, setDebugResults] = useState('');
  const [debugLoading, setDebugLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [updateTimeout, setUpdateTimeout] = useState(null);

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

  useEffect(() => {
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
  }, [user?.uid]); // Only reload when user ID changes, not on every user object change

  useEffect(() => {
    // Prevent unnecessary reloads by checking if profile data actually changed
    if (user && !profileData.displayName && !profileData.photoURL) {
      loadProfileData();
    }
  }, [user, profileData.displayName, profileData.photoURL]);

  const loadSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'daycare'));
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data());
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

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
      
      // Check if data actually changed before updating state
      const hasChanged = 
        newProfileData.displayName !== profileData.displayName ||
        newProfileData.photoURL !== profileData.photoURL ||
        newProfileData.email !== profileData.email;
      
      if (hasChanged) {
        setProfileData(newProfileData);
      }
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

  const handleSettingsUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const ref = doc(db, 'settings', 'daycare');
      await setDoc(ref, settings, { merge: true });
      setSuccess('Settings updated successfully!');
    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Failed to update settings');
    } finally {
      setLoading(false);
    }
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

  const handleInputChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleProfileChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSettingChange = async (setting, value) => {
    try {
      // Update local state for instant UI feedback
      setSettings(prev => ({
        ...prev,
        [setting]: value
      }));

      // Persist immediately to Firestore (create doc if missing)
      const ref = doc(db, 'settings', 'daycare');
      await setDoc(ref, { [setting]: value, updatedAt: new Date().toISOString() }, { merge: true });
    } catch (error) {
      console.error('Error updating settings:', error);
      setError('Failed to update settings. Please try again.');
    }
  };

  // Debug functions
  const checkDatabaseState = async () => {
    setDebugLoading(true);
    setDebugResults('🔍 Checking database state...\n\n');
    
    try {
      let output = '';
      
      // Check users collection
      output += '=== USERS COLLECTION ===\n';
      const usersSnapshot = await getDocs(collection(db, 'users'));
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        output += `User ID: ${doc.id}\n`;
        output += `  Email: ${userData.email}\n`;
        output += `  Role: ${userData.role}\n`;
        output += `  Name: ${userData.firstName} ${userData.lastName}\n`;
        output += `  Access Code: ${userData.accessCode || 'None'}\n`;
        output += `  Child IDs: ${JSON.stringify(userData.linkedChildIds || [])}\n`;
        output += `  Created: ${userData.createdAt}\n\n`;
      });
      
      // Check children collection
      output += '=== CHILDREN COLLECTION ===\n';
      const childrenSnapshot = await getDocs(collection(db, 'children'));
      childrenSnapshot.forEach(doc => {
        const childData = doc.data();
        output += `Child ID: ${doc.id}\n`;
        output += `  Name: ${childData.firstName} ${childData.lastName}\n`;
        output += `  Parent ID: ${childData.parentId || 'None'}\n`;
        output += `  Parent Email: ${childData.parentEmail}\n`;
        output += `  Parent Registered: ${childData.parentRegistered}\n`;
        output += `  Access Code: ${childData.accessCode}\n`;
        output += `  Created: ${childData.createdAt}\n\n`;
      });
      
      // Check access codes collection
      output += '=== ACCESS CODES COLLECTION ===\n';
      const accessCodesSnapshot = await getDocs(collection(db, 'accessCodes'));
      accessCodesSnapshot.forEach(doc => {
        const codeData = doc.data();
        output += `Access Code: ${codeData.code || doc.id}\n`;
        output += `  Child ID: ${codeData.childId || 'None'}\n`;
        output += `  Parent Email: ${codeData.parentEmail}\n`;
        output += `  Parent ID: ${codeData.parentId || 'None'}\n`;
        output += `  Used: ${codeData.used}\n`;
        output += `  Uses Left: ${codeData.usesLeft}\n`;
        output += `  Expires: ${codeData.expiresAt}\n\n`;
      });
      
      setDebugResults(output);
      
    } catch (error) {
      setDebugResults(`Error: ${error.message}`);
    } finally {
      setDebugLoading(false);
    }
  };
  
  const fixParentLinking = async () => {
    if (!userEmail) {
      alert('Please enter a parent email address');
      return;
    }
    
    setDebugLoading(true);
    setDebugResults('🔧 Attempting to fix parent linking...\n\n');
    
    try {
      let output = '';
      
      // Find the user
      const usersSnapshot = await getDocs(collection(db, 'users'));
      let targetUser = null;
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.email.toLowerCase() === userEmail.toLowerCase()) {
          targetUser = { id: doc.id, ...userData };
        }
      });
      
      if (!targetUser) {
        output += `❌ User with email ${userEmail} not found\n`;
        setDebugResults(output);
        return;
      }
      
      output += `✅ Found user: ${targetUser.firstName} ${targetUser.lastName} (${targetUser.id})\n`;
      output += `   Access Code: ${targetUser.accessCode}\n\n`;
      
      // Find children with matching parent email or access code
      const childrenSnapshot = await getDocs(collection(db, 'children'));
      const matchingChildren = [];
      
      childrenSnapshot.forEach(doc => {
        const childData = doc.data();
        const emailMatch = childData.parentEmail && 
          childData.parentEmail.toLowerCase() === userEmail.toLowerCase();
        const codeMatch = targetUser.accessCode && 
          childData.accessCode === targetUser.accessCode;
        
        if (emailMatch || codeMatch) {
          matchingChildren.push({ id: doc.id, ...childData });
          output += `📍 Found matching child: ${childData.firstName} ${childData.lastName}\n`;
          output += `   Email match: ${emailMatch ? 'Yes' : 'No'}\n`;
          output += `   Code match: ${codeMatch ? 'Yes' : 'No'}\n`;
          output += `   Current parentId: ${childData.parentId || 'None'}\n\n`;
        }
      });
      
      if (matchingChildren.length === 0) {
        output += `❌ No matching children found for ${userEmail}\n`;
        output += `🔍 Searching by access code: ${targetUser.accessCode}\n`;
        setDebugResults(output);
        return;
      }
      
      output += `📊 Found ${matchingChildren.length} matching children\n\n`;
      
      // Update children to link with parent
      for (const child of matchingChildren) {
        output += `🔗 Linking child: ${child.firstName} ${child.lastName}\n`;
        
        try {
          await updateDoc(doc(db, 'children', child.id), {
            parentId: targetUser.id,
            parentRegistered: true,
            parentRegisteredAt: new Date().toISOString(),
            parentFirstName: targetUser.firstName,
            parentLastName: targetUser.lastName,
            updatedAt: new Date().toISOString()
          });
          
          output += `  ✅ Successfully linked\n`;
        } catch (updateError) {
          output += `  ❌ Failed to link: ${updateError.message}\n`;
        }
      }
      
      // Update user with linked child IDs
      const childIds = matchingChildren.map(child => child.id);
      try {
        await updateDoc(doc(db, 'users', targetUser.id), {
          linkedChildIds: childIds,
          updatedAt: new Date().toISOString()
        });
        
        output += `\n✅ Updated user with ${childIds.length} linked children\n`;
      } catch (userUpdateError) {
        output += `\n❌ Failed to update user: ${userUpdateError.message}\n`;
      }
      
      // Update access code as used
      if (targetUser.accessCode) {
        try {
          const accessCodesSnapshot = await getDocs(collection(db, 'accessCodes'));
          accessCodesSnapshot.forEach(async (accessDoc) => {
            const accessData = accessDoc.data();
            if (accessData.code === targetUser.accessCode) {
              await updateDoc(doc(db, 'accessCodes', accessDoc.id), {
                used: true,
                usesLeft: 0,
                parentId: targetUser.id,
                usedAt: new Date().toISOString()
              });
              output += `✅ Updated access code as used\n`;
            }
          });
        } catch (accessError) {
          output += `⚠️ Warning: Could not update access code: ${accessError.message}\n`;
        }
      }
      
      output += '\n🎉 Parent linking process completed!\n';
      output += '📱 Please refresh the parent dashboard to see the changes.\n';
      
      setDebugResults(output);
      
    } catch (error) {
      setDebugResults(`❌ Error fixing parent linking: ${error.message}\n${error.stack}`);
    } finally {
      setDebugLoading(false);
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

  if (loading && !settings) {
    return (
      <div className="min-h-screen bg-base-200 p-6 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-4xl font-bold text-base-content mb-8">🔧 Admin Settings</h1>

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

        {/* Tabs */}
        <div className="tabs tabs-boxed w-full bg-base-100 rounded-xl p-1 shadow-lg">
          <button 
            className={`tab flex-1 text-base font-medium py-3 px-4 transition-all duration-200 ${
              activeTab === 'profile' 
                ? 'bg-primary text-primary-content shadow-md' 
                : 'hover:bg-base-200'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profile
          </button>
          <button 
            className={`tab flex-1 text-base font-medium py-3 px-4 transition-all duration-200 ${
              activeTab === 'preferences' 
                ? 'bg-primary text-primary-content shadow-md' 
                : 'hover:bg-base-200'
            }`}
            onClick={() => setActiveTab('preferences')}
          >
            ⚙️ Preferences
          </button>
          <button 
            className={`tab flex-1 text-base font-medium py-3 px-4 transition-all duration-200 ${
              activeTab === 'debug' 
                ? 'bg-primary text-primary-content shadow-md' 
                : 'hover:bg-base-200'
            }`}
            onClick={() => setActiveTab('debug')}
          >
            🐛 Debug
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' && (
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
                          {profileData.displayName ? profileData.displayName.charAt(0).toUpperCase() : 'A'}
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
        )}

        {activeTab === 'preferences' && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">⚙️ System Preferences</h2>
              
              <form onSubmit={handleSettingsUpdate} className="space-y-6">
                <div className="space-y-4">
                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">Enable Session Timeout</span>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={settings.sessionTimeout}
                        onChange={(e) => handleSettingChange('sessionTimeout', e.target.checked)}
                      />
                    </label>
                    <p className="text-sm text-base-content/70">Automatically sign out users after a period of inactivity to protect the account.</p>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">Auto-approve Requests</span>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={settings.autoApproveRequests}
                        onChange={(e) => handleSettingChange('autoApproveRequests', e.target.checked)}
                      />
                    </label>
                    <p className="text-sm text-base-content/70">Skip manual approval for eligible requests (e.g., parent access or link requests) and approve them automatically.</p>
                  </div>

                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">Show Advanced Features</span>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary"
                        checked={settings.showAdvancedFeatures}
                        onChange={(e) => handleSettingChange('showAdvancedFeatures', e.target.checked)}
                      />
                    </label>
                    <p className="text-sm text-base-content/70">Reveal power‑user tools and experimental options intended for administrators.</p>
                  </div>

                  <div className="divider"></div>

                  <AdminGoogleAccountLinking />
                </div>

                <div className="card-actions justify-end">
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      'Save Settings'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'debug' && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">🐛 Database Debugger & Fixer</h2>
              <p className="text-base-content/70 mb-6">Use this tool to diagnose and fix parent-child linking issues.</p>
              
              <div className="space-y-4 mb-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-semibold">Parent Email to Fix:</span>
                  </label>
                  <input 
                    type="email"
                    placeholder="Enter parent email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="input input-bordered w-full max-w-md"
                  />
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <button 
                    onClick={checkDatabaseState}
                    disabled={debugLoading}
                    className="btn btn-primary"
                  >
                    {debugLoading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      '🔍 Check Database'
                    )}
                  </button>
                  
                  <button 
                    onClick={fixParentLinking}
                    disabled={debugLoading || !userEmail}
                    className="btn btn-success"
                  >
                    {debugLoading ? (
                      <span className="loading loading-spinner loading-sm"></span>
                    ) : (
                      '🔧 Fix Parent Linking'
                    )}
                  </button>
                </div>
              </div>
              
              {debugResults && (
                <div className="bg-base-200 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap max-h-96 overflow-auto border">
                  {debugResults}
                </div>
              )}
              
              <div className="alert alert-info mt-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current shrink-0 w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-bold">📋 Instructions:</h4>
                  <ol className="list-decimal list-inside space-y-1 mt-2">
                    <li><strong>Check Database:</strong> Click "Check Database" to see the current state of users, children, and access codes</li>
                    <li><strong>Enter Parent Email:</strong> Enter the email of the parent having issues</li>
                    <li><strong>Fix Linking:</strong> Click "Fix Parent Linking" to automatically link the parent with their children</li>
                    <li><strong>Refresh Parent Dashboard:</strong> After fixing, tell the parent to refresh their dashboard</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}