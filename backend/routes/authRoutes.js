const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/authController");

router.post("/registrar", AuthController.registrar);
router.post("/login", AuthController.login);

module.exports = router;
