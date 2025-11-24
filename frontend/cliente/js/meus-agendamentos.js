const apiUrl = "https://projeto-mrsbarber.onrender.com";
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

    // --- AGORA SIM: formatação dentro do loop ---
    agendamentos.forEach((ag) => {
      // Tratamento data/hora
      let dataFormatada = "Data Inválida";
      let horarioFormatado = "Horário Inválido";

      if (ag.data && ag.horario) {
        const dataHoraString = `${ag.data}T${ag.horario}`;
        const dataHora = new Date(dataHoraString);

        if (!isNaN(dataHora.getTime())) {
          dataFormatada = dataHora.toLocaleDateString("pt-BR");
          horarioFormatado = dataHora.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          });
        }
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
          <td>${dataFormatada}</td>
          <td>${horarioFormatado}</td>
          <td>${ag.servicos}</td>
          <td>R$ ${(parseFloat(ag.valor_total) || 0).toFixed(2)}</td>
          <td>${ag.realizado}</td>
        `;
      lista.appendChild(tr);
    });
  } catch (err) {
    console.error("Erro ao carregar agendamentos:", err);
    alert("Erro ao carregar agendamentos. Tente novamente.");
  }
}

document.addEventListener("DOMContentLoaded", carregarAgendamentos);
