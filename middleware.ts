   // middleware.ts

import { authMiddleware } from "@clerk/nextjs";

// This example protects all routes including api/trpc routes
// Please edit this to allow other routes to be public as needed.
export default authMiddleware({
  publicRoutes: ["/", "/dashboard/chat"],
  afterAuth(auth, req) {
    // Allow users to access dashboard routes even if not signed in for testing
    if (req.nextUrl.pathname.startsWith('/dashboard')) {
      return;
    }
  },
});

// Stop Middleware running on static files
export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
};
