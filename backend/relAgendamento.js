document.addEventListener("DOMContentLoaded", () => {
  // =================================================================================
  // DADOS DE EXEMPLO (MOCK) - Substituindo o localStorage
  // Quando for conectar ao banco, você substituirá este bloco por uma chamada de API.
  const mockAgendamentos = [
    {
      numero: 1,
      data: "2025-09-01",
      valor: "R$ 50,00",
      servico: "Corte de Cabelo",
      duracao: "45 min",
      cliente: "João Silva",
      realizado: "Sim",
    },
    {
      numero: 2,
      data: "2025-09-02",
      valor: "R$ 30,00",
      servico: "Barba",
      duracao: "30 min",
      cliente: "Carlos Pereira",
      realizado: "Sim",
    },
    {
      numero: 3,
      data: "2025-09-03",
      valor: "R$ 80,00",
      servico: "Corte + Barba",
      duracao: "75 min",
      cliente: "Pedro Martins",
      realizado: "Não",
    },
    {
      numero: 4,
      data: "2025-09-04",
      valor: "R$ 50,00",
      servico: "Corte de Cabelo",
      duracao: "45 min",
      cliente: "Lucas Andrade",
      realizado: "Sim",
    },
    {
      numero: 5,
      data: "2025-09-05",
      valor: "R$ 50,00",
      servico: "Corte de Cabelo",
      duracao: "45 min",
      cliente: "Marcos Souza",
      realizado: "Sim",
    },
    {
      numero: 6,
      data: "2025-09-08",
      valor: "R$ 35,00",
      servico: "Barba Desenhada",
      duracao: "40 min",
      cliente: "Thiago Costa",
      realizado: "Sim",
    },
    {
      numero: 7,
      data: "2025-09-09",
      valor: "R$ 50,00",
      servico: "Corte de Cabelo",
      duracao: "45 min",
      cliente: "Fernando Lima",
      realizado: "Não",
    },
    {
      numero: 8,
      data: "2025-09-10",
      valor: "R$ 85,00",
      servico: "Corte + Barba + Sobrancelha",
      duracao: "90 min",
      cliente: "Ricardo Alves",
      realizado: "Sim",
    },
    {
      numero: 9,
      data: "2025-09-11",
      valor: "R$ 50,00",
      servico: "Corte de Cabelo",
      duracao: "45 min",
      cliente: "Jorge Mendes",
      realizado: "Sim",
    },
    {
      numero: 10,
      data: "2025-09-12",
      valor: "R$ 30,00",
      servico: "Barba",
      duracao: "30 min",
      cliente: "Daniel Rocha",
      realizado: "Sim",
    },
    {
      numero: 11,
      data: "2025-09-15",
      valor: "R$ 50,00",
      servico: "Corte de Cabelo",
      duracao: "45 min",
      cliente: "Bruno Santos",
      realizado: "Sim",
    },
    {
      numero: 12,
      data: "2025-09-16",
      valor: "R$ 80,00",
      servico: "Corte + Barba",
      duracao: "75 min",
      cliente: "Eduardo Oliveira",
      realizado: "Não",
    },
  ];
  // =================================================================================

  const formRelatorio = document.getElementById("formRelatorio");
  const areaResultados = document.getElementById("areaResultados");
  const tbody = document.getElementById("listaAgendamentosRelatorio");
  const resumoEl = document.getElementById("resumoRelatorio");
  const paginacaoEl = document.getElementById("paginacao");
  const btnExportar = document.getElementById("exportarExcelRelatorio");

  let dadosFiltrados = [];
  let paginaAtual = 1;
  const itensPorPagina = 5; // Você pode ajustar este número

  formRelatorio.addEventListener("submit", (e) => {
    e.preventDefault();
    const dataInicio = document.getElementById("dataInicio").value;
    const dataFim = document.getElementById("dataFim").value;

    // A única mudança é aqui: usamos "mockAgendamentos" em vez de "agendamentos"
    dadosFiltrados = mockAgendamentos.filter((ag) => {
      return ag.data >= dataInicio && ag.data <= dataFim;
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

      const valorNumerico = parseFloat(
        ag.valor.replace("R$ ", "").replace(",", ".")
      );

      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>${ag.numero}</td>
                <td>${new Date(ag.data + "T00:00:00").toLocaleDateString(
                  "pt-BR"
                )}</td>
                <td>R$ ${valorNumerico.toFixed(2).replace(".", ",")}</td>
                <td>${ag.servico}</td>
                <td>${ag.duracao}</td>
                <td>${ag.cliente}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn btn-warning btn-sm" title="Editar"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-danger btn-sm" title="Excluir"><i class="bi bi-trash"></i></button>
                </td>
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
    const valorTotal = dadosFiltrados.reduce((acc, ag) => {
      const valor = parseFloat(ag.valor.replace("R$ ", "").replace(",", "."));
      return acc + valor;
    }, 0);

    resumoEl.innerHTML = `Exibindo ${
      dadosFiltrados.length
    } agendamentos. Valor total: <strong>R$ ${valorTotal
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
      csv += `${ag.numero};${ag.data};${ag.valor};${ag.servico};${ag.duracao};${ag.cliente};${ag.realizado}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "relatorio_agendamentos.csv";
    link.click();
  });
});
