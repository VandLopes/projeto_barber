const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // SSL obrigatório no Render
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // senha de app do Google
  },
});

async function enviarEmail(to, assunto, html) {
  try {
    const info = await transporter.sendMail({
      from: `"Barbearia" <${process.env.EMAIL_USER}>`,
      to,
      subject: assunto,
      html,
    });

    console.log("📧 Email enviado:", info.messageId);
  } catch (err) {
    console.error("Erro ao enviar email:", err);
  }
}

module.exports = enviarEmail;
