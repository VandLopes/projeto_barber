const express = require("express");
const router = express.Router();
const db = require("../db");
const enviarEmail = require("../utils/email");

// Importa só a função que você exportou no módulo de agendamentos
const { calcularHorariosLivres } = require("./agendamentos");

// -------------------- ROTA: HORÁRIOS LIVRES --------------------
router.get("/horarios-livres", async (req, res) => {
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

// -------------------- ROTA: CRIAR AGENDAMENTO DO CLIENTE --------------------
router.post("/", async (req, res) => {
  try {
    const { clienteId, data, horario, servicos } = req.body;

    if (!clienteId || !data || !horario || !servicos || servicos.length === 0) {
      return res
        .status(400)
        .json({ error: "Dados incompletos para agendamento." });
    }

    // 1. Criar o agendamento
    const sqlAgendamento = `
      INSERT INTO agendamentos (data, horario, cliente_id, realizado)
      VALUES (?, ?, ?, ?)
    `;
    const [result] = await db.query(sqlAgendamento, [
      data,
      horario,
      clienteId,
      "Não",
    ]);

    const agendamentoId = result.insertId;

    // 2. Relacionar serviços
    const sqlServicos = `
      INSERT INTO agendamentos_servicos (agendamento_id, servico_id)
      VALUES ?
    `;
    const valores = servicos.map((id) => [agendamentoId, id]);
    await db.query(sqlServicos, [valores]);

    // 3. Buscar dados do cliente
    const [clienteData] = await db.query(
      "SELECT nome, email FROM clientes WHERE id = ?",
      [clienteId]
    );
    const cliente = clienteData[0];

    // 4. Buscar nomes dos serviços
    const [servicosInfo] = await db.query(
      `SELECT nome FROM servicos WHERE id IN (?)`,
      [servicos]
    );
    const servicosNomes = servicosInfo.map((s) => s.nome).join(", ");

    // 5. Modelo de e-mail
    const htmlEmail = `
      <h2>Agendamento Confirmado! 💈</h2>
      <p>Olá <strong>${cliente.nome}</strong>, seu agendamento foi confirmado.</p>

      <h3>📅 Detalhes do agendamento:</h3>
      <ul>
        <li><strong>Data:</strong> ${data}</li>
        <li><strong>Horário:</strong> ${horario}</li>
        <li><strong>Serviços:</strong> ${servicosNomes}</li>
      </ul>

      <p>Agradecemos sua preferência!</p>
      <p><strong>Barbearia</strong></p>
    `;

    // 6. Enviar e-mail
    await enviarEmail(cliente.email, "💈 Agendamento Confirmado", htmlEmail);

    res.status(201).json({ message: "Agendamento criado com sucesso!" });
  } catch (error) {
    console.error("Erro ao criar agendamento (cliente):", error);
    res.status(500).json({ error: "Erro interno ao criar agendamento." });
  }
});

// -------------------- ROTA: AGENDAMENTOS DO CLIENTE --------------------
router.get("/:clienteId", async (req, res) => {
  try {
    const { clienteId } = req.params;

    const [rows] = await db.query(
      `
      SELECT 
        a.id,
        DATE_FORMAT(a.data, '%Y-%m-%d') AS data,
        TIME_FORMAT(a.horario, '%H:%i') AS horario,
        GROUP_CONCAT(s.nome SEPARATOR ', ') AS servicos,
        SUM(s.preco) AS valor_total,
        a.realizado
      FROM agendamentos a
      JOIN agendamentos_servicos ac ON a.id = ac.agendamento_id
      JOIN servicos s ON ac.servico_id = s.id
      WHERE a.cliente_id = ?
      GROUP BY a.id
      ORDER BY a.data DESC, a.horario DESC
      `,
      [clienteId]
    );

    res.json(rows);
  } catch (error) {
    console.error("Erro ao buscar agendamentos do cliente:", error);
    res.status(500).json({ error: "Erro interno ao buscar agendamentos." });
  }
});

module.exports = router;
