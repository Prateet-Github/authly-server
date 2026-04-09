import User from "../models/user.model.js";
import EmailVerificationToken from "../models/emailVerificationToken.model.js";

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