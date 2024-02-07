import express from "express";
import { getUserInfo, updateUserInfo } from "../controllers/updateInfo.js";

const router = express.Router();

router.post("/getUserInfo", getUserInfo);
// router.get("/getAllUsers", getAllUsers);
router.post("/updateUserInfo", updateUserInfo);

export default router;
