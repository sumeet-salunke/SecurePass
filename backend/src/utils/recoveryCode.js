import crypto from "crypto";

export const generateRecoveryCodes = (count = 10) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const randomPart = crypto.randomBytes(5).toString("hex").toUpperCase();

    codes.push(`${randomPart.slice(0, 5)}-${randomPart.slice(5)}`);
  }
  return codes;
};