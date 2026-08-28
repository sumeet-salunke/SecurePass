import mongoose from "mongoose";
import { OTP_PURPOSE } from "../constants/otpPurpose.js";

const otpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: Object.values(OTP_PURPOSE),
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true, expires: 0,
  },
  attempts: {
    type: Number,
    default: 0,
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

otpSchema.index({
  userId: 1, purpose: 1,
  isUsed: 1
});

const OTP = mongoose.model("OTP", otpSchema);
export default OTP;