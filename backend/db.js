const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root",
  database: "barbearia",
  port: "3307",
});

module.exports = pool;
