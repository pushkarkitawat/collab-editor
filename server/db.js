const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",   // 🔥 IMPORTANT
  user: "root",
  password: "Pushkar@1234",
  database: "collab_editor",
  port: 5000
});

db.connect((err) => {
  if (err) {
    console.error("MySQL Error:", err);
    return;
  }
  console.log("MySQL Connected");
});

module.exports = db;
