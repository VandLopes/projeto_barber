const express = require("express");
const router = express.Router();
const clienteAgendamentoController = require("../controllers/clienteAgendamentoController");

router.get(
  "/horarios/livres/:data",
  clienteAgendamentoController.listarHorariosLivres
);
router.get(
  "/:clienteId",
  clienteAgendamentoController.listarAgendamentosPorCliente
);
router.post("/", clienteAgendamentoController.criar);

module.exports = router;
