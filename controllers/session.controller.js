import RefreshToken from "../models/refreshToken.model.js";
import { hashToken } from "../utils/hash.js";
import { serializeSession } from "../utils/serializeSession.js";

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