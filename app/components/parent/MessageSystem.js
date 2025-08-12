// components/parent/MessageSystem.js - Enhanced messaging system

import { useEffect, useState, useRef } from 'react';
import { db } from '../../firebase/config';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, where, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function ParentMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [newMessageNotification, setNewMessageNotification] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Auto-scroll to bottom function
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to specific message
  const scrollToMessage = (messageId) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the message briefly
      messageElement.style.background = 'rgba(255,255,0,0.3)';
      setTimeout(() => {
        messageElement.style.background = 'transparent';
      }, 2000);
    }
    setShowSearch(false);
    setSearchTerm('');
  };

  // Get logged-in parent's email
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) setParentEmail(user.email);
    });
    return () => unsubscribe();
  }, []);

  // Fetch messages between this parent and admin
  useEffect(() => {
    if (!parentEmail) return;
    const q = query(collection(db, 'messages'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      let unread = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (
          (data.sender === parentEmail && data.recipient === 'Admin') ||
          (data.sender === 'Admin' && data.recipient === parentEmail)
        ) {
          msgs.push({ id: doc.id, ...data });
          
          // Count unread messages from admin
          if (data.sender === 'Admin' && data.recipient === parentEmail && !data.read) {
            unread++;
          }
        }
      });
      
      setMessages(msgs);
      setUnreadCount(unread);
      
      // Check for new messages from admin ONLY (not from parent)
      if (messages.length > 0 && msgs.length > messages.length) {
        const newMessages = msgs.filter(msg => 
          !messages.find(oldMsg => oldMsg.id === msg.id)
        );
        
        // Show notification ONLY for new messages FROM admin TO parent
        const newAdminMessages = newMessages.filter(msg => 
          msg.sender === 'Admin' && msg.recipient === parentEmail
        );
        
        if (newAdminMessages.length > 0) {
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
    });
    return () => unsubscribe();
  }, [parentEmail, messages.length]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Update notification bell when unread count changes
  useEffect(() => {
    if (typeof window !== 'undefined' && unreadCount >= 0) {
      // Trigger notification bell refresh when unread count changes
      window.dispatchEvent(new CustomEvent('unreadCountChanged', {
        detail: { unreadCount, userId: parentEmail }
      }));
    }
  }, [unreadCount, parentEmail]);

  // Add CSS for hiding scrollbar
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Enhanced file upload with base64 approach (same as admin system)
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

  // Convert image to base64 with compression (same as admin system)
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

  // Fixed search function to handle fileData properly
  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term.trim()) {
      const results = messages.filter(msg => 
        msg.content.toLowerCase().includes(term.toLowerCase()) ||
        (msg.fileName && msg.fileName.toLowerCase().includes(term.toLowerCase()))
      );
      setSearchResults(results);
      setShowSearch(true);
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  };

  // Enhanced send function with base64 file handling (same as admin system)
  const handleSend = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !parentEmail) return;
    
    setUploading(true);
    
    try {
      let messageData = {
        sender: parentEmail,
        recipient: 'Admin',
        date: serverTimestamp(),
        read: false,
        urgent: false, // Add urgent flag for important messages
      };

      let hasFile = false;
      let messageContent = newMessage.trim();

      if (selectedFile) {
        console.log('Processing file:', selectedFile.name, selectedFile.type, selectedFile.size);
        hasFile = true;
        
        // Always use base64 for all files (same as admin system)
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
      

      
      setNewMessage('');
      setSelectedFile(null);
      const fileInput = document.getElementById('fileInput');
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert(`Error sending message: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Enhanced file selection with better size limits (same as admin system)
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log('File selected:', file.name, file.size, file.type);
    
    // Check file size (limit to 5MB for base64 storage - same as admin)
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

  // Mark message as read
  const markAsRead = async (messageId) => {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, { read: true });
      
      // Update local unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // Force notification bell to refresh by triggering a custom event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('messageRead', {
          detail: { messageId, userId: parentEmail }
        }));
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  // Render message
  const renderMessage = (msg) => {
    const isOwnMessage = msg.sender === parentEmail;
    const isAdminMessage = msg.sender === 'Admin';
    
    // Mark admin messages as read when viewed (not just when clicked)
    if (isAdminMessage && !msg.read) {
      // Use setTimeout to avoid blocking the render
      setTimeout(() => {
        markAsRead(msg.id);
      }, 100);
    }
    
    return (
      <div
        key={msg.id}
        id={`message-${msg.id}`}
        style={{
          display: 'flex',
          justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
          marginBottom: 20
        }}
      >
        <div
          style={{
            background: isOwnMessage 
              ? 'linear-gradient(135deg, #ff6b6b, #ff8e8e)' 
              : 'linear-gradient(135deg, #4ecdc4, #44a08d)',
            color: '#fff',
            borderRadius: isOwnMessage ? '25px 25px 5px 25px' : '25px 25px 25px 5px',
            padding: '15px 20px',
            maxWidth: '70%',
            boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
            fontSize: 16,
            position: 'relative',
            transform: isOwnMessage ? 'rotate(1deg)' : 'rotate(-1deg)',
            transition: 'transform 0.2s ease',
          }}
          onMouseOver={e => {
            e.currentTarget.style.transform = 'rotate(0deg) scale(1.02)';
          }}
          onMouseOut={e => {
            e.currentTarget.style.transform = isOwnMessage ? 'rotate(1deg) scale(1)' : 'rotate(-1deg) scale(1)';
          }}
        >
          <div style={{ 
            fontWeight: 'bold', 
            fontSize: 14, 
            marginBottom: 5,
            textShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}>
            {isOwnMessage ? '😊 You' : '👨‍💼 Admin'}
          </div>
          
          {/* Image preview */}
          {msg.fileType?.startsWith('image/') && (
            <div style={{ marginBottom: 10 }}>
              <img
                src={msg.fileUrl || msg.fileData}
                alt={msg.fileName}
                style={{
                  maxWidth: '200px',
                  maxHeight: '200px',
                  borderRadius: 15,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}
                onClick={() => window.open(msg.fileUrl || msg.fileData, '_blank')}
              />
            </div>
          )}
          
          {/* File download link */}
          {(msg.fileUrl || msg.fileData) && !msg.fileType?.startsWith('image/') && (
            <div style={{ marginBottom: 10 }}>
              <a
                href={msg.fileUrl || msg.fileData}
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
                  fontWeight: 'bold'
                }}
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

  return (
    <div style={{ 
      maxWidth: 800, 
      margin: '20px auto', 
      padding: 20,
      background: 'linear-gradient(135deg, #ffeaa7, #fab1a0)',
      borderRadius: 25,
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
      position: 'relative'
    }}>
      <h2 style={{ 
        textAlign: 'center', 
        color: '#2d3436',
        fontSize: 28,
        fontWeight: 'bold',
        textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
        marginBottom: 20
      }}>
        💬 Chat with Admin 💬
      </h2>

      {/* Search Bar */}
      <div style={{ 
        marginBottom: 20,
        position: 'relative'
      }}>
        <div className="form-control">
          <div className="input-group">
            <input
              type="text"
              placeholder="🔍 Search messages..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="input input-bordered flex-1"
              style={{
                fontSize: 16,
                fontWeight: '500'
              }}
            />
            <button 
              className="btn btn-square btn-primary"
              onClick={() => searchTerm && handleSearch(searchTerm)}
              aria-label="Search messages"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Search Results Dropdown */}
        {showSearch && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-300 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
            {searchResults.map(msg => (
              <div
                key={msg.id}
                onClick={() => scrollToMessage(msg.id)}
                className="p-3 border-b border-base-300 cursor-pointer hover:bg-base-200 transition-colors flex justify-between items-center"
              >
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm ${msg.sender === parentEmail ? 'text-primary' : 'text-secondary'}`}>
                    {msg.sender === parentEmail ? '😊 You' : '👨‍💼 Admin'}
                  </div>
                  <div className="text-sm text-base-content/70 truncate max-w-xs">
                    {(msg.fileUrl || msg.fileData) ? `📎 ${msg.fileName}` : msg.content}
                  </div>
                </div>
                <div className="text-xs text-base-content/50 italic flex-shrink-0">
                  {msg.date?.toDate ? msg.date.toDate().toLocaleTimeString() : ''}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results Message */}
        {showSearch && searchResults.length === 0 && searchTerm.trim() && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-300 rounded-lg shadow-xl z-50 p-6 text-center">
            <div className="text-base-content/70">
              <div className="text-2xl mb-2">🔍</div>
              <p className="text-sm">No messages found for "{searchTerm}" 😔</p>
            </div>
          </div>
        )}
      </div>
      
      <div
        ref={messagesContainerRef}
        style={{
          border: '3px solid #ff6b6b',
          padding: 25,
          height: 400,
          overflowY: 'auto',
          marginBottom: 20,
          background: 'linear-gradient(135deg, #dda0dd, #98d8c8)',
          borderRadius: 30,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 25px rgba(255,107,107,0.3)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
        className="hide-scrollbar"
      >
        {messages
          .sort((a, b) => (a.date?.seconds || 0) - (b.date?.seconds || 0))
          .map(renderMessage)}
        
        {/* Invisible div to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced File preview with base64 indicator */}
      {selectedFile && (
        <div style={{
          padding: 15,
          background: 'linear-gradient(135deg, #a8e6cf, #88d8c0)',
          borderRadius: 20,
          marginBottom: 15,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          border: '2px solid #4ecdc4'
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
              const fileInput = document.getElementById('fileInput');
              if (fileInput) fileInput.value = '';
            }}
            style={{
              background: '#ff6b6b',
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
      )}

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
          🔔 New message received from Admin!
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

      <form onSubmit={handleSend} style={{
        display: 'flex',
        gap: 10,
        alignItems: 'center',
        background: 'linear-gradient(135deg, #74b9ff, #0984e3)',
        borderRadius: 25,
        boxShadow: '0 6px 20px rgba(116,185,255,0.4)',
        padding: 8,
        border: '3px solid #0984e3'
      }}>
        <input
          type="text"
          placeholder="Message Admin!"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
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
          id="fileInput"
          type="file"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.txt"
          style={{ display: 'none' }}
        />
        
        <button
          type="button"
          onClick={() => document.getElementById('fileInput').click()}
          style={{
            padding: '12px 15px',
            borderRadius: 20,
            background: 'linear-gradient(135deg, #ffeaa7, #fdcb6e)',
            color: '#333',
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
          📎
        </button>
        
        <button
          type="submit"
          disabled={uploading || (!newMessage.trim() && !selectedFile)}
          style={{
            padding: '12px 25px',
            borderRadius: 20,
            background: (newMessage.trim() || selectedFile) && !uploading 
              ? 'linear-gradient(135deg, #00b894, #00a085)' 
              : 'linear-gradient(135deg, #ddd, #bbb)',
            color: '#fff',
            border: 'none',
            fontWeight: 'bold',
            fontSize: 16,
            cursor: (newMessage.trim() || selectedFile) && !uploading ? 'pointer' : 'not-allowed',
            boxShadow: (newMessage.trim() || selectedFile) && !uploading 
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
        </div>
  );
}