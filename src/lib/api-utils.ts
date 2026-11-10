import type { UserRole } from "@prisma/client";

/**
 * Parse ?limit= and ?offset= safely. Non-numeric or out-of-range values fall
 * back to sane bounds instead of passing NaN / negatives to Prisma take/skip.
 */
export function parsePagination(searchParams: URLSearchParams): {
  limit: number;
  offset: number;
} {
  const rawLimit = parseInt(searchParams.get("limit") || "20", 10);
  const limit = Number.isNaN(rawLimit) ? 20 : Math.min(100, Math.max(1, rawLimit));
  const rawOffset = parseInt(searchParams.get("offset") || "0", 10);
  const offset = Number.isNaN(rawOffset) ? 0 : Math.max(0, rawOffset);
  return { limit, offset };
}

/** Staff roles that may see all records and manage consignment logistics. */
export function isStaff(role: UserRole | undefined | null): boolean {
  return role === "THERMOPLUS_ADMIN" || role === "AUDITOR";
}
