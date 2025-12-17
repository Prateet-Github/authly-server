import crypto from "crypto";

export const generateRandomToken = () => {
  return crypto.randomBytes(32).toString("hex");
};