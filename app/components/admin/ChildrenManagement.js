// components/admin/ChildrenManagement.js (Updated with improved access code generation)
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, onSnapshot, query, orderBy, addDoc, setDoc, where, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import ChildDetailsModal from './ChildDetailsModal';

const ChildrenManagement = () => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAddChildModal, setShowAddChildModal] = useState(false);
  const [showAddSiblingModal, setShowAddSiblingModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('All');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deleteConfirmChild, setDeleteConfirmChild] = useState(null);

  // Add child form state
  const [newChildData, setNewChildData] = useState({
    // Child information
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    group: '',
    
    // Parent information
    parentFirstName: '',
    parentLastName: '',
    parentEmail: '',
    parentPhone: '',
    
    // Additional information
    allergies: '',
    medicalConditions: '',
    medications: '',
    emergencyContact: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    doctorName: '',
    doctorPhone: '',
    
    // Pickup person information
    pickupPersonName: '',
    pickupPersonPhone: '',
    pickupPersonRelationship: '',
    
    // Special notes
    specialNeeds: '',
    dietaryRestrictions: '',
    notes: ''
  });

  // Add sibling form state
  const [siblingData, setSiblingData] = useState({
    // Child information
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    group: '',
    
    // Parent information (will be auto-filled)
    parentFirstName: '',
    parentLastName: '',
    parentEmail: '',
    parentPhone: '',
    parentId: '',
    
    // Additional information
    allergies: '',
    medicalConditions: '',
    medications: '',
    emergencyContact: '',
    emergencyPhone: '',
    emergencyRelationship: '',
    doctorName: '',
    doctorPhone: '',
    
    // Pickup person information
    pickupPersonName: '',
    pickupPersonPhone: '',
    pickupPersonRelationship: '',
    
    // Special notes
    specialNeeds: '',
    dietaryRestrictions: '',
    notes: ''
  });

  // Real-time listener for children
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'children'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        const childrenData = [];
        snapshot.forEach(doc => {
          childrenData.push({ id: doc.id, ...doc.data() });
        });
        setChildren(childrenData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching children:', error);
        setError('Failed to load children');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Generate random access code
  const generateAccessCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  // Auto-assign group based on age
  const calculateGroup = (dateOfBirth) => {
    if (!dateOfBirth) return 'Infant';
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                       (today.getMonth() - birthDate.getMonth());
    
    if (ageInMonths < 18) {
      return 'Infant';
    } else if (ageInMonths < 36) {
      return 'Toddler';
    } else {
      return 'Pre-K';
    }
  };

  // Handle form input changes
  const handleNewChildChange = (e) => {
    const { name, value } = e.target;
    let updatedData = {
      ...newChildData,
      [name]: value
    };

    // Auto-calculate group when date of birth changes
    if (name === 'dateOfBirth') {
      updatedData.group = calculateGroup(value);
    }

    setNewChildData(updatedData);
  };

  // Handle sibling form input changes
  const handleSiblingChange = (e) => {
    const { name, value } = e.target;
    let updatedData = {
      ...siblingData,
      [name]: value
    };

    // Auto-calculate group when date of birth changes
    if (name === 'dateOfBirth') {
      updatedData.group = calculateGroup(value);
    }

    setSiblingData(updatedData);
  };

  // Open add sibling modal with parent data
  const openAddSiblingModal = (existingChild) => {
    setSiblingData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: '',
      group: '',
      parentFirstName: existingChild.parentFirstName,
      parentLastName: existingChild.parentLastName,
      parentEmail: existingChild.parentEmail,
      parentPhone: existingChild.parentPhone,
      parentId: existingChild.parentId,
      allergies: '',
      medicalConditions: '',
      medications: '',
      emergencyContact: existingChild.emergencyContact || '',
      emergencyPhone: existingChild.emergencyPhone || '',
      emergencyRelationship: existingChild.emergencyRelationship || '',
      doctorName: existingChild.doctorName || '',
      doctorPhone: existingChild.doctorPhone || '',
      pickupPersonName: existingChild.pickupPersonName || '',
      pickupPersonPhone: existingChild.pickupPersonPhone || '',
      pickupPersonRelationship: existingChild.pickupPersonRelationship || '',
      specialNeeds: '',
      dietaryRestrictions: '',
      notes: ''
    });
    setShowAddSiblingModal(true);
  };

  // Handle adding new child
  const handleAddChild = async (e) => {
    e.preventDefault();
    
    // Generate and show success modal immediately
    const accessCode = generateAccessCode();
    const calculatedGroup = newChildData.group || calculateGroup(newChildData.dateOfBirth);
    
    // Show success message with form data immediately
    const successMsg = `🎉 Child Successfully Added!

👶 Child: ${newChildData.firstName} ${newChildData.lastName}
👨‍👩‍👧‍👦 Parent: ${newChildData.parentFirstName} ${newChildData.parentLastName}
📧 Email: ${newChildData.parentEmail}
📱 Phone: ${newChildData.parentPhone}
🏫 Group: ${calculatedGroup}

🔑 PARENT ACCESS CODE: ${accessCode}

📋 IMPORTANT INSTRUCTIONS FOR PARENT:
1. Give this access code to the parent
2. Parent should visit your signup page
3. Parent enters this code during registration
4. Code will link their account to their child's profile
5. Parent can then view daily updates, activities, meals, etc.

⏰ Code expires in 30 days
💾 Code has been saved to the system
🔗 Parent registration link: [Your website]/auth/signup?type=parent`;

    setSuccessMessage(successMsg);
    setShowAddChildModal(false); // Close the add child modal to show success modal in front
    
    // Process the form submission in the background
    try {
      setLoading(true);
      setError('');
      
      // Ensure access code is unique
      let finalAccessCode = accessCode;
      let isUnique = false;
      
      while (!isUnique) {
        const existingCodes = await getDocs(
          query(collection(db, 'accessCodes'), where('code', '==', finalAccessCode))
        );
        
        if (existingCodes.empty) {
          isUnique = true;
        } else {
          finalAccessCode = generateAccessCode();
          // Update the success message with the new access code
          const updatedSuccessMsg = successMsg.replace(accessCode, finalAccessCode);
          setSuccessMessage(updatedSuccessMsg);
        }
      }
      
      console.log('Generated unique access code:', finalAccessCode);
      
      // Prepare child data
      const childData = {
        // Child information
        firstName: newChildData.firstName.trim(),
        lastName: newChildData.lastName.trim(),
        dateOfBirth: newChildData.dateOfBirth,
        gender: newChildData.gender,
        group: calculatedGroup,
        
        // Parent information
        parentFirstName: newChildData.parentFirstName.trim(),
        parentLastName: newChildData.parentLastName.trim(),
        parentEmail: newChildData.parentEmail.trim().toLowerCase(),
        parentPhone: newChildData.parentPhone.trim(),
        
        // Medical and emergency information
        allergies: newChildData.allergies ? 
          newChildData.allergies.split(',').map(a => a.trim()).filter(a => a) : [],
        medicalConditions: newChildData.medicalConditions ? 
          newChildData.medicalConditions.split(',').map(m => m.trim()).filter(m => m) : [],
        medications: newChildData.medications ? 
          newChildData.medications.split(',').map(m => m.trim()).filter(m => m) : [],
        emergencyContact: newChildData.emergencyContact.trim(),
        emergencyPhone: newChildData.emergencyPhone.trim(),
        emergencyRelationship: newChildData.emergencyRelationship.trim(),
        doctorName: newChildData.doctorName.trim(),
        doctorPhone: newChildData.doctorPhone.trim(),
        
        // Pickup person information
        pickupPersonName: newChildData.pickupPersonName.trim(),
        pickupPersonPhone: newChildData.pickupPersonPhone.trim(),
        pickupPersonRelationship: newChildData.pickupPersonRelationship.trim(),
        
        // Additional information
        specialNeeds: newChildData.specialNeeds.trim(),
        dietaryRestrictions: newChildData.dietaryRestrictions.trim(),
        notes: newChildData.notes.trim(),
        
        // System fields
        accessCode: finalAccessCode,
        parentRegistered: false,
        parentId: null,
        enrollmentStatus: 'active',
        createdAt: new Date().toISOString(),
        createdBy: 'admin',
        updatedAt: new Date().toISOString()
      };
      
      // Add child to Firestore
      const childRef = await addDoc(collection(db, 'children'), childData);
      console.log('Child added with ID:', childRef.id);
      
      // Create access code document for parent registration
      const accessCodeData = {
        code: finalAccessCode,
        childId: childRef.id,
        parentEmail: newChildData.parentEmail.trim().toLowerCase(),
        parentName: `${newChildData.parentFirstName.trim()} ${newChildData.parentLastName.trim()}`,
        childName: `${newChildData.firstName.trim()} ${newChildData.lastName.trim()}`,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        maxUses: 1,
        usesLeft: 1,
        used: false,
        parentId: null,
        note: `Registration code for ${newChildData.parentFirstName.trim()} ${newChildData.parentLastName.trim()} - child: ${newChildData.firstName.trim()} ${newChildData.lastName.trim()}`
      };
      
      await setDoc(doc(db, 'accessCodes', finalAccessCode), accessCodeData);
      console.log('Access code document created:', finalAccessCode);
      
      // Reset form
      setNewChildData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        group: '',
        parentFirstName: '',
        parentLastName: '',
        parentEmail: '',
        parentPhone: '',
        allergies: '',
        medicalConditions: '',
        medications: '',
        emergencyContact: '',
        emergencyPhone: '',
        emergencyRelationship: '',
        doctorName: '',
        doctorPhone: '',
        pickupPersonName: '',
        pickupPersonPhone: '',
        pickupPersonRelationship: '',
        specialNeeds: '',
        dietaryRestrictions: '',
        notes: ''
      });
      
    } catch (error) {
      console.error('Error adding child:', error);
      setError(`Failed to add child: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding sibling child
  const handleAddSibling = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const calculatedGroup = siblingData.group || calculateGroup(siblingData.dateOfBirth);
      
      // Prepare sibling data
      const siblingChildData = {
        // Child information
        firstName: siblingData.firstName.trim(),
        lastName: siblingData.lastName.trim(),
        dateOfBirth: siblingData.dateOfBirth,
        gender: siblingData.gender,
        group: calculatedGroup,
        
        // Parent information (from existing parent)
        parentFirstName: siblingData.parentFirstName,
        parentLastName: siblingData.parentLastName,
        parentEmail: siblingData.parentEmail,
        parentPhone: siblingData.parentPhone,
        parentId: siblingData.parentId,
        parentRegistered: true, // Parent is already registered
        
        // Medical and emergency information
        allergies: siblingData.allergies ? 
          siblingData.allergies.split(',').map(a => a.trim()).filter(a => a) : [],
        medicalConditions: siblingData.medicalConditions ? 
          siblingData.medicalConditions.split(',').map(m => m.trim()).filter(m => m) : [],
        medications: siblingData.medications ? 
          siblingData.medications.split(',').map(m => m.trim()).filter(m => m) : [],
        emergencyContact: siblingData.emergencyContact.trim(),
        emergencyPhone: siblingData.emergencyPhone.trim(),
        emergencyRelationship: siblingData.emergencyRelationship.trim(),
        doctorName: siblingData.doctorName.trim(),
        doctorPhone: siblingData.doctorPhone.trim(),
        
        // Pickup person information
        pickupPersonName: siblingData.pickupPersonName.trim(),
        pickupPersonPhone: siblingData.pickupPersonPhone.trim(),
        pickupPersonRelationship: siblingData.pickupPersonRelationship.trim(),
        
        // Additional information
        specialNeeds: siblingData.specialNeeds.trim(),
        dietaryRestrictions: siblingData.dietaryRestrictions.trim(),
        notes: siblingData.notes.trim(),
        
        // System fields
        accessCode: null, // No access code needed for siblings
        enrollmentStatus: 'active',
        createdAt: new Date().toISOString(),
        createdBy: 'admin',
        updatedAt: new Date().toISOString()
      };
      
      // Add sibling to Firestore
      const siblingRef = await addDoc(collection(db, 'children'), siblingChildData);
      console.log('Sibling added with ID:', siblingRef.id);
      
      // Update parent's linkedChildIds array
      if (siblingData.parentId) {
        try {
          const parentRef = doc(db, 'users', siblingData.parentId);
          const parentDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', siblingData.parentId)));
          
          if (!parentDoc.empty) {
            const parentData = parentDoc.docs[0].data();
            const currentChildIds = parentData.linkedChildIds || [];
            const updatedChildIds = [...currentChildIds, siblingRef.id];
            
            await updateDoc(parentRef, {
              linkedChildIds: updatedChildIds,
              updatedAt: new Date().toISOString()
            });
            
            console.log('Updated parent with new child ID:', siblingRef.id);
          }
        } catch (parentUpdateError) {
          console.warn('Could not update parent linkedChildIds:', parentUpdateError);
        }
      }
      
      // Show success message
      const successMsg = `🎉 Sibling Successfully Added!

👶 Child: ${siblingData.firstName} ${siblingData.lastName}
👨‍👩‍👧‍👦 Parent: ${siblingData.parentFirstName} ${siblingData.parentLastName}
📧 Email: ${siblingData.parentEmail}
🏫 Group: ${calculatedGroup}

✅ This child has been automatically linked to the existing parent account
📱 The parent can now see this child in their dashboard
🔗 No access code needed - parent already has access

The parent will see this new child immediately in their child profile tabs.`;

      setSuccessMessage(successMsg);
      setShowAddSiblingModal(false);
      
      // Reset sibling form
      setSiblingData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: '',
        group: '',
        parentFirstName: '',
        parentLastName: '',
        parentEmail: '',
        parentPhone: '',
        parentId: '',
        allergies: '',
        medicalConditions: '',
        medications: '',
        emergencyContact: '',
        emergencyPhone: '',
        emergencyRelationship: '',
        doctorName: '',
        doctorPhone: '',
        pickupPersonName: '',
        pickupPersonPhone: '',
        pickupPersonRelationship: '',
        specialNeeds: '',
        dietaryRestrictions: '',
        notes: ''
      });
      
    } catch (error) {
      console.error('Error adding sibling:', error);
      setError(`Failed to add sibling: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter children
  const filteredChildren = children.filter(child => {
    if (!searchTerm.trim()) {
      const matchesGroup = filterGroup === 'All' || child.group === filterGroup;
      return matchesGroup;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      child.firstName?.toLowerCase().includes(searchLower) ||
      child.lastName?.toLowerCase().includes(searchLower) ||
      child.parentFirstName?.toLowerCase().includes(searchLower) ||
      child.parentLastName?.toLowerCase().includes(searchLower) ||
      child.parentEmail?.toLowerCase().includes(searchLower) ||
      child.accessCode?.toLowerCase().includes(searchLower) ||
      `${child.firstName} ${child.lastName}`.toLowerCase().includes(searchLower) ||
      `${child.parentFirstName} ${child.parentLastName}`.toLowerCase().includes(searchLower);
    
    const matchesGroup = filterGroup === 'All' || child.group === filterGroup;
    
    return matchesSearch && matchesGroup;
  });

  // Calculate age
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    if (age < 1) {
      const ageMonths = (today.getMonth() + 12 - birthDate.getMonth()) % 12;
      return `${ageMonths} month${ageMonths !== 1 ? 's' : ''}`;
    }
    
    return `${age} year${age !== 1 ? 's' : ''}`;
  };

  const handleViewChild = (child) => {
    setSelectedChild(child);
    setShowModal(true);
  };

  // Handle deleting children (both registered and unregistered)
  const handleDeleteChild = async (childId, childName, accessCode, parentId, parentRegistered) => {
    try {
      setLoading(true);
      setError('');
      
      // Delete all child-related data first
      const collections = ['activities', 'attendance', 'meals', 'naps'];
      
      for (const collectionName of collections) {
        try {
          const childDataQuery = query(
            collection(db, collectionName),
            where('childId', '==', childId)
          );
          const childDataSnapshot = await getDocs(childDataQuery);
          
          const deletePromises = childDataSnapshot.docs.map(doc => deleteDoc(doc.ref));
          await Promise.all(deletePromises);
          
          if (childDataSnapshot.docs.length > 0) {
            console.log(`Deleted ${childDataSnapshot.docs.length} ${collectionName} records for child:`, childId);
          }
        } catch (error) {
          console.warn(`Error deleting ${collectionName} for child ${childId}:`, error);
        }
      }
      
      // Delete the child document
      await deleteDoc(doc(db, 'children', childId));
      console.log('Child document deleted:', childId);
      
      // Delete the associated access code document if it exists
      if (accessCode) {
        try {
          await deleteDoc(doc(db, 'accessCodes', accessCode));
          console.log('Access code document deleted:', accessCode);
        } catch (accessCodeError) {
          console.warn('Access code document may not exist:', accessCodeError);
        }
      }
      
      // If parent is registered, delete their user account and related data
      if (parentRegistered && parentId) {
        try {
          // Delete parent's user document from Firestore
          await deleteDoc(doc(db, 'users', parentId));
          console.log('Parent user document deleted:', parentId);
          
          // Attempt to delete Firebase Auth user
          try {
            const response = await fetch('/api/delete-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ uid: parentId }),
            });
            
            const result = await response.json();
            
            if (result.success) {
              console.log('Firebase Auth user deleted successfully');
            } else {
              console.warn('Firebase Auth user deletion requires manual action:', result.message);
              
              // Show manual deletion instructions
              const instructions = result.instructions?.join('\n') || 'Manual deletion required in Firebase Console';
              alert(
                `Parent account data deleted, but Firebase Auth user requires manual deletion:\n\n${instructions}`
              );
            }
          } catch (authDeleteError) {
            console.warn('Error calling delete-user API:', authDeleteError);
            alert(
              `Parent account data deleted, but Firebase Auth user requires manual deletion:\n\n` +
              `1. Go to Firebase Console → Authentication → Users\n` +
              `2. Search for user UID: ${parentId}\n` +
              `3. Click the three dots menu → Delete user\n` +
              `4. Confirm deletion`
            );
          }
          
        } catch (parentDeleteError) {
          console.warn('Error deleting parent data:', parentDeleteError);
          // Continue with success even if parent deletion fails
        }
      }
      
      const deletionType = parentRegistered ? 'registered' : 'unregistered';
      setSuccessMessage(`${deletionType === 'registered' ? 'Registered child' : 'Child'} "${childName}" and ${deletionType === 'registered' ? 'associated parent account have' : 'access code has'} been successfully removed from the system.`);
      setDeleteConfirmChild(null);
      
    } catch (error) {
      console.error('Error deleting child:', error);
      setError(`Failed to delete child: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Manage Children</h2>
        <div className="flex items-center gap-4">
          <span className="badge badge-lg">{children.length} children</span>
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddChildModal(true)}
          >
            Add New Child
          </button>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="stats shadow w-full mb-6">
        <div className="stat">
          <div className="stat-figure text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="stat-title">Total Children</div>
          <div className="stat-value text-primary">{children.length}</div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="stat-title">Registered Parents</div>
          <div className="stat-value text-secondary">
            {children.filter(child => child.parentRegistered).length}
          </div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-accent">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="stat-title">Parents with Multiple Children</div>
          <div className="stat-value text-accent">
            {(() => {
              const parentCounts = {};
              children.forEach(child => {
                if (child.parentId) {
                  parentCounts[child.parentId] = (parentCounts[child.parentId] || 0) + 1;
                }
              });
              return Object.values(parentCounts).filter(count => count > 1).length;
            })()}
          </div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-info">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div className="stat-title">Awaiting Registration</div>
          <div className="stat-value text-info">
            {children.filter(child => !child.parentRegistered).length}
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{error}</span>
          <button className="btn btn-square btn-ghost btn-sm" onClick={() => setError('')}>✕</button>
        </div>
      )}

      {successMessage && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">
              {successMessage.includes('removed') ? '✅ Child Deleted' : '🎉 Child Successfully Added!'}
            </h3>
            <div className="bg-base-200 p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">{successMessage}</pre>
            </div>
            <div className="modal-action">
              {successMessage.includes('ACCESS CODE') && (
                <>
                  <button 
                    className="btn btn-outline"
                    onClick={() => {
                      const codeMatch = successMessage.match(/ACCESS CODE: ([A-Z0-9]{8})/);
                      if (codeMatch) {
                        navigator.clipboard.writeText(codeMatch[1]);
                        alert('Access code copied to clipboard!');
                      }
                    }}
                  >
                    Copy Access Code
                  </button>
                  <button 
                    className="btn btn-outline"
                    onClick={() => window.print()}
                  >
                    Print Instructions
                  </button>
                </>
              )}
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setSuccessMessage('');
                  // No need to close add child modal since it's already closed
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
        <div className="form-control w-full sm:w-auto">
          <div className="join">
            <input
              type="text"
              placeholder="Search by child or parent name..."
              className="input input-bordered join-item flex-1 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  // Search is already handled by the onChange event
                }
              }}
            />
            <button 
              className="btn btn-square btn-primary join-item"
              onClick={() => {
                // Focus the input field for better UX
                const searchInput = document.querySelector('input[placeholder="Search by child or parent name..."]');
                if (searchInput) searchInput.focus();
              }}
              title="Search children"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            {searchTerm && (
              <button 
                className="btn btn-square btn-ghost join-item"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            className="select select-bordered w-full sm:w-auto"
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
          >
            <option value="All">All Groups</option>
            <option value="Infant">Infant (0-18 months)</option>
            <option value="Toddler">Toddler (18 months-3 years)</option>
            <option value="Pre-K">Pre-K (3-5 years)</option>
          </select>
          
          {searchTerm && (
            <div className="badge badge-info">
              {filteredChildren.length} result{filteredChildren.length !== 1 ? 's' : ''} found
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && children.length === 0 ? (
          <div className="col-span-full flex justify-center items-center min-h-[400px]">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : filteredChildren.length === 0 ? (
          <div className="col-span-full text-center py-8">
            {children.length === 0 ? (
              <div>
                <h3 className="font-bold mb-2">No children in the system yet</h3>
                <p className="text-base-content/70">Click "Add New Child" to register your first child.</p>
              </div>
            ) : (
              <div className="text-base-content/70">No children found matching your search criteria.</div>
            )}
          </div>
        ) : (
          filteredChildren.map(child => (
            <div key={child.id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-4xl">
                    {child.gender === 'Female' ? '👧' : child.gender === 'Male' ? '👦' : '🧒'}
                  </div>
                  <div>
                    <h3 className="card-title">{child.firstName} {child.lastName}</h3>
                    <p className="text-sm opacity-75">Age: {calculateAge(child.dateOfBirth)}</p>
                                      <div className="badge badge-outline">{child.group}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm">
                  Parent: {child.parentFirstName} {child.parentLastName}
                </p>
                <p className="text-sm opacity-75">{child.parentEmail}</p>
                <div className={`badge ${child.parentRegistered ? 'badge-success' : 'badge-warning'}`}>
                  {child.parentRegistered ? 'Parent Registered' : 'Awaiting Registration'}
                </div>
                {child.parentRegistered && (
                  <div className="text-xs text-base-content/70">
                    📱 Parent can add more children to their account
                  </div>
                )}
                {!child.parentRegistered && (
                  <div className="text-sm bg-base-200 p-2 rounded">
                    Access Code: <span className="font-mono">{child.accessCode}</span>
                  </div>
                )}
              </div>
                
                <div className="card-actions justify-end mt-4">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => handleViewChild(child)}
                  >
                    View Details
                  </button>
                  {child.parentRegistered && (
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => openAddSiblingModal(child)}
                      title="Add another child under the same parent"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Sibling
                    </button>
                  )}
                  {!child.parentRegistered && (
                    <button 
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        navigator.clipboard.writeText(child.accessCode);
                        alert(`Access code ${child.accessCode} copied to clipboard!`);
                      }}
                    >
                      Copy Code
                    </button>
                  )}
                  <button 
                    className="btn btn-error btn-sm"
                    onClick={() => setDeleteConfirmChild(child)}
                    title={child.parentRegistered ? "Delete registered child and parent account" : "Delete unregistered child"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Child Modal */}
      {showAddChildModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <h3 className="font-bold text-lg mb-6">Add New Child to Daycare</h3>
            
            <form onSubmit={handleAddChild} className="space-y-6">
              {/* Child Information Section */}
              <div className="card bg-base-100">
                <div className="card-body">
                  <h4 className="card-title text-base">👶 Child Information</h4>
                  
                  <div className="space-y-4">
                    <div className="admin-form-row">
                      <div className="admin-form-control">
                        <label className="label">
                          <span className="label-text">First Name *</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          name="firstName"
                          value={newChildData.firstName}
                          onChange={handleNewChildChange}
                          required
                          placeholder="Enter child's first name"
                        />
                      </div>
                      
                      <div className="admin-form-control">
                        <label className="label">
                          <span className="label-text">Last Name *</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          name="lastName"
                          value={newChildData.lastName}
                          onChange={handleNewChildChange}
                          required
                          placeholder="Enter child's last name"
                        />
                      </div>
                    </div>
                    
                    <div className="admin-form-grid">
                      <div className="admin-form-control">
                        <label className="label">
                          <span className="label-text">Date of Birth *</span>
                        </label>
                        <input
                          type="date"
                          className="input input-bordered w-full"
                          name="dateOfBirth"
                          value={newChildData.dateOfBirth}
                          onChange={handleNewChildChange}
                          required
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      
                      <div className="admin-form-control">
                        <label className="label">
                          <span className="label-text">Gender *</span>
                        </label>
                        <select
                          className="select select-bordered w-full"
                          name="gender"
                          value={newChildData.gender}
                          onChange={handleNewChildChange}
                          required
                        >
                          <option value=""></option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      
                      <div className="admin-form-control">
                        <label className="label">
                          <span className="label-text">Age Group</span>
                        </label>
                        <select
                          className="select select-bordered w-full"
                          name="group"
                          value={newChildData.group}
                          onChange={handleNewChildChange}
                        >
                          <option value="">Auto-calculated</option>
                          <option value="Infant">Infant (0-18 months)</option>
                          <option value="Toddler">Toddler (18 months-3 years)</option>
                          <option value="Pre-K">Pre-K (3-5 years)</option>
                        </select>
                        <label className="label">
                          <span className="label-text-alt">Will be automatically determined based on date of birth</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parent Information Section */}
              <div className="card bg-base-100">
                <div className="card-body">
                  <h4 className="card-title text-base">👨‍👩‍👧‍👦 Parent/Guardian Information</h4>
                  
                                     <div className="space-y-4">
                     <div className="admin-form-row">
                       <div className="admin-form-control">
                         <label className="label">
                           <span className="label-text">Parent's First Name *</span>
                         </label>
                         <input
                           type="text"
                           className="input input-bordered w-full"
                           name="parentFirstName"
                           value={newChildData.parentFirstName}
                           onChange={handleNewChildChange}
                           required
                           placeholder="Enter parent's first name"
                         />
                       </div>
                       
                       <div className="admin-form-control">
                         <label className="label">
                           <span className="label-text">Parent's Last Name *</span>
                         </label>
                         <input
                           type="text"
                           className="input input-bordered w-full"
                           name="parentLastName"
                           value={newChildData.parentLastName}
                           onChange={handleNewChildChange}
                           required
                           placeholder="Enter parent's last name"
                         />
                       </div>
                     </div>
                     
                     <div className="admin-form-row">
                       <div className="admin-form-control">
                         <label className="label">
                           <span className="label-text">Email Address *</span>
                         </label>
                         <input
                           type="email"
                           className="input input-bordered w-full"
                           name="parentEmail"
                           value={newChildData.parentEmail}
                           onChange={handleNewChildChange}
                           required
                           placeholder="parent@email.com"
                         />
                         <label className="label">
                           <span className="label-text-alt">This email will be used for the parent portal account</span>
                         </label>
                       </div>
                       
                       <div className="admin-form-control">
                         <label className="label">
                           <span className="label-text">Phone Number *</span>
                         </label>
                         <input
                           type="tel"
                           className="input input-bordered w-full"
                           name="parentPhone"
                           value={newChildData.parentPhone}
                           onChange={handleNewChildChange}
                           required
                           placeholder="(555) 123-4567"
                         />
                       </div>
                     </div>
                   </div>
                </div>
              </div>

              {/* Medical Information Section */}
              <div className="card bg-base-100">
                <div className="card-body">
                  <h4 className="card-title text-base">🏥 Medical Information</h4>
                  
                                     <div className="space-y-4">
                     <div className="admin-form-row">
                       <div className="admin-form-control">
                         <label className="label">
                           <span className="label-text">Allergies</span>
                         </label>
                         <input
                           type="text"
                           className="input input-bordered w-full"
                           name="allergies"
                           value={newChildData.allergies}
                           onChange={handleNewChildChange}
                           placeholder="e.g., Peanuts, Dairy, None (separated by commas)"
                         />
                       </div>
                       
                       <div className="admin-form-control">
                         <label className="label">
                           <span className="label-text">Medical Conditions</span>
                         </label>
                         <input
                           type="text"
                           className="input input-bordered w-full"
                           name="medicalConditions"
                           value={newChildData.medicalConditions}
                           onChange={handleNewChildChange}
                           placeholder="e.g., Asthma, Diabetes, None (separated by commas)"
                         />
                       </div>
                     </div>
                     
                     <div className="admin-form-row">
                       <div className="admin-form-control">
                         <label className="label">
                           <span className="label-text">Current Medications</span>
                         </label>
                         <input
                           type="text"
                           className="input input-bordered w-full"
                           name="medications"
                           value={newChildData.medications}
                           onChange={handleNewChildChange}
                           placeholder="e.g., Inhaler, Insulin, None (separated by commas)"
                         />
                       </div>
                       
                       <div className="admin-form-control">
                         <label className="label">
                           <span className="label-text">Dietary Restrictions</span>
                         </label>
                         <input
                           type="text"
                           className="input input-bordered w-full"
                           name="dietaryRestrictions"
                           value={newChildData.dietaryRestrictions}
                           onChange={handleNewChildChange}
                           placeholder="e.g., Vegetarian, Gluten-free, None"
                         />
                       </div>
                     </div>
                     
                     <div className="admin-form-row">
                       <div className="admin-form-control">
                         <label className="label">
                           <span className="label-text">Doctor's Name</span>
                         </label>
                         <input
                           type="text"
                           className="input input-bordered w-full"
                           name="doctorName"
                           value={newChildData.doctorName}
                           onChange={handleNewChildChange}
                           placeholder="Dr. Smith"
                         />
                       </div>
                       
                       <div className="admin-form-control">
                         <label className="label">
                           <span className="label-text">Doctor's Phone</span>
                         </label>
                         <input
                           type="tel"
                           className="input input-bordered w-full"
                           name="doctorPhone"
                           value={newChildData.doctorPhone}
                           onChange={handleNewChildChange}
                           placeholder="(555) 123-4567"
                         />
                       </div>
                     </div>
                   </div>
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="card bg-base-100">
                <div className="card-body">
                  <h4 className="card-title text-base">🚨 Emergency Contact</h4>
                  
                  <div className="admin-form-grid">
                    <div className="admin-form-control">
                      <label className="label">
                        <span className="label-text">Emergency Contact Name</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        name="emergencyContact"
                        value={newChildData.emergencyContact}
                        onChange={handleNewChildChange}
                        placeholder="Full name of emergency contact"
                      />
                    </div>
                    
                    <div className="admin-form-control">
                      <label className="label">
                        <span className="label-text">Relationship</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        name="emergencyRelationship"
                        value={newChildData.emergencyRelationship}
                        onChange={handleNewChildChange}
                        placeholder="e.g., Grandmother, Uncle"
                      />
                    </div>
                    
                    <div className="admin-form-control">
                      <label className="label">
                        <span className="label-text">Emergency Phone</span>
                      </label>
                      <input
                        type="tel"
                        className="input input-bordered w-full"
                        name="emergencyPhone"
                        value={newChildData.emergencyPhone}
                        onChange={handleNewChildChange}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Designated Pickup Person Section */}
              <div className="card bg-base-100">
                <div className="card-body">
                  <h4 className="card-title text-base">🚗 Designated Pickup Person</h4>
                  <p className="text-sm text-base-content/70 mb-4">Person authorized to pick up the child (other than parent/guardian)</p>
                  
                  <div className="admin-form-grid">
                    <div className="admin-form-control">
                      <label className="label">
                        <span className="label-text">Pickup Person Name</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        name="pickupPersonName"
                        value={newChildData.pickupPersonName}
                        onChange={handleNewChildChange}
                        placeholder="Full name of authorized pickup person"
                      />
                    </div>
                    
                    <div className="admin-form-control">
                      <label className="label">
                        <span className="label-text">Relationship to Child</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        name="pickupPersonRelationship"
                        value={newChildData.pickupPersonRelationship}
                        onChange={handleNewChildChange}
                        placeholder="e.g., Grandparent, Sibling, Family Friend"
                      />
                    </div>
                    
                    <div className="admin-form-control">
                      <label className="label">
                        <span className="label-text">Pickup Person Phone</span>
                      </label>
                      <input
                        type="tel"
                        className="input input-bordered w-full"
                        name="pickupPersonPhone"
                        value={newChildData.pickupPersonPhone}
                        onChange={handleNewChildChange}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                  
                  <div className="alert alert-info mt-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>This person will be authorized to pick up the child. Staff should verify identity before releasing the child.</span>
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="card bg-base-100">
                <div className="card-body">
                  <h4 className="card-title text-base">📝 Additional Information</h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Special Needs or Accommodations</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered h-24 w-full"
                        name="specialNeeds"
                        value={newChildData.specialNeeds}
                        onChange={handleNewChildChange}
                        placeholder="Any special needs, accommodations, or important information about the child..."
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-action">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    'Add Child & Generate Access Code'
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn"
                  onClick={() => setShowAddChildModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

              {/* Add Sibling Modal */}
        {showAddSiblingModal && (
          <div className="modal modal-open">
            <div className="modal-box max-w-4xl">
              <h3 className="font-bold text-lg mb-6">Add Sibling to Daycare</h3>
              
              {/* Information Alert */}
              <div className="alert alert-info mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-bold">Adding a Sibling</h3>
                  <div className="text-sm">
                    <p>• This child will be automatically linked to the existing parent account</p>
                    <p>• No access code is needed - the parent already has access</p>
                    <p>• The parent will see this child immediately in their dashboard</p>
                    <p>• Parent information has been pre-filled from the existing child</p>
                  </div>
                </div>
              </div>
            
                          <form onSubmit={handleAddSibling} className="space-y-6">
                {/* Parent Information Display */}
                <div className="card bg-base-200">
                  <div className="card-body">
                    <h4 className="card-title text-base">👨‍👩‍👧‍👦 Parent Information (Pre-filled)</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Name:</span> {siblingData.parentFirstName} {siblingData.parentLastName}
                      </div>
                      <div>
                        <span className="font-medium">Email:</span> {siblingData.parentEmail}
                      </div>
                      <div>
                        <span className="font-medium">Phone:</span> {siblingData.parentPhone}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> 
                        <span className="badge badge-success ml-2">Already Registered</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sibling Information Section */}
                <div className="card bg-base-100">
                  <div className="card-body">
                    <h4 className="card-title text-base">👶 Sibling Information</h4>
                  
                  <div className="space-y-4">
                    <div className="admin-form-row">
                      <div className="admin-form-control">
                        <label className="label">
                          <span className="label-text">First Name *</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          name="firstName"
                          value={siblingData.firstName}
                          onChange={handleSiblingChange}
                          required
                          placeholder="Enter sibling's first name"
                        />
                      </div>
                      
                      <div className="admin-form-control">
                        <label className="label">
                          <span className="label-text">Last Name *</span>
                        </label>
                        <input
                          type="text"
                          className="input input-bordered w-full"
                          name="lastName"
                          value={siblingData.lastName}
                          onChange={handleSiblingChange}
                          required
                          placeholder="Enter sibling's last name"
                        />
                      </div>
                    </div>
                    
                    <div className="admin-form-grid">
                      <div className="admin-form-control">
                        <label className="label">
                          <span className="label-text">Date of Birth *</span>
                        </label>
                        <input
                          type="date"
                          className="input input-bordered w-full"
                          name="dateOfBirth"
                          value={siblingData.dateOfBirth}
                          onChange={handleSiblingChange}
                          required
                          max={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      
                      <div className="admin-form-control">
                        <label className="label">
                          <span className="label-text">Gender *</span>
                        </label>
                        <select
                          className="select select-bordered w-full"
                          name="gender"
                          value={siblingData.gender}
                          onChange={handleSiblingChange}
                          required
                        >
                          <option value="">Select Gender</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      </div>
                      
                      <div className="admin-form-control">
                        <label className="label">
                          <span className="label-text">Age Group</span>
                        </label>
                        <select
                          className="select select-bordered w-full"
                          name="group"
                          value={siblingData.group}
                          onChange={handleSiblingChange}
                        >
                          <option value="">Auto-calculated</option>
                          <option value="Infant">Infant (0-18 months)</option>
                          <option value="Toddler">Toddler (18 months-3 years)</option>
                          <option value="Pre-K">Pre-K (3-5 years)</option>
                        </select>
                        <label className="label">
                          <span className="label-text-alt">Will be automatically determined based on date of birth</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Medical Information Section */}
              <div className="card bg-base-100">
                <div className="card-body">
                  <h4 className="card-title text-base">🏥 Medical Information</h4>
                  
                                     <div className="space-y-4">
                     <div className="admin-form-row">
                       <div className="admin-form-control">
                         <label className="label">
                           <span className="label-text">Allergies</span>
                         </label>
                         <input
                           type="text"
                           className="input input-bordered w-full"
                           name="allergies"
                           value={siblingData.allergies}
                           onChange={handleSiblingChange}
                           placeholder="e.g., Peanuts, Dairy, None (separated by commas)"
                         />
                       </div>
                       
                       <div className="admin-form-control">
                         <label className="label">
                           <span className="label-text">Medical Conditions</span>
                         </label>
                         <input
                           type="text"
                           className="input input-bordered w-full"
                           name="medicalConditions"
                           value={siblingData.medicalConditions}
                           onChange={handleSiblingChange}
                           placeholder="e.g., Asthma, Diabetes, None (separated by commas)"
                         />
                       </div>
                     </div>
                     
                     <div className="admin-form-row">
                       <div className="admin-form-control">
                         <label className="label">
                           <span className="label-text">Current Medications</span>
                         </label>
                         <input
                           type="text"
                           className="input input-bordered w-full"
                           name="medications"
                           value={siblingData.medications}
                           onChange={handleSiblingChange}
                           placeholder="e.g., Inhaler, Insulin, None (separated by commas)"
                         />
                       </div>
                       
                       <div className="admin-form-control">
                         <label className="label">
                           <span className="label-text">Dietary Restrictions</span>
                         </label>
                         <input
                           type="text"
                           className="input input-bordered w-full"
                           name="dietaryRestrictions"
                           value={siblingData.dietaryRestrictions}
                           onChange={handleSiblingChange}
                           placeholder="e.g., Vegetarian, Gluten-free, None"
                         />
                       </div>
                     </div>
                     
                     <div className="admin-form-row">
                       <div className="admin-form-control">
                         <label className="label">
                           <span className="label-text">Doctor's Name</span>
                         </label>
                         <input
                           type="text"
                           className="input input-bordered w-full"
                           name="doctorName"
                           value={siblingData.doctorName}
                           onChange={handleSiblingChange}
                           placeholder="Dr. Smith"
                         />
                       </div>
                       
                       <div className="admin-form-control">
                         <label className="label">
                           <span className="label-text">Doctor's Phone</span>
                         </label>
                         <input
                           type="tel"
                           className="input input-bordered w-full"
                           name="doctorPhone"
                           value={siblingData.doctorPhone}
                           onChange={handleSiblingChange}
                           placeholder="(555) 123-4567"
                         />
                       </div>
                     </div>
                   </div>
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="card bg-base-100">
                <div className="card-body">
                  <h4 className="card-title text-base">🚨 Emergency Contact</h4>
                  
                  <div className="admin-form-grid">
                    <div className="admin-form-control">
                      <label className="label">
                        <span className="label-text">Emergency Contact Name</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        name="emergencyContact"
                        value={siblingData.emergencyContact}
                        onChange={handleSiblingChange}
                        placeholder="Full name of emergency contact"
                      />
                    </div>
                    
                    <div className="admin-form-control">
                      <label className="label">
                        <span className="label-text">Relationship</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        name="emergencyRelationship"
                        value={siblingData.emergencyRelationship}
                        onChange={handleSiblingChange}
                        placeholder="e.g., Grandmother, Uncle"
                      />
                    </div>
                    
                    <div className="admin-form-control">
                      <label className="label">
                        <span className="label-text">Emergency Phone</span>
                      </label>
                      <input
                        type="tel"
                        className="input input-bordered w-full"
                        name="emergencyPhone"
                        value={siblingData.emergencyPhone}
                        onChange={handleSiblingChange}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Designated Pickup Person Section */}
              <div className="card bg-base-100">
                <div className="card-body">
                  <h4 className="card-title text-base">🚗 Designated Pickup Person</h4>
                  <p className="text-sm text-base-content/70 mb-4">Person authorized to pick up the child (other than parent/guardian)</p>
                  
                  <div className="admin-form-grid">
                    <div className="admin-form-control">
                      <label className="label">
                        <span className="label-text">Pickup Person Name</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        name="pickupPersonName"
                        value={siblingData.pickupPersonName}
                        onChange={handleSiblingChange}
                        placeholder="Full name of authorized pickup person"
                      />
                    </div>
                    
                    <div className="admin-form-control">
                      <label className="label">
                        <span className="label-text">Relationship to Child</span>
                      </label>
                      <input
                        type="text"
                        className="input input-bordered w-full"
                        name="pickupPersonRelationship"
                        value={siblingData.pickupPersonRelationship}
                        onChange={handleSiblingChange}
                        placeholder="e.g., Grandparent, Sibling, Family Friend"
                      />
                    </div>
                    
                    <div className="admin-form-control">
                      <label className="label">
                        <span className="label-text">Pickup Person Phone</span>
                      </label>
                      <input
                        type="tel"
                        className="input input-bordered w-full"
                        name="pickupPersonPhone"
                        value={siblingData.pickupPersonPhone}
                        onChange={handleSiblingChange}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                  
                  <div className="alert alert-info mt-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>This person will be authorized to pick up the child. Staff should verify identity before releasing the child.</span>
                  </div>
                </div>
              </div>

              {/* Additional Information Section */}
              <div className="card bg-base-100">
                <div className="card-body">
                  <h4 className="card-title text-base">📝 Additional Information</h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Special Needs or Accommodations</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered h-24 w-full"
                        name="specialNeeds"
                        value={siblingData.specialNeeds}
                        onChange={handleSiblingChange}
                        placeholder="Any special needs, accommodations, or important information about the child..."
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-action">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    'Add Sibling'
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn"
                  onClick={() => setShowAddSiblingModal(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmChild && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-error mb-4">⚠️ Confirm Deletion</h3>
            <div className="space-y-4">
              <p>Are you sure you want to delete this {deleteConfirmChild.parentRegistered ? 'registered' : 'unregistered'} child from the system?</p>
              
              <div className="bg-base-200 p-4 rounded-lg">
                <h4 className="font-semibold">Child Information:</h4>
                <p><strong>Name:</strong> {deleteConfirmChild.firstName} {deleteConfirmChild.lastName}</p>
                <p><strong>Parent:</strong> {deleteConfirmChild.parentFirstName} {deleteConfirmChild.parentLastName}</p>
                <p><strong>Email:</strong> {deleteConfirmChild.parentEmail}</p>
                <p><strong>Registration Status:</strong> 
                  <span className={`badge ml-2 ${deleteConfirmChild.parentRegistered ? 'badge-success' : 'badge-warning'}`}>
                    {deleteConfirmChild.parentRegistered ? 'Registered' : 'Awaiting Registration'}
                  </span>
                </p>
                {deleteConfirmChild.accessCode && (
                  <p><strong>Access Code:</strong> {deleteConfirmChild.accessCode}</p>
                )}
              </div>
              
              <div className={`alert ${deleteConfirmChild.parentRegistered ? 'alert-error' : 'alert-warning'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="font-bold">{deleteConfirmChild.parentRegistered ? 'DANGER!' : 'Warning!'}</h3>
                  <div className="text-xs">
                    <p>• This action cannot be undone</p>
                    <p>• The child's record will be permanently removed</p>
                    {deleteConfirmChild.parentRegistered ? (
                      <>
                        <p>• The parent's account and all data will be deleted</p>
                        <p>• The parent will lose access to the system completely</p>
                        <p>• All activity logs, messages, and history will be lost</p>
                      </>
                    ) : (
                      <>
                        <p>• The parent's access code will be invalidated</p>
                        <p>• This is safe for test/practice accounts</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-action">
              <button 
                className="btn btn-error"
                onClick={() => handleDeleteChild(
                  deleteConfirmChild.id,
                  `${deleteConfirmChild.firstName} ${deleteConfirmChild.lastName}`,
                  deleteConfirmChild.accessCode,
                  deleteConfirmChild.parentId,
                  deleteConfirmChild.parentRegistered
                )}
                disabled={loading}
              >
                {loading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  deleteConfirmChild.parentRegistered ? 'Yes, Delete Child & Parent Account' : 'Yes, Delete Child'
                )}
              </button>
              <button 
                className="btn"
                onClick={() => setDeleteConfirmChild(null)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Child Details Modal */}
      {showModal && selectedChild && (
        <ChildDetailsModal 
          child={selectedChild}
          onClose={() => setShowModal(false)}
          onAddSibling={openAddSiblingModal}
        />
      )}
    </div>
  );
};

export default ChildrenManagement;

// Add CSS classes for admin forms
const styles = `
  .admin-form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  .admin-form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
  }
  
  .admin-form-control {
    display: flex;
    flex-direction: column;
  }
  
  @media (max-width: 768px) {
    .admin-form-row,
    .admin-form-grid {
      grid-template-columns: 1fr;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}