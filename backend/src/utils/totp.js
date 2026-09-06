import { generateSecret, generateURI, verify } from "otplib";
//Generate a new Secret that will be shared between SecurePAss and user's authetnticator app
export const generateMFASecret = () => {
  return generateSecret();
};

//create otpauth:// uri that the authenticator app understands
export const generateMFAURI = (secret, email) => {
  return generateURI({
    issuer: "SecurePass",
    label: email,
    secret,
  });
};

//verify a TOTP code submitted by the user
export const verifyMFACode = async (token, secret) => {
  const result = await verify({
    token, secret
  });
  return result.valid;
};