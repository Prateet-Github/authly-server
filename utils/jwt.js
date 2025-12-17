import jwt from "jsonwebtoken";
import env from "../config/env.js";

export const signAccessToken = (user) => {
  return jwt.sign(
    {
      sub: user._id,
      email: user.email,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN }
  );
};

export const signRefreshToken = (user) => {
  return jwt.sign(
    {
      sub: user._id,
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );
};

export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error("Invalid refresh token");
  }
};