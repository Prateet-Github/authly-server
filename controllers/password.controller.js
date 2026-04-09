import User from "../models/user.model.js";
import { generateRandomToken } from "../utils/token.js";
import RefreshToken from "../models/refreshToken.model.js";
import PasswordResetToken from "../models/passwordResetToken.model.js";
import { hashPassword } from "../utils/password.js";

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res
        .status(200)
        .json({ message: "If that email is registered, a reset link has been sent." });
    }

    const token = generateRandomToken();

    await PasswordResetToken.create({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiration
    });

     return res.status(200).json({
      message: "Password reset token generated",
      // token // For testing purposes only; remove in production
      // App developers must deliver reset link themselves.
    });

  } catch (error) {
    console.error("Error requesting password reset:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const confirmPasswordReset = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    const record = await PasswordResetToken.findOne({ token });

    if (!record || record.usedAt) {
      return res.status(400).json({
        message: "Invalid or used token",
      });
    }

    if (record.expiresAt < new Date()) {
      await PasswordResetToken.deleteOne({ _id: record._id });
      return res.status(400).json({ message: "Token expired" });
    }

    const user = await User.findById(record.userId).select("+passwordHash");

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Set new password
    user.passwordHash = await hashPassword(newPassword);
    await user.save();

    // Invalidate token
    record.usedAt = new Date();
    await record.save();

    // Invalidate all sessions
    await RefreshToken.updateMany(
      { userId: user._id, revokedAt: null },
      { revokedAt: new Date() }
    );

    return res.status(200).json({
      message: "Password reset successful",
    });

  } catch (error) {
    console.error("Password reset confirm error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};