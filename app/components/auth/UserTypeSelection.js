// components/auth/UserTypeSelection.js
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

const UserTypeSelection = () => {
  const router = useRouter();

  const handleLoginAsCustomer = () => {
    router.push('/auth/login?type=parent');
  };

  const handleSignupAsCustomer = () => {
    router.push('/auth/signup?type=parent');
  };

  const handleLoginAsStaff = () => {
    router.push('/auth/login?type=admin');
  };

  const handleSignupAsStaff = () => {
    alert('Admin accounts can only be created by existing administrators. Please contact Francesca for assistance.');
  };

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Parent Access Card */}
      <div className="card bg-gradient-to-br from-secondary/15 to-primary/10 border border-primary/20">
        <div className="card-body text-center p-8 flex flex-col h-full">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-2xl font-bold">P</span>
          </div>
          <h3 className="text-2xl font-bold text-primary mb-4">Parent Access</h3>
          <p className="text-base-content mb-8 leading-relaxed flex-grow">
            For parents and guardians to manage their children's daycare experience
          </p>
          
          {/* Spacer div to push buttons to bottom */}
          <div className="flex-grow"></div>
          
          <div className="flex flex-col gap-3">
            <button 
              className="btn btn-primary w-full btn-lg"
              onClick={handleLoginAsCustomer}
            >
              Log in as Parent
            </button>
            <button 
              className="btn btn-outline btn-secondary w-full btn-lg"
              onClick={handleSignupAsCustomer}
            >
              Sign up as Parent
            </button>
          </div>
        </div>
      </div>
      
      {/* Staff/Admin Access Card */}
      <div className="card bg-gradient-to-br from-base-300 to-accent/10 border border-accent/20">
        <div className="card-body text-center p-8 flex flex-col h-full">
          <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-2xl font-bold">S</span>
          </div>
          <h3 className="text-2xl font-bold text-primary mb-4">Staff/Admin Access</h3>
          <p className="text-base-content mb-6 leading-relaxed">
            For daycare staff and administrators to manage operations
          </p>
          
          {/* Info box moved above buttons */}
          <div className="mb-6 p-4 bg-info/10 rounded-lg">
            <p className="text-sm text-base-content/90">
              Admin accounts are pre-created by Francesca
            </p>
          </div>
          
          {/* Spacer div to push buttons to bottom */}
          <div className="flex-grow"></div>
          
          <div className="flex flex-col gap-3">
            <button 
              className="btn btn-primary w-full btn-lg"
              onClick={handleLoginAsStaff}
            >
              Log in as Staff
            </button>
            <button 
              className="btn btn-disabled w-full btn-lg"
              onClick={handleSignupAsStaff}
              title="Admin accounts can only be created by existing administrators"
            >
              Sign up as Staff
            </button>
          </div>
        </div>
      </div>
      
      {/* Password Reset Section */}
      <div className="text-center mt-8">
        <div className="divider">Need Help?</div>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/auth/reset-password?type=parent" className="link link-primary hover:underline">
            Reset Parent Password
          </Link>
          <span className="text-base-content/60">•</span>
          <Link href="/auth/reset-password?type=admin" className="link link-primary hover:underline">
            Reset Staff Password
          </Link>
          <span className="text-base-content/60">•</span>
          <Link href="/auth/resend-verification" className="link link-primary hover:underline">
            Resend Verification Email
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UserTypeSelection;