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

  async findByIdWithSecret(userId) {
    return await User.findById(userId).select("+mfaSecret");
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

  async incrementTokenVersion(userId) {
    return await User.findByIdAndUpdate(userId, {
      $inc: {
        tokenVersion: 1
      }
    }, { new: true });
  }

  async updatePassword(userId, newPassword) {
    return User.findOneAndUpdate({
      _id: userId, isActive: true
    }, {
      $set: {
        password: newPassword,
        passwordChangedAt: new Date(),
      }
    }, { returnDocument: "after" });
  }

  async findByIdWithPassword(userId) {
    return await User.findById(userId).select("+password");
  }

  async updateMFASecret(userId, secret) {
    return await User.findByIdAndUpdate(
      userId, {
      $set: {
        mfaSecret: secret,
      }
    }, {
      returnDocument: "after"
    }
    );
  }

  async enableMFA(userId, mfaSecret, recoveryCodes) {
    return await User.findByIdAndUpdate(userId,
      {
        $set: {
          mfaEnabled: true,
          mfaSecret,
          recoveryCodes
        }
      }
      , { returnDocument: "after" });
  }

  async findByIdWithPasswordAndMFASecret(userId) {
    return await User.findById(userId).select("+password +mfaSecret");
  }

  async disableMFA(userId) {
    return await User.findByIdAndUpdate(userId, {
      $set: {
        mfaEnabled: false,
      }
    }, {
      returnDocument: "after",
    })
  }

  async findByIdWithRecoveryCodes(userId) {
    return await User.findById(userId).select("+recoveryCodes");
  }
  async consumeRecoveryCode(userId, recoveryCodeHash) {
    return await User.findByIdAndUpdate(
      userId,
      {
        $pull: {
          recoveryCodes: recoveryCodeHash
        }
      }, {
      returnDocument: "after"
    }
    );
  }
  async replaceRecoveryCodes(userId, recoveryCodes) {
    return await User.findByIdAndUpdate(userId, {
      $set: {
        recoveryCodes
      }
    }, {
      returnDocument: "after"
    });
  }

  async findByPendingEmail(pendingEmail) {
    return await User.findOne({ pendingEmail });
  }

  async setPendingEmail(userId, pendingEmail) {
    return await User.findByIdAndUpdate(
      userId, {
      $set: {
        pendingEmail: pendingEmail,
      }
    }
      , {
        returnDocument: "after"
      });
  }

  async completeEmailChange(userId, newEmail) {
    return await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          email: newEmail,
          pendingEmail: null
        },
        $inc: {
          tokenVersion: 1
        }
      }
      , {
        returnDocument: "after"
      });
  }
}

export default new UserRepository();