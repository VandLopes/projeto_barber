const clienteAgendamentoModel = require("../models/clienteAgendamentoModel");

module.exports = {
  async listarAgendamentosPorCliente(req, res) {
    try {
      const { clienteId } = req.params;

      const agendamentos = await clienteAgendamentoModel.buscarPorCliente(
        clienteId
      );

      res.json(agendamentos);
    } catch (error) {
      console.error("Erro controller listarAgendamentosPorCliente:", error);
      res.status(500).json({ error: "Erro ao buscar agendamentos." });
    }
  },

  async criarAgendamento(req, res) {
    try {
      const { clienteId, data, horario, servicos } = req.body;

      if (
        !clienteId ||
        !data ||
        !horario ||
        !servicos ||
        servicos.length === 0
      ) {
        return res.status(400).json({ erro: "Dados incompletos." });
      }

      const novoId = await clienteAgendamentoModel.criar({
        clienteId,
        data,
        horario,
        servicos,
      });

      res.json({
        mensagem: "Agendamento criado com sucesso!",
        agendamentoId: novoId,
      });
    } catch (erro) {
      console.error("Erro controller criarAgendamento:", erro);
      res.status(500).json({ erro: "Erro ao criar agendamento" });
    }
  },

  async listarHorariosLivres(req, res) {
    try {
      const { data } = req.params;

      const horarios = await clienteAgendamentoModel.horariosLivres(data);

      res.json(horarios);
    } catch (error) {
      console.error("Erro controller listarHorariosLivres:", error);
      res.status(500).json({ error: "Erro ao calcular horários livres." });
    }
  },

  async cancelarAgendamento(req, res) {
    try {
      const { id } = req.params;

      await clienteAgendamentoModel.cancelar(id);

      res.json({ message: "Agendamento cancelado com sucesso." });
    } catch (error) {
      console.error("Erro controller cancelarAgendamento:", error);
      res.status(500).json({ error: "Erro ao cancelar agendamento." });
    }
  },
};
