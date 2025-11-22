const express = require("express");
const router = express.Router();
const loginCliente = require("../controllers/loginClienteController");

router.post("/login", loginCliente.loginPublico);

module.exports = router;
