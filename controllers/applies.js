import { db } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import multer from "multer";

// const { PDFDocument, StandardFonts, rgb, PDFName, sizeInBytes, degrees } = require('pdf-lib');
// const fontkit = require('@pdf-lib/fontkit');
import {
  PDFDocument,
  StandardFonts,
  rgb,
  PDFName,
  sizeInBytes,
  degrees,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
// import * as fontkit from '@btielen/pdf-lib-fontkit';
// import * as fontkit from "@pdf-lib/fontkit";
// const fontKit = require("@pdf-lib/fontkit");

export const uploadApply = (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json("Не автентифіковано!");

  jwt.verify(token, "certifymekey", (err, userInfo) => {
    if (err) return res.status(403).json("Токен не валідний");

    const userId = userInfo.id;

    // check if user has been already applied any certificate
    const query = `SELECT * FROM applies WHERE user_id = ${userId} AND course_id = ${req.body.course_id}`;
    db.query(query, (err, data) => {
      // if (err) console.log(err);
      if (err) return res.status(500).json(err);

      if (data.length > 0) {
        return res.status(409).json({
          error: "Ви вже подавали заявку на цей курс",
        });
      } else {
        // check if user has been already applied this certificate
        const query1 = `SELECT * FROM applies WHERE user_id = ${userId} AND course_id = ${req.body.course_id} AND certificate_id = ${req.body.id}`;
        db.query(query1, (err, data1) => {
          // if (err) console.log(err);
          if (err) return res.status(500).json(err);

          if (data1.length > 0) {
            return res.status(409).json({
              error: "Ви вже подавали заявку на цей курс",
            });
          } else {
            // insert apply to db and table
            const query2 = `INSERT INTO applies(user_id, course_id, certificate_id, applied_at, status) VALUES (${userId}, ${req.body.course_id}, ${req.body.id}, NOW(), 'На розгляді')`;
            db.query(query2, (err, data2) => {
              // if (err) console.log(err);
              if (err) return res.status(500).json(err);

              // update status of used certificate
              const query3 = `UPDATE certificates SET active = 0 WHERE id = ${req.body.id}`;
              db.query(query3, (err, data3) => {
                // if (err) console.log(err);
                if (err) return res.status(500).json(err);

                return res
                  .status(200)
                  .json({ message: "Заявку успішно створено" });
              });
            });
          }
        });
      }
    });
  });
};

export const getApplies = (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json("Не автентифіковано!");

  jwt.verify(token, "certifymekey", (err, userInfo) => {
    if (err) return res.status(403).json("Токен не валідний");

    const userId = userInfo.id;

    const subjectId = Number(req.body.subjectId);

    // get type of user
    const query = `SELECT * FROM users WHERE id = ${userId}`;
    db.query(query, (err, data) => {
      // if (err) console.log(err);
      if (err) return res.status(500).json(err);

      // console.log(data[0].type);
      if (data[0].type === "Студент") {
        // get all applies of current user
        const query1 = `SELECT applies.id, certificates.type, certificates.year, applies.applied_at, applies.status FROM applies INNER JOIN certificates ON applies.certificate_id = certificates.id WHERE applies.user_id = ${userId} AND applies.course_id = ${subjectId}`;
        db.query(query1, (err, data1) => {
          // if (err) console.log(err);
          if (err) return res.status(500).json(err);

          return res.status(200).json(data1);
        });
      } else if (data[0].type === "Викладач") {
        const query1 = `SELECT applies.id, users.surname, users.name, users.potik, users.course_number, users.group_number, certificates.type, certificates.year, applies.applied_at, applies.status, certificates.path 
        FROM applies 
        INNER JOIN users ON applies.user_id = users.id
        INNER JOIN certificates ON applies.certificate_id = certificates.id
        WHERE applies.course_id = ${subjectId}`;

        db.query(query1, (err, data1) => {
          // if (err) console.log(err);
          if (err) return res.status(500).json(err);

          // console.log(data1);
          return res.status(200).json(data1);
        });
      }
    });
  });
};

export const submitApply = (req, res) => {
  // console.log(req.body);
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json("Не автентифіковано!");

  jwt.verify(token, "certifymekey", (err, userInfo) => {
    if (err) return res.status(403).json("Токен не валідний");

    const userId = userInfo.id;

    const query = `UPDATE applies SET status = "Підтверджено" WHERE id = ${req.body.id}`;
    db.query(query, (err, data) => {
      // if (err) console.log(err);
      if (err) return res.status(500).json(err);

      return res.status(200).json("Заявку підтверджено");
    });
  });
};

export const generateApplication = (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json("Не автентифіковано!");

  jwt.verify(token, "certifymekey", (err, userInfo) => {
    if (err) return res.status(403).json("Токен не валідний");

    const userId = userInfo.id;
    const applyId = req.body.id;

    const query = `SELECT applies.id, users.surname, users.name, users.fathers_name, users.specialty_id, specialties.specialty_name, courses.course_name, certificates.type, certificates.year
      FROM applies
      INNER JOIN users ON applies.user_id = users.id
      INNER JOIN courses ON applies.course_id = courses.id
      INNER JOIN certificates ON applies.certificate_id = certificates.id
      INNER JOIN specialties ON specialties.specialty_id = users.specialty_id
      WHERE applies.id = ${applyId}`;

    db.query(query, async (err, data) => {
      // if (err) console.log(err);
      if (err) return res.status(500).json(err);

      const applicationData = data[0];
      // console.log(applicationData);
      const nameInitsialy = `${applicationData.surname} ${applicationData.name[0]}. ${applicationData.fathers_name[0]}.`;
      const todaysDate = new Date().toLocaleDateString();

      // This should be a Uint8Array or ArrayBuffer
      // This data can be obtained in a number of different ways
      // If your running in a Node environment, you could use fs.readFile()
      // In the browser, you could make a fetch() call and use res.arrayBuffer()
      const existingPdfBytes = fs.readFileSync("./statement_template.pdf");

      // Load a PDFDocument from the existing PDF bytes
      const pdfDoc = await PDFDocument.load(existingPdfBytes);

      //Add font kit to the project
      pdfDoc.registerFontkit(fontkit);

      // Embed the Helvetica font
      // const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Get the first page of the document
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];

      // Here it's where you start to add your custom using file system.
      const customFont = fs.readFileSync("./times_new_roman.ttf");

      // Add the font file content into the doc
      const cusFont = await pdfDoc.embedFont(customFont);

      // Get the width and height of the first page
      const { width, height } = firstPage.getSize();

      // Draw a string of text diagonally across the first page
      firstPage.drawText(
        `${applicationData.surname} ${applicationData.name} ${applicationData.fathers_name}`,
        {
          x: 200,
          y: 712,
          size: 16,
          font: cusFont,
          color: rgb(0, 0, 0),
        }
      );

      firstPage.drawText(
        `Визнання результатів навчання, здобутих у неформальній та інформальній освіті`,
        {
          x: 155,
          y: 562,
          size: 11,
          font: cusFont,
          color: rgb(0, 0, 0),
        }
      );

      firstPage.drawText(
        `${applicationData.specialty_id} ${applicationData.specialty_name}`,
        {
          x: 200,
          y: 485,
          size: 16,
          font: cusFont,
          color: rgb(0, 0, 0),
        }
      );

      firstPage.drawText(`${applicationData.course_name}`, {
        x: 190,
        y: 440,
        size: 16,
        font: cusFont,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(`${nameInitsialy}`, {
        x: 230,
        y: 330,
        size: 16,
        font: cusFont,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(`${applicationData.type} ${applicationData.year}`, {
        x: 135,
        y: 237,
        size: 11,
        font: cusFont,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText("Кількість годин: 120 / 4 кредити ECTS", {
        x: 135,
        y: 221,
        size: 11,
        font: cusFont,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(`${nameInitsialy}`, {
        x: 410,
        y: 160,
        size: 16,
        font: cusFont,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(`${todaysDate}`, {
        x: 270,
        y: 130,
        size: 16,
        font: cusFont,
        color: rgb(0, 0, 0),
      });

      const pngImageBytes = fs.readFileSync("./certifyme_stamp-withoutbg.png");

      const pngImage = await pdfDoc.embedPng(pngImageBytes);
      const pngDims = pngImage.scale(0.5);

      firstPage.drawImage(pngImage, {
        x: 480,
        y: 15,
        width: pngDims.width,
        height: pngDims.height,
      });

      firstPage.drawText("Згенеровано на платформі CertifyMe", {
        x: 470,
        y: 5,
        size: 6,
        font: cusFont,
        color: rgb(0, 0, 0),
      });

      // Serialize the PDFDocument to bytes (a Uint8Array)
      const pdfBytes = await pdfDoc.save();

      // Send the PDF as a response
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", 'attachment; filename="Zayava.pdf"');
      res.send(pdfBytes);

      return res.status(200).json("Дані файлу було надіслано на client side");
    });
  });
};
