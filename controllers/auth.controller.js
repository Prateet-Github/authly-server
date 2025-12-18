import User from "../models/user.model.js";
import { signAccessToken, signRefreshToken } from "../utils/jwt.js";
import { serializeUser } from "../utils/serializeUser.js";
import { generateRandomToken } from "../utils/token.js";
import EmailVerificationToken from "../models/emailVerificationToken.model.js";
import RefreshToken from "../models/refreshToken.model.js";
import { verifyRefreshToken } from "../utils/jwt.js";
import { hashToken } from "../utils/hash.js";

export const registerUser = async (req, res) => {
  try {
    const { email, name, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
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
    const sessions = await RefreshToken.find({ 
      userId: req.user._id, 
      revokedAt: null, 
      expiresAt: { $gt: new Date() }
    }).sort({ createdAt: -1 });
    
    return res.status(200).json({ sessions });

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