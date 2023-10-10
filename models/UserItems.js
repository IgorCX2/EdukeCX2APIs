const { Sequelize, DataTypes } = require('sequelize');
const db = require('./db');
const UserItems = db.define('useritems', {
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
    item:{
        type: Sequelize.INTEGER,
    },
    data_vencimento:{
        type: Sequelize.STRING(6)
    },
});
UserItems.sync();
module.exports = UserItems;