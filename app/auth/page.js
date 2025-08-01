// app/auth/page.js
import UserTypeSelection from '../components/auth/UserTypeSelection';
import Image from 'next/image';

export default function AuthLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/15 to-neutral/20 flex flex-col items-center justify-center p-4">
      {/* Header Section */}
      <div className="text-center mb-16">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-xl bg-base-100 p-3">
              <Image
                src="/TinyLog_LOGO.png"
                alt="TinyLog"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* Welcome Text */}
        <h1 className="text-5xl font-bold text-primary mb-6">
          Welcome to TinyLog
        </h1>
        <p className="text-xl text-base-content max-w-3xl mx-auto leading-relaxed mb-8">
          Your trusted daycare management system where families and staff connect seamlessly
        </p>
        
        {/* Subtitle */}
        <div className="badge badge-primary badge-lg">
          Secure Access Portal
        </div>
      </div>

      {/* User Type Selection Card */}
      <div className="card bg-base-100 shadow-2xl w-full max-w-4xl">
        <div className="card-body p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primary mb-4">
              Choose Your Access
            </h2>
            <p className="text-lg text-base-content">
              Select how you would like to sign in to TinyLog
            </p>
          </div>
          
          <UserTypeSelection />
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center mt-12">
        <p className="text-sm text-base-content/90">
          Need help? Contact us at{' '}
          <a href="tel:+14035425531" className="text-primary hover:underline">
            (403) 542-5531
          </a>
        </p>
      </div>
    </div>
  );
}