const express = require("express");
const router = express.Router();
const db = require("../db"); // conexão pool do MySQL

// Listar serviços
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM servicos");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar serviços" });
  }
});

// Criar serviço
router.post("/", async (req, res) => {
  try {
    const { nome, preco, duracao } = req.body;
    const sql = "INSERT INTO servicos (nome, preco, duracao) VALUES (?, ?, ?)";
    await db.query(sql, [nome, preco, duracao]);
    res.status(201).json({ message: "Serviço criado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar serviço" });
  }
});

// Atualizar serviço
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, preco, duracao } = req.body;
    const sql =
      "UPDATE servicos SET nome = ?, preco = ?, duracao = ? WHERE id = ?";
    await db.query(sql, [nome, preco, duracao, id]);
    res.json({ message: "Serviço atualizado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar serviço" });
  }
});

// Excluir serviço
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const sql = "DELETE FROM servicos WHERE id = ?";
    await db.query(sql, [id]);
    res.json({ message: "Serviço excluído com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao excluir serviço" });
  }
});

module.exports = router;
