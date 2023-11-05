const express = require('express');
const { body, query, validationResult } = require('express-validator');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
var jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs/dist/bcrypt');
const { RateLimiterMemory } = require('rate-limiter-flexible');
const { ErrosVerificar } = require('../gerecial/erros');
const UserConfig = require('../models/UserConfig');
const UserInfo = require('../models/UserInfo');

const router = express.Router();
router.use(express.urlencoded({ extended: true }));
router.use(express.json());

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const maxAttempts = 5;
const windowMs = 500000; //3 minutos
const limiterUI = new RateLimiterMemory({
  points: maxAttempts,
  duration: windowMs,
});

router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  res.header('Access-Control-Allow-Headers', 'X-PINGOTHER, Content-Type, Authorization');
  res.header('x-forwarded-for', '*');
  router.use(cors());
  next();
});
router.get('/pegar-informacoes', [query('id').isNumeric().withMessage('Id inválido')], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.errors[0].msg });
    }
    const sanitizedData = DOMPurify.sanitize(req.query.id)
    try{
        const infosUsuario = await UserInfo.findOne({
            where: {
                id_user: sanitizedData,
            },
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        })
        const configUsuario = await UserConfig.findOne({
            where: {
                id: sanitizedData,
            },
            attributes: ['stats', 'nome', 'createdAt']
        });
        if(infosUsuario && configUsuario){
            return res.status(200).json({
                infosUsuario,
                status: {
                    stats: configUsuario.stats,
                    nome: configUsuario.nome,
                    criacao: `${configUsuario.createdAt.getDate()}/${configUsuario.createdAt.getMonth() + 1}/${configUsuario.createdAt.getFullYear()}`  
                }
            });
        }
        return res.status(409).json({
            status: `1_PI#0002`,
            msg: `Erro, nenhum usuario encontrado`,
        });
    }catch(error){
        console.error(`ERRO 1_PI#0001: ${error}`)
        ErrosVerificar('NINGUEM', '1_PI#0001', 'NADA')
        return res.status(500).json({
          status: `1_PI#0001`,
          msg: `O sistema enfrentou uma dificuldade ao tentar estabelecer uma conexão com o banco de dados!`,
        });
    }
});

router.post('/mudar-status', [body('id').isNumeric().withMessage('Id inválido')] ,async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.errors[0].msg });
    }
    try{
        const sanitizedData = DOMPurify.sanitize(req.body.id)
        const rateLimiterRes = await limiterUI.consume(sanitizedData.id);
        try{
            UserConfig.update(
                { stats: '0'},
                { where: { id: parseInt(sanitizedData)} }
            )
            return res.status(200).json({
                status: '200'
            });
        }catch(error){
            console.error(`ERRO 1_MS#0001: ${error}`)
            ErrosVerificar('NINGUEM', '1_MS#0001', 'NADA')
            return res.status(500).json({
                status: `1_MS#0001`,
                msg: 'O sistema enfrentou uma dificuldade ao tentar estabelecer uma conexão com o banco de dados!'
            });
        }
    }catch(error){
        return res.status(429).json({
            msg: 'Você tentou realizar esta ação muitas vezes. Aguarde alguns minutos e tente novamente.',
            status: '1_UI#0001',
        });
    }
});

router.post('/cad-nivel', [body('id').trim().isNumeric().withMessage('Id errado'),body('form.matemática').trim().isNumeric().isLength({ max: 1 }).withMessage('Erro:1_SN#1254'),body('form.português').trim().isNumeric().isLength({ max: 1 }).withMessage('Erro:1_SN#1254'),body('form.geografia').trim().isNumeric().isLength({ max: 1 }).withMessage('Erro:1_SN#1254'),body('form.história').trim().isNumeric().isLength({ max: 1 }).withMessage('Erro:1_SN#1254'),body('form.biologia').trim().isNumeric().isLength({ max: 1 }).withMessage('Erro:1_SN#1254'),body('form.química').trim().isNumeric().isLength({ max: 1 }).withMessage('Erro:1_SN#1254'),body('form.física').trim().isNumeric().isLength({ max: 1 }).withMessage('Erro:1_SN#1254'),body('form.literatura').trim().isNumeric().isLength({ max: 1 }).withMessage('Erro:1_SN#1254'),body('form.artes').trim().isNumeric().isLength({ max: 1 }).withMessage('Erro:1_SN#1254'),body('form.sociologia').trim().isNumeric().isLength({ max: 1 }).withMessage('Erro:1_SN#1254'),body('form.filosofia').trim().isNumeric().isLength({ max: 1 }).withMessage('Erro:1_SN#1254')], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.errors[0].msg });
    }
    const sanitizedData = {
        form: {
            matemática: DOMPurify.sanitize(req.body.form.matemática),
            português: DOMPurify.sanitize(req.body.form.português),
            geografia: DOMPurify.sanitize(req.body.form.geografia),
            história: DOMPurify.sanitize(req.body.form.história),
            biologia: DOMPurify.sanitize(req.body.form.biologia),
            química: DOMPurify.sanitize(req.body.form.química),
            física: DOMPurify.sanitize(req.body.form.física),
            literatura: DOMPurify.sanitize(req.body.form.literatura),
            artes: DOMPurify.sanitize(req.body.form.artes),
            sociologia: DOMPurify.sanitize(req.body.form.sociologia),
            filosofia: DOMPurify.sanitize(req.body.form.filosofia),
        },
        id: DOMPurify.sanitize(req.body.id)
     };
    try{
        const rateLimiterRes = await limiterUI.consume(sanitizedData.id);
        try{
            UserInfo.update(
                { nivel: sanitizedData.form.matemática+`,`+sanitizedData.form.português+`,`+sanitizedData.form.geografia+`,`+sanitizedData.form.história+`,`+sanitizedData.form.biologia+`,`+sanitizedData.form.química+`,`+sanitizedData.form.física+`,`+sanitizedData.form.literatura+`,`+sanitizedData.form.artes+`,`+sanitizedData.form.sociologia+`,`+sanitizedData.form.filosofia},
                { where: { id_user: parseInt(sanitizedData.id)} }
            )
            return res.status(200).json({
                status: '200'
            });
        }catch(error){
            console.error(`ERRO 1_CN#0001: ${error}`)
            ErrosVerificar('NINGUEM', '1_MS#0001', 'NADA')
            return res.status(500).json({
                status: `1_CN#0001`,
                msg: 'O sistema enfrentou uma dificuldade ao tentar estabelecer uma conexão com o banco de dados!'
            });
        }
    }catch (error) {
        return res.status(429).json({
          msg: 'Você tentou realizar esta ação muitas vezes. Aguarde alguns minutos e tente novamente.',
          status: '1_UI#0001',
        });
    }
});
router.post('/salva-plano', async (req, res) => {
    const sanitizedData = {
        plano: DOMPurify.sanitize(req.body.plano),
        id: DOMPurify.sanitize(req.body.id)
     };
    try{
        UserInfo.update(
            { plano: sanitizedData.plano},
            { where: { id_user: parseInt(sanitizedData.id)} }
        )
        return res.status(200).json({
            status: `200`,
        });
    }catch(error){
        console.error(`ERRO 1_SP#0001: ${error}`)
        ErrosVerificar('NINGUEM', '1_SP#0001', 'NADA')
        return res.status(500).json({
            status: `1_SP#0001`,
            msg: 'O sistema enfrentou uma dificuldade ao tentar estabelecer uma conexão com o banco de dados!'
        });
    }
});
module.exports = router;