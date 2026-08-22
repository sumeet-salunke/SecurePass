import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  tokenHash: {
    type: String,
    required: true,
    index: true,
  },

  tokenVersion: {
    type: Number,
    required: true,
  },

  jti: {//identifies one specific refresh token
    type: String,
    required: true,
    unique: true,
  },
  isRevoked: {
    type: Boolean,
    default: false,
  },
  familyId: {// identifies the linage / session
    type: String,
    required: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  }
}, { timestamps: true });

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
export default RefreshToken;