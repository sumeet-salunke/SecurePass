import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import ApiError from "../utils/ApiError.js";
import userRepository from "../repositories/user.repository.js";
import { AUTH_MESSAGES } from "../constants/messages.js";

export const authenticate = async (req, res, next) => {
  try {
    //read authorization header

  } catch (error) {

  }
}