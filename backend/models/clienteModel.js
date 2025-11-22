const db = require("../db");

const ClientesModel = {
  listar: async () => {
    const [rows] = await db.query(
      "SELECT id, nome, email, telefone FROM clientes WHERE ativo = TRUE ORDER BY nome"
    );
    return rows;
  },

  buscarPorId: async (id) => {
    const [rows] = await db.query(
      "SELECT id, nome, email, telefone FROM clientes WHERE id = ? AND ativo = TRUE",
      [id]
    );
    return rows[0] || null;
  },

  criar: async ({ nome, email, telefone }) => {
    const [result] = await db.query(
      "INSERT INTO clientes (nome, email, telefone) VALUES (?, ?, ?)",
      [nome, email, telefone]
    );
    return result.insertId;
  },

  atualizar: async (id, { nome, email, telefone }) => {
    const [result] = await db.query(
      "UPDATE clientes SET nome = ?, email = ?, telefone = ? WHERE id = ?",
      [nome, email, telefone, id]
    );
    return result.affectedRows;
  },

  inativar: async (id) => {
    const [result] = await db.query(
      "UPDATE clientes SET ativo = FALSE WHERE id = ?",
      [id]
    );
    return result.affectedRows;
  },
};

module.exports = ClientesModel;
