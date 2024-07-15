import express from "express";
import {
  activateUser,
  loginUser,
  logoutUser,
  oAuthHandler,
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
router.post("/refreshtoken", updateAccessToken);
router.post("/oauth", oAuthHandler);

export { router as authRouter };
