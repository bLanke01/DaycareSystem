'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Contact() {
  // State for form data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: '',
    phone: '',
    childAge: '',
    numberOfChildren: '',
    notes: ''
  });

  // State for form submission
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // State for booking system
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showTimeSlotsModal, setShowTimeSlotsModal] = useState(false);
  
  // Get current date for the calendar
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
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
    
    try {
      const response = await fetch('https://formspree.io/f/xpwlbobp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Email Subject (Formspree will use this as the email subject)
          '_subject': `General Inquiry - ${formData.fullName} - ${formData.subject}`,
          
          // Contact Information
          '👤 Full Name': formData.fullName,
          '📧 Email Address': formData.email,
          '📱 Phone Number': formData.phone,
          
          // Message Details
          '📝 Subject': formData.subject,
          '💬 Message': formData.message,
          
          // Form Metadata
          '📋 Form Type': 'Contact Form',
          '📧 Submission Time': new Date().toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
          })
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        // Reset form
        setFormData({
          fullName: '',
          email: '',
          subject: '',
          message: '',
          phone: '',
          childAge: '',
          numberOfChildren: '',
          notes: ''
        });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Sorry, there was an error sending your message. Please try again or contact us directly.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tour booking
  const handleTourBooking = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const response = await fetch('https://formspree.io/f/xpwlbobp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Email Subject (Formspree will use this as the email subject)
          '_subject': `Tour Booking Request - ${formData.fullName} - ${selectedDate?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${selectedTime}`,
          
          // Contact Information
          '👤 Parent Name': formData.fullName,
          '📧 Email Address': formData.email,
          '📱 Phone Number': formData.phone,
          
          // Child Information
          '👶 Child Age': formData.childAge || 'Not specified',
          '👥 Number of Children': formData.numberOfChildren || 'Not specified',
          
          // Tour Details
          '📅 Tour Date': selectedDate?.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          }),
          '🕐 Tour Time': selectedTime,
          
          // Additional Information
          '💬 Special Notes': formData.notes || 'No special notes',
          
          // Form Metadata
          '📋 Form Type': 'Tour Booking',
          '📧 Submission Time': new Date().toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZoneName: 'short'
          })
        }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        // Reset booking
        setSelectedDate(null);
        setSelectedTime(null);
        setShowTimeSlotsModal(false);
        setFormData({
          fullName: '',
          email: '',
          subject: '',
          message: '',
          phone: '',
          childAge: '',
          numberOfChildren: '',
          notes: ''
        });
      } else {
        throw new Error('Failed to book tour');
      }
    } catch (error) {
      console.error('Error booking tour:', error);
      alert('Sorry, there was an error booking your tour. Please try again or contact us directly.');
    } finally {
      setIsLoading(false);
    }
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

  // Check if a date is available for tours
  const isDateAvailable = (day) => {
    if (!day) return false;
    
    const dateToCheck = new Date(currentYear, currentMonth, day);
    const today = new Date();
    
    // Reset time to compare just the date
    today.setHours(0, 0, 0, 0);
    dateToCheck.setHours(0, 0, 0, 0);
    
    // Past dates are not available
    if (dateToCheck < today) return false;
    
    // Weekends are not available (0 = Sunday, 6 = Saturday)
    const dayOfWeek = dateToCheck.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;
    
    return true;
  };

  // Handle date selection - show modal
  const handleDateClick = (day) => {
    if (!day || !isDateAvailable(day)) return;
    
    const selectedDateObj = new Date(currentYear, currentMonth, day);
    setSelectedDate(selectedDateObj);
    setShowTimeSlotsModal(true);
    setSelectedTime(null);
  };

  // Handle time slot selection
  const handleTimeSlotClick = (timeSlot) => {
    setSelectedTime(timeSlot);
  };

  // Close modal
  const closeModal = () => {
    setShowTimeSlotsModal(false);
    setSelectedDate(null);
    setSelectedTime(null);
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
                  <Image src="/Emojis/Contact_emoji-Photoroom.png" alt="Contact Emoji" width={48} height={48} className="mr-3" />
                  <h2 className="text-3xl font-bold text-primary">Get in Touch</h2>
                </div>
                
                {isSubmitted ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">
                      <Image src="/Emojis/Balloon_emoji-Photoroom.png" alt="Balloon Emoji" width={96} height={96} />
                    </div>
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
                        <span className="label-text text-lg font-medium">
                          <Image src="/Emojis/Email_emoji-Photoroom.png" alt="Email Emoji" width={24} height={24} className="inline-block mr-2" />
                          Email Address
                        </span>
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
                        <span className="label-text text-lg font-medium">
                          <Image src="/Emojis/MagGlass_emoji-Photoroom.png" alt="Subject Emoji" width={24} height={24} className="inline-block mr-2" />
                          Subject
                        </span>
                      </label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="select select-bordered select-lg focus:select-primary"
                        required
                      >
                        <option value="">What can we help you with?</option>
                        <option value="Facility Tour">🏠 Facility Tour</option>
                        <option value="Enrollment Information">📝 Enrollment Information</option>
                        <option value="Program Details">📚 Program Details</option>
                        <option value="Pricing & Fees">💰 Pricing & Fees</option>
                        <option value="Other Questions">❓ Other Questions</option>
                      </select>
                    </div>
                    
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text text-lg font-medium">
                          <Image src="/Emojis/Contact_emoji-Photoroom.png" alt="Message Emoji" width={24} height={24} className="inline-block mr-2" />
                          Your Message
                        </span>
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
                        <span className="label-text text-lg font-medium">
                          <Image src="/Emojis/Contact_emoji-Photoroom.png" alt="Phone Emoji" width={24} height={24} className="inline-block mr-2" />
                          Phone Number
                        </span>
                      </label>
                      <div className="join">
                        <span className="join-item bg-base-200 px-4 py-3 text-lg font-medium">+1</span>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="input input-bordered input-lg join-item flex-1 focus:input-primary"
                          placeholder="(000) 000-0000"
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
                          <Image src="/Emojis/Running_Emoji-Photoroom.png" alt="Running Emoji" width={24} height={24} className="mr-2" />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
            
            {/* Interactive Calendar & Booking */}
            <div className="space-y-8">
              
              {/* Tour Booking - All in One */}
              <div className="card bg-white shadow-2xl">
                <div className="card-body p-8">
                  <div className="flex items-center mb-6">
                    <Image src="/Emojis/Calendar_emoji-Photoroom.png" alt="Calendar Emoji" width={48} height={48} className="mr-3" />
                    <h3 className="text-2xl font-bold text-primary">Book Your Tour</h3>
                  </div>
                  
                  <div className="mb-6 p-4 bg-info/10 rounded-lg">
                    <p className="text-sm text-center text-base-content/90">
                      <span className="font-semibold">Click any weekday to see available tour times!</span>
                      <br />
                      <span className="font-semibold">Available:</span> Monday-Friday (Future dates only)
                      <br />
                      <span className="font-semibold">Tour Hours:</span> 8:00 AM - 4:00 PM
                      <br />
                      <span className="font-semibold">Duration:</span> 30-45 minutes
                    </p>
                  </div>

                  {/* Interactive Calendar */}
                  <div className="mb-8">
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
                      {calendarDays.map((day, index) => {
                        const isAvailable = isDateAvailable(day);
                        return (
                          <button 
                            key={index} 
                            onClick={() => handleDateClick(day)}
                            className={`
                              aspect-square p-2 rounded-lg text-center transition-all duration-200
                              ${!day ? 'invisible' : ''}
                              ${!isAvailable ? 'bg-base-200 text-base-content/40 cursor-not-allowed' : 'cursor-pointer'}
                              ${day === today.getDate() && isAvailable ? 'bg-primary text-white font-bold' : ''}
                              ${selectedDate && day === selectedDate.getDate() ? 'bg-secondary text-white font-bold' : ''}
                              ${day && isAvailable && day !== today.getDate() && (!selectedDate || day !== selectedDate.getDate()) ? 'bg-base-100 hover:bg-primary hover:text-white' : ''}
                            `}
                            disabled={!day || !isAvailable}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Date & Time Display */}
                  {(selectedDate || selectedTime) && (
                    <div className="mb-6 p-4 bg-success/10 rounded-lg">
                      {selectedDate && (
                        <p className="text-center text-success font-medium mb-2">
                          📅 {selectedDate.toLocaleDateString('en-US', { 
                           weekday: 'long', 
                           month: 'long', 
                           day: 'numeric' 
                         })}
                       </p>
                     )}
                     {selectedTime && (
                       <p className="text-center text-success font-medium">
                         🕐 {selectedTime}
                       </p>
                     )}
                   </div>
                 )}


               </div>
             </div>

              

              {/* Quick Actions */}
              <div className="card bg-gradient-to-br from-base-300 to-primary/10 shadow-xl">
                <div className="card-body p-8">
                  <h3 className="text-xl font-bold text-primary mb-4 text-center">
                    <Image src="/Emojis/Running_Emoji-Photoroom.png" alt="Running Emoji" width={32} height={32} className="mr-2" />
                    Quick Actions
                  </h3>
                  
                  <div className="space-y-3">
                    <Link href="/auth/signup">
                      <button className="btn btn-accent btn-block">
                        <Image src="/Emojis/Signup_emoji-Photoroom.png" alt="Signup Emoji" width={24} height={24} className="mr-2" />
                        Start Enrollment
                      </button>
                    </Link>
                    
                    <Link href="/program">
                      <button className="btn btn-outline btn-block">
                        <Image src="/Emojis/Programs_emoji-Photoroom.png" alt="Programs Emoji" width={24} height={24} className="mr-2" />
                        View Programs
                      </button>
                    </Link>
                    
                    <Link href="/faq">
                      <button className="btn btn-ghost btn-block">
                        <Image src="/Emojis/QA_emoji-Photoroom.png" alt="Question Emoji" width={24} height={24} className="mr-2" />
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
            Can't Wait to Meet You! <Image src="/Emojis/Happy_emoji-Photoroom.png" alt="Happy Emoji" width={48} height={48} className="inline-block" />
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Francesca and our team are standing by to answer your questions and schedule your visit. 
            Let's start this exciting journey together!
          </p>
          <div className="flex gap-6 justify-center flex-wrap">
            <a href="tel:+14035425531" className="btn btn-accent btn-lg">
              <Image src="/Emojis/Contact_emoji-Photoroom.png" alt="Contact Emoji" width={24} height={24} className="mr-2" />
              Call (403) 542-5531
            </a>
            <a href="mailto:cleanworld2661@gmail.com" className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-primary">
              <Image src="/Emojis/Email_emoji-Photoroom.png" alt="Email Emoji" width={24} height={24} className="mr-2" />
              Send Email
            </a>
          </div>
        </div>
      </div>

             {/* Time Slots Modal */}
               {showTimeSlotsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                          <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <Image src="/Emojis/Calendar_emoji-Photoroom.png" alt="Calendar Emoji" width={40} height={40} className="mr-3" />
                  <h3 className="text-2xl font-bold text-primary">Book Your Tour</h3>
                </div>
                <button 
                  onClick={closeModal}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  ✕
                </button>
              </div>
              
              {/* Selected Date */}
              <div className="mb-6 p-4 bg-primary/10 rounded-lg">
                <p className="text-center text-primary font-semibold text-lg">
                  📅 {selectedDate?.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              {/* Time Slots */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-primary mb-4">Select Your Preferred Time:</h4>
                <div className="grid grid-cols-2 gap-3">
                  {['8:00 AM - 10:00 AM', '10:00 AM - 12:00 PM', '12:00 PM - 2:00 PM', '2:00 PM - 4:00 PM'].map((timeSlot, index) => (
                    <button
                      key={index}
                      onClick={() => handleTimeSlotClick(timeSlot)}
                      className={`
                        p-4 rounded-lg text-center transition-all duration-200 font-medium
                        ${selectedTime === timeSlot 
                          ? 'bg-primary text-white' 
                          : 'bg-base-100 hover:bg-primary hover:text-white border border-base-300'
                        }
                      `}
                    >
                      {timeSlot}
                    </button>
                  ))}
                </div>
              </div>
              
               {/* Tour Booking Form */}
               <form onSubmit={handleTourBooking} className="space-y-6">
                 {/* Form Header */}
                 <div className="text-center mb-6 p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl">
                   <h4 className="text-xl font-bold text-primary mb-2">📝 Complete Your Tour Booking</h4>
                   <p className="text-sm text-base-content/80">Please fill in all required fields to secure your tour</p>
                 </div>

                                   {/* Personal Information Section */}
                  <div className="bg-base-50 p-6 rounded-xl border border-base-200">
                   <h5 className="text-lg font-semibold text-primary mb-4 flex items-center">
                     <span className="mr-2">👤</span>
                     Personal Information
                   </h5>
                   
                   {/* Simple row layout - much cleaner */}
                   <div className="space-y-4">
                     {/* Full Name */}
                     <div className="form-control w-full">
                       <label className="label">
                         <span className="label-text font-medium text-base-content/80">Full Name *</span>
                       </label>
                       <input
                         type="text"
                         name="fullName"
                         value={formData.fullName}
                         onChange={handleChange}
                         className="input input-bordered focus:input-primary bg-white shadow-sm w-full"
                         placeholder="Enter your full name"
                         required
                       />
                     </div>
                     
                     {/* Email Address */}
                     <div className="form-control w-full">
                       <label className="label">
                         <span className="label-text font-medium text-base-content/80">Email Address *</span>
                       </label>
                       <input
                         type="email"
                         name="email"
                         value={formData.email}
                         onChange={handleChange}
                         className="input input-bordered focus:input-primary bg-white shadow-sm w-full"
                         placeholder="your.email@example.com"
                         required
                       />
                     </div>
                     
                     {/* Phone Number */}
                     <div className="form-control w-full">
                       <label className="label">
                         <span className="label-text font-medium text-base-content/80">Phone Number *</span>
                       </label>
                       <div className="flex w-full">
                         <span className="bg-primary text-primary-content px-4 py-3 font-medium text-center min-w-[60px] rounded-l-lg border border-primary">+1</span>
                         <input
                           type="tel"
                           name="phone"
                           value={formData.phone}
                           onChange={handleChange}
                           className="input input-bordered flex-1 focus:input-primary bg-white rounded-l-none border-l-0"
                           placeholder="(000) 000-0000"
                           required
                         />
                       </div>
                     </div>
                   </div>
                 </div>

                                   {/* Child Information Section */}
                  <div className="bg-base-50 p-6 rounded-xl border border-base-200">
                   <h5 className="text-lg font-semibold text-primary mb-4 flex items-center">
                     <span className="mr-2">👶</span>
                     Child Information
                   </h5>
                   <div className="space-y-4">
                     <div className="form-control w-full">
                       <label className="label">
                         <span className="label-text font-medium text-base-content/80">Child's Age *</span>
                       </label>
                       <select
                         name="childAge"
                         value={formData.childAge}
                         onChange={handleChange}
                         className="select select-bordered focus:select-primary bg-white shadow-sm w-full"
                         required
                       >
                         <option value="">Select age range</option>
                         <option value="6-18 months">👶 6-18 months</option>
                         <option value="18 months - 3 years">🧒 18 months - 3 years</option>
                         <option value="3-5 years">👧 3-5 years</option>
                         <option value="5+ years">👦 5+ years</option>
                       </select>
                     </div>
                     
                     <div className="form-control w-full">
                       <label className="label">
                         <span className="label-text font-medium text-base-content/80">Number of Children *</span>
                       </label>
                       <select
                         name="numberOfChildren"
                         value={formData.numberOfChildren}
                         onChange={handleChange}
                         className="select select-bordered focus:select-primary bg-white shadow-sm w-full"
                         required
                       >
                         <option value="">Select number</option>
                         <option value="1">👶 1 child</option>
                         <option value="2">👶👶 2 children</option>
                         <option value="3">👶👶👶 3 children</option>
                         <option value="4+">👶👶👶👶 4+ children</option>
                       </select>
                     </div>
                   </div>
                 </div>

                                   {/* Additional Information Section */}
                  <div className="bg-base-50 p-6 rounded-xl border border-base-200">
                   <h5 className="text-lg font-semibold text-primary mb-4 flex items-center">
                     <span className="mr-2">💬</span>
                     Additional Information
                   </h5>
                   <div className="form-control">
                     <label className="label">
                       <span className="label-text font-medium text-base-content/80">Special Requirements or Questions</span>
                       <span className="label-text-alt text-base-content/60">Optional</span>
                     </label>
                     <textarea
                       name="notes"
                       rows="4"
                       value={formData.notes}
                       onChange={handleChange}
                       className="textarea textarea-bordered focus:textarea-primary resize-none bg-white shadow-sm"
                       placeholder="Any special requirements, questions, or additional information you'd like us to know..."
                     ></textarea>
                   </div>
                 </div>

                 {/* Tour Summary */}
                 {selectedDate && selectedTime && (
                   <div className="bg-success/10 p-6 rounded-xl border border-success/20">
                     <h5 className="text-lg font-semibold text-success mb-4 flex items-center">
                       <span className="mr-2">✅</span>
                       Tour Summary
                     </h5>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="text-center p-3 bg-success/20 rounded-lg">
                         <p className="text-sm text-success/70 mb-1">Selected Date</p>
                         <p className="font-semibold text-success">
                           {selectedDate.toLocaleDateString('en-US', { 
                             weekday: 'long', 
                             month: 'long', 
                             day: 'numeric' 
                           })}
                         </p>
                       </div>
                       <div className="text-center p-3 bg-success/20 rounded-lg">
                         <p className="text-sm text-success/70 mb-1">Selected Time</p>
                         <p className="font-semibold text-success">{selectedTime}</p>
                       </div>
                     </div>
                   </div>
                 )}

                 {/* Submit Button */}
                 <div className="text-center">
                   <button 
                     type="submit" 
                     className={`btn btn-primary btn-lg px-12 ${isLoading ? 'loading' : ''}`}
                     disabled={isLoading || !selectedTime}
                   >
                     {isLoading ? (
                       <>
                         <span className="loading loading-spinner"></span>
                         Booking Your Tour...
                       </>
                     ) : (
                       <>
                         <Image src="/Emojis/Running_Emoji-Photoroom.png" alt="Running Emoji" width={24} height={24} className="mr-2" />
                         Book Tour Now
                       </>
                     )}
                   </button>
                   
                   {!selectedTime && (
                     <div className="mt-4 p-3 bg-warning/10 rounded-lg border border-warning/20">
                       <p className="text-warning text-sm flex items-center justify-center">
                         <span className="mr-2">⚠️</span>
                         Please select a preferred time slot above to continue
                       </p>
                     </div>
                   )}
                 </div>
               </form>
              
              {/* Tour Info */}
              <div className="mt-6 p-4 bg-info/10 rounded-lg">
                <p className="text-sm text-center text-base-content/90">
                  <span className="font-semibold">Tour Duration:</span> 30-45 minutes
                  <br />
                  <span className="font-semibold">Please arrive 5 minutes early</span>
                  <br />
                  <span className="font-semibold">Bring your child to see the facility!</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}