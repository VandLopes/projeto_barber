const db = require("../db");
const calcularHorariosLivres = require("../utils/calcularHorariosLivres");

module.exports = {
  async buscarPorCliente(clienteId) {
    const [rows] = await db.query(
      `
      SELECT 
        a.id,
        DATE_FORMAT(a.data, '%Y-%m-%d') AS data,
        TIME_FORMAT(a.horario, '%H:%i') AS horario,
        GROUP_CONCAT(s.nome SEPARATOR ', ') AS servicos
      FROM agendamentos a
      JOIN agendamentos_servicos ac ON ac.agendamento_id = a.id
      JOIN servicos s ON s.id = ac.servico_id
      WHERE a.cliente_id = ?
      GROUP BY a.id
      ORDER BY a.data DESC, a.horario DESC
      `,
      [clienteId]
    );

    return rows;
  },

  // Criar agendamento completo
  async criar({ clienteId, data, horario, servicos }) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1 — cria agendamento
      const [result] = await conn.query(
        `
        INSERT INTO agendamentos (cliente_id, data, horario, realizado)
        VALUES (?, ?, ?, 'Não')
        `,
        [clienteId, data, horario]
      );

      const agendamentoId = result.insertId;

      // 2 — vincula os serviços
      for (const servicoId of servicos) {
        await conn.query(
          `
          INSERT INTO agendamentos_servicos (agendamento_id, servico_id)
          VALUES (?, ?)
          `,
          [agendamentoId, servicoId]
        );
      }

      await conn.commit();
      return agendamentoId;
    } catch (error) {
      await conn.rollback();
      console.error("Erro model criar agendamento:", error);
      throw error;
    } finally {
      conn.release();
    }
  },

  async horariosLivres(data) {
    try {
      const horarios = await calcularHorariosLivres(data);
      return horarios;
    } catch (error) {
      console.error("Erro no model horariosLivres:", error);
      return [];
    }
  },

  async cancelar(id) {
    await db.query(`DELETE FROM agendamentos WHERE id = ?`, [id]);
    return true;
  },
};
