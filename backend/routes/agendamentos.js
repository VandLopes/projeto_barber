const express = require("express");
const router = express.Router();
const agendamentosController = require("../controllers/agendamentoController");

router.get("/horarios-livres", agendamentosController.horariosLivres);
router.get("/eventos", agendamentosController.eventosCalendario);
router.get("/", agendamentosController.listar);
router.get("/relatorio", agendamentosController.relatorio);
router.post("/", agendamentosController.criar);
router.put("/:id", agendamentosController.editar);
router.delete("/:id", agendamentosController.deletar);

module.exports = router;
