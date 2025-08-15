// app/faq/page.js
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function FAQ() {
  // FAQ data with answers
  const faqItems = [
    {
      id: "ratio",
      question: "What are your staff-to-child ratios?",
      answer: "We maintain excellent staff-to-child ratios: 1:4 for infants (6 weeks - 12 months), 1:6 for toddlers (12-24 months), 1:8 for preschoolers (2-5 years), and 1:10 for school-age children (5-12 years).",
      category: "staffing",
      emoji: <Image src="/Emojis/Staff_emoji-Photoroom.png" alt="Staff Emoji" width={24} height={24} />
    },
    {
      id: "training",
      question: "What is your sick child policy?",
      answer: "Children with fever (100.4°F or higher), vomiting, diarrhea, or contagious conditions must stay home until symptom-free for 24 hours. We follow strict health guidelines to protect all children.",
      category: "safety",
      emoji: <Image src="/Emojis/Security_emoji-Photoroom.png" alt="Security Emoji" width={24} height={24} />
    },
    {
      id: "qualifications",
      question: "What educational programs do you offer?",
      answer: "We offer age-appropriate curriculum including early literacy, math concepts, science exploration, art, music, and physical development. Our programs are designed to prepare children for kindergarten and beyond.",
      category: "programs",
      emoji: <Image src="/Emojis/Programs_emoji-Photoroom.png" alt="Programs Emoji" width={24} height={24} />
    },
    {
      id: "dietary",
      question: "What meals and snacks do you provide?",
      answer: "We provide nutritious breakfast, lunch, and afternoon snacks. All meals meet USDA guidelines and accommodate dietary restrictions. We encourage healthy eating habits and food exploration.",
      category: "nutrition",
      emoji: <Image src="/Emojis/Apple_emoji-Photoroom.png" alt="Apple Emoji" width={24} height={24} />
    },
    {
      id: "activities",
      question: "What art and creative activities do you offer?",
      answer: "We provide daily creative activities including painting, drawing, crafts, music, dramatic play, and sensory exploration. All materials are child-safe and age-appropriate.",
      category: "programs",
      emoji: <Image src="/Emojis/art_emoji-Photoroom.png" alt="Art Emoji" width={24} height={24} />
    },
    {
      id: "allergies",
      question: "How do you handle food allergies?",
      answer: "We take food allergies very seriously. Parents must provide detailed allergy information, and we maintain strict protocols to prevent cross-contamination. All staff are trained in allergy management.",
      category: "nutrition",
      emoji: <Image src="/Emojis/Apple_emoji-Photoroom.png" alt="Apple Emoji" width={24} height={24} />
    },
    {
      id: "reports",
      question: "How do you track my child's progress?",
      answer: "We use comprehensive assessment tools to track development across all domains. Parents receive regular progress reports and can schedule conferences to discuss their child's growth and development.",
      category: "programs",
      emoji: <Image src="/Emojis/Programs_emoji-Photoroom.png" alt="Programs Emoji" width={24} height={24} />
    },
    {
      id: "payment",
      question: "What are your payment policies?",
      answer: "Tuition is due weekly or monthly depending on your chosen plan. We accept various payment methods and offer flexible payment schedules. Late fees apply after the 5th of each month.",
      category: "admin",
      emoji: <Image src="/Emojis/Enroll_emoji-Photoroom.png" alt="Enroll Emoji" width={24} height={24} />
    },
    {
      id: "hours",
      question: "What are your operating hours?",
      answer: "We're open Monday through Friday from 6:30 AM to 6:00 PM. We offer extended hours for an additional fee. We're closed on major holidays and have limited hours during holiday weeks.",
      category: "admin",
      emoji: <Image src="/Emojis/Clock_emoji-Photoroom.png" alt="Clock Emoji" width={24} height={24} />
    },
    {
      id: "sick-policy",
      question: "How do you handle temperature control?",
      answer: "We maintain comfortable temperatures year-round (68-72°F) and monitor humidity levels. Our HVAC systems are regularly maintained, and we have backup systems for extreme weather conditions.",
      category: "safety",
      emoji: <Image src="/Emojis/Security_emoji-Photoroom.png" alt="Security Emoji" width={24} height={24} />
    }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openItems, setOpenItems] = useState({});

  const categories = [
    { id: 'all', name: 'All Questions', emoji: <Image src="/Emojis/MagGlass_emoji-Photoroom.png" alt="Magnifying Glass Emoji" width={24} height={24} /> },
    { id: 'safety', name: 'Safety & Health', emoji: <Image src="/Emojis/Security_emoji-Photoroom.png" alt="Security Emoji" width={24} height={24} /> },
    { id: 'staffing', name: 'Staff & Care', emoji: <Image src="/Emojis/Staff_emoji-Photoroom.png" alt="Staff Emoji" width={24} height={24} /> },
    { id: 'programs', name: 'Programs & Activities', emoji: <Image src="/Emojis/Programs_emoji-Photoroom.png" alt="Programs Emoji" width={24} height={24} /> },
    { id: 'nutrition', name: 'Meals & Nutrition', emoji: <Image src="/Emojis/Apple_emoji-Photoroom.png" alt="Apple Emoji" width={24} height={24} /> },
    { id: 'communication', name: 'Communication', emoji: <Image src="/Emojis/Contact_emoji-Photoroom.png" alt="Contact Emoji" width={24} height={24} /> },
    { id: 'admin', name: 'Admin & Fees', emoji: <Image src="/Emojis/Enroll_emoji-Photoroom.png" alt="Enroll Emoji" width={24} height={24} /> }
  ];

  // Filter FAQs based on search and category
  const filteredFAQs = faqItems.filter(item => {
    const matchesSearch = item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Toggle FAQ item open/closed
  const toggleItem = (id) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <div className="hero min-h-[50vh] bg-gradient-to-r from-primary/20 to-secondary/15">
        <div className="hero-content text-center">
          <div className="max-w-4xl">
            <h1 className="text-6xl font-bold text-primary mb-6">
              Questions & Answers 
              <span className="text-4xl ml-2">❓💡</span>
            </h1>
            <p className="text-2xl text-base-content leading-relaxed">
              Get instant answers to the most common questions about TinyLog daycare. 
              Still have questions? We're here to help!
            </p>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="py-12 bg-gradient-to-br from-base-200 to-neutral/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            
            {/* Search Bar */}
            <div className="form-control mb-8">
              <div className="input-group justify-center">
                <input 
                  type="text" 
                  placeholder="Search questions..." 
                  className="input input-bordered input-lg w-full max-w-lg focus:input-primary"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <button className="btn btn-primary btn-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`btn btn-sm ${
                    selectedCategory === category.id 
                      ? 'btn-primary' 
                      : 'btn-outline hover:btn-primary'
                  }`}
                >
                  <span className="mr-2">{category.emoji}</span>
                  {category.name}
                </button>
              ))}
            </div>

            {/* Results count */}
            <div className="text-center mb-8">
              <div className="badge badge-info badge-lg">
                {filteredFAQs.length} question{filteredFAQs.length !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            
            {filteredFAQs.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                            <h3 className="text-2xl font-bold text-base-content mb-4">No questions found</h3>
            <p className="text-lg text-base-content/90 mb-6">
                  Try adjusting your search or selecting a different category.
                </p>
                <button 
                  onClick={() => {setSearchTerm(''); setSelectedCategory('all');}}
                  className="btn btn-primary"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFAQs.map((item) => (
                  <div key={item.id} className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="card-body p-0">
                      
                      {/* Question */}
                      <button
                        onClick={() => toggleItem(item.id)}
                        className="w-full text-left p-6 hover:bg-base-50 transition-colors duration-200"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <span className="text-3xl">{item.emoji}</span>
                            <h3 className="text-xl font-semibold text-primary">
                              {item.question}
                            </h3>
                          </div>
                          <div className={`transform transition-transform duration-200 ${
                            openItems[item.id] ? 'rotate-180' : ''
                          }`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-base-content/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </button>

                      {/* Answer */}
                      <div className={`overflow-hidden transition-all duration-300 ${
                        openItems[item.id] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}>
                        <div className="px-6 pb-6">
                          <div className="border-l-4 border-primary pl-4 bg-base-50 p-4 rounded-r-lg">
                            <p className="text-base-content leading-relaxed">
                              {item.answer}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="py-16 bg-gradient-to-br from-base-300 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-primary mb-4">
                Still Have Questions? <Image src="/Emojis/QA_emoji-Photoroom.png" alt="Question Emoji" width={48} height={48} className="inline-block" />
              </h2>
              <p className="text-xl text-base-content">
                Our team is always happy to help! Get in touch with us directly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/contact">
                <div className="card bg-gradient-to-br from-secondary/15 to-accent/10 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
                  <div className="card-body text-center">
                    <div className="text-5xl mb-4">
                      <Image src="/Emojis/Contact_emoji-Photoroom.png" alt="Contact Emoji" width={80} height={80} />
                    </div>
                    <h3 className="card-title justify-center text-primary">Call Us</h3>
                    <p className="text-base-content">Speak directly with our team</p>
                    <p className="font-semibold text-primary">(403) 555-1234</p>
                  </div>
                </div>
              </Link>

              <Link href="/contact">
                <div className="card bg-gradient-to-br from-base-300 to-neutral/15 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
                  <div className="card-body text-center">
                    <div className="text-5xl mb-4">
                      <Image src="/Emojis/Email_emoji-Photoroom.png" alt="Email Emoji" width={80} height={80} />
                    </div>
                    <h3 className="card-title justify-center text-primary">Email Us</h3>
                    <p className="text-base-content">Send us your questions</p>
                    <p className="font-semibold text-primary">info@daycare.com</p>
                  </div>
                </div>
              </Link>

              <Link href="/contact">
                <div className="card bg-gradient-to-br from-primary/12 to-secondary/8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
                  <div className="card-body text-center">
                    <div className="text-5xl mb-4">
                      <Image src="/Emojis/Home_Emoji-Photoroom.png" alt="Home Emoji" width={80} height={80} />
                    </div>
                    <h3 className="card-title justify-center text-primary">Visit Us</h3>
                    <p className="text-base-content">Schedule a tour today</p>
                    <p className="font-semibold text-primary">Book Tour</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-16 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Get Started? <Image src="/Emojis/Running_Emoji-Photoroom.png" alt="Running Emoji" width={48} height={48} className="inline-block" />
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join our daycare family today! We're here to support your child's growth and development 
            every step of the way.
          </p>
          <div className="flex gap-6 justify-center flex-wrap">
            <Link href="/contact">
              <button className="btn btn-accent btn-lg">
                <Image src="/Emojis/Calendar_emoji-Photoroom.png" alt="Calendar Emoji" width={24} height={24} className="mr-2" />
                Schedule Tour
              </button>
            </Link>
            <Link href="/auth/signup">
              <button className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-primary">
                <Image src="/Emojis/Signup_emoji-Photoroom.png" alt="Signup Emoji" width={24} height={24} className="mr-2" />
                Start Enrollment
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}