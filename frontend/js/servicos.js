// frontend/js/servicos.js

const apiUrl = "http://localhost:3000";
const token = localStorage.getItem("token");

// === 🔑 AUTENTICAÇÃO ===
// Redireciona para login se não houver token
if (!token) {
  window.location.href = "login.html";
}

// Variáveis de controle
let servicoEmEdicao = null;
let idParaExcluir = null;

// === 🚀 FUNÇÕES DE CRUD E UI ===

// Filtro de pesquisa (Sem alterações)
document.getElementById("pesquisa").addEventListener("keyup", function () {
  let valor = this.value.toLowerCase();
  document.querySelectorAll("#listaServicos tr").forEach(function (linha) {
    linha.style.display = linha.textContent.toLowerCase().includes(valor)
      ? ""
      : "none";
  });
});

// Exportar Excel (Sem alterações)
document
  .querySelector(".btn-outline-secondary")
  .addEventListener("click", function () {
    let tabela = document.querySelector("table");
    let linhas = tabela.querySelectorAll("tr");
    let csv = [];

    linhas.forEach((row) => {
      let cols = row.querySelectorAll("th, td");
      let dados = [];
      cols.forEach((col) => dados.push(col.innerText));
      csv.push(dados.join(";"));
    });

    let blob = new Blob([csv.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    let link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "servicos.csv";
    link.click();
  });

// Enviar formulário (Novo ou Edição)
document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nomeServico").value;
  const preco = document.getElementById("precoServico").value.replace(",", ".");

  // 📌 CORREÇÃO 1: Nome da variável de duração ajustado para duracao_minutos
  const duracao_minutos = parseInt(
    document.getElementById("duracaoServico").value
  );

  const metodo = servicoEmEdicao ? "PUT" : "POST";
  const url = servicoEmEdicao
    ? `${apiUrl}/servicos/${servicoEmEdicao}`
    : `${apiUrl}/servicos`;

  const response = await fetch(url, {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // 🔑 JWT adicionado
    },
    // 📌 CORREÇÃO 2: Variável enviada no body ajustada para duracao_minutos
    body: JSON.stringify({ nome, preco, duracao_minutos }),
  });

  const data = await response.json();

  // 📌 CORREÇÃO 3: Tratamento de resposta robusto (remove alert undefined)
  if (response.ok) {
    alert(
      data.message ||
        (metodo === "POST"
          ? "Serviço cadastrado com sucesso!"
          : "Serviço atualizado com sucesso!")
    );
  } else {
    alert(data.error || "Ocorreu um erro desconhecido ao salvar o serviço.");
  }

  servicoEmEdicao = null;

  carregarServicos();

  bootstrap.Modal.getInstance(document.getElementById("modalServico")).hide();

  document.getElementById("nomeServico").value = "";
  document.getElementById("precoServico").value = "";
  document.getElementById("duracaoServico").value = "";
});

// Carregar serviços
async function carregarServicos() {
  // 📌 CORREÇÃO 4: Adicionado JWT à requisição GET para evitar 401/403
  const res = await fetch(`${apiUrl}/servicos`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Trata falha na autenticação (token inválido/expirado)
  if (res.status === 401 || res.status === 403) {
    alert("Sessão expirada. Faça login novamente.");
    localStorage.removeItem("token");
    window.location.href = "login.html";
    return;
  }

  const servicos = await res.json();

  const tbody = document.getElementById("listaServicos");
  tbody.innerHTML = "";

  servicos.forEach((servico) => {
    // Exibe o campo correto que vem do backend
    const duracaoExibida = servico.duracao_minutos || servico.duracao;

    const tr = document.createElement("tr");
    tr.innerHTML = `
            <td>${servico.nome}</td>
            <td>R$ ${parseFloat(servico.preco).toFixed(2)}</td>
            <td>${duracaoExibida} min</td> 
            <td>
                <button class="btn btn-warning btn-sm" onclick="editarServico(${
                  servico.id
                })">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-danger btn-sm" onclick="excluirServicoHandler(${
                  servico.id
                })"> 
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
    tbody.appendChild(tr);
  });
}

// Handler para abrir o modal de edição
function editarServico(id) {
  // 📌 CORREÇÃO 5: Adicionado JWT à requisição GET para evitar 401/403
  fetch(`${apiUrl}/servicos`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((res) => res.json())
    .then((servicos) => {
      const servico = servicos.find((s) => s.id === id);
      if (!servico) return alert("Serviço não encontrado.");

      document.getElementById("nomeServico").value = servico.nome;
      document.getElementById("precoServico").value = servico.preco;
      // Usa o campo correto para pré-preencher
      document.getElementById("duracaoServico").value =
        servico.duracao_minutos || servico.duracao;

      servicoEmEdicao = servico.id;

      const modal = new bootstrap.Modal(
        document.getElementById("modalServico")
      );
      modal.show();
    });
}

// Função que executa a exclusão (assíncrona)
async function excluirServico(id) {
  const res = await fetch(`${apiUrl}/servicos/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  alert(data.message || "Serviço excluído com sucesso!");
  carregarServicos();
}

// HANDLER para exibir o modal de confirmação (substitui o confirm)
function excluirServicoHandler(id) {
  idParaExcluir = id;
  const modal = new bootstrap.Modal(
    document.getElementById("modalConfirmacaoExclusao")
  );
  modal.show();
}

// Listener para o botão 'Confirmar' dentro do seu modal customizado
document.addEventListener("DOMContentLoaded", () => {
  carregarServicos(); // Carrega os dados ao iniciar a página

  const btnConfirmar = document.getElementById("btnConfirmarExclusao");
  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", async () => {
      if (idParaExcluir !== null) {
        try {
          await excluirServico(idParaExcluir);
        } catch (error) {
          console.error("Erro ao confirmar exclusão:", error);
          alert("Ocorreu um erro na exclusão. Tente novamente.");
        } finally {
          idParaExcluir = null;
          bootstrap.Modal.getInstance(
            document.getElementById("modalConfirmacaoExclusao")
          ).hide();
        }
      }
    });
  }
});
