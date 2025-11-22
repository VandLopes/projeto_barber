const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const loginBarberModel = require("../models/loginBarberModel");

const loginController = {
  registrar: async (req, res) => {
    const { nome, email, senha } = req.body;

    try {
      // verifica se email já existe
      const existe = await loginBarberModel.buscarPorEmail(email);

      if (existe.length > 0) {
        return res.status(400).json({ error: "Email já cadastrado" });
      }

      // hash da senha
      const hash = await bcrypt.hash(senha, 10);

      // insere no banco
      await loginBarberModel.registrar(nome, email, hash);

      res.status(201).json({ message: "Usuário registrado com sucesso!" });
    } catch (err) {
      console.error("Erro ao registrar usuário:", err);
      res.status(500).json({ error: "Erro ao registrar usuário" });
    }
  },

  login: async (req, res) => {
    const { email, senha } = req.body;

    try {
      const rows = await loginBarberModel.buscarPorEmail(email);

      if (rows.length === 0) {
        return res.status(400).json({ error: "Usuário não encontrado" });
      }

      const usuario = rows[0];

      // compara senha
      const senhaValida = await bcrypt.compare(senha, usuario.senha);
      if (!senhaValida) {
        return res.status(401).json({ error: "Senha incorreta" });
      }

      // gera token
      const token = jwt.sign(
        { id: usuario.id, email: usuario.email },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({ message: "Login realizado com sucesso!", token });
    } catch (err) {
      console.error("Erro ao fazer login:", err);
      res.status(500).json({ error: "Erro ao fazer login" });
    }
  },
};

module.exports = loginController;
