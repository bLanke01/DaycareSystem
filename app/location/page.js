// app/location/page.js
import Link from 'next/link';
import Image from 'next/image';

export default function Location() {
  const transportOptions = [
    {
      icon: "🚗",
      title: "By Car",
      description: "From Downtown Calgary: Head southwest to Everdige Court SW in the southwest quadrant.",
      details: "Ample free parking available in our dedicated lot with covered areas.",
      time: "20 mins from downtown"
    },
    {
      icon: "🚌",
      title: "Public Transit",
      description: "Bus routes serve the southwest area with connections to Everdige Court.",
      details: "The nearest C-Train station provides easy access to our location.",
      time: "Transit accessible"
    },
    {
      icon: "🚶‍♀️",
      title: "Walking",
      description: "Located in a family-friendly residential neighborhood with sidewalks and safe crossings.",
      details: "Safe walking paths with stroller-friendly routes to nearby parks.",
      time: "Safe & accessible"
    },
    {
      icon: "🚴‍♂️",
      title: "Cycling",
      description: "Bike-friendly residential area with quiet streets leading to our center.",
      details: "Secure bike storage available for staff and visitors.",
      time: "Bike storage provided"
    }
  ];

  const nearbyPlaces = [
    { name: "Evergreen Elementary School", distance: "3 blocks", icon: "🏫" },
    { name: "Evergreen Community Centre", distance: "5 min walk", icon: "🏢" },
    { name: "Fish Creek Provincial Park", distance: "10 min drive", icon: "🌳" },
    { name: "Shawnessy Shopping Centre", distance: "8 min drive", icon: "🛒" },
    { name: "Bow River Pathway", distance: "12 min drive", icon: "🏞️" },
    { name: "Canyon Meadows Library", distance: "7 min drive", icon: "📚" }
  ];

  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <div className="hero min-h-[60vh] bg-gradient-to-r from-primary/20 to-secondary/15">
        <div className="hero-content text-center">
          <div className="max-w-4xl">
            <h1 className="text-6xl font-bold text-primary mb-6">
              Visit TinyLog's Location 
              <span className="text-4xl ml-2">📍🏠</span>
            </h1>
            <p className="text-2xl text-base-content leading-relaxed">
              Conveniently located in the heart of Calgary's southwest community with easy access by car, transit, 
              and walking. Come see our beautiful TinyLog facility in person!
            </p>
          </div>
        </div>
      </div>

      {/* Main Location Info */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Location Details */}
            <div>
              <div className="badge badge-primary badge-lg mb-6">
                <span className="text-xl mr-2">🏢</span>
                Our Address
              </div>
              
              <h2 className="text-4xl font-bold text-primary mb-8">
                Easy to Find, Easy to Love
              </h2>
              
              {/* Address Card */}
              <div className="card bg-gradient-to-br from-secondary/15 to-accent/10 shadow-xl mb-8">
                <div className="card-body">
                  <div className="flex items-start space-x-4">
                    <span className="text-4xl">🏠</span>
                    <div>
                      <h3 className="text-2xl font-bold text-primary mb-2">Visit TinyLog</h3>
                                    <p className="text-xl text-base-content mb-2">21 Everdige Court SW</p>
              <p className="text-xl text-base-content mb-4">Calgary, Alberta</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <a href="tel:+14035425531" className="btn btn-outline btn-sm">
                          <span className="mr-2">📞</span>
                          (403) 542-5531
                        </a>
                        <a href="mailto:cleanworld2661@gmail.com" className="btn btn-outline btn-sm">
                          <span className="mr-2">📧</span>
                          Email Us
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Owner Info Card */}
              <div className="card bg-gradient-to-br from-primary/12 to-secondary/8 shadow-xl mb-8">
                <div className="card-body">
                  <div className="flex items-start space-x-4">
                    <span className="text-4xl">👩‍💼</span>
                    <div>
                      <h3 className="text-2xl font-bold text-primary mb-2">Meet Our Owner</h3>
                      <p className="text-xl text-base-content mb-1">Francesca Kella</p>
                      <p className="text-lg text-secondary mb-4">Daycare Owner & Director</p>
                      <p className="text-base-content">
                        Dedicated to providing exceptional childcare with years of experience 
                        in early childhood education and child development.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hours Card */}
              <div className="card bg-gradient-to-br from-base-300 to-accent/8 shadow-xl">
                <div className="card-body">
                  <div className="flex items-start space-x-4">
                    <span className="text-4xl">🕐</span>
                    <div>
                      <h3 className="text-2xl font-bold text-primary mb-4">Hours of Operation</h3>
                      
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Monday - Friday:</span>
                          <span className="badge badge-success">7:00 AM - 6:00 PM</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Saturday - Sunday:</span>
                          <span className="badge badge-ghost">Closed</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">Statutory Holidays:</span>
                          <span className="badge badge-ghost">Closed</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-info/10 rounded-lg">
                        <p className="text-sm text-base-content/90">
                          <span className="font-semibold">Extended Hours:</span> Available upon request for families with special needs
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Map Placeholder */}
            <div>
              <div className="card bg-base-100 shadow-2xl">
                <div className="card-body p-0">
                  <div className="relative h-[500px] bg-gradient-to-br from-green-100 to-blue-100 rounded-t-2xl overflow-hidden">
                    
                    {/* Map Image Placeholder */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image
                        src="/a14.jpg"
                        alt="TinyLog exterior view"
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <div className="text-center text-white">
                          <div className="text-6xl mb-4">🗺️</div>
                          <h3 className="text-2xl font-bold mb-2">Interactive Map</h3>
                          <p className="text-lg opacity-90">Click for directions</p>
                        </div>
                      </div>
                    </div>

                    {/* Map Overlay with Location Pin */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="animate-bounce">
                        <div className="bg-error text-error-content rounded-full p-3 shadow-lg">
                          <span className="text-2xl">📍</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex gap-3">
                      <a 
                        href="https://maps.google.com/?q=21+Everdige+Court+SW,+Calgary,+Alberta"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary flex-1"
                      >
                        <span className="mr-2">🗺️</span>
                        Get Directions
                      </a>
                      <Link href="/contact">
                        <button className="btn btn-secondary flex-1">
                          <span className="mr-2">📅</span>
                          Book Tour
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transportation Options */}
      <div className="py-16 bg-gradient-to-br from-primary/10 to-secondary/8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-primary mb-4">
              Getting to TinyLog is Easy! <span className="text-3xl">🚗✨</span>
            </h2>
            <p className="text-xl text-base-content max-w-3xl mx-auto">
              Multiple convenient transportation options make drop-off and pick-up simple for busy families.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {transportOptions.map((option, index) => (
              <div key={index} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <div className="card-body">
                  <div className="flex items-start space-x-4">
                    <div className="text-5xl">{option.icon}</div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-primary mb-2">{option.title}</h3>
                                      <p className="text-base-content mb-3">{option.description}</p>
                <p className="text-sm text-base-content/90 mb-3">{option.details}</p>
                      <div className="badge badge-secondary badge-lg">
                        {option.time}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

              {/* Nearby Places */}
        <div className="py-16 bg-gradient-to-br from-base-200 to-neutral/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-primary mb-4">
              Great Southwest Neighborhood! <span className="text-3xl">🏘️❤️</span>
            </h2>
            <p className="text-xl text-base-content">
              We're surrounded by family-friendly amenities and community resources in Calgary's southwest.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nearbyPlaces.map((place, index) => (
              <div key={index} className="card bg-gradient-to-br from-base-300 to-accent/10 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="card-body text-center">
                  <div className="text-4xl mb-3">{place.icon}</div>
                  <h3 className="font-bold text-lg text-primary">{place.name}</h3>
                  <div className="badge badge-outline badge-lg mt-2">
                    {place.distance}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Facility Features */}
      <div className="py-16 bg-gradient-to-br from-primary/8 to-secondary/5">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-primary mb-4">
              Our Facility Features <span className="text-3xl">🏢✨</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body text-center">
                <div className="text-5xl mb-4">🚗</div>
                <h3 className="text-lg font-bold text-primary">Free Parking</h3>
                <p className="text-base-content">Covered parking spots for easy drop-off</p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body text-center">
                <div className="text-5xl mb-4">🔒</div>
                <h3 className="text-lg font-bold text-primary">Secure Entry</h3>
                <p className="text-base-content">Keycard access and security cameras</p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body text-center">
                <div className="text-5xl mb-4">🌳</div>
                <h3 className="text-lg font-bold text-primary">Outdoor Play</h3>
                <p className="text-base-content">Large fenced playground area</p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body text-center">
                <div className="text-5xl mb-4">♿</div>
                <h3 className="text-lg font-bold text-primary">Accessible</h3>
                <p className="text-base-content">Wheelchair accessible entrance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-16 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Visit TinyLog? <span className="text-3xl">🎉</span>
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Come see our beautiful TinyLog facility and meet Francesca and our amazing team! 
            We'd love to show you around and answer any questions you have.
          </p>
          <div className="flex gap-6 justify-center flex-wrap">
            <Link href="/contact">
              <button className="btn btn-accent btn-lg">
                <span className="text-xl mr-2">📅</span>
                Schedule a Tour
              </button>
            </Link>
            <a href="tel:+14035425531" className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-primary">
              <span className="text-xl mr-2">📞</span>
              Call (403) 542-5531
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}