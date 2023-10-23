const { Sequelize, DataTypes } = require('sequelize');
const db = require('./db');
const UserInfo = require('./UserInfo');
const UserVida = db.define('uservida', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    id_user: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: UserInfo, // Referência à tabela UserInfo
            key: 'id_user'
        }
    },
});
UserInfo.hasMany(UserVida, { foreignKey: 'id_user' });
UserVida.belongsTo(UserInfo, { foreignKey: 'id_user' });
UserVida.sync();
module.exports = UserVida;