import { randomInt } from "crypto";
import bcrypt from "bcryptjs";

/**
 * LAYER 3 — PASSWORD RESET SERVICE
 * Pure business logic. No DB access, no UI. RULE 3 compliant.
 */
export class PasswordResetService {
  private static readonly BCRYPT_COST = 12;
  private static readonly OTP_LENGTH = 6;
  private static readonly OTP_EXPIRY_MINUTES = 15;

  /**
   * Generate a cryptographically random 6-digit OTP string.
   */
  static generateOtp(): string {
    // randomInt is cryptographically secure (Node.js crypto module)
    const otp = randomInt(100000, 999999);
    return otp.toString();
  }

  /**
   * Calculate the expiry date for an OTP (now + 15 minutes).
   */
  static getOtpExpiry(): Date {
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + this.OTP_EXPIRY_MINUTES);
    return expires;
  }

  /**
   * Hash a plaintext password with bcrypt at cost 12.
   */
  static async hashPassword(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, this.BCRYPT_COST);
  }

  /**
   * Validate password requirements.
   * Relaxed to allow any password >= 6 characters for better accessibility.
   * Returns { valid: true } or { valid: false, message: string }
   */
  static validatePassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 6) {
      return { valid: false, message: "Password must be at least 6 characters." };
    }
    return { valid: true };
  }

  /**
   * Calculate password strength score (0-4) for UI feedback.
   */
  static getPasswordStrength(password: string): 0 | 1 | 2 | 3 | 4 {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  }
}
