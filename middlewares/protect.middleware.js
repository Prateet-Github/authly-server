import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../models/user.model.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);

    const user = await User.findById(payload.sub);
    req.user = user;

    if (!user || user.status !== "active") {
      return res.status(401).json({ message: "User not allowed" });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};