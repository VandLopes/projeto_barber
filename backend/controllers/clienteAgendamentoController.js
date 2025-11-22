const agendamentosModel = require("../models/agendamentosModel");
const enviarEmail = require("../utils/email");
const clientesModel = require("../models/clientesModel");
const agendamentoServicosModel = require("../models/agendamentoServicosModel");
const calcularHorariosLivres = require("../utils/calcularHorariosLivres");
const servicosModel = require("../models/servicosModel");

module.exports = {
  async listarAgendamentosPorCliente(req, res) {
    try {
      const { clienteId } = req.params;

      const agendamentos = await agendamentosModel.listarAgendamentosPorCliente(
        clienteId
      );

      // converte valores numéricos
      const formatado = agendamentos.map((ag) => ({
        ...ag,
        valor_total: Number(ag.valor_total || 0),
      }));

      res.json(formatado);
    } catch (error) {
      console.error("Erro controller listarAgendamentosPorCliente:", error);
      res.status(500).json({ error: "Erro ao buscar agendamentos." });
    }
  },

  async criar(req, res) {
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

      // Buscar dados do cliente (para pegar o email)
      const cliente = await clientesModel.buscarPorId(clienteId);

      if (!cliente) {
        return res.status(404).json({ erro: "Cliente não encontrado." });
      }

      const emailCliente = cliente.email;

      // Criar agendamento
      const id = await agendamentosModel.criar(data, horario, clienteId, "Não");

      // Inserir relação agendamento -> serviços
      await agendamentoServicosModel.inserirVarios(id, servicos);

      // Enviar email se o cliente tiver email
      if (emailCliente) {
        // Buscar nomes dos serviços
        const nomesServicos = await servicosModel.buscarNomesPorIds(servicos);

        const assunto = "Agendamento Confirmado 💈";

        const html = `
        <h2>Agendamento Confirmado! 💈</h2>

        <p>Olá <b>${cliente.nome}</b>, seu agendamento foi confirmado.</p>

        <h3>📅 Detalhes do agendamento:</h3>

        <p><b>Data:</b> ${data}</p>
        <p><b>Horário:</b> ${horario}</p>
        <p><b>Serviços:</b> ${nomesServicos.join(", ")}</p>

        <p>Agradecemos sua preferência!</p>
      `;

        enviarEmail(emailCliente, assunto, html);
      }

      res.json({ mensagem: "Agendamento criado com sucesso!", id });
    } catch (erro) {
      console.error("Erro controller criarAgendamento:", erro);
      res.status(500).json({ erro: "Erro ao criar agendamento." });
    }
  },

  async listarHorariosLivres(req, res) {
    try {
      const { data } = req.params;

      const horarios = await calcularHorariosLivres(data);

      res.json(horarios);
    } catch (error) {
      console.error("Erro controller listarHorariosLivres:", error);
      res.status(500).json({ error: "Erro ao calcular horários livres." });
    }
  },

  async cancelarAgendamento(req, res) {
    try {
      const { id } = req.params;

      await agendamentosModel.excluir(id);

      res.json({ message: "Agendamento cancelado com sucesso." });
    } catch (error) {
      console.error("Erro controller cancelarAgendamento:", error);
      res.status(500).json({ error: "Erro ao cancelar agendamento." });
    }
  },
};
