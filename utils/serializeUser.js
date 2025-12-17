export const serializeUser = (user) => ({
  id: user._id,
  email: user.email,
  name: user.name,
  emailVerified: user.emailVerified,
  status: user.status,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});