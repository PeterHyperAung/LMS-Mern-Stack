import type { Request, Response, NextFunction } from "express";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../utils/redis";
import { rateLimit } from "express-rate-limit";

export const isAuthenticated = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token;

    if (!access_token) {
      return next(new AppError("Please login to access this resource", 400));
    }

    const decoded = (await jwt.verify(
      access_token,
      process.env.ACCESS_TOKEN_SECRET
    )) as JwtPayload;

    if (!decoded) {
      return next(new AppError("Please login to access this resource", 400));
    }

    const user = await redis.get(decoded.id);

    if (!user) {
      return next(new AppError("No user found.", 400));
    }

    req.user = JSON.parse(user);

    next();
  }
);

export const authorizeRoles = (...roles: string[]) =>
  catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user)
      return next(new AppError("Please login to access this resource", 400));

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  });

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 15, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-7", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  handler: (req, res, next, options) =>
    res.status(options.statusCode).send(options.message),
  message: "Too many requests, please try again later.",
});
