import User from "../models/User.js";

class UserRepository {

  async create(userData, session = null) {
    const [user] = await User.create([userData], { session });
    return user;
  }

  async findByEmail(email) {
    return await User.findOne({ email }).select("+password");
  }

  async findById(userId) {
    return await User.findById(userId);
  }

  async deleteById(userId) {
    return await User.findByIdAndDelete(userId);
  }

  async save(user) {
    return await user.save();
  }

  async updateById(userId, updateData) {
    return await User.findByIdAndUpdate(userId, updateData, { new: true });
  }
  async findAuthUserById(userId) {
    return await User.findById(userId).select("isVerified isActive passwordChangedAt tokenVersion");
  }
}


export default new UserRepository();