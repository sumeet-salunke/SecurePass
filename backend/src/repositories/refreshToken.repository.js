import RefreshToken from "../models/refreshToken.js";

class RefreshTokenRepository {

  async create(data, session = null) {
    const [refreshToken] = await RefreshToken.create([data], { session });
    return refreshToken;
  }

  async findByTokenHash(tokenHash) {
    return await RefreshToken.findOne({
      tokenHash,
    });
  }

  async revokeById(id) {
    return await RefreshToken.findByIdAndUpdate({
      _id: id, isRevoked: false,
    }, {
      $set: {
        isRevoked: true,
      }
    }, { new: true });
  }

  /*
  
    async findByToken(token) {
      return await RefreshToken.findOne({ token, isRevoked: false });
    }
    async revoke(token) {
      return await RefreshToken.findOneAndUpdate({ token }, { isRevoked: true }, { new: true });
    }
    async revokeAll(userId) {
      return await RefreshToken.updateMany({ userId }, { isRevoked: true });
    }
    async findToken(token) {
      return await RefreshToken.findOne({ token, isRevoked: false });
    }
    async revokeAllByUserId(userId) {
      return await RefreshToken.updateMany({
        userId, isRevoked: false
      }, {
        isRevoked: true
      });
    }
    async deleteExpired() {
      return await RefreshToken.deleteMany({
        expiresAt: {
          $lt: new Date()
        }
      });
    }
      */
};

export default new RefreshTokenRepository();