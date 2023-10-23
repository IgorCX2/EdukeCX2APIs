const { Sequelize, DataTypes } = require('sequelize');
const db = require('./db');
const UserConfig = require('./UserConfig');
const UserItems = db.define('useritems', {
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
    item:{
        type: Sequelize.INTEGER,
    },
    data_vencimento:{
        type: Sequelize.STRING(6)
    },
});
UserConfig.hasMany(UserItems, { foreignKey: 'id_user' });
UserItems.belongsTo(UserConfig, { foreignKey: 'id_user' });
UserItems.sync();
module.exports = UserItems;