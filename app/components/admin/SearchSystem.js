'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy, where, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/config';

const SearchSystem = ({ className = '', onChildClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  // Real data states
  const [children, setChildren] = useState([]);
  const [activities, setActivities] = useState([]);
  const [messages, setMessages] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  const router = useRouter();

  // Load real data from Firebase
  useEffect(() => {
    let unsubscribeMessages = null;
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);

        // Load children
        const childrenQuery = query(collection(db, 'children'), orderBy('firstName'));
        const childrenSnapshot = await getDocs(childrenQuery);
        const childrenData = [];
        childrenSnapshot.forEach(doc => {
          childrenData.push({ id: doc.id, ...doc.data() });
        });
        if (isMounted) setChildren(childrenData);

        // Load recent activities (last 50)
        const activitiesQuery = query(
          collection(db, 'activities'), 
          orderBy('date', 'desc'), 
          limit(50)
        );
        const activitiesSnapshot = await getDocs(activitiesQuery);
        const activitiesData = [];
        activitiesSnapshot.forEach(doc => {
          activitiesData.push({ id: doc.id, ...doc.data() });
        });
        if (isMounted) setActivities(activitiesData);

        // Load staff/admin users
        const staffQuery = query(
          collection(db, 'users'), 
          where('role', '==', 'admin')
        );
        const staffSnapshot = await getDocs(staffQuery);
        const staffData = [];
        staffSnapshot.forEach(doc => {
          staffData.push({ id: doc.id, ...doc.data() });
        });
        if (isMounted) setStaff(staffData);

        // Set up real-time listener for messages
        const messagesQuery = query(
          collection(db, 'messages'), 
          orderBy('date', 'desc'), 
          limit(30)
        );
        
        unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
          if (!isMounted) return;
          const messagesData = [];
          snapshot.forEach(doc => {
            messagesData.push({ id: doc.id, ...doc.data() });
          });
          setMessages(messagesData);
        }, (error) => {
          console.error('Error fetching messages:', error);
          if (isMounted) setMessages([]);
        });

        if (isMounted) setLoading(false);
      } catch (error) {
        console.error('Error loading search data:', error);
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (unsubscribeMessages) {
        unsubscribeMessages();
      }
    };
  }, []);

  const searchAcrossData = (query) => {
    if (!query.trim()) return [];

    const results = [];
    const lowerQuery = query.toLowerCase();

    // Search children
    children.forEach(child => {
      const childName = `${child.firstName} ${child.lastName}`.toLowerCase();
      const parentName = `${child.parentFirstName} ${child.parentLastName}`.toLowerCase();
      const parentEmail = (child.parentEmail || '').toLowerCase();
      
      if (childName.includes(lowerQuery) || 
          parentName.includes(lowerQuery) ||
          parentEmail.includes(lowerQuery)) {
        results.push({
          type: 'child',
          id: child.id,
          title: `${child.firstName} ${child.lastName}`,
          subtitle: `Parent: ${child.parentFirstName} ${child.parentLastName} • Age: ${calculateAge(child.dateOfBirth)}`,
          link: `/admin/children`,
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
          subtitle: `${activity.childName || 'Unknown Child'} • ${formatDate(activity.date)}`,
          link: `/admin/activity-log`,
          icon: '🎨',
          data: activity
        });
      }
    });

    // Search messages
    messages.forEach(message => {
      const sender = (message.sender || '').toLowerCase();
      const subject = (message.subject || '').toLowerCase();
      const content = (message.content || '').toLowerCase();
      
      if (sender.includes(lowerQuery) ||
          subject.includes(lowerQuery) ||
          content.includes(lowerQuery)) {
        results.push({
          type: 'message',
          id: message.id,
          title: message.subject || 'Message',
          subtitle: `From: ${message.sender || 'Unknown'} • ${formatDate(message.date)}`,
          link: `/admin/messages`,
          icon: '💬',
          data: message
        });
      }
    });

    // Search staff
    staff.forEach(staffMember => {
      const name = `${staffMember.firstName} ${staffMember.lastName}`.toLowerCase();
      const email = (staffMember.email || '').toLowerCase();
      const position = (staffMember.position || '').toLowerCase();
      
      if (name.includes(lowerQuery) ||
          email.includes(lowerQuery) ||
          position.includes(lowerQuery)) {
        results.push({
          type: 'staff',
          id: staffMember.id,
          title: `${staffMember.firstName} ${staffMember.lastName}`,
          subtitle: `${staffMember.position || 'Staff'} • ${staffMember.email}`,
          link: `/admin/settings`,
          icon: '👩‍🏫',
          data: staffMember
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
      // Handle different date formats
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
    
    const results = searchAcrossData(query);
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
              case 'child': return 'bg-primary/20 text-primary-content';
        case 'activity': return 'bg-success/20 text-success-content';
        case 'message': return 'bg-secondary/20 text-secondary-content';
        case 'staff': return 'bg-warning/20 text-warning-content';
              default: return 'bg-base-200 text-base-content';
    }
  };

  return (
    <div className={`relative ${className}`} ref={resultsRef}>
      <div className="form-control">
        <div className="input-group">
          <input
            ref={searchRef}
            type="text"
            placeholder={loading ? "Loading..." : "Search children, activities, messages..."}
            className="input input-bordered input-sm w-full focus:ring-2 focus:ring-primary focus:border-primary text-sm"
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => searchQuery && setShowResults(true)}
            aria-label="Search admin dashboard"
            aria-expanded={showResults}
            aria-haspopup="listbox"
            role="combobox"
            aria-autocomplete="list"
            aria-describedby="search-instructions"
            disabled={loading}
          />
          <button
            type="button"
            className="btn btn-square btn-sm btn-primary"
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
      <div id="search-instructions" className="sr-only">
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
              <p className="text-sm">Try searching for children, activities, messages, or staff</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSystem; 