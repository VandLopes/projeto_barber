const express = require("express");
const router = express.Router();
const ClientesController = require("../controllers/clientesController");

// Rotas vinculadas ao controller
router.get("/", ClientesController.getAll);
router.post("/", ClientesController.create);
router.put("/:id", ClientesController.update);
router.delete("/:id", ClientesController.delete);

module.exports = router;
