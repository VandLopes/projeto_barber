const express = require("express");
const router = express.Router();
const db = require("../db"); // Pool do MySQL

// === FUNÇÃO DE CÁLCULO DE HORÁRIOS LIVRES ===
async function calcularHorariosLivres(data, duracaoRequerida, editandoId) {
  // <<< MUDANÇA AQUI: Recebe editandoId
  const HORA_INICIO = 8;
  const HORA_FIM = 18;
  const INTERVALO_BASE = 30;

  const horariosOcupados = [];

  // 1. Busca agendamentos existentes no dia
  try {
    // --- INÍCIO DA MUDANÇA ---

    // 1. Monta a query base
    let sql = `
      SELECT 
        a.id, -- Adicionado para depuração e para a cláusula !=
        TIME_FORMAT(a.horario, '%H:%i') as inicio, 
        SUM(s.duracao) as duracao_total 
      FROM agendamentos a
      JOIN agendamentos_servicos ac ON a.id = ac.agendamento_id
      JOIN servicos s ON ac.servico_id = s.id
      WHERE a.data = ?
    `;

    const params = [data];

    // 2. Se estiver editando, EXCLUI o próprio ID da verificação
    if (editandoId) {
      sql += ` AND a.id != ?`;
      params.push(editandoId);
    }

    // 3. Completa a query
    sql += ` GROUP BY a.id`;

    // 4. Executa a query dinâmica
    const [agendamentosDoDia] = await db.query(sql, params);

    // --- FIM DA MUDANÇA ---

    agendamentosDoDia.forEach((ag) => {
      if (typeof ag.inicio === "string" && ag.inicio.includes(":")) {
        const [horas, minutos] = ag.inicio.split(":").map(Number);
        const [ano, mes, dia] = data.split("-").map(Number);
        const inicio = new Date(ano, mes - 1, dia, horas, minutos, 0, 0);
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
    return [];
  }

  const slotsLivres = [];
  const [ano, mes, dia] = data.split("-").map(Number);
  let horaAtual = new Date(ano, mes - 1, dia, HORA_INICIO, 0, 0, 0);
  const horaLimite = new Date(ano, mes - 1, dia, HORA_FIM, 0, 0, 0);

  while (horaAtual.getTime() < horaLimite.getTime()) {
    const slotFim = new Date(horaAtual.getTime() + duracaoRequerida * 60000);

    if (slotFim.getTime() > horaLimite.getTime()) {
      break;
    }

    let isLivre = true;
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
    horaAtual.setTime(horaAtual.getTime() + INTERVALO_BASE * 60000);
  }

  return slotsLivres;
}

// === ROTAS ===

// Rota 1: GET /agendamentos/horarios-livres (Cálculo de Horários)
router.get("/horarios-livres", async (req, res) => {
  try {
    // <<< MUDANÇA AQUI: Pega o editandoId da query >>>
    const { data, duracao, editandoId } = req.query;

    if (!data || !duracao) {
      return res
        .status(400)
        .json({ error: "Data e duração são obrigatórios." });
    }

    const duracaoMinutos = parseInt(duracao);
    if (isNaN(duracaoMinutos) || duracaoMinutos <= 0) {
      return res.status(400).json({ error: "Duração inválida." });
    }

    // <<< MUDANÇA AQUI: Passa o editandoId para a função >>>
    const horarios = await calcularHorariosLivres(
      data,
      duracaoMinutos,
      editandoId
    );
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
      realizado: ag.realizado === "Sim" ? "Sim" : "Não",
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
          a.cliente_id,                     -- <<< 1. ADICIONADO AQUI
          GROUP_CONCAT(s.nome SEPARATOR ', ') AS servicos_nomes,
          GROUP_CONCAT(s.id SEPARATOR ',') AS servicos_ids, -- <<< 2. ADICIONADO AQUI
          SUM(s.duracao) AS duracao_total,
          SUM(s.preco) AS valor_total
        FROM agendamentos a
        JOIN clientes c ON a.cliente_id = c.id
        JOIN agendamentos_servicos ac ON a.id = ac.agendamento_id
        JOIN servicos s ON ac.servico_id = s.id
        GROUP BY a.id, a.data, a.horario, a.realizado, c.nome, a.cliente_id -- <<< 3. ATUALIZADO AQUI
        ORDER BY a.data DESC, a.horario DESC`
    );

    // Normaliza e garante que os tipos estejam corretos
    const agendamentosFormatados = rows.map((ag) => {
      // 4. Processa a string de IDs (ex: "1,3") para um array de números [1, 3]
      const servicosIdsArray = ag.servicos_ids
        ? ag.servicos_ids.split(",").map(Number)
        : [];

      return {
        id: ag.id,
        data: ag.data,
        horario: ag.horario,
        cliente_nome: ag.cliente_nome,
        cliente_id: ag.cliente_id, // <<< 5. ADICIONADO AQUI
        servicos_nomes: ag.servicos_nomes,
        servicos_ids: servicosIdsArray, // <<< 6. ADICIONADO AQUI
        duracao: Number(ag.duracao_total) || 0,
        valor: parseFloat(ag.valor_total) || 0,
        realizado: ag.realizado === 1 || ag.realizado === "Sim" ? "Sim" : "Não",
      };
    });

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
    const dataInformada = new Date(data);
    const hoje = new Date();

    hoje.setHours(0, 0, 0, 0);
    dataInformada.setHours(0, 0, 0, 0);

    if (dataInformada < hoje) {
      return res.status(400).json({
        error: "Não é permitido criar agendamentos em datas passadas.",
      });
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
module.exports.calcularHorariosLivres = calcularHorariosLivres;
