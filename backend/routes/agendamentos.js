const express = require("express");
const router = express.Router();
const controller = require("../controllers/agendamentosController");

router.get("/horarios-livres", controller.horariosLivres);
router.get("/eventos", controller.eventosCalendario);
router.get("/", controller.listar);
router.post("/", controller.criar);
router.put("/:id", controller.editar);
router.delete("/:id", controller.excluir);

module.exports = router;
