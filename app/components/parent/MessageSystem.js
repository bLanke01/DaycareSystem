import { useEffect, useState } from 'react';
import { db } from '../../../lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';

export default function ParentMessagesPage() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [parentName, setParentName] = useState('');
  const [nameInput, setNameInput] = useState('');

  // Prompt for name if not set
  const handleSetName = (e) => {
    e.preventDefault();
    if (nameInput.trim()) {
      setParentName(nameInput.trim());
    }
  };

  // Fetch messages for this parent (by name)
  useEffect(() => {
    if (!parentName) return;
    const q = query(collection(db, 'messages'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Only show messages between this parent and admin
        if (
          (data.sender === parentName && data.recipient === 'Admin') ||
          (data.sender === 'Admin' && data.recipient === parentName)
        ) {
          msgs.push({ id: doc.id, ...data });
        }
      });
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [parentName]);

  // Mark all unread messages sent to this parent as read
  useEffect(() => {
    if (!parentName) return;
    messages.forEach(async (msg) => {
      if (!msg.read && msg.recipient === parentName) {
        await updateDoc(doc(db, 'messages', msg.id), { read: true });
      }
    });
  }, [messages, parentName]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !parentName) return;
    try {
      await addDoc(collection(db, 'messages'), {
        sender: parentName,
        recipient: 'Admin',
        content: newMessage,
        date: serverTimestamp(),
        read: false,
      });
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (!parentName) {
    return (
      <div style={{ maxWidth: 400, margin: '0 auto', padding: 32 }}>
        <h2>Enter Your Name or Email</h2>
        <form onSubmit={handleSetName} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Your name or email"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            style={{ flex: 1, padding: 8 }}
          />
          <button type="submit" style={{ padding: '8px 16px' }}>Continue</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
      <h2>Message Admin</h2>
      <div
        style={{
          border: '1px solid #ccc',
          padding: 16,
          height: 300,
          overflowY: 'auto',
          marginBottom: 16,
          background: '#e5e5ea',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages
          .sort((a, b) => (a.date?.seconds || 0) - (b.date?.seconds || 0))
          .map((msg) => {
            const isMe = msg.sender === parentName;
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