// app/about/page.js
import Image from 'next/image';

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="hero min-h-[60vh] bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="hero-content text-center">
          <div className="max-w-4xl">
            <h1 className="text-6xl font-bold text-primary mb-6">
              About Our TinyLog Community 
              <span className="text-4xl ml-2">🏠💕</span>
            </h1>
            <p className="text-2xl text-gray-700 leading-relaxed">
              We actively connect with local organizations, events, and resources to build strong 
              relationships and foster a sense of belonging. By working together, we create a network of 
              support that benefits everyone in our TinyLog daycare family!
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/a11.jpg"
                  alt="Children learning together at TinyLog"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="badge badge-primary badge-lg mb-4">
                <span className="text-xl mr-2">🎯</span>
                Our Mission
              </div>
              <h2 className="text-4xl font-bold text-primary mb-6">
                Nurturing Tomorrow's Leaders Today
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                At TinyLog, we are committed to providing a nurturing, educational environment 
                where children can explore, learn, and grow. We believe in developing the whole child 
                by focusing on social, emotional, physical, and cognitive development.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="badge badge-outline badge-lg">Social Growth 👫</div>
                <div className="badge badge-outline badge-lg">Emotional Health 💝</div>
                <div className="badge badge-outline badge-lg">Physical Development 🏃</div>
                <div className="badge badge-outline badge-lg">Cognitive Learning 🧠</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-20 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="badge badge-secondary badge-lg mb-4">
                <span className="text-xl mr-2">👥</span>
                Our Amazing Team
              </div>
              <h2 className="text-4xl font-bold text-primary mb-6">
                Passionate Educators Who Care
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                Our TinyLog team consists of passionate, qualified early childhood educators who are dedicated 
                to making a positive impact in children's lives. Each staff member brings unique skills 
                and perspectives, creating a diverse and enriching environment for all children.
              </p>
              
              {/* Team Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="stat bg-white rounded-xl shadow-lg">
                  <div className="stat-figure text-3xl">👨‍🏫</div>
                  <div className="stat-title">Certified Staff</div>
                  <div className="stat-value text-primary">100%</div>
                </div>
                <div className="stat bg-white rounded-xl shadow-lg">
                  <div className="stat-figure text-3xl">📚</div>
                  <div className="stat-title">Years Experience</div>
                  <div className="stat-value text-secondary">15+</div>
                </div>
              </div>
            </div>
            <div>
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/a12.jpg"
                  alt="Professional TinyLog daycare staff"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Approach Section */}
      <div className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="badge badge-accent badge-lg mb-4">
              <span className="text-xl mr-2">🎨</span>
              Our Approach
            </div>
            <h2 className="text-4xl font-bold text-primary mb-6">
              Play-Based Learning That Inspires
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              At TinyLog, we believe in a play-based approach to learning, where children are encouraged to explore 
              their interests and develop their abilities through meaningful activities.
            </p>
          </div>

          {/* Approach Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card bg-gradient-to-br from-red-50 to-pink-50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="card-body text-center">
                <div className="text-6xl mb-4">🎭</div>
                <h3 className="card-title text-primary justify-center">Creative Expression</h3>
                <p className="text-gray-700">Art, music, and dramatic play to foster imagination and self-expression.</p>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-yellow-50 to-orange-50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="card-body text-center">
                <div className="text-6xl mb-4">🔬</div>
                <h3 className="card-title text-primary justify-center">STEM Exploration</h3>
                <p className="text-gray-700">Hands-on science experiments and building activities that spark curiosity.</p>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-50 to-emerald-50 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="card-body text-center">
                <div className="text-6xl mb-4">🌱</div>
                <h3 className="card-title text-primary justify-center">Nature Learning</h3>
                <p className="text-gray-700">Outdoor exploration and gardening to connect children with nature.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Section */}
      <div className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/a13.jpg"
                  alt="TinyLog community involvement activities"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="badge badge-success badge-lg mb-4">
                <span className="text-xl mr-2">🤝</span>
                Community Connection
              </div>
              <h2 className="text-4xl font-bold text-primary mb-6">
                Building Stronger Communities Together
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                TinyLog is proud to be an active part of our community. We regularly partner with local 
                organizations, invite community helpers to visit our center, and participate in community 
                events. We believe that these connections enrich our program and help children develop a 
                sense of belonging and citizenship.
              </p>

              {/* Community Activities */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="badge badge-primary">🚒</div>
                  <span className="font-medium">Fire Station Visits</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="badge badge-secondary">📚</div>
                  <span className="font-medium">Library Story Time</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="badge badge-accent">🎉</div>
                  <span className="font-medium">Community Festivals</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="badge badge-success">🌳</div>
                  <span className="font-medium">Park Clean-up Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Join the TinyLog Family? <span className="text-3xl">🤗</span>
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Come see our beautiful TinyLog facility and meet our amazing team! 
            We'd love to show you why families choose us for their children's care.
          </p>
          <div className="flex gap-6 justify-center flex-wrap">
            <a href="/contact" className="btn btn-accent btn-lg">
              <span className="text-xl mr-2">📅</span>
              Schedule a Tour
            </a>
            <a href="/program" className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-primary">
              <span className="text-xl mr-2">📋</span>
              View Programs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}