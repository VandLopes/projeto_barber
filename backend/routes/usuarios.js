const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db"); // conexão MySQL

const SECRET = "chave_secreta"; // ideal pegar de variável de ambiente

// Registrar usuário
router.post("/registrar", async (req, res) => {
  const { nome, email, senha } = req.body;

  try {
    // verifica se já existe usuário com esse email
    const [existe] = await db.query("SELECT * FROM usuarios WHERE email = ?", [
      email,
    ]);
    if (existe.length > 0) {
      return res.status(400).json({ error: "Email já cadastrado" });
    }

    // criptografa a senha
    const hash = await bcrypt.hash(senha, 10);

    // insere no banco
    await db.query(
      "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)",
      [nome, email, hash]
    );

    res.status(201).json({ message: "Usuário registrado com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao registrar usuário" });
  }
});

// Login
router.post("/login", async (req, res) => {
  const { email, senha } = req.body;

  try {
    const [rows] = await db.query("SELECT * FROM usuarios WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(400).json({ error: "Usuário não encontrado" });
    }

    const usuario = rows[0];

    // compara senha digitada com hash do banco
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: "Senha incorreta" });
    }

    // gera token
    const token = jwt.sign({ id: usuario.id, email: usuario.email }, SECRET, {
      expiresIn: "1h",
    });

    res.json({ message: "Login realizado com sucesso!", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao fazer login" });
  }
});

module.exports = router;
