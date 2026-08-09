import mongoose from "mongoose";
const refreshTokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  token: {
    type: String,
    required: true,
    index: true,
  },
  isRevoked: {
    type: Boolean,
    default: false,
  },
  exipresAt: {
    type: Date, required: true, index: true
  }
}, { timestamps: true });
refreshTokenSchema.index({
  userId: 1,
  token: 1,
});
refreshTokenSchema.index({
  token: 1, isRevoked: 1
});
const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);
export const RefreshToken;