const apiUrl = "http://localhost:3000";
const token = localStorage.getItem("token");

// Se não estiver logado, volta pro login
if (!token) {
  window.location.href = "login.html";
}

// Filtro de pesquisa
document.getElementById("pesquisa").addEventListener("keyup", function () {
  let valor = this.value.toLowerCase();
  document.querySelectorAll("#listaClientes tr").forEach(function (linha) {
    linha.style.display = linha.textContent.toLowerCase().includes(valor)
      ? ""
      : "none";
  });
});

// Exportar Excel (CSV)
document.getElementById("exportarExcel").addEventListener("click", function () {
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
  link.download = "clientes.csv";
  link.click();
});

// Submeter formulário
document.querySelector("form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nomeCliente").value;
  const email = document.getElementById("emailCliente").value;
  const telefone = document.getElementById("telefoneCliente").value;

  const metodo = clienteEmEdicao ? "PUT" : "POST";
  const url = clienteEmEdicao
    ? `${apiUrl}/clientes/${clienteEmEdicao}`
    : `${apiUrl}/clientes`;

  const response = await fetch(url, {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`, // 🔑 JWT
    },
    body: JSON.stringify({ nome, email, telefone }),
  });

  const data = await response.json();
  alert(data.message);
  clienteEmEdicao = null;

  carregarClientes();

  // fecha o modal
  bootstrap.Modal.getInstance(document.getElementById("modalCliente")).hide();

  // limpa os campos
  document.getElementById("nomeCliente").value = "";
  document.getElementById("emailCliente").value = "";
  document.getElementById("telefoneCliente").value = "";
});

// Carregar clientes
async function carregarClientes() {
  const res = await fetch(`${apiUrl}/clientes`, {
    headers: { Authorization: `Bearer ${token}` }, // 🔑 JWT
  });

  if (res.status === 401 || res.status === 403) {
    alert("Sessão expirada. Faça login novamente.");
    localStorage.removeItem("token");
    window.location.href = "login.html";
    return;
  }

  const clientes = await res.json();

  const tbody = document.getElementById("listaClientes");
  tbody.innerHTML = "";

  clientes.forEach((cliente) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td>${cliente.nome}</td>
        <td>${cliente.email}</td>
        <td>${cliente.telefone}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="editarCliente(${cliente.id})">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="excluirClienteHandler(${cliente.id})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      `;
    tbody.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", carregarClientes);

let clienteEmEdicao = null;

// Editar cliente
function editarCliente(id) {
  fetch(`${apiUrl}/clientes`, {
    headers: { Authorization: `Bearer ${token}` }, // 🔑 JWT
  })
    .then((res) => res.json())
    .then((clientes) => {
      const cliente = clientes.find((c) => c.id === id);
      if (!cliente) return alert("Cliente não encontrado.");

      document.getElementById("nomeCliente").value = cliente.nome;
      document.getElementById("emailCliente").value = cliente.email;
      document.getElementById("telefoneCliente").value = cliente.telefone;

      clienteEmEdicao = cliente.id;

      const modal = new bootstrap.Modal(
        document.getElementById("modalCliente")
      );
      modal.show();
    });
}

// Excluir cliente
async function excluirCliente(id) {
  // 1. Faz a requisição DELETE
  const res = await fetch(`${apiUrl}/clientes/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` }, // 🔑 JWT
  });

  const data = await res.json();
  alert(data.message);
  carregarClientes();
}

let idParaExcluir = null;

function excluirClienteHandler(id) {
  idParaExcluir = id;

  const modal = new bootstrap.Modal(
    document.getElementById("modalConfirmacaoExclusao")
  );
  modal.show();
}

document.addEventListener("DOMContentLoaded", () => {
  const btnConfirmar = document.getElementById("btnConfirmarExclusao");
  if (btnConfirmar) {
    btnConfirmar.addEventListener("click", async () => {
      if (idParaExcluir !== null) {
        try {
          await excluirCliente(idParaExcluir);
        } catch (error) {
          console.error("Erro ao confirmar exclusão:", error);
          alert("Ocorreu um erro na exclusão. Tente novamente.");
        } finally {
          idParaExcluir = null;
          // Esconde o modal após a exclusão (ou falha)
          bootstrap.Modal.getInstance(
            document.getElementById("modalConfirmacaoExclusao")
          ).hide();
        }
      }
    });
  }
});
