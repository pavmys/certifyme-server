import express from "express";
import {
  addSubject,
  removeSubject,
  getSubjects,
  getSubject,
  getProfileSubjects,
} from "../controllers/subject.js";

const router = express.Router();

router.post("/addSubject", addSubject);
router.delete("/removeSubject", removeSubject);
router.get("/getSubjects", getSubjects);
router.get("/getSubjects/:id", getSubject);
router.get("/getProfileSubjects", getProfileSubjects); // for teacher

export default router;
