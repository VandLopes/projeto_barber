const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function enviarEmail(to, assunto, html) {
  try {
    await transporter.sendMail({
      from: `"Barbearia" <${process.env.EMAIL_USER}>`,
      to,
      subject: assunto,
      html,
    });
    console.log("📧 Email enviado para", to);
  } catch (err) {
    console.error("Erro ao enviar email:", err);
  }
}

module.exports = enviarEmail;
