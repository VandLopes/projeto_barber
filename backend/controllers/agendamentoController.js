const agendamentosModel = require("../models/agendamentoModel");
const agendamentoServicosModel = require("../models/agendamentoServicoModel");
const enviarEmail = require("../utils/email");
const calcularHorariosLivres = require("../utils/calcularHorariosLivres");
const clientesModel = require("../models/clienteModel");
const servicosModel = require("../models/servicoModel");

module.exports = {
  async horariosLivres(req, res) {
    try {
      const { data, duracao, editandoId } = req.query;

      if (!data || !duracao) {
        return res
          .status(400)
          .json({ error: "Data e duração são obrigatórios." });
      }

      const horarios = await calcularHorariosLivres(
        data,
        parseInt(duracao),
        editandoId
      );

      res.json(horarios);
    } catch (err) {
      res.status(500).json({ error: "Erro ao calcular horários livres." });
    }
  },

  async listar(req, res) {
    try {
      const ags = await agendamentosModel.listarTodos();

      const formatado = ags.map((ag) => ({
        ...ag,
        servicos_ids: ag.servicos_ids
          ? ag.servicos_ids.split(",").map(Number)
          : [],
        duracao: Number(ag.duracao_total) || 0,
        valor: Number(ag.valor_total) || 0,
      }));

      res.json(formatado);
    } catch (err) {
      res.status(500).json({ error: "Erro ao buscar agendamentos" });
    }
  },

  async criar(req, res) {
    try {
      const clienteId = req.body.clienteId || req.body.cliente_id;
      const { data, horario, servicos } = req.body;

      if (
        !clienteId ||
        !data ||
        !horario ||
        !servicos ||
        servicos.length === 0
      ) {
        return res.status(400).json({ erro: "Dados incompletos." });
      }

      const servicosIds = servicos.map(Number);

      // Criar agendamento
      const id = await agendamentosModel.criar(data, horario, clienteId, "Não");

      await agendamentoServicosModel.inserirVarios(id, servicosIds);

      // Buscar cliente
      const cliente = await clientesModel.buscarPorId(clienteId);
      if (!cliente) {
        return res.status(404).json({ erro: "Cliente não encontrado." });
      }

      if (cliente.email) {
        // Buscar nomes dos serviços
        const nomesServicos = await servicosModel.buscarNomesPorIds(
          servicosIds
        );

        const assunto = "Agendamento Confirmado! 💈";

        const html = `
        <h2>Agendamento Confirmado! 💈</h2>

        <p>Olá <b>${cliente.nome}</b>, seu agendamento foi confirmado.</p>

        <h3>📅 Detalhes do agendamento:</h3>

        <p><b>Data:</b> ${data}</p>
        <p><b>Horário:</b> ${horario}</p>
        <p><b>Serviços:</b> ${nomesServicos.join(", ")}</p>

        <p>Agradecemos sua preferência!</p>
      `;

        enviarEmail(cliente.email, assunto, html);
      }

      res.json({ mensagem: "Agendamento criado com sucesso!", id });
    } catch (erro) {
      console.error("Erro ao criar agendamento (barbeiro):", erro);
      res.status(500).json({ erro: "Erro ao criar agendamento." });
    }
  },

  async editar(req, res) {
    try {
      const { id } = req.params;
      const { data, horario, servicos, realizado } = req.body;
      const clienteId = req.body.cliente_id || req.body.clienteId;

      await agendamentosModel.atualizar(
        id,
        data,
        horario,
        clienteId,
        realizado
      );

      await agendamentoServicosModel.limparPorAgendamento(id);
      await agendamentoServicosModel.inserirVarios(id, servicos);

      res.json({ message: "Agendamento atualizado!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao editar agendamento" });
    }
  },

  async deletar(req, res) {
    try {
      const { id } = req.params;

      const removido = await agendamentosModel.deletar(id);
      if (!removido) {
        return res.status(404).json({ error: "Agendamento não encontrado" });
      }

      res.json({ message: "Agendamento excluído!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Erro ao excluir" });
    }
  },

  async relatorio(req, res) {
    try {
      const dados = await agendamentosModel.listarParaRelatorio();
      return res.json(dados);
    } catch (err) {
      console.error("Erro ao gerar relatório:", err);
      return res.status(500).json({ error: "Erro ao gerar relatório." });
    }
  },

  async eventosCalendario(req, res) {
    try {
      const eventos = await agendamentosModel.listarEventosCalendario();

      const formatado = eventos.map((ag) => {
        const [ano, mes, dia] = ag.data.split("-").map(Number);
        const [h, m, s] = ag.horario.split(":").map(Number);

        const inicio = new Date(ano, mes - 1, dia, h, m, s);
        const fim = new Date(inicio.getTime() + ag.duracao_total * 60000);

        return {
          id: ag.id,
          title: `${ag.cliente_nome} (${ag.servicos_nomes})`,
          start: `${ag.data}T${ag.horario}`,
          end: fim.toISOString().slice(0, 19),
          allDay: false,
        };
      });

      res.json(formatado);
    } catch (err) {
      res.status(500).json({ error: "Erro ao carregar eventos" });
    }
  },
};
