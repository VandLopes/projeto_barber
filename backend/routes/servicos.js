const express = require("express");
const router = express.Router();
const ServicosController = require("../controllers/servicoController");

// Rota pública
router.get("/publico", ServicosController.listarPublico);

// Rotas autenticadas
router.get("/", ServicosController.listar);
router.post("/", ServicosController.criar);
router.put("/:id", ServicosController.atualizar);
router.delete("/:id", ServicosController.deletar);

module.exports = router;
