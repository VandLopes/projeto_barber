const ServicosModel = require("../models/servicoModel");

const ServicosController = {
  getPublico: async (req, res) => {
    try {
      const servicos = await ServicosModel.listarPublico();
      res.json(servicos);
    } catch (err) {
      console.error("Erro ao buscar serviços públicos:", err);
      res.status(500).json({ error: "Erro ao buscar serviços." });
    }
  },

  getAll: async (req, res) => {
    try {
      const servicos = await ServicosModel.listar();
      res.json(servicos);
    } catch (err) {
      res.status(500).json({ error: "Erro ao carregar serviços." });
    }
  },

  create: async (req, res) => {
    try {
      const id = await ServicosModel.criar(req.body);
      res.status(201).json({ message: "Serviço criado com sucesso!", id });
    } catch (err) {
      console.error("Erro ao cadastrar serviço:", err);
      res.status(500).json({ error: "Erro interno ao cadastrar serviço." });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await ServicosModel.atualizar(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: "Serviço não encontrado." });
      }
      res.json({ message: "Serviço atualizado com sucesso!" });
    } catch (err) {
      console.error("Erro ao editar serviço:", err);
      res.status(500).json({ error: "Erro interno ao editar serviço." });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await ServicosModel.desativar(id);
      if (!deleted) {
        return res.status(404).json({ message: "Serviço não encontrado." });
      }
      res.json({
        message:
          "Serviço desativado com sucesso. Ele não estará disponível para novos agendamentos.",
      });
    } catch (err) {
      console.error("Erro ao desativar serviço:", err);
      res.status(500).json({ error: "Erro interno ao desativar serviço." });
    }
  },
};

module.exports = ServicosController;
