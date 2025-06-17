'use client';

//Ji, this is your admin messaging system. i didnt use component for admin system because i made  chat window and messaging list and made it both admin and parent dashboard call it. if you made any changes to other files, please add a comment that you did make changes so we dont get conflict when merging.

import { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const MessageSystem = () => {
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [reply, setReply] = useState('');
  const [adminEmail, setAdminEmail] = useState('');

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

  // Get unique parents
  const parents = Array.from(
    new Set(messages.filter(m => m.sender !== 'Admin').map(m => m.sender))
  );

  // Filter conversations by search
  const filteredParents = parents.filter(parent =>
    parent.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get conversation with selected parent
  const conversation = selectedParent
    ? messages.filter(
        m =>
          (m.sender === selectedParent && m.recipient === 'Admin') ||
          (m.sender === 'Admin' && m.recipient === selectedParent)
      )
    : [];

  // Mark all unread messages as read when opening a conversation
  useEffect(() => {
    if (selectedParent && conversation.length > 0) {
      conversation.forEach(async (msg) => {
        if (!msg.read && msg.recipient === 'Admin') {
          await updateDoc(doc(db, 'messages', msg.id), { read: true });
        }
      });
    }
    // eslint-disable-next-line
  }, [selectedParent, conversation.length]);

  // Send reply
  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() || !selectedParent) return;
    await addDoc(collection(db, 'messages'), {
      sender: 'Admin',
      recipient: selectedParent,
      content: reply,
      date: serverTimestamp(),
      read: false,
    });
    setReply('');
  };

  return (
    <div style={{ display: 'flex', height: 500 }}>
      {/* Sidebar: Parent List & Search */}
      <div style={{
  width: 260,
  borderRight: '1px solid #eee',
  padding: 16,
  background: '#fafbfc',
  boxShadow: '2px 0 8px #e5e5ea33',
  borderRadius: '18px 0 0 18px'
}}>
  <input
    type="text"
    placeholder="🔍 Search parents…"
    value={searchTerm}
    onChange={e => setSearchTerm(e.target.value)}
    style={{
      width: '100%',
      marginBottom: 18,
      padding: '12px 16px',
      borderRadius: 16,
      border: '1px solid #ddd',
      fontSize: 16,
      background: '#f7f7fa',
      outline: 'none',
      boxShadow: '0 1px 2px #e5e5ea33 inset',
      transition: 'border 0.2s'
    }}
  />
  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
    {filteredParents.map(parent => (
      <li
        key={parent}
        onClick={() => setSelectedParent(parent)}
        style={{
          position: 'relative', // for badge positioning
          padding: '12px 18px',
          marginBottom: 8,
          borderRadius: 14,
          background: selectedParent === parent ? '#d6f6ff' : '#fff',
          color: selectedParent === parent ? '#007aff' : '#222',
          fontWeight: selectedParent === parent ? 'bold' : 'normal',
          fontSize: 17,
          cursor: 'pointer',
          boxShadow: selectedParent === parent ? '0 2px 8px #007aff22' : '0 1px 2px #e5e5ea33',
          border: selectedParent === parent ? '1.5px solid #007aff' : '1px solid #eee',
          transition: 'all 0.18s',
        }}
        onMouseOver={e => {
          if (selectedParent !== parent) e.currentTarget.style.background = '#f0f8ff';
        }}
        onMouseOut={e => {
          if (selectedParent !== parent) e.currentTarget.style.background = '#fff';
        }}
      >
        {parent}
        {unreadCounts[parent] > 0 && (
          <span style={{
            position: 'absolute',
            right: 16,
            top: 10,
            background: 'red',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 8px',
            fontSize: 12,
            fontWeight: 'bold',
            minWidth: 20,
            textAlign: 'center',
            boxShadow: '0 1px 4px #0002'
          }}>
            {unreadCounts[parent]}
          </span>
        )}
      </li>
    ))}
  </ul>
</div>
      {/* Chat Area */}
      <div style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column' }}>
        {selectedParent ? (
          <>
            <h3>Chat with {selectedParent}</h3>
            <div
              style={{
                border: '1px solid #ccc',
                padding: 32,
                height: 600,
                overflowY: 'auto',
                marginBottom: 32,
                background: '#e5e5ea',
                borderRadius: 24,
                display: 'flex',
                flexDirection: 'column',
                width: '100%',
                maxWidth: 1600,
                margin: '0 auto',
              }}
            >
              {conversation
                .sort((a, b) => (a.date?.seconds || 0) - (b.date?.seconds || 0))
                .map((msg) => {
                  const isMe = msg.sender === 'Admin';
                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: 'flex',
                        justifyContent: isMe ? 'flex-end' : 'flex-start',
                        margin: '6px 0',
                      }}
                    >
                      <div
                        style={{
                          background: isMe ? '#007aff' : '#fff',
                          color: isMe ? '#fff' : '#222',
                          borderRadius: 20,
                          padding: '10px 16px',
                          maxWidth: '70%',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.07)',
                          fontSize: 16,
                          position: 'relative',
                        }}
                      >
                        <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 2 }}>
                          {isMe ? 'You' : msg.sender}
                        </div>
                        <div>{msg.content}</div>
                        <div style={{
                          fontSize: 11,
                          color: isMe ? '#d1eaff' : '#888',
                          marginTop: 4,
                          textAlign: 'right'
                        }}>
                          {msg.date?.toDate ? msg.date.toDate().toLocaleTimeString() : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            <form onSubmit={handleReply} style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              marginTop: 8,
              background: '#fff',
              borderRadius: 24,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              padding: 6,
            }}>
              <input
                type="text"
                value={reply}
                onChange={e => setReply(e.target.value)}
                placeholder="Type your message…"
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: 20,
                  border: 'none',
                  fontSize: 16,
                  outline: 'none',
                  background: '#f7f7fa',
                  color: '#222',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03) inset',
                  transition: 'background 0.2s',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '10px 22px',
                  borderRadius: 20,
                  background: reply.trim() ? '#007aff' : '#b0b0b0',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 'bold',
                  fontSize: 16,
                  cursor: reply.trim() ? 'pointer' : 'not-allowed',
                  boxShadow: reply.trim() ? '0 2px 8px #007aff33' : 'none',
                  transition: 'background 0.2s, box-shadow 0.2s',
                }}
                disabled={!reply.trim()}
                onMouseOver={e => {
                  if (reply.trim()) e.currentTarget.style.background = '#005ecb';
                }}
                onMouseOut={e => {
                  if (reply.trim()) e.currentTarget.style.background = '#007aff';
                }}
              >
                💬 Send
              </button>
            </form>
          </>
        ) : (
          <div style={{ color: '#888' }}>Select a parent to view chat history.</div>
        )}
      </div>
    </div>
  );
};

export default MessageSystem;