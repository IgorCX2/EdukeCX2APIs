const { Sequelize, DataTypes } = require('sequelize');
const db = require('./db');
const UserBanco = db.define('userbanco', {
    id:{
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    id_user:{
        type: Sequelize.INTEGER,
        allowNull: false
    },
    tipo:{
        type: Sequelize.ENUM,
        values: ['D', 'M'],
        defaultValue: 'M',
    },
    acao:{
        type: Sequelize.ENUM,
        values: ['R', 'S'],
        defaultValue: 'R',
    },
    valor:{
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
    },
    descricao:{
        type: Sequelize.STRING(20),
    },
});
UserBanco.sync();
module.exports = UserBanco;