import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import fs from "fs";
import pdf from "pdf-parse/lib/pdf-parse.js";
import jwt from "jsonwebtoken";

import authRoutes from "./routes/auth.js";
import subjectRoutes from "./routes/subject.js";
import updateInfoRoutes from "./routes/updateInfo.js";
import certificateRoutes from "./routes/certificates.js";
import appliesRoutes from "./routes/applies.js";
import { db } from "./db.js";

// import { error } from "pdf-lib";

const app = express();

app.use(express.json());
app.use(cookieParser());
// app.use(cors());
app.use(cors({ credentials: true, origin: "http://localhost:5173" }));

app.use("/api/auth", authRoutes);
app.use("/api/subject", subjectRoutes);
app.use("/api/updateInfo", updateInfoRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/applies", appliesRoutes);

// creating storage for uploaded certificates
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../frontend/public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + file.originalname);
  },
});

const upload = multer({ storage: storage });

// File upload route
app.post("/api/upload-certificate", upload.single("file"), (req, res) => {
  // file's data
  const uploadedFile = req.file;
  const uploadedFileName = req.file.filename;
  const uploadedFilePath = req.file.path;

  const token = req.cookies.access_token;
  if (!token) return res.status(401).json("Не автентифіковано!");

  jwt.verify(token, "certifymekey", (err, userInfo) => {
    if (err) return res.status(403).json("Токен не валідний");

    const userId = userInfo.id;

    // get user's surname and name
    const query = `SELECT surname, name FROM users WHERE id = ${userId}`;
    db.query(query, (err, data) => {
      if (err) return res.status(500).json(err);

      const userSurnameName = [data[0].surname, data[0].name];

      // checking file
      if (!uploadedFile) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      if (uploadedFile.mimetype !== "application/pdf") {
        deleteFile(uploadedFilePath);
        return res
          .status(422)
          .json({ error: "Цей файл - не документ з розширенням .pdf" });
      }

      // reading data from file
      const fileData = fs.readFileSync(uploadedFilePath);

      pdf(fileData).then((data) => {
        let extractedText = data.text;

        const lines = extractedText.split("\n").map((line) => line.trim());

        const schoolsArr = ["DES 2022", "DATA ENGINEERING AND SECURITY 2023"];

        // Iterate through the textsArr and find the corresponding school for each text
        const schoolForTexts = lines.map((text) =>
          findSchoolForText(text, schoolsArr)
        );
        const schoolValue = schoolForTexts.filter((value) => value !== null)[0];

        // if certificate is "DES 2022"
        if (schoolValue === schoolsArr[0]) {
          const schoolSplit = schoolValue.split(" ");
          const certificateType = schoolSplit[0];
          const certificateYear = schoolSplit[1];

          // check if user has already uploaded THIS certificate
          const query1 = `SELECT * FROM certificates WHERE type = '${certificateType}' AND year = ${certificateYear} AND user_id = ${userId}`;
          db.query(query1, (err, data1) => {
            if (err) return res.status(500).json(err);

            if (data1.length > 0) {
              deleteFile(uploadedFilePath);
              return res
                .status(422)
                .json({ error: "Ви вже завантажували цей сертифікат" });
            } else {
              // check name of logged in user and name on certificate
              const nameOnCertificate = lines[lines.length - 1]
                .split(" ")
                .reverse();
              if (
                nameOnCertificate[0] === userSurnameName[0] &&
                nameOnCertificate[1] === userSurnameName[1]
              ) {
                const filePathWithForwardSlash = uploadedFilePath
                  .replace(/\\/g, "/")
                  .replace(/^..\frontend\public/, "");
                const certificatePath = filePathWithForwardSlash.slice(18);

                const query = `INSERT INTO certificates(type, year, path, updated_at, user_id) VALUES ('${certificateType}', ${certificateYear}, '${certificatePath}', NOW(), ${userId})`;

                db.query(query, (err, data) => {
                  if (err) return res.status(500).json(err);

                  return res
                    .status(200)
                    .json({ message: "Сертифікат успішно завантажено" });
                });
              } else {
                deleteFile(uploadedFilePath);
                return res.status(422).json({
                  error:
                    "Це не Ваш сертифікат тому, що імена та прізвища не збігаються",
                });
              }
            }
          });
        }
        // if certificate is "DES 2023"
        else if (schoolValue === schoolsArr[1]) {
          const schoolSplit = lines[lines.length - 1].slice(0, 8).split("-");
          const certificateType = schoolSplit[0];
          const certificateYear = schoolSplit[1];

          // check if user has already uploaded THIS certificate
          const query1 = `SELECT * FROM certificates WHERE type = '${certificateType}' AND year = ${certificateYear} AND user_id = ${userId}`;
          db.query(query1, (err, data1) => {
            if (err) console.log(err);

            if (data1.length > 0) {
              deleteFile(uploadedFilePath);
              return res
                .status(422)
                .json({ error: "Ви вже завантажували цей сертифікат" });
            } else {
              // check name of logged in user and name on certificate
              const nameOnCertificate = lines[lines.length - 2]
                .split(" ")
                .reverse();

              if (
                nameOnCertificate[0] === userSurnameName[0] &&
                nameOnCertificate[1] === userSurnameName[1]
              ) {
                const filePathWithForwardSlash = uploadedFilePath
                  .replace(/\\/g, "/")
                  .replace(/^..\frontend\public/, "");
                const certificatePath = filePathWithForwardSlash.slice(18);

                const query = `INSERT INTO certificates(type, year, path, updated_at, user_id) VALUES ('${certificateType}', ${certificateYear}, '${certificatePath}', NOW(), ${userId})`;

                db.query(query, (err, data) => {
                  if (err) return res.status(500).json(err);

                  return res
                    .status(200)
                    .json({ message: "Сертифікат успішно завантажено" });
                });
              } else {
                deleteFile(uploadedFilePath);
                return res.status(422).json({
                  error:
                    "Це не Ваш сертифікат тому, що імена та прізвища не збігаються",
                });
              }
            }
          });
        }
      });
    });
  });
});

app.listen(8000, () => {
  console.log("Server is working!");
});

function findSchoolForText(text, schoolsArr) {
  // Normalize the text for case-insensitive comparison
  const normalizedText = text.toLowerCase();

  // Find the school that matches the text
  const matchingSchool = schoolsArr.find((school) =>
    normalizedText.includes(school.toLowerCase())
  );

  return matchingSchool || null;
}

function deleteFile(filepath) {
  fs.unlink(filepath, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Файл видалено");
    }
  });
}
