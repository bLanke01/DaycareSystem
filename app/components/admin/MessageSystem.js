'use client';

import { useEffect, useState, useRef } from 'react';
import { db } from '../../firebase/config';
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
  getDocs
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const MessageSystem = () => {
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParent, setSelectedParent] = useState(null);
  const [reply, setReply] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [newMessageNotification, setNewMessageNotification] = useState(false);
  const messagesEndRef = useRef(null);

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
      
      // Check for new messages
      if (messages.length > 0 && msgs.length > messages.length) {
        const newMessages = msgs.filter(msg => 
          !messages.find(oldMsg => oldMsg.id === msg.id)
        );
        
        // Show notification for new messages from parents
        if (newMessages.some(msg => msg.sender !== 'Admin')) {
          setNewMessageNotification(true);
          
          // Auto-hide notification after 5 seconds
          setTimeout(() => setNewMessageNotification(false), 5000);
          
          // Play notification sound if available
          if (typeof window !== 'undefined' && window.AudioContext) {
            try {
              const audioContext = new (window.AudioContext || window.webkitAudioContext)();
              const oscillator = audioContext.createOscillator();
              const gainNode = audioContext.createGain();
              
              oscillator.connect(gainNode);
              gainNode.connect(audioContext.destination);
              
              oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
              oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
              
              gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
              gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
              
              oscillator.start(audioContext.currentTime);
              oscillator.stop(audioContext.currentTime + 0.2);
            } catch (error) {
              console.log('Audio notification not supported');
            }
          }
        }
      }
      
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [messages.length]);

  // Get unique parent senders
  const parents = Array.from(
    new Set(messages.filter(m => m.sender !== 'Admin').map(m => m.sender))
  );

  // Filter parents based on search term
  const filteredParents = parents.filter(parent =>
    parent.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  // Enhanced file upload with base64 approach (no Firebase Storage needed)
  const uploadFile = async (file) => {
    console.log('Processing file:', file.name, file.size, file.type);
    
    try {
      // For images, convert to base64 with compression
      if (file.type.startsWith('image/')) {
        const base64 = await convertImageToBase64(file);
        console.log('Image converted to base64, size:', base64.length);
        
        return {
          url: base64,
          name: file.name,
          size: file.size,
          type: file.type,
          isBase64: true
        };
      }
      
      // For other files, use base64 as well
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      return {
        url: base64,
        name: file.name,
        size: file.size,
        type: file.type,
        isBase64: true
      };
    } catch (error) {
      console.error('Error processing file:', error);
      throw new Error(`Failed to process file: ${error.message}`);
    }
  };

  // Convert image to base64 with compression
  const convertImageToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 400x400 for chat images)
        const maxSize = 400;
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
        
        // Convert to base64 with quality 0.8 (80%) for chat images
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        resolve(base64);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  // Enhanced file selection with better validation
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log('File selected:', file.name, file.size, file.type);
    
    // Check file size (limit to 5MB for base64 storage)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB for base64 storage');
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
        
        // Always use base64 for all files
        console.log('Converting file to base64...');
        
        try {
          const fileData = await uploadFile(selectedFile);
          messageData.fileUrl = fileData.url;
          messageData.fileName = fileData.name;
          messageData.fileSize = fileData.size;
          messageData.fileType = fileData.type;
          messageData.content = messageContent || `📎 Sent a file: ${fileData.name}`;
          
          console.log('File converted to base64 successfully');
        } catch (uploadError) {
          console.error('Base64 conversion failed:', uploadError);
          throw new Error('Failed to process file. Please try a smaller file.');
        }
      } else {
        messageData.content = messageContent;
      }

      console.log('Saving message to Firestore...');
      await addDoc(collection(db, 'messages'), messageData);
      console.log('Message saved successfully!');



      setReply('');
      setSelectedFile(null);
      const fileInput = document.getElementById('adminFileInput');
      if (fileInput) fileInput.value = '';
      
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

  // Enhanced file preview with base64 indicator
  const renderFilePreview = () => {
    if (!selectedFile) return null;
    
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
              background: '#00b894',
              color: '#fff',
              padding: '2px 8px',
              borderRadius: 10,
              fontSize: 10,
              fontWeight: 'bold'
            }}>
              BASE64
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

  // Add this function to scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll to bottom when conversation changes
  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

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
      {/* CSS Animations for ping effect */}
      <style jsx>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        @keyframes bounce {
          0%, 100% {
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
      `}</style>
      {/* Toggle Button */}
      <button
        onClick={() => setSidebarVisible(!sidebarVisible)}
        style={{
          position: 'absolute',
          top: 20,
          left: sidebarVisible ? 320 : 20,
          zIndex: 1000,
          background: 'linear-gradient(135deg, #74b9ff, #0984e3)',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: 40,
          height: 40,
          cursor: 'pointer',
          fontSize: 16,
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
          width: 350,
          padding: 20,
          background: 'linear-gradient(135deg, #81ecec, #74b9ff)',
          boxShadow: '2px 0 15px rgba(0,0,0,0.1)',
          borderRadius: '25px 0 0 25px',
          minWidth: 300,
          flexShrink: 0,
          transition: 'all 0.3s ease'
        }}>
          <h3 style={{
            color: '#fff',
            textAlign: 'center',
            marginBottom: 20,
            fontSize: 22,
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0,0,0,0.2)',
            marginTop: 30
          }}>
            👨‍👩‍👧‍👦 Parents
            {/* Notification indicator */}
            {Object.keys(unreadCounts).length > 0 && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                marginLeft: 15,
                background: 'linear-gradient(135deg, #e84393, #fd79a8)',
                padding: '6px 12px',
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(232,67,147,0.4)',
                animation: 'bounce 1s infinite'
              }}>
                🔔 {Object.values(unreadCounts).reduce((a, b) => a + b, 0)} New
              </div>
            )}
          </h3>
          
          <input
            type="text"
            placeholder="🔍 Search parents..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              marginBottom: 20,
              padding: '15px 18px',
              borderRadius: 20,
              border: 'none',
              fontSize: 16,
              background: '#fff',
              outline: 'none',
              boxShadow: '0 3px 10px rgba(0,0,0,0.1) inset',
              transition: 'box-shadow 0.2s',
              fontWeight: '500'
            }}
          />
          
          <ul style={{ 
            listStyle: 'none', 
            padding: 0, 
            margin: 0, 
            maxHeight: 400, 
            overflowY: 'auto',
            scrollbarWidth: 'thin',
            scrollbarColor: '#fff #74b9ff'
          }}>
            {filteredParents.map(parent => (
              <li
                key={parent}
                onClick={() => setSelectedParent(parent)}
                style={{
                  position: 'relative',
                  padding: '15px 20px',
                  marginBottom: 10,
                  borderRadius: 18,
                  background: selectedParent === parent 
                    ? 'linear-gradient(135deg, #fd79a8, #fdcb6e)' 
                    : 'rgba(255,255,255,0.9)',
                  color: selectedParent === parent ? '#fff' : '#333',
                  fontWeight: selectedParent === parent ? 'bold' : '500',
                  fontSize: 16,
                  cursor: 'pointer',
                  boxShadow: selectedParent === parent 
                    ? '0 4px 15px rgba(253,121,168,0.4)' 
                    : '0 2px 8px rgba(0,0,0,0.1)',
                  border: selectedParent === parent ? '2px solid #fd79a8' : 'none',
                  transition: 'all 0.2s ease',
                  transform: selectedParent === parent ? 'scale(1.02)' : 'scale(1)',
                }}
                onMouseOver={e => {
                  if (selectedParent !== parent) {
                    e.currentTarget.style.background = 'rgba(255,255,255,1)';
                    e.currentTarget.style.transform = 'scale(1.01)';
                  }
                }}
                onMouseOut={e => {
                  if (selectedParent !== parent) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.9)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>👤 {parent}</span>
                  
                  {/* Enhanced notification with ping animation and message count */}
                  {unreadCounts[parent] > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Ping animation */}
                      <div style={{
                        width: 8,
                        height: 8,
                        background: '#e84393',
                        borderRadius: '50%',
                        animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
                        boxShadow: '0 0 0 0 rgba(232, 67, 147, 0.7)'
                      }}></div>
                      
                      {/* Message count ping */}
                      <div style={{
                        background: 'linear-gradient(135deg, #e84393, #fd79a8)',
                        color: 'white',
                        borderRadius: '50%',
                        padding: '6px 10px',
                        fontSize: 14,
                        fontWeight: 'bold',
                        minWidth: 24,
                        textAlign: 'center',
                        boxShadow: '0 4px 15px rgba(232,67,147,0.4)',
                        animation: 'bounce 1s infinite',
                        border: '2px solid #fff'
                      }}>
                        {unreadCounts[parent]}
                      </div>
                    </div>
                  )}
                </div>
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
              💬 Chat with {selectedParent} 💬
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
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
              className="hide-scrollbar"
            >
              {conversation
                .sort((a, b) => (a.date?.seconds || 0) - (b.date?.seconds || 0))
                .map(renderMessage)}
              
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

      {/* Floating notification banner */}
      {newMessageNotification && (
        <div style={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 1001,
          background: 'linear-gradient(135deg, #e84393, #fd79a8)',
          color: '#fff',
          padding: '15px 20px',
          borderRadius: 20,
          boxShadow: '0 8px 25px rgba(232,67,147,0.4)',
          animation: 'bounce 1s infinite',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontSize: 16,
          fontWeight: 'bold',
          border: '2px solid #fff'
        }}>
          🔔 New message received!
          <button
            onClick={() => setNewMessageNotification(false)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: '#fff',
              borderRadius: '50%',
              width: 24,
              height: 24,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 'bold',
              marginLeft: 10
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageSystem;