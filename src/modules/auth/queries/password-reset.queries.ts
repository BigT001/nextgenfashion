import { prisma } from "@/services/prisma.service";

/**
 * LAYER 4 — PASSWORD RESET QUERIES
 * All VerificationToken and User DB access for the reset flow lives here.
 */
export const PasswordResetQueries = {
  /**
   * Upsert a reset token for a given email (replaces any existing one).
   */
  async upsertToken(email: string, token: string, expires: Date) {
    // Delete any existing token for this identifier first
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    return prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    });
  },

  /**
   * Look up a token and validate it hasn't expired.
   * Returns the token record or null.
   */
  async findValidToken(email: string, token: string) {
    const record = await prisma.verificationToken.findUnique({
      where: { identifier_token: { identifier: email, token } },
    });

    if (!record) return null;
    if (record.expires < new Date()) {
      // Clean up stale token
      await prisma.verificationToken.deleteMany({ where: { identifier: email } });
      return null;
    }

    return record;
  },

  /**
   * Delete all tokens for an email after successful reset (invalidate token).
   */
  async deleteTokensForEmail(email: string) {
    return prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });
  },

  /**
   * Find a user by email — used to verify the account exists before issuing OTP.
   * Always returns the same shape to prevent email enumeration.
   */
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, password: true },
    });
  },

  /**
   * Update a user's hashed password.
   */
  async updatePassword(email: string, hashedPassword: string) {
    return prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
      select: { id: true, name: true, email: true },
    });
  },

  /**
   * Admin: update a user's password by user ID.
   */
  async updatePasswordById(userId: string, hashedPassword: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: { id: true, name: true, email: true },
    });
  },
};
