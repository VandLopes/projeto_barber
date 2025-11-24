const apiUrl = "https://projeto-mrsbarber.onrender.com";

// Login
document.getElementById("btnEntrar").addEventListener("click", async () => {
  const email = document.getElementById("emailLogin").value;
  const senha = document.getElementById("senhaLogin").value;

  const res = await fetch(apiUrl + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });

  const data = await res.json();
  if (res.ok) {
    localStorage.setItem("token", data.token);
    document.getElementById("mensagem").innerHTML =
      '<span class="text-success">Login realizado!</span>';
    setTimeout(() => (window.location.href = "home.html"), 1000);
  } else {
    document.getElementById("mensagem").innerHTML =
      '<span class="text-danger">' + data.error + "</span>";
  }
});

// Registro
document.getElementById("btnRegistrar").addEventListener("click", async () => {
  const nome = document.getElementById("nomeCadastro").value;
  const email = document.getElementById("emailCadastro").value;
  const senha = document.getElementById("senhaCadastro").value;

  const res = await fetch(apiUrl + "/auth/registrar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nome, email, senha }),
  });

  const data = await res.json();
  if (res.ok) {
    alert("Usuário cadastrado! Faça login.");
    bootstrap.Modal.getInstance(
      document.getElementById("modalRegistrar")
    ).hide();
  } else {
    alert(data.error);
  }
});
