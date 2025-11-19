const express = require("express");
const router = express.Router();
const clienteAgendamentoController = require("../controllers/clienteAgendamentoController");

// Lista agendamentos do cliente
router.get(
  "/:clienteId",
  clienteAgendamentoController.listarAgendamentosPorCliente
);

// Cria novo agendamento
router.post("/", clienteAgendamentoController.criarAgendamento);

// Lista horários livres
router.get(
  "/horarios/livres/:data",
  clienteAgendamentoController.listarHorariosLivres
);

// Cancela agendamento
router.delete("/:id", clienteAgendamentoController.cancelarAgendamento);

module.exports = router;
