'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Contact() {
  // Get current date for the calendar
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // State for form data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: '',
    phone: ''
  });

  // State for form submission
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate form submission
    setTimeout(() => {
      console.log('Form submitted:', formData);
      setIsSubmitted(true);
      setIsLoading(false);
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        subject: '',
        message: '',
        phone: ''
      });
    }, 2000);
  };
  
  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    
    const calendarDays = [];
    
    // Add empty cells for days before the first of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }
    
    return calendarDays;
  };

  const calendarDays = generateCalendarDays();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <div className="hero min-h-[50vh] bg-gradient-to-r from-primary/20 to-secondary/15">
        <div className="hero-content text-center">
          <div className="max-w-4xl">
            <h1 className="text-6xl font-bold text-primary mb-6">
              Let's Connect! 
              <span className="text-4xl ml-2">📞💕</span>
            </h1>
            <p className="text-2xl text-base-content leading-relaxed">
              Book a tour with your kids and see why families love TinyLog daycare! 
              We're excited to show you around our center and answer all your questions.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">
            
            {/* Contact Form */}
            <div className="card bg-white shadow-2xl">
              <div className="card-body p-8">
                <div className="flex items-center mb-6">
                  <span className="text-3xl mr-3">📝</span>
                  <h2 className="text-3xl font-bold text-primary">Get in Touch</h2>
                </div>
                
                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎉</div>
                    <h3 className="text-2xl font-bold text-success mb-4">Thank You!</h3>
                    <p className="text-lg text-base-content mb-6">
                      We've received your message and will get back to you within 24 hours!
                    </p>
                    <button 
                      onClick={() => setIsSubmitted(false)}
                      className="btn btn-primary"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-lg font-medium">👤 Full Name</span>
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="input input-bordered input-lg focus:input-primary"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-lg font-medium">📧 Email Address</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="input input-bordered input-lg focus:input-primary"
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-lg font-medium">📋 Subject</span>
                      </label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="select select-bordered select-lg focus:select-primary"
                        required
                      >
                        <option value="">What can we help you with?</option>
                        <option value="tour">🏠 Facility Tour</option>
                        <option value="enrollment">📝 Enrollment Information</option>
                        <option value="program">📚 Program Details</option>
                        <option value="pricing">💰 Pricing & Fees</option>
                        <option value="other">❓ Other Questions</option>
                      </select>
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-lg font-medium">💬 Your Message</span>
                      </label>
                      <textarea
                        name="message"
                        rows="4"
                        value={formData.message}
                        onChange={handleChange}
                        className="textarea textarea-bordered textarea-lg focus:textarea-primary resize-none"
                        placeholder="Tell us about your child's needs, preferred start date, or any questions you have..."
                      ></textarea>
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-lg font-medium">📱 Phone Number</span>
                      </label>
                      <div className="join">
                        <span className="join-item bg-base-200 px-4 py-3 text-lg font-medium">+1</span>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="input input-bordered input-lg join-item flex-1 focus:input-primary"
                          placeholder="(403) 542-5531"
                        />
                      </div>
                    </div>
                    
                    <button 
                      type="submit" 
                      className={`btn btn-primary btn-lg w-full text-lg ${isLoading ? 'loading' : ''}`}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <span className="loading loading-spinner"></span>
                          Sending Message...
                        </>
                      ) : (
                        <>
                          <span className="text-xl mr-2">🚀</span>
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
            
            {/* Calendar & Info */}
            <div className="space-y-8">
              
              {/* Interactive Calendar */}
              <div className="card bg-white shadow-2xl">
                <div className="card-body p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <span className="text-3xl mr-3">📅</span>
                      <h3 className="text-2xl font-bold text-primary">Available Tour Times</h3>
                    </div>
                    <div className="badge badge-success badge-lg">
                      <span className="mr-1">✨</span>
                      Book Today!
                    </div>
                  </div>
                  
                  <div className="text-center mb-6">
                    <h4 className="text-xl font-bold text-secondary">
                      {monthNames[currentMonth]} {currentYear}
                    </h4>
                  </div>
                  
                  {/* Calendar Weekdays */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                      <div key={day} className="text-center font-bold text-base-content/70 p-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, index) => (
                      <button 
                        key={index} 
                        className={`
                          aspect-square p-2 rounded-lg text-center transition-all duration-200
                          ${!day ? 'invisible' : ''}
                          ${day === today.getDate() ? 'bg-primary text-white font-bold' : 'hover:bg-base-200'}
                          ${day && day !== today.getDate() ? 'bg-base-100 hover:bg-primary hover:text-white' : ''}
                        `}
                        disabled={!day}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-6 p-4 bg-info/10 rounded-lg">
                    <p className="text-sm text-center text-base-content/90">
                      <span className="font-semibold">Tour Hours:</span> Monday-Friday 9:00 AM - 4:00 PM
                      <br />
                      <span className="font-semibold">Duration:</span> 30-45 minutes
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="card bg-gradient-to-br from-base-200 to-accent/10 shadow-xl">
                <div className="card-body p-8">
                  <div className="flex items-center mb-6">
                    <span className="text-3xl mr-3">📍</span>
                    <h3 className="text-2xl font-bold text-primary">Visit TinyLog</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">🏠</span>
                      <div>
                        <p className="font-semibold text-lg">Address</p>
                        <p className="text-base-content">21 Everdige Court SW<br />Calgary, Alberta</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl">👩‍💼</span>
                      <div>
                        <p className="font-semibold text-lg">Owner & Director</p>
                        <p className="text-base-content">Francesca Kella</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📞</span>
                      <div>
                        <p className="font-semibold text-lg">Call Us</p>
                        <a href="tel:+14035425531" className="text-primary hover:underline">
                          (403) 542-5531
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">📧</span>
                      <div>
                        <p className="font-semibold text-lg">Email Us</p>
                        <a href="mailto:cleanworld2661@gmail.com" className="text-primary hover:underline break-all text-sm">
                          cleanworld2661@gmail.com
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🕐</span>
                      <div>
                        <p className="font-semibold text-lg">Hours</p>
                        <p className="text-base-content/90 text-sm">
                          Monday - Friday: 7:00 AM - 6:00 PM<br />
                          Saturday - Sunday: Closed
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <Link href="/location">
                      <button className="btn btn-secondary btn-block">
                        <span className="text-xl mr-2">🗺️</span>
                        Get Directions
                      </button>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card bg-gradient-to-br from-base-300 to-primary/10 shadow-xl">
                <div className="card-body p-8">
                  <h3 className="text-xl font-bold text-primary mb-4 text-center">
                    <span className="text-2xl mr-2">⚡</span>
                    Quick Actions
                  </h3>
                  
                  <div className="space-y-3">
                    <Link href="/auth/signup">
                      <button className="btn btn-accent btn-block">
                        <span className="text-xl mr-2">📝</span>
                        Start Enrollment
                      </button>
                    </Link>
                    
                    <Link href="/program">
                      <button className="btn btn-outline btn-block">
                        <span className="text-xl mr-2">📚</span>
                        View Programs
                      </button>
                    </Link>
                    
                    <Link href="/faq">
                      <button className="btn btn-ghost btn-block">
                        <span className="text-xl mr-2">❓</span>
                        Common Questions
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-16 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Can't Wait to Meet You! <span className="text-3xl">🤗</span>
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Francesca and our team are standing by to answer your questions and schedule your visit. 
            Let's start this exciting journey together!
          </p>
          <div className="flex gap-6 justify-center flex-wrap">
            <a href="tel:+14035425531" className="btn btn-accent btn-lg">
              <span className="text-xl mr-2">📞</span>
              Call (403) 542-5531
            </a>
            <a href="mailto:cleanworld2661@gmail.com" className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-primary">
              <span className="text-xl mr-2">📧</span>
              Send Email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}