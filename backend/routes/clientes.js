const express = require("express");
const router = express.Router();
const db = require("../db"); // conexão pool do MySQL

// Listar clientes
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM clientes");
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
    const sql = "DELETE FROM clientes WHERE id = ?";
    await db.query(sql, [id]);
    res.json({ message: "Cliente excluído com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao excluir cliente" });
  }
});

module.exports = router;
