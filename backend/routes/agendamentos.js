const express = require("express");
const router = express.Router();
const agendamentosController = require("../controllers/agendamentosController");

router.get("/horarios-livres", agendamentosController.horariosLivres);
router.get("/eventos", agendamentosController.eventosCalendario);
router.get("/", agendamentosController.listar);
router.post("/", agendamentosController.criar);
router.put("/:id", agendamentosController.editar);
router.delete("/:id", agendamentosController.excluir);

module.exports = router;
