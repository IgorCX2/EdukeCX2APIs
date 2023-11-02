const express = require("express");
const { body, query, validationResult } = require('express-validator');
const cors = require('cors');
const { Op } = require("sequelize");
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const Conteudo = require('../models/Conteudo');
const Plano_estudos = require("../models/PlanodeEstudos");
const { ErrosVerificar } = require("../gerecial/erros");
const UserInfo = require("../models/UserInfo");


const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const router = express.Router();
router.use(express.urlencoded({ extended: true}))
router.use(express.json());


router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    res.header("Access-Control-Allow-Headers", "X-PINGOTHER, Content-Type, Authorization");
    res.header("x-forwarded-for", "*")
    router.use(cors());
    next();
});
async function PegarConteudo(id){
    const conteudo = await Conteudo.findAll({
        where: {
            codigo_conteudo: id
        },
        attributes: ['conteudo','grupo','descricao','codigo_conteudo']
    })
    return conteudo
}
async function PegarPlano(id){
    const plano = await Plano_estudos.findAll({
        where: {
            codigo_plano: id
        },
        attributes: ['plano_estudos', 'materia', 'conteudo', 'conteudo_previo', 'codigo_plano']
    });
    return plano
}
router.get('/get-infos', [query('id').isNumeric().withMessage('Id inválido'),query('tipo').trim().isLength({ max: 1 }).withMessage('o tipo so deve conter a inicial')], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.errors[0].msg });
    }
    const sanitizedData = DOMPurify.sanitize(req.query.id)
    switch(req.query.tipo){
        case 'A':
            try{
                const plano = await PegarPlano(sanitizedData)
                const pesquisarConteudo = `${plano[0].conteudo_previo},${plano[0].conteudo}`
                var conteudoPrevioFormatado = plano[0].conteudo_previo.split(',')
                const conteudo = await Conteudo.findAll({
                    where: {
                        codigo_conteudo:{
                            [Op.or]: pesquisarConteudo.split(',').map(valor => ({
                                [Op.like]: valor
                            }))
                        } 
                    },
                    attributes: ['conteudo','grupo','descricao','codigo_conteudo']
                })
                var conteudoPrevio = []
                var conteudoAprender = []
                conteudo.map(conteudoSeparado => {
                    if(conteudoPrevioFormatado.indexOf(conteudoSeparado.codigo_conteudo.toString()) != -1){
                        conteudoPrevio.push(conteudoSeparado)
                    }else{
                        conteudoAprender.push(conteudoSeparado)
                    }
                })
                return res.json({
                    Planos: plano,
                    conteudoPrevio,
                    conteudoAprender
                });
            }catch(error){
                console.error(`ERRO 1_GI#0001: ${error}`)
                ErrosVerificar('NINGUEM', '1_SQ#0001', 'NADA')
                return res.status(500).json({
                    status: `1_GI#0001`,
                    msg: 'Não conseguimos pegar os dados do banco de dados'
                });
            }
        case 'P':
            try{
                const meuPlano = await PegarPlano(sanitizedData)
                return res.status(200).json({
                    meuPlano
                });
            }catch(error){
                console.error(`ERRO 1_GI#0001: ${error}`)
                ErrosVerificar('NINGUEM', '1_SQ#0001', 'NADA')
                return res.status(500).json({
                    status: `1_GI#0001`,
                    msg: 'Não conseguimos pegar os dados do banco de dados'
                });
            }
        case 'C':
            try{
                const meuConteudo = await PegarConteudo(sanitizedData)
                return res.status(200).json({
                    meuConteudo
                });
            }catch(error){
                console.error(`ERRO 1_GI#0001: ${error}`)
                ErrosVerificar('NINGUEM', '1_SQ#0001', 'NADA')
                return res.status(500).json({
                    status: `1_GI#0001`,
                    msg: 'Não conseguimos pegar os dados do banco de dados'
                });
            }
    }
    return res.status(500).json({
        status: `1_GI#0021`,
        msg: 'ERRO INESPERADO'
    });
});

router.get('/get-planoALl', async (req, res) => {
    try{
        const plano = await Plano_estudos.findAll({
            attributes: ['codigo_plano', 'plano_estudos']
        });
        return res.status(200).json({
            Planos: plano,
        });
    }catch(error){
        console.error(`ERRO 1_GP#0001: ${error}`)
        ErrosVerificar('NINGUEM', '1_GP#0001', 'NADA')
        return res.status(500).json({
            status: `1_GP#0021`,
            msg: 'Não conseguimos pegar os dados do banco de dados'
        });
    }
});

router.post('/add-plano', [body('id').isNumeric().withMessage('Id inválido')], async (req, res) => {
    console.log(req.body)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.errors[0].msg });
    }
    const sanitizedData = {
          nome: DOMPurify.sanitize(req.body.nome),
          id: DOMPurify.sanitize(req.body.id)
    };
    try{
        const plano = await Plano_estudos.findOne({
            where: {
                plano_estudos: sanitizedData.nome,
            },
            attributes: ['codigo_plano', 'plano_estudos']
        });
        console.log(plano)
        if(plano){
            const infosUsuario = await UserInfo.findOne({
                where: {
                    id_user: sanitizedData.id,
                },
                attributes: { exclude: ['createdAt', 'updatedAt'] }
            })
            const addPlano = infosUsuario.plano.split(',')
            addPlano.unshift(plano.codigo_plano+'|')
            UserInfo.update(
                { plano: addPlano.toString()},
                { where: { id_user: parseInt(sanitizedData.id)} }
            )
        }
        return res.status(200).json({
            Planos: 'atualizado'
        });
    }catch(error){
        console.error(`ERRO 1_AP#0001: ${error}`)
        ErrosVerificar('NINGUEM', '1_AP#0001', 'NADA')
        return res.status(500).json({
            status: `1_AP#0021`,
            msg: 'Não conseguimos pegar os dados do banco de dados'
        });
    }
});


module.exports = router;