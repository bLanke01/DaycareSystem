// app/program/page.js
import Image from 'next/image';
import Link from 'next/link';

export default function Program() {
  const programs = [
    {
      id: 'infant',
      title: 'Infant Care',
      emoji: '👶',
      age: '6 - 18 months',
      capacity: '6 children',
      ratio: '1:3 ratio',
      description: 'Loving, individualized care for your precious little ones in a safe, nurturing environment.',
      features: [
        'Personalized feeding schedules',
        'Gentle sleep routines',
        'Sensory play activities',
        'Milestone tracking',
        'Daily photo updates',
        'Diaper & feeding logs'
      ],
      image: '/a11.jpg',
      color: 'from-pink-50 to-red-50',
      accent: 'text-pink-600'
    },
    {
      id: 'toddler',
      title: 'Toddler Program',
      emoji: '🧸',
      age: '18 months - 3 years',
      capacity: '8 children',
      ratio: '1:4 ratio',
      description: 'Active learning and exploration for curious toddlers developing independence and social skills.',
      features: [
        'Potty training support',
        'Language development',
        'Art & craft activities',
        'Outdoor exploration',
        'Music & movement',
        'Social skill building'
      ],
      image: '/a12.jpg',
      color: 'from-yellow-50 to-orange-50',
      accent: 'text-orange-600'
    },
    {
      id: 'preschool',
      title: 'Preschool Program',
      emoji: '🎨',
      age: '3 - 5 years',
      capacity: '12 children',
      ratio: '1:6 ratio',
      description: 'School readiness program focusing on literacy, numeracy, and social-emotional development.',
      features: [
        'Pre-reading & writing skills',
        'Early math concepts',
        'Science experiments',
        'Dramatic play',
        'Problem-solving activities',
        'Kindergarten preparation'
      ],
      image: '/a13.jpg',
      color: 'from-blue-50 to-purple-50',
      accent: 'text-blue-600'
    },
    {
      id: 'afterschool',
      title: 'After-School Care',
      emoji: '📖',
      age: '5 - 12 years',
      capacity: '20 children',
      ratio: '1:10 ratio',
      description: 'Homework support, enrichment activities, and fun for school-age children.',
      features: [
        'Homework assistance',
        'STEM projects',
        'Sports & recreation',
        'Arts & crafts',
        'Field trips',
        'Holiday programs'
      ],
      image: '/a14.jpg',
      color: 'from-green-50 to-emerald-50',
      accent: 'text-green-600'
    }
  ];

  const beliefs = [
    {
      title: 'We Value Their Smiles',
      emoji: '😊',
      description: 'We believe that a child\'s smile is a reflection of their happiness and well-being. At TinyLog, we are dedicated to creating a safe, nurturing environment where every child feels valued and supported.',
      image: '/a15.jpg'
    },
    {
      title: 'Playing is Fun!',
      emoji: '🎈',
      description: 'Through fun and engaging activities, children learn important skills like creativity, problem-solving, and teamwork. Playtime fosters social connections and helps children express themselves in a relaxed, joyful environment.',
      image: '/a11.jpg'
    },
    {
      title: 'Learning Through Exploration',
      emoji: '🔍',
      description: 'Children are natural explorers, and at TinyLog we encourage their curiosity through hands-on learning experiences. Our curriculum is designed to engage all senses and promote cognitive development through discovery.',
      image: '/a12.jpg'
    },
    {
      title: 'Building Strong Foundations',
      emoji: '🏗️',
      description: 'Early childhood is a critical time for development, and TinyLog focuses on building strong foundations for future learning. Our programs emphasize language development, early literacy, mathematical thinking, and social-emotional skills.',
      image: '/a13.jpg'
    }
  ];

  const dailySchedule = [
    { time: '7:00 - 8:30 AM', activity: 'Arrival & Free Play', emoji: '🌅' },
    { time: '8:30 - 9:00 AM', activity: 'Breakfast & Circle Time', emoji: '🥣' },
    { time: '9:00 - 10:30 AM', activity: 'Learning Activities', emoji: '📚' },
    { time: '10:30 - 11:00 AM', activity: 'Snack & Outdoor Play', emoji: '🍎' },
    { time: '11:00 - 12:00 PM', activity: 'Structured Activities', emoji: '🎯' },
    { time: '12:00 - 1:00 PM', activity: 'Lunch Time', emoji: '🍽️' },
    { time: '1:00 - 3:00 PM', activity: 'Quiet Time & Naps', emoji: '😴' },
    { time: '3:00 - 3:30 PM', activity: 'Afternoon Snack', emoji: '🧀' },
    { time: '3:30 - 5:00 PM', activity: 'Creative Play & Centers', emoji: '🎨' },
    { time: '5:00 - 6:00 PM', activity: 'Free Play & Pickup', emoji: '👋' }
  ];

  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <div className="hero min-h-[70vh] bg-gradient-to-r from-primary/20 to-secondary/15">
        <div className="hero-content text-center">
          <div className="max-w-4xl">
            <h1 className="text-6xl font-bold text-primary mb-6">
              TinyLog's Amazing Programs 
              <span className="text-4xl ml-2">🌟📚</span>
            </h1>
            <p className="text-2xl text-base-content leading-relaxed mb-8">
              Thoughtfully designed programs for every stage of your child's development. 
              From tiny infants to school-age children, TinyLog nurtures growth through play, learning, and love.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/contact">
                <button className="btn btn-primary btn-lg">
                  <span className="text-xl mr-2">📅</span>
                  Schedule a Tour
                </button>
              </Link>
              <Link href="/auth/signup">
                <button className="btn btn-secondary btn-lg">
                  <span className="text-xl mr-2">📝</span>
                  Enroll Now
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Our Beliefs Section */}
      <div className="py-20 bg-gradient-to-br from-base-200 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-primary mb-4">
              What TinyLog Believes <span className="text-4xl">💫</span>
            </h2>
            <p className="text-xl text-base-content max-w-3xl mx-auto">
              Our philosophy is built on the foundation that every child is unique, capable, and deserves 
              an environment where they can thrive and reach their full potential at TinyLog.
            </p>
          </div>

          <div className="space-y-16">
            {beliefs.map((belief, index) => (
              <div key={index} className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                index % 2 === 1 ? 'lg:grid-flow-row-dense' : ''
              }`}>
                <div className={index % 2 === 1 ? 'lg:col-start-2' : ''}>
                  <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl group">
                    <Image
                      src={belief.image}
                      alt={belief.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  </div>
                </div>
                <div className={index % 2 === 1 ? 'lg:col-start-1 lg:row-start-1' : ''}>
                  <div className="badge badge-primary badge-lg mb-4">
                    <span className="text-xl mr-2">{belief.emoji}</span>
                    Philosophy {index + 1}
                  </div>
                  <h3 className="text-4xl font-bold text-primary mb-6">{belief.title}</h3>
                  <p className="text-lg text-base-content leading-relaxed">{belief.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Programs Section */}
      <div className="py-20 bg-gradient-to-br from-primary/8 to-secondary/6">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-primary mb-4">
              Age-Specific Programs <span className="text-4xl">👶🧒👦👧</span>
            </h2>
            <p className="text-xl text-base-content max-w-3xl mx-auto">
              Each TinyLog program is carefully crafted to meet the developmental needs and interests 
              of children at different stages of their growth journey.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {programs.map((program) => (
              <div key={program.id} className={`card bg-gradient-to-br ${program.color} shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2`}>
                <figure className="px-6 pt-6">
                  <div className="relative h-[250px] w-full rounded-xl overflow-hidden">
                    <Image
                      src={program.image}
                      alt={program.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </figure>
                <div className="card-body">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-4xl">{program.emoji}</span>
                      <div>
                        <h3 className="text-2xl font-bold text-primary">{program.title}</h3>
                        <p className={`text-lg font-semibold ${program.accent}`}>{program.age}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="badge badge-outline badge-lg">{program.capacity}</div>
                      <div className="badge badge-success badge-sm mt-1">{program.ratio}</div>
                    </div>
                  </div>
                  
                  <p className="text-base-content mb-6">{program.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {program.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <span className="text-green-500">✓</span>
                        <span className="text-sm text-base-content/90">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="card-actions justify-end mt-6">
                    <Link href={`/contact?program=${program.id}`}>
                      <button className="btn btn-primary">
                        <span className="mr-2">📞</span>
                        Learn More
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Schedule */}
      <div className="py-20 bg-gradient-to-br from-base-200 to-neutral/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-primary mb-4">
              A Day at TinyLog <span className="text-4xl">⏰🌈</span>
            </h2>
            <p className="text-xl text-base-content max-w-3xl mx-auto">
              Our structured yet flexible daily routine provides predictability while allowing 
              for spontaneous learning moments and individual needs.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dailySchedule.map((item, index) => (
                <div key={index} className="card bg-gradient-to-r from-base-100 to-base-50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="card-body p-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">{item.emoji}</div>
                      <div>
                        <p className="font-bold text-primary">{item.time}</p>
                        <p className="text-base-content">{item.activity}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enrichment Activities */}
      <div className="py-20 bg-gradient-to-br from-base-300 to-accent/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-primary mb-4">
              Daily Activities <span className="text-4xl">✨🎈</span>
            </h2>
            <p className="text-xl text-gray-600">
              Fun and engaging activities that make every day special at TinyLog daycare.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: 'Story Time', emoji: '📚', description: 'Daily reading sessions with favorite books and stories' },
              { name: 'Arts & Crafts', emoji: '🎨', description: 'Simple creative projects with safe materials' },
              { name: 'Outdoor Play', emoji: '🌳', description: 'Fresh air and physical activity in our playground' },
              { name: 'Music & Songs', emoji: '🎵', description: 'Singing, dancing, and simple musical instruments' },
              { name: 'Snack Helpers', emoji: '🍎', description: 'Children help prepare and serve healthy snacks' },
              { name: 'Show & Tell', emoji: '🗣️', description: 'Weekly sharing time to build confidence' },
              { name: 'Puzzle Time', emoji: '🧩', description: 'Age-appropriate puzzles and matching games' },
              { name: 'Circle Time', emoji: '⭕', description: 'Group discussions and learning activities together' }
            ].map((activity, index) => (
              <div key={index} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="card-body text-center p-6">
                  <div className="text-5xl mb-3">{activity.emoji}</div>
                  <h3 className="text-lg font-bold text-primary mb-2">{activity.name}</h3>
                  <p className="text-base-content/90 text-sm">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-6">
            Ready to Start the TinyLog Journey? <span className="text-4xl">🚀✨</span>
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Give your child the gift of quality early education in a loving, nurturing environment. 
            Join the TinyLog family today!
          </p>
          <div className="flex gap-6 justify-center flex-wrap">
            <Link href="/contact">
              <button className="btn btn-accent btn-lg">
                <span className="text-xl mr-2">📅</span>
                Book a Tour
              </button>
            </Link>
            <Link href="/auth/signup">
              <button className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-primary">
                <span className="text-xl mr-2">📝</span>
                Start Enrollment
              </button>
            </Link>
            <a href="tel:+14035551234" className="btn btn-ghost btn-lg text-white hover:bg-white/20">
              <span className="text-xl mr-2">📞</span>
              Call Us Today
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}