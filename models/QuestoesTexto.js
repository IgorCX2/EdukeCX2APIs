const { Sequelize } = require('sequelize');
const db = require('./db');
const Questoes_Texto = db.define('questoes_texto', {
    id:{
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    texto:{
        type: Sequelize.TEXT('medium'),
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci'
    },
    enunciado:{
        type: Sequelize.TEXT,
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci'
    },
    alternativas:{
        type: Sequelize.TEXT,
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci'
    },
    resposta:{
        type: Sequelize.TEXT,
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci'
    }
});
Questoes_Texto.sync();
module.exports = Questoes_Texto; 