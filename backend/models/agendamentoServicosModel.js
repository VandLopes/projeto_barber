const db = require("../db");

module.exports = {
  async inserirVarios(agendamentoId, servicosIds) {
    const values = servicosIds.map((id) => [agendamentoId, id]);
    return db.query(
      "INSERT INTO agendamentos_servicos (agendamento_id, servico_id) VALUES ?",
      [values]
    );
  },

  async limparPorAgendamento(agendamentoId) {
    return db.query(
      "DELETE FROM agendamentos_servicos WHERE agendamento_id=?",
      [agendamentoId]
    );
  },
};
