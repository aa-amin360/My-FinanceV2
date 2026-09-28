import { DefaultSession } from "next-auth";

// Extend the default NextAuth Session user interface to include our custom UUID ID field
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
