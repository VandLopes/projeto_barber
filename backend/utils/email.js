const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function enviarEmail(to, assunto, html) {
  try {
    const data = await resend.emails.send({
      from: "Barbearia <vanderleilopes23.vl@gmail.com>",
      to,
      subject: assunto,
      html,
    });

    console.log("📧 Email enviado!", data);
    return data;
  } catch (err) {
    console.error("❌ Erro ao enviar email:", err);
    throw err;
  }
}

module.exports = enviarEmail;
