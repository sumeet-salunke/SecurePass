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

const generateRefreshToken = (user, familyId = crypto.randomUUID()) => {
  const jti = crypto.randomUUID();

  const token = jwt.sign({
    userId: user._id,
    tokenVersion: user.tokenVersion ?? 0,
    jti,
    familyId,
  }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
  return {
    token, jti, familyId
  };
};

const generateTokens = (user, familyId = null) => {
  const accessToken = generateAccessToken(user);
  const { token: refreshToken, jti, familyId: generatedFamilyId } = generateRefreshToken(user, familyId ?? undefined);
  return { accessToken, refreshToken, jti, familyId: generatedFamilyId };
};

export { generateAccessToken, generateRefreshToken, generateTokens };