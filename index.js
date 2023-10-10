const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

app.use(helmet());

const whitelist = ['http://localhost:3000', 'http://aprendacomeduke.com.br', undefined];
app.use(
  cors({
    origin: function (origin, callback) {
      if (whitelist.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Acesso negado pela política!'));
      }
    },
  })
);

// Importa as rotas do módulo de contaRegistro
const contaRegistroRouter = require('./api/contaRegistro');
app.use('/api/contaRegistro', contaRegistroRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor iniciado na porta ${PORT}`));
