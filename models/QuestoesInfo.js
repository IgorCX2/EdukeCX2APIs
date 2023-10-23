const { Sequelize } = require('sequelize');
const db = require('./db');
const Questoes_Informacoes = db.define('questoes_informacoes', {
    id:{
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    banca:{
        type: Sequelize.STRING(80),
    },
    lote:{
        type: Sequelize.STRING(8),
    },
    alternativas:{
        type: Sequelize.STRING(60),
    },
    alternativa_correta:{
        type: Sequelize.TINYINT(1),
    },
    tempo_questao:{
        type: Sequelize.TIME,
    },
    respostas_corretas:{
        type: Sequelize.INTEGER,
    },
    materia: {
        type: Sequelize.TINYINT.UNSIGNED,
        validate: {
            min: 0,
            max: 10
        }
    },
    conteudo: {
        type: Sequelize.STRING(60),
    }, 
});
Questoes_Informacoes.sync();
module.exports = Questoes_Informacoes; 