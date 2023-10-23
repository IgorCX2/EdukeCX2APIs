const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { Op } = require("sequelize");
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const { ErrosVerificar } = require('../gerecial/erros');
const cors = require('cors');

const { RateLimiterMemory } = require('rate-limiter-flexible');
const UserInfo = require('../models/UserInfo');
const Plano_estudos = require('../models/PlanodeEstudos');
const Questoes_Informacoes = require('../models/QuestoesInfo');

const router = express.Router();
router.use(express.urlencoded({ extended: true }));
router.use(express.json());
router.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE");
    res.header("Access-Control-Allow-Headers", "X-PINGOTHER, Content-Type, Authorization");
    res.header("x-forwarded-for", "*")
    router.use(cors());
    next();
});
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

function OrganizarArray(arr, size) {
    let organizar = [];
    let count = 0
    for (let i = 0; i < arr.length; i += size) {
        let organiza = arr.slice(i, i + size);
        organizar.push(organiza);
        count++
    }
    return organizar;
}
function trasformarSegundosEmTempo(segundos){
    var horas = Math.floor(segundos / 3600);
    var minutos = Math.floor((segundos % 3600) / 60);
    var segundo = segundos % 60;
    var tempoFormatado = horas.toString().padStart(2, '0') + ':' + minutos.toString().padStart(2, '0') + ':' + segundo.toString().padStart(2, '0');
    return tempoFormatado;
}

router.post('/diagnostico', [body('id').trim().isNumeric().withMessage('Id errado')], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.errors[0].msg });
    }
    const sanitizedData = {
        id: DOMPurify.sanitize(req.body.id)
    };
    var salvarPontoConteudo = []
    if(req.body.config.planoHistorico  == undefined ){
        req.body.config.planoHistorico = []
    }else{
        req.body.config.planoHistorico.split(',')
    }
    if(req.body.dados.historicomateria == "" || req.body.dados.historicomateria == undefined){
        req.body.dados.historicomateria = '0'
    }
    if(req.body.dados.respostasHistorico[req.body.dados.historicomateria] == undefined){
        req.body.dados.respostasHistorico[req.body.dados.historicomateria] = []
    }
    if(req.body.dados.historicoPosicao[req.body.dados.historicomateria] == undefined){
        req.body.dados.historicoPosicao[req.body.dados.historicomateria] = ['0']
    }
    var dificuldadeUser = []
    if(req.body.dados.dificuldade.length == 0){
        if(req.body.config.dificuldadeUser != undefined){
            dificuldadeUser = req.body.config.dificuldadeUser
        }
    }else{
        dificuldadeUser = req.body.dados.dificuldade
    }
    const questaoAvaliada = req.body.config.questoesAvaliar[req.body.dados.historicomateria][req.body.dados.historicoPosicao[req.body.dados.historicomateria][req.body.dados.historicoPosicao[req.body.dados.historicomateria].length-1]][0]
    let[horas, minutos, segundos] = questaoAvaliada.tempo_questao.split(":")
    let totalSegundos = (+horas * 60 * 60) + (+minutos * 60) + (+segundos);
    var tempoPonto = -1*((req.body.segundos-totalSegundos)/totalSegundos)
    if(tempoPonto > -0.3 && tempoPonto < 0.3){
        tempoPonto = 0.4
    }
    const nivelAntigo = req.body.config.nivelMaterias
    var novaAlternativa =  questaoAvaliada.alternativas.split(',')
    const somaTotalFeita =  novaAlternativa.map(Number).reduce((acc, curr) => acc + curr, 0);
    console.log(questaoAvaliada)
    questaoAvaliada.conteudo = questaoAvaliada.conteudo.split(',').map(Number).map(num => num + 1).join(',');
    console.log(questaoAvaliada.conteudo)
    const dificuldadeQuestao =  100-((questaoAvaliada.respostas_correta/somaTotalFeita)*100)
    const [respostaUser, conteudoAvaliado] = req.body.resposta.split("|")
    novaAlternativa[respostaUser] = Number(novaAlternativa[respostaUser])+1
    console.log(req.body.config.nivelConteudo[req.body.dados.historicomateria])
    console.log(req.body.config.nivelConteudo[req.body.dados.historicomateria][req.body.dados.historicoPosicao[req.body.dados.historicomateria][req.body.dados.historicoPosicao[req.body.dados.historicomateria].length-1]][0])
    
    if(respostaUser == questaoAvaliada.alternativa_correta){
        console.log('acertou')
        req.body.dados.respostasHistorico[req.body.dados.historicomateria].push(`A|${questaoAvaliada.materia}|${questaoAvaliada.conteudo.toString()}|${req.body.config.nivelConteudo[req.body.dados.historicomateria][req.body.dados.historicoPosicao[req.body.dados.historicomateria][req.body.dados.historicoPosicao[req.body.dados.historicomateria].length-1]][0]}`)
        var tempoFeito = (totalSegundos+req.body.segundos)/2
        Questoes_Informacoes.update(
            { alternativas: novaAlternativa.toString(), respostas_corretas: Number(questaoAvaliada.respostas_corretas)+1, tempo_questao: trasformarSegundosEmTempo(tempoFeito)},
            { where: { id:questaoAvaliada.id} }   
        )
            
        if(dificuldadeQuestao > 60){
            conteudoAvaliado.split(',').map(conteudo => {
                const dividirPonto = conteudo.split('=')
                console.log(dividirPonto[0])
                console.log(Number(dividirPonto[0])*(1.1+(tempoPonto/2)).toFixed(1))
                console.log(1.1+(tempoPonto/2))
                salvarPontoConteudo.push(`${(Number(dividirPonto[0])*(1.1+(tempoPonto/2))).toFixed(1)}=${Number(dividirPonto[1])+1}`)
            })
        }else{
            conteudoAvaliado.split(',').map(conteudo => {
                const dividirPonto = conteudo.split('=')
                salvarPontoConteudo.push(`${(Number(dividirPonto[0])*(1+(tempoPonto/4))).toFixed(1)}=${Number(dividirPonto[1])+1}`)
            })  
        }
    }else{
        console.log('errou')
        req.body.dados.respostasHistorico[req.body.dados.historicomateria].push(`E|${questaoAvaliada.materia}|${questaoAvaliada.conteudo.toString()}|${req.body.config.nivelConteudo[req.body.dados.historicomateria][req.body.dados.historicoPosicao[req.body.dados.historicomateria][req.body.dados.historicoPosicao[req.body.dados.historicomateria].length-1]][0]}`)
        const porcentagemIgual = questaoAvaliada.alternativas.split(',')[respostaUser]/somaTotalFeita
        Questoes_Informacoes.update(
            { alternativas: novaAlternativa.toString(), },
            { where: { id: questaoAvaliada.id} }
        )
        if(dificuldadeQuestao > 60){
            conteudoAvaliado.split(',').map(conteudo => {
                const dividirPonto = conteudo.split('=')
                salvarPontoConteudo.push(`${(Number(dividirPonto[0])*(1.5-porcentagemIgual)).toFixed(1)}=${Number(dividirPonto[1])+1}`)
            })   
        }else{
            conteudoAvaliado.split(',').map(conteudo => {
                const dividirPonto = conteudo.split('=')
                salvarPontoConteudo.push(`${(Number(dividirPonto[0])*(2-porcentagemIgual)).toFixed(1)}=${Number(dividirPonto[1])+1}`)
            })
        }
    }
    salvarPontoConteudo.forEach(conteudo =>{
        console.log(conteudo)
        const [pontos, id] = conteudo.split('=')
        const conteudoExistente = dificuldadeUser?.find(conteudo => conteudo.startsWith(`${id}=`));
        if(conteudoExistente){
            const indice = dificuldadeUser.indexOf(conteudoExistente);
            const [idExistente, pontosExistente] = conteudoExistente.split('=');
            dificuldadeUser[indice] = `${id}=${parseInt(pontosExistente) + parseInt(pontos)}`;
        }else{
            dificuldadeUser.push(`${id}=${pontos}`)
        }
    })
    UserInfo.update(
        { dificuldade: dificuldadeUser.toString()},
        { where: { id_user: sanitizedData.id} }
    )
    if(req.body.dados.historicoPosicao[req.body.dados.historicomateria][req.body.dados.historicoPosicao[req.body.dados.historicomateria].length-1] == "4" || req.body.dados.historicoPosicao[req.body.dados.historicomateria][req.body.dados.historicoPosicao[req.body.dados.historicomateria].length-1] == "5" || req.body.dados.historicoPosicao[req.body.dados.historicomateria].length == 5){
        console.log("mudou de materia")
        retornoPergunta = "0"
        retornoMateria = Number(req.body.dados.historicomateria)+1
        req.body.dados.historicoPosicao[retornoMateria] = ['0']
    }else{
        if(req.body.dados.historicoPosicao[req.body.dados.historicomateria].length == 1){
            console.log("entrou na 2 questao (mesmo conteudo/contraprova)")
            retornoPergunta = "1"
            retornoMateria = req.body.dados.historicomateria
            if(req.body.dados.respostasHistorico[req.body.dados.historicomateria][0][0] == "A" && tempoPonto > 0.5){
                console.log("top entrou na 2 questao (passou para a proxima)")
                retornoPergunta = "2"
            }
        }
        if(req.body.dados.historicoPosicao[req.body.dados.historicomateria].length == 2){
            console.log("entrou na 3 questao (mesmo conteudo/contraprova)")
            retornoMateria = req.body.dados.historicomateria
            retornoPergunta = Number(req.body.dados.historicoPosicao[req.body.dados.historicomateria][req.body.dados.historicoPosicao[req.body.dados.historicomateria].length-1])+1
            if(req.body.dados.historicoPosicao[req.body.dados.historicomateria][1] == "2" && tempoPonto > 0.5  && req.body.dados.respostasHistorico[req.body.dados.historicomateria][0][0] == "A" && req.body.dados.respostasHistorico[req.body.dados.historicomateria][1][0] == "A"){
                retornoPergunta = "5"
                console.log("top entrou na 3 questao (passou para a proxima)")
            }
            if(req.body.dados.historicoPosicao[req.body.dados.historicomateria][1] == "1" && req.body.dados.respostasHistorico[req.body.dados.historicomateria][0][0] == "E"  && req.body.dados.respostasHistorico[req.body.dados.historicomateria][1][0] == "E"){
                retornoPergunta = "4"
                console.log("entrou na 3 questao (errou muitas vezes, abaixamos o nivel)")
            }
        }
        if(req.body.dados.historicoPosicao[req.body.dados.historicomateria].length > 2 && req.body.dados.historicoPosicao[req.body.dados.historicomateria].length <= 3){
            console.log("entrou somar (questao-duvida)")
            retornoMateria = req.body.dados.historicomateria
            retornoPergunta = Number(req.body.dados.historicoPosicao[req.body.dados.historicomateria][req.body.dados.historicoPosicao[req.body.dados.historicomateria].length-1])+1
        }
        if(req.body.dados.historicoPosicao[req.body.dados.historicomateria].length == 4){
            console.log("super contraprova")
            retornoMateria = req.body.dados.historicomateria
            retornoPergunta = "4"
        }
        if(req.body.dados.historicoPosicao[req.body.dados.historicomateria] != undefined){
            req.body.dados.historicoPosicao[req.body.dados.historicomateria].push(retornoPergunta)
        }else{
            req.body.dados.historicoPosicao[req.body.dados.historicomateria] = [retornoPergunta]
        }
    }
    return res.json({
        Validar: 'N',
        materiaLocal: retornoMateria,
        conteudoLocal: retornoPergunta,
        historico: req.body.dados.respostasHistorico,
        dificuldade: dificuldadeUser,
        historicoPosicao: req.body.dados.historicoPosicao,
    });
});
module.exports = router;