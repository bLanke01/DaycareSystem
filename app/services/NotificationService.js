// app/services/NotificationService.js
'use client';

import { collection, query, where, orderBy, limit, onSnapshot, Timestamp, doc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';

class NotificationService {
  constructor() {
    this.listeners = new Map();
    this.unsubscribers = new Map();
  }

  // Get unread message notifications
  async getUnreadMessageCount(userId, callback) {
    try {
      // Get user's email to determine if they're admin or parent
      const userDoc = await getDocs(collection(db, 'users'));
      let userEmail = null;
      let isAdmin = false;
      
      userDoc.forEach(doc => {
        if (doc.id === userId) {
          userEmail = doc.data().email;
          isAdmin = doc.data().role === 'admin';
        }
      });

      if (!userEmail) {
        callback(0);
        return () => {};
      }

      let messagesQuery;
      
      if (isAdmin) {
        // For admin users, get messages where recipient is 'Admin' and not read
        messagesQuery = query(
          collection(db, 'messages'),
          where('recipient', '==', 'Admin'),
          where('read', '==', false)
        );
      } else {
        // For parent users, get messages where sender is 'Admin' and recipient is parent email and not read
        messagesQuery = query(
          collection(db, 'messages'),
          where('sender', '==', 'Admin'),
          where('recipient', '==', userEmail),
          where('read', '==', false)
        );
      }

      const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const count = snapshot.size;
        callback(count);
      }, (error) => {
        console.error('Error in message count listener:', error);
        callback(0);
      });

      this.unsubscribers.set(`messages_${userId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      callback(0);
      return () => {};
    }
  }

  // Get upcoming event notifications
  async getUpcomingEventCount(callback) {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const eventsQuery = query(
        collection(db, 'events'),
        where('date', '>=', Timestamp.fromDate(now)),
        where('date', '<=', Timestamp.fromDate(tomorrow)),
        orderBy('date', 'asc') // Now works with the composite index
      );

      const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
        const count = snapshot.size;
        callback(count);
      }, (error) => {
        console.error('Error in event count listener:', error);
        callback(0);
      });

      this.unsubscribers.set('events', unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error getting upcoming event count:', error);
      callback(0);
      return () => {};
    }
  }

  // Get all notifications for a user
  async getAllNotifications(userId, callback) {
    try {
      // Get user's email to determine if they're admin or parent
      const userDoc = await getDocs(collection(db, 'users'));
      let userEmail = null;
      let isAdmin = false;
      
      userDoc.forEach(doc => {
        if (doc.id === userId) {
          userEmail = doc.data().email;
          isAdmin = doc.data().role === 'admin';
        }
      });

      if (!userEmail) {
        callback([]);
        return () => {};
      }

      let messagesQuery;
      
      if (isAdmin) {
        // For admin users, get messages where recipient is 'Admin' and not read
        messagesQuery = query(
          collection(db, 'messages'),
          where('recipient', '==', 'Admin'),
          where('read', '==', false),
          limit(5)
        );
      } else {
        // For parent users, get messages where sender is 'Admin' and recipient is parent email and not read
        messagesQuery = query(
          collection(db, 'messages'),
          where('sender', '==', 'Admin'),
          where('recipient', '==', userEmail),
          where('read', '==', false),
          limit(5)
        );
      }

      // Get upcoming events
      const now = new Date();
      const eventsQuery = query(
        collection(db, 'events'),
        where('date', '>=', Timestamp.fromDate(now)),
        limit(5)
      );

      let unsubscribeMessages;
      let unsubscribeEvents;

      // Set up messages listener
      unsubscribeMessages = onSnapshot(messagesQuery, (messagesSnapshot) => {
        const messages = messagesSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'message',
          title: isAdmin ? 'New Message from Parent' : 'New Message from Admin',
          message: isAdmin ? `You have a new message from ${doc.data().sender}` : 'You have a new message from Admin',
          timestamp: doc.data().date,
          read: doc.data().read || false
        }));

        // Sort messages by timestamp (newest first) and limit to 5
        const sortedMessages = messages
          .sort((a, b) => {
            const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
            const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
            return bTime - aTime;
          })
          .slice(0, 5);

        // Combine messages and events for the callback
        const allNotifications = [...sortedMessages];
        callback(allNotifications);
      }, (error) => {
        console.error('Error in messages listener:', error);
        callback([]);
      });

      // Set up events listener
      unsubscribeEvents = onSnapshot(eventsQuery, (eventsSnapshot) => {
        const events = eventsSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'event',
          title: 'Upcoming Event',
          message: `${doc.data().title} is coming up soon`,
          timestamp: doc.data().date,
          read: false
        }));

        // Sort events by date (earliest first) and limit to 5
        const sortedEvents = events
          .sort((a, b) => {
            const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
            const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
            return aTime - bTime;
          })
          .slice(0, 5);

        // Get current messages to combine with events
        // Use onSnapshot instead of .get() method
        const messagesUnsubscribe = onSnapshot(messagesQuery, (messagesSnapshot) => {
          const messages = messagesSnapshot.docs.map(doc => ({
            id: doc.id,
            type: 'message',
            title: isAdmin ? 'New Message from Parent' : 'New Message from Admin',
            message: isAdmin ? `You have a new message from ${doc.data().sender}` : 'You have a new message from Admin',
            timestamp: doc.data().date,
            read: doc.data().read || false
          }));

          // Sort messages by timestamp (newest first) and limit to 5
          const sortedMessages = messages
            .sort((a, b) => {
              const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
              const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
              return bTime - aTime;
            })
            .slice(0, 5);

          const allNotifications = [...sortedMessages, ...sortedEvents];
          callback(allNotifications);
        });

        // Return cleanup function for messages
        return () => {
          if (messagesUnsubscribe) messagesUnsubscribe();
        };
      }, (error) => {
        console.error('Error in events listener:', error);
        // Still return messages even if events fail
        const messagesUnsubscribe = onSnapshot(messagesQuery, (messagesSnapshot) => {
          const messages = messagesSnapshot.docs.map(doc => ({
            id: doc.id,
            type: 'message',
            title: isAdmin ? 'New Message from Parent' : 'New Message from Admin',
            message: isAdmin ? `You have a new message from ${doc.data().sender}` : 'You have a new message from Admin',
            timestamp: doc.data().date,
            read: doc.data().read || false
          }));

          // Sort messages by timestamp (newest first) and limit to 5
          const sortedMessages = messages
            .sort((a, b) => {
              const aTime = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
              const bTime = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
              return bTime - aTime;
            })
            .slice(0, 5);

          callback(sortedMessages);
        });

        // Return cleanup function for messages
        return () => {
          if (messagesUnsubscribe) messagesUnsubscribe();
        };
      });

      // Return cleanup function
      return () => {
        if (unsubscribeMessages) unsubscribeMessages();
        if (unsubscribeEvents) unsubscribeEvents();
      };
    } catch (error) {
      console.error('Error getting all notifications:', error);
      callback([]);
      return () => {};
    }
  }

  // Mark a specific message as read
  async markMessageAsRead(messageId) {
    try {
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, { read: true });
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }

  // Mark all messages as read for a user
  async markAllMessagesAsRead(userId) {
    try {
      // Get user's email to determine if they're admin or parent
      const userDoc = await getDocs(collection(db, 'users'));
      let userEmail = null;
      let isAdmin = false;
      
      userDoc.forEach(doc => {
        if (doc.id === userId) {
          userEmail = doc.data().email;
          isAdmin = doc.data().role === 'admin';
        }
      });

      if (!userEmail) {
        return false;
      }

      let messagesQuery;
      
      if (isAdmin) {
        // For admin users, get messages where recipient is 'Admin' and not read
        messagesQuery = query(
          collection(db, 'messages'),
          where('recipient', '==', 'Admin'),
          where('read', '==', false)
        );
      } else {
        // For parent users, get messages where sender is 'Admin' and recipient is parent email and not read
        messagesQuery = query(
          collection(db, 'messages'),
          where('sender', '==', 'Admin'),
          where('recipient', '==', userEmail),
          where('read', '==', false)
        );
      }

      const snapshot = await getDocs(messagesQuery);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
      });
      
      await batch.commit();
      return true;
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      return false;
    }
  }

  // Cleanup listeners
  cleanup() {
    this.unsubscribers.forEach(unsubscribe => {
      if (unsubscribe) unsubscribe();
    });
    this.unsubscribers.clear();
  }
}

export default new NotificationService();
