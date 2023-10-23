const express = require('express');
const { body, validationResult } = require('express-validator');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
var jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs/dist/bcrypt');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const { ErrosVerificar } = require('../gerecial/erros');
const UserVida = require('../models/UserVida');

const router = express.Router();
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'X-PINGOTHER, Content-Type, Authorization');
  res.header('x-forwarded-for', '*');
  router.use(cors());
  next();
});
async function DestruirVida(id){
    UserVida.destroy({
        where: {
            id_user: id
        },
    });
}
router.route('/vida/:id')
    .get(async (req, res) => {
        const pegarId = req.params.id;
        const dataAtual = new Date();
        const minhasVidas = []
        console.log(dataAtual)
        if(!isNaN(Number(pegarId))){
            try{
                const conVida = await UserVida.findAll({
                    where:{
                        id_user: pegarId
                    }
                })
                conVida.map(vida => {
                    console.log(vida.createdAt)
                    if(vida.createdAt != "" | vida.createdAt != undefined){
                        const dataVida = new Date(vida.createdAt)
                        const diferencaTempo =  dataVida - dataAtual
                        const umaHora = 60 * 60 * 1000;
                        if(diferencaTempo >= umaHora){
                            minhasVidas.push(0)
                            DestruirVida(vida.id)
                        }else{
                            minhasVidas.push(diferencaTempo)
                        }
                    }else{
                        minhasVidas.push(0)
                    }
                })
            }catch(error){
                console.error(`ERRO 1_FR#0002: ${error}`)
                ErrosVerificar('NINGUEM', '1_FR#0002', 'NADA')
                return res.status(500).json({
                  status: `1_FR#0002`,
                  msg: `O sistema enfrentou uma dificuldade ao tentar estabelecer uma conexão com o banco de dados!`,
                });
            }
        }
        return res.status(409).json({
            status: `1_VG#0001`,
            msg: `Erro, id inválido!`,
        });
    })
    .post(async (req, res) => {
        // Lógica para criar um novo registro
        console.log('p')
        res.json({ message: 'Criando um novo registro' });
    })
    .delete(async (req, res) => {
        // Lógica para excluir um registro
        console.log('del')
        res.json({ message: 'Excluindo um registro' });
    });

module.exports = router;