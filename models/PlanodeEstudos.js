const { Sequelize } = require('sequelize');
const db = require('./db');
const Plano_estudos = db.define('plano_estudos', {
    codigo_plano:{
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    plano_estudos:{
        type: Sequelize.STRING(150),
        charset: 'utf8mb4',
        collate: 'utf8mb4_general_ci'
    },
    materia: {
        type: Sequelize.TINYINT.UNSIGNED,
        validate: {
            min: 0,
            max: 10
        }
    },
    conteudo:{
        type: Sequelize.STRING(60),
    },
    nivel:{
        type: Sequelize.TINYINT.UNSIGNED,
        validate: {
            min: 0,
            max: 4
        }
    },
    conteudo_previo:{
        type: Sequelize.STRING(60),
    }
});
Plano_estudos.sync();
module.exports = Plano_estudos; 