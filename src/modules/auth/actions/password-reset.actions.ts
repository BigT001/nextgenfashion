"use server";

import { PasswordResetService } from "../services/password-reset.service";
import { PasswordResetQueries } from "../queries/password-reset.queries";
import { NotificationService } from "@/services/notification.service";

/**
 * LAYER 2 — PASSWORD RESET ACTIONS
 * Server actions orchestrate the 3-step reset flow.
 */

/**
 * STEP 1: Request a password reset OTP.
 * Always returns a generic success message to prevent email enumeration.
 */
export async function requestPasswordResetAction(email: string) {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Look up user — but don't reveal whether they exist
    const user = await PasswordResetQueries.findUserByEmail(normalizedEmail);

    if (user) {
      const otp = PasswordResetService.generateOtp();
      const expires = PasswordResetService.getOtpExpiry();

      // Store OTP (upsert replaces any existing token)
      await PasswordResetQueries.upsertToken(normalizedEmail, otp, expires);

      // Fire-and-forget the email (non-blocking)
      NotificationService.sendPasswordResetOtpEmail({
        email: normalizedEmail,
        name: user.name || "Team Member",
        otp,
      }).catch((err) => console.error("[PASSWORD_RESET] Email send failed:", err));
    }

    // Always return success — prevents email enumeration attacks
    return {
      success: true,
      message: "If an account exists for this email, a reset code has been sent.",
    };
  } catch (error: any) {
    console.error("[PASSWORD_RESET] requestPasswordResetAction error:", error);
    return { success: false, error: "Failed to process request. Please try again." };
  }
}

/**
 * STEP 2: Verify an OTP code (without consuming it yet).
 * Used to validate the code before showing the new-password form.
 */
export async function verifyOtpAction(email: string, otp: string) {
  try {
    const normalizedEmail = email.toLowerCase().trim();
    const record = await PasswordResetQueries.findValidToken(normalizedEmail, otp.trim());

    if (!record) {
      return { success: false, error: "Invalid or expired code. Please request a new one." };
    }

    return { success: true };
  } catch (error: any) {
    console.error("[PASSWORD_RESET] verifyOtpAction error:", error);
    return { success: false, error: "Verification failed. Please try again." };
  }
}

/**
 * STEP 3: Reset the password after OTP is verified.
 * Re-validates OTP, hashes the new password, writes it, and cleans up the token.
 */
export async function resetPasswordAction(
  email: string,
  otp: string,
  newPassword: string
) {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Validate password strength server-side
    const validation = PasswordResetService.validatePassword(newPassword);
    if (!validation.valid) {
      return { success: false, error: validation.message };
    }

    // Re-validate OTP (replay protection — token is deleted immediately after)
    const record = await PasswordResetQueries.findValidToken(normalizedEmail, otp.trim());
    if (!record) {
      return { success: false, error: "Invalid or expired code. Please restart the process." };
    }

    // Hash and save the new password
    const hashed = await PasswordResetService.hashPassword(newPassword);
    await PasswordResetQueries.updatePassword(normalizedEmail, hashed);

    // Invalidate the token immediately (no replay)
    await PasswordResetQueries.deleteTokensForEmail(normalizedEmail);

    // Write audit log
    const { prisma } = await import("@/services/prisma.service");
    const { randomUUID } = await import("crypto");
    const user = await PasswordResetQueries.findUserByEmail(normalizedEmail);
    if (user) {
      await prisma.auditLog.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          action: "PASSWORD_RESET_SELF",
          entity: "User",
          entityId: user.id,
          details: { method: "otp_email", email: normalizedEmail },
        },
      });
    }

    return { success: true, message: "Password reset successfully. You can now sign in." };
  } catch (error: any) {
    console.error("[PASSWORD_RESET] resetPasswordAction error:", error);
    return { success: false, error: "Failed to reset password. Please try again." };
  }
}
