const { Sequelize, DataTypes } = require('sequelize');
const db = require('./db');
const UserConfig = db.define('userconfig', {
    id:{
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    nome:{
        type: Sequelize.STRING(50),
        allowNull: false
    },
    email:{
        type: Sequelize.STRING,
        allowNull: false
    },
    senha:{
        type: Sequelize.STRING,
        allowNull: false
    },
    stats:{
        type: Sequelize.STRING(20),
        defaultValue: '0',
    },
    skin:{
        type: Sequelize.STRING(60),
    },
});
UserConfig.sync();
module.exports = UserConfig;