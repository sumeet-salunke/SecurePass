import OTP from "../models/OTP.js";

class OTPRepository {
  async create(data, session = null) {
    console.log("Data", data);
    const [otp] = await OTP.create([data], { session });
    console.log("OTP created", otp);
    return otp;
  }
  async findActiveOTP(userId, purpose) {
    return await OTP.findOne({
      userId,
      purpose,
      isUsed: false
    });
  }
  async deleteActiveOTP(userId, purpose, session = null) {
    return await OTP.deleteMany({
      userId, purpose, isUsed: false
    }, { session });
  }
  async markAsUsed(id) {
    return await OTP.findByIdAndUpdate(id, {
      isUsed: true
    });
  }

  async updateById(id, updateData) {
    return await OTP.findByIdAndUpdate(id, updateData, { new: true });
  }


}
export default new OTPRepository();