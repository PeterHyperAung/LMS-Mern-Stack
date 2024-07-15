import { Document } from "mongoose";
import { IUser } from "../models/user.model";

export const sanitizeUserResponse = (
  user: IUser | Document | undefined | null
) => {
  if (!user) return null;

  // convert to object if it's a mongoose document else return the object and remove the password property
  const { password, ...sanitizedUser } = user.toObject ? user.toObject() : user;
  return sanitizedUser;
};
