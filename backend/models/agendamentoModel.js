const db = require("../db");

module.exports = {
  listarAgendamentosPorCliente: async (clienteId) => {
    const [rows] = await db.query(
      `
      SELECT 
        a.id,
        DATE_FORMAT(a.data, '%Y-%m-%d') AS data,
        TIME_FORMAT(a.horario, '%H:%i') AS horario,
        GROUP_CONCAT(s.nome SEPARATOR ', ') AS servicos,
        SUM(s.preco) AS valor_total,
        a.realizado
      FROM agendamentos a
      JOIN agendamentos_servicos ac ON a.id = ac.agendamento_id
      JOIN servicos s ON ac.servico_id = s.id
      WHERE a.cliente_id = ?
      GROUP BY a.id
      ORDER BY a.data DESC, a.horario DESC
      `,
      [clienteId]
    );

    return rows;
  },
  async listarTodos() {
    const [rows] = await db.query(`
      SELECT 
        a.id,
        DATE_FORMAT(a.data, '%Y-%m-%d') AS data,
        DATE_FORMAT(a.horario, '%H:%i:%s') AS horario,
        a.realizado,
        c.nome AS cliente_nome,
        a.cliente_id,
        GROUP_CONCAT(s.nome SEPARATOR ', ') AS servicos_nomes,
        GROUP_CONCAT(s.id SEPARATOR ',') AS servicos_ids,
        SUM(s.duracao) AS duracao_total,
        SUM(s.preco) AS valor_total
      FROM agendamentos a
      JOIN clientes c ON a.cliente_id = c.id
      JOIN agendamentos_servicos ac ON a.id = ac.agendamento_id
      JOIN servicos s ON ac.servico_id = s.id
      GROUP BY a.id
      ORDER BY a.data DESC, a.horario DESC
    `);

    return rows;
  },

  async criar(data, horario, cliente_id, realizado) {
    const [result] = await db.query(
      `INSERT INTO agendamentos (data, horario, cliente_id, realizado)
       VALUES (?, ?, ?, ?)`,
      [data, horario, cliente_id, realizado]
    );

    return result.insertId;
  },

  async atualizar(id, data, horario, cliente_id, realizado) {
    const [result] = await db.query(
      `UPDATE agendamentos
       SET data=?, horario=?, cliente_id=?, realizado=?
       WHERE id=?`,
      [data, horario, cliente_id, realizado, id]
    );

    return result.affectedRows;
  },

  async excluir(id) {
    const [result] = await db.query("DELETE FROM agendamentos WHERE id=?", [
      id,
    ]);
    return result.affectedRows;
  },

  async listarEventosCalendario() {
    const [rows] = await db.query(`
      SELECT 
        a.id,
        DATE_FORMAT(a.data, '%Y-%m-%d') AS data,
        DATE_FORMAT(a.horario, '%H:%i:%s') AS horario,
        c.nome AS cliente_nome,
        GROUP_CONCAT(s.nome SEPARATOR ', ') AS servicos_nomes,
        SUM(s.duracao) AS duracao_total
      FROM agendamentos a
      JOIN clientes c ON a.cliente_id = c.id
      JOIN agendamentos_servicos ac ON a.id = ac.agendamento_id
      JOIN servicos s ON ac.servico_id = s.id
      WHERE c.ativo = TRUE
      GROUP BY a.id
    `);

    return rows;
  },
};
