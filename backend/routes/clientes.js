const express = require("express");
const router = express.Router();
const db = require("../db"); // conexão pool do MySQL

// Listar clientes
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, nome, email, telefone FROM clientes WHERE ativo = TRUE ORDER BY nome"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar clientes" });
  }
});

// Criar cliente
router.post("/", async (req, res) => {
  try {
    const { nome, email, telefone } = req.body;
    const sql = "INSERT INTO clientes (nome, email, telefone) VALUES (?, ?, ?)";
    await db.query(sql, [nome, email, telefone]);
    res.status(201).json({ message: "Cliente criado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar cliente" });
  }
});

// Atualizar cliente
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, telefone } = req.body;
    const sql =
      "UPDATE clientes SET nome = ?, email = ?, telefone = ? WHERE id = ?";
    await db.query(sql, [nome, email, telefone, id]);
    res.json({ message: "Cliente atualizado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar cliente" });
  }
});

// Excluir cliente
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    // MUDANÇA CRUCIAL: Troca de DELETE para UPDATE (Soft Delete)
    const sql = "UPDATE clientes SET ativo = FALSE WHERE id = ?";
    const [result] = await db.query(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Cliente não encontrado." });
    }

    // Altera a mensagem para refletir a inativação
    res.json({
      message:
        "Cliente inativado com sucesso. Ele não estará mais ativo para agendamentos.",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao inativar cliente" });
  }
});

module.exports = router;
