import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import bcrypt from "bcrypt";

import ApiError from "../utils/ApiError.js";
import generateOTP from "../utils/generateOTP.js";
import calculateOTPExpiry from "../utils/calculateOTPExpity.js";
import { sendMail } from "../config/mail.js";
import otpTemplate from "../templates/otp.template.js";
import logger from "../utils/logger.js";
import { hashOTP } from "../helpers/hashOTP.js";
import { OTP_PURPOSE } from "../constants/otpPurpose.js";
import { AUTH_MESSAGES } from "../constants/messages.js";
import { generateAccessToken, generateRefreshToken, generateTokens } from "../utils/generateToken.js";

import userRepository from "../repositories/user.repository.js";
import otpRepository from "../repositories/otpRepository.js";
import refreshTokenRepository from "../repositories/refreshToken.repository.js";
import { OTP_CONFIG } from "../constants/constants.js";
import { hashRefreshToken } from "../utils/hashRefreshToken.js";
import { generateMFASecret, generateMFAURI, verifyMFACode } from "../utils/totp.js";
import { generateQRCode } from "../utils/qrCode.js";
import { generateMFAChallenge, verifyMFAChallenge } from "../utils/mfaChallenge.js";
import { generateRecoveryCodes } from "../utils/recoveryCode.js";


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
      const activeOTP = await otpRepository.findActiveOTP(existingUser._id, OTP_PURPOSE.VERIFY_ACCOUNT);
      if (activeOTP) {
        const cooldownEndsAt = new Date(activeOTP.createdAt.getTime() + OTP_CONFIG.RESEND_COOLDOWN_SECONDS * 1000);
        if (cooldownEndsAt > new Date()) {
          const remainingSeconds = Math.ceil((cooldownEndsAt.getTime() - Date.now()) / 1000);
          throw new ApiError(429, `${AUTH_MESSAGES.OTP_RESEND_COOLDOWN} ${remainingSeconds} seconds`);
        }
      }
      const otp = generateOTP();
      const otpHash = await bcrypt.hash(otp, Number(process.env.BCRYPT_SALT_ROUNDS));
      await otpRepository.deleteActiveOTP(existingUser._id,
        OTP_PURPOSE.VERIFY_ACCOUNT
      );

      await otpRepository.create({
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
      await otpRepository.create({
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
    const otpRecord = await otpRepository.findActiveOTP(user._id, OTP_PURPOSE.VERIFY_ACCOUNT);
    if (!otpRecord) {
      throw new ApiError(400, AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP);
    }
    //4. otp expired
    if (otpRecord.expiresAt <= new Date()) {
      throw new ApiError(404, AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP);
    }
    //5. check maximum attempts
    if (otpRecord.attempts >= OTP_CONFIG.MAX_OTP_ATTEMPTS) {
      await otpRepository.consumeOTP(otpRecord._id);
      throw new ApiError(400, AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP);
    }
    //6. compare  submitted OTP with stored hash
    const isValid = await bcrypt.compare(otp, otpRecord.otpHash);
    //7. wrong OTP
    if (!isValid) {
      await otpRepository.incrementAttempts(otpRecord._id);
      throw new ApiError(400, AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP
      );
    }
    //8. mark otp used or automatically consume OTP
    const consumedOTP = await otpRepository.consumeOTP(otpRecord._id);
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
    const otpRecord = await otpRepository.findActiveOTP(user._id, OTP_PURPOSE.VERIFY_ACCOUNT);
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
      await otpRepository.consumeOTP(otpRecord._id);
    }
    //8.generate new OPT
    const otp = generateOTP();
    //9. hash otp
    const otpHash = await bcrypt.hash(otp, Number(process.env.BCRYPT_SALT_ROUNDS));
    //10. save new otp
    await otpRepository.create({
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
    //reset login attempts and retrieve updated user
    const freshUser = await userRepository.updateById(user._id, {
      loginAttempts: 0, lockUntil: null
    }) || user;
    //MFA
    if (user.mfaEnabled) {
      const mfaChallengeToken = generateMFAChallenge(user._id.toString(), user.tokenVersion);
      return {
        message: AUTH_MESSAGES.MFA_REQUIRED,
        data: {
          mfaRequired: true,
          mfaChallengeToken,
        }
      }
    }

    //generate tokens
    const { accessToken, refreshToken, jti, familyId } = generateTokens(freshUser);
    const tokenHash = hashRefreshToken(refreshToken);

    //store refresh token
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);

    await refreshTokenRepository.create({
      userId: freshUser._id,
      tokenHash,
      tokenVersion: freshUser.tokenVersion ?? 0,
      jti,
      familyId,
      expiresAt: expiry
    });

    return {
      message: AUTH_MESSAGES.LOGIN_SUCCESS,
      data: {
        accessToken,
        user: {
          id: freshUser._id,
          name: freshUser.name,
          email: freshUser.email,
          isVerified: freshUser.isVerified
        }
      },
      refreshToken,
    };

  }

  async verifyMFALogin(data) {
    const { mfaChallengeToken, code } = data || {};
    //both the values are required to complete MFA authentication
    if (!mfaChallengeToken || !code) {
      throw new ApiError(400, AUTH_MESSAGES.INVALID_MFA_CHALLENGE);
    }
    let payload;
    try {
      //verify signature and expiration of the MFA challenge
      payload = verifyMFAChallenge(mfaChallengeToken);
    } catch (error) {
      throw new ApiError(401, AUTH_MESSAGES.INVALID_MFA_CHALLENGE);
    }
    if (payload.type !== "mfa_challenge" || !payload.jti) {
      throw new ApiError(401, AUTH_MESSAGES.INVALID_MFA_CHALLENGE);
    }
    const isChallengeUsed = await refreshTokenRepository.findByJti(payload.jti);
    if (isChallengeUsed) {
      throw new ApiError(401, AUTH_MESSAGES.INVALID_MFA_CHALLENGE);
    }
    const user = await userRepository.findByIdWithSecret(payload.userId);
    if (!user || !user.isActive) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    //A password/session invalidation should also invalidate previously issued MFA challenge
    if (payload.tokenVersion !== user.tokenVersion) {
      throw new ApiError(401, AUTH_MESSAGES.INVALID_MFA_CHALLENGE);
    }
    if (!user.mfaEnabled || !user.mfaSecret) {
      throw new ApiError(401, AUTH_MESSAGES.MFA_SETUP_REQUIRED);
    }
    //verify the 6-digit code generated by authenticator app
    const isValid = await verifyMFACode(code, user.mfaSecret);
    if (!isValid) {
      throw new ApiError(401, AUTH_MESSAGES.INVALID_MFA_CODE);
    }
    //MFA is now completely verified
    //only at this point should normal authentication tokens be issued
    const { accessToken, refreshToken, jti, familyId } = generateTokens(user, null, payload.jti);

    const tokenHash = hashRefreshToken(refreshToken);
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    //store the refresh token using existing refresh token flow
    await refreshTokenRepository.create({
      userId: user._id,
      tokenHash,
      tokenVersion: user.tokenVersion ?? 0,
      jti,
      familyId,
      expiresAt: expiry
    });
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
      refreshToken
    };
  }

  async refreshToken(cookies) {
    const { refreshToken } = cookies || {};
    //1. refresh token must exist
    if (!refreshToken) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    //2. verify JWT
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    if (payload.type !== "refresh") {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    //3. extract JWT payload
    const {
      userId, tokenVersion, jti, familyId
    } = payload;
    //4. hash incoming refreshtoken
    const tokenHash = hashRefreshToken(refreshToken);
    //5. find token record
    const storedToken = await refreshTokenRepository.findByTokenHash(tokenHash);
    if (!storedToken) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    //6. Detect revoked token
    if (storedToken.isRevoked) {
      //securtiy event
      logger.warn(`Refresh token reuse detected | userId: ${storedToken.userId}| familyId: ${storedToken.familyId}`);
      await refreshTokenRepository.revokeFamily(storedToken.familyId);

      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    //7. verify JTI matches
    if (storedToken.jti !== jti) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    // verify family id
    if (storedToken.familyId !== familyId) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    //8. check expiration
    if (storedToken.expiresAt <= new Date()) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    //9. Find User
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    //10. check token version
    if (storedToken.tokenVersion !== user.tokenVersion || tokenVersion !== user.tokenVersion) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    //11.revoke old refresh token
    const revokedToken = await refreshTokenRepository.revokeById(storedToken._id);
    if (!revokedToken) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    //12. generate new tokens
    //preserve the existing token family
    const {
      accessToken, refreshToken: newRefreshToken, jti: newJti, familyId: newFamilyId
    } = generateTokens(user, storedToken.familyId);
    //13. hash new refresh token
    const newTokenHash = hashRefreshToken(newRefreshToken);
    //14. calculate expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    //15. store new refresh token 
    await refreshTokenRepository.create({
      userId: user._id,
      tokenHash: newTokenHash,
      tokenVersion: user.tokenVersion,
      jti: newJti,
      familyId: newFamilyId,
      expiresAt
    });
    //16. return tokens
    return {
      message: AUTH_MESSAGES.TOKEN_REFRESH_SUCCESS,
      accessToken, refreshToken: newRefreshToken,
    };

  }

  async getSessions(userId) {
    const sessions = await refreshTokenRepository.findActiveSessions(userId);
    return {
      message: AUTH_MESSAGES.SESSIONS_FETCHED,
      data: {
        sessions: sessions.map((session) => ({
          id: session.familyId,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt
        })),
      },
    };

  }


  async revokeSession(userId, familyId) {

    const revokedSession =
      await refreshTokenRepository.revokeSession(
        userId,
        familyId
      );
    if (!revokedSession) {
      throw new ApiError(
        404,
        AUTH_MESSAGES.SESSION_NOT_FOUND
      );
    }

    return {
      message: AUTH_MESSAGES.SESSION_REVOKED,
      data: null,
    };
  }

  async revokeAllSessions(userId) {
    const revokedSessions = await refreshTokenRepository.revokeAllSessions(userId);

    const updatedUser = await userRepository
      .incrementTokenVersion(userId);
    if (!updatedUser) {
      throw new ApiError(404, AUTH_MESSAGES.USER_NOT_FOUND);
    }
    return {
      message: AUTH_MESSAGES.ALL_SESSIONS_REVOKED,
      data: null,
    }
  }

  async logout(cookies) {
    //get refresh token
    const refreshToken = cookies?.refreshToken;
    //already logged out
    if (!refreshToken) {
      return {
        message: AUTH_MESSAGES.LOGOUT_SUCCESS,
        data: null,
      }
    }
    let payload;
    try {
      payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
      throw new ApiError(401, AUTH_MESSAGES.INVALID_REFRESH_TOKEN
      );
    }
    if (payload.type !== "refresh") {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    const { userId, familyId } = payload;
    if (!userId || !familyId) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }

    const revokedSession = await refreshTokenRepository.revokeCurrentSession(userId, familyId);

    if (!revokedSession) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }

    return {
      message: AUTH_MESSAGES.LOGOUT_SUCCESS,
      data: null
    }

  }

  async changePassword(userId, data) {
    //1. authenticate user
    if (!userId) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    //2. validate request
    const { currentPassword, newPassword } = data;
    if (!currentPassword) {
      throw new ApiError(400, AUTH_MESSAGES.CURRENT_PASSWORD_REQUIRED);
    }
    if (!newPassword) {
      throw new ApiError(400, AUTH_MESSAGES.NEW_PASSWORD_REQUIRED);
    }
    //3. password must be different
    if (currentPassword === newPassword) {
      throw new ApiError(400, AUTH_MESSAGES.PASSWORD_MUST_DIFFERENT);
    }
    //4. fetch user password hash
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new ApiError(404, AUTH_MESSAGES.USER_NOT_FOUND);
    }
    //5. verify current password
    const isPasswordVerified = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordVerified) {
      throw new ApiError(401, AUTH_MESSAGES.INVALID_CREDENTIALS);
    }
    //6.hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, Number(process.env.BCRYPT_SALT_ROUNDS));
    //7. save new password
    const updatedUser = await userRepository.updatePassword(userId, hashedNewPassword);
    if (!updatedUser) {
      throw new ApiError(404, AUTH_MESSAGES.USER_NOT_FOUND);

    }
    //8. revoke all refresh sessions
    await refreshTokenRepository.revokeAllSessions(userId);
    //9. invalidate all existing access tokens
    const versionUpdated = await userRepository.incrementTokenVersion(userId);
    if (!versionUpdated) {
      throw new ApiError(500, AUTH_MESSAGES.INTERNAL_SERVER_ERROR);
    }

    return {
      message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESS,
      data: null
    };
  }

  async forgotPassword(data) {
    const { email } = data;
    //1. validate email
    if (!email) {
      throw new ApiError(400, AUTH_MESSAGES.INVALID_CREDENTIALS);
    }
    //2. find user
    const user = await userRepository.findByEmail(email);
    //3. generic repsone if user doesn't exist
    if (!user) {
      return {
        message: AUTH_MESSAGES.GENERIC_RESPONSE,
        data: null,
      }
    }

    //4. check cooldown for existing active reset OTP
    const activeOTP = await otpRepository.findActiveOTP(user._id, OTP_PURPOSE.RESET_PASSWORD);
    if (activeOTP) {
      const cooldownEndsAt = new Date(activeOTP.createdAt.getTime() + OTP_CONFIG.RESEND_COOLDOWN_SECONDS * 1000);
      if (cooldownEndsAt > new Date()) {
        const remainingSeconds = Math.ceil((cooldownEndsAt.getTime() - Date.now()) / 1000);
        throw new ApiError(429, `${AUTH_MESSAGES.OTP_RESEND_COOLDOWN} ${remainingSeconds} seconds`);
      }
    }

    //5. invalidate existing reset OTPs
    await otpRepository.consumeActiveOTPs(user._id, OTP_PURPOSE.RESET_PASSWORD);

    //5. generate OTP
    const otp = generateOTP();

    //6. hash otp
    const hashedOTP = await hashOTP(otp);

    //7. save otp with RESET_PASSWORD purpose
    await otpRepository.create({
      userId: user._id,
      email: user.email,
      otpHash: hashedOTP,
      purpose: OTP_PURPOSE.RESET_PASSWORD,
      expiresAt: new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000),
    });

    //8. send email
    await sendMail({
      to: user.email,
      subject: "Password Reset OTP",
      html: otpTemplate(user.name, otp)
    });

    //9. return generic response
    return {
      message: AUTH_MESSAGES.GENERIC_RESPONSE,
      data: null
    };
  }

  async resetPassword(data) {
    const { email, otp, newPassword } = data;
    //1. vaiidate email, otp, newPassword
    if (!email || !otp || !newPassword) {
      throw new ApiError(400, AUTH_MESSAGES.INVALID_CREDENTIALS);
    }
    //2. Find user
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    //3. find active RESET_PASSWORD OTP
    const otpRecord = await otpRepository.findActiveOTP(user._id, OTP_PURPOSE.RESET_PASSWORD);

    if (!otpRecord) {
      throw new ApiError(400, AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP);

    }
    //4. check expiry
    if (otpRecord.expiresAt <= new Date()) {
      throw new ApiError(400, AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP);
    }
    //5. check attempts
    if (otpRecord.attempts >= OTP_CONFIG.MAX_OTP_ATTEMPTS) {
      await otpRepository.consumeOTP(otpRecord._id);
      throw new ApiError(400, AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP);
    }
    //6. compare OTP
    const isOTPValid = await bcrypt.compare(otp, otpRecord.otpHash);

    if (!isOTPValid) {
      await otpRepository.incrementAttempts(otpRecord._id);
      throw new ApiError(400, AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP);
    }
    //7. Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, Number(process.env.BCRYPT_SALT_ROUNDS));
    //8. Update password
    const updatedUser = await userRepository.updatePassword(user._id, hashedNewPassword);
    if (!updatedUser) {
      throw new ApiError(500, AUTH_MESSAGES.INTERNAL_SERVER_ERROR);
    }
    //9. consume OTP
    await otpRepository.consumeOTP(otpRecord._id);
    //10. revoke all refresh sessions
    await refreshTokenRepository.revokeAllSessions(user._id);
    //invalidate existing access tokens
    await userRepository.incrementTokenVersion(user._id);
    return {
      message: AUTH_MESSAGES.PASSWORD_RESET_SUCCESS,
      data: null
    }

  }

  async setupMFA(userId) {
    if (!userId) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    //fetch the user and explicitly include the hidden MFA secret
    const user = await userRepository.findByIdWithSecret(userId);
    if (!user) {
      throw new ApiError(404, AUTH_MESSAGES.USER_NOT_FOUND);
    }
    //don't create a new secret if MFA is already enabled
    if (user.mfaEnabled) {
      throw new ApiError(400, AUTH_MESSAGES.MFA_ALEADY_ENABLED);
    }
    //Generate a new secret for this MFA Enrollement
    const secret = generateMFASecret();
    //Create a URI that Google Authenticator and other authebticator apps use to configure the account
    const otpAuthURI = generateMFAURI(secret, user.email);
    //convert the URI into a QR code that user can scan
    const qrCode = await generateQRCode(otpAuthURI);
    //stores the secret, but keep MFA disabled until the user successfully verifies the TOTP code.
    await userRepository.updateMFASecret(userId, secret);

    return {
      message: AUTH_MESSAGES.MFA_SETUU_READY,
      data: {
        qrCode,
      },
    };
  }

  async verifyMFASetup(userId, code) {
    if (!userId) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    if (!code) {
      throw new ApiError(400, AUTH_MESSAGES.MFA_CODE_REQUIRED);
    }
    //explicitly select the hidden TOTP secret
    const user = await userRepository.findByIdWithSecret(userId);
    if (!user) {
      throw new ApiError(404, AUTH_MESSAGES.USER_NOT_FOUND);
    }
    if (!user.mfaSecret) {
      throw new ApiError(400, AUTH_MESSAGES.MFA_SETUP_REQUIRED);
    }
    if (user.mfaEnabled) {
      throw new ApiError(400, AUTH_MESSAGES.MFA_ALEADY_ENABLED);
    }
    //verify the code generated by user's authenticator app
    const isValid = await verifyMFACode(code, user.mfaSecret);
    if (!isValid) {
      throw new ApiError(400, AUTH_MESSAGES.INVALID_MFA_CODE);
    }
    const recoveryCodes = generateRecoveryCodes();
    const hashedRecoveryCodes = await Promise.all(
      recoveryCodes.map(async (recoveryCode) => {
        const hash = await bcrypt.hash(
          recoveryCode,
          Number(process.env.BCRYPT_SALT_ROUNDS)
        );

        // Verify immediately that the hash matches the code we just created.
        return hash;
      })
    );

    //MFA is enabled after successful verification
    await userRepository.enableMFA(userId, user.mfaSecret, hashedRecoveryCodes);
    //invalidate all existing refresh-token sessions
    await refreshTokenRepository.revokeAllSessions(userId);
    //invalidate all existing access tokens
    await userRepository.incrementTokenVersion(userId);
    return {
      message: AUTH_MESSAGES.MFA_ENABLED,
      data: {
        recoveryCodes
      },
    };
  }

  async disableMFA(userId, data) {
    const { password, code } = data;
    //Both password and TOTP required
    if (!password || !code) {
      throw new ApiError(400, AUTH_MESSAGES.INVALID_CREDENTIALS);
    }
    //Fetch the password and mfaSecret because both fields are select: false
    const user = await userRepository.findByIdWithPasswordAndMFASecret(userId);
    if (!user) {
      throw new ApiError(404, AUTH_MESSAGES.USER_NOT_FOUND);
    }
    //verify the current password
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
      throw new ApiError(401, AUTH_MESSAGES.INVALID_CREDENTIALS);
    }
    //verify the current TOTP code generated by the authenticatior app
    const isMFAValid = await verifyMFACode(code, user.mfaSecret);
    if (!isMFAValid) {
      throw new ApiError(401, AUTH_MESSAGES.INVALID_MFA_CODE);
    }
    //Disable the MFASecret
    await userRepository.disableMFA(userId);
    //invalidate all existing refresh-token sessions
    await refreshTokenRepository.revokeAllActiveByUserId(userId);
    //invalidate previously issued MFA challenges abd token state
    await userRepository.incrementTokenVersion(userId);
    return {
      message: AUTH_MESSAGES.MFA_DISABLED,
      data: null,
    }
  }

  async verifyRecoveryCodeLogin(data) {
    const { mfaChallengeToken, recoveryCode } = data;
    //both values are required.
    if (!mfaChallengeToken || !recoveryCode) {
      throw new ApiError(400, AUTH_MESSAGES.INVALID_MFA_CHALLENGE);
    }
    let payload;
    try {
      //verify challenge signautre and expiration
      payload = verifyMFAChallenge(mfaChallengeToken);

    } catch (error) {
      throw new ApiError(401, AUTH_MESSAGES.INVALID_MFA_CHALLENGE);
    }
    //ensure if the token was specifically created for MFA login
    if (payload.type !== "mfa_challenge" || !payload.jti) {
      throw new ApiError(401, AUTH_MESSAGES.INVALID_MFA_CHALLENGE);
    }
    const isChallengeUsed = await refreshTokenRepository.findByJti(payload.jti);
    if (isChallengeUsed) {
      throw new ApiError(401, AUTH_MESSAGES.INVALID_MFA_CHALLENGE);
    }
    const user = await userRepository.findByIdWithRecoveryCodes(payload.userId);
    if (!user || !user.isActive) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    //invalidate challenges created before a token-version challenge
    if (payload.tokenVersion !== user.tokenVersion) {
      throw new ApiError(401, AUTH_MESSAGES.INVALID_MFA_CHALLENGE);
    }
    if (!user.mfaEnabled) {
      throw new ApiError(400, AUTH_MESSAGES.MFA_SETUP_REQUIRED);
    }
    if (!user.recoveryCodes || user.recoveryCodes.length === 0) {
      throw new ApiError(400, AUTH_MESSAGES.NO_RECOVERY_CODES);
    }

    //find which stored hash matches the submitted recovery code
    let matchedHash = null;
    for (const hashedCode of user.recoveryCodes) {
      const isMatch = await bcrypt.compare(recoveryCode, hashedCode);

      if (isMatch) {
        matchedHash = hashedCode;
        break;
      }
    }
    if (!matchedHash) {
      throw new ApiError(401, AUTH_MESSAGES.INVALID_RECOVERY_CODE);
    }
    //permanently consume the matched recovery code
    await userRepository.consumeRecoveryCode(user._id, matchedHash);

    //recovery code successfully completed MFA
    //Issue the same authentication tokens as normal MFA login.
    const { accessToken, refreshToken, jti, familyId } = generateTokens(user, null, payload.jti);
    const tokenHash = hashRefreshToken(refreshToken);
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 7);
    await refreshTokenRepository.create({
      userId: user._id,
      tokenHash,
      jti,
      familyId,
      tokenVersion: user.tokenVersion ?? 0,
      expiresAt: expiry
    });
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
      refreshToken
    };

  }

  async regenerateRecoveryCodes(userId, data) {
    if (!userId) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    const { password, code } = data;
    if (!password || !code) {
      throw new ApiError(400, AUTH_MESSAGES.INVALID_CREDENTIALS);
    }
    //retrive the user's password and mfa secret
    const user = await userRepository.findByIdWithPasswordAndMFASecret(userId);
    if (!user || !user.isActive) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    if (!user.mfaEnabled || !user.mfaSecret) {
      throw new ApiError(400, AUTH_MESSAGES.MFA_SETUP_REQUIRED);
    }
    //verify the current password
    const isPasswordMatched = await bcrypt.compare(password, user.password);
    if (!isPasswordMatched) {
      throw new ApiError(401, AUTH_MESSAGES.INVALID_CREDENTIALS);
    }
    //verify current TOTP code
    const isMFAValid = await verifyMFACode(code, user.mfaSecret);
    if (!isMFAValid) {
      throw new ApiError(401, AUTH_MESSAGES.INVALID_MFA_CODE);
    }
    //generate a completely set of recovery codes
    const recoveryCodes = generateRecoveryCodes();
    //store only hashed versions
    const hashedRecoveryCodes = await Promise.all(recoveryCodes.map(async (recoveryCode) => {
      return await bcrypt.hash(recoveryCode, Number(process.env.BCRYPT_SALT_ROUNDS));
    }));
    //replace every old recovery code
    await userRepository.replaceRecoveryCodes(userId, hashedRecoveryCodes);
    //plaintext codes are returned only once
    return {
      message: AUTH_MESSAGES.RECOVERY_CODES_REGENERATED,
      data: {
        recoveryCodes
      }
    };
  }

  async changeEmail(userId, data) {
    //validate userId
    if (!userId) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    //extract current password and new email
    const { currentPassword, newEmail } = data;
    //both are required.
    if (!currentPassword || !newEmail) {
      throw new ApiError(400, AUTH_MESSAGES.INVALID_CREDENTIALS);
    }
    //fetch user
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new ApiError(404, AUTH_MESSAGES.USER_NOT_FOUND);
    }
    // verify current password
    const isPasswordMatched = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordMatched) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    //check new Email isn't current email
    if (user.email === newEmail) {
      throw new ApiError(400, AUTH_MESSAGES.INVALID_CREDENTIALS);
    }

    const newEmailUser = await userRepository.findByEmail(newEmail);
    //if a user has same email
    if (newEmailUser) {
      throw new ApiError(400, AUTH_MESSAGES.INVALID_CREDENTIALS);
    }
    const pendingEmailUser = await userRepository.findByPendingEmail(newEmail);

    if (pendingEmailUser && pendingEmailUser._id.toString() !== userId.toString()) {
      throw new ApiError(400, AUTH_MESSAGES.INVALID_CREDENTIALS);
    }
    //check active CHANGE_EMAIL OTP cooldown
    const activeOTP = await otpRepository.findActiveOTP(userId, OTP_PURPOSE.CHANGE_EMAIL);
    if (activeOTP) {
      const cooldownEndsAt = new Date(activeOTP.createdAt.getTime() + OTP_CONFIG.RESEND_COOLDOWN_SECONDS * 1000);
      if (cooldownEndsAt > new Date()) {
        const remainingSeconds = Math.ceil((cooldownEndsAt.getTime() - Date.now()) / 1000);
        throw new ApiError(429, `${AUTH_MESSAGES.OTP_RESEND_COOLDOWN} ${remainingSeconds} seconds`);
      }
      await otpRepository.consumeOTP(activeOTP._id);
    }

    await userRepository.setPendingEmail(userId, newEmail);

    const otp = generateOTP();

    const hashedOTP = await bcrypt.hash(otp, Number(process.env.BCRYPT_SALT_ROUNDS));

    await otpRepository.create({
      userId: user._id,
      email: newEmail,
      otpHash: hashedOTP,
      purpose: OTP_PURPOSE.CHANGE_EMAIL,
      expiresAt: new Date(Date.now() + OTP_CONFIG.EXPIRY_MINUTES * 60 * 1000)

    });
    await sendMail({
      to: newEmail,
      subject: "Email change OTP",
      html: otpTemplate(user.name, otp)
    });

    return {
      message: AUTH_MESSAGES.OTP_SENT,
      data: null
    };
  }

  async verifyEmailChange(userId, data) {
    if (!userId) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    const { code } = data;
    if (!code) {
      throw new ApiError(400, AUTH_MESSAGES.INVALID_CREDENTIALS);
    }
    //fetch user
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ApiError(404, AUTH_MESSAGES.USER_NOT_FOUND);
    }
    if (!user.pendingEmail) {
      throw new ApiError(400, AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP);
    }
    const existingUser = await userRepository.findByEmail(user.pendingEmail);
    if (existingUser && existingUser._id.toString() !== userId.toString()) {
      throw new ApiError(400, AUTH_MESSAGES.INVALID_CREDENTIALS);
    }
    const otpRecord = await otpRepository.findActiveOTP(userId, OTP_PURPOSE.CHANGE_EMAIL);
    if (!otpRecord) {
      throw new ApiError(401, AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP)
    }
    if (otpRecord.expiresAt <= new Date()) {
      throw new ApiError(401, AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP);
    }
    if (otpRecord.attempts >= OTP_CONFIG.MAX_OTP_ATTEMPTS) {
      await otpRepository.consumeOTP(otpRecord._id);
      throw new ApiError(401, AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP);
    }
    //compare code
    const isValidOTP = await bcrypt.compare(code, otpRecord.otpHash);
    if (!isValidOTP) {
      await otpRepository.incrementAttempts(otpRecord._id);
      throw new ApiError(401, AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP);
    }
    const consumedOTP = await otpRepository.consumeOTP(otpRecord._id);
    if (!consumedOTP) {
      throw new ApiError(400, AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP);
    }
    await userRepository.completeEmailChange(userId, user.pendingEmail);
    //revoke all existing refresh-token sessions
    await refreshTokenRepository.revokeAllSessions(userId);
    return {
      message: AUTH_MESSAGES.EMAIL_CHANGED,
      data: null
    }

  }
}

export default new AuthService();