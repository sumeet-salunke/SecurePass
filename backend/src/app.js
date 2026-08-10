import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";


//routes
import authRoutes from "./routes/auth.routes.js";



//errr middleware


const app = express();
app.use(express.json({ limit: "1mb" }));
app.set("trust proxy", 1);
app.use(helmet());
const clientOrigin = process.env.CLIENT_URL ? process.env.CLIENT_URL.replace(/\/$/, "") :
  "http://localhost:5173";

app.use(cors({
  origin: clientOrigin,
  credentials: true
}));
app.use(compression());
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests. Please try again later."
});
app.use(limiter);
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.urlencoded
  ({ extended: true, limit: "1mb" })
);

app.use("/api/auth", authRoutes);



app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SecurePass backend is working.......",
  });
});

export default app;