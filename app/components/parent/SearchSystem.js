'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy, where, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../firebase/auth-context';

const ParentSearchSystem = ({ className = '', onChildClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // Real data states
  const [children, setChildren] = useState([]);
  const [activities, setActivities] = useState([]);
  const [messages, setMessages] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  const router = useRouter();
  const { user } = useAuth();

  // Load real data from Firebase filtered for this parent
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);

        // Load children for this parent
        const childrenStrategies = [
          query(collection(db, 'children'), where('parentId', '==', user.uid)),
          query(collection(db, 'children'), where('parentEmail', '==', user.email))
        ];

        let allChildren = [];
        for (const childrenQuery of childrenStrategies) {
          try {
            const childrenSnapshot = await getDocs(childrenQuery);
            childrenSnapshot.forEach(doc => {
              const childData = { id: doc.id, ...doc.data() };
              if (!allChildren.find(c => c.id === childData.id)) {
                allChildren.push(childData);
              }
            });
          } catch (error) {
            console.warn('Strategy failed, trying next:', error);
          }
        }
        setChildren(allChildren);

        // If we have children, load their activities
        if (allChildren.length > 0) {
          const childIds = allChildren.map(child => child.id);
          
          // Load activities for all children of this parent
          const activitiesPromises = childIds.map(childId => 
            getDocs(query(
              collection(db, 'activities'),
              where('childId', '==', childId),
              orderBy('date', 'desc'),
              limit(20)
            ))
          );

          const activitiesResults = await Promise.allSettled(activitiesPromises);
          const activitiesData = [];
          
          activitiesResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              result.value.forEach(doc => {
                const activity = { id: doc.id, ...doc.data() };
                // Add child name for search context
                const child = allChildren.find(c => c.id === childIds[index]);
                if (child) {
                  activity.childName = `${child.firstName} ${child.lastName}`;
                }
                activitiesData.push(activity);
              });
            }
          });
          
          // Sort all activities by date
          activitiesData.sort((a, b) => {
            const dateA = a.date?.seconds ? new Date(a.date.seconds * 1000) : new Date(a.date);
            const dateB = b.date?.seconds ? new Date(b.date.seconds * 1000) : new Date(b.date);
            return dateB - dateA;
          });
          
          setActivities(activitiesData.slice(0, 50)); // Keep latest 50
        }

        // Load invoices for this parent
        const invoicesQuery = query(
          collection(db, 'invoices'),
          where('parentId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        
        try {
          const invoicesSnapshot = await getDocs(invoicesQuery);
          const invoicesData = [];
          invoicesSnapshot.forEach(doc => {
            invoicesData.push({ id: doc.id, ...doc.data() });
          });
          setInvoices(invoicesData);
        } catch (error) {
          console.warn('Could not load invoices:', error);
          // Try alternative query structure
          try {
            const altInvoicesQuery = query(
              collection(db, 'invoices'),
              where('userUID', '==', user.uid)
            );
            const altInvoicesSnapshot = await getDocs(altInvoicesQuery);
            const altInvoicesData = [];
            altInvoicesSnapshot.forEach(doc => {
              altInvoicesData.push({ id: doc.id, ...doc.data() });
            });
            setInvoices(altInvoicesData);
          } catch (altError) {
            console.warn('Alternative invoice query also failed:', altError);
          }
        }

        // Load schedules/events
        try {
          const scheduleQuery = query(
            collection(db, 'calendarEvents'),
            orderBy('start', 'desc'),
            limit(30)
          );
          const scheduleSnapshot = await getDocs(scheduleQuery);
          const scheduleData = [];
          scheduleSnapshot.forEach(doc => {
            scheduleData.push({ id: doc.id, ...doc.data() });
          });
          setSchedules(scheduleData);
        } catch (error) {
          console.warn('Could not load schedules:', error);
        }

        // Set up real-time listener for messages
        try {
          const messagesQuery = query(
            collection(db, 'messages'),
            orderBy('date', 'desc'),
            limit(30)
          );
          
          const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const messagesData = [];
            snapshot.forEach(doc => {
              const messageData = doc.data();
              // Filter messages involving this parent
              if ((messageData.sender === user.email && messageData.recipient === 'Admin') ||
                  (messageData.sender === 'Admin' && messageData.recipient === user.email)) {
                messagesData.push({ id: doc.id, ...messageData });
              }
            });
            setMessages(messagesData);
          });

          setLoading(false);
          
          // Return cleanup function
          return () => unsubscribe();
        } catch (error) {
          console.warn('Could not set up messages listener:', error);
          setLoading(false);
        }

      } catch (error) {
        console.error('Error loading parent search data:', error);
        setLoading(false);
      }
    };

    const cleanup = loadData();
    
    // Cleanup on unmount
    return () => {
      if (cleanup && typeof cleanup.then === 'function') {
        cleanup.then(unsubscribe => {
          if (unsubscribe) unsubscribe();
        });
      }
    };
  }, [user]);

  const searchParentData = (query) => {
    if (!query.trim()) return [];

    const results = [];
    const lowerQuery = query.toLowerCase();

    // Search children
    children.forEach(child => {
      const childName = `${child.firstName} ${child.lastName}`.toLowerCase();
      
      if (childName.includes(lowerQuery)) {
        const age = calculateAge(child.dateOfBirth);
        const activitiesCount = activities.filter(a => a.childId === child.id).length;
        
        results.push({
          type: 'child',
          id: child.id,
          title: `${child.firstName} ${child.lastName}`,
          subtitle: `Age: ${age} • ${activitiesCount} activities`,
          link: `/parent/manage-children`,
          icon: '👶',
          data: child,
          isChild: true
        });
      }
    });

    // Search activities
    activities.forEach(activity => {
      const activityTitle = (activity.title || activity.activityType || '').toLowerCase();
      const childName = (activity.childName || '').toLowerCase();
      const description = (activity.description || '').toLowerCase();
      
      if (activityTitle.includes(lowerQuery) ||
          childName.includes(lowerQuery) ||
          description.includes(lowerQuery)) {
        results.push({
          type: 'activity',
          id: activity.id,
          title: activity.title || activity.activityType || 'Activity',
          subtitle: `${activity.childName || 'Child'} • ${formatDate(activity.date)}`,
          link: `/parent`,
          icon: '🎨',
          data: activity
        });
      }
    });

    // Search messages
    messages.forEach(message => {
      const subject = (message.subject || '').toLowerCase();
      const content = (message.content || '').toLowerCase();
      
      if (subject.includes(lowerQuery) || content.includes(lowerQuery)) {
        const status = message.read ? 'read' : 'unread';
        results.push({
          type: 'message',
          id: message.id,
          title: message.subject || 'Message',
          subtitle: `${status} • ${formatDate(message.date)}`,
          link: `/parent/messages`,
          icon: '💬',
          data: message
        });
      }
    });

    // Search schedules
    schedules.forEach(schedule => {
      const title = (schedule.title || '').toLowerCase();
      const description = (schedule.description || '').toLowerCase();
      
      if (title.includes(lowerQuery) || description.includes(lowerQuery)) {
        const startDate = schedule.start ? new Date(schedule.start) : null;
        const dateStr = startDate ? startDate.toLocaleDateString() : 'No date';
        const timeStr = startDate ? startDate.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
        
        results.push({
          type: 'schedule',
          id: schedule.id,
          title: schedule.title || 'Event',
          subtitle: `${dateStr} ${timeStr}`,
          link: `/parent/schedules`,
          icon: '📅',
          data: schedule
        });
      }
    });

    // Search invoices
    invoices.forEach(invoice => {
      const invoiceTitle = (invoice.title || invoice.invoiceNo || '').toLowerCase();
      const status = (invoice.status || '').toLowerCase();
      
      if (invoiceTitle.includes(lowerQuery) || status.includes(lowerQuery)) {
        const amount = invoice.totalAmount || invoice.amount || 0;
        results.push({
          type: 'invoice',
          id: invoice.id,
          title: invoice.title || `Invoice #${invoice.invoiceNo}` || 'Invoice',
          subtitle: `$${amount.toFixed(2)} • ${invoice.status || 'pending'}`,
          link: `/parent/invoices`,
          icon: '💰',
          data: invoice
        });
      }
    });

    return results.slice(0, 8); // Limit to 8 results
  };

  // Helper functions
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'Unknown';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  const formatDate = (date) => {
    if (!date) return 'Unknown date';
    
    try {
      let dateObj;
      if (date.seconds) {
        // Firestore timestamp
        dateObj = new Date(date.seconds * 1000);
      } else if (typeof date === 'string') {
        dateObj = new Date(date);
      } else {
        dateObj = date;
      }
      
      return dateObj.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };

  const handleSearch = async (query) => {
    if (loading) return; // Don't search while data is loading
    
    setIsSearching(true);
    
    // Simulate API delay for better UX
    await new Promise(resolve => setTimeout(resolve, 150));
    
    const results = searchParentData(query);
    setSearchResults(results);
    setIsSearching(false);
    setShowResults(true);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim()) {
      handleSearch(value);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  };

  const handleKeyDown = (e) => {
    if (!showResults || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          const result = searchResults[selectedIndex];
          if (result.isChild && onChildClick) {
            onChildClick(result.data);
            setShowResults(false);
            setSearchQuery('');
          } else {
            router.push(result.link);
            setShowResults(false);
            setSearchQuery('');
          }
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        searchRef.current?.blur();
        break;
    }
  };

  const handleResultClick = (result) => {
    if (result.isChild && onChildClick) {
      onChildClick(result.data);
      setShowResults(false);
      setSearchQuery('');
    } else {
      router.push(result.link);
      setShowResults(false);
      setSearchQuery('');
    }
  };

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTypeColor = (type) => {
    switch (type) {
      case 'child': return 'bg-blue-100 text-blue-800';
      case 'activity': return 'bg-green-100 text-green-800';
      case 'message': return 'bg-purple-100 text-purple-800';
      case 'schedule': return 'bg-orange-100 text-orange-800';
      case 'invoice': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`relative ${className}`} ref={resultsRef}>
      <div className="form-control">
        <div className="input-group">
          <input
            ref={searchRef}
            type="text"
            placeholder={loading ? "Loading..." : "Search activities, messages, schedules..."}
            className="input input-bordered input-sm w-full focus:ring-2 focus:ring-secondary focus:border-secondary text-sm"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => searchQuery && setShowResults(true)}
            aria-label="Search parent dashboard"
            aria-expanded={showResults}
            aria-haspopup="listbox"
            role="combobox"
            aria-autocomplete="list"
            aria-describedby="parent-search-instructions"
            disabled={loading}
          />
          <button
            type="button"
            className="btn btn-square btn-sm btn-secondary"
            aria-label="Search"
            onClick={() => searchQuery && handleSearch(searchQuery)}
            disabled={loading || !searchQuery.trim()}
          >
            {isSearching || loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
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
            )}
          </button>
        </div>
      </div>

      {/* Hidden instructions for screen readers */}
      <div id="parent-search-instructions" className="sr-only">
        Use arrow keys to navigate results, Enter to select, Escape to close
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-300 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-6 text-center">
              <span className="loading loading-spinner loading-md"></span>
              <span className="ml-3 text-base">Searching...</span>
            </div>
          ) : searchResults.length > 0 ? (
            <ul role="listbox" className="py-3">
              {searchResults.map((result, index) => (
                <li key={`${result.type}-${result.id}`} role="option" aria-selected={index === selectedIndex}>
                  <button
                    className={`w-full text-left px-5 py-4 hover:bg-base-200 focus:bg-base-200 focus:outline-none transition-colors ${
                      index === selectedIndex ? 'bg-base-200' : ''
                    }`}
                    onClick={() => handleResultClick(result)}
                    onMouseEnter={() => setSelectedIndex(index)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xl" aria-hidden="true">{result.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-base truncate">{result.title}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTypeColor(result.type)}`}>
                            {result.type}
                          </span>
                        </div>
                        <p className="text-sm text-base-content/70 truncate">{result.subtitle}</p>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 text-center text-base-content/70">
              <div className="text-3xl mb-3">🔍</div>
              <p className="text-base mb-2">No results found for "{searchQuery}"</p>
              <p className="text-sm">Try searching for activities, messages, schedules, or invoices</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ParentSearchSystem; 