const express = require("express");
const {query, validationResult } = require('express-validator');
const Questoes_Texto = require("../models/QuestoesTexto");
const cors = require('cors');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const router = express.Router();
router.use(express.urlencoded({ extended: true}))
router.use(express.json());

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    res.header("Access-Control-Allow-Headers", "X-PINGOTHER, Content-Type, Authorization");
    res.header("x-forwarded-for", "*")
    router.use(cors());
    next();
});
router.get('/get-questao', [query('idQuestao').isNumeric().withMessage('Id inválido')], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.errors[0].msg });
    }
    const sanitizedData = DOMPurify.sanitize(req.query.idQuestao)
    try{
        const buscarquestoestexto = await Questoes_Texto.findOne({
            where: {
                id: sanitizedData
            },
            attributes: ['texto', 'enunciado', 'alternativas']
        })
        if(!buscarquestoestexto){
            return res.status(500).json({
                status: `1_GQ#0002`,
                msg: `Nenhuma questão encontrada!`,
              });
        }
        return res.status(200).json({
            texto: `${buscarquestoestexto.texto != 'null' ? buscarquestoestexto.texto : 'N.D.A'}`,
            pergunta: buscarquestoestexto.enunciado,
            alternativas: buscarquestoestexto.alternativas,
        });
    }catch(error){
        console.error(`ERRO 1_GQ#0001: ${error}`)
        ErrosVerificar('NINGUEM', '1_GQ#0001', 'NADA')
        return res.status(500).json({
          status: `1_GQ#0001`,
          msg: `O sistema enfrentou uma dificuldade ao tentar estabelecer uma conexão com o banco de dados das questões!`,
        });
    }
});
module.exports = router;