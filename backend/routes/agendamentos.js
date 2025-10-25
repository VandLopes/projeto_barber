const express = require("express");
const router = express.Router();
const db = require("../db"); // Pool do MySQL

// === FUNÇÃO DE CÁLCULO DE HORÁRIOS LIVRES ===
async function calcularHorariosLivres(data, duracaoRequerida, res) {
  const HORA_INICIO = 8; // Barbeiro começa às 8:00
  const HORA_FIM = 18; // Barbeiro termina às 18:00
  const INTERVALO_BASE = 30; // Intervalo de slots base em minutos

  const horariosOcupados = [];

  // 1. Busca agendamentos existentes no dia, SOMANDO a duração de todos os serviços
  try {
    const [agendamentosDoDia] = await db.query(
      `SELECT 
                TIME_FORMAT(a.horario, '%H:%i') as inicio, 
                SUM(s.duracao) as duracao_total 
             FROM agendamentos a
             JOIN agendamentos_servicos ac ON a.id = ac.agendamento_id
             JOIN servicos s ON ac.servico_id = s.id
             WHERE a.data = ?
             GROUP BY a.id`,
      [data]
    );

    agendamentosDoDia.forEach((ag) => {
      if (typeof ag.inicio === "string" && ag.inicio.includes(":")) {
        const [horas, minutos] = ag.inicio.split(":").map(Number);

        // Inicializa a data no fuso horário local
        const [ano, mes, dia] = data.split("-").map(Number);
        const inicio = new Date(ano, mes - 1, dia, horas, minutos, 0, 0);

        // Soma a duração total em minutos
        const duracaoEmMinutos = Number(ag.duracao_total) || 30;
        const fim = new Date(inicio.getTime() + duracaoEmMinutos * 60000);

        horariosOcupados.push({ inicio, fim });
      }
    });
  } catch (error) {
    console.error(
      "Erro fatal ao buscar agendamentos ocupados do BD (N:N):",
      error
    );
    return []; // Retorna vazio se a consulta falhar
  }

  const slotsLivres = [];

  // Configura os limites de horário com base na data correta
  const [ano, mes, dia] = data.split("-").map(Number);
  let horaAtual = new Date(ano, mes - 1, dia, HORA_INICIO, 0, 0, 0);

  const horaLimite = new Date(ano, mes - 1, dia, HORA_FIM, 0, 0, 0);

  // Itera por todos os slots possíveis
  while (horaAtual.getTime() < horaLimite.getTime()) {
    const slotFim = new Date(horaAtual.getTime() + duracaoRequerida * 60000);

    if (slotFim.getTime() > horaLimite.getTime()) {
      break;
    }

    let isLivre = true;

    // Verifica se o novo slot se sobrepõe
    for (const agendamento of horariosOcupados) {
      if (
        horaAtual.getTime() < agendamento.fim.getTime() &&
        slotFim.getTime() > agendamento.inicio.getTime()
      ) {
        isLivre = false;
        break;
      }
    }

    if (isLivre) {
      slotsLivres.push(
        `${String(horaAtual.getHours()).padStart(2, "0")}:${String(
          horaAtual.getMinutes()
        ).padStart(2, "0")}`
      );
    }

    // Avança para o próximo slot
    horaAtual.setTime(horaAtual.getTime() + INTERVALO_BASE * 60000);
  }

  return slotsLivres;
}

// === ROTAS ===

// Rota 1: GET /agendamentos/horarios-livres (Cálculo de Horários)
router.get("/horarios-livres", async (req, res) => {
  try {
    const { data, duracao } = req.query;

    if (!data || !duracao) {
      return res
        .status(400)
        .json({ error: "Data e duração são obrigatórios." });
    }

    const duracaoMinutos = parseInt(duracao);
    if (isNaN(duracaoMinutos) || duracaoMinutos <= 0) {
      return res.status(400).json({ error: "Duração inválida." });
    }

    const horarios = await calcularHorariosLivres(data, duracaoMinutos, res);
    res.json(horarios);
  } catch (err) {
    console.error("Erro no cálculo de horários livres:", err);
    res.status(500).json({ error: "Erro interno ao buscar horários livres." });
  }
});

router.get("/eventos", async (req, res) => {
  try {
    // Consulta todos os agendamentos necessários.
    // O cliente precisa ser ativo para aparecer (melhor prática de Soft Delete).
    const sql = `
  SELECT 
      a.id, 
      DATE_FORMAT(a.data, '%Y-%m-%d') AS data,
      DATE_FORMAT(a.horario, '%H:%i:%s') AS horario,
      c.nome AS cliente_nome,
      GROUP_CONCAT(s.nome SEPARATOR ', ') AS servicos_nomes,
      SUM(s.duracao) AS duracao_total
  FROM agendamentos a
  JOIN clientes c ON a.cliente_id = c.id
  JOIN agendamentos_servicos ac ON a.id = ac.agendamento_id
  JOIN servicos s ON ac.servico_id = s.id
  WHERE c.ativo = TRUE 
  GROUP BY a.id
`;
    const [agendamentos] = await db.query(sql);

    // Mapeia os dados do banco para o formato do FullCalendar
    const eventos = agendamentos.map((agendamento) => {
      // Combina data (YYYY-MM-DD) e horário (HH:mm:ss) para o formato ISO 8601
      // Usamos a duração total para calcular o 'end'
      const inicioISO = `${agendamento.data}T${agendamento.horario}`;

      // Calcula a hora de término
      const duracaoEmMinutos = Number(agendamento.duracao_total) || 30; // Garante uma duração mínima

      // Cria um objeto Date para calcular o fim (necessário se o MySQL não armazena o fim)
      // Se a.horario está em HH:mm:ss, e a.data em YYYY-MM-DD
      const [ano, mes, dia] = agendamento.data.split("-").map(Number);
      const [horas, minutos, segundos] = agendamento.horario
        .split(":")
        .map(Number);

      // Cria o objeto Date (ajuste o fuso horário se necessário, aqui assume o local do servidor)
      const dataInicio = new Date(ano, mes - 1, dia, horas, minutos, segundos);
      const dataFim = new Date(dataInicio.getTime() + duracaoEmMinutos * 60000);

      // Formata o fim para ISO string, ou apenas usa o objeto Date se for mais fácil
      const fimISO = dataFim.toISOString().substring(0, 19); // YYYY-MM-DDT_HH:mm:ss (Formato compatível com FullCalendar)

      return {
        id: agendamento.id,
        // Título: Nome do Cliente + (Serviços)
        title: `${agendamento.cliente_nome} (${agendamento.servicos_nomes})`,
        start: inicioISO,
        end: fimISO,
        allDay: false,
        // Você pode adicionar mais dados aqui para ser usado ao clicar no evento (extendedProps)
        extendedProps: {
          servicos: agendamento.servicos_nomes,
          duracao: duracaoEmMinutos,
        },
      };
    });

    res.json(eventos);
  } catch (err) {
    console.error(
      "Erro ao buscar eventos para o calendário (GET /eventos):",
      err
    );
    res
      .status(500)
      .json({ error: "Erro ao buscar agendamentos para o calendário." });
  }
});

// ==================== RELATÓRIO DE AGENDAMENTOS ====================
router.get("/relatorio", async (req, res) => {
  try {
    const sql = `
      SELECT 
        a.id AS numero,
        DATE_FORMAT(a.data, '%Y-%m-%d') AS data,
        SUM(s.preco) AS valor,
        GROUP_CONCAT(s.nome SEPARATOR ', ') AS servico,
        SUM(s.duracao) AS duracao,
        c.nome AS cliente,
        a.realizado
      FROM agendamentos a
      JOIN clientes c ON a.cliente_id = c.id
      JOIN agendamentos_servicos ac ON a.id = ac.agendamento_id
      JOIN servicos s ON ac.servico_id = s.id
      GROUP BY a.id
      ORDER BY a.data DESC, a.horario DESC
    `;

    const [rows] = await db.query(sql);

    // Padroniza o formato antes de enviar
    const relatorio = rows.map((ag) => ({
      numero: ag.numero,
      data: ag.data,
      valor: parseFloat(ag.valor).toFixed(2),
      servico: ag.servico,
      duracao: `${ag.duracao} min`,
      cliente: ag.cliente,
      realizado: ag.realizado ? "Sim" : "Não",
    }));

    res.json(relatorio);
  } catch (err) {
    console.error("Erro ao buscar relatório de agendamentos:", err);
    res
      .status(500)
      .json({ error: "Erro ao buscar relatório de agendamentos." });
  }
});

// Rota 2: Listar agendamentos (GET /agendamentos)
router.get("/", async (req, res) => {
  try {
    // Consulta N:N para listar todos os serviços de cada agendamento
    const [rows] = await db.query(
      `SELECT 
          a.id, 
          DATE_FORMAT(a.data, '%Y-%m-%d') AS data, 
          DATE_FORMAT(a.horario, '%H:%i:%s') AS horario, 
          a.realizado, 
          c.nome AS cliente_nome,
          GROUP_CONCAT(s.nome SEPARATOR ', ') AS servicos_nomes,
          SUM(s.duracao) AS duracao_total,
          SUM(s.preco) AS valor_total
        FROM agendamentos a
        JOIN clientes c ON a.cliente_id = c.id
        JOIN agendamentos_servicos ac ON a.id = ac.agendamento_id
        JOIN servicos s ON ac.servico_id = s.id
        GROUP BY a.id
        ORDER BY a.data DESC, a.horario DESC`
    );

    // Normaliza e garante que os tipos estejam corretos
    const agendamentosFormatados = rows.map((ag) => ({
      id: ag.id,
      data: ag.data, // já vem em YYYY-MM-DD (ok p/ frontend)
      horario: ag.horario, // já vem em HH:mm:ss (ok p/ frontend)
      cliente_nome: ag.cliente_nome,
      servicos_nomes: ag.servicos_nomes,
      duracao: Number(ag.duracao_total) || 0,
      valor: parseFloat(ag.valor_total) || 0,
      realizado: ag.realizado === 1 || ag.realizado === "Sim" ? "Sim" : "Não",
    }));

    res.json(agendamentosFormatados);
  } catch (err) {
    console.error("Erro ao buscar agendamentos (GET /):", err);
    res.status(500).json({ error: "Erro ao buscar agendamentos" });
  }
});

// Rota 3: Criar agendamento (POST /agendamentos)
router.post("/", async (req, res) => {
  try {
    const {
      data,
      horario,
      cliente_id,
      servicos, // Array de IDs de serviço
      realizado,
    } = req.body;

    if (!servicos || servicos.length === 0) {
      return res
        .status(400)
        .json({ error: "Pelo menos um serviço deve ser selecionado." });
    }

    // 1. Insere o Agendamento principal
    const sqlAgendamento = `
            INSERT INTO agendamentos 
                (data, horario, cliente_id, realizado)
            VALUES (?, ?, ?, ?)
        `;

    const [result] = await db.query(sqlAgendamento, [
      data,
      horario,
      cliente_id,
      realizado,
    ]);

    const agendamentoId = result.insertId;

    // 2. Insere os serviços na tabela de relacionamento (agendamentos_servicos)
    const sqlServicos =
      "INSERT INTO agendamentos_servicos (agendamento_id, servico_id) VALUES ?";
    const servicosValues = servicos.map((servicoId) => [
      agendamentoId,
      servicoId,
    ]);

    // O mysql2 suporta esta sintaxe para inserção de múltiplos valores
    await db.query(sqlServicos, [servicosValues]);

    res
      .status(201)
      .json({ message: "Agendamento criado com sucesso", id: agendamentoId });
  } catch (err) {
    console.error("Erro ao criar agendamento (POST /):", err);
    res.status(500).json({ error: "Erro ao criar agendamento" });
  }
});

// Rota 4: Editar agendamento (PUT /agendamentos/:id)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { data, horario, cliente_id, servicos, realizado } = req.body;

    if (!servicos || servicos.length === 0) {
      return res.status(400).json({
        error: "Pelo menos um serviço deve ser selecionado para edição.",
      });
    }

    // 1. Atualiza o Agendamento principal
    const sqlUpdate = `
            UPDATE agendamentos 
            SET data = ?, horario = ?, cliente_id = ?, realizado = ?
            WHERE id = ?
        `;

    const [resultUpdate] = await db.query(sqlUpdate, [
      data,
      horario,
      cliente_id,
      realizado,
      id,
    ]);

    if (resultUpdate.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Agendamento não encontrado para edição." });
    }

    // 2. Remove todos os serviços antigos (limpeza)
    await db.query(
      "DELETE FROM agendamentos_servicos WHERE agendamento_id = ?",
      [id]
    );

    // 3. Insere os novos serviços
    const sqlServicos =
      "INSERT INTO agendamentos_servicos (agendamento_id, servico_id) VALUES ?";
    const servicosValues = servicos.map((servicoId) => [id, servicoId]);
    await db.query(sqlServicos, [servicosValues]);

    res.json({ message: "Agendamento atualizado com sucesso" });
  } catch (err) {
    console.error("Erro ao editar agendamento (PUT /):", err);
    res.status(500).json({ error: "Erro ao editar agendamento" });
  }
});

// Rota 5: Excluir agendamento (DELETE /agendamentos/:id)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // O ON DELETE CASCADE no MySQL deve excluir primeiro da tabela agendamentos_servicos

    const sql = "DELETE FROM agendamentos WHERE id = ?";
    const [result] = await db.query(sql, [id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ error: "Agendamento não encontrado para exclusão." });
    }

    res.json({ message: "Agendamento excluído com sucesso" });
  } catch (err) {
    console.error("Erro ao excluir agendamento (DELETE /):", err);
    res.status(500).json({ error: "Erro ao excluir agendamento" });
  }
});

module.exports = router;
