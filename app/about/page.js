// app/about/page.js
import Image from 'next/image';

export default function About() {
  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <div className="hero min-h-[60vh] bg-gradient-to-r from-primary/20 to-secondary/15">
        <div className="hero-content text-center">
          <div className="max-w-4xl">
            <h1 className="text-6xl font-bold text-primary mb-6">
              About Our TinyLog Community
              <span className="text-4xl ml-2">
                <Image 
                  src="/Emojis/Home_emoji-Photoroom.png" 
                  alt="Home Emoji" 
                  width={48}
                  height={48}
                  className="inline-block align-middle"
                />
              </span>
            </h1>
            <p className="text-2xl text-base-content leading-relaxed">
              We actively connect with local organizations, events, and resources to build strong 
              relationships and foster a sense of belonging. By working together, we create a network of 
              support that benefits everyone in our TinyLog daycare family!
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-20 bg-gradient-to-br from-base-200 to-neutral/30">
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
                <span className="text-xl mr-2"><Image src="/Emojis/Enroll_emoji-Photoroom.png" alt="Enroll Emoji" width={24} height={24} /></span>
                Our Mission
              </div>
              <h2 className="text-4xl font-bold text-primary mb-6">
                Nurturing Tomorrow's Leaders Today
              </h2>
              <p className="text-lg text-base-content leading-relaxed mb-6">
                At TinyLog, we are committed to providing a nurturing, educational environment 
                where children can explore, learn, and grow. We believe in developing the whole child 
                by focusing on social, emotional, physical, and cognitive development.
              </p>
              <div className="flex flex-wrap gap-3">
                <div className="badge badge-outline badge-lg">Social Growth <Image src="/Emojis/Staff_emoji-Photoroom.png" alt="Staff Emoji" width={24} height={24}/></div>
                <div className="badge badge-outline badge-lg">Emotional Health <Image src="/Emojis/Heart_emoji-Photoroom.png" alt="Heart Emoji" width={24} height={24}/></div>
                <div className="badge badge-outline badge-lg">Physical Development <Image src="/Emojis/Running_emoji-Photoroom.png" alt="Running Emoji" width={24} height={24}/></div>
                <div className="badge badge-outline badge-lg">Cognitive Learning <Image src="/Emojis/Programs_emoji-Photoroom.png" alt="Programs Emoji" width={20} height={20}/></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="py-20 bg-gradient-to-br from-base-300 to-primary/10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="badge badge-secondary badge-lg mb-4">
                <span className="text-xl mr-2"> <Image src="/Emojis/Staff_emoji-Photoroom.png" alt="Staff Emoji" width={24} height={24} /></span>
                Our Amazing Team
              </div>
              <h2 className="text-4xl font-bold text-primary mb-6">
                Passionate Educators Who Care
              </h2>
              <p className="text-lg text-base-content leading-relaxed mb-8">
                Our TinyLog team consists of passionate, qualified early childhood educators who are dedicated 
                to making a positive impact in children's lives. Each staff member brings unique skills 
                and perspectives, creating a diverse and enriching environment for all children.
              </p>
              
              {/* Team Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="stat bg-base-100 rounded-xl shadow-lg">
                  <div className="stat-figure text-3xl"><Image src="/Emojis/Staff_emoji-Photoroom.png" alt="Staff Emoji" width={50} height={50} /></div>
                  <div className="stat-title">Certified Staff</div>
                  <div className="stat-value text-primary">100%</div>
                </div>
                <div className="stat bg-base-100 rounded-xl shadow-lg">
                  <div className="stat-figure text-3xl"><Image src="/Emojis/Programs_emoji-Photoroom.png" alt="Programs Emoji" width={40} height={40} /></div>
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
      <div className="py-20 bg-gradient-to-br from-base-200 to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="badge badge-accent badge-lg mb-4">
              <span className="text-xl mr-2"><Image src="/Emojis/art_emoji-photoroom.png" alt="Art Emoji" width={20} height={20} /></span>
              Our Approach
            </div>
            <h2 className="text-4xl font-bold text-primary mb-6">
              Play-Based Learning That Inspires
            </h2>
            <p className="text-xl text-base-content max-w-3xl mx-auto">
              At TinyLog, we believe in a play-based approach to learning, where children are encouraged to explore 
              their interests and develop their abilities through meaningful activities.
            </p>
          </div>

          {/* Approach Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card bg-gradient-to-br from-primary/12 to-secondary/8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="card-body text-center">
                <div className="flex justify-center mb-4"><Image src="/Emojis/balloon_emoji-photoroom.png" alt="Balloon Emoji" width={40} height={40} /></div>
                <h3 className="card-title text-primary justify-center">Creative Expression</h3>
                <p className="text-base-content">Art, music, and dramatic play to foster imagination and self-expression.</p>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-accent/10 to-primary/8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="card-body text-center">
                <div className="flex justify-center mb-4"><Image src="/Emojis/MagGlass_emoji-photoroom.png" alt="Magnifying Glass Emoji" width={40} height={40} /></div>
                <h3 className="card-title text-primary justify-center">STEM Exploration</h3>
                <p className="text-base-content">Hands-on science experiments and building activities that spark curiosity.</p>
              </div>
            </div>

            <div className="card bg-gradient-to-br from-neutral/10 to-secondary/8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="card-body text-center">
                <div className="flex justify-center mb-4"><Image src="/Emojis/cloud_emoji-photoroom.png" alt="Cloud Emoji" width={60} height={60} /></div>
                <h3 className="card-title text-primary justify-center">Nature Learning</h3>
                <p className="text-base-content">Outdoor exploration and gardening to connect children with nature.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Community Section */}
      <div className="py-20 bg-gradient-to-br from-base-300 to-neutral/20">
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
                <span className="text-xl mr-2"></span>
                Community Connection
              </div>
              <h2 className="text-4xl font-bold text-primary mb-6">
                Building Stronger Communities Together
              </h2>
              <p className="text-lg text-base-content leading-relaxed mb-8">
                TinyLog is proud to be an active part of our community. We regularly partner with local 
                organizations, invite community helpers to visit our center, and participate in community 
                events. We believe that these connections enrich our program and help children develop a 
                sense of belonging and citizenship.
              </p>

              {/* Community Activities */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="badge badge-primary"></div>
                  <span className="font-medium">Fire Station Visits</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="badge badge-secondary"></div>
                  <span className="font-medium">Library Story Time</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="badge badge-accent"></div>
                  <span className="font-medium">Community Festivals</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="badge badge-success"></div>
                  <span className="font-medium">Park Clean-up Days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-20 bg-gradient-to-r from-primary to-secondary text-primary-content">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Join the TinyLog Family? 
            <span className="text-3xl ml-2">
              <Image src="/Emojis/Happy_emoji-Photoroom.png" alt="Happy Emoji" width={60} height={60} className="inline-block align-middle" />
            </span>
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Come see our beautiful TinyLog facility and meet our amazing team! 
            We'd love to show you why families choose us for their children's care.
          </p>
          <div className="flex gap-6 justify-center flex-wrap">
            <a href="/contact" className="btn btn-accent btn-lg">
              <span className="text-xl mr-2"><Image src="/Emojis/Calendar_emoji-Photoroom.png" alt="Calendar Emoji" width={30} height={30} className="inline-block align-middle" /></span>
              Schedule a Tour
            </a>
            <a href="/program" className="btn btn-outline btn-lg border-primary-content text-primary-content hover:bg-primary-content hover:text-primary">
              <span className="text-xl mr-2"><Image src="/Emojis/Programs_emoji-Photoroom.png" alt="Programs Emoji" width={30} height={30} className="inline-block align-middle" /></span>
              View Programs
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}