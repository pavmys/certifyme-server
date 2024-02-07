import { db } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// export const getAllUsers = (req, res) => {};

export const getUserInfo = (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json("Не автентифіковано!");

  jwt.verify(token, "certifymekey", (err, userInfo) => {
    if (err) return res.status(403).json("Токен не валідний");

    const userId = userInfo.id;

    const query = "SELECT * FROM users WHERE email = ?";
    db.query(query, [req.body.findEmail], (err, data) => {
      if (err) return res.status(500).json(err);

      return res.status(200).json(data[0]);
    });
  });
};

export const updateUserInfo = (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json("Не автентифіковано!");

  jwt.verify(token, "certifymekey", (err, userInfo) => {
    if (err) return res.status(403).json("Токен не валідний");

    const userId = userInfo.id;

    // hashing password
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.password, salt);

    const query = "SELECT type FROM users WHERE id = ?";
    db.query(query, [userId], (err, data) => {
      if (err) return res.status(500).json(err);

      if (data[0].type === "Адміністратор") {
        const query1 = "SELECT type, email FROM users WHERE id = ?";
        db.query(query1, [req.body.id], (err, data1) => {
          if (err) return res.status(500).json(err);

          if (data1[0].type === "Студент") {
            const query2 = `UPDATE users SET surname = '${req.body.surname}', name = '${req.body.name}', fathers_name = '${req.body.fathers_name}', email = '${req.body.email}', password = '${hash}', potik = '${req.body.potik}', course_number = ${req.body.course_number}, group_number = ${req.body.group_number}, specialty_id = ${req.body.specialty_id} WHERE id = ${req.body.id}`;
            db.query(query2, (err, data2) => {
              if (err) return res.status(500).json(err);

              return res.status(200).json("Дані користувача оновлено");
            });
          } else if (
            data1[0].type === "Викладач" ||
            data1[0].type === "Завідувач кафедри"
          ) {
            const query2 = `UPDATE users SET surname = '${req.body.surname}', name = '${req.body.name}', fathers_name = '${req.body.fathers_name}', email = '${req.body.email}', password = '${hash}', cathedra_id = ${req.body.cathedra_id} WHERE id = ${req.body.id}`;
            db.query(query2, (err, data2) => {
              if (err) return res.status(500).json(err);

              return res.status(200).json("Дані користувача оновлено");
            });
          } else if (
            data1[0].type === "Адміністратор" ||
            data1[0].type === "Деканат"
          ) {
            const query2 = `UPDATE users SET surname = '${req.body.surname}', name = '${req.body.name}', fathers_name = '${req.body.fathers_name}', email = '${req.body.email}', password = '${hash}' WHERE id = ${req.body.id}`;
            db.query(query2, (err, data2) => {
              if (err) return res.status(500).json(err);

              return res.status(200).json("Дані користувача оновлено");
            });
          }
        });
      } else {
        return res.status(403).json("Ви не адміністратор");
      }
    });
  });
};
