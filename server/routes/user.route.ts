import express from "express";
import {
  getMe,
  getUserById,
  updatePassword,
  updateProfilePicture,
  updateUserInfo,
} from "../controllers/user.controller";
import { isAuthenticated } from "../middleware/auth.middleware";
import { memoryStorageFileUpload as upload } from "../utils/FileUpload";

const router = express.Router();

router.get("/me", isAuthenticated, getMe);
router.get("/:id", isAuthenticated, getUserById);
router.patch("/update-user", isAuthenticated, updateUserInfo);
router.patch("/update-password", isAuthenticated, updatePassword);
router.patch(
  "/update-avatar",
  isAuthenticated,
  upload.single("avatar"),
  updateProfilePicture
);

export { router as userRouter };
