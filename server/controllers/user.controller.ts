import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import { getUserByIdService } from "../services/user.service";

export const getUserById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await getUserByIdService(req.params.id);
    res.status(201).json({
      success: true,
      user,
    });
  }
);
