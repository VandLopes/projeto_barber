const express = require("express");
const router = express.Router();
const db = require("../db"); // conexão pool do MySQL

// rota pública para clientes verem os serviços
router.get("/publico", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, nome, preco, duracao FROM servicos WHERE ativo = TRUE"
    );
    res.json(rows);
  } catch (err) {
    console.error("Erro ao buscar serviços públicos:", err);
    res.status(500).json({ error: "Erro ao buscar serviços." });
  }
});

// Listar serviços
router.get("/", async (req, res) => {
  try {
    // Adiciona a condição WHERE ativo = TRUE
    const sql =
      "SELECT id, nome, preco, duracao FROM servicos WHERE ativo = TRUE ORDER BY nome";
    const [servicos] = await db.query(sql);

    res.json(servicos);
  } catch (err) {
    // ...
  }
});

// Criar serviço
router.post("/", async (req, res) => {
  try {
    const { nome, preco, duracao_minutos } = req.body;
    const sql = "INSERT INTO servicos (nome, preco, duracao) VALUES (?, ?, ?)";

    const [result] = await db.query(sql, [nome, preco, duracao_minutos]);

    res
      .status(201)
      .json({ message: "Serviço criado com sucesso!", id: result.insertId });
  } catch (err) {
    // Envia uma mensagem de erro útil para o frontend
    console.error("Erro ao cadastrar serviço:", err);
    res.status(500).json({ error: "Erro interno ao cadastrar serviço." });
  }
});

// Atualizar serviço
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, preco, duracao_minutos } = req.body; // CORREÇÃO: Usando duracao_minutos

    const sql =
      "UPDATE servicos SET nome = ?, preco = ?, duracao = ? WHERE id = ?";
    const values = [nome, preco, duracao_minutos, id];

    const [result] = await db.query(sql, values);

    // CORREÇÃO: Verifica se alguma linha foi afetada
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Serviço não encontrado ou não houve alteração." });
    }

    res.json({ message: "Serviço atualizado com sucesso" });
  } catch (err) {
    console.error("Erro ao editar serviço:", err);
    res.status(500).json({ error: "Erro ao editar serviço" });
  }
});

// Excluir serviço
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Soft Delete: Atualiza o campo 'ativo' para FALSE em vez de deletar
    const [result] = await db.query(
      "UPDATE servicos SET ativo = FALSE WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Serviço não encontrado." });
    }

    // Mensagem indicando desativação, não exclusão física
    res.json({
      message:
        "Serviço desativado com sucesso. Ele não estará disponível para novos agendamentos.",
    });
  } catch (err) {
    console.error("Erro ao desativar serviço:", err);
    res.status(500).json({ error: "Erro interno do servidor." });
  }
});

module.exports = router;
