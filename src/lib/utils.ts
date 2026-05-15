import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * SERIALIZE — Server→Client Boundary Sanitizer
 * Converts Prisma Decimal, Date, and other non-plain objects into
 * JSON-safe primitives before passing data to Client Components.
 * Must be applied at the Service layer on every data boundary crossing.
 */
export function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}
