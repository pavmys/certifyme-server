import express from "express";
import {
  login,
  register,
  registerAnyUser,
  logout,
} from "../controllers/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/registerAnyUser", registerAnyUser);
router.post("/login", login);
router.post("/logout", logout);

export default router;
