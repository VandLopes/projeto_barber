document.addEventListener("DOMContentLoaded", () => {
  const apiUrl = "https://projeto-mrsbarber.onrender.com";
  const token = localStorage.getItem("token");

  const formRelatorio = document.getElementById("formRelatorio");
  const areaResultados = document.getElementById("areaResultados");
  const tbody = document.getElementById("listaAgendamentosRelatorio");
  const resumoEl = document.getElementById("resumoRelatorio");
  const paginacaoEl = document.getElementById("paginacao");
  const btnExportar = document.getElementById("exportarExcelRelatorio");

  let dadosFiltrados = [];
  let paginaAtual = 1;
  const itensPorPagina = 5;

  formRelatorio.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dataInicio = document.getElementById("dataInicio").value;
    const dataFim = document.getElementById("dataFim").value;
    const status = document.getElementById("filtroStatus").value;

    try {
      const res = await fetch(`${apiUrl}/agendamentos/relatorio`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Falha ao buscar agendamentos.");

      const todosAgendamentos = await res.json();

      // Filtra entre as datas escolhidas
      dadosFiltrados = todosAgendamentos.filter((ag) => {
        const dentroDoPeriodo = ag.data >= dataInicio && ag.data <= dataFim;

        if (!status) {
          // status vazio = todos os status
          return dentroDoPeriodo;
        } else {
          return dentroDoPeriodo && ag.realizado === status;
        }
      });

      if (dadosFiltrados.length > 0) {
        paginaAtual = 1;
        renderizarPagina();
        areaResultados.classList.remove("d-none");
      } else {
        areaResultados.classList.remove("d-none");
        tbody.innerHTML = `<tr><td colspan="8" class="text-center">Nenhum agendamento encontrado para o período.</td></tr>`;
        resumoEl.innerHTML = "";
        paginacaoEl.innerHTML = "";
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao carregar agendamentos do relatório.");
    }
  });

  function renderizarPagina() {
    tbody.innerHTML = "";
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const itensDaPagina = dadosFiltrados.slice(inicio, fim);

    itensDaPagina.forEach((ag) => {
      const statusBadge =
        ag.realizado === "Sim"
          ? `<span class="badge bg-success">Sim</span>`
          : `<span class="badge bg-secondary">Não</span>`;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${ag.numero}</td>
        <td>${new Date(ag.data + "T00:00:00").toLocaleDateString("pt-BR")}</td>
        <td>R$ ${parseFloat(ag.valor).toFixed(2).replace(".", ",")}</td>
        <td>${ag.servico}</td>
        <td>${ag.duracao}</td>
        <td>${ag.cliente}</td>
        <td>${statusBadge}</td>
      `;
      tbody.appendChild(tr);
    });

    renderizarControlesPaginacao();
    renderizarResumo();
  }

  function renderizarControlesPaginacao() {
    paginacaoEl.innerHTML = "";
    const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPagina);
    if (totalPaginas <= 1) return;

    for (let i = 1; i <= totalPaginas; i++) {
      const li = document.createElement("li");
      li.className = `page-item ${i === paginaAtual ? "active" : ""}`;
      li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
      li.addEventListener("click", (e) => {
        e.preventDefault();
        paginaAtual = i;
        renderizarPagina();
      });
      paginacaoEl.appendChild(li);
    }
  }

  function renderizarResumo() {
    const totalAgendamentos = dadosFiltrados.length;
    const valorTotal = dadosFiltrados.reduce(
      (acc, ag) => acc + parseFloat(ag.valor),
      0
    );

    resumoEl.innerHTML = `Exibindo ${totalAgendamentos} agendamentos. Valor total: <strong>R$ ${valorTotal
      .toFixed(2)
      .replace(".", ",")}</strong>`;
  }

  btnExportar.addEventListener("click", function () {
    if (dadosFiltrados.length === 0) {
      alert("Gere um relatório primeiro para poder exportar.");
      return;
    }

    let csv = "Número;Data;Valor;Serviço;Duração;Cliente;Realizado\n";
    dadosFiltrados.forEach((ag) => {
      csv += `${ag.numero};${ag.data};R$ ${ag.valor};${ag.servico};${ag.duracao};${ag.cliente};${ag.realizado}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "relatorio_agendamentos.csv";
    link.click();
  });
});
