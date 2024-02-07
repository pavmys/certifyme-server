import { db } from "../db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = (req, res) => {
  // check existing user
  if (req.body.user_email.slice(-11) !== "@lnu.edu.ua") {
    return res.status(409).json("Ви ввели не корпоративну пошту університету");
  }

  const query = "SELECT * FROM users WHERE email = ?";

  db.query(query, [req.body.user_email], (err, data) => {
    if (err) return res.json(err);
    if (data.length) return res.status(409).json("Такий користувач уже існує");

    // hashing password
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(req.body.user_password, salt);

    const query =
      "INSERT INTO users(`surname`, `name`, `fathers_name`, `type`, `email`, `password`, `potik`, `course_number`, `group_number`, `specialty_id`) VALUES (?)";
    const values = [
      req.body.user_surname,
      req.body.user_name,
      req.body.user_fathers_name,
      "Студент",
      req.body.user_email,
      hash,
      req.body.user_potik,
      req.body.user_course_number,
      req.body.user_group_number,
      req.body.user_specialty,
    ];

    db.query(query, [values], (err, data) => {
      if (err) return res.json(err);
      return res.status(200).json("Користувача створено");
    });
  });
};

export const registerAnyUser = (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json("Не автентифіковано!");

  jwt.verify(token, "certifymekey", (err, userInfo) => {
    if (err) return res.status(403).json("Токен не валідний");

    const userId = userInfo.id;

    // check existing user
    if (req.body.user_email.slice(-11) !== "@lnu.edu.ua") {
      return res
        .status(409)
        .json("Ви ввели не корпоративну пошту університету");
    }

    const query = "SELECT * FROM users WHERE email = ?";
    db.query(query, [req.body.user_email], (err, data) => {
      if (err) return res.json(err);
      if (data.length)
        return res.status(409).json("Такий користувач уже існує");

      // hashing password
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(req.body.user_password, salt);

      const query =
        "INSERT INTO users(`surname`, `name`, `fathers_name`, `type`, `email`, `password`, `potik`, `course_number`, `group_number`, `cathedra_id`, `specialty_id`) VALUES (?)";
      const values = [
        req.body.user_surname,
        req.body.user_name,
        req.body.user_fathers_name,
        req.body.user_type,
        req.body.user_email,
        hash,
        req.body.user_potik,
        req.body.user_course_number,
        req.body.user_group_number,
        req.body.user_cathedra,
        req.body.user_specialty,
      ];

      db.query(query, [values], (err, data) => {
        if (err) return res.json(err);
        return res.status(200).json("Користувача створено");
      });
    });
  });
};

export const login = (req, res) => {
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Origin", "http://localhost:5173"); // Replace with your frontend's origin

  // check if user exists
  const query = "SELECT * FROM users WHERE email = ?";

  db.query(query, [req.body.user_email], (err, data) => {
    if (err) return res.json(err);
    if (data.length === 0) {
      return res.status(404).json("Користувача не знайдено");
    }

    // if user exists, check his password
    const isPasswordCorrect = bcrypt.compareSync(
      req.body.user_password,
      data[0].password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json("Неправильна пошта чи пароль");
    }

    const token = jwt.sign({ id: data[0].id }, "certifymekey", {
      expiresIn: "1h",
    });
    const { password, ...other } = data[0];

    res
      .cookie("access_token", token, { httpOnly: true })
      .status(200)
      .json(other);
  });
};

export const logout = (req, res) => {
  res
    .clearCookie("access_token", {
      sameSite: "none",
      secure: true,
      path: "/",
    })
    .status(200)
    .json("Користувач вийшов");
};
