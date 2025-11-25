const apiUrl = "https://projeto-mrsbarber.onrender.com";
let clienteId = localStorage.getItem("clienteId"); // salvo no login
const token = localStorage.getItem("tokenCliente");

if (!clienteId) {
  alert("Por favor, faça login primeiro.");
  window.location.href = "meus-agendamentos.html";
}

async function carregarServicos() {
  const res = await fetch(`${apiUrl}/servicos/publico`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const servicos = await res.json();

  const select = document.getElementById("servicos");
  select.innerHTML = "";

  servicos.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = `${s.nome} - R$ ${s.preco}`;
    opt.dataset.preco = s.preco;
    opt.dataset.duracao = s.duracao;
    select.appendChild(opt);
  });
}

document.getElementById("servicos").addEventListener("change", () => {
  const select = document.getElementById("servicos");
  const opcoesSelecionadas = Array.from(select.selectedOptions);

  const totalValor = opcoesSelecionadas.reduce(
    (soma, opt) => soma + parseFloat(opt.dataset.preco),
    0
  );

  const totalDuracao = opcoesSelecionadas.reduce(
    (soma, opt) => soma + parseInt(opt.dataset.duracao),
    0
  );

  document.getElementById("valorTotal").value = totalValor.toFixed(2);
  document.getElementById("duracaoTotal").value = totalDuracao;
});

document.getElementById("data").addEventListener("change", async () => {
  const data = document.getElementById("data").value;
  if (!data) return;

  const duracao = parseInt(document.getElementById("duracaoTotal").value) || 0;

  if (duracao <= 0) {
    alert("Selecione um ou mais serviços antes de escolher a data.");
    return;
  }

  const res = await fetch(
    `${apiUrl}/cliente/agendamento/horarios/livres/${data}`
  );

  if (!res.ok) {
    alert("Erro ao carregar horários disponíveis.");
    return;
  }

  const horarios = await res.json();

  const lista = document.getElementById("listaHorarios");
  lista.innerHTML = "";

  if (horarios.length === 0) {
    lista.innerHTML =
      '<p class="text-muted">Nenhum horário disponível para esta data.</p>';
    return;
  }

  horarios.forEach((h) => {
    const btn = document.createElement("button");
    btn.textContent = h;
    btn.className = "btn btn-outline-primary";
    btn.addEventListener("click", () => selecionarHorario(h));
    lista.appendChild(btn);
  });
});

let horarioSelecionado = null;

function selecionarHorario(horario) {
  horarioSelecionado = horario;
  const botoes = document.querySelectorAll("#listaHorarios button");
  botoes.forEach((btn) => btn.classList.remove("active"));
  const btnAtivo = Array.from(botoes).find((b) => b.textContent === horario);
  if (btnAtivo) btnAtivo.classList.add("active");
}

document.getElementById("btnConfirmar").addEventListener("click", async () => {
  const data = document.getElementById("data").value;
  const servicosSelecionados = Array.from(
    document.getElementById("servicos").selectedOptions
  ).map((opt) => opt.value);
  const valor = document.getElementById("valorTotal").value;
  const duracao = document.getElementById("duracaoTotal").value;

  if (!data || !horarioSelecionado || servicosSelecionados.length === 0) {
    alert("Preencha todos os campos antes de confirmar!");
    return;
  }

  const body = {
    clienteId,
    data,
    horario: horarioSelecionado,
    servicos: servicosSelecionados,
    valor,
    duracao,
  };

  try {
    const res = await fetch(`${apiUrl}/cliente/agendamento`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await res.json();

    if (res.ok) {
      alert(result.message || "Agendamento realizado com sucesso!");
      window.location.href = "index.html";
    } else {
      alert(result.error || "Erro ao criar agendamento.");
    }
  } catch (err) {
    console.error("Erro ao enviar agendamento:", err);
    alert("Erro de comunicação com o servidor.");
  }
});

carregarServicos();

document.getElementById("btnMeusAgendamentos").addEventListener("click", () => {
  window.location.href = "meus-agendamentos.html";
});

document.getElementById("btnLogout").addEventListener("click", () => {
  localStorage.removeItem("clienteId");
  localStorage.removeItem("tokenCliente");
  window.location.href = "index.html";
});
