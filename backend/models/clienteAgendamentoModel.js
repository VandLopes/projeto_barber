const db = require("../db");
const calcularHorariosLivres = require("../utils/calcularHorariosLivres");

module.exports = {
  // Buscar agendamentos do cliente
  async buscarPorCliente(clienteId) {
    const [rows] = await db.query(
      `SELECT 
        a.id, 
        a.data, 
        TIME_FORMAT(a.horario, '%H:%i') AS horario,
        s.nome AS servico
      FROM agendamentos a
      JOIN servicos s ON s.id = a.servico_id
      WHERE a.cliente_id = ?
      ORDER BY a.data ASC, a.horario ASC`,
      [clienteId]
    );
    return rows;
  },

  // Criar novo agendamento
  async criar({ cliente_id, servico_id, data, horario }) {
    const [result] = await db.query(
      `INSERT INTO agendamentos (cliente_id, servico_id, data, horario)
       VALUES (?, ?, ?, ?)`,
      [cliente_id, servico_id, data, horario]
    );

    return { id: result.insertId, cliente_id, servico_id, data, horario };
  },

  // Horários livres
  async horariosLivres(data, duracao) {
    try {
      const horarios = await calcularHorariosLivres(data, duracao, null);
      return horarios;
    } catch (error) {
      console.error("Erro no model horariosLivres:", error);
      return [];
    }
  },

  // Cancelar
  async cancelar(id) {
    await db.query(`DELETE FROM agendamentos WHERE id = ?`, [id]);
    return true;
  },
};
