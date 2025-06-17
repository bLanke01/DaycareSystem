//Ji, i didnt use component for message system on this part but i put yours here and linked it to the admin/parent/message like you did so you can continue working here for your part. for notifications, theres already a js file you can use in here so please check if you need it. they are made so you are able to send notifications through emails if they marked "check" on email notications.

import { useEffect, useState } from 'react';
import { db } from '../../firebase/config';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export default function ParentMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [parentEmail, setParentEmail] = useState('');

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
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (
          (data.sender === parentEmail && data.recipient === 'Admin') ||
          (data.sender === 'Admin' && data.recipient === parentEmail)
        ) {
          msgs.push({ id: doc.id, ...data });
        }
      });
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [parentEmail]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !parentEmail) return;
    await addDoc(collection(db, 'messages'), {
      sender: parentEmail,
      recipient: 'Admin',
      content: newMessage,
      date: serverTimestamp(),
      read: false,
    });
    setNewMessage('');
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <h2>Message Admin</h2>
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
        {messages
          .sort((a, b) => (a.date?.seconds || 0) - (b.date?.seconds || 0))
          .map((msg) => {
            const isMe = msg.sender === parentEmail;
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
                    {isMe ? 'You' : 'Admin'}
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
      <form onSubmit={handleSend} style={{
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
    placeholder="Type your message…"
    value={newMessage}
    onChange={e => setNewMessage(e.target.value)}
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
      width: '100%',
    }}
  />
  <button
    type="submit"
    style={{
      padding: '10px 22px',
      borderRadius: 20,
      background: newMessage.trim() ? '#007aff' : '#b0b0b0',
      color: '#fff',
      border: 'none',
      fontWeight: 'bold',
      fontSize: 16,
      cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
      boxShadow: newMessage.trim() ? '0 2px 8px #007aff33' : 'none',
      transition: 'background 0.2s, box-shadow 0.2s',
    }}
    disabled={!newMessage.trim()}
    onMouseOver={e => {
      if (newMessage.trim()) e.currentTarget.style.background = '#005ecb';
    }}
    onMouseOut={e => {
      if (newMessage.trim()) e.currentTarget.style.background = '#007aff';
    }}
  >
    💬 Send
  </button>
</form>
    </div>
  );
}