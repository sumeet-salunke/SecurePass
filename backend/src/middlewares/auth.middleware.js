import jwt from "jsonwebtoken";

import ApiError from "../utils/ApiError.js";
import userRepository from "../repositories/user.repository.js";
import { AUTH_MESSAGES } from "../constants/messages.js";

export const authenticate = async (req, res, next) => {
  try {
    //1. get authorization header
    const authHeader = req.headers.authorization;

    //2. check if header exists and format
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }

    //3. extract token
    const token = authHeader.split(" ")[1];
    if (!token) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }

    //4. verify access token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    //5. check user still exists
    const user = await userRepository.findAuthUserById(decoded.userId);
    if (!user) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    //check account status
    if (!user.isActive || !user.isVerified) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    //check token version
    if (decoded.tokenVersion !== user.tokenVersion) {
      throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);
    }
    //check passoword change
    if (user.passwordChangedAt && decoded.iat * 1000 < user.passwordChangedAt.getTime()) {
      throw new ApiError(401, AUTH_MESSAGES.TOKEN_EXPIRED);
    }
    //6. attach current trusted user data
    req.user = {
      id: user._id,

    };
    //7. continue
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, AUTH_MESSAGES.TOKEN_EXPIRED);
    }
    throw new ApiError(401, AUTH_MESSAGES.UNAUTHORIZED);

  }
};