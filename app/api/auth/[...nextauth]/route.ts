import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async signIn({ user }) {
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
});

export { handler as GET, handler as POST };
