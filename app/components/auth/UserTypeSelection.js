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
      <div className="card bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-100">
        <div className="card-body text-center p-8">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-2xl font-bold">P</span>
          </div>
          <h3 className="text-2xl font-bold text-primary mb-4">Parent Access</h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            For parents and guardians to manage their children's daycare experience
          </p>
          
          <div className="space-y-4">
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
      <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
        <div className="card-body text-center p-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-white text-2xl font-bold">S</span>
          </div>
          <h3 className="text-2xl font-bold text-primary mb-4">Staff/Admin Access</h3>
          <p className="text-gray-600 mb-8 leading-relaxed">
            For daycare staff and administrators to manage operations
          </p>
          
          <div className="space-y-4">
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
          
          <div className="mt-6 p-4 bg-info/10 rounded-lg">
            <p className="text-sm text-gray-600">
              Admin accounts are pre-created by Francesca
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserTypeSelection;