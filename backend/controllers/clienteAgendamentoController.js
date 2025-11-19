const ClienteAgendamento = require("../models/clienteAgendamentoModel");

module.exports = {
  async listarAgendamentosPorCliente(req, res) {
    try {
      const { clienteId } = req.params;
      const agendamentos = await ClienteAgendamento.buscarPorCliente(clienteId);
      res.json(agendamentos);
    } catch (error) {
      console.error("Erro controller listarAgendamentosPorCliente:", error);
      res.status(500).json({ error: "Erro ao buscar agendamentos." });
    }
  },

  async criarAgendamento(req, res) {
    try {
      const dados = req.body;
      const novo = await ClienteAgendamento.criar(dados);
      res.status(201).json(novo);
    } catch (error) {
      console.error("Erro controller criarAgendamento:", error);
      res.status(500).json({ error: "Erro ao criar agendamento." });
    }
  },

  async listarHorariosLivres(req, res) {
    try {
      const { data } = req.params;
      const horarios = await ClienteAgendamento.horariosLivres(data);
      res.json(horarios);
    } catch (error) {
      console.error("Erro controller listarHorariosLivres:", error);
      res.status(500).json({ error: "Erro ao calcular horários livres." });
    }
  },

  async cancelarAgendamento(req, res) {
    try {
      const { id } = req.params;
      await ClienteAgendamento.cancelar(id);
      res.json({ message: "Agendamento cancelado com sucesso." });
    } catch (error) {
      console.error("Erro controller cancelarAgendamento:", error);
      res.status(500).json({ error: "Erro ao cancelar agendamento." });
    }
  },
};
