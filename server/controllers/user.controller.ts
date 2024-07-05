import path from "path";

import type { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/user.model";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import jwt from "jsonwebtoken";
import ejs from "ejs";
import { Mailer } from "../utils/Mail";

export interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

interface IActivationToken {
  token: string;
  activationCode: string;
}

const getRandomNumber = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1) + min);

const createActivationToken = (user: IRegistrationBody): IActivationToken => {
  const activationCode = getRandomNumber(1000, 9000).toString();
  const token = jwt.sign(user, process.env.JWT_SECRET as string, {
    expiresIn: "10m",
  });

  return { token, activationCode };
};

export const registrationUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password, avatar }: IRegistrationBody = req.body;

    const isEmailExist = await User.findOne({ email });
    if (isEmailExist) {
      return next(new AppError("Email already exists", 400));
    }

    const userData: IRegistrationBody = {
      name,
      email,
      password,
      avatar,
    };

    const user: IUser = await User.create(userData);

    const activationToken = createActivationToken(userData);
    const activationCode = activationToken.activationCode;

    const data = { user: { name }, activationCode };

    const mailer = new Mailer();
    await mailer.sendActivationEmail(email, { activationCode, user: userData });
    console.log(activationToken.token);

    res.status(201).json({
      success: true,
      message: `User ${name} registered successfully. Please check your email: ${user.email} to activate your account!`,
      activationToken: activationToken.token,
    });
  }
);

export const getUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      success: true,
      user,
    });
  }
);

export const updateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      success: true,
      user,
    });
  }
);

export const deleteUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(204).json();
  }
);

export const getUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const users: IUser[] = await User.find();

    res.status(200).json({
      success: true,
      users,
    });
  }
);
