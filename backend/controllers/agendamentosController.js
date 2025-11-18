const agendamentosModel = require("../models/agendamentosModel");
const agendamentoServicosModel = require("../models/agendamentoServicosModel");

const calcularHorariosLivres = require("../utils/calcularHorariosLivres");

module.exports = {
  async horariosLivres(req, res) {
    try {
      const { data, duracao, editandoId } = req.query;

      if (!data || !duracao)
        return res
          .status(400)
          .json({ error: "Data e duração são obrigatórios." });

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
      const { data, horario, cliente_id, servicos, realizado } = req.body;

      if (!servicos || servicos.length === 0)
        return res
          .status(400)
          .json({ error: "Selecione ao menos um serviço." });

      const id = await agendamentosModel.criar(
        data,
        horario,
        cliente_id,
        realizado
      );

      await agendamentoServicosModel.inserirVarios(id, servicos);

      res.status(201).json({ message: "Agendamento criado!", id });
    } catch (err) {
      res.status(500).json({ error: "Erro ao criar agendamento" });
    }
  },

  async editar(req, res) {
    try {
      const { id } = req.params;
      const { data, horario, cliente_id, servicos, realizado } = req.body;

      await agendamentosModel.atualizar(
        id,
        data,
        horario,
        cliente_id,
        realizado
      );

      await agendamentoServicosModel.limparPorAgendamento(id);
      await agendamentoServicosModel.inserirVarios(id, servicos);

      res.json({ message: "Agendamento atualizado!" });
    } catch (err) {
      res.status(500).json({ error: "Erro ao editar agendamento" });
    }
  },

  async excluir(req, res) {
    try {
      const { id } = req.params;

      const removido = await agendamentosModel.excluir(id);
      if (!removido)
        return res.status(404).json({ error: "Agendamento não encontrado" });

      res.json({ message: "Agendamento excluído!" });
    } catch (err) {
      res.status(500).json({ error: "Erro ao excluir" });
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
