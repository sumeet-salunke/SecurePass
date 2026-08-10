import "dotenv/config";
import "./src/config/dns.js";

import app from "./src/app.js";
import connectDB from "./src/databases/db.js";
import logger from "./src/utils/logger.js";

const PORT = process.env.PORT || 5000;
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      logger.info(`Server running on http://localhost:${PORT}`);
    })
  } catch (error) {
    logger.error(error.message);
    process.exit(1);
  }
}

startServer();