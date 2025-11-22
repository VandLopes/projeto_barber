const loginClienteModel = require("../models/loginClienteModel");

module.exports = {
  async loginPublico(req, res) {
    const { nome, email, telefone } = req.body;

    try {
      // procura cliente por email ou telefone
      const cliente = await loginClienteModel.buscarPorEmailOuTelefone(
        email,
        telefone
      );

      if (cliente.length > 0) {
        return res.json({
          id: cliente[0].id,
          nome: cliente[0].nome,
          mensagem: "Cliente encontrado com sucesso!",
        });
      }

      // cria novo cliente caso não exista
      const novoId = await loginClienteModel.criar(nome, email, telefone);

      res.status(201).json({
        id: novoId,
        nome,
        mensagem: "Novo cliente cadastrado com sucesso!",
      });
    } catch (err) {
      console.error("Erro no login público:", err);
      res.status(500).json({ error: "Erro interno no servidor." });
    }
  },
};
