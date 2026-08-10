import jwt from "jsonwebtoken";

const generateAccessToken = (user) => {
  return jwt.sign({
    userId: user._id,
    tokenVersion: user.tokenVersion ?? 0
  }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY
  });
};

const generateRefreshToken = (user) => {
  return jwt.sign({
    userId: user._id,
    tokenVersion: user.tokenVersion ?? 0
  },
    process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY
  });
};

const generateTokens = (user) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  return { accessToken, refreshToken };
};

export { generateAccessToken, generateRefreshToken, generateTokens };