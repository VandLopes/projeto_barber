const express = require("express");
const router = express.Router();
const db = require("../db");
const { calcularHorariosLivres } = require("./agendamentos");

// --- ROTA PÚBLICA: consulta de horários livres ---
router.get("/agendamentos/horarios-livres", async (req, res) => {
  try {
    const { data, duracao } = req.query;

    if (!data || !duracao) {
      return res
        .status(400)
        .json({ error: "Data e duração são obrigatórias." });
    }

    const duracaoMin = parseInt(duracao);
    if (isNaN(duracaoMin) || duracaoMin <= 0) {
      return res.status(400).json({ error: "Duração inválida." });
    }

    const horarios = await calcularHorariosLivres(data, duracaoMin);
    res.json(horarios);
  } catch (err) {
    console.error("Erro ao buscar horários livres (cliente):", err);
    res.status(500).json({ error: "Erro ao buscar horários livres." });
  }
});

module.exports = router;

router.post("/login", async (req, res) => {
  const { nome, email, telefone } = req.body;

  try {
    const [rows] = await db.query(
      "SELECT * FROM clientes WHERE email = ? OR telefone = ?",
      [email, telefone]
    );

    if (rows.length > 0) {
      return res.json({
        id: rows[0].id,
        nome: rows[0].nome,
        mensagem: "Cliente encontrado com sucesso!",
      });
    }

    // Caso não exista, cria um novo cliente ativo
    const [result] = await db.query(
      "INSERT INTO clientes (nome, email, telefone, ativo) VALUES (?, ?, ?, true)",
      [nome, email, telefone]
    );

    res.status(201).json({
      id: result.insertId,
      nome,
      mensagem: "Novo cliente cadastrado com sucesso!",
    });
  } catch (err) {
    console.error("Erro ao fazer login/cadastro de cliente:", err);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

module.exports = router;
