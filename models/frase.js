const { Sequelize } = require('sequelize');
const db = require('./db');
const Frase = db.define('frase', {
    id:{
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    frase:{
        type: Sequelize.TEXT,
    },
    dataFrase:{
        type: Sequelize.STRING(6)
    },
    id_autor:{
        type: Sequelize.INTEGER,
    },
    id_destinatario:{
        type: Sequelize.INTEGER,
    },
    data_vencimento:{
        type: Sequelize.STRING(6)
    },
});
Frase.sync();
module.exports = Frase;