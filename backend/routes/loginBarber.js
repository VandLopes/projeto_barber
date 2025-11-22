const express = require("express");
const router = express.Router();
const loginBarber = require("../controllers/loginBarberController");

router.post("/registrar", loginBarber.registrar);
router.post("/login", loginBarber.login);

module.exports = router;
