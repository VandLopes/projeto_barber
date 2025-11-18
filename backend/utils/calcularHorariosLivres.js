const db = require("../db");

module.exports = async function calcularHorariosLivres(
  data,
  duracaoRequerida,
  editandoId
) {
  const HORA_INICIO = 8;
  const HORA_FIM = 18;
  const INTERVALO_BASE = 30;

  const horariosOcupados = [];

  try {
    let sql = `
      SELECT 
        a.id,
        TIME_FORMAT(a.horario, '%H:%i') as inicio, 
        SUM(s.duracao) as duracao_total 
      FROM agendamentos a
      JOIN agendamentos_servicos ac ON a.id = ac.agendamento_id
      JOIN servicos s ON ac.servico_id = s.id
      WHERE a.data = ?
    `;

    const params = [data];

    if (editandoId) {
      sql += ` AND a.id != ?`;
      params.push(editandoId);
    }

    sql += ` GROUP BY a.id`;

    const [agendamentosDoDia] = await db.query(sql, params);

    agendamentosDoDia.forEach((ag) => {
      if (!ag.inicio.includes(":")) return;

      const [h, m] = ag.inicio.split(":").map(Number);
      const [ano, mes, dia] = data.split("-").map(Number);

      const inicio = new Date(ano, mes - 1, dia, h, m, 0);
      const duracao = Number(ag.duracao_total) || 30;
      const fim = new Date(inicio.getTime() + duracao * 60000);

      horariosOcupados.push({ inicio, fim });
    });
  } catch (error) {
    console.error("Erro em calcularHorariosLivres:", error);
    return [];
  }

  const slotsLivres = [];
  const [ano, mes, dia] = data.split("-").map(Number);

  let horaAtual = new Date(ano, mes - 1, dia, HORA_INICIO, 0);
  const horaLimite = new Date(ano, mes - 1, dia, HORA_FIM, 0);

  while (horaAtual < horaLimite) {
    const slotFim = new Date(horaAtual.getTime() + duracaoRequerida * 60000);

    if (slotFim > horaLimite) break;

    let livre = true;
    for (const ag of horariosOcupados) {
      if (horaAtual < ag.fim && slotFim > ag.inicio) {
        livre = false;
        break;
      }
    }

    if (livre) {
      slotsLivres.push(
        `${String(horaAtual.getHours()).padStart(2, "0")}:${String(
          horaAtual.getMinutes()
        ).padStart(2, "0")}`
      );
    }

    horaAtual = new Date(horaAtual.getTime() + INTERVALO_BASE * 60000);
  }

  return slotsLivres;
};
