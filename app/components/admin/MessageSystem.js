'use client';

//Ji, this is your admin messaging system. i didnt use component for admin system because i made  chat window and messaging list and made it both admin and parent dashboard call it. if you made any changes to other files, please add a comment that you did make changes so we dont get conflict when merging.


import { useEffect, useState, useRef } from 'react'; // Add useRef back
import { db, storage } from '../../firebase/config';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  where,
  getDocs,
  getDoc,    // Add this
  setDoc     // Add this
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const MessageSystem = () => {
  // 1. State declarations
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParent, setSelectedParent] = useState(null);
  const [reply, setReply] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [parentDisplayNames, setParentDisplayNames] = useState({});
  const [editingParent, setEditingParent] = useState(null);
  const [newParentName, setNewParentName] = useState('');
  const messagesEndRef = useRef(null);

  // 2. Helper functions that don't depend on other functions
  // Get display name for parent (use custom name if set, otherwise use email)
  const getParentDisplayName = (parentEmail) => {
    const displayName = parentDisplayNames[parentEmail] || parentEmail;
    console.log('Getting display name for:', parentEmail, '->', displayName);
    return displayName;
  };

  // Add CSS for scrollbar styling
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .chat-area::-webkit-scrollbar {
        width: 8px;
      }
      .chat-area::-webkit-scrollbar-track {
        background: rgba(116,185,255,0.2);
        border-radius: 10px;
      }
      .chat-area::-webkit-scrollbar-thumb {
        background: linear-gradient(135deg, #74b9ff, #0984e3);
        border-radius: 10px;
      }
      .chat-area::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(135deg, #0984e3, #2d3436);
      }
      .chat-area {
        scrollbar-width: thin;
        scrollbar-color: #74b9ff rgba(116,185,255,0.2);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Get logged-in admin's email
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setAdminEmail(user.email);
    });
    return () => unsubscribe();
  }, []);

  // Fetch all messages in real-time
  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() });
      });
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, []);

  // 4. Computed values that depend on state and helper functions
  // Get unique parent senders
  const parents = Array.from(
    new Set(messages.filter(m => m.sender !== 'Admin').map(m => m.sender))
  );

  // Filter parents based on search term - THIS SHOULD NOW WORK
  const filteredParents = parents.filter(parent => {
    const displayName = getParentDisplayName(parent);
    const searchLower = searchTerm.toLowerCase();
    return parent.toLowerCase().includes(searchLower) || 
           displayName.toLowerCase().includes(searchLower);
  });

  // Filter conversation with selected parent
  const conversation = messages.filter(
    m =>
      (m.sender === selectedParent && m.recipient === 'Admin') ||
      (m.sender === 'Admin' && m.recipient === selectedParent)
  );

  // Compute unread message count for each parent
  const unreadCounts = {};
  messages.forEach(msg => {
    if (
      msg.sender !== 'Admin' &&
      msg.recipient === 'Admin' &&
      !msg.read
    ) {
      unreadCounts[msg.sender] = (unreadCounts[msg.sender] || 0) + 1;
    }
  });

  // Mark messages as read when parent is selected
  useEffect(() => {
    if (!selectedParent) return;
    conversation.forEach(async (msg) => {
      if (!msg.read && msg.recipient === 'Admin') {
        await updateDoc(doc(db, 'messages', msg.id), { read: true });
      }
    });
  }, [selectedParent, conversation]);

  // Enhanced file upload with hybrid approach
  const uploadFile = async (file) => {
    console.log('Starting file upload:', file.name, file.size, file.type);
    
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const storageRef = ref(storage, `messages/${fileName}`);
    
    try {
      console.log('Uploading to Firebase Storage...');
      const snapshot = await uploadBytes(storageRef, file);
      console.log('Upload successful, getting download URL...');
      
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('Download URL obtained:', downloadURL);
      
      return {
        url: downloadURL,
        name: file.name,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  };

  // Enhanced file selection with better validation
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log('File selected:', file.name, file.size, file.type);
    
    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size should be less than 10MB');
      return;
    }
    
    // Enhanced file type checking
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/bmp',
      'application/pdf', 'text/plain', 'text/csv'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert('File type not supported. Please use: Images (JPG, PNG, GIF, WebP), PDFs, or text files.');
      return;
    }
    
    setSelectedFile(file);
    console.log('File validation passed');
  };

  // Check if parent has email notifications enabled
  const checkParentEmailNotifications = async (parentEmail) => {
    try {
      const parentQuery = query(
        collection(db, 'users'), 
        where('email', '==', parentEmail),
        where('emailNotifications', '==', true)
      );
      const parentSnapshot = await getDocs(parentQuery);
      return !parentSnapshot.empty;
    } catch (error) {
      console.error('Error checking parent email notifications:', error);
      return false;
    }
  };

  // Send email notification to parent (if enabled)
  const sendEmailNotification = async (parentEmail, messageContent, hasFile = false) => {
    try {
      const shouldSendEmail = await checkParentEmailNotifications(parentEmail);
      if (!shouldSendEmail) return;

      const emailData = {
        to: parentEmail,
        subject: 'New Message from Daycare Admin',
        html: `
          <h2>New Message from Daycare Admin</h2>
          <p><strong>From:</strong> Admin</p>
          <p><strong>Message:</strong> ${messageContent}</p>
          ${hasFile ? '<p><strong>📎 File attachment included</strong></p>' : ''}
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <hr>
          <p><em>Please log into the daycare system to view the full message.</em></p>
        `
      };

      console.log('Email notification prepared:', emailData);
      
    } catch (error) {
      console.error('Error sending email notification:', error);
    }
  };

  // Enhanced reply function with hybrid file upload
  const handleReply = async (e) => {
    e.preventDefault();
    if ((!reply.trim() && !selectedFile) || !selectedParent) return;
    
    setUploading(true);
    
    try {
      let messageData = {
        sender: 'Admin',
        recipient: selectedParent,
        date: serverTimestamp(),
        read: false,
      };

      let hasFile = false;
      let messageContent = reply.trim();

      if (selectedFile) {
        console.log('Processing file:', selectedFile.name, selectedFile.type, selectedFile.size);
        hasFile = true;
        
        // Use Firebase Storage for files larger than 500KB
        if (selectedFile.size > 500 * 1024) {
          console.log('Using Firebase Storage for large file');
          
          try {
            const fileData = await uploadFile(selectedFile);
            messageData.fileUrl = fileData.url;
            messageData.fileName = fileData.name;
            messageData.fileSize = fileData.size;
            messageData.fileType = fileData.type;
            messageData.content = messageContent || `📎 Sent a file: ${fileData.name}`;
            
            console.log('File uploaded to Firebase Storage successfully');
          } catch (uploadError) {
            console.error('Firebase Storage upload failed:', uploadError);
            throw new Error('Failed to upload file. Please try a smaller file or check your internet connection.');
          }
        } else {
          console.log('Using base64 for small file');
          
          // Use base64 for small files
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              console.log('File converted to base64');
              resolve(reader.result);
            };
            reader.onerror = (error) => {
              console.error('Error reading file:', error);
              reject(error);
            };
            reader.readAsDataURL(selectedFile);
          });
          
          messageData.fileData = base64;
          messageData.fileName = selectedFile.name;
          messageData.fileSize = selectedFile.size;
          messageData.fileType = selectedFile.type;
          messageData.content = messageContent || `📎 Sent a file: ${selectedFile.name}`;
        }
      } else {
        messageData.content = messageContent;
      }

      console.log('Saving message to Firestore...');
      await addDoc(collection(db, 'messages'), messageData);
      console.log('Message saved successfully!');

      // Send email notification to parent if enabled
      await sendEmailNotification(selectedParent, messageData.content, hasFile);

      setReply('');
      setSelectedFile(null);
      const fileInput = document.getElementById('adminFileInput');
      if (fileInput) fileInput.value = '';
      
      // Auto-scroll to bottom after sending message
      setTimeout(() => scrollToBottom(), 200);
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert(`Error sending message: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Enhanced message rendering with support for both fileUrl and fileData
  const renderMessage = (msg) => {
    const isMe = msg.sender === 'Admin';
    const isImage = msg.fileType?.startsWith('image/');
    const isFile = (msg.fileUrl || msg.fileData) && !isImage;
    const fileSource = msg.fileUrl || msg.fileData;

    // Debug logging
    if (msg.fileData || msg.fileUrl) {
      console.log('Rendering message with file:', {
        fileName: msg.fileName,
        fileType: msg.fileType,
        isImage: isImage,
        hasFileData: !!msg.fileData,
        hasFileUrl: !!msg.fileUrl
      });
    }

    return (
      <div
        key={msg.id}
        style={{
          display: 'flex',
          justifyContent: isMe ? 'flex-end' : 'flex-start',
          margin: '12px 0',
        }}
      >
        <div
          style={{
            background: isMe 
              ? 'linear-gradient(135deg, #6c5ce7, #a29bfe)' 
              : 'linear-gradient(135deg, #00b894, #00cec9)',
            color: '#fff',
            borderRadius: isMe ? '25px 25px 5px 25px' : '25px 25px 25px 5px',
            padding: '15px 20px',
            maxWidth: '70%',
            boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
            fontSize: 16,
            position: 'relative',
            transform: isMe ? 'rotate(1deg)' : 'rotate(-1deg)',
            transition: 'transform 0.2s ease',
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'rotate(0deg) scale(1.02)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = isMe ? 'rotate(1deg) scale(1)' : 'rotate(-1deg) scale(1)';
          }}
        >
          <div style={{ 
            fontWeight: 'bold', 
            fontSize: 14, 
            marginBottom: 5,
            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}>
            {isMe ? '👨‍💼 You (Admin)' : '👨‍👩‍👧‍👦 ' + msg.sender}
          </div>
          
          {/* Enhanced Image preview */}
          {isImage && fileSource && (
            <div style={{ marginBottom: 10 }}>
              <img
                src={fileSource}
                alt={msg.fileName || 'Uploaded image'}
                style={{
                  maxWidth: '250px',
                  maxHeight: '250px',
                  borderRadius: 15,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                  objectFit: 'cover'
                }}
                onClick={() => {
                  const newWindow = window.open();
                  newWindow.document.write(`
                    <html>
                      <head><title>${msg.fileName || 'Image'}</title></head>
                      <body style="margin:0; display:flex; justify-content:center; align-items:center; min-height:100vh; background:#000;">
                        <img src="${fileSource}" style="max-width:100%; max-height:100vh; object-fit:contain;" />
                      </body>
                    </html>
                  `);
                }}
                onError={(e) => {
                  console.error('Image load error:', e);
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {/* Enhanced File download link */}
          {isFile && (
            <div style={{ marginBottom: 10 }}>
              <a
                href={fileSource}
                download={msg.fileName}
                style={{
                  color: '#fff',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(255,255,255,0.2)',
                  padding: '8px 12px',
                  borderRadius: 15,
                  fontSize: 14,
                  fontWeight: 'bold',
                  transition: 'background 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              >
                📎 {msg.fileName}
              </a>
            </div>
          )}
          
          <div style={{ fontSize: 16, lineHeight: 1.4 }}>{msg.content}</div>
          <div style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.8)',
            marginTop: 8,
            textAlign: 'right',
            fontStyle: 'italic'
          }}>
            {msg.date?.toDate ? msg.date.toDate().toLocaleTimeString() : ''}
          </div>
        </div>
      </div>
    );
  };

  // Enhanced file preview with size indicator
  const renderFilePreview = () => {
    if (!selectedFile) return null;
    
    const isLargeFile = selectedFile.size > 500 * 1024;
    
    return (
      <div style={{
        padding: 15,
        background: 'linear-gradient(135deg, #a8e6cf, #88d8c0)',
        borderRadius: 20,
        marginBottom: 15,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        border: '2px solid #00b894'
      }}>
        {/* File icon based on type */}
        <span style={{ fontSize: 24 }}>
          {selectedFile.type.startsWith('image/') ? '🖼️' : 
           selectedFile.type.includes('pdf') ? '📄' : 
           selectedFile.type.includes('word') ? '📝' : '📎'}
        </span>
        
        <div style={{ flex: 1 }}>
          <div style={{ 
            fontSize: 16, 
            fontWeight: 'bold',
            color: '#2d3436',
            marginBottom: 2
          }}>
            {selectedFile.name}
          </div>
          <div style={{ 
            fontSize: 12, 
            color: '#636e72',
            display: 'flex',
            gap: 10,
            alignItems: 'center'
          }}>
            <span>Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
            <span>Type: {selectedFile.type.split('/')[1]?.toUpperCase() || 'FILE'}</span>
            <span style={{ 
              background: isLargeFile ? '#ff6b6b' : '#00b894',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: 10,
              fontSize: 10,
              fontWeight: 'bold'
            }}>
              {isLargeFile ? 'STORAGE' : 'INSTANT'}
            </span>
          </div>
        </div>
        
        <button
          onClick={() => {
            setSelectedFile(null);
            const fileInput = document.getElementById('adminFileInput');
            if (fileInput) fileInput.value = '';
          }}
          style={{
            background: '#e17055',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            borderRadius: '50%',
            width: 30,
            height: 30,
            fontSize: 16,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'
          }
        >
          ✕
        </button>
      </div>
    );
  };

  // Add this function after your state declarations:
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Add this useEffect after your existing useEffects:
  useEffect(() => {
    // Auto-scroll to bottom when conversation changes or new messages arrive
    if (conversation.length > 0) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [conversation.length, selectedParent]);

  // Load parent display names from Firestore
  useEffect(() => {
    console.log('Setting up real-time listener for parent display names...');
    
    // Set up real-time listener for parent display names
    const q = query(collection(db, 'parentDisplayNames'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const names = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        names[doc.id] = data.displayName;
        console.log('Real-time update - display name:', doc.id, '->', data.displayName);
      });
      
      setParentDisplayNames(names);
      console.log('Parent display names updated in real-time:', names);
    }, (error) => {
      console.error('Error in parent display names listener:', error);
    });
    
    return () => {
      console.log('Cleaning up parent display names listener');
      unsubscribe();
    };
  }, []);

  // 5. Other functions
  // Start editing a parent's name
  const startEditingParent = (parentEmail) => {
    setEditingParent(parentEmail);
    setNewParentName(getParentDisplayName(parentEmail));
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingParent(null);
    setNewParentName('');
  };

  // Save the new parent name
  const saveParentName = async () => {
    if (!newParentName.trim() || !editingParent) return;
    
    try {
      console.log('Saving parent name:', editingParent, '->', newParentName.trim());
      
      // First, check if document exists
      const parentDocRef = doc(db, 'parentDisplayNames', editingParent);
      const parentDoc = await getDoc(parentDocRef);
      
      if (parentDoc.exists()) {
        // Document exists, update it
        await updateDoc(parentDocRef, {
          displayName: newParentName.trim(),
          updatedAt: serverTimestamp(),
          updatedBy: adminEmail
        });
        console.log('Updated existing parent display name');
      } else {
        // Document doesn't exist, create it using setDoc
        await setDoc(parentDocRef, {
          email: editingParent,
          displayName: newParentName.trim(),
          createdAt: serverTimestamp(),
          createdBy: adminEmail
        });
        console.log('Created new parent display name document');
      }

      // Update local state immediately
      setParentDisplayNames(prev => ({
        ...prev,
        [editingParent]: newParentName.trim()
      }));

      setEditingParent(null);
      setNewParentName('');
      
      console.log(`Parent name saved successfully: ${editingParent} -> ${newParentName.trim()}`);
      
    } catch (error) {
      console.error('Error saving parent name:', error);
      alert('Error saving parent name. Please try again.');
    }
  };

  // 6. Return statement
  return (
    <div style={{ 
      display: 'flex', 
      height: '600px',
      background: 'linear-gradient(135deg, #ffeaa7, #fab1a0)',
      borderRadius: 25,
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Toggle Button */}
      <button
        onClick={() => setSidebarVisible(!sidebarVisible)}
        style={{
          position: 'absolute',
          top: 20,
          left: sidebarVisible ? 260 : 20, 
          zIndex: 1000,
          background: 'linear-gradient(135deg, #74b9ff, #0984e3)',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: 35,
          height: 35,
          cursor: 'pointer',
          fontSize: 14, 
          fontWeight: 'bold',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
          transition: 'all 0.3s ease',
          transform: sidebarVisible ? 'rotate(180deg)' : 'rotate(0deg)'
        }}
        onMouseOver={e => e.currentTarget.style.transform = `scale(1.1) ${sidebarVisible ? 'rotate(180deg)' : 'rotate(0deg)'}`}
        onMouseOut={e => e.currentTarget.style.transform = `scale(1) ${sidebarVisible ? 'rotate(180deg)' : 'rotate(0deg)'}`}
      >
        {sidebarVisible ? '◀' : '▶'}
      </button>

      {/* Parent List Sidebar - Collapsible */}
      {sidebarVisible && (
        <div style={{
          width: 280, 
          padding: 15,
          background: 'linear-gradient(135deg, #81ecec, #74b9ff)',
          boxShadow: '2px 0 15px rgba(0,0,0,0.1)',
          borderRadius: '25px 0 0 25px',
          minWidth: 250,
          maxWidth: 280, 
          flexShrink: 0,
          transition: 'all 0.3s ease',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}>
          <h3 style={{
            color: '#fff',
            textAlign: 'center',
            marginBottom: 15, 
            fontSize: 18, 
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            marginTop: 20 
          }}>
            👨‍👩‍👧‍👦 Parents
          </h3>
          
          <input
            type="text"
            placeholder="🔍 Search parents..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: 'calc(100% - 20px)',
              marginBottom: 15,
              padding: '10px 15px', 
              borderRadius: 15, 
              border: 'none',
              fontSize: 14, 
              background: '#fff',
              outline: 'none',
              boxShadow: '0 3px 10px rgba(0,0,0,0.1) inset',
              transition: 'box-shadow 0.2s',
              fontWeight: '500',
              boxSizing: 'border-box'
            }}
          />
          
          {/* Replace your parent list items with this more compact version: */}
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0, 
            maxHeight: 400, 
            overflowY: 'auto',
            overflowX: 'hidden',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.3) transparent',
            wordWrap: 'break-word',
            wordBreak: 'break-word',
            boxSizing: 'border-box'
          }}>
            {filteredParents.map(parent => (
              <li
                key={parent}
                style={{
                  position: 'relative',
                  padding: '8px 12px', 
                  marginBottom: 6, 
                  borderRadius: 12,
                  background: selectedParent === parent 
                    ? 'linear-gradient(135deg, #fd79a8, #fdcb6e)' 
                    : 'rgba(255,255,255,0.9)',
                  color: selectedParent === parent ? '#fff' : '#333',
                  fontWeight: selectedParent === parent ? 'bold' : '500',
                  fontSize: 14, 
                  cursor: editingParent === parent ? 'default' : 'pointer',
                  boxShadow: selectedParent === parent 
                    ? '0 2px 8px rgba(253,121,168,0.3)' 
                    : '0 1px 4px rgba(0,0,0,0.1)',
                  border: selectedParent === parent ? '1px solid #fd79a8' : 'none', 
                  transition: 'all 0.2s ease',
                  transform: selectedParent === parent ? 'scale(1.01)' : 'scale(1)', 
                  minWidth: 0,
                  maxWidth: '100%',
                  overflow: 'visible',
                  boxSizing: 'border-box',
                  minHeight: '32px'
                }}
              >
                {editingParent === parent ? (
                  // Edit mode - more compact
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}> {/* Reduced gap */}
                    <input
                      type="text"
                      value={newParentName}
                      onChange={(e) => setNewParentName(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') saveParentName();
                        if (e.key === 'Escape') cancelEditing();
                      }}
                      style={{
                        padding: '6px 8px', // Reduced padding
                        borderRadius: 8, // Reduced border radius
                        border: '1px solid #74b9ff', // Reduced border width
                        fontSize: 12, // Reduced font size
                        fontWeight: 'bold',
                        outline: 'none',
                        background: '#fff',
                        color: '#333'
                      }}
                      placeholder="Enter display name..."
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: 4 }}> {/* Reduced gap */}
                      <button
                        onClick={saveParentName}
                        style={{
                          padding: '3px 6px', // Reduced padding
                          borderRadius: 6, // Reduced border radius
                          border: 'none',
                          background: '#00b894',
                          color: '#fff',
                          fontSize: 10, // Reduced font size
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        ✅ Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        style={{
                          padding: '3px 6px', // Reduced padding
                          borderRadius: 6,
                          border: 'none',
                          background: '#e17055',
                          color: '#fff',
                          fontSize: 10, // Reduced font size
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        ❌ Cancel
                      </button>
                    </div>
                    <div style={{ fontSize: 9, color: '#636e72', fontStyle: 'italic' }}> {/* Reduced font size */}
                      Original: {parent}
                    </div>
                  </div>
                ) : (
                  // Normal display mode - more compact
                  <div onClick={() => setSelectedParent(parent)}>
                    <span style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '180px', // Increased since overall size is smaller
                      display: 'inline-block',
                      fontSize: '14px', // Explicit font size
                      lineHeight: '1.2' // Tighter line height
                    }}>
                      👤 {getParentDisplayName(parent)}
                    </span>
                    
                    {/* Edit button - smaller */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingParent(parent);
                      }}
                      style={{
                        position: 'absolute',
                        right: unreadCounts[parent] > 0 ? 28 : 8, // Reduced spacing
                        top: 6, // Adjusted top position
                        background: 'rgba(116,185,255,0.2)',
                        border: 'none',
                        borderRadius: '50%',
                        width: 18, // Reduced from 24px
                        height: 18, // Reduced from 24px
                        cursor: 'pointer',
                        fontSize: 10, // Reduced font size
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        opacity: 0.7
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = 'rgba(116,185,255,0.4)';
                        e.currentTarget.style.opacity = '1';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = 'rgba(116,185,255,0.2)';
                        e.currentTarget.style.opacity = '0.7';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title="Edit parent name"
                    >
                      ✏️
                    </button>

                    {/* Unread count badge - smaller */}
                    {unreadCounts[parent] > 0 && (
                      <span style={{
                        position: 'absolute',
                        right: 8, // Reduced spacing
                        top: 6, // Adjusted top position
                        background: 'linear-gradient(135deg, #e84393, #fd79a8)',
                        color: 'white',
                        borderRadius: '50%',
                        padding: '2px 6px', // Reduced padding
                        fontSize: 10, // Reduced font size
                        fontWeight: 'bold',
                        minWidth: 16, // Reduced minimum width
                        textAlign: 'center',
                        boxShadow: '0 1px 4px rgba(232,67,147,0.4)', // Reduced shadow
                        animation: 'pulse 2s infinite'
                      }}>
                        {unreadCounts[parent]}
                      </span>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Chat Area - Always Visible */}
      <div style={{ 
        flex: 1, 
        padding: 20,
        paddingTop: sidebarVisible ? 20 : 70,
        display: 'flex', 
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #ffeaa7, #fab1a0)',
        borderRadius: sidebarVisible ? '0 25px 25px 0' : '25px',
        transition: 'all 0.3s ease'
      }}>
        {selectedParent ? (
          <>
            <h3 style={{
              textAlign: 'center',
              color: '#2d3436',
              fontSize: 24,
              fontWeight: 'bold',
              marginBottom: 20,
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              💬 Chat with {getParentDisplayName(selectedParent)} 💬
              {getParentDisplayName(selectedParent) !== selectedParent && (
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 'normal', 
                  color: '#636e72',
                  fontStyle: 'italic' 
                }}>
                  ({selectedParent})
                </div>
              )}
            </h3>
            
            <div
              style={{
                border: '3px solid #74b9ff',
                padding: 25,
                height: 350,
                overflowY: 'auto',
                marginBottom: 20,
                background: 'linear-gradient(135deg, #dda0dd, #98d8c8)',
                borderRadius: 25,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 8px 25px rgba(116,185,255,0.3)',
              }}
              className="chat-area"
            >
              {conversation
                .sort((a, b) => (a.date?.seconds || 0) - (b.date?.seconds || 0))
                .map(renderMessage)}
              
              {/* Add this back for auto-scroll target */}
              <div ref={messagesEndRef} />
            </div>

            {/* Enhanced File preview */}
            {renderFilePreview()}

            <form onSubmit={handleReply} style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              background: 'linear-gradient(135deg, #6c5ce7, #a29bfe)',
              borderRadius: 25,
              boxShadow: '0 6px 20px rgba(108,92,231,0.4)',
              padding: 8,
              border: '3px solid #6c5ce7'
            }}>
              <input
                type="text"
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder={selectedFile ? "Add a message with your file..." : "Message Parent! 💬"}
                style={{
                  flex: 1,
                  padding: '15px 20px',
                  borderRadius: 20,
                  border: 'none',
                  fontSize: 16,
                  outline: 'none',
                  background: '#fff',
                  color: '#333',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1) inset',
                  fontWeight: '500'
                }}
              />
              
              <input
                id="adminFileInput"
                type="file"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.txt"
                style={{ display: 'none' }}
              />
              
              <button
                type="button"
                onClick={() => document.getElementById('adminFileInput').click()}
                style={{
                  padding: '12px 15px',
                  borderRadius: 20,
                  background: selectedFile 
                    ? 'linear-gradient(135deg, #00b894, #00a085)' 
                    : 'linear-gradient(135deg, #fdcb6e, #e17055)',
                  color: selectedFile ? '#fff' : '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 18,
                  fontWeight: 'bold',
                  boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
                  transition: 'transform 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'
                }
              >
                {selectedFile ? '✅' : '📎'}
              </button>
              
              <button
                type="submit"
                disabled={uploading || (!reply.trim() && !selectedFile)}
                style={{
                  padding: '12px 25px',
                  borderRadius: 20,
                  background: (reply.trim() || selectedFile) && !uploading 
                    ? 'linear-gradient(135deg, #00b894, #00cec9)' 
                    : 'linear-gradient(135deg, #ddd, #bbb)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: 16,
                  cursor: (reply.trim() || selectedFile) && !uploading ? 'pointer' : 'not-allowed',
                  boxShadow: (reply.trim() || selectedFile) && !uploading 
                    ? '0 4px 15px rgba(0,184,148,0.4)' 
                    : 'none',
                  transition: 'all 0.2s',
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}
              >
                {uploading ? (
                  selectedFile ? '📤 Uploading File...' : '💬 Sending...'
                ) : (
                  selectedFile ? '📤 Send File' : '💬 Send'
                )}
              </button>
            </form>
          </>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            color: '#636e72',
            fontSize: 20,
            fontWeight: 'bold',
            marginTop: 100,
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {sidebarVisible ? '👈 Select a parent to start chatting! 🎉' : '👆 Click the arrow to see parent list! 📝'}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageSystem;