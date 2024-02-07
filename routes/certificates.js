import express from "express";
import { getUserCertificates } from "../controllers/certificates.js";

const router = express.Router();

router.get("/getUserCertificates", getUserCertificates);

export default router;
