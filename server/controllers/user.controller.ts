import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import { getUserByIdService } from "../services/user.service";
import User from "../models/user.model";
import { sanitizeUserResponse } from "../utils/sanitize";
import { redis } from "../utils/redis";

export const getUserById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await getUserByIdService(req.params.id);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(201).json({
      success: true,
      user: sanitizeUserResponse(user),
    });
  }
);

export const getMe = catchAsync(
  async (req: Request, res: Response, next: NextFunction) =>
    res
      .status(201)
      .json({ success: true, user: sanitizeUserResponse(req.user) })
);

interface IUpdateUserInfo {
  name?: string;
  email?: string;
}

export const updateUserInfo = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email } = req.body as IUpdateUserInfo;
    const userId = req.user?._id;
    if (!email) {
      return next(new AppError("Email not provided!", 404));
    }

    const [user, isEmailExist] = await Promise.all([
      User.findById(userId),
      User.findOne({ email }),
    ]);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (isEmailExist) {
      return next(new AppError("Email already exists", 400));
    }

    user.email = email;
    user.name = name || user.name;

    await Promise.all([
      user.save(),
      redis.set(String(userId), JSON.stringify(user)),
    ]);

    res.status(201).json({
      success: true,
      user: sanitizeUserResponse(user),
    });
  }
);
