const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: "edukecx2@gmail.com",
      pass: "ovymmnxoprslxmfv",
    },
    tls: {
      rejectUnauthorized: false,
    },
});
async function EnviarEmailInicial(email, usuario, cod, tipo) {
    const text = ['Seja bem-vindo à plataforma EdukeCX2! Estamos muito felizes em tê-lo(a) conosco. Como uma plataforma de estudos inovadora, nossa missão é ajudá-lo(a) a alcançar seus objetivos educacionais de forma eficiente e personalizada. Caso tenha duvidas, não hesite em perguntar para a nossa equipe','Ficamos sabendo que você perdeu/esqueceu a senha de nossa plataforma =( Não fique triste, eu mesmo vivo esquecendo as senhas, isso é normal =).Para resolvemos este problema é simples, basta clicar no botão abaixo, e colocar a sua nova senha! Viu como é fácil?', `${cod.split('&')[2]}.Você acaba de receber o número de validação de login, agora é só digitar este número no campo de validação`, 'Percebemos que você solicitou uma recuperação de senha, mas parece que você acabou de acessar a plataforma sem concluir o processo de recuperação. Se você se lembrou da sua senha, tudo bem. Caso contrário, se você não foi você quem acessou, por favor, envie um e-mail para o nosso suporte para que possamos ajudá-lo(a) a garantir a segurança da sua conta']
    const assunto = ['Boas Vindas ao EDUKE!!','Recuperação de senha','Validar Login','Relembrou a senha?']
    console.log(`Email de ${assunto[tipo]} enviado para ${email}`)
    const mailSent = await transporter.sendMail({
      text: text[tipo],
      subject: assunto[tipo],
      from: "Equipe CX2 <edukecx2@gmail.com",
      to: email,
      html: `
      <html>
        <body style="background-color: #F5F5F5; padding: 20px;">
            <table width="600" border="0" cellpadding="1px" cellspacing="0" align="center" style="background-color: #FFFFFF; border-radius: 10px; padding: 10px 50px 20px 50px; margin-top: 50px;">
                <tr>
                    <th><img style="margin-top: 10px; margin-bottom: 20px;" height="100px" src="https://cdn.discordapp.com/attachments/572825603942645762/1046477794756001842/logo.png"><th>
                </tr>
                <tr>
                    <th style="font-size: 30px; font-weight: normal;">Olá, <strong>${usuario}</strong><th>
                </tr>
                <tr style="">
                    <th style="${tipo == 2 ? "letter-spacing: 10px; font-size: 32px; text-align: center; color:#3B82F6; text-transform: uppercase;" : "font-size: 18px; text-align: left;"}  font-weight: normal; padding-top: 40px; ">${text[tipo].split('.')[0]}<th>
                </tr>
                <tr>
                    <th style="font-size: 18px; font-weight: normal; padding-top: 30px; padding-bottom: 40px; text-align: left;">${text[tipo].split('.')[1]}<th>
                </tr>
                <tr style="${tipo == 0 || tipo == 3  ? "" : "display:none"}">
                    <th style="font-size: 18px; font-weight: normal; padding-top: 30px; padding-bottom: 40px; text-align: left;">${text[tipo].split('.')[2]}<th>
                </tr>
                <tr style="${tipo == 2 || tipo == 0 || tipo == 3 ? "display:none" : ""}">
                    <th><a href="http://localhost:3000/conta/${tipo == "1" ? "recuperar" : "validar"}/${cod}" style="text-decoration: none; color: #FFFFFF; background-color: #3B82F6; padding: 10px 40px 10px 40px; border-radius: 10px;">${tipo == "1" ? "TROCAR SENHA":"VALIDAR EMAIL"}</a><th>
                </tr>
                <tr style="${tipo == 2 || tipo == 0 || tipo == 3 ? "display:none" : ""}">
                    <th style="padding-top: 20px"><a href="http://localhost:3000/conta/${tipo == "1" ? "recuperar" : "validar"}/${cod}" style="text-decoration: none; text-align: center; ">http://localhost:3000/conta/${tipo == "1" ? "recuperar" : "validar"}/${cod}</a><th>
                </tr>
                <tr>
                    <th style="padding-top: 40px; font-weight: normal">${tipo == "1" ? "caso você não solicitou a troca de senha, recomendamos que mude a sua senha imediatamente" : "caso não seja você ignore esta mensagem"}<th>
                </tr>
            </table>
        </body>
      </html>
      `,
    });
}
module.exports = {
    EnviarEmailInicial,
};