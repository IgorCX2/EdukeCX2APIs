const { Sequelize, DataTypes } = require('sequelize');
const db = require('./db');
const UserConfig = require('./UserConfig');
const UserBanco = db.define('userbanco', {
    id:{
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    id_user:{
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: UserConfig,
            key: 'id'
        }
    },
    tipo:{
        type: Sequelize.ENUM,
        values: ['D', 'M'],
        defaultValue: 'M',
    },
    acao:{
        type: Sequelize.ENUM,
        values: ['R', 'D'],
        defaultValue: 'D',
    },
    valor:{
        type: Sequelize.FLOAT,
        defaultValue: 100,
    },
    descricao:{
        type: Sequelize.STRING(20),
    },
});
UserConfig.hasMany(UserBanco, { foreignKey: 'id_user'});
UserBanco.belongsTo(UserConfig, { foreignKey: 'id_user'});
UserBanco.sync();
module.exports = UserBanco;