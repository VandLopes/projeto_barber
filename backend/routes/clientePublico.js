const express = require("express");
const router = express.Router();

const clientesPublicoController = require("../controllers/clientesPublicoController");

router.post("/login", clientesPublicoController.loginPublico);

module.exports = router;
