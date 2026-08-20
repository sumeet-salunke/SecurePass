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
import { OTP_CONFIG } from "../constants/constants.js";
import { hashRefreshToken } from "../utils/hashRefreshToken.js";

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
    //1. find user
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new ApiError(404, AUTH_MESSAGES.USER_NOT_FOUND);
    }
    //2. already verified or prevent unnecessary verification
    if (user.isVerified) {
      throw new ApiError(409, AUTH_MESSAGES.EMAIL_ALREADY_VERIFIED);
    }
    //3. find active otp
    const otpRecord = await otpReposiory.findActiveOTP(user._id, OTP_PURPOSE.VERIFY_ACCOUNT);
    if (!otpRecord) {
      throw new ApiError(400, AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP);
    }
    //4. otp expired
    if (otpRecord.expiresAt <= new Date()) {
      throw new ApiError(404, AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP);
    }
    //5. check maximum attempts
    if (otpRecord.attempts >= OTP_CONFIG.MAX_OTP_ATTEMPTS) {
      await otpReposiory.consumeOTP(otpRecord._id);
      throw new ApiError(400, AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP);
    }
    //6. compare  submitted OTP with stored hash
    const isValid = await bcrypt.compare(otp, otpRecord.otpHash);
    //7. wrong OTP
    if (!isValid) {
      await otpReposiory.incrementAttempts(otpRecord._id);
      throw new ApiError(400, AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP
      );
    }
    //8. mark otp used or automatically consume OTP
    const consumedOTP = await otpReposiory.consumeOTP(otpRecord._id);
    //another request may have consumed it
    if (!consumedOTP) {
      throw new ApiError(400, AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP);
    }
    //9. verify user
    await userRepository.updateById(user._id, { isVerified: true });

    logger.info(`Email verified: ${email}`);

    return {
      message: AUTH_MESSAGES.OTP_VERIFIED,
      data: null,
    };
  }

  async resendOTP(data) {
    const { email } = data;
    //1. find user
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new ApiError(404, AUTH_MESSAGES.USER_NOT_FOUND
      );
    }
    //2. check already verified?
    if (user.isVerified) {
      throw new ApiError(409, AUTH_MESSAGES.EMAIL_ALREADY_VERIFIED);
    }
    //3. find active otp
    const otpRecord = await otpReposiory.findActiveOTP(user._id, OTP_PURPOSE.VERIFY_ACCOUNT);
    //4. active otp exists
    if (otpRecord) {
      //5. check cooldown
      const cooldownEndsAt = new Date(otpRecord.createdAt.getTime() + OTP_CONFIG.RESEND_COOLDOWN_SECONDS * 1000);
      //6. still within cooldown
      if (cooldownEndsAt > new Date()) {
        const remainingSeconds = Math.ceil((cooldownEndsAt.getTime() - Date.now()) / 1000);
        throw new ApiError(429, `${AUTH_MESSAGES.OTP_RESEND_COOLDOWN} ${remainingSeconds} seconds`);
      }
      //7. cooldown expired - invalidate old OTP
      await otpReposiory.consumeOTP(otpRecord._id);
    }
    //8.generate new OPT
    const otp = generateOTP();
    //9. hash otp
    const otpHash = await bcrypt.hash(otp, Number(process.env.BCRYPT_SALT_ROUNDS));
    //10. save new otp
    await otpReposiory.create({
      userId: user._id,
      email,
      otpHash,
      purpose: OTP_PURPOSE.VERIFY_ACCOUNT,
      expiresAt: new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000),
    });
    //11. send email
    await sendMail({
      to: email,
      subject: "Verify your account",
      html: otpTemplate(user.name, otp),
    });
    logger.info(`OTP resent for user: ${user._id}`);
    return {
      message: AUTH_MESSAGES.OTP_SENT,
      data: null,
    }
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
    const { accessToken, refreshToken, jti } = generateTokens(user);
    const tokenHash = hashRefreshToken(refreshToken);

    //store refresh token
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    await refreshTokenRepository.create({ userId: user._id, tokenHash, tokenVersion: user.tokenVersion ?? 0, jti, expiresAt: expiry });

    return {
      message: AUTH_MESSAGES.LOGIN_SUCCESS,
      data: {
        accessToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified
        }
      },
      refreshToken,
    };

  }


}

export default new AuthService();