import type { Request, Response, NextFunction } from "express";
import User, { IUser } from "../models/user.model";
import { AppError } from "../utils/AppError";
import { catchAsync } from "../utils/catchAsync";
import jwt, { JwtPayload } from "jsonwebtoken";
import { Mailer } from "../utils/Mail";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt";
import { redis } from "../utils/redis";

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
  const token = jwt.sign(
    { user, activationCode },
    process.env.JWT_SECRET as string,
    {
      expiresIn: "10m",
    }
  );

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

export const activateUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token, activationCode } = req.body;

    if (!token || !activationCode) {
      return next(new AppError("Invalid token or activation code", 400));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      user: IUser;
      activationCode: string;
      iat: number;
      exp: number;
    };

    const newUser = decoded.user;
    console.log(decoded.user);

    if (decoded.activationCode !== activationCode) {
      return next(new AppError("Invalid token or activation code", 400));
    }

    const user = await User.findOneAndUpdate(
      {
        email: newUser.email,
      },
      { isActivated: true },
      {
        new: true,
      }
    );

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(201).json({
      success: true,
      message: `User ${user?.name} activated successfully`,
    });
  }
);

interface ILoginRequest {
  email: string;
  password: string;
}

export const loginUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body as ILoginRequest;
    if (!email || !password) {
      return next(new AppError("Please enter email and password", 400));
    }

    const user = await User.findOne({
      email,
    }).select("+password");

    if (!user) {
      return next(new AppError("Invalid email or password", 401));
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return next(new AppError("Invalid email or password", 401));
    }

    sendToken(user, 200, res);
  }
);

export const logoutUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    res.cookie("access_token", "", {
      maxAge: 1,
    });

    res.cookie("refresh_token", "", {
      maxAge: 1,
    });

    redis.del(String(req.user?._id));

    res.status(200).json({
      status: "success",
      message: "logged out successfully",
    });
  }
);

export const updateAccessToken = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const refresh_token = req.cookies.refresh_token;
    if (!refresh_token) {
      return next(new AppError("Please login again to get access", 401));
    }

    const decoded = jwt.verify(
      refresh_token,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as JwtPayload;

    if (!decoded) {
      return next(new AppError("Invalid token", 401));
    }

    const user = JSON.parse((await redis.get(decoded.id as string)) ?? "");
    if (!user) {
      return next(new AppError("Invalid token", 401));
    }

    const accessToken = jwt.sign(
      { id: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "5m",
      }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "3d",
      }
    );

    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);

    res.status(200).json({
      status: "success",
      accessToken,
    });
  }
);
