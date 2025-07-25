// app/components/layout/Footer.js
import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const quickLinks = [
    { href: '/', label: 'Home', emoji: '🏠' },
    { href: '/about', label: 'About Us', emoji: '🌟' },
    { href: '/program', label: 'Our Programs', emoji: '📚' },
    { href: '/location', label: 'Location', emoji: '📍' },
    { href: '/contact', label: 'Contact Us', emoji: '📞' },
    { href: '/faq', label: 'FAQ', emoji: '❓' }
  ];

  const programs = [
    { href: '/program#infant', label: 'Infant Care', emoji: '👶', age: '6-18 months' },
    { href: '/program#toddler', label: 'Toddler Program', emoji: '🧸', age: '18mo-3yr' },
    { href: '/program#preschool', label: 'Preschool', emoji: '🎨', age: '3-5 years' },
    { href: '/program#afterschool', label: 'After-School', emoji: '📖', age: '5-12 years' }
  ];

  const socialLinks = [
    { href: '#', icon: '📘', label: 'Facebook', color: 'hover:text-blue-600' },
    { href: '#', icon: '📷', label: 'Instagram', color: 'hover:text-pink-600' },
    { href: '#', icon: '🐦', label: 'Twitter', color: 'hover:text-blue-400' },
    { href: '#', icon: '▶️', label: 'YouTube', color: 'hover:text-red-600' }
  ];
  
  return (
    <footer className="bg-gradient-to-br from-slate-50 to-blue-50 text-gray-700">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-16 h-16 rounded-xl overflow-hidden shadow-xl">
                  <Image
                    src="/TinyLog_LOGO.png"
                    alt="TinyLog"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center text-sm animate-pulse">
                  ✨
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  TinyLog
                </h2>
                <p className="text-sm text-gray-500">Daycare & Learning Center</p>
              </div>
            </div>
            
            <p className="text-gray-600 leading-relaxed">
              Nurturing young minds and hearts since 2020. We provide a safe, loving, and educational 
              environment where children can grow, learn, and make lifelong memories at TinyLog.
            </p>

            {/* Owner Info */}
            <div className="p-4 bg-primary/5 rounded-lg">
              <h3 className="font-semibold text-primary mb-2">Owner & Director</h3>
              <p className="text-gray-700 font-medium">Francesca Kella</p>
              <p className="text-sm text-gray-600">Dedicated to exceptional childcare</p>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="font-semibold text-primary mb-3 flex items-center">
                <span className="mr-2">🌐</span>
                Follow Our Journey
              </h3>
              <div className="flex space-x-3">
                {socialLinks.map((social, index) => (
                  <a 
                    key={index}
                    href={social.href}
                    className={`text-2xl transition-all duration-200 hover:scale-110 ${social.color}`}
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg text-primary mb-6 flex items-center">
              <span className="mr-2">🔗</span>
              Quick Links
            </h3>
            <div className="space-y-3">
              {quickLinks.map((link) => (
                <Link 
                  key={link.href}
                  href={link.href} 
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors duration-200 group"
                >
                  <span className="group-hover:scale-110 transition-transform duration-200">{link.emoji}</span>
                  <span className="hover:underline">{link.label}</span>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Programs */}
          <div>
            <h3 className="font-bold text-lg text-primary mb-6 flex items-center">
              <span className="mr-2">🎯</span>
              Our Programs
            </h3>
            <div className="space-y-3">
              {programs.map((program) => (
                <Link 
                  key={program.href}
                  href={program.href} 
                  className="block group"
                >
                  <div className="flex items-center space-x-2 text-gray-600 hover:text-primary transition-colors duration-200">
                    <span className="group-hover:scale-110 transition-transform duration-200">{program.emoji}</span>
                    <div>
                      <span className="hover:underline font-medium">{program.label}</span>
                      <p className="text-xs text-gray-500">{program.age}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Contact Info */}
          <div>
            <h3 className="font-bold text-lg text-primary mb-6 flex items-center">
              <span className="mr-2">📍</span>
              Get in Touch
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <span className="text-2xl">🏠</span>
                <div>
                  <p className="font-semibold">Visit Us</p>
                  <address className="not-italic text-gray-600 text-sm leading-relaxed">
                    21 Everdige Court SW<br />
                    Calgary, Alberta
                  </address>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📞</span>
                <div>
                  <p className="font-semibold">Call Us</p>
                  <a href="tel:+14035425531" className="text-primary hover:underline">
                    (403) 542-5531
                  </a>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📧</span>
                <div>
                  <p className="font-semibold">Email Us</p>
                  <a href="mailto:cleanworld2661@gmail.com" className="text-primary hover:underline break-all text-sm">
                    cleanworld2661@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="text-2xl">🕐</span>
                <div>
                  <p className="font-semibold">Hours</p>
                  <p className="text-gray-600 text-sm">
                    Mon-Fri: 7:00 AM - 6:00 PM<br />
                    Weekends: Closed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-primary mb-4">
              <span className="mr-2">📧</span>
              Stay Connected with TinyLog!
            </h3>
            <p className="text-gray-600 mb-6">
              Get updates on events, activities, and important announcements delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email address"
                className="input input-bordered flex-1 focus:input-primary"
              />
              <button className="btn bg-gradient-to-r from-primary to-secondary text-white border-none hover:shadow-lg">
                <span className="mr-2">🚀</span>
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Footer */}
      <div className="bg-white border-t border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">©️</span>
              <p className="text-gray-600">
                {currentYear} TinyLog Daycare. Made with 
                <span className="text-red-500 mx-1">❤️</span>
                for children and families.
              </p>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link href="/privacy" className="text-gray-500 hover:text-primary transition-colors text-sm flex items-center">
                <span className="mr-1">🔐</span>
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-500 hover:text-primary transition-colors text-sm flex items-center">
                <span className="mr-1">📋</span>
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;