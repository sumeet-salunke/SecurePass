import jwt from "jsonwebtoken";
import crypto from "crypto";

const generateAccessToken = (user) => {
  return jwt.sign({
    userId: user._id,
    tokenVersion: user.tokenVersion ?? 0
  }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY
  });
};

const generateRefreshToken = (user) => {
  const jti = crypto.randomUUID();

  const token = jwt.sign({
    userId: user._id,
    tokenVersion: user.tokenVersion ?? 0,
    jti,
  }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
  return {
    token, jti,
  };
};

const generateTokens = (user) => {
  const accessToken = generateAccessToken(user);
  const { token: refreshToken, jti } = generateRefreshToken(user);
  return { accessToken, refreshToken, jti };
};

export { generateAccessToken, generateRefreshToken, generateTokens };