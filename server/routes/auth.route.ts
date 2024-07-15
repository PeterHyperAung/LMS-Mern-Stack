import express from "express";
import {
  activateUser,
  loginUser,
  logoutUser,
  registrationUser,
  updateAccessToken,
} from "../controllers/auth.controller";
import { getUserById } from "../controllers/user.controller";
import {
  isAuthenticated,
  loginRateLimiter,
} from "../middleware/auth.middleware";

const router = express.Router();

router.post("/register", registrationUser);
router.post("/activate", activateUser);
router.post("/login", loginRateLimiter, loginUser);
router.get("/logout", isAuthenticated, logoutUser);
router.get("/refreshtoken", updateAccessToken);
router.get("/me", isAuthenticated, getUserById);

export { router as authRouter };
