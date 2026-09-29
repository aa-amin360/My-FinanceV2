import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import type { AuthOptions } from "next-auth";
import pool from "@/backend/db/pool";
import { clientIp, rateLimit, tooManyAttemptsMessage } from "@/backend/auth/rateLimit";
import { findUserByEmail, upsertGoogleUser } from "@/backend/repositories/users";
import { verifyCredentials } from "@/backend/services/auth";

const INVALID_CREDENTIALS = "Invalid email or password.";
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

// ==============================
// NEXTAUTH CONFIGURATION OPTIONS
// ==============================
export const authOptions: AuthOptions = {
  providers: [
    // 1. Google Provider Configuration
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),

    // 2. Credentials Provider Configuration
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password;

        if (!email || !password) {
          throw new Error("Please enter both email and password.");
        }

        // Throttle per account and per client address to slow down guessing
        const ip = clientIp(req?.headers);
        const byAccount = rateLimit(`login:email:${email}`, 10, LOGIN_WINDOW_MS);
        const byIp = rateLimit(`login:ip:${ip}`, 30, LOGIN_WINDOW_MS);
        if (!byAccount.ok || !byIp.ok) {
          throw new Error(
            tooManyAttemptsMessage(Math.max(byAccount.retryAfterSeconds, byIp.retryAfterSeconds))
          );
        }

        // Same message for unknown email, Google-only account and wrong password
        // so the form cannot be used to discover which emails are registered.
        const user = await verifyCredentials(email, password);
        if (!user) {
          throw new Error(INVALID_CREDENTIALS);
        }
        return user;
      },
    }),
  ],

  session: {
    strategy: "jwt", // Required to support both OAuth and Credentials strategies concurrently
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user, account }) {
      if (!user.email) return false;

      // Only Google logins create/update the user row here
      if (account?.provider === "google") {
        await upsertGoogleUser(pool, { email: user.email, name: user.name, image: user.image });
      }

      return true;
    },

    // Honour same-origin callback URLs (e.g. signOut -> "/"), default to the dashboard
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        // fall through to the default
      }
      return `${baseUrl}/dashboard`;
    },

    async jwt({ token, user }) {
      // Bind the user's permanent database UUID to the session token at sign-in
      if (user?.email) {
        const dbUser = await findUserByEmail(pool, user.email);
        if (dbUser) {
          token.id = dbUser.id;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id; // Pass the Postgres UUID to the front-end session object
      }
      return session;
    },
  },

  pages: {
    signIn: "/",
    newUser: "/onboarding", // Redirect brand new social/Google signups directly to the onboarding flow
  },
};
