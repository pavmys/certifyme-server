import { db } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// export const uploadCertificate = (req, res) => {};

export const getUserCertificates = (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json("Не автентифіковано!");

  jwt.verify(token, "certifymekey", (err, userInfo) => {
    if (err) return res.status(403).json("Токен не валідний");

    const userId = userInfo.id;

    const query = `SELECT * FROM certificates WHERE user_id = ${userId}`;
    db.query(query, (err, data) => {
      if (err) return res.status(500).json(err);

      return res.status(200).json(data);
    });
  });
};
