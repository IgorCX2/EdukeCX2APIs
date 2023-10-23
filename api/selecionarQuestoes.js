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

const maxAttempts = 50;
const windowMs = 500000; //3 minutos
const limiterSelecionarQuestoes = new RateLimiterMemory({
  points: maxAttempts,
  duration: windowMs,
});

function OrganizarArray(arr, size) {
    let organizar = [];
    let count = 0
    for (let i = 0; i < arr.length; i += size) {
        let organiza = arr.slice(i, i + size);
        organizar.push(organiza);
        organizar[count].push(organizar[count].shift())
        organizar[count].push(organizar[count].shift())
        count++
    }
    return organizar;
}
function SortearMaterias(qtd, nivel){
    var materiaComPesos = []
    var materiaAvaliar = []
    for(var cntPesoMaterias = 0; cntPesoMaterias < 11; cntPesoMaterias++){
        let contadorNivel
        if(nivel[cntPesoMaterias] == 4){
            contadorNivel = 1
        }else{
            contadorNivel = 4 - Number(nivel[cntPesoMaterias])
        }
        for(var mcp = 0; mcp < contadorNivel; mcp++){
            materiaComPesos.push(cntPesoMaterias)
        }
    }
    for(var srtMaterias = 0; srtMaterias < qtd; srtMaterias++){
        const materiaSorteada = materiaComPesos[Math.floor(Math.random() * materiaComPesos.length)]
        materiaAvaliar.push(materiaSorteada)
        materiaComPesos.splice(materiaComPesos.indexOf(materiaSorteada),`${nivel[materiaSorteada] == 4 ? 1 : 4 - nivel[materiaSorteada]}`) 
    }
    return materiaAvaliar
}
router.post('/diagnostico', [body('id').trim().isNumeric().withMessage('Id errado')], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ msg: errors.errors[0].msg });
    }
    const sanitizedData = DOMPurify.sanitize(req.body.id)
    try{
        const rateLimiterRes = await limiterSelecionarQuestoes.consume(sanitizedData);
        var guardarPlano = []
        var conteudoAvaliar = []
        var conteudoProva = []
        var nivelConteudo = []
        function SelecionarMateria(origem, especificar){
            MexerMeuPlano = origem.splice(origem.indexOf(especificar[Math.floor(Math.random() * especificar.length)]),1)
            if(MexerMeuPlano.length != 0){
                conteudoAvaliar.push(MexerMeuPlano[0]?.conteudo.split(',')[Math.floor(Math.random() * MexerMeuPlano[0].conteudo?.split(',').length)])
                nivelConteudo.push(MexerMeuPlano[0].nivel)
            }else{
                conteudoAvaliar.push(Math.floor(Math.random() * 341))
                nivelConteudo.push(0)
            }
        }
        try{
            const userInfosInicial = await UserInfo.findOne({
                where: {
                    id_user: req.body.id
                },
                attributes: ['nivel','dificuldade', 'historicoplano', 'plano']
            })
            if(!userInfosInicial.nivel || userInfosInicial.plano){
                return res.status(409).json({
                    status: `1_SQ#0003`,
                    plano: `Erro: você não tem nivel ou tem plano ativo`,
                });
            }
            const nivelMateriasUser = userInfosInicial.nivel.split(',').map(nivel =>{
                return nivel[0]
            })
            const materiaAvaliar = SortearMaterias(3,nivelMateriasUser)
            console.log('Materias Avaliadas: '+ materiaAvaliar)
            try{
                const PlanoEstudosMaterias = await Plano_estudos.findAll({
                    where:{
                        materia: materiaAvaliar
                    },
                    attributes:['codigo_plano', 'conteudo', 'nivel', 'conteudo_previo', 'materia']
                })
                try{
                    for(mc = 0; mc < 3; mc++){ //descobir conteudo -> ordem do nivel: maior, menor, e o mesmo nivel*3
                        let planoNivelInferior = PlanoEstudosMaterias.filter(plano => plano.nivel == Number(nivelMateriasUser[materiaAvaliar[mc]])-1 && plano.materia == materiaAvaliar[mc])
                        let planoNivelSuperior = PlanoEstudosMaterias.filter(plano => plano.nivel == Number(nivelMateriasUser[materiaAvaliar[mc]])+1 && plano.materia == materiaAvaliar[mc])
                        const filtroMateriaAvaliar = PlanoEstudosMaterias.filter(plano => plano.materia == materiaAvaliar[mc])
                        if(planoNivelInferior.length == 0){
                            SelecionarMateria(PlanoEstudosMaterias,filtroMateriaAvaliar)
                        }else{
                            SelecionarMateria(PlanoEstudosMaterias,planoNivelInferior)
                        }
                        if(planoNivelSuperior.length == 0){
                            SelecionarMateria(PlanoEstudosMaterias,filtroMateriaAvaliar)
                        }else{
                            SelecionarMateria(PlanoEstudosMaterias,planoNivelSuperior)
                        }
                        //^ adc nivel inferior e superior
                        let meuNivel = PlanoEstudosMaterias.filter(plano => plano.nivel == Number(nivelMateriasUser[materiaAvaliar[mc]]))
                        var guardarPlano = []
                        if(guardarPlano[materiaAvaliar[mc]] == undefined){
                            guardarPlano[mc] = []
                        }
                        for(var c = 0; c < 2; c++){ //selecionar 2 do meu nivel
                            if(meuNivel.length != 0){
                                const planoSelecionado = meuNivel.splice(meuNivel.indexOf(meuNivel[Math.floor(Math.random() * meuNivel.length)]),1)
                                var conteudoPlanoSelecionado = planoSelecionado[0].conteudo?.split(',')
                                for(var adcmt = 0; adcmt < 2; adcmt++){
                                    const conteudoSeleciondo = conteudoPlanoSelecionado.splice(Math.floor(Math.random() * conteudoPlanoSelecionado.length),1)
                                    if(conteudoSeleciondo.length != 0){
                                        conteudoAvaliar.push(conteudoSeleciondo.toString())
                                        nivelConteudo.push(nivelMateriasUser[materiaAvaliar[mc]])
                                    }
                                }
                                conteudoPlanoSelecionado.map(conteudo => {
                                    if(conteudo.length != 0){
                                        guardarPlano[mc].push(`${conteudo}|${planoSelecionado[0].nivel}`)
                                    }
                                })
                            }else{
                                for(var adcalea = 0; adcalea < 2; adcalea++){
                                    SelecionarMateria(PlanoEstudosMaterias,filtroMateriaAvaliar)
                                }
                            }
                        }
                        while(conteudoAvaliar.length < 6 + (6*mc)){
                            if(guardarPlano[mc].length != 0){
                                const conteudoReservaSorteado = guardarPlano[mc].splice(Math.floor(Math.random() * guardarPlano[mc].length),1).toString().split('|')
                                conteudoAvaliar.push(conteudoReservaSorteado[0])
                                nivelConteudo.push(conteudoReservaSorteado[1])
                            }else{
                                SelecionarMateria(PlanoEstudosMaterias,filtroMateriaAvaliar)
                            }
                        }
                        OrganizarArray(conteudoAvaliar, 6)
                    }
                    try{
                        var questaoOrganizaPorConteudo = {}
                        const pesquisarQuestoes = await Questoes_Informacoes.findAll({
                            where: {
                                conteudo:{
                                    [Op.or]: conteudoAvaliar.map(valor => ({
                                        [Op.like]: `%,${valor}%`
                                    }))
                                }
                            },
                            attributes: { exclude: ['createdAt', 'updatedAt'] }
                        })
                        try{
                            pesquisarQuestoes.map(conteudoQuestao => {
                                const conteudoDaQuestao = conteudoQuestao.conteudo.split(',')
                                for(var pesquisarConteudoQuestoes = 0; pesquisarConteudoQuestoes < conteudoDaQuestao.length; pesquisarConteudoQuestoes++){
                                    if(conteudoAvaliar.indexOf(conteudoDaQuestao[pesquisarConteudoQuestoes]) != -1){
                                        if(questaoOrganizaPorConteudo[conteudoDaQuestao[pesquisarConteudoQuestoes]] != undefined){
                                            questaoOrganizaPorConteudo[conteudoDaQuestao[pesquisarConteudoQuestoes]].push(conteudoQuestao)
                                        }else{
                                            questaoOrganizaPorConteudo[conteudoDaQuestao[pesquisarConteudoQuestoes]] = [conteudoQuestao]
                                        }
                                        break;
                                    }
                                }
                            })
                            for(var percorrerConteudo = 0; percorrerConteudo<conteudoAvaliar.length; percorrerConteudo++){
                                if(questaoOrganizaPorConteudo[conteudoAvaliar[percorrerConteudo]] && questaoOrganizaPorConteudo[conteudoAvaliar[percorrerConteudo]] != undefined && questaoOrganizaPorConteudo[conteudoAvaliar[percorrerConteudo]]?.length != 0){
                                    conteudoProva.push(questaoOrganizaPorConteudo[conteudoAvaliar[percorrerConteudo]].splice(Math.floor(Math.random() * questaoOrganizaPorConteudo[conteudoAvaliar[percorrerConteudo]].length-1),1))
                                }else{
                                    console.log("não tem conteudo "+conteudoAvaliar[percorrerConteudo])
                                    const posicaoConteudo = Math.trunc(percorrerConteudo/6)
                                    const tamanhoAtual = conteudoProva.length
                                    for(var contadorNaoTem = 0+(posicaoConteudo*6); contadorNaoTem < percorrerConteudo; contadorNaoTem++){
                                        if(questaoOrganizaPorConteudo[conteudoAvaliar[contadorNaoTem]] != undefined && questaoOrganizaPorConteudo[conteudoAvaliar[contadorNaoTem]]?.length != 0){
                                            conteudoProva.push(questaoOrganizaPorConteudo[conteudoAvaliar[contadorNaoTem]].splice(Math.floor(Math.random() * questaoOrganizaPorConteudo[conteudoAvaliar[contadorNaoTem]].length-1),1))
                                            break 
                                        }
                                    }
                                    if(conteudoProva.length == tamanhoAtual){
                                        for(var contadorBuscarRepetidos = 0; contadorBuscarRepetidos < 24; contadorBuscarRepetidos++){
                                            if(questaoOrganizaPorConteudo[conteudoAvaliar[contadorBuscarRepetidos]]?.length >= 2){
                                                conteudoProva.push(questaoOrganizaPorConteudo[conteudoAvaliar[contadorBuscarRepetidos]].splice(Math.floor(Math.random() * questaoOrganizaPorConteudo[conteudoAvaliar[contadorBuscarRepetidos]].length-1),1))
                                                break
                                            }
                                        }
                                        if(conteudoProva.length == tamanhoAtual){
                                            conteudoProva.push("A")
                                        }
                                    }
                                }
                            }
                            return res.status(200).json({
                                nivelMaterias: userInfosInicial.nivel,
                                dificuldadeUser: userInfosInicial.dificuldade?.split(','),
                                historicoPlano: userInfosInicial.historicoplano,
                                materias: materiaAvaliar.splice(0,4),
                                conteudoAvaliar: OrganizarArray(conteudoAvaliar, 6),
                                nivelConteudo: OrganizarArray(nivelConteudo, 6),
                                questoesAvaliar: OrganizarArray(conteudoProva, 6),
                            });
                        }catch{
                            console.error(`ERRO 1_SQ#0007: ${error}`)
                            ErrosVerificar('NINGUEM', '1_SQ#0007', 'NADA')
                            return res.status(500).json({
                                status: `1_SQ#0007`,
                                msg: 'Não conseguimos fazer um cruzamento de dados das questões'
                            });
                        }
                    }catch(error){
                        console.error(`ERRO 1_SQ#0006: ${error}`)
                        ErrosVerificar('NINGUEM', '1_SQ#0006', 'NADA')
                        return res.status(500).json({
                            status: `1_SQ#0006`,
                            msg: 'O sistema enfrentou uma dificuldade ao tentar estabelecer uma conexão com o banco de dados das informações das questões!'
                        });
                    }
                    
                }catch(error){
                    console.error(`ERRO 1_SQ#0005: ${error}`)
                    ErrosVerificar('NINGUEM', '1_SQ#0005', 'NADA')
                    return res.status(500).json({
                        status: `1_SQ#0005`,
                        msg: 'Não conseguimos trazer os conteudos do seu nível'
                    });
                }
            }catch(error){
                console.error(`ERRO 1_SQ#0004: ${error}`)
                ErrosVerificar('NINGUEM', '1_SQ#0004', 'NADA')
                return res.status(500).json({
                    status: `1_SQ#0004`,
                    msg: 'O sistema enfrentou uma dificuldade ao tentar estabelecer uma conexão com o banco de dados dos planos de estudos!'
                });
            }
        }catch(error){
            console.error(`ERRO 1_SQ#0002: ${error}`)
            ErrosVerificar('NINGUEM', '1_SQ#0002', 'NADA')
            return res.status(500).json({
                status: `1_SQ#0002`,
                msg: 'O sistema enfrentou uma dificuldade ao tentar estabelecer uma conexão com o banco de dados!'
            });
        }

    }catch(error){
        return res.status(429).json({
          msg: 'Você tentou realizar esta ação muitas vezes. Aguarde alguns minutos e tente novamente.',
          status: '1_SQ#0001',
        });
    }
});
module.exports = router;