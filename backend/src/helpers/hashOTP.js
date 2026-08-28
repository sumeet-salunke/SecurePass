import bcrypt from "bcrypt";
export const hashOTP = async (otp) => {
  return await bcrypt.hash(otp, Number(process.env.BCRYPT_SALT_ROUNDS));
};