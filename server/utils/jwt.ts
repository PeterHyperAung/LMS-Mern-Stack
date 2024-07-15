import jwt from "jsonwebtoken";
import { config } from "dotenv";
config();
import { Response } from "express";
import { IUser } from "../models/user.model";
import { redis } from "./redis";

interface ITokenOptions {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none" | undefined;
  secure?: boolean;
}
type UserReponseType = { password: string | undefined } & Omit<
  IUser,
  "password"
>;

// parse environment variables to integrates wiht fallback values
const accessTokenExpire = parseInt(
  process.env.ACCESS_TOKEN_EXPIRE || "100",
  10
);
const refreshTokenExpire = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || "1200",
  10
);

// token options
export const accessTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
  maxAge: accessTokenExpire * 60 * 60 * 1000,
  httpOnly: process.env.NODE_ENV === "production",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

export const refreshTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
  httpOnly: process.env.NODE_ENV === "production",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

export const sendToken = (
  user: UserReponseType,
  statusCode: number,
  res: Response
) => {
  const accessToken = user.signAccessToken();
  const refreshToken = user.signRefreshToken();

  // upload session to redis
  redis.set(String(user._id), JSON.stringify(user), "EX", 60 * 60 * 24 * 30);

  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);

  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    user,
    accessToken,
    refreshToken,
  });
};
