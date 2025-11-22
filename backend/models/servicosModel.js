const db = require("../db");

const ServicosModel = {
  listarPublico: async () => {
    const [rows] = await db.query(
      "SELECT id, nome, preco, duracao FROM servicos WHERE ativo = TRUE"
    );
    return rows;
  },

  listar: async () => {
    const [rows] = await db.query(
      "SELECT id, nome, preco, duracao FROM servicos WHERE ativo = TRUE ORDER BY nome"
    );
    return rows;
  },

  criar: async ({ nome, preco, duracao_minutos }) => {
    const [result] = await db.query(
      "INSERT INTO servicos (nome, preco, duracao) VALUES (?, ?, ?)",
      [nome, preco, duracao_minutos]
    );
    return result.insertId;
  },

  atualizar: async (id, { nome, preco, duracao_minutos }) => {
    const [result] = await db.query(
      "UPDATE servicos SET nome = ?, preco = ?, duracao = ? WHERE id = ?",
      [nome, preco, duracao_minutos, id]
    );
    return result.affectedRows;
  },

  desativar: async (id) => {
    const [result] = await db.query(
      "UPDATE servicos SET ativo = FALSE WHERE id = ?",
      [id]
    );
    return result.affectedRows;
  },

  buscarNomesPorIds: async (ids) => {
    if (!ids || ids.length === 0) return [];

    const [rows] = await db.query(
      `SELECT nome FROM servicos WHERE id IN (${ids.map(() => "?").join(",")})`,
      ids
    );

    return rows.map((row) => row.nome);
  },
};

module.exports = ServicosModel;
