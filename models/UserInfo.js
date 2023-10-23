const { Sequelize } = require('sequelize');
const db = require('./db');
const UserConfig = require('./UserConfig');
const UserInfo = db.define('userinfo', {
    id_user:{
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: UserConfig,
            key: 'id'
        }
    },
    plano:{
        type: Sequelize.STRING,
    },
    dificuldade:{
        type: Sequelize.TEXT,
    },
    historicoplano:{
        type: Sequelize.TEXT,
    },
    ativos:{
        type: Sequelize.TEXT, //questao e plano
    },
    nivel:{
        type: Sequelize.STRING(50),
    },
});
UserConfig.hasMany(UserInfo, { foreignKey: 'id_user'});
UserInfo.belongsTo(UserConfig, { foreignKey: 'id_user'});
UserInfo.sync();
module.exports = UserInfo;