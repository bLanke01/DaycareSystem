'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

const Breadcrumbs = ({ customBreadcrumbs = null, className = "" }) => {
  const pathname = usePathname();
  
  // Generate breadcrumbs from pathname or use custom ones
  const breadcrumbs = useMemo(() => {
    if (customBreadcrumbs) {
      return customBreadcrumbs;
    }

    const pathSegments = pathname.split('/').filter(Boolean);
    
    // Don't show breadcrumbs for main dashboard pages
    if (pathname === '/admin' || pathname === '/parent') {
      return [];
    }
    
    const breadcrumbsArray = [{ label: 'Home', href: '/', isActive: false }];
    
    // Define friendly names for common paths
    const pathNames = {
      'admin': 'Admin',
      'parent': 'Parent',
      'activity-log': 'Activity Log',
      'nap-track': 'Nap Tracking',
      'manage-children': 'My Children',
      'access-codes': 'Access Codes',
      'auth': 'Authentication',
      'admin-setup': 'Admin Setup',
      'children': 'Children',
      'messages': 'Messages',
      'schedules': 'Schedules',
      'meals': 'Meals',
      'invoices': 'Invoices',
      'settings': 'Settings',
      'account': 'Account',
      'help': 'Help',
      'attendance': 'Attendance'
    };

    // Build breadcrumbs from path segments
    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;
      const label = pathNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
      
      breadcrumbsArray.push({
        label,
        href: currentPath,
        isActive: isLast
      });
    });

    return breadcrumbsArray;
  }, [pathname, customBreadcrumbs]);

  // Don't show breadcrumbs if there's only one item or no items
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav 
      className={`text-sm ${className}`} 
      role="navigation" 
      aria-label="Breadcrumb navigation"
    >
      <ol className="flex items-center space-x-1 text-base-content/60">
        {breadcrumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center">
            {index > 0 && (
              <span className="mx-2 text-base-content/40 select-none">/</span>
            )}
            
            {crumb.isActive ? (
              <span 
                className="text-base-content/80 font-medium"
                aria-current="page"
              >
                {crumb.label}
              </span>
            ) : (
              <Link 
                href={crumb.href}
                className="hover:text-primary transition-colors focus:outline-none focus:text-primary rounded-sm"
                aria-label={`Go to ${crumb.label}`}
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumbs; 