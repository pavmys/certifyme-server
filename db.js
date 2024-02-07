import mysql from "mysql";

export const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "certifyme",
});

db.connect((err) => {
  if (err) {
    console.log("Error in connection to db");
  } else {
    console.log("Connected to db");
  }
});
