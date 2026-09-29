import { getServerSession } from "next-auth";
import { authOptions } from "@/backend/auth/authOptions";
import { AppError } from "@/backend/http/AppError";

// Resolve the signed-in user's database UUID or throw a 401
export async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    throw new AppError("Unauthorized", 401);
  }

  return userId;
}
