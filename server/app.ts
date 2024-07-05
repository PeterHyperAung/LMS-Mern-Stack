import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorMiddleware } from "./middleware/error.middleware";
import { authRouter } from "./routes/auth.route";

export const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(cors({ credentials: true, origin: process.env.ORIGINS }));

app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: "API is working",
  });
});

app.use("/api/v1/auth", authRouter);

// Error route
app.use(errorMiddleware);

// unknown route
app.all("*", (req: Request, res: Response, next: NextFunction) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});
