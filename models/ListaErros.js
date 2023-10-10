const { Sequelize, DataTypes } = require('sequelize');
const db = require('./db');
const ListaErros = db.define('codigoserros', {
    codigo: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
    descricao: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    solucao: {
        type: Sequelize.TEXT,
        allowNull: false,
    },
});
ListaErros.sync();
module.exports = ListaErros;
