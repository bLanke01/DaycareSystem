// app/parent/page.js

export default function ParentDashboard() {
    return (
      <div className="child-profile-container">
        <h1>Child Profile</h1>
        
        <div className="profile-cards">
          <div className="child-card">
            <div className="child-photo">
              {/* Child photo placeholder */}
              <div className="photo-placeholder">👶</div>
            </div>
            <div className="child-info">
              <h2>Emma Thompson</h2>
              <p>Age: 4 years</p>
              <p>Group: Pre-K</p>
              <p>Enrollment Date: January 15, 2025</p>
              <p>Parent/Guardian: Sarah Thompson</p>
            </div>
          </div>
          
          <div className="emergency-contact-card">
            <h2>Emergency Contacts</h2>
            <div className="contact">
              <h3>Primary Contact</h3>
              <p>Sarah Thompson (Mother)</p>
              <p>Phone: (403) 555-1234</p>
              <p>Email: sarah.thompson@example.com</p>
            </div>
            <div className="contact">
              <h3>Secondary Contact</h3>
              <p>Michael Thompson (Father)</p>
              <p>Phone: (403) 555-5678</p>
              <p>Email: michael.thompson@example.com</p>
            </div>
          </div>
        </div>
        
        <div className="child-details">
          <div className="medical-info">
            <h2>Medical Information</h2>
            <div className="info-item">
              <span className="info-label">Allergies:</span>
              <span className="info-value">None</span>
            </div>
            <div className="info-item">
              <span className="info-label">Medical Conditions:</span>
              <span className="info-value">None</span>
            </div>
            <div className="info-item">
              <span className="info-label">Medications:</span>
              <span className="info-value">None</span>
            </div>
            <div className="info-item">
              <span className="info-label">Doctor Name:</span>
              <span className="info-value">Dr. Johnson</span>
            </div>
            <div className="info-item">
              <span className="info-label">Doctor Phone:</span>
              <span className="info-value">(403) 555-9876</span>
            </div>
          </div>
          
          <div className="dietary-info">
            <h2>Dietary Preferences</h2>
            <div className="info-item">
              <span className="info-label">Food Allergies:</span>
              <span className="info-value">None</span>
            </div>
            <div className="info-item">
              <span className="info-label">Dietary Restrictions:</span>
              <span className="info-value">None</span>
            </div>
            <div className="info-item">
              <span className="info-label">Favorite Foods:</span>
              <span className="info-value">Strawberries, pasta, chicken nuggets</span>
            </div>
            <div className="info-item">
              <span className="info-label">Disliked Foods:</span>
              <span className="info-value">Brussels sprouts, fish</span>
            </div>
          </div>
        </div>
        
        <div className="recent-activity">
          <h2>Recent Activity</h2>
          <div className="activity-timeline">
            <div className="activity-item">
              <div className="activity-date">May 5, 2025</div>
              <div className="activity-details">
                <p className="activity-title">Art Project: Spring Flowers</p>
                <p className="activity-description">Emma created a beautiful watercolor painting of spring flowers and was proud to show it to everyone.</p>
              </div>
            </div>
            
            <div className="activity-item">
              <div className="activity-date">May 4, 2025</div>
              <div className="activity-details">
                <p className="activity-title">Music Class</p>
                <p className="activity-description">Emma enjoyed playing the xylophone and singing along with the group during music time.</p>
              </div>
            </div>
            
            <div className="activity-item">
              <div className="activity-date">May 3, 2025</div>
              <div className="activity-details">
                <p className="activity-title">Story Time: The Little Prince</p>
                <p className="activity-description">Emma was very engaged during story time and asked thoughtful questions about the characters.</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="upcoming-events">
          <h2>Upcoming Events</h2>
          <div className="event-list">
            <div className="event-item">
              <div className="event-date">May 10, 2025</div>
              <div className="event-details">
                <p className="event-title">Parent-Teacher Conference</p>
                <p className="event-time">4:00 PM - 4:30 PM</p>
              </div>
            </div>
            
            <div className="event-item">
              <div className="event-date">May 15, 2025</div>
              <div className="event-details">
                <p className="event-title">Spring Concert</p>
                <p className="event-time">2:00 PM - 3:30 PM</p>
              </div>
            </div>
            
            <div className="event-item">
              <div className="event-date">May 20, 2025</div>
              <div className="event-details">
                <p className="event-title">Field Trip to the Zoo</p>
                <p className="event-time">9:00 AM - 2:00 PM</p>
                <p className="event-note">Permission slip required</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }