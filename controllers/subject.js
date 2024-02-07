import { db } from "../db.js";
import jwt from "jsonwebtoken";

export const getSubjects = (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json("Не автентифіковано!");

  jwt.verify(token, "certifymekey", (err, userInfo) => {
    if (err) return res.status(403).json("Токен не валідний");

    const userId = userInfo.id;
    const query = "SELECT type, course_number FROM users WHERE id = ?";
    db.query(query, [userId], (err, data) => {
      if (err) return res.status(500).json(err);

      const userType = data[0].type;
      const courseNumber = data[0].course_number;

      if (userType === "Студент" && courseNumber) {
        const query1 = "SELECT * FROM courses WHERE course_number = ?";
        db.query(query1, [courseNumber], (err, data1) => {
          if (err) return res.status(500).json(err);

          return res.status(200).json(data1);
        });
      } else if (userType) {
        const query1 = "SELECT * FROM courses";
        db.query(query1, (err, data1) => {
          if (err) return res.status(500).json(err);

          return res.status(200).json(data1);
        });
      }
    });
  });
};

export const getProfileSubjects = (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json("Не автентифіковано!");

  jwt.verify(token, "certifymekey", (err, userInfo) => {
    if (err) return res.status(403).json("Токен не валідний");

    const userId = userInfo.id;
    const query = "SELECT * FROM courses WHERE teacher_id = ?";
    db.query(query, [userId], (err, data) => {
      if (err) return res.status(500).json(err);
      // console.log(data);

      return res.status(200).json(data);
    });
  });
};

export const getSubject = (req, res) => {
  const query =
    "SELECT `surname`, `name`, `fathers_name`, `course_name`, `course_description`, `teacher_id` FROM users u JOIN courses c ON u.id=c.teacher_id WHERE c.id=?";

  db.query(query, [req.params.id], (err, data) => {
    if (err) return res.status(500).json(err);

    return res.status(200).json(data[0]);
  });
};

export const addSubject = (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json("Не автентифіковано!");

  jwt.verify(token, "certifymekey", (err, userInfo) => {
    if (err) return res.status(403).json("Токен не валідний");

    const userId = userInfo.id;
    const query =
      "INSERT INTO `courses`(`course_name`, `course_description`, `course_specialty`, `course_number`, `teacher_id`) VALUES (?)";
    const values = [
      req.body.subject_name,
      req.body.subject_description,
      req.body.subject_specialty,
      req.body.subject__course,
      userId,
    ];

    db.query(query, [values], (err, data) => {
      if (err) return res.json(err);
      return res.status(200).json("Курс успішно створено");
    });
  });
};

export const removeSubject = (req, res) => {
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json("Не автентифіковано!");

  jwt.verify(token, "certifymekey", (err, userInfo) => {
    if (err) return res.status(403).json("Токен не валідний");

    const subjectId = req.params.id;
    const query = "DELETE FROM courses WHERE id = ? AND teacher_id = ?";

    db.query(query, [subjectId, userInfo.id], (err, data) => {
      if (err)
        return res.status(403).json("Ви можете видалити тільки свій предмет");

      return res.json("Предмет видалено");
    });
  });
};
