import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { verifyToken } from "./supabase";

export type User = {
  id: string;
  email?: string;
  role?: string;
};

export async function createContext({ req, res }: CreateExpressContextOptions) {
  const authHeader = req.headers.authorization;
  let user: User | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const verifiedUser = await verifyToken(token);
    if (verifiedUser) {
      user = verifiedUser;
    }
  }

  return { req, res, user };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
