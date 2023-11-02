const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { Op } = require("sequelize");
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const { ErrosVerificar } = require('../gerecial/erros');
const cors = require('cors');

const { RateLimiterMemory } = require('rate-limiter-flexible');
const UserInfo = require('../models/UserInfo');
const Questoes_Informacoes = require('../models/QuestoesInfo');
const Plano_estudos = require('../models/PlanodeEstudos');
const Conteudo = require('../models/Conteudo');

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
    const dificuldadeQuestao =  100-((questaoAvaliada.respostas_correta/somaTotalFeita)*100)
    const [respostaUser, conteudoAvaliado] = req.body.resposta.split("|")
    novaAlternativa[respostaUser] = Number(novaAlternativa[respostaUser])+1
    console.log(req.body.config.nivelConteudo[req.body.dados.historicomateria])
    console.log(req.body.config.nivelConteudo[req.body.dados.historicomateria][req.body.dados.historicoPosicao[req.body.dados.historicomateria][req.body.dados.historicoPosicao[req.body.dados.historicomateria].length-1]][0])
    
    if(respostaUser == questaoAvaliada.alternativa_correta){
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
    if(req.body.dados.historicomateria == 2 && (req.body.dados.historicoPosicao[req.body.dados.historicomateria][req.body.dados.historicoPosicao[req.body.dados.historicomateria].length-1] == "4" || req.body.dados.historicoPosicao[req.body.dados.historicomateria][req.body.dados.historicoPosicao[req.body.dados.historicomateria].length-1] == "5")){
        console.log("Acabou Calculando Dados")
        var organizaRespostas = {}
        var newNivel = [0,0,0,0,0,0,0,0,0,0,0,0]
        var atualizanivel
        var DificuldadesEncointradas = []
        req.body.config.nivelMaterias = req.body.config.nivelMaterias.split(",")
        req.body.dados.respostasHistorico.map(orgNivel => {
            for(var orgMateria = 0; orgMateria < orgNivel.length; orgMateria++){
                const separarInfor = orgNivel[orgMateria].split("|")
                if(!organizaRespostas.hasOwnProperty(separarInfor[1])){
                    organizaRespostas[separarInfor[1]] = []
                }
                organizaRespostas[separarInfor[1]].push(orgNivel[orgMateria])
                if(separarInfor[0] == "E"){
                    console.log('o dificuldades encontradas'+separarInfor)
                    console.log(separarInfor[2])
                    DificuldadesEncointradas.push(separarInfor[2])
                }
                if(separarInfor[3] != "undefined"){
                    atualizanivel = separarInfor[3]-req.body.config.nivelMaterias[separarInfor[1]]
                    if(separarInfor[0] == "A"){
                        if(atualizanivel == 0){
                            newNivel[separarInfor[1]] = newNivel[separarInfor[1]]+1
                        }else{
                            if(atualizanivel < 0){
                                newNivel[separarInfor[1]] = newNivel[separarInfor[1]]+0.2
                            }else{
                                newNivel[separarInfor[1]] = newNivel[separarInfor[1]]+(atualizanivel+0.5)
                            }
                        }
                    }else{
                        if(atualizanivel == 0){ 
                            newNivel[separarInfor[1]] = newNivel[separarInfor[1]]-1
                        }else{
                            if(atualizanivel > 0){
                                newNivel[separarInfor[1]] = newNivel[separarInfor[1]]-0.2
                            }else{
                                newNivel[separarInfor[1]] = newNivel[separarInfor[1]]+(atualizanivel-0.5) // arrumar
                            }
                        }
                    }
                }
            }
        })
        var materiaAvaliada = []
        for(var materia in organizaRespostas){
            materiaAvaliada.push(materia)
            if(Number(newNivel[materia]) != 0){
                if(newNivel[materia] < 0){
                    if(Number(newNivel[materia]) < -2){
                        if(req.body.config.nivelMaterias[materia] >= 1){
                            req.body.config.nivelMaterias[materia] = Number(req.body.config.nivelMaterias[materia])-1
                        }
                    }else{
                        if(req.body.config.nivelMaterias[materia] > 0){
                            req.body.config.nivelMaterias[materia] = Number(req.body.config.nivelMaterias[materia])-0.5
                        }
                    }
                }else{
                    if(Number(newNivel[materia]) > 2){
                        if(req.body.config.nivelMaterias[materia] <=3){
                            req.body.config.nivelMaterias[materia] = Number(req.body.config.nivelMaterias[materia])+1
                        }
                    }else{
                        if(req.body.config.nivelMaterias[materia] <=3.5){
                            req.body.config.nivelMaterias[materia] = Number(req.body.config.nivelMaterias[materia])+0.5
                        }
                    }
                }
            }
        }
        const valorNivel = dificuldadeUser.sort((a, b) => {
            const aLevel = parseFloat(a.split('=')[1]);
            const bLevel = parseFloat(b.split('=')[1]);
            return aLevel - bLevel;
        })
        console.log(DificuldadesEncointradas)
        DificuldadesEncointradas = DificuldadesEncointradas.toString().split(",")
        console.log(DificuldadesEncointradas)
        for(addDificuldade = 0; addDificuldade < 10; addDificuldade++){
            console.log(valorNivel[addDificuldade])
            DificuldadesEncointradas.push(valorNivel[addDificuldade]?.split("=")[0])
        }
        console.log('retirar o zero'+DificuldadesEncointradas)
        const dificuldadesValor = await Conteudo.findAll({
            where: {
                codigo_conteudo:{
                    [Op.or]: DificuldadesEncointradas.map(valor => ({
                        [Op.like]: valor
                    }))
                }
            },
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        })
        var repeticaoConteudo = {}
        DificuldadesEncointradas.map(conteudoBuscar => {
            console.log(conteudoBuscar)
            if(conteudoBuscar != "" && conteudoBuscar != undefined){
                let econtrarConteudo = dificuldadesValor.find(conteudo => conteudo.codigo_conteudo == conteudoBuscar)
                let separarGrupo = econtrarConteudo.grupo?.split(",")
                console.log(separarGrupo)
                for(var contarSeparar = 0; contarSeparar < separarGrupo.length ; contarSeparar++){
                   if(!repeticaoConteudo.hasOwnProperty(separarGrupo[contarSeparar])){
                       repeticaoConteudo[separarGrupo[contarSeparar]] = 0
                   }
                   repeticaoConteudo[separarGrupo[contarSeparar]] = Number(repeticaoConteudo[separarGrupo[contarSeparar]])+1
               }
            }
        })
        repeticaoConteudo = Object.entries(repeticaoConteudo).sort((a, b) => b[1] - a[1]).map(entry => entry[0]);
        var salvarNovoPlano = repeticaoConteudo.splice(0,6)
        const buscarPlano = await Plano_estudos.findAll({
            where: {
                codigo_plano:{
                    [Op.or]: salvarNovoPlano.map(valor => ({
                        [Op.like]: valor
                    }))
                }
            },
            attributes: { exclude: ['createdAt', 'updatedAt'] }
        })
        var PlanoDeEstudos = []
        var salvarSaber = []
        if(req.body.config.historicoPlano == undefined){
            req.body.config.historicoPlano = []
        }
        buscarPlano.map(saber => {
            console.log(req.body.config.historicoPlano)
            console.log(saber.codigo_plano)
            console.log(req.body.config.historicoPlano.indexOf(saber.codigo_plano.toString()))
            if(req.body.config.historicoPlano.indexOf(saber.codigo_plano.toString()) == -1){
                var separarConteudoPlano = saber.conteudo.split(',')
                var separaSaberesPlano = saber.conteudo_previo.split(',')
                console.log('---')
                console.log(saber.codigo_plano)
                console.log(separarConteudoPlano)
                console.log(separaSaberesPlano)
                var salvarPlano = []
    
                for(var contadorSeparadorConteudo = 0; contadorSeparadorConteudo < valorNivel.length; contadorSeparadorConteudo++){
                    if(separarConteudoPlano.length != 0 || separaSaberesPlano.length !=0){
                        const elemento = valorNivel[contadorSeparadorConteudo]
                        const separarElemento = elemento.split('=')
                        //console.log(separarElemento)
                        if(separarConteudoPlano.indexOf(separarElemento[0]) !== -1){
                            console.log(separarElemento)
                            separarConteudoPlano.splice(separarConteudoPlano.indexOf(separarElemento[0]),1)
                            if(Number(separarElemento[1]) > 5){
                                salvarPlano.push(`${separarElemento[0]}&`)
                                console.log('r'+salvarPlano)
                            }
                        }else{
                            if(separaSaberesPlano.indexOf(separarElemento[0]) !== -1){
                                console.log(separarElemento)
                                separaSaberesPlano.splice(separaSaberesPlano.indexOf(separarElemento[0]),1)
                                if(Number(separarElemento[1]) < 5){
                                    salvarSaber.push(separarElemento[0])
                                    console.log('sa'+salvarSaber)
                                }
                            }
                        }
                    }else{
                        break
                    }
                }
                console.log(salvarPlano)
                PlanoDeEstudos.push(`${saber.codigo_plano}|${salvarPlano.join('')}`)
            }else{
                PlanoDeEstudos.push(`R${saber.codigo_plano}|`)
            }
        })
        while(salvarSaber.length != 0){
            console.log("tem saber"+salvarSaber)
            const SaberConteudoValor = await Conteudo.findAll({
                where: {
                    codigo_conteudo:{
                        [Op.or]: salvarSaber.map(valor => ({
                            [Op.like]: valor
                        }))
                    }
                },
                attributes: { exclude: ['createdAt', 'updatedAt'] }
            })
            salvarSaber = []
            SaberConteudoValor.map(valorGrupoSaber => {
                salvarSaber.push(valorGrupoSaber.grupo)
            })
            salvarSaber = salvarSaber.toString().split(',')

            const buscarPlanoNovamente = await Plano_estudos.findAll({
                where: {
                    codigo_plano:{
                        [Op.or]: salvarSaber.map(valor => ({
                            [Op.like]: valor
                        }))
                    }
                },
                attributes: { exclude: ['createdAt', 'updatedAt'] }
            })
            salvarSaber = []
            buscarPlanoNovamente.map(saber => {
                console.log(req.body.config.historicoPlano)
                console.log(saber.codigo_plano)
                console.log(req.body.config.historicoPlano.indexOf(saber.codigo_plano.toString()))
                if(req.body.config.historicoPlano.indexOf(saber.codigo_plano.toString()) == -1){
                    console.log(salvarSaber)
                    var separarConteudoPlano = saber.conteudo.split(',')
                    console.log('---')
                    console.log(saber.codigo_plano)
                    console.log(separarConteudoPlano)
                    salvarPlano = []
                    
                    for(var contadorSeparadorConteudo = 0; contadorSeparadorConteudo < valorNivel.length; contadorSeparadorConteudo++){
                        if(separarConteudoPlano.length != 0){
                            const elemento = valorNivel[contadorSeparadorConteudo]
                            const separarElemento = elemento.split('=')
                            //console.log(separarElemento)
                            if(separarConteudoPlano.indexOf(separarElemento[0]) !== -1){
                                console.log(separarElemento)
                                separarConteudoPlano.splice(separarConteudoPlano.indexOf(separarElemento[0]),1)
                                if(Number(separarElemento[1]) > 5){
                                    salvarPlano.push(`${separarElemento[0]}&`) // revisar esta conteudo o resto vc aprende
                                    console.log('r'+salvarPlano)
                                }
                            }
                        }else{
                            break
                        }
                    }
                    console.log(salvarPlano)
                    if(PlanoDeEstudos.indexOf(`${saber.codigo_plano}|${salvarPlano.join('')}`) == -1){
                        PlanoDeEstudos.unshift(`${saber.codigo_plano}|${salvarPlano.join('')}`)
                    }
                }else{
                    PlanoDeEstudos.unshift(`R${saber.codigo_plano}|`) //tarefas, pois ja foi realiza esse conteudo
                }
            })
        }
        var numerosSorteados = [];
        for(var cont = 0; cont <5 ;cont++){
            if(req.body.config.historicoPlano.length > 1){
                const numeroAleatorio = req.body.config.historicoPlano.splice(Math.floor(Math.random() * req.body.config.historicoPlano.length),1) ;
                console.log(numeroAleatorio)
                PlanoDeEstudos.push('E'+numeroAleatorio.toString()+'|')
            }else{
                break
            }
        }
        console.log('verificar')
        console.log(PlanoDeEstudos)
        const semLetras = PlanoDeEstudos.filter(item => !/[a-zA-Z]/.test(item));
        const comR = PlanoDeEstudos.filter(item => item.startsWith('R'));
        const comE = PlanoDeEstudos.filter(item => item.startsWith('E'));
        semLetras.sort((a, b) => {
            const numA = parseInt(a.split('|')[0]);
            const numB = parseInt(b.split('|')[0]);
            return numA - numB;
        });
        const sortedComE = comE.sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)[0]);
            const numB = parseInt(b.match(/\d+/)[0]);
            return numA - numB;
        });
        const sortedComR = comR.sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)[0]);
            const numB = parseInt(b.match(/\d+/)[0]);
            return numA - numB;
        });
        var resultado = []
        while(semLetras.length > 0){
            const valorRetiradoPrimerioPlano = semLetras.shift()
            resultado.push(valorRetiradoPrimerioPlano)
            if(sortedComR.length > 0){
                if(sortedComR[0].slice(1) < valorRetiradoPrimerioPlano){
                    resultado.push(sortedComR.shift())
                }
            }
            const valorRetiradoSegundoPlano = semLetras.shift()
            resultado.push(valorRetiradoSegundoPlano)
            if(sortedComE.length > 0){
                if(sortedComE[0].slice(1) < valorRetiradoSegundoPlano){
                    resultado.push(sortedComE.shift())
                }
            }
        }
        UserInfo.update(
            { 
                nivel: req.body.config.nivelMaterias.toString(), 
                plano: resultado.toString()+sortedComR.toString()+sortedComE.toString()+',A'
            },
            { where: { id_user: sanitizedData.id} }//id uswr
        )
        return res.json({
            Validar: 'S',
            DificuldadesEncointradas: dificuldadesValor.splice(0,dificuldadesValor.length-10),
            nivelAntigo: nivelAntigo.split(','),
            nivelNovo: req.body.config.nivelMaterias,
            materiaAvaliada: Object.keys(organizaRespostas),
        });
    }
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