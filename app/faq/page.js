// app/faq/page.js
'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function FAQ() {
  // FAQ data with answers
  const faqItems = [
    {
      id: "ratio",
      question: "What is the caregiver-to-child ratio?",
      answer: "We maintain low ratios to ensure personalized attention: 1:3 for infants (6-18 months), 1:4 for toddlers (18 months-3 years), and 1:8 for preschoolers (3-5 years). This exceeds provincial requirements and allows our staff to provide individualized care and attention to each child.",
      category: "staffing",
      emoji: "👥"
    },
    {
      id: "training",
      question: "Are the staff members trained in first aid and CPR?",
      answer: "Absolutely! All our staff members hold current Standard First Aid and CPR certification, including Infant and Child CPR. We also require ongoing professional development training in early childhood education, and all staff undergo thorough background checks including vulnerable sector screening.",
      category: "safety",
      emoji: "🚑"
    },
    {
      id: "qualifications",
      question: "What are the qualifications and experience of the caregivers?",
      answer: "Our caregivers hold Early Childhood Education (ECE) certification or equivalent credentials. Our lead teachers have a minimum of 3 years experience, and many have 10+ years in early childhood education. We invest in continuous professional development to ensure our team stays current with best practices.",
      category: "staffing",
      emoji: "🎓"
    },
    {
      id: "dietary",
      question: "How do you handle children with dietary restrictions?",
      answer: "We work closely with families to accommodate all dietary needs including allergies, intolerances, and cultural/religious preferences. We prepare fresh, nutritious meals daily and can modify recipes as needed. All staff are trained on food safety and allergy management protocols.",
      category: "nutrition",
      emoji: "🍎"
    },
    {
      id: "activities",
      question: "What types of activities do the children engage in?",
      answer: "Our daily program includes creative arts, music and movement, outdoor play, STEM exploration, dramatic play, reading time, and age-appropriate learning activities. We follow a play-based curriculum that promotes social, emotional, physical, and cognitive development through fun, engaging experiences.",
      category: "programs",
      emoji: "🎨"
    },
    {
      id: "allergies",
      question: "Do you accommodate food allergies or special diets?",
      answer: "Yes! We have extensive experience managing food allergies and special dietary needs. We maintain detailed allergy action plans, use separate preparation areas when needed, and ensure all staff are trained on emergency procedures. We can accommodate vegetarian, vegan, halal, kosher, and other dietary requirements.",
      category: "nutrition",
      emoji: "🥗"
    },
    {
      id: "reports",
      question: "Do you provide progress reports for children?",
      answer: "We provide detailed daily reports for infants and toddlers, and weekly reports for preschoolers. Monthly development assessments track milestones and learning progress. We also offer parent-teacher conferences twice yearly and maintain an open-door policy for ongoing communication.",
      category: "communication",
      emoji: "📊"
    },
    {
      id: "payment",
      question: "What is the fee and payment structure?",
      answer: "We offer flexible payment options including monthly, bi-weekly, or weekly payments. Fees vary by age group and program type. We accept e-transfer, automatic bank transfers, and credit cards. A registration fee and deposit are required to secure your spot. Financial assistance may be available.",
      category: "admin",
      emoji: "💰"
    },
    {
      id: "hours",
      question: "What are your operating hours?",
      answer: "We're open Monday through Friday from 7:00 AM to 6:00 PM. We're closed on statutory holidays and have reduced hours during the holiday season. Extended hours may be available for families with special needs - please discuss this during enrollment.",
      category: "admin",
      emoji: "🕐"
    },
    {
      id: "sick-policy",
      question: "What is your sick child policy?",
      answer: "Children must be fever-free for 24 hours before returning. We follow public health guidelines for communicable diseases. We provide daily health checks and will contact parents if a child becomes unwell. We maintain detailed health records and work with local health authorities when needed.",
      category: "safety",
      emoji: "🌡️"
    }
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [openItems, setOpenItems] = useState({});

  const categories = [
    { id: 'all', name: 'All Questions', emoji: '📋' },
    { id: 'safety', name: 'Safety & Health', emoji: '🛡️' },
    { id: 'staffing', name: 'Staff & Care', emoji: '👨‍🏫' },
    { id: 'programs', name: 'Programs & Activities', emoji: '🎯' },
    { id: 'nutrition', name: 'Meals & Nutrition', emoji: '🍎' },
    { id: 'communication', name: 'Communication', emoji: '📱' },
    { id: 'admin', name: 'Admin & Fees', emoji: '📄' }
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
                Still Have Questions? <span className="text-3xl">🤔</span>
              </h2>
              <p className="text-xl text-base-content">
                Our team is always happy to help! Get in touch with us directly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/contact">
                <div className="card bg-gradient-to-br from-secondary/15 to-accent/10 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
                  <div className="card-body text-center">
                    <div className="text-5xl mb-4">📞</div>
                    <h3 className="card-title justify-center text-primary">Call Us</h3>
                    <p className="text-base-content">Speak directly with our team</p>
                    <p className="font-semibold text-primary">(403) 555-1234</p>
                  </div>
                </div>
              </Link>

              <Link href="/contact">
                <div className="card bg-gradient-to-br from-base-300 to-neutral/15 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
                  <div className="card-body text-center">
                    <div className="text-5xl mb-4">📧</div>
                    <h3 className="card-title justify-center text-primary">Email Us</h3>
                    <p className="text-base-content">Send us your questions</p>
                    <p className="font-semibold text-primary">info@daycare.com</p>
                  </div>
                </div>
              </Link>

              <Link href="/contact">
                <div className="card bg-gradient-to-br from-primary/12 to-secondary/8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer">
                  <div className="card-body text-center">
                    <div className="text-5xl mb-4">🏠</div>
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
            Ready to Get Started? <span className="text-3xl">🚀</span>
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join our daycare family today! We're here to support your child's growth and development 
            every step of the way.
          </p>
          <div className="flex gap-6 justify-center flex-wrap">
            <Link href="/contact">
              <button className="btn btn-accent btn-lg">
                <span className="text-xl mr-2">📅</span>
                Schedule Tour
              </button>
            </Link>
            <Link href="/auth/signup">
              <button className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-primary">
                <span className="text-xl mr-2">📝</span>
                Start Enrollment
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}