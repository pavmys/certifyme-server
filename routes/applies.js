import express from "express";
import {
  uploadApply,
  getApplies,
  submitApply,
  generateApplication,
} from "../controllers/applies.js";

const router = express.Router();

router.post("/uploadApply", uploadApply);
router.post("/getApplies", getApplies);
router.post("/submitApply", submitApply);
router.post("/generateApplication", generateApplication);

export default router;
