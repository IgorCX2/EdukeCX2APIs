const ListaErros = require('../models/ListaErros');
const LogsErros = require('../models/LogsErros');
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
async function EnviarEmailInicial(erro, email, solucao, descricao,id) {
    console.log(`Email de erro enviado para ${email}`)
    const mailSent = await transporter.sendMail({
      text: 'Olá! Identificamos que você enfrentou algum erro em nossa plataforma, mas não se preocupe, nossa equipe entrará em contato com você em breve para resolver',
      subject: `Ticket/Informativo sobre o erro: ${erro}`,
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
                    <th style="font-size: 30px; font-weight: normal;">ERRO ${erro}<th>
                </tr>
                <tr>
                    <th style="font-size: 18px; font-weight: normal; padding-top: 20px; text-align: left;">Descrição: ${descricao}<th>
                </tr>
                <tr>
                    <th style="font-size: 18px; font-weight: normal; padding-top: 10px; padding-bottom: 10px; text-align: left;">Possível Solução: ${solucao}<th>
                </tr>
                <tr style="${erro == "1_EN#0003" && "display:none" }">
                    <th style="font-size: 18px; font-weight: normal; padding-top: 40px; padding-bottom: 40px; text-align: left;">Identificamos que você enfrentou algum erro em nossa plataforma, mas não se preocupe, nossa equipe entrará em contato com você em breve para resolver<th>
                </tr>
                <tr style="${erro == "1_EN#0003" && "display:none" }">
                    <th style="text-decoration: none; color: #FFFFFF; background-color: #3B82F6; padding: 10px 40px 10px 40px; border-radius: 10px;">TICKET #${id}<th>
                </tr>
            </table>
        </body>
      </html>
      `,
    });
}
async function ErrosVerificar(contato, codigo, situacao){
    try{
        const novoErro = await LogsErros.create({contato: contato, codigo: codigo, situacao: `${(situacao == "EMAIL" && codigo != "1_EN#0003") ? 'ABERTA' : "ARQUIVADA"}`})
        if(situacao == "EMAIL"){
            const buscarErro = await ListaErros.findOne({
                where:{
                    codigo: codigo
                }
            })
            EnviarEmailInicial(codigo, contato, buscarErro.solucao, buscarErro.descricao, novoErro.id)
        }
    }catch(error){
        console.log(`NÃO FOI POSSIVEL ATUALIZAR OS ERROS: ${error}`)
    }
}
module.exports = {
    ErrosVerificar,
};