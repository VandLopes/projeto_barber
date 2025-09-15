const express = require("express");
const router = express.Router();
const db = require("../db"); // aqui é o pool do MySQL

// Listar agendamentos
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM agendamentos");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar agendamentos" });
  }
});

// Criar agendamento
router.post("/", async (req, res) => {
  try {
    const {
      data,
      inicio,
      fim,
      cliente,
      servico,
      barbeiro,
      valor,
      duracao,
      realizado,
    } = req.body;

    const sql = `
      INSERT INTO agendamentos 
        (data, inicio, fim, cliente, servico, barbeiro, valor, duracao, realizado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.query(sql, [
      data,
      inicio,
      fim,
      cliente,
      servico,
      barbeiro,
      valor,
      duracao,
      realizado,
    ]);

    res.status(201).json({ message: "Agendamento criado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar agendamento" });
  }
});

module.exports = router;
