import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/", // Redirect unauthenticated users back to your root Landing Page
  },
});

export const config = {
  matcher: [
    // Protect all private internal financial app routes
    "/dashboard/:path*",
    "/transactions/:path*",
    "/categories/:path*",
    "/debts/:path*",
    "/receivables/:path*",
    "/reports/:path*",
    "/savings/:path*",
    "/calendar/:path*",
    "/add-history/:path*",
    "/onboarding/:path*",
  ],
};
