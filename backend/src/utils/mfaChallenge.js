import jwt from "jsonwebtoken";
const MFA_CHALLENGE_EXPIRY = "5m";

//Creates a short-lived token proving that the user has already passed the password stage of login
export const generateMFAChallenge = (userId, tokenVersion) => {
  return jwt.sign(
    {
      userId,
      tokenVersion,
      type: "mfa_challenge",
    },
    process.env.JWT_MFA_SECRET,
    {
      expiresIn: MFA_CHALLENGE_EXPIRY,
    }
  );
};

//Verifies that the MFA challenge was issued by SecurePass and has not yet expired
export const verifyMFAChallenge = (token) => {
  return jwt.verify(token, process.env.JWT_MFA_SECRET);
};