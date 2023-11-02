const { Sequelize } = require('sequelize');
const db = require('./db');
const Conteudo = db.define('conteudos', {
    codigo_conteudo:{
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    conteudo:{
        type: Sequelize.STRING(150),
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci'
    },
    descricao: {
        type: Sequelize.TEXT,
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci'
    },
    grupo:{
        type: Sequelize.STRING(60),
    },
});
Conteudo.sync();
module.exports = Conteudo; 