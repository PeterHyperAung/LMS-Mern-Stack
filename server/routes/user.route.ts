import express from "express";
import {
  getMe,
  getUserById,
  updateUserInfo,
} from "../controllers/user.controller";
import { isAuthenticated } from "../middleware/auth.middleware";

const router = express.Router();

router.get("/me", isAuthenticated, getMe);
router.get("/:id", isAuthenticated, getUserById);
router.patch("/update-user", isAuthenticated, updateUserInfo);

export { router as userRouter };
