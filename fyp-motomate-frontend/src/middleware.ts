// middleware.ts (in root directory, not in src)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that should be exempt from the review check
const EXEMPT_PATHS = [
  '/api/',
  '/login',
  '/signup',
  '/customer/reviews',
  '/_next',
  '/favicon.ico',
  '/assets',
  '/images',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only run middleware on customer paths
  if (!pathname.startsWith('/customer/')) {
    return NextResponse.next();
  }
  
  // Skip middleware for exempt paths
  if (EXEMPT_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Check for authentication token
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    return NextResponse.next();
  }

  try {
    // Make a request to check for pending reviews
    const baseUrl = request.nextUrl.origin;
    const response = await fetch(`${baseUrl}/api/Reviews/PendingReviews`, {
      headers: {
        'Cookie': `auth_token=${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      return NextResponse.next();
    }

    const data = await response.json();
    
    // If there are pending reviews, redirect to the reviews page
    if (data.pendingReviewCount && data.pendingReviewCount > 0) {
      const reviewsUrl = new URL('/customer/reviews', request.url);
      reviewsUrl.searchParams.set('forced', 'true');
      return NextResponse.redirect(reviewsUrl);
    }
  } catch (error) {
    console.error('Error in middleware:', error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/customer/:path*'],
};