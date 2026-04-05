import { createHash } from "crypto";

/**
 * Convert any string (e.g. Google user ID) to a deterministic UUID v4-shaped string.
 * Used everywhere storage is accessed so the key is always consistent.
 */
export function toUUID(str: string): string {
  const hash = createHash("md5").update(str).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}-${hash.slice(16, 20)}-${hash.slice(20, 32)}`;
}
