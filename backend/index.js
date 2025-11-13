require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const jwt = require("jsonwebtoken");

const app = express();
const port = 3000;

const SECRET = process.env.JWT_SECRET;

app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/authRoutes");

// rotas
const clientesRoutes = require("./routes/clientes");
const servicosRoutes = require("./routes/servicos");
const agendamentosRoutes = require("./routes/agendamentos");
const clientePublicoRoutes = require("./routes/clientePublico");
const clienteAgendamentoRoutes = require("./routes/clienteAgendamento");

// middleware de autenticação
function autenticar(req, res, next) {
  // 1. DECLARAÇÃO E INICIALIZAÇÃO NO TOPO
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Token não fornecido" });

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user;
    next();
  });
}

// Aplica rotas de autenticação (públicas)

app.use("/auth", authRoutes);

// Aplica rotas protegidas (exigem token)

app.use("/clientes", autenticar, clientesRoutes);
app.use("/servicos", servicosRoutes);
app.use("/agendamentos", autenticar, agendamentosRoutes);

// Login do cliente
app.use("/cliente", clientePublicoRoutes);
app.use("/cliente/agendamento", clienteAgendamentoRoutes);

// Servir os arquivos da pasta frontend
app.use(express.static(path.join(__dirname, "../frontend")));

//  Rota padrão -> abre login.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/login.html"));
});

app.get("/cliente", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/cliente/index.html"));
});

app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
