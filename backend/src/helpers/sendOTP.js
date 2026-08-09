import transporter from "../config/mail.js";
import otpTemplate from "../templates/otp.template.js";
const sendOTP = async ({ name, email, otp }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verfiy Your Account",
    html: otpTemplate(name, otp)
  });
};
export default sendOTP;