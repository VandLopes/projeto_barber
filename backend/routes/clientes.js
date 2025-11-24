const express = require("express");
const router = express.Router();
const ClientesController = require("../controllers/clienteController");

// Rotas vinculadas ao controller
router.get("/", ClientesController.listar);
router.post("/", ClientesController.criar);
router.put("/:id", ClientesController.atualizar);
router.delete("/:id", ClientesController.deletar);

module.exports = router;
