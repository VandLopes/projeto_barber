const express = require("express");
const router = express.Router();
const ServicosController = require("../controllers/servicosController");

// Rota pública
router.get("/publico", ServicosController.getPublico);

// Rotas autenticadas
router.get("/", ServicosController.getAll);
router.post("/", ServicosController.create);
router.put("/:id", ServicosController.update);
router.delete("/:id", ServicosController.delete);

module.exports = router;
