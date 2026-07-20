import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "@/lib/db";
import crypto from "crypto";
import { AuthOptions } from "next-auth";

// ===============================
// SECURE PASSWORD HASHING UTILITIES
// ===============================
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedValue: string): boolean {
  const parts = storedValue.split(":");
  if (parts.length !== 2) return false;
  const [salt, originalHash] = parts;
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return hash === originalHash;
}

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
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter both email and password.");
        }

        const res = await pool.query(
          "SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1",
          [credentials.email.trim()]
        );

        const user = res.rows[0];

        if (!user) {
          throw new Error("No account found with this email.");
        }

        if (!user.password_hash) {
          throw new Error("This account is registered via Google sign-in.");
        }

        const isValid = verifyPassword(credentials.password, user.password_hash);
        if (!isValid) {
          throw new Error("Incorrect password. Please try again.");
        }

        return {
          id: user.email,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt", // Required to support both OAuth and Credentials strategies concurrently
  },

  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user, account }: any) {
      if (!user.email) return false;

      // Only perform database insert/update for Google logins
      if (account.provider === "google") {
        await pool.query(
          `
          INSERT INTO users (id, email, name, image)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (email)
          DO UPDATE SET
            name = EXCLUDED.name,
            image = EXCLUDED.image
          `,
          [user.email, user.email, user.name, user.image]
        );
      }

      return true;
    },

    async redirect({ baseUrl }: any) {
      // Redirect users to the dashboard home page after logging in successfully
      return `${baseUrl}/dashboard`;
    },

    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },

  pages: {
    signIn: "/",
  },
};