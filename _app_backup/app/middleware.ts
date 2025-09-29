
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    
    // Allow access to public routes
    const publicRoutes = [
      "/",
      "/auth/login",
      "/auth/register",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/api/auth",
      "/favicon.ico",
      "/_next",
      "/public"
    ];

    // Check if the current path is a public route
    const isPublicRoute = publicRoutes.some(route => 
      pathname.startsWith(route)
    );

    if (isPublicRoute) {
      return NextResponse.next();
    }

    // If user is not authenticated and trying to access protected route
    if (!req.nextauth.token) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Allow public routes without authentication
        const publicRoutes = [
          "/",
          "/auth/login",
          "/auth/register",
          "/auth/forgot-password",
          "/auth/reset-password"
        ];

        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true;
        }

        // Allow API routes (they handle their own auth)
        if (pathname.startsWith("/api/")) {
          return true;
        }

        // Require authentication for all other routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
