const apiUrl = "http://localhost:3000";
const token = localStorage.getItem("token");

// =======================================================
// PROTEÇÃO E LOGOUT
// =======================================================
if (!token) {
  window.location.href = "login.html";
}
document.getElementById("btnLogout").addEventListener("click", () => {
  localStorage.removeItem("token");
  window.location.href = "login.html";
});

// =======================================================
// INICIALIZAÇÃO DO CALENDÁRIO (DOM CONTENT LOADED)
// =======================================================
document.addEventListener("DOMContentLoaded", function () {
  const calendarEl = document.getElementById("calendar");

  // Configura os headers de autenticação para a busca de eventos
  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  // ----------------------------------------------------
  // INICIALIZAÇÃO DO FULLCALENDAR
  // ----------------------------------------------------
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: "dayGridMonth", // Visualização padrão
    locale: "pt-br",

    // Remove funcionalidades de interação para manter a visualização
    selectable: false, // Desativa a seleção de datas
    editable: false, // Desativa arrastar e soltar eventos

    headerToolbar: {
      left: "prev,next today",
      center: "title",
      right: "dayGridMonth,timeGridWeek,timeGridDay", // Adiciona mais visualizações se necessário
    },

    // FONTE DE EVENTOS: Chamando sua rota de API
    events: async function (fetchInfo, successCallback, failureCallback) {
      try {
        const res = await fetch(`${apiUrl}/agendamentos/eventos`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Erro ao buscar eventos");
        }

        const data = await res.json();
        successCallback(data); // ✅ envia os eventos ao FullCalendar
      } catch (err) {
        console.error("Erro ao carregar agendamentos:", err);
        alert("Falha ao carregar agendamentos do calendário.");
        failureCallback(err);
      }
    },
  });

  calendar.render();
  window.fullCalendarInstance = calendar;
});
