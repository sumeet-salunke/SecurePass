const otpTemplate = (name, otp) => {
  return `
 <div style="font-family:sans-serif">

            <h2>Hello ${name},</h2>

            <p>Your verification OTP is</p>

            <h1>${otp}</h1>

            <p>This OTP is valid for 5 minutes.</p>

            <p>Please don't share it with anyone.</p>

        </div>
  `;
};
export default otpTemplate;