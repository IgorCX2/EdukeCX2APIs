const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

app.use(helmet());

const whitelist = ['http://localhost:3000', 'http://aprendacomeduke.com.br', undefined, 'http://localhost:8080'];
app.use(
  cors({
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.log(origin)
        callback(new Error('Acesso negado pela política!'));
      }
    },
  })
);

const contaRegistroRouter = require('./api/contaRegistro');
app.use('/api/contaRegistro', contaRegistroRouter);

const frases = require("./api/frases");
app.use("/api/frases", frases);

const vida = require("./api/usuariosVida");
app.use("/api/usuariosVida", vida);

const infos = require("./api/usuariosInfos");
app.use("/api/usuariosInfos", infos);

const selecionarQuestoes = require("./api/selecionarQuestoes");
app.use("/api/selecionarQuestoes", selecionarQuestoes);

const questoes = require("./api/questoes");
app.use("/api/questoes", questoes);

const analisarQuestoes = require("./api/analisarQuestoes");
app.use("/api/analisarQuestoes", analisarQuestoes);

const estudarInfos = require("./api/estudar");
app.use("/api/estudar", estudarInfos);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor iniciado na porta ${PORT}`));