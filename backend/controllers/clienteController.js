const ClientesModel = require("../models/clienteModel");
const { listar } = require("./servicoController");

const ClientesController = {
  listar: async (req, res) => {
    try {
      const clientes = await ClientesModel.listar();
      res.json(clientes);
    } catch (err) {
      console.error("Erro ao buscar clientes:", err);
      res.status(500).json({ error: "Erro ao buscar clientes" });
    }
  },

  criar: async (req, res) => {
    try {
      const id = await ClientesModel.criar(req.body);
      res.status(201).json({ message: "Cliente criado com sucesso!", id });
    } catch (err) {
      console.error("Erro ao criar cliente:", err);
      res.status(500).json({ error: "Erro ao criar cliente" });
    }
  },

  atualizar: async (req, res) => {
    try {
      const { id } = req.params;
      const updated = await ClientesModel.atualizar(id, req.body);

      if (!updated) {
        return res.status(404).json({ error: "Cliente não encontrado." });
      }

      res.json({ message: "Cliente atualizado com sucesso" });
    } catch (err) {
      console.error("Erro ao atualizar cliente:", err);
      res.status(500).json({ error: "Erro ao atualizar cliente" });
    }
  },

  deletar: async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await ClientesModel.inativar(id);

      if (!deleted) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }

      res.json({
        message:
          "Cliente inativado com sucesso. Ele não estará mais ativo para agendamentos.",
      });
    } catch (err) {
      console.error("Erro ao inativar cliente:", err);
      res.status(500).json({ error: "Erro ao inativar cliente" });
    }
  },
};

module.exports = ClientesController;
