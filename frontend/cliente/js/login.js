const apiUrl = "http://localhost:3000";

document.getElementById("formCliente").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nome = document.getElementById("nome").value;
  const email = document.getElementById("email").value;
  const telefone = document.getElementById("telefone").value;
  const msg = document.getElementById("mensagem");

  try {
    const res = await fetch(apiUrl + "/cliente/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, email, telefone }),
    });

    const data = await res.json();

    if (res.ok) {
      // Salva o ID do cliente no localStorage
      localStorage.setItem("clienteId", data.id);
      localStorage.setItem("clienteNome", data.nome);

      msg.innerHTML = `<span class="text-success">Bem-vindo, ${data.nome}!</span>`;
      setTimeout(() => (window.location.href = "agendar.html"), 1000);
    } else {
      msg.innerHTML = `<span class="text-danger">${data.error}</span>`;
    }
  } catch (err) {
    msg.innerHTML = `<span class="text-danger">Erro ao conectar com o servidor</span>`;
    console.error(err);
  }
});
