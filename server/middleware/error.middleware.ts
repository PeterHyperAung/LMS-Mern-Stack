import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;

  err.message = err.message || "Internal Server Error";

  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new AppError(message, 404);
  }

  if (err.code === 11000) {
    const message = `Duplicate field value entered`;
    err = new AppError(message, 400);
  }

  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val: any) => val.message)
      .join(",");
    err = new AppError(message, 400);
  }

  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token. Please try again";
    err = new AppError(message, 401);
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired. Please try again";
    err = new AppError(message, 401);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
  });
};
