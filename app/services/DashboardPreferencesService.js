// services/DashboardPreferencesService.js - Manages dashboard display preferences
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

class DashboardPreferencesService {
  // Get user's dashboard preferences
  static async getUserPreferences(userId) {
    try {
      const userSettingsRef = doc(db, 'parentSettings', userId);
      const userSettingsDoc = await getDoc(userSettingsRef);
      
      if (userSettingsDoc.exists()) {
        return userSettingsDoc.data().dashboardPreferences || this.getDefaultPreferences();
      }
      
      // Return default preferences if no settings exist
      return this.getDefaultPreferences();
    } catch (error) {
      console.error('Error loading dashboard preferences:', error);
      return this.getDefaultPreferences();
    }
  }

  // Get default preferences
  static getDefaultPreferences() {
    return {
      todayActivities: true,
      mealReports: true,
      napTimes: true,
      attendanceStatus: true,
      weeklySummary: false,
      upcomingEvents: false
    };
  }

  // Check if specific content should be displayed
  static shouldShowContent(preferences, contentType) {
    if (!preferences) return true; // Show everything if no preferences set
    
    switch (contentType) {
      case 'todayActivities':
        return preferences.todayActivities !== false;
      case 'mealReports':
        return preferences.mealReports !== false;
      case 'napTimes':
        return preferences.napTimes !== false;
      case 'attendanceStatus':
        return preferences.attendanceStatus !== false;
      case 'weeklySummary':
        return preferences.weeklySummary === true;
      case 'upcomingEvents':
        return preferences.upcomingEvents === true;
      default:
        return true; // Show unknown content types by default
    }
  }

  // Filter content based on preferences
  static filterContentByPreferences(content, preferences, contentType) {
    if (this.shouldShowContent(preferences, contentType)) {
      return content;
    }
    return null; // Return null if content should be hidden
  }

  // Save user preferences
  static async saveUserPreferences(userId, preferences) {
    try {
      const userSettingsRef = doc(db, 'parentSettings', userId);
      await setDoc(userSettingsRef, {
        dashboardPreferences: preferences,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      return true;
    } catch (error) {
      console.error('Error saving dashboard preferences:', error);
      return false;
    }
  }
}

export default DashboardPreferencesService;
