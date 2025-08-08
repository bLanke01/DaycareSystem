// app/page.js
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <div className="hero min-h-[80vh] bg-gradient-to-br from-primary/20 to-secondary/15">
        <div className="hero-content flex-col lg:flex-row-reverse gap-8 max-w-7xl">
          <div className="lg:w-1/2">
            {/* Image Carousel */}
            <div className="carousel w-full h-[450px] rounded-2xl shadow-2xl">
              <div id="slide1" className="carousel-item relative w-full">
                <Image
                  src="/a11.jpg"
                  alt="Happy children playing at TinyLog daycare"
                  fill
                  className="object-cover rounded-2xl"
                />
                <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                  <a href="#slide5" className="btn btn-circle btn-sm opacity-75 hover:opacity-100">❮</a>
                  <a href="#slide2" className="btn btn-circle btn-sm opacity-75 hover:opacity-100">❯</a>
                </div>
              </div>
              <div id="slide2" className="carousel-item relative w-full">
                <Image
                  src="/a12.jpg"
                  alt="Children learning and having fun at TinyLog"
                  fill
                  className="object-cover rounded-2xl"
                />
                <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                  <a href="#slide1" className="btn btn-circle btn-sm opacity-75 hover:opacity-100">❮</a>
                  <a href="#slide3" className="btn btn-circle btn-sm opacity-75 hover:opacity-100">❯</a>
                </div>
              </div>
              <div id="slide3" className="carousel-item relative w-full">
                <Image
                  src="/a13.jpg"
                  alt="Safe and nurturing environment at TinyLog"
                  fill
                  className="object-cover rounded-2xl"
                />
                <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                  <a href="#slide2" className="btn btn-circle btn-sm opacity-75 hover:opacity-100">❮</a>
                  <a href="#slide4" className="btn btn-circle btn-sm opacity-75 hover:opacity-100">❯</a>
                </div>
              </div>
              <div id="slide4" className="carousel-item relative w-full">
                <Image
                  src="/a14.jpg"
                  alt="Creative activities and learning at TinyLog"
                  fill
                  className="object-cover rounded-2xl"
                />
                <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                  <a href="#slide3" className="btn btn-circle btn-sm opacity-75 hover:opacity-100">❮</a>
                  <a href="#slide5" className="btn btn-circle btn-sm opacity-75 hover:opacity-100">❯</a>
                </div>
              </div>
              <div id="slide5" className="carousel-item relative w-full">
                <Image
                  src="/a15.jpg"
                  alt="Children enjoying outdoor activities at TinyLog"
                  fill
                  className="object-cover rounded-2xl"
                />
                <div className="absolute flex justify-between transform -translate-y-1/2 left-5 right-5 top-1/2">
                  <a href="#slide4" className="btn btn-circle btn-sm opacity-75 hover:opacity-100">❮</a>
                  <a href="#slide1" className="btn btn-circle btn-sm opacity-75 hover:opacity-100">❯</a>
                </div>
              </div>
            </div>
            
            {/* Carousel Indicators */}
            <div className="flex justify-center w-full py-4 gap-2">
              <a href="#slide1" className="btn btn-xs btn-circle">1</a>
              <a href="#slide2" className="btn btn-xs btn-circle">2</a>
              <a href="#slide3" className="btn btn-xs btn-circle">3</a>
              <a href="#slide4" className="btn btn-xs btn-circle">4</a>
              <a href="#slide5" className="btn btn-xs btn-circle">5</a>
            </div>
          </div>
          
          <div className="lg:w-1/2 text-center lg:text-left">
            <div className="inline-block mb-4">
              <span className="text-2xl">🌟</span>
              <span className="badge badge-primary badge-lg ml-2">Spring Enrollment Open!</span>
            </div>
            <h1 className="text-6xl font-bold text-primary mb-4">
              Welcome to 
              <span className="text-secondary"> TinyLog </span>
              Where Little Dreams Come to Life! 
              <span className="text-4xl">🌈</span>
            </h1>
                          <p className="py-6 text-xl text-base-content leading-relaxed">
              Give your child the perfect start with our nurturing daycare! TinyLog provides a safe, 
              fun, and educational environment where children ages 6 months to 12 years can 
              grow, learn, and make lasting friendships. 
              <span className="font-semibold text-primary">✨ Every day is an adventure!</span>
            </p>
            
            {/* Key Features */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">👶</span>
                <span className="font-medium">Ages 6mo - 12yr</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🏫</span>
                <span className="font-medium">Licensed & Insured</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🍎</span>
                <span className="font-medium">Healthy Meals</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">📚</span>
                <span className="font-medium">Learning Programs</span>
              </div>
            </div>
            
            <div className="flex gap-4 flex-wrap justify-center lg:justify-start">
              <Link href="/program">
                <button className="btn btn-primary btn-lg">
                  <span className="text-xl mr-2">🎯</span>
                  Enroll Today!
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75" />
                  </svg>
                </button>
              </Link>
              <Link href="/contact">
                <button className="btn btn-secondary btn-lg">
                  <span className="text-xl mr-2">🏠</span>
                  Schedule Tour
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 17.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="py-20 bg-gradient-to-br from-base-200 to-base-300">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-primary mb-4">
              Why Families Love TinyLog! <span className="text-4xl">💕</span>
            </h2>
            <p className="text-xl text-base-content max-w-3xl mx-auto">
              We're more than just a daycare - we're a second home where your child's 
              happiness and development come first at TinyLog!
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature Card 1 */}
            <div className="card bg-gradient-to-br from-secondary/15 to-accent/10 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="card-body text-center">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="card-title text-primary justify-center text-xl">Creative Learning</h3>
                <p className="text-base-content">Art, music, and hands-on activities that spark imagination and creativity in every child.</p>
              </div>
            </div>
            
            {/* Feature Card 2 */}
            <div className="card bg-gradient-to-br from-primary/10 to-neutral/15 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="card-body text-center">
                <div className="text-6xl mb-4">🛡️</div>
                <h3 className="card-title text-primary justify-center text-xl">Safe & Secure</h3>
                <p className="text-base-content">State-of-the-art security, trained staff, and child-proofed facilities for complete peace of mind.</p>
              </div>
            </div>
            
            {/* Feature Card 3 */}
            <div className="card bg-gradient-to-br from-accent/12 to-primary/8 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="card-body text-center">
                <div className="text-6xl mb-4">🍎</div>
                <h3 className="card-title text-primary justify-center text-xl">Healthy Nutrition</h3>
                <p className="text-base-content">Fresh, nutritious meals and snacks prepared daily to fuel growing minds and bodies.</p>
              </div>
            </div>

            {/* Feature Card 4 */}
            <div className="card bg-gradient-to-br from-neutral/12 to-secondary/10 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="card-body text-center">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="card-title text-primary justify-center text-xl">Professional Staff</h3>
                <p className="text-base-content">Certified early childhood educators who truly care about your child's growth and happiness.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-6">
            Ready to Join the TinyLog Family? <span className="text-4xl">🤗</span>
          </h2>
          <p className="text-2xl mb-8 opacity-90">
            Spaces are limited! Secure your child's spot in our loving TinyLog community today.
          </p>
          <div className="flex gap-6 justify-center flex-wrap">
            <Link href="/auth/signup">
              <button className="btn btn-accent btn-lg text-lg px-8">
                <span className="text-2xl mr-2">🚀</span>
                Get Started Now
              </button>
            </Link>
            <Link href="/contact">
              <button className="btn btn-outline btn-lg text-lg px-8 text-primary-content border-primary-content hover:bg-primary-content hover:text-primary">
                <span className="text-2xl mr-2">📞</span>
                Call Us Today
              </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}