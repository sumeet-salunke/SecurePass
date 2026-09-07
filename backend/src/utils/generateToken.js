import jwt from "jsonwebtoken";
import crypto from "crypto";

const generateAccessToken = (user) => {
  return jwt.sign({
    userId: user._id,
    tokenVersion: user.tokenVersion ?? 0,
    type: "access"
  }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY
  });
};

const generateRefreshToken = (user, familyId = crypto.randomUUID(), jti = crypto.randomUUID()) => {
  const token = jwt.sign({
    userId: user._id,
    tokenVersion: user.tokenVersion ?? 0,
    jti,
    familyId,
    type: "refresh"
  }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
  return {
    token, jti, familyId
  };
};

const generateTokens = (user, familyId = null, jti = null) => {
  const accessToken = generateAccessToken(user);
  const { token: refreshToken, jti: generatedJti, familyId: generatedFamilyId } = generateRefreshToken(user, familyId ?? undefined, jti ?? undefined);
  return { accessToken, refreshToken, jti: generatedJti, familyId: generatedFamilyId };
};

export { generateAccessToken, generateRefreshToken, generateTokens };