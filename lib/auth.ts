import GoogleProvider from "next-auth/providers/google";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

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
        [user.email, user.email, user.name, user.image]
      );

      return true;
    },

    async redirect({ baseUrl }: any) {
      return baseUrl;
    },

    async session({ session }: any) {
      if (session.user?.email) {
        session.user.id = session.user.email;
      }
      return session;
    },
  },
};
