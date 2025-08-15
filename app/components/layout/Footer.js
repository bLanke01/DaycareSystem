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
    { href: '#', icon: '📘', label: 'Facebook', color: 'hover:text-info' },
    { href: '#', icon: '📷', label: 'Instagram', color: 'hover:text-secondary' },
    { href: '#', icon: '🐦', label: 'Twitter', color: 'hover:text-accent' },
    { href: '#', icon: '▶️', label: 'YouTube', color: 'hover:text-error' }
  ];
  
  return (
    <footer className="bg-gradient-to-br from-base-200 to-primary/10 text-base-content">
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
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-warning rounded-full flex items-center justify-center text-sm animate-pulse">
                  ✨
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  TinyLog
                </h2>
                <p className="text-sm text-base-content">Daycare & Learning Center</p>
              </div>
            </div>
            
            <p className="text-base-content leading-relaxed">
              Nurturing young minds and hearts since 2020. We provide a safe, loving, and educational 
              environment where children can grow, learn, and make lifelong memories at TinyLog.
            </p>

            {/* Owner Info */}
            <div className="p-4 bg-primary/5 rounded-lg">
              <h3 className="font-semibold text-primary mb-2">Owner & Director</h3>
              <p className="text-base-content font-medium">Francesca Kella</p>
              <p className="text-sm text-base-content">Dedicated to exceptional childcare</p>
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
                  className="flex items-center space-x-2 text-base-content hover:text-primary transition-colors duration-200 group"
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
                  <div className="flex items-center space-x-2 text-base-content hover:text-primary transition-colors duration-200">
                    <span className="group-hover:scale-110 transition-transform duration-200">{program.emoji}</span>
                    <div>
                      <span className="hover:underline font-medium">{program.label}</span>
                      <p className="text-xs text-base-content/90">{program.age}</p>
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
                  <address className="not-italic text-base-content text-sm leading-relaxed">
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
                  <p className="text-base-content text-sm">
                    Mon-Fri: 7:00 AM - 6:00 PM<br />
                    Weekends: Closed
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      
      {/* Bottom Footer */}
      <div className="bg-base-100 border-t border-base-300 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">©️</span>
              <p className="text-base-content">
                {currentYear} TinyLog Daycare. Made with 
                <span className="text-error mx-1">❤️</span>
                for children and families.
              </p>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link href="/privacy" className="text-base-content/90 hover:text-primary transition-colors text-sm flex items-center">
                <span className="mr-1">🔐</span>
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-base-content/90 hover:text-primary transition-colors text-sm flex items-center">
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