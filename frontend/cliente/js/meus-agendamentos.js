const apiUrl = "http://localhost:3000";
const clienteId = localStorage.getItem("clienteId");

if (!clienteId) {
  alert("Por favor, faça login primeiro.");
  window.location.href = "index.html";
}

async function carregarAgendamentos() {
  try {
    const res = await fetch(`${apiUrl}/cliente/agendamento/${clienteId}`);
    if (!res.ok) throw new Error("Erro ao carregar agendamentos");

    const agendamentos = await res.json();

    const lista = document.getElementById("listaAgendamentos");
    lista.innerHTML = "";

    if (agendamentos.length === 0) {
      lista.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted">Nenhum agendamento encontrado.</td>
        </tr>`;
      return;
    }

    agendamentos.forEach((ag) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td>${new Date(ag.data).toLocaleDateString("pt-BR")}</td>
          <td>${ag.horario}</td>
          <td>${ag.servicos}</td>
          <td>R$ ${(parseFloat(ag.valor_total) || 0).toFixed(2)}</td>
          <td>${ag.realizado ? "Sim" : "Não"}</td>
        `;
      lista.appendChild(tr);
    });
  } catch (err) {
    console.error("Erro ao carregar agendamentos:", err);
    alert("Erro ao carregar agendamentos. Tente novamente.");
  }
}

document.addEventListener("DOMContentLoaded", carregarAgendamentos);
