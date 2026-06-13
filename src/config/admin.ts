import type { AuthUser } from "@/types";

export const ADMIN_EMAILS = [
  "admin@sayhi.local"
];

export function isAdminUser(user: AuthUser | null | undefined) {
  if (!user) return false;
  if (user.role === "admin") return true;
  return ADMIN_EMAILS.includes(user.email.trim().toLowerCase());
}
