const calcuateOTPExpiry = () => {
  const expiry = new Date();
  expiry.setMinutes(expiry.getMinutes() + Number(process.env.OTP_EXPIRY_MINUTES));
  return expiry;
};
export default calcuateOTPExpiry;