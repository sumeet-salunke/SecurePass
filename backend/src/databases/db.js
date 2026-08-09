import mongoose from "mongoose";
import logger from "../utils/logger.js";
//create connectDB function
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("MongoDB connected successfully");
  } catch (error) {
    logger.error(`Error while connecting to mongoDB: ${error.message}`);
    process.exit(1);

  }
};

export default connectDB;