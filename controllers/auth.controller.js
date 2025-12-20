import User from "../models/user.model.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";
import { serializeUser } from "../utils/serializeUser.js";
import { generateRandomToken } from "../utils/token.js";
import EmailVerificationToken from "../models/emailVerificationToken.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import { verifyRefreshToken } from "../utils/jwt.js";
import { hashToken } from "../utils/hash.js";
import { serializeSession } from "../utils/serializeSession.js";
import PasswordResetToken from "../models/passwordResetToken.model.js";

export const registerUser = async (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        message: "Email, password and name are required",
      });
    }

    const normalizedEmail = email.toLowerCase();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const user = await User.create({
      email: normalizedEmail,
      name,
      passwordHash: password,
    });

    const token = generateRandomToken();

    await EmailVerificationToken.create({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour expiration
    });

    // TODO: send email here (next step)
    console.log(
      `Verify email: http://localhost:5001/api/auth/verify-email?token=${token}`
    );

    return res.status(201).json({
      message: "User registered successfully. Please verify your email.",
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select(
      "+passwordHash"
    );

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        message: "User account is not active",
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in"
     });
   }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    const refreshTokenHash = hashToken(refreshToken);

    await RefreshToken.create({
      userId: user._id,
      tokenHash: refreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiration
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });

    return res.status(200).json({
     message: "Login successful",
     tokens: {
              accessToken,
              refreshToken
            },
     user: serializeUser(user),
});
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }
    
    const record = await EmailVerificationToken.findOne({ token });
    if (!record) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }
    
    const user = await User.findById(record.userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    user.emailVerified = true;
    await user.save();

    await EmailVerificationToken.deleteOne({ _id: record._id });

    return res.status(200).json({ message: "Email verified successfully" });

  } catch (error) {
    console.error("Error verifying email:", error);
    return res.status(500).json({ message: "Server error" });
  }
}

export const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token is required" });
    }

    const refreshTokenHash = hashToken(refreshToken);

    const storedToken = await RefreshToken.findOne({
      tokenHash: refreshTokenHash,
      revokedAt: null,
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const payload = verifyRefreshToken(refreshToken);
    const user = await User.findById(payload.sub);

    if (!user || user.status !== "active") {
      return res.status(401).json({ message: "User not allowed" });
    }

    storedToken.lastUsedAt = new Date();
    storedToken.revokedAt = new Date();
    await storedToken.save();

    // ROTATION
    storedToken.revokedAt = new Date();
    await storedToken.save();

    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);
    const newRefreshTokenHash = hashToken(newRefreshToken);

    await RefreshToken.create({
      userId: user._id,
      tokenHash: newRefreshTokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });

  } catch (error) {
    console.error("Error refreshing access token:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getSessions = async (req, res) => {
  try {
    const currentRefreshToken =
      req.headers["x-refresh-token"]; // OR cookie later

    const currentTokenHash = currentRefreshToken
      ? hashToken(currentRefreshToken)
      : null;

    const sessions = await RefreshToken.find({
      userId: req.user._id,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    const formatted = sessions.map((s) =>
      serializeSession(s, currentTokenHash)
    );

    return res.status(200).json({ sessions: formatted });
  } catch (error) {
    console.error("Error getting sessions:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req, res) => {
  const { refreshToken } = req.body;

  const tokenHash = hashToken(refreshToken);

  await RefreshToken.updateOne(
    { tokenHash },
    { revokedAt: new Date() }
  );

  res.json({ message: "Logged out successfully" });
};

export const logoutAll = async (req, res) => {
  await RefreshToken.updateMany(
    { userId: req.user.id, revokedAt: null },
    { revokedAt: new Date() }
  );

  res.json({ message: "Logged out from all devices" });
};

export const getMe = async (req, res) => {
  return res.status(200).json({
    user: serializeUser(req.user),
  });
};

export const deleteSession = async (req, res) => {
  try {
    const { sessionId } = req.params; // ✅ MATCHES ROUTE

    if (!sessionId) {
      return res.status(400).json({ message: "Session ID is required" });
    }

    const session = await RefreshToken.findOne({
      _id: sessionId,
      userId: req.user._id,
      revokedAt: null,
    });

    if (!session) {
      return res
        .status(404)
        .json({ message: "Session not found or already revoked" });
    }

    session.revokedAt = new Date();
    await session.save();

    return res.json({ message: "Session revoked successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

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
    user.passwordHash = newPassword;
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