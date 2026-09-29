import pool from "@/backend/db/pool";
import { hashPassword, verifyPassword } from "@/backend/auth/password";
import { AppError } from "@/backend/http/AppError";
import { findUserByEmail, insertPasswordUser, updatePasswordHash } from "@/backend/repositories/users";

export async function signUp({ name, email, password }: { name: string; email: string; password: string }) {
  const userId = await insertPasswordUser(pool, { email, name, passwordHash: await hashPassword(password) });
  if (!userId) {
    throw new AppError("An account with this email already exists.", 409);
  }
  return userId;
}

// Check email/password. Returns the user or null; never says which part was wrong.
export async function verifyCredentials(email: string, password: string) {
  const user = await findUserByEmail(pool, email);
  if (!user?.password_hash) return null;

  const { valid, needsRehash } = await verifyPassword(password, user.password_hash);
  if (!valid) return null;

  // Transparently upgrade hashes created with the old, weaker settings
  if (needsRehash) {
    await updatePasswordHash(pool, user.id, await hashPassword(password));
  }

  return { id: user.id, email: user.email, name: user.name, image: user.image };
}
