import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    /*
      Protect everything except:
      - api/auth (next-auth)
      - login page
      - static files
    */
    "/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)",
  ],
};
