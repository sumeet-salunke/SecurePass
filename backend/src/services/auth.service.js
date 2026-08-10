import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

import ApiError from "../utils/ApiError.js";
import generateOTP from "../utils/generateOTP.js";
import calculateOTPExpiry from "../utils/calculateOTPExpity.js";
import { sendMail } from "../config/mail.js";
import otpTemplate from "../templates/otp.template.js";
import logger from "../utils/logger.js";

import { OTP_PURPOSE } from "../constants/otpPurpose.js";
import { AUTH_MESSAGES } from "../constants/messages.js";
import { generateAccessToken, generateRefreshToken, generateTokens } from "../utils/generateToken.js";

import userRepository from "../repositories/user.repository.js";
import otpReposiory from "../repositories/otpReposiory.js";
import refreshTokenRepository from "../repositories/refreshToken.repository.js";


class AuthService {

  async register(userData) {
    const { name, email, password } = userData;
    const existingUser = await userRepository.findByEmail(email);
    //existing & verified User
    if (existingUser && existingUser.isVerified) {
      throw new ApiError(409, AUTH_MESSAGES.EMAIL_ALREADY_VERIFIED);
    }
    //existing email nut not verified
    if (existingUser && !existingUser.isVerified) {
      const otp = generateOTP();
      const otpHash = await bcrypt.hash(otp, Number(process.env.BCRYPT_SALT_ROUNDS));
      await otpReposiory.deleteActiveOTP(existingUser._id,
        OTP_PURPOSE.VERIFY_ACCOUNT
      );

      await otpReposiory.create({
        userId: existingUser._id,
        email,
        otpHash,
        purpose: OTP_PURPOSE.VERIFY_ACCOUNT,
        expiresAt: calculateOTPExpiry()
      });
      await sendMail({
        to: email,
        subject: "Verify Your Account.",
        html: otpTemplate(name, otp)
      });
      logger.info(`OTP resent to ${email}`);
      return {
        message: AUTH_MESSAGES.OTP_RESENT,
        data: null
      };
    }
    //new user
    let createdUser;
    try {
      createdUser = await userRepository.create({ name, email, password });
      const otp = generateOTP();
      const otpHash = await bcrypt.hash(otp, Number(process.env.BCRYPT_SALT_ROUNDS));
      await otpReposiory.create({
        userId: createdUser._id,
        email, otpHash,
        purpose: OTP_PURPOSE.VERIFY_ACCOUNT,
        expiresAt: calculateOTPExpiry()
      });
      await sendMail({
        to: email,
        subject: "Verify Your Account",
        html: otpTemplate(name, otp)
      });
      logger.info(`User registerd: ${email}`);
      return {
        message: AUTH_MESSAGES.REGISTER_SUCCESS,
        data: {
          id: createdUser._id,
          email: createdUser.email
        }
      };
    }
    catch (error) {
      if (createdUser) {
        await userRepository.deleteById(createdUser._id);
      }
      logger.error(error.message);
      throw error;

    }
  }

  async verifyOTP(data) {
    const { email, otp } = data;
    //find user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new ApiError(404, AUTH_MESSAGES.USER_NOT_FOUND);
    }
    //already verified
    if (user.isVerified) {
      throw new ApiError(409, AUTH_MESSAGES.EMAIL_ALREADY_VERIFIED);
    }
    //find active otp
    const otpRecord = await otpReposiory.findActiveOTP(user._id, OTP_PURPOSE.VERIFY_ACCOUNT);
    if (!otpRecord) {
      throw new ApiError(400, AUTH_MESSAGES.INVALID_OTP);
    }
    //otp expired
    if (otpRecord.expiresAt < new Date()) {
      throw new ApiError(404, AUTH_MESSAGES.OTP_EXPIRED);
    }
    //compare otp
    const isValid = await bcrypt.compare(otp, otpRecord.otpHash);
    if (!isValid) {
      await otpReposiory.updateById(otpRecord._id, {
        attempts: otpRecord.attempts + 1
      });
      throw new ApiError(400, AUTH_MESSAGES.INVALID_OTP);
    }
    //mark otp used
    await otpReposiory.updateById(otpRecord._id, { isUsed: true });
    //verify user
    await userRepository.updateById(user._id, { isVerified: true });
    logger.info(`Email verified: ${email}`);
    return {
      message: AUTH_MESSAGES.OTP_VERIFIED,
      data: null,
    };
  }

  async login(data) {
    const { email, password } = data;
    //find user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new ApiError(400, AUTH_MESSAGES.INVALID_CREDENTIALS);
    }
    //verified?
    if (!user.isVerified) {
      throw new ApiError(403, AUTH_MESSAGES.ACCOUNT_NOT_VERIFIED);
    }
    //active?
    if (!user.isActive) {
      throw new ApiError(403, AUTH_MESSAGES.ACCOUNT_DISABLED);
    }
    //account locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      throw new ApiError(403, AUTH_MESSAGES.ACCOUNT_LOCKED);
    }
    //compare password  
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
      const attempts = user.loginAttempts + 1;
      const updateData = { loginAttempts: attempts };
      if (attempts >= 5) {
        updateData.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      }
      await userRepository.updateById(user._id, updateData);
      if (attempts >= 5) {
        throw new ApiError(403, AUTH_MESSAGES.ACCOUNT_LOCKED);
      }
      throw new ApiError(400, AUTH_MESSAGES.INVALID_CREDENTIALS);
    }
    //reset login attempts
    await userRepository.updateById(user._id, {
      loginAttempts: 0, lockUntil: null
    });
    //generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    //store refresh token
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    await refreshTokenRepository.create({ userId: user._id, token: refreshToken, expiresAt: expiry });

    return {
      message: AUTH_MESSAGES.LOGIN_SUCCESS,
      data: {
        accessToken, refreshToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified
        }
      }
    }

  }
}

export default new AuthService();