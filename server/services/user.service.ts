import User from "../models/user.model";

export const getUserByIdService = async (id: string) => await User.findById(id);
