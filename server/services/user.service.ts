import User from "../models/user.model";
import { redis } from "../utils/redis";

export const getUserByIdService = async (id: string) =>
  JSON.parse((await redis.get(id)) || "");
