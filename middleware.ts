import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/product(.*)',
  '/api/product(.*)',
  '/api/header-slider(.*)',
  '/api/offer(.*)',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/customization(.*)',
  '/api/customization(.*)'
]);

const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
  '/profile(.*)',
  '/orders(.*)',
  '/favorites(.*)'
]);

export default clerkMiddleware((auth, req) => {
  // Allow all public routes
  if (isPublicRoute(req)) {
    return;
  }
  
  // For protected routes, require authentication
  if (isProtectedRoute(req)) {
    return auth().protect();
  }
  
  // For other routes (API routes, etc.), allow but don't enforce authentication
  // Individual API routes will handle their own authentication requirements
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};