// app/admin/activity-log/page.js
'use client';

import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc,
  deleteDoc,
  doc,
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDocs 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const ActivityLog = () => {
  const [children, setChildren] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [filterChild, setFilterChild] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterDate, setFilterDate] = useState('');
  const [selectedChild, setSelectedChild] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  
  // Edit and delete states
  const [editingActivity, setEditingActivity] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);
  const [editImages, setEditImages] = useState([]);
  const [editImagePreviews, setEditImagePreviews] = useState([]);
  const [existingPhotos, setExistingPhotos] = useState([]);

  //  activity form state
  const [newActivity, setNewActivity] = useState({
    childId: '',
    activityType: 'Learning',
    activitySubType: '',
    title: '',
    description: '',
    duration: '',
    skillsObserved: [],
    developmentLevel: 'ageAppropriate',
    participationLevel: 'full',
    enjoymentLevel: 'enjoyed',
    notes: '',
    photos: [],
    learningObjectives: [],
    nextSteps: '',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5)
  });

  // Comprehensive activity types with subtypes
  const activityTypes = {
    'Learning': {
      icon: '📚',
      color: '#4CAF50',
      subtypes: [
        'Alphabet Recognition',
        'Number Concepts',
        'Reading/Story Time',
        'Writing Practice',
        'Science Exploration',
        'Shape Recognition',
        'Color Learning',
        'Problem Solving',
        'Memory Games',
        'Educational Apps'
      ]
    },
    'Physical': {
      icon: '🏃',
      color: '#FF9800',
      subtypes: [
        'Outdoor Play',
        'Obstacle Course',
        'Dancing/Movement',
        'Fine Motor Skills',
        'Gross Motor Development',
        'Sports Activities',
        'Balance & Coordination',
        'Playground Activities',
        'Yoga/Stretching',
        'Running/Walking'
      ]
    },
    'Creative': {
      icon: '🎨',
      color: '#E91E63',
      subtypes: [
        'Painting',
        'Drawing',
        'Arts & Crafts',
        'Music & Singing',
        'Dramatic Play',
        'Building Blocks',
        'Sensory Play',
        'Collage Making',
        'Clay/Play-Doh',
        'Musical Instruments'
      ]
    },
    'Social': {
      icon: '👥',
      color: '#2196F3',
      subtypes: [
        'Sharing & Cooperation',
        'Conflict Resolution',
        'Helping Others',
        'Group Activities',
        'Turn Taking',
        'Friendship Building',
        'Communication Skills',
        'Leadership',
        'Teamwork',
        'Cultural Activities'
      ]
    },
    'Emotional': {
      icon: '💝',
      color: '#9C27B0',
      subtypes: [
        'Emotional Expression',
        'Self-Regulation',
        'Empathy Development',
        'Confidence Building',
        'Mindfulness',
        'Coping Strategies',
        'Self-Awareness',
        'Gratitude Practice',
        'Celebrating Achievements',
        'Processing Feelings'
      ]
    },
    'Life Skills': {
      icon: '🏠',
      color: '#607D8B',
      subtypes: [
        'Potty Training',
        'Self-Help Skills',
        'Cleanup Activities',
        'Following Routines',
        'Independence',
        'Personal Hygiene',
        'Table Manners',
        'Responsibility',
        'Organization',
        'Safety Awareness'
      ]
    },
    'Special Events': {
      icon: '🎉',
      color: '#FF5722',
      subtypes: [
        'Field Trip',
        'Holiday Celebration',
        'Birthday Party',
        'Guest Visitor',
        'Cultural Event',
        'Community Helper Visit',
        'Special Project',
        'Achievement Celebration',
        'Family Event',
        'Seasonal Activity'
      ]
    }
  };

  const skillCategories = [
    'Communication', 'Problem Solving', 'Creativity', 'Social Skills',
    'Motor Skills', 'Cognitive Development', 'Emotional Intelligence',
    'Independence', 'Following Instructions', 'Attention Span'
  ];

  const developmentLevels = [
    { value: 'emerging', label: 'Emerging - Just starting to show this skill' },
    { value: 'developing', label: 'Developing - Working on this skill' },
    { value: 'ageAppropriate', label: 'Age Appropriate - Meets expected level' },
    { value: 'advanced', label: 'Advanced - Exceeds expectations' },
    { value: 'needsSupport', label: 'Needs Support - Requires additional help' }
  ];

  const participationLevels = [
    { value: 'full', label: 'Full Participation' },
    { value: 'partial', label: 'Partial Participation' },
    { value: 'observed', label: 'Observed Only' },
    { value: 'reluctant', label: 'Reluctant/Needed Encouragement' },
    { value: 'refused', label: 'Refused to Participate' }
  ];

  const enjoymentLevels = [
    { value: 'loved', label: 'Loved It! 😍' },
    { value: 'enjoyed', label: 'Enjoyed It 😊' },
    { value: 'neutral', label: 'Neutral 😐' },
    { value: 'disliked', label: 'Seemed to Dislike 😕' },
    { value: 'frustrated', label: 'Frustrated 😤' }
  ];

  // Convert images to base64 for Firestore storage (like MessageSystem)
  const convertImageToBase64 = async (file) => {
    console.log('Converting image to base64:', file.name, file.size, file.type);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        console.log('Image converted to base64 successfully');
        resolve({
          data: reader.result, // base64 data URL
          name: file.name,
          size: file.size,
          type: file.type
        });
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
        reject(new Error(`Failed to read image: ${error.message}`));
      };
      reader.readAsDataURL(file);
    });
  };

  const processImages = async () => {
    if (selectedImages.length === 0) return [];
    
    setUploadingImages(true);
    const processedImages = [];
    const failedImages = [];
    
    try {
      console.log(`Starting processing of ${selectedImages.length} images...`);
      
      // Process images one by one
      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        
        console.log(`Processing image ${i + 1}/${selectedImages.length}: ${image.name} (${(image.size / 1024 / 1024).toFixed(2)}MB)`);
        
        try {
          // Add small delay between processing to prevent UI blocking
          if (i > 0) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
          
          const imageData = await convertImageToBase64(image);
          processedImages.push(imageData);
          console.log(`Successfully processed image ${i + 1}/${selectedImages.length}`);
        } catch (imageError) {
          console.error(`Failed to process image ${i + 1}:`, imageError);
          failedImages.push({
            fileName: image.name,
            error: imageError.message
          });
          
          // Continue with remaining images
          console.log(`Continuing with remaining images after failure on ${image.name}`);
        }
      }
      
      // Report results
      if (processedImages.length > 0) {
        console.log(`Successfully processed ${processedImages.length}/${selectedImages.length} images`);
      }
      
      if (failedImages.length > 0) {
        const failedNames = failedImages.map(f => f.fileName).join(', ');
        console.warn(`Failed to process: ${failedNames}`);
        
        if (processedImages.length === 0) {
          throw new Error(`All images failed to process. First error: ${failedImages[0].error}`);
        } else {
          setError(`${processedImages.length} of ${selectedImages.length} images processed successfully. Failed: ${failedNames}`);
        }
      }
      
      return processedImages;
    } catch (error) {
      console.error('Error processing images:', error);
      throw new Error(`Failed to process images: ${error.message || 'Unknown error'}`);
    } finally {
      console.log('Resetting processing state...');
      setUploadingImages(false);
    }
  };

  const handleImageSelection = (e) => {
    const files = Array.from(e.target.files);
    const maxImages = 5;
    
    if (files.length + selectedImages.length > maxImages) {
      setError(`You can only upload up to ${maxImages} images per activity (max 2MB each for database storage)`);
      return;
    }

    console.log('Files selected:', files.length);

    // Enhanced file validation for base64 storage
    const validFiles = files.filter(file => {
      console.log('Validating file:', file.name, file.size, file.type);
      
      // Check file size (limit to 2MB for base64 storage - will become ~2.7MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Images must be smaller than 2MB for database storage. Consider compressing your images.');
        return false;
      }
      
      // Enhanced file type checking
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setError('File type not supported. Please use: JPG, PNG, GIF, WebP, or BMP images.');
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) {
      console.log('No valid files selected');
      return;
    }

    // Check total estimated size after base64 encoding
    const totalOriginalSize = [...selectedImages, ...validFiles].reduce((sum, file) => sum + file.size, 0);
    const estimatedBase64Size = totalOriginalSize * 1.33; // Base64 overhead
    
    if (estimatedBase64Size > 3 * 1024 * 1024) { // 3MB limit for better image quality
      setError(`Total photos too large for database storage (estimated ${(estimatedBase64Size / 1024).toFixed(0)}KB). Please use fewer or smaller images.`);
      return;
    }

    console.log('File validation passed for', validFiles.length, 'files');
    console.log('Estimated total size after base64:', (estimatedBase64Size / 1024).toFixed(0), 'KB');
    setSelectedImages(prev => [...prev, ...validFiles]);
    
    // Create preview URLs
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviewUrls(prev => [...prev, e.target.result]);
      };
      reader.onerror = (error) => {
        console.error('Error reading file:', error);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Load children and activities
  useEffect(() => {
    const loadData = async () => {
      try {
        // Debug: Check Firebase database
        console.log('Firebase database check:', {
          db: !!db,
          dbApp: db?.app?.name
        });

        // Load children
        const childrenSnapshot = await getDocs(collection(db, 'children'));
        const childrenList = [];
        childrenSnapshot.forEach(doc => {
          childrenList.push({ id: doc.id, ...doc.data() });
        });
        setChildren(childrenList);

        // Set up real-time listener for activities
        const activitiesQuery = query(
          collection(db, 'activities'),
          orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
          const activitiesData = [];
          snapshot.forEach(doc => {
            activitiesData.push({ id: doc.id, ...doc.data() });
          });
          setActivities(activitiesData);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data');
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'skillsObserved') {
        setNewActivity(prev => ({
          ...prev,
          skillsObserved: checked 
            ? [...prev.skillsObserved, value]
            : prev.skillsObserved.filter(skill => skill !== value)
        }));
      } else if (name === 'learningObjectives') {
        setNewActivity(prev => ({
          ...prev,
          learningObjectives: checked 
            ? [...prev.learningObjectives, value]
            : prev.learningObjectives.filter(obj => obj !== value)
        }));
      }
    } else {
      setNewActivity(prev => ({
        ...prev,
        [name]: value,
        // Auto-clear subtype when main type changes
        ...(name === 'activityType' && { activitySubType: '' })
      }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      const child = children.find(c => c.id === newActivity.childId);
      
      if (!child) {
        throw new Error('Selected child not found');
      }
      
      console.log('Creating activity document...');
      
      // Create the activity document first
      const activityData = {
        ...newActivity,
        childName: `${child.firstName} ${child.lastName}`,
        childGroup: child.group,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: 'admin', // In real app, would use current user
        photos: [] // Will be updated after image upload
      };

      // Process images if any are selected
      let processedPhotos = [];
      if (selectedImages.length > 0) {
        try {
          processedPhotos = await processImages();
          console.log('Images processed successfully:', processedPhotos.length);
        } catch (imageError) {
          console.error('Image processing failed:', imageError);
          // Don't fail the entire submission if just the images fail
          setError(`Activity will be created, but image processing failed: ${imageError.message}`);
        }
      }

      // Include processed photos in the activity data
      activityData.photos = processedPhotos;

      const docRef = await addDoc(collection(db, 'activities'), activityData);
      console.log('Activity document created with ID:', docRef.id, 'and', processedPhotos.length, 'photos');
      
      // Reset form and image state
      setNewActivity({
        childId: '',
        activityType: 'Learning',
        activitySubType: '',
        title: '',
        description: '',
        duration: '',
        skillsObserved: [],
        developmentLevel: 'ageAppropriate',
        participationLevel: 'full',
        enjoymentLevel: 'enjoyed',
        notes: '',
        photos: [],
        learningObjectives: [],
        nextSteps: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5)
      });
      
      // Reset image state
      setSelectedImages([]);
      setImagePreviewUrls([]);
      
      // Only close form if no errors occurred
      if (!error || error.includes('successfully')) {
        setShowForm(false);
      }
      
      console.log('Activity submission completed');
    } catch (error) {
      console.error('Error adding activity:', error);
      setError(`Failed to add activity: ${error.message}`);
    } finally {
      setLoading(false);
      setUploadingImages(false); // Ensure upload state is reset
    }
  };

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    const matchesChild = filterChild === 'All' || activity.childId === filterChild;
    const matchesType = filterType === 'All' || activity.activityType === filterType;
    
    let matchesDate = true;
    if (filterDate) {
      const activityDate = new Date(activity.date).toISOString().split('T')[0];
      matchesDate = activityDate === filterDate;
    }
    
    return matchesChild && matchesType && matchesDate;
  });

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = new Date(activity.date).toISOString().split('T')[0];
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity)
    return groups;
  }, {});

  // Format date for display
  const formatDate = (dateString) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  // Handle edit activity
  const handleEditActivity = (activity) => {
    setEditingActivity({
      ...activity,
      date: new Date(activity.date).toISOString().split('T')[0],
      time: activity.time || new Date(activity.date).toTimeString().slice(0, 5)
    });
    setExistingPhotos(activity.photos || []);
    setEditImages([]);
    setEditImagePreviews([]);
    setShowEditForm(true);
  };

  // Handle delete activity
  const handleDeleteActivity = (activity) => {
    setActivityToDelete(activity);
    setShowDeleteModal(true);
  };

  // Handle edit form changes
  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'skillsObserved') {
        setEditingActivity(prev => ({
          ...prev,
          skillsObserved: checked 
            ? [...(prev.skillsObserved || []), value]
            : (prev.skillsObserved || []).filter(skill => skill !== value)
        }));
      }
    } else {
      setEditingActivity(prev => ({
        ...prev,
        [name]: value,
        // Auto-clear subtype when main type changes
        ...(name === 'activityType' && { activitySubType: '' })
      }));
    }
  };

  // Handle edit image selection with base64 storage limits
  const handleEditImageSelection = (e) => {
    const files = Array.from(e.target.files);
    const maxImages = 5;
    const totalImages = existingPhotos.length + editImages.length + files.length;
    
    if (totalImages > maxImages) {
      setError(`You can only have up to ${maxImages} images total per activity (max 2MB each)`);
      return;
    }

    console.log('Edit - Files selected:', files.length);

    // Enhanced file validation for base64 storage
    const validFiles = files.filter(file => {
      console.log('Edit - Validating file:', file.name, file.size, file.type);
      
      // Check file size (limit to 2MB for base64 storage)
      if (file.size > 2 * 1024 * 1024) {
        setError('Images must be smaller than 2MB for database storage. Consider compressing your images.');
        return false;
      }
      
      // Enhanced file type checking
      const allowedTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        setError('File type not supported. Please use: JPG, PNG, GIF, WebP, or BMP images.');
        return false;
      }
      
      return true;
    });

    if (validFiles.length === 0) {
      console.log('Edit - No valid files selected');
      return;
    }

    // Estimate total size including existing photos and new ones
    const newFilesSize = validFiles.reduce((sum, file) => sum + file.size, 0);
    const existingFilesSize = editImages.reduce((sum, file) => sum + file.size, 0);
    const totalSize = newFilesSize + existingFilesSize;
    const estimatedBase64Size = totalSize * 1.33; // Base64 overhead
    
    if (estimatedBase64Size > 3 * 1024 * 1024) { // 3MB limit for better image quality
      setError(`Total new photos too large for database storage (estimated ${(estimatedBase64Size / 1024).toFixed(0)}KB). Please use fewer or smaller images.`);
      return;
    }

    console.log('Edit - File validation passed for', validFiles.length, 'files');
    console.log('Edit - Estimated total new photos size after base64:', (estimatedBase64Size / 1024).toFixed(0), 'KB');
    setEditImages(prev => [...prev, ...validFiles]);
    
    // Create preview URLs
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditImagePreviews(prev => [...prev, e.target.result]);
      };
      reader.onerror = (error) => {
        console.error('Edit - Error reading file:', error);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove edit image
  const removeEditImage = (index) => {
    setEditImages(prev => prev.filter((_, i) => i !== index));
    setEditImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Remove existing photo
  const removeExistingPhoto = (index) => {
    setExistingPhotos(prev => prev.filter((_, i) => i !== index));
  };

  // Handle edit form submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      const child = children.find(c => c.id === editingActivity.childId);
      if (!child) {
        throw new Error('Selected child not found');
      }
      
      console.log('Updating activity...');
      
      // Process new images if any (using base64 approach)
      let newProcessedPhotos = [];
      if (editImages.length > 0) {
        try {
          console.log('Edit - Starting processing of new images...');
          setUploadingImages(true);
          
          const processedImages = [];
          const failedImages = [];
          
          // Process images one by one
          for (let i = 0; i < editImages.length; i++) {
            const image = editImages[i];
            console.log(`Edit - Processing image ${i + 1}/${editImages.length}: ${image.name}`);
            
            try {
              // Add small delay between processing
              if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 200));
              }
              
              const imageData = await convertImageToBase64(image);
              processedImages.push(imageData);
              console.log(`Edit - Successfully processed image ${i + 1}/${editImages.length}`);
            } catch (imageError) {
              console.error(`Edit - Failed to process image ${i + 1}:`, imageError);
              failedImages.push({
                fileName: image.name,
                error: imageError.message
              });
              
              // Continue with remaining images
              console.log(`Edit - Continuing with remaining images after failure on ${image.name}`);
            }
          }
          
          newProcessedPhotos = processedImages;
          
          // Report results for edit processing
          if (failedImages.length > 0) {
            const failedNames = failedImages.map(f => f.fileName).join(', ');
            console.warn(`Edit - Failed to process: ${failedNames}`);
            
            if (processedImages.length === 0) {
              throw new Error(`All new images failed to process. First error: ${failedImages[0].error}`);
            } else {
              setError(`Activity updated, but some new images failed to process: ${failedNames}`);
            }
          } else {
            console.log('Edit - All new images processed successfully');
          }
        } catch (processError) {
          console.error('Edit - Image processing failed:', processError);
          setError(`Activity will be updated, but new image processing failed: ${processError.message}`);
        } finally {
          setUploadingImages(false);
        }
      }
      
      // Combine existing photos with new processed ones
      const allPhotos = [...existingPhotos, ...newProcessedPhotos];
      
      // Update the activity document
      const updateData = {
        ...editingActivity,
        childName: `${child.firstName} ${child.lastName}`,
        childGroup: child.group,
        photos: allPhotos,
        updatedAt: new Date().toISOString(),
        updatedBy: 'admin'
      };

      await updateDoc(doc(db, 'activities', editingActivity.id), updateData);
      console.log('Activity updated successfully');
      
      // Show success message briefly
      setError(''); // Clear any errors
      
      // Reset edit state
      setEditingActivity(null);
      setExistingPhotos([]);
      setEditImages([]);
      setEditImagePreviews([]);
      setShowEditForm(false);
      
    } catch (error) {
      console.error('Error updating activity:', error);
      setError(`Failed to update activity: ${error.message}`);
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  // Handle delete confirmation
  const confirmDelete = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Deleting activity:', activityToDelete.id);
      
      // Photos are stored in the database document, so we just need to delete the document
      console.log('Photos stored in database - no separate cleanup needed');
      
      // Delete the activity document (photos are deleted automatically with the document)
      await deleteDoc(doc(db, 'activities', activityToDelete.id));
      console.log('Activity and all photos deleted successfully');
      
      // Reset delete state
      setActivityToDelete(null);
      setShowDeleteModal(false);
      
    } catch (error) {
      console.error('Error deleting activity:', error);
      setError(`Failed to delete activity: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">📝 Activity Log</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          ➕ Record New Activity
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <div className="flex items-center gap-2">
            <span>⚠️ {error}</span>
            <button 
              className="btn btn-sm btn-ghost"
              onClick={() => setError('')}
            >
              ✕ Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card bg-base-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="form-control">
            <label className="label">Child:</label>
            <select 
              className="select select-bordered w-full"
              value={filterChild} 
              onChange={(e) => setFilterChild(e.target.value)}
            >
              <option value="All">All Children</option>
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.firstName} {child.lastName}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-control">
            <label className="label">Activity Type:</label>
            <select 
              className="select select-bordered w-full"
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="All">All Types</option>
              {Object.keys(activityTypes).map(type => (
                <option key={type} value={type}>
                  {activityTypes[type].icon} {type}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-control">
            <label className="label">Date:</label>
            <input
              type="date"
              className="input input-bordered w-full"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button 
            className="btn btn-ghost"
            onClick={() => {
              setFilterChild('All');
              setFilterType('All');
              setFilterDate('');
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Activities Display */}
      <div className="space-y-8">
        {loading ? (
          <div className="flex justify-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : Object.keys(groupedActivities).length === 0 ? (
          <div className="text-center py-8">
            <div className="card bg-base-200 p-8">
              <p className="text-lg">No activities found matching your filters.</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedActivities)
            .sort(([a], [b]) => new Date(b) - new Date(a))
            .map(([date, dayActivities]) => (
              <div key={date} className="space-y-4">
                <h2 className="text-2xl font-bold divider">{formatDate(date)}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dayActivities.map(activity => (
                    <div 
                      key={activity.id} 
                      className="card bg-base-100 shadow-xl"
                      style={{ borderLeft: `4px solid ${activityTypes[activity.activityType]?.color || '#ccc'}` }}
                    >
                      <div className="card-body">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">
                            {activityTypes[activity.activityType]?.icon || '📝'}
                          </span>
                          <div>
                            <h3 className="font-bold">{activity.activityType}</h3>
                            {activity.activitySubType && (
                              <p className="text-sm opacity-70">{activity.activitySubType}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center mb-4">
                          <span className="badge badge-lg">{activity.childName}</span>
                          <span className="text-sm opacity-70">{activity.time}</span>
                        </div>

                        <h4 className="font-semibold text-lg mb-2">{activity.title}</h4>
                        <p className="text-sm mb-4">{activity.description}</p>

                        {activity.skillsObserved.length > 0 && (
                          <div className="mb-4">
                            <h5 className="font-semibold mb-2">Skills Observed:</h5>
                            <div className="flex flex-wrap gap-2">
                              {activity.skillsObserved.map(skill => (
                                <span key={skill} className="badge badge-primary">{skill}</span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-3 mb-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-gray-600">Development:</span>
                            <span className="badge badge-outline badge-sm">
                              {developmentLevels.find(l => l.value === activity.developmentLevel)?.label.split(' - ')[0]}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-gray-600">Participation:</span>
                            <span className="badge badge-outline badge-sm">
                              {participationLevels.find(l => l.value === activity.participationLevel)?.label}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-gray-600">Enjoyment:</span>
                            <span className="badge badge-outline badge-sm">
                              {enjoymentLevels.find(l => l.value === activity.enjoymentLevel)?.label}
                            </span>
                          </div>
                        </div>

                        {activity.duration && (
                          <div className="text-sm opacity-70">
                            Duration: {activity.duration}
                          </div>
                        )}

                        {activity.nextSteps && (
                          <div className="mt-4">
                            <h5 className="font-semibold">Next Steps:</h5>
                            <p className="text-sm">{activity.nextSteps}</p>
                          </div>
                        )}

                        {activity.notes && (
                          <div className="mt-4">
                            <h5 className="font-semibold">Additional Notes:</h5>
                            <p className="text-sm">{activity.notes}</p>
                          </div>
                        )}

                        {activity.photos && activity.photos.length > 0 && (
                          <div className="mt-4">
                            <h5 className="font-semibold mb-2">📸 Activity Photos:</h5>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {activity.photos.map((photo, index) => {
                                // Handle both old URL format and new base64 format
                                const photoSrc = typeof photo === 'string' ? photo : photo.data;
                                const photoName = typeof photo === 'string' ? `Photo ${index + 1}` : photo.name;
                                
                                return (
                                  <div key={index} className="relative group">
                                    <img
                                      src={photoSrc}
                                      alt={photoName}
                                      className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => {
                                        const newWindow = window.open();
                                        newWindow.document.write(`
                                          <html>
                                            <head><title>${photoName}</title></head>
                                            <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#000;">
                                              <img src="${photoSrc}" style="max-width:100%; max-height:100vh; object-fit:contain;" />
                                            </body>
                                          </html>
                                        `);
                                      }}
                                    />
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 rounded-lg transition-all duration-200 flex items-center justify-center">
                                      <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-medium">
                                        🔍 Click to view
                                      </span>
                                    </div>
                                    {/* Show file name on hover for new format */}
                                    {typeof photo === 'object' && (
                                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="truncate">{photo.name}</div>
                                        <div>{(photo.size / 1024 / 1024).toFixed(2)} MB</div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Admin Actions */}
                        <div className="card-actions justify-end mt-4 pt-4 border-t border-base-300">
                          <button
                            className="btn btn-sm btn-outline btn-primary"
                            onClick={() => handleEditActivity(activity)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline btn-error"
                            onClick={() => handleDeleteActivity(activity)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
        )}
      </div>

      {/* Activity Form Modal */}
      {showForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">📝 Record New Activity</h2>
              <button 
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setShowForm(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="card bg-base-200 p-4">
                <h3 className="font-bold mb-4">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label">Child *</label>
                    <select
                      className="select select-bordered w-full"
                      name="childId"
                      value={newActivity.childId}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select a child</option>
                      {children.map(child => (
                        <option key={child.id} value={child.id}>
                          {child.firstName} {child.lastName} ({child.group})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">Date *</label>
                    <input
                      type="date"
                      className="input input-bordered w-full"
                      name="date"
                      value={newActivity.date}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">Time *</label>
                    <input
                      type="time"
                      className="input input-bordered w-full"
                      name="time"
                      value={newActivity.time}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="form-control">
                    <label className="label">Activity Type *</label>
                    <select
                      className="select select-bordered w-full"
                      name="activityType"
                      value={newActivity.activityType}
                      onChange={handleInputChange}
                      required
                    >
                      {Object.entries(activityTypes).map(([type, info]) => (
                        <option key={type} value={type}>
                          {info.icon} {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">Specific Activity</label>
                    <select
                      className="select select-bordered w-full"
                      name="activitySubType"
                      value={newActivity.activitySubType}
                      onChange={handleInputChange}
                    >
                      <option value="">Select specific activity</option>
                      {newActivity.activityType && 
                        activityTypes[newActivity.activityType].subtypes.map(subtype => (
                          <option key={subtype} value={subtype}>{subtype}</option>
                        ))
                      }
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">Duration</label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      name="duration"
                      value={newActivity.duration}
                      onChange={handleInputChange}
                      placeholder="e.g., 30 minutes, 1 hour"
                    />
                  </div>
                </div>
              </div>

              {/* Activity Details */}
              <div className="card bg-base-200 p-4">
                <h3 className="font-bold mb-4">Activity Details</h3>
                
                <div className="form-control mb-4">
                  <label className="label">Activity Title *</label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    name="title"
                    value={newActivity.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Letter Recognition Game, Outdoor Nature Walk"
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">Description *</label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    name="description"
                    value={newActivity.description}
                    onChange={handleInputChange}
                    placeholder="Describe what the child did during this activity..."
                    required
                  />
                </div>
              </div>

              {/* Assessment */}
              <div className="card bg-base-200 p-4">
                <h3 className="font-bold mb-4">Assessment & Observations</h3>
                
                <div className="form-control mb-4">
                  <label className="label">Skills Observed</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    {skillCategories.map(skill => (
                      <label key={skill} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="checkbox"
                          name="skillsObserved"
                          value={skill}
                          checked={newActivity.skillsObserved.includes(skill)}
                          onChange={handleInputChange}
                        />
                        <span className="text-sm">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label">Development Level *</label>
                    <select
                      className="select select-bordered w-full"
                      name="developmentLevel"
                      value={newActivity.developmentLevel}
                      onChange={handleInputChange}
                      required
                    >
                      {developmentLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">Participation Level *</label>
                    <select
                      className="select select-bordered w-full"
                      name="participationLevel"
                      value={newActivity.participationLevel}
                      onChange={handleInputChange}
                      required
                    >
                      {participationLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">Enjoyment Level *</label>
                    <select
                      className="select select-bordered w-full"
                      name="enjoymentLevel"
                      value={newActivity.enjoymentLevel}
                      onChange={handleInputChange}
                      required
                    >
                      {enjoymentLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="card bg-base-200 p-4">
                <h3 className="font-bold mb-4">Additional Information</h3>
                
                <div className="form-control mb-4">
                  <label className="label">Next Steps/Recommendations</label>
                  <textarea
                    className="textarea textarea-bordered h-20"
                    name="nextSteps"
                    value={newActivity.nextSteps}
                    onChange={handleInputChange}
                    placeholder="What should be done next to support this child's development?"
                  />
                </div>
                
                <div className="form-control mb-4">
                  <label className="label">Additional Notes</label>
                  <textarea
                    className="textarea textarea-bordered h-20"
                    name="notes"
                    value={newActivity.notes}
                    onChange={handleInputChange}
                    placeholder="Any other observations, behaviors, or important details..."
                  />
                </div>

                {/* Photo Upload Section */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">📸 Activity Photos (Optional)</span>
                    <span className="label-text-alt">Up to 5 images, max 2MB each</span>
                  </label>
                  
                  <input
                    type="file"
                    className="file-input file-input-bordered w-full"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelection}
                  />
                  
                  {imagePreviewUrls.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-semibold mb-2">Selected Images:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {imagePreviewUrls.map((url, index) => {
                          const file = selectedImages[index];
                          const fileSizeMB = file ? (file.size / 1024 / 1024).toFixed(2) : '0';
                          return (
                            <div key={index} className="relative group">
                              <img
                                src={url}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border transition-transform group-hover:scale-105"
                              />
                              {/* File info overlay */}
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="truncate">{file?.name}</div>
                                <div>{fileSizeMB} MB</div>
                              </div>
                              <button
                                type="button"
                                className="btn btn-sm btn-circle btn-error absolute -top-2 -right-2 opacity-80 hover:opacity-100 transition-opacity"
                                onClick={() => removeImage(index)}
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-action">
                <button type="submit" className="btn btn-primary" disabled={loading || uploadingImages}>
                  {uploadingImages ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      🔄 Processing {selectedImages.length} photo{selectedImages.length !== 1 ? 's' : ''}...
                    </>
                  ) : loading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      💾 Recording Activity...
                    </>
                  ) : (
                    '📝 Record Activity'
                  )}
                </button>
                
                {/* Enhanced progress feedback */}
                {uploadingImages && (
                  <div className="flex flex-col gap-2 mt-2">
                    <div className="text-sm text-blue-600 font-medium">
                      🔄 Converting images to database format...
                    </div>
                    <div className="text-xs text-gray-600">
                      Processing {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} for Firestore database storage
                    </div>
                  </div>
                )}
                
                {/* Success indicator */}
                {!error && !loading && !uploadingImages && selectedImages.length > 0 && (
                  <div className="text-sm text-green-600 mt-2">
                    ✅ {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} ready to save
                    <div className="text-xs text-gray-600 mt-1">
                      Using database storage (500KB limit per image to stay under Firestore 1MB document limit)
                    </div>
                  </div>
                )}
                <button 
                  type="button" 
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowForm(false);
                    setSelectedImages([]);
                    setImagePreviewUrls([]);
                    setLoading(false);
                    setUploadingImages(false);
                    setError('');
                  }}
                >
                  Cancel
                </button>
                
                                 {/* Emergency reset button if stuck */}
                 {(loading || uploadingImages) && (
                   <button 
                     type="button" 
                     className="btn btn-warning btn-sm"
                     onClick={() => {
                       console.log('Emergency reset triggered');
                       setLoading(false);
                       setUploadingImages(false);
                       setSelectedImages([]);
                       setImagePreviewUrls([]);
                       setError('Upload cancelled by user');
                     }}
                   >
                     🛑 Force Stop
                   </button>
                 )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Activity Form Modal */}
      {showEditForm && editingActivity && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">✏️ Edit Activity</h2>
              <button 
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => {
                  setShowEditForm(false);
                  setEditingActivity(null);
                  setExistingPhotos([]);
                  setEditImages([]);
                  setEditImagePreviews([]);
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="card bg-base-200 p-4">
                <h3 className="font-bold mb-4">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label">Child *</label>
                    <select
                      className="select select-bordered w-full"
                      name="childId"
                      value={editingActivity.childId}
                      onChange={handleEditInputChange}
                      required
                    >
                      <option value="">Select a child</option>
                      {children.map(child => (
                        <option key={child.id} value={child.id}>
                          {child.firstName} {child.lastName} ({child.group})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">Date *</label>
                    <input
                      type="date"
                      className="input input-bordered w-full"
                      name="date"
                      value={editingActivity.date}
                      onChange={handleEditInputChange}
                      required
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">Time *</label>
                    <input
                      type="time"
                      className="input input-bordered w-full"
                      name="time"
                      value={editingActivity.time}
                      onChange={handleEditInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="form-control">
                    <label className="label">Activity Type *</label>
                    <select
                      className="select select-bordered w-full"
                      name="activityType"
                      value={editingActivity.activityType}
                      onChange={handleEditInputChange}
                      required
                    >
                      {Object.entries(activityTypes).map(([type, info]) => (
                        <option key={type} value={type}>
                          {info.icon} {type}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">Specific Activity</label>
                    <select
                      className="select select-bordered w-full"
                      name="activitySubType"
                      value={editingActivity.activitySubType || ''}
                      onChange={handleEditInputChange}
                    >
                      <option value="">Select specific activity</option>
                      {editingActivity.activityType && 
                        activityTypes[editingActivity.activityType].subtypes.map(subtype => (
                          <option key={subtype} value={subtype}>{subtype}</option>
                        ))
                      }
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">Duration</label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      name="duration"
                      value={editingActivity.duration || ''}
                      onChange={handleEditInputChange}
                      placeholder="e.g., 30 minutes, 1 hour"
                    />
                  </div>
                </div>
              </div>

              {/* Activity Details */}
              <div className="card bg-base-200 p-4">
                <h3 className="font-bold mb-4">Activity Details</h3>
                
                <div className="form-control mb-4">
                  <label className="label">Activity Title *</label>
                  <input
                    type="text"
                    className="input input-bordered w-full"
                    name="title"
                    value={editingActivity.title}
                    onChange={handleEditInputChange}
                    placeholder="e.g., Letter Recognition Game, Outdoor Nature Walk"
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">Description *</label>
                  <textarea
                    className="textarea textarea-bordered h-24"
                    name="description"
                    value={editingActivity.description}
                    onChange={handleEditInputChange}
                    placeholder="Describe what the child did during this activity..."
                    required
                  />
                </div>
              </div>

              {/* Assessment */}
              <div className="card bg-base-200 p-4">
                <h3 className="font-bold mb-4">Assessment & Observations</h3>
                
                <div className="form-control mb-4">
                  <label className="label">Skills Observed</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                    {skillCategories.map(skill => (
                      <label key={skill} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          className="checkbox"
                          name="skillsObserved"
                          value={skill}
                          checked={(editingActivity.skillsObserved || []).includes(skill)}
                          onChange={handleEditInputChange}
                        />
                        <span className="text-sm">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label">Development Level *</label>
                    <select
                      className="select select-bordered w-full"
                      name="developmentLevel"
                      value={editingActivity.developmentLevel}
                      onChange={handleEditInputChange}
                      required
                    >
                      {developmentLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">Participation Level *</label>
                    <select
                      className="select select-bordered w-full"
                      name="participationLevel"
                      value={editingActivity.participationLevel}
                      onChange={handleEditInputChange}
                      required
                    >
                      {participationLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">Enjoyment Level *</label>
                    <select
                      className="select select-bordered w-full"
                      name="enjoymentLevel"
                      value={editingActivity.enjoymentLevel}
                      onChange={handleEditInputChange}
                      required
                    >
                      {enjoymentLevels.map(level => (
                        <option key={level.value} value={level.value}>
                          {level.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="card bg-base-200 p-4">
                <h3 className="font-bold mb-4">Additional Information</h3>
                
                <div className="form-control mb-4">
                  <label className="label">Next Steps/Recommendations</label>
                  <textarea
                    className="textarea textarea-bordered h-20"
                    name="nextSteps"
                    value={editingActivity.nextSteps || ''}
                    onChange={handleEditInputChange}
                    placeholder="What should be done next to support this child's development?"
                  />
                </div>
                
                <div className="form-control mb-4">
                  <label className="label">Additional Notes</label>
                  <textarea
                    className="textarea textarea-bordered h-20"
                    name="notes"
                    value={editingActivity.notes || ''}
                    onChange={handleEditInputChange}
                    placeholder="Any other observations, behaviors, or important details..."
                  />
                </div>

                {/* Photo Management */}
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">📸 Activity Photos</span>
                    <span className="label-text-alt">Up to 5 images total, max 2MB each</span>
                  </label>
                  
                  {/* Existing Photos */}
                  {existingPhotos.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Current Photos:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        {existingPhotos.map((photoUrl, index) => (
                          <div key={index} className="relative">
                            <img
                              src={photoUrl}
                              alt={`Existing photo ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-circle btn-error absolute -top-2 -right-2"
                              onClick={() => removeExistingPhoto(index)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Add New Photos */}
                  <input
                    type="file"
                    className="file-input file-input-bordered w-full"
                    accept="image/*"
                    multiple
                    onChange={handleEditImageSelection}
                  />
                  
                                     {editImagePreviews.length > 0 && (
                     <div className="mt-4">
                       <h4 className="font-semibold mb-2">New Photos to Add:</h4>
                       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                         {editImagePreviews.map((url, index) => {
                           const file = editImages[index];
                           const fileSizeMB = file ? (file.size / 1024 / 1024).toFixed(2) : '0';
                           return (
                             <div key={index} className="relative group">
                               <img
                                 src={url}
                                 alt={`New photo ${index + 1}`}
                                 className="w-full h-24 object-cover rounded-lg border transition-transform group-hover:scale-105"
                               />
                               {/* File info overlay */}
                               <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                 <div className="truncate">{file?.name}</div>
                                 <div>{fileSizeMB} MB</div>
                               </div>
                               <button
                                 type="button"
                                 className="btn btn-sm btn-circle btn-error absolute -top-2 -right-2 opacity-80 hover:opacity-100 transition-opacity"
                                 onClick={() => removeEditImage(index)}
                               >
                                 ✕
                               </button>
                             </div>
                           );
                         })}
                       </div>
                     </div>
                   )}
                </div>
              </div>

                             <div className="modal-action">
                 <button type="submit" className="btn btn-primary" disabled={loading || uploadingImages}>
                   {uploadingImages ? (
                     <>
                       <span className="loading loading-spinner loading-sm"></span>
                       🔄 Processing {editImages.length} new photo{editImages.length !== 1 ? 's' : ''}...
                     </>
                   ) : loading ? (
                     <>
                       <span className="loading loading-spinner loading-sm"></span>
                       💾 Updating Activity...
                     </>
                   ) : (
                     '✏️ Update Activity'
                   )}
                 </button>
                 
                 {/* Enhanced progress feedback for edit */}
                 {uploadingImages && (
                   <div className="flex flex-col gap-2 mt-2">
                     <div className="text-sm text-blue-600 font-medium">
                       🔄 Converting new images to database format...
                     </div>
                     <div className="text-xs text-gray-600">
                       Processing {editImages.length} new image{editImages.length !== 1 ? 's' : ''} for Firestore database storage
                     </div>
                   </div>
                 )}
                 
                 {/* Success indicator for edit */}
                 {!error && !loading && !uploadingImages && editImages.length > 0 && (
                   <div className="text-sm text-green-600 mt-2">
                     ✅ {editImages.length} new image{editImages.length !== 1 ? 's' : ''} ready to upload
                     <div className="text-xs text-gray-600 mt-1">
                       Will be added to existing {existingPhotos.length} photo{existingPhotos.length !== 1 ? 's' : ''}
                     </div>
                   </div>
                 )}
                <button 
                  type="button" 
                  className="btn btn-ghost"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingActivity(null);
                    setExistingPhotos([]);
                    setEditImages([]);
                    setEditImagePreviews([]);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && activityToDelete && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">🗑️ Delete Activity</h3>
            <p className="mb-4">
              Are you sure you want to delete the activity "{activityToDelete.title}" 
              for {activityToDelete.childName}?
            </p>
            <p className="text-warning text-sm mb-6">
              This action cannot be undone. All associated photos and data will be permanently deleted.
            </p>
            
            <div className="modal-action">
              <button 
                className="btn btn-error" 
                onClick={confirmDelete}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Deleting...
                  </>
                ) : (
                  '🗑️ Delete Activity'
                )}
              </button>
              <button 
                className="btn btn-ghost" 
                onClick={() => {
                  setShowDeleteModal(false);
                  setActivityToDelete(null);
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  };
  
export default ActivityLog;