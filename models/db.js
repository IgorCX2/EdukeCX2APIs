const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('EdukeCX2', 'EdukeAdmin', 'Eduke_Us&r@dmin_IgorCX2', {
  host: 'aprendacomeduke.com.br',
  port: '3306',
  dialect: 'mysql',
  //logging: false,
  dialectModule: require('mysql2'),
  define: {
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci'
}
});
sequelize.authenticate()
.then(()=>{
  console.log("Autenticado!");
}).catch(()=>{
  console.log("erro no banco de dados! Tente atualizar a pagina ou entre em contato com o suporte");
});
module.exports = sequelize;
