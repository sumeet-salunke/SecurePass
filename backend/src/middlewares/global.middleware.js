import logger from "../utils/logger.js";
import ApiResponse from "../utils/ApiResponse.js";

export const globalMiddleware = (err, req, res, next) => {
  //1. log the actual error on the server
  logger.error({
    message: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
  });
  //2. determine whether this is an expected application error
  const isOperationalError = err.isOperational === true || err.isOperationalError === true;
  //3. use the statusCode only for known/operational errors
  const statusCode = isOperationalError && err.statusCode ? err.statusCode : 500;
  //4. decide what message can safely reach the client
  let message = "Internal Server Error";
  if (isOperationalError) {
    message = err.message;
  } else if (process.env.NODE_ENV === "development") {
    message = err.message || "Internal Server Error";
  }
  //5. send standardized response
  return res.status(statusCode).json(new ApiResponse(statusCode, message));
};