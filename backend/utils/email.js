const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function enviarEmail(to, assunto, html) {
  try {
    const response = await resend.emails.send({
      from: "onboarding@resend.dev",
      to,
      subject: assunto,
      html: html,
    });

    console.log("📧 Email enviado!", response);
  } catch (error) {
    console.error("Erro ao enviar email:", error);
  }
}

module.exports = enviarEmail;
