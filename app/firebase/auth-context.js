// app/firebase/auth-context.js - Enhanced with better Google OAuth
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithPopup,
  unlink,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateProfile,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, query, collection, where, getDocs, writeBatch } from 'firebase/firestore';
import { auth, db } from './config';
import { useRouter } from 'next/navigation';

// Create the authentication context
const AuthContext = createContext();

// Create a provider for components to consume and subscribe to changes
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminSetupComplete, setAdminSetupComplete] = useState(null);
  const router = useRouter();

  // Register a new user with email, password, and role
  const registerUser = async (email, password, userData) => {
    try {
      console.log('🔐 Creating Firebase Auth user...');
      
      // Only allow 'parent' role for registration unless admin setup
      if (userData.role === 'admin' && !(userData.isSystemSetup && !adminSetupComplete)) {
        throw new Error('Admin accounts can only be created by existing administrators');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('✅ Firebase Auth user created:', user.uid);
      console.log('💾 Saving user data to Firestore...');

      // Prepare comprehensive user data
      const userDocData = {
        uid: user.uid,
        email: user.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        role: userData.role || 'parent',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        signInMethods: ['password'], // Track sign-in methods
        
        // Parent-specific fields
        ...(userData.role === 'parent' && {
          accessCode: userData.accessCode,
          childId: userData.childId,
          linkedChildIds: userData.linkedChildIds || [],
          parentRegistered: true,
          registrationCompletedAt: new Date().toISOString()
        }),
        
        // Admin-specific fields
        ...(userData.role === 'admin' && {
          isOwner: userData.isOwner || false,
          position: userData.position || ''
        })
      };

      console.log('📄 User document data:', userDocData);

      // Save user data to Firestore
      await setDoc(doc(db, 'users', user.uid), userDocData);
      
      console.log('✅ User document saved successfully');

      // If this is the initial admin setup, mark as complete
      if (userData.isSystemSetup && !adminSetupComplete) {
        await setDoc(doc(db, 'system', 'admin_setup'), {
          initialized: true,
          initialAdminId: user.uid,
          createdAt: new Date().toISOString()
        });
        setAdminSetupComplete(true);
        console.log('✅ Admin setup marked as complete');
      }

      return { user };
    } catch (error) {
      console.error('❌ Registration error:', error);
      return { error };
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    try {
      console.log('🔐 Signing in user:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log('✅ User signed in:', user.uid);

      // Check if email is verified
      if (!user.emailVerified) {
        // Sign out the user immediately
        await signOut(auth);
        throw new Error(
          'Please verify your email address before logging in. ' +
          'Check your inbox for the verification email. ' +
          'If you need to resend the verification email, click the link on the login page.'
        );
      }

      // Get user role and data
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserRole(userData.role);
        console.log('📄 User role set:', userData.role);
        
        // Update last login timestamp and email verification status
        await updateDoc(doc(db, 'users', user.uid), {
          lastLogin: new Date().toISOString(),
          emailVerified: true // Update our Firestore record
        });
      } else {
        console.warn('⚠️ User document not found in Firestore');
        // Create a basic user document if it doesn't exist
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: 'parent', // Default role
          signInMethods: ['password'],
          emailVerified: true,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        });
        setUserRole('parent');
      }

      return { user };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      return { error };
    }
  };

  // Check if user has Google linked
  const hasGoogleLinked = async (userId = null) => {
    try {
      const uid = userId || user?.uid;
      if (!uid) return false;
      
      // Check the current Firebase Auth session for Google provider
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === uid) {
        const isCurrentlyGoogle = currentUser.providerData.some(provider => provider.providerId === 'google.com');
        console.log('🔍 Current session Google provider check:', isCurrentlyGoogle);
        
        // If Google provider is present in session, check if it's disabled in database
        if (isCurrentlyGoogle) {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.googleSignInDisabled === true) {
              console.log('🔍 Google provider in session but disabled in database');
              return false;
            }
            return true;
          }
          return true; // Provider exists and no database restrictions
        }
      }
      
      // If no Google provider in current session, check database only
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Check if Google is enabled in database
        if (userData.googleSignInDisabled !== true) {
          const dbHasGoogle = userData.googleLinked === true || (userData.signInMethods || []).includes('google');
          console.log('🔍 Database shows Google linked (no session provider):', dbHasGoogle);
          return dbHasGoogle;
        } else {
          console.log('🔍 Google sign-in is disabled in database');
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking Google link status:', error);
      return false;
    }
  };

  // Enhanced disable Google sign-in that actually prevents future sign-ins
  const disableGoogleSignIn = async (userId = null) => {
    try {
      const uid = userId || user?.uid;
      if (!uid) throw new Error('No user ID provided');
      
      console.log('🔗 Starting Google sign-in disable process for user:', uid);
      
      const userRef = doc(db, 'users', uid);
      
      // Check if user is currently signed in via Google
      const currentUser = auth.currentUser;
      console.log('👤 Current auth user:', currentUser ? currentUser.uid : 'None');
      
      if (currentUser && currentUser.uid === uid) {
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('📄 User data for sign-out check:', {
            signInMethods: userData.signInMethods,
            providerData: currentUser.providerData.map(p => p.providerId)
          });
          
          // Check if they're currently signed in via Google
          const isCurrentlyGoogle = currentUser.providerData.some(provider => provider.providerId === 'google.com');
          const hasPassword = userData.signInMethods && userData.signInMethods.includes('password');
          
          if (isCurrentlyGoogle) {
            if (!hasPassword) {
              console.log('⚠️ User signed in exclusively via Google, forcing sign out...');
              await signOut(auth);
            } else {
              console.log('ℹ️ User has both password and Google, unlinking Google provider...');
              // Actually unlink the Google provider from the current user
              try {
                console.log('🔗 Unlinking Google provider from current user session...');
                
                // First, let's check what providers are currently linked
                console.log('📊 Current providers before unlink:', currentUser.providerData.map(p => p.providerId));
                
                // Unlink the Google provider
                const updatedUser = await unlink(currentUser, 'google.com');
                console.log('✅ Google provider unlinked from Firebase Auth');
                console.log('📊 Providers after unlink:', updatedUser.providerData.map(p => p.providerId));
                
                // Do NOT sign out - user should remain logged in with their password method
                console.log('ℹ️ Google provider unlinked successfully, user remains signed in with password');
              } catch (unlinkError) {
                console.log('❌ Could not unlink Google provider:', unlinkError);
                console.log('📊 Error details:', unlinkError.code, unlinkError.message);
                
                // Continue anyway - the database update will prevent future Google sign-ins
                console.log('ℹ️ Continuing with database update despite unlink error');
              }
            }
          } else {
            console.log('ℹ️ User not currently signed in via Google, no sign-out needed');
          }
        }
      } else {
        console.log('ℹ️ No current user or different user, no sign-out needed');
      }
      
      // Update user document to disable Google sign-in
      console.log('📝 Updating user document to disable Google sign-in...');
      await updateDoc(userRef, {
        googleLinked: false,
        googleSignInDisabled: true,
        googleData: null,
        lastUpdated: new Date()
      });
      
      // Remove 'google' from sign-in methods
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const signInMethods = userDoc.data().signInMethods || [];
        const updatedMethods = signInMethods.filter(method => method !== 'google');
        
        console.log('🔄 Updating sign-in methods:', { from: signInMethods, to: updatedMethods });
        
        await updateDoc(userRef, {
          signInMethods: updatedMethods
        });
      }
      
      console.log('✅ Google sign-in disabled for user:', uid);
      
      // Additional logging to help debug
      if (currentUser && currentUser.uid === uid) {
        console.log('🔍 Current user status after Google disable:', {
          uid: currentUser.uid,
          providerData: currentUser.providerData.map(p => p.providerId),
          emailVerified: currentUser.emailVerified
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Error disabling Google sign-in:', error);
      return { error };
    }
  };

  // Enable Google sign-in for a user
  const enableGoogleSignIn = async (userId = null) => {
    try {
      const uid = userId || user?.uid;
      if (!uid) throw new Error('No user ID provided');
      
      console.log('🔗 Starting Google sign-in enable process for user:', uid);
      
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        googleLinked: true,
        googleSignInDisabled: false,
        lastUpdated: new Date()
      });
      
      // Add 'google' to sign-in methods if not already there
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const signInMethods = userDoc.data().signInMethods || [];
        if (!signInMethods.includes('google')) {
          signInMethods.push('google');
          console.log('🔄 Adding google to sign-in methods:', signInMethods);
          await updateDoc(userRef, {
            signInMethods: signInMethods
          });
        } else {
          console.log('ℹ️ Google already in sign-in methods');
        }
      }
      
      console.log('✅ Google sign-in enabled for user:', uid);
      return { success: true };
    } catch (error) {
      console.error('❌ Error enabling Google sign-in:', error);
      return { error };
    }
  };

  // Pre-authentication check for Google sign-in
  const checkGoogleSignInAllowed = async (email) => {
    try {
      // Check if any user with this email has Google sign-in disabled
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        if (userData.googleSignInDisabled === true) {
          console.warn('⚠️ Google sign-in blocked for email:', email);
          return {
            allowed: false,
            error: 'Google sign-in has been disabled for this account. Please contact support or use email/password sign-in.'
          };
        }
      }
      
      return { allowed: true };
    } catch (error) {
      console.error('Error checking Google sign-in permission:', error);
      return { allowed: true }; // Allow by default if check fails
    }
  };

  // Enhanced Google sign-in with role verification and disabled check
  const signInWithGoogle = async (expectedRole = 'parent') => {
    try {
      console.log('🔐 Signing in with Google for role:', expectedRole);
      
      const provider = new GoogleAuthProvider();
      // Add additional scopes if needed
      provider.addScope('email');
      provider.addScope('profile');
      
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      
      console.log('✅ Google sign in successful:', user.uid);

      // Check if this is a new user (using additionalUserInfo)
      const isNewUser = userCredential.user.metadata.creationTime === userCredential.user.metadata.lastSignInTime;
      
      // Check if user already exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        // Check if Google sign-in is disabled for this user
        const userData = userDoc.data();
        if (userData.googleSignInDisabled === true) {
          await signOut(auth);
          throw new Error(
            'Google sign-in has been disabled for this account. ' +
            'Please use your email and password to sign in instead.'
          );
        }
      }
      
      if (!userDoc.exists()) {
        console.log('❌ New Google user attempting sign-in');
        
        // For new users, only allow parent role
        if (expectedRole === 'admin') {
          return { 
            error: new Error('Admin accounts cannot be created via Google sign-in. Please contact an administrator.'),
            isNewUser: true 
          };
        }
        
        // Reject new Google users - they must sign up with access code first
        console.log('🗑️ Deleting unauthorized Google user from Firebase Auth...');
        try {
          // Delete the user from Firebase Auth since they shouldn't have been created
          await user.delete();
          console.log('✅ Unauthorized Google user deleted from Firebase Auth');
        } catch (deleteError) {
          console.error('❌ Error deleting unauthorized user:', deleteError);
          // If deletion fails, at least sign them out
          await signOut(auth);
        }
        
        return {
          error: new Error(
            'No account found with this Google account. ' +
            'Please sign up first using your access code from the daycare, then you can link your Google account in settings.'
          ),
          isNewUser: true,
          needsRoleVerification: false
        };
      } else {
        // Existing user
        const userData = userDoc.data();
        console.log('✅ Existing user found with role:', userData.role);
        
        // Check if Google sign-in is disabled for this user
        if (userData.googleSignInDisabled === true) {
          console.warn('⚠️ Google sign-in disabled for user:', user.uid);
          // Sign out the user immediately and revoke their access
          await signOut(auth);
          return {
            error: new Error('Google sign-in has been disabled for this account. Please contact support or use email/password sign-in.'),
            isNewUser: false,
            needsRoleVerification: false
          };
        }
        
        // Check if role matches expected role
        if (userData.role !== expectedRole) {
          console.warn('⚠️ Role mismatch:', userData.role, 'vs expected:', expectedRole);
          return {
            error: new Error(`This Google account is registered as a ${userData.role === 'admin' ? 'Staff/Admin' : 'Parent'}.`),
            user: { ...user, role: userData.role },
            needsRoleVerification: true,
            isNewUser: false
          };
        }
        
        // Update existing user's last login and ensure Google is in sign-in methods
        const signInMethods = userData.signInMethods || [];
        if (!signInMethods.includes('google')) {
          signInMethods.push('google');
        }
        
        await updateDoc(doc(db, 'users', user.uid), {
          lastLogin: new Date().toISOString(),
          signInMethods: signInMethods,
          googleLinked: true,
          googleSignInDisabled: false,
          'googleData.lastSignIn': new Date().toISOString(),
          // Update profile info from Google if missing
          ...((!userData.firstName || !userData.lastName) && user.displayName && {
            firstName: userData.firstName || user.displayName.split(' ')[0] || '',
            lastName: userData.lastName || user.displayName.split(' ').slice(1).join(' ') || '',
          }),
          ...((!userData.profilePicture) && user.photoURL && {
            profilePicture: user.photoURL
          })
        });
        
        setUserRole(userData.role);
        console.log('✅ Existing Google user signed in, role:', userData.role);
        
        return { 
          user: { ...user, role: userData.role }, 
          isNewUser: false,
          needsRoleVerification: false
        };
      }
    } catch (error) {
      console.error('❌ Google sign in error:', error);
      
      // Handle specific Google sign-in errors
      if (error.code === 'auth/popup-closed-by-user') {
        return { error: new Error('Sign-in was cancelled. Please try again.') };
      } else if (error.code === 'auth/popup-blocked') {
        return { error: new Error('Pop-up was blocked. Please allow pop-ups and try again.') };
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        return { error: new Error('An account already exists with this email using a different sign-in method.') };
      }
      
      return { error };
    }
  };

  // Link Google account to existing email/password account
  const linkGoogleAccount = async () => {
    try {
      console.log('🔗 Linking Google account to existing user...');
      
      if (!user) {
        throw new Error('No user signed in');
      }

      const provider = new GoogleAuthProvider();
      const result = await linkWithPopup(user, provider);
      
      console.log('✅ Google account linked successfully');

      // Update user document with Google data
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const signInMethods = userDoc.data().signInMethods || [];
        if (!signInMethods.includes('google')) {
          signInMethods.push('google');
        }
        
        await updateDoc(userDocRef, {
          signInMethods: signInMethods,
          googleLinked: true,
          googleData: {
            uid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            linkedAt: new Date().toISOString()
          },
          // Update profile info from Google if missing
          ...((!userDoc.data().profilePicture) && result.user.photoURL && {
            profilePicture: result.user.photoURL
          })
        });
      }
      
      return { success: true, user: result.user };
    } catch (error) {
      console.error('❌ Google account linking error:', error);
      
      if (error.code === 'auth/credential-already-in-use') {
        return { error: new Error('This Google account is already linked to another account.') };
      } else if (error.code === 'auth/email-already-in-use') {
        return { error: new Error('This email is already associated with another account.') };
      }
      
      return { error };
    }
  };

  // Send password reset email
  const resetPassword = async (email) => {
    try {
      console.log('🔐 Sending password reset email to:', email);
      
      await sendPasswordResetEmail(auth, email);
      
      console.log('✅ Password reset email sent successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Password reset error:', error);
      return { error };
    }
  };

  // Confirm password reset with code
  const confirmPasswordReset = async (oobCode, newPassword) => {
    try {
      console.log('🔐 Confirming password reset...');
      
      // Verify the reset code first
      await verifyPasswordResetCode(auth, oobCode);
      
      // Confirm the password reset
      await confirmPasswordReset(auth, oobCode, newPassword);
      
      console.log('✅ Password reset confirmed successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Password reset confirmation error:', error);
      return { error };
    }
  };

  // Sign out
  const logOut = async () => {
    try {
      console.log('🚪 Signing out user...');
      await signOut(auth);
      setUserRole(null);
      setAdminSetupComplete(null);
      router.push('/auth');
      console.log('✅ User signed out successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Sign out error:', error);
      return { error };
    }
  };

  // Check if admin setup is complete
  useEffect(() => {
    const checkAdminSetup = async () => {
      try {
        console.log('🔍 Checking admin setup status...');
        const adminDoc = await getDoc(doc(db, 'system', 'admin_setup'));
        const isComplete = adminDoc.exists() && adminDoc.data().initialized === true;
        setAdminSetupComplete(isComplete);
        console.log('📊 Admin setup complete:', isComplete);
      } catch (error) {
        console.error('❌ Error checking admin setup:', error);
        setAdminSetupComplete(null);
      }
    };

    checkAdminSetup();
  }, []);

  // Listen for auth state changes
  useEffect(() => {
    console.log('👂 Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔄 Auth state changed:', user ? `User: ${user.uid}` : 'No user');
      
      if (user) {
        // Get user role and data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Only check Google sign-in disabled status if user is actually signed in via Google
            const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');
            
            // Only force sign out if they're signed in exclusively via Google and Google is disabled
            // But don't interfere if we're in the middle of an unlinking process
            if (isGoogleUser && userData.googleSignInDisabled === true) {
              const hasPassword = userData.signInMethods && userData.signInMethods.includes('password');
              
              if (!hasPassword) {
                console.warn('⚠️ User signed in exclusively via Google but Google sign-in is disabled, forcing sign out...');
                await signOut(auth);
                return; // Don't set user state
              } else {
                console.log('ℹ️ User has both Google and password, Google disabled but password available - allowing access');
                // Check if user still has Google provider in current session
                // If not, the unlinking was successful and we should proceed normally
                const currentProviders = user.providerData.map(p => p.providerId);
                console.log('🔍 Current providers after Google disable check:', currentProviders);
              }
            }
            
            setUserRole(userData.role);
            console.log('📄 User role loaded:', userData.role);
          } else {
            console.warn('⚠️ User document not found...');
            
            // Check if this user signed in with email/password (indicating they had a proper account before)
            const hasEmailPassword = user.providerData.some(p => p.providerId === 'password');
            
            if (hasEmailPassword) {
              console.log('🔍 User has email/password auth, checking for orphaned children (account restoration)...');
              
              // Check if there are children waiting for this parent (by email)
              try {
                const childrenQuery = query(
                  collection(db, 'children'), 
                  where('parentEmail', '==', user.email),
                  where('parentRegistered', '==', false)
                );
                const childrenSnapshot = await getDocs(childrenQuery);
                
                if (!childrenSnapshot.empty) {
                  console.log('🔗 Found orphaned children, re-linking to parent...');
                  
                  // Get the first child's access code for re-registration
                  const firstChild = childrenSnapshot.docs[0].data();
                  const accessCode = firstChild.accessCode;
                  
                  // Re-register this parent with their children
                  const reRegistrationData = {
                    uid: user.uid,
                    email: user.email,
                    firstName: firstChild.parentFirstName || '',
                    lastName: firstChild.parentLastName || '',
                    role: 'parent',
                    accessCode: accessCode,
                    parentRegistered: true,
                    signInMethods: user.providerData.map(p => p.providerId === 'google.com' ? 'google' : 'password'),
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                    registrationCompletedAt: new Date().toISOString(),
                    restoredAccount: true, // Flag to track this was a restored account
                    restoredAt: new Date().toISOString()
                  };
                  
                  await setDoc(doc(db, 'users', user.uid), reRegistrationData);
                  
                  // Update all children to link with this parent
                  const batch = writeBatch(db);
                  childrenSnapshot.docs.forEach(doc => {
                    batch.update(doc.ref, {
                      parentId: user.uid,
                      parentRegistered: true,
                      linkedAt: new Date().toISOString()
                    });
                  });
                  await batch.commit();
                  
                  console.log('✅ Successfully restored parent account and linked children');
                  setUserRole('parent');
                } else {
                  // No children found, create basic profile for email/password user
                  console.log('📝 Creating basic parent profile for email/password user...');
                  const basicUserData = {
                    uid: user.uid,
                    email: user.email,
                    role: 'parent',
                    signInMethods: user.providerData.map(p => p.providerId === 'google.com' ? 'google' : 'password'),
                    createdAt: new Date().toISOString(),
                    lastLogin: new Date().toISOString()
                  };
                  
                  await setDoc(doc(db, 'users', user.uid), basicUserData);
                  setUserRole('parent');
                }
              } catch (childLinkError) {
                console.error('❌ Error checking for orphaned children:', childLinkError);
                // Fallback to basic profile
                const basicUserData = {
                  uid: user.uid,
                  email: user.email,
                  role: 'parent',
                  signInMethods: user.providerData.map(p => p.providerId === 'google.com' ? 'google' : 'password'),
                  createdAt: new Date().toISOString(),
                  lastLogin: new Date().toISOString()
                };
                
                await setDoc(doc(db, 'users', user.uid), basicUserData);
                setUserRole('parent');
              }
            } else {
              // This is a Google-only user trying to bypass registration
              console.warn('❌ Google-only user found without proper registration, deleting...');
              try {
                // Delete the user from Firebase Auth since they shouldn't exist
                await user.delete();
                console.log('✅ Unauthorized Google-only user deleted from Firebase Auth');
              } catch (deleteError) {
                console.error('❌ Error deleting unauthorized user in onAuthStateChanged:', deleteError);
                // If deletion fails, at least sign them out
                await signOut(auth);
              }
              return; // Don't set user state
            }
          }
        } catch (error) {
          console.error('❌ Error fetching user role:', error);
          setUserRole(null);
        }
        
        setUser(user);
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => {
      console.log('🔄 Cleaning up auth state listener');
      unsubscribe();
    };
  }, []);

  // Context value
  const value = {
    user,
    userRole,
    loading,
    adminSetupComplete,
    registerUser,
    signIn,
    signInWithGoogle,
    linkGoogleAccount,
    hasGoogleLinked,
    disableGoogleSignIn,
    enableGoogleSignIn,
    checkGoogleSignInAllowed,
    resetPassword,
    confirmPasswordReset,
    logOut
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};