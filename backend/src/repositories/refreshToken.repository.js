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
    return await RefreshToken.findOneAndUpdate(
      {
        _id: id,
        isRevoked: false,
      },
      {
        $set: {
          isRevoked: true,
        },
      },
      { returnDocument: "after" }
    );
  }
  async revokeAllActiveByUserId(userId) {
    return await RefreshToken.updateMany({
      userId, isRevoked: false
    }, {
      $set: {
        isRevoked: true,
      }
    })
  }

  async revokeFamily(familyId) {
    return await RefreshToken.updateMany({
      familyId, isRevoked: false
    }, {
      $set: {
        isRevoked: true
      }
    })
  }

  async findActiveSessions(userId) {
    return await RefreshToken.find({
      userId, isRevoked: false
    }).select("familyId createdAt expiresAt")
      .sort({ createdAt: -1 });
  }

  async revokeSession(userId, familyId) {
    return await RefreshToken.findOneAndUpdate(
      {
        userId,
        familyId,
        isRevoked: false,
      },
      {
        $set: {
          isRevoked: true,
        },
      },
      { returnDocument: "after" }
    );
  }

  async revokeAllSessions(userId) {
    return await RefreshToken.updateMany({ userId, isRevoked: false }, { $set: { isRevoked: true } });
  }

  async revokeCurrentSession(userId, familyId) {
    return await RefreshToken.findOneAndUpdate(
      {
        userId,
        familyId,
        isRevoked: false,
      },
      {
        $set: {
          isRevoked: true,
        },
      },
      {
        returnDocument: "after",
      }
    );
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