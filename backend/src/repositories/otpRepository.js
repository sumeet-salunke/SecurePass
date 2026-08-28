import OTP from "../models/OTP.js";

class OTPRepository {
  async create(data, session = null) {
    const [otp] = await OTP.create([data], { session });
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
  async consumeOTP(id) {
    return await OTP.findOneAndUpdate({
      _id: id, isUsed: false
    }, {
      $set: {
        isUsed: true
      }
    }, { new: true });
  }
  async incrementAttempts(id) {
    return await OTP.findOneAndUpdate({ _id: id, isUsed: false }, {
      $inc: {
        attempts: 1
      }
    }, { new: true })
  }

  async consumeActiveOTPs(userId, purpose) {
    return await OTP.updateMany({
      userId, purpose, isUsed: false,
    }, {
      $set: {
        isUsed: true
      }
    })
  }


}
export default new OTPRepository();