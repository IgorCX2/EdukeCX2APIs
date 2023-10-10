const { Sequelize, DataTypes } = require('sequelize');
const db = require('./db');
const LogsErros = db.define('logserros', {
    id:{
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    contato:{
        type: Sequelize.STRING,
        allowNull: false
    },
    codigo:{
        type: Sequelize.STRING(10),
        allowNull: false,
    },
    situacao:{
        type: Sequelize.ENUM,
        values: ['ABERTA', 'FINALIZADA', 'ARQUIVADA', 'ATENDIDA', 'ATENDENDO'],
        defaultValue: 'ARQUIVADA',
    },
});
LogsErros.sync();
module.exports = LogsErros;