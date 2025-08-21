'use client';

import { useSearchParams } from 'next/navigation';
import ResetPasswordForm from '../../components/auth/ResetPasswordForm';

export default function ResetPassword() {
  const searchParams = useSearchParams();
  const userType = searchParams.get('type');
  
  // If no user type is specified, redirect to auth landing page
  if (!userType) {
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
    return null;
  }
  
  return (
    <div className="auth-page">
      <div className="auth-page-title">
      </div>
      <div className="auth-container">
        <ResetPasswordForm />
      </div>
    </div>
  );
}
