const express = require("express");
const cors = require('cors');

Frase = require("../models/frase");
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

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
router.get('/', async (req, res) => {
    console.log(req.query.data)
    const dataSeparada = req.query.data.split('/')
    if(req.query.data.length == 5 && dataSeparada[0].length == 2 && dataSeparada[1].length == 2 && !isNaN(dataSeparada[0]) && !isNaN(dataSeparada[1]) && (Number(dataSeparada[1]) > 0 && Number(dataSeparada[1]) <= 12) && (Number(dataSeparada[0]) > 0 && Number(dataSeparada[0]) <= 31)){
        const sanitizedData = DOMPurify.sanitize(req.query.data)
        try{
            const fraseBanco = await Frase.findAll({
                where: {
                    dataFrase: sanitizedData
                },
                attributes: ['frase','id_destinatario']
            })
            if(fraseBanco.length == 0){
                return res.json({
                    frase: "Não encontramos nenhuma frase para o dia de hoje, talvez você possa ser o(a) 1º a escreve-la!"
                });
            }
            const fraseSemDestinatario = fraseBanco.filter(frase => (frase.id_destinatario == "" || frase.id_destinatario == null));
            const fraseDiaria = fraseSemDestinatario[Math.floor(Math.random() * fraseSemDestinatario.length)]
            return res.json({
                fraseDiaria: fraseDiaria,
                bancoFrases: fraseBanco
            });
        }catch(error){
            console.error(`ERRO 1_FR#0001: ${error}`)
            ErrosVerificar('NINGUEM', '1_FR#0001', 'NADA')
            return res.status(500).json({
              status: `1_FR#0001`,
              msg: `O sistema enfrentou uma dificuldade ao tentar estabelecer uma conexão com o banco de dados!`,
            });
        }
    }
    return res.status(409).json({
        frase: "Data Inválida: a data deve ter o formato DD/MM"
    });
});
module.exports = router;