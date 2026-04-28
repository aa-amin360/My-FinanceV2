import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ✅ STEP 1: Export authOptions (THIS WAS MISSING)
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user }: any) {
      if (!user.email) return false;

      await pool.query(
        `
        INSERT INTO users (id, email, name, image)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (email)
        DO UPDATE SET
          name = EXCLUDED.name,
          image = EXCLUDED.image
        `,
        [
          user.email,
          user.email,
          user.name,
          user.image,
        ]
      );

      return true;
    },
  },
};

// ✅ STEP 2: Use authOptions in NextAuth
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
