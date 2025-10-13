const apiUrl = "http://localhost:3000";
const token = localStorage.getItem("token");
let agendamentoEmEdicao = null;
let idParaExcluir = null;

// === Guarda de Autenticação ===
if (!token) {
  window.location.href = "login.html";
}

// === Carregamento de Clientes e Serviços (para o Modal) ===
async function carregarClientesEServicos() {
  try {
    // Clientes
    const resClientes = await fetch(apiUrl + "/clientes", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (resClientes.status === 401 || resClientes.status === 403) {
      throw new Error("Autenticação falhou ao carregar clientes.");
    }

    const clientes = await resClientes.json();
    const clienteSelect = document.getElementById("cliente");
    clienteSelect.innerHTML =
      '<option value="" disabled selected>Selecione um cliente</option>' +
      clientes
        .map((c) => `<option value="${c.id}">${c.nome}</option>`)
        .join(""); // Serviços

    const resServicos = await fetch(apiUrl + "/servicos", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (resServicos.status === 401 || resServicos.status === 403) {
      throw new Error("Autenticação falhou ao carregar serviços.");
    }

    const servicos = await resServicos.json();
    const servicoSelect = document.getElementById("servicos");
    servicoSelect.innerHTML = servicos
      .map(
        // Usa s.duracao e formata o preco
        (s) => `<option value="${s.id}" data-preco="${parseFloat(
          s.preco
        )}" data-duracao="${
          s.duracao // Usa a coluna correta 'duracao'
        }">
            ${s.nome} - R$ ${parseFloat(s.preco).toFixed(2)} (${s.duracao} min)
          </option>`
      )
      .join(""); // Dispara o cálculo inicial

    document.getElementById("servicos").dispatchEvent(new Event("change"));
  } catch (error) {
    console.error("Erro ao carregar dados iniciais:", error);
    if (error.message.includes("Autenticação falhou")) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
    }
  }
}

// === Cálculo de Valor e Duração Total ===
function calcularTotais() {
  const servicoSelect = document.getElementById("servicos");
  const dataInput = document.getElementById("data");
  const selected = Array.from(servicoSelect.selectedOptions); // Soma os totais
  const totalValor = selected.reduce(
    (acc, opt) => acc + parseFloat(opt.dataset.preco),
    0
  );
  const totalDuracao = selected.reduce(
    (acc, opt) => acc + parseInt(opt.dataset.duracao),
    0
  ); // Atualiza os campos de resumo

  document.getElementById("valor").value = "R$ " + totalValor.toFixed(2);
  document.getElementById("duracao").value = totalDuracao + " min"; // Carrega horários disponíveis se a data e a duração forem válidas

  const data = dataInput.value;
  if (data && totalDuracao > 0) {
    carregarHorariosDisponiveis(data, totalDuracao);
  } else {
    const horarioSelect = document.getElementById("horario");
    horarioSelect.innerHTML =
      '<option value="" disabled selected>Selecione serviço e data</option>';
  }
}

// Event Listeners para atualizar totais e horários
document.getElementById("servicos").addEventListener("change", calcularTotais);
document.getElementById("data").addEventListener("change", calcularTotais);

// === Carregar Horários Livres (Chama a Rota do Backend) ===
async function carregarHorariosDisponiveis(data, duracao) {
  try {
    const res = await fetch(
      `${apiUrl}/agendamentos/horarios-livres?data=${data}&duracao=${duracao}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (res.status === 401 || res.status === 403) {
      throw new Error("Autenticação falhou.");
    }

    const horarios = await res.json();
    const horarioSelect = document.getElementById("horario");
    if (horarios.length === 0) {
      horarioSelect.innerHTML =
        '<option value="" disabled selected>Nenhum horário disponível</option>';
    } else {
      horarioSelect.innerHTML =
        '<option value="" disabled selected>Selecione um horário</option>' +
        horarios.map((h) => `<option value="${h}">${h}</option>`).join("");
    }
  } catch (error) {
    console.error("Erro ao carregar horários:", error);
    document.getElementById("horario").innerHTML =
      '<option value="" disabled selected>Erro ao carregar</option>';
  }
}

// === SUBMISSÃO DO FORMULÁRIO (POST/PUT) ===
document
  .getElementById("formAgendamento")
  .addEventListener("submit", async (e) => {
    e.preventDefault(); // Coleta dados

    const cliente_id = document.getElementById("cliente").value; // 📌 CRUCIAL: Mapeia os IDs dos serviços selecionados em um array de strings
    const servicos = Array.from(
      document.getElementById("servicos").selectedOptions
    ).map((s) => s.value);

    const data = document.getElementById("data").value;
    const horario = document.getElementById("horario").value;
    const realizado = document.getElementById("realizado").value;

    const metodo = agendamentoEmEdicao ? "PUT" : "POST";
    const url = agendamentoEmEdicao
      ? `${apiUrl}/agendamentos/${agendamentoEmEdicao}`
      : `${apiUrl}/agendamentos`;

    try {
      const response = await fetch(url, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data,
          horario,
          cliente_id,
          servicos, // Array de IDs
          realizado,
        }),
      });

      const result = await response.json();
      if (response.ok) {
        alert(result.message || "Agendamento salvo com sucesso.");
        agendamentoEmEdicao = null;
        carregarAgendamentos(); // Recarrega a lista
      } else {
        alert(result.error || "Erro ao salvar agendamento.");
      }
    } catch (error) {
      console.error("Erro na comunicação com a API:", error);
      alert("Erro de comunicação. Verifique o servidor.");
    } finally {
      // Fecha o modal
      bootstrap.Modal.getInstance(
        document.getElementById("modalAgendamento")
      ).hide();
    }
  });

// === Funções de CRUD (Listar/Editar/Excluir) ===

// RENDERIZA A TABELA PRINCIPAL

async function carregarAgendamentos() {
  try {
    const res = await fetch(`${apiUrl}/agendamentos`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "login.html";
      return;
    }

    const agendamentos = await res.json();

    // Filtros de pesquisa e status
    const pesquisaTermo = document
      .getElementById("pesquisa")
      .value.toLowerCase();
    const filtroStatus = document.getElementById("filtroStatus").value;

    const agendamentosFiltrados = agendamentos.filter((ag) => {
      const matchesSearch =
        !pesquisaTermo ||
        ag.cliente_nome.toLowerCase().includes(pesquisaTermo) ||
        ag.servicos_nomes.toLowerCase().includes(pesquisaTermo);
      const matchesStatus = !filtroStatus || ag.realizado === filtroStatus;
      return matchesSearch && matchesStatus;
    });

    const tbody = document.getElementById("listaAgendamentos");
    tbody.innerHTML = "";

    agendamentosFiltrados.forEach((ag) => {
      // Garantir que valorTotal e duracaoTotal sejam números
      const duracaoTotal = parseFloat(ag.duracao) || 0;
      const valorTotal = parseFloat(ag.valor) || 0;

      // --- Tratamento da data/hora ---
      let dataFormatada = "Data Inválida";
      let horarioFormatado = "";

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

      // --- Monta a linha da tabela com colunas alinhadas ---
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${ag.id}</td>
        <td>${dataFormatada} ${horarioFormatado}</td>
        <td>${ag.cliente_nome}</td>
        <td>${ag.servicos_nomes}</td>
        <td>${duracaoTotal} min</td>
        <td>R$ ${valorTotal.toFixed(2)}</td>
        <td>${ag.realizado}</td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="editarAgendamento(${
            ag.id
          })">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-danger btn-sm" onclick="excluirAgendamentoHandler(${
            ag.id
          })">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Caso não tenha resultados
    if (agendamentosFiltrados.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="text-center text-muted">Nenhum agendamento encontrado.</td>
        </tr>
      `;
    }
  } catch (error) {
    console.error("Erro ao carregar agendamentos:", error);
    document.getElementById("listaAgendamentos").innerHTML = `
      <tr>
        <td colspan="8" class="text-center text-danger">
          Erro ao carregar agendamentos. Verifique o console.
        </td>
      </tr>`;
  }
}

// BUSCA UM AGENDAMENTO E ABRE O MODAL
async function editarAgendamento(id) {
  try {
    const res = await fetch(`${apiUrl}/agendamentos`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const agendamentos = await res.json();

    const ag = agendamentos.find((a) => a.id === id);
    if (!ag) return alert("Agendamento não encontrado."); // Chama a função para garantir que os dropdowns estejam populados

    await carregarClientesEServicos(); // Preenche os campos

    document.getElementById("data").value = ag.data.substring(0, 10);
    document.getElementById("cliente").value = ag.cliente_id;
    document.getElementById("realizado").value = ag.realizado; // Marca o ID para edição

    agendamentoEmEdicao = ag.id; // **NOTA:** Preencher a seleção múltipla de serviços é complexo // e depende de saber todos os IDs de serviço agendados. // Assumindo que 'ag.servicos_ids' é retornado pelo backend (se necessário) // Abre o modal

    const modal = new bootstrap.Modal(
      document.getElementById("modalAgendamento")
    );
    modal.show(); // NOTA: Para preencher os horários corretamente no modo edição, // você precisaria disparar o cálculo de totais após setar os serviços.

    document.getElementById("servicos").dispatchEvent(new Event("change"));
  } catch (error) {
    console.error("Erro ao editar agendamento:", error);
    alert("Erro ao carregar dados para edição.");
  }
}

// HANDLER para o modal de exclusão
function excluirAgendamentoHandler(id) {
  idParaExcluir = id;
  const modal = new bootstrap.Modal(
    document.getElementById("modalConfirmacaoExclusao")
  );
  modal.show();
}

// EXECUTA A EXCLUSÃO
async function excluirAgendamento(id) {
  const res = await fetch(`${apiUrl}/agendamentos/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await res.json();
  if (res.ok) {
    alert(data.message || "Agendamento excluído com sucesso!");
  } else {
    throw new Error(data.error || "Falha ao excluir agendamento.");
  }
}

// Listener do botão de confirmação de exclusão
document
  .getElementById("btnConfirmarExclusao")
  .addEventListener("click", async () => {
    if (idParaExcluir !== null) {
      try {
        await excluirAgendamento(idParaExcluir);
      } catch (error) {
        console.error("Erro ao confirmar exclusão:", error);
        alert("Ocorreu um erro na exclusão. Tente novamente.");
      } finally {
        idParaExcluir = null;
        carregarAgendamentos(); // Atualiza a lista
        bootstrap.Modal.getInstance(
          document.getElementById("modalConfirmacaoExclusao")
        ).hide();
      }
    }
  });

// Listener que carrega clientes/serviços quando o modal é aberto
document
  .getElementById("modalAgendamento")
  .addEventListener("show.bs.modal", carregarClientesEServicos);

// Filtro de pesquisa (Tabela)
document
  .getElementById("pesquisa")
  .addEventListener("keyup", carregarAgendamentos);

// Filtro de status (Tabela)
document
  .getElementById("filtroStatus")
  .addEventListener("change", carregarAgendamentos);

document.addEventListener("DOMContentLoaded", carregarAgendamentos);
