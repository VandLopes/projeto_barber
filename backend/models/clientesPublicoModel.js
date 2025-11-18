const db = require("../db");

module.exports = {
  async listarAtivos() {
    const [rows] = await db.query(
      "SELECT id, nome, email, telefone FROM clientes WHERE ativo = TRUE ORDER BY nome"
    );
    return rows;
  },

  async buscarPorEmailOuTelefone(email, telefone) {
    const [rows] = await db.query(
      "SELECT * FROM clientes WHERE email = ? OR telefone = ?",
      [email, telefone]
    );
    return rows;
  },

  async criar(nome, email, telefone) {
    const [result] = await db.query(
      "INSERT INTO clientes (nome, email, telefone, ativo) VALUES (?, ?, ?, TRUE)",
      [nome, email, telefone]
    );
    return result.insertId;
  },

  async atualizar(id, nome, email, telefone) {
    const [result] = await db.query(
      "UPDATE clientes SET nome = ?, email = ?, telefone = ? WHERE id = ?",
      [nome, email, telefone, id]
    );
    return result.affectedRows;
  },

  async softDelete(id) {
    const [result] = await db.query(
      "UPDATE clientes SET ativo = FALSE WHERE id = ?",
      [id]
    );
    return result.affectedRows;
  },
};
