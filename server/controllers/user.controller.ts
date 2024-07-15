import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import { getUserByIdService } from "../services/user.service";
import User, { IUser } from "../models/user.model";
import { sanitizeUserResponse } from "../utils/sanitize";
import { redis } from "../utils/redis";
import cloudinary, { UploadApiResponse } from "cloudinary";
import {
  diskStorageFileUpload,
  memoryStorageFileUpload,
} from "../utils/FileUpload";

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

export const updatePassword = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { currentPassword, newPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
    };

    if (!currentPassword || !newPassword) {
      return next(
        new AppError("Please provide both current and new password", 400)
      );
    }

    const user = await User.findById(req.user?._id).select("+password");

    if (user?.password === undefined) {
      return next(new AppError("Invalid User", 404));
    }

    const isPasswordMatch = await user?.comparePassword(currentPassword);

    if (!isPasswordMatch) {
      return next(new AppError("Invalid password", 400));
    }

    user.password = newPassword;

    await user.save();

    res.status(201).json({
      success: true,
      message: "Password updated successfully",
    });
  }
);

export const updateProfilePicture = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user?._id;

    const user = await User.findById(userId);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    if (req.file) {
      if (user?.avatar?.public_id) {
        const imageData = (await memoryStorageFileUpload.updateFile(
          req.file as Express.Multer.File,
          user.avatar.public_id
        )) as UploadApiResponse;

        if (
          imageData === undefined ||
          imageData?.public_id === undefined ||
          imageData?.secure_url === undefined
        ) {
          return next(new AppError("Error uploading image", 500));
        }

        user.avatar = {
          public_id: imageData?.public_id,
          url: imageData?.secure_url,
        };
      } else {
        const imageData = (await memoryStorageFileUpload.uploadFile(
          req.file as Express.Multer.File
        )) as UploadApiResponse;

        if (
          imageData === undefined ||
          imageData?.public_id === undefined ||
          imageData?.secure_url === undefined
        ) {
          return next(new AppError("Error uploading image", 500));
        }

        user.avatar = {
          public_id: imageData?.public_id,
          url: imageData?.secure_url,
        };
      }
      await Promise.all([
        user.save(),
        redis.set(String(userId), JSON.stringify(user)),
      ]);

      res.status(200).json({
        success: true,
        user: sanitizeUserResponse(user),
      });
    } else {
      return next(new AppError("Please provide an image", 400));
    }
  }
);
