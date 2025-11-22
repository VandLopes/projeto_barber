const db = require("../db");

const loginBarberModel = {
  buscarPorEmail: async (email) => {
    const [rows] = await db.query("SELECT * FROM usuarios WHERE email = ?", [
      email,
    ]);
    return rows;
  },

  registrar: async (nome, email, senhaHash) => {
    const [result] = await db.query(
      "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
      [nome, email, senhaHash]
    );

    return result.insertId;
  },
};

module.exports = loginBarberModel;
