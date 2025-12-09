// =============================================
// 🤖 NLP PRINCIPAL — PECUÁRIA PRO
// Controla menus, comandos diretos, cálculos,
// dieta profissional, diagnóstico e GPT.
// =============================================

import {
    mostrarMenu,
    processarOpcaoMenu,
    mostrarMenuAnimais,
    mostrarMenuLotes,
    mostrarMenuCalculos,
    mostrarMenuDiagnostico,
    mostrarMenuGPT
} from "../controllers/menuController.js";

import {
    registrarAnimal,
    listarAnimais,
    editarAnimal,
    removerAnimal
} from "../controllers/animalController.js";

import {
    criarLote,
    listarLotes,
    adicionarAoLote,
    removerDoLote,
    deletarLote
} from "../controllers/loteController.js";

import { calcularDieta, calcularUA, calcularLotacao, custoPorArroba } from "./cattle.js";
import { diagnosticoAnimal } from "../controllers/diagnosticoController.js";
import { respostaGPT } from "./gpt.js";

import { sendMessage } from "../services/whatsapp.js";
import { logInfo, logError } from "../utils/logger.js";

import { getUser, updateUser } from "../database/database.js";

// 👉 IMPORTAÇÃO CORRETA DO EXTRACT!
import { extrairNumero } from "../utils/extract.js";

// Controller da dieta profissional
import { dietaProfissionalController } from "../controllers/dietaController.js";


// -------------------------------------------
// FUNÇÃO AUXILIAR — Saudação por horário
// -------------------------------------------
function saudacaoPorHorario() {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12) return "Bom dia";
    if (hora >= 12 && hora < 18) return "Boa tarde";
    return "Boa noite";
}



// =============================================
// 🚀 FUNÇÃO PRINCIPAL DO NLP
// =============================================
export async function processarMensagem(phone, msg) {

    logInfo("📩 Mensagem recebida", { phone, msg });

    const texto = msg.toLowerCase().trim();



    try {
        // -------------------------------------------------------------------
        // 0 — MENU PRINCIPAL A QUALQUER MOMENTO
        // -------------------------------------------------------------------
        if (/(menu|ajuda|help)/.test(texto)) {
            return mostrarMenu(phone);
        }



        // -------------------------------------------------------------------
        // 1 — SAUDAÇÃO COM CONTINUAÇÃO DE AÇÃO
        // -------------------------------------------------------------------
        const saudacoesSimples = ["oi", "ola", "olá", "opa", "eae", "bom dia", "boa tarde", "boa noite"];

        if (saudacoesSimples.includes(texto)) {

            const user = await getUser(phone);
            const ultimaAcao = user?.data?.ultima_acao || null;
            const nome = user?.name || "";
            const saudacao = saudacaoPorHorario();
            const saudacaoNome = nome ? `${saudacao}, ${nome}!` : `${saudacao}!`;

            if (ultimaAcao) {
                return sendMessage(
                    phone,
`${saudacaoNome}

Você deseja continuar de onde parou?
➡ Última ação pendente: *${ultimaAcao}*

Ou escolha uma opção:

1️⃣ Animais  
2️⃣ Lotes  
3️⃣ Cálculos  
4️⃣ Diagnóstico  
5️⃣ Falar com o GPT 🤖`
                );
            }

            return sendMessage(
                phone,
`${saudacaoNome} Como posso ajudar hoje?

1️⃣ Animais  
2️⃣ Lotes  
3️⃣ Cálculos  
4️⃣ Diagnóstico  
5️⃣ Falar com o GPT 🤖

Digite o número da opção desejada.`
            );
        }



        // -------------------------------------------------------------------
        // 2 — NAVEGAÇÃO PELO MENU PRINCIPAL
        // -------------------------------------------------------------------
        if (/^\d$/.test(texto)) {
            const resposta = await processarOpcaoMenu(phone, texto);

            if (resposta?.submenu === "animais") return mostrarMenuAnimais(phone);
            if (resposta?.submenu === "lotes") return mostrarMenuLotes(phone);
            if (resposta?.submenu === "calculos") return mostrarMenuCalculos(phone);
            if (resposta?.submenu === "diagnostico") return mostrarMenuDiagnostico(phone);
            if (resposta?.submenu === "gpt") return mostrarMenuGPT(phone);

            return resposta;
        }



        // -------------------------------------------------------------------
        // 3 — SUBMENUS (1.1, 2.3, 3.4 etc)
        // -------------------------------------------------------------------
        if (/^\d+\.\d+$/.test(texto)) {
            const resposta = await processarOpcaoMenu(phone, texto);

            if (resposta?.acao === "listar_animais") return listarAnimais(phone);
            if (resposta?.acao === "listar_lotes") return listarLotes(phone);

            return resposta;
        }



        // -------------------------------------------------------------------
        // 4 — COMANDOS DIRETOS (texto livre)
        // -------------------------------------------------------------------

        if (texto.startsWith("registrar animal")) return registrarAnimal(phone, msg);
        if (texto.startsWith("editar animal")) return editarAnimal(phone, msg);
        if (texto.startsWith("remover animal")) return removerAnimal(phone, msg);
        if (texto === "listar animais") return listarAnimais(phone);

        if (texto.startsWith("criar lote")) {
            const nome = texto.replace("criar lote", "").trim();
            return criarLote(phone, nome);
        }

        if (texto === "listar lotes") return listarLotes(phone);

        if (texto.startsWith("adicionar ao lote")) {
            const partes = texto.split(" ");
            return adicionarAoLote(phone, partes[3], partes[4]);
        }

        if (texto.startsWith("remover do lote")) {
            const partes = texto.split(" ");
            return removerDoLote(phone, partes[3], partes[4]);
        }

        if (texto.startsWith("remover lote")) {
            const nome = texto.replace("remover lote", "").trim();
            return deletarLote(phone, nome);
        }



        // -------------------------------------------------------------------
        // 5 — MODOS DE CÁLCULO
        // -------------------------------------------------------------------
        if (texto.includes("dieta")) return calcularDieta(phone, msg);
        if (texto.includes("ua ") || texto === "ua") return calcularUA(phone, msg);
        if (texto.includes("lotacao")) return calcularLotacao(phone, msg);
        if (texto.includes("arroba")) return custoPorArroba(phone, msg);



        // -------------------------------------------------------------------
        // 5.1 — DIETA PROFISSIONAL (NLP AUTOMÁTICO AVANÇADO)
        // -------------------------------------------------------------------
        const pesoDetectado = extrairNumero(msg);

        if (texto.includes("dieta") && pesoDetectado && pesoDetectado > 80 && pesoDetectado < 2000) {
            logInfo("🍽 Dieta profissional detectada via NLP", { phone, pesoDetectado });
            return dietaProfissionalController(phone, msg);
        }



        // -------------------------------------------------------------------
        // 5.2 — DIAGNÓSTICO AUTOMÁTICO (Mensagem longa)
        // -------------------------------------------------------------------
        const comandosReconhecidos = [
            "registrar animal", "editar animal", "remover animal",
            "listar animais", "criar lote", "listar lotes",
            "adicionar ao lote", "remover do lote", "remover lote",
            "dieta", "ua", "arroba", "lotacao"
        ];

        const ehComando = comandosReconhecidos.some(cmd => texto.startsWith(cmd));

        if (!ehComando && msg.length > 25 && !texto.includes("gpt")) {
            logInfo("🩺 Diagnóstico automático ativado", { phone });
            return diagnosticoAnimal(phone, msg);
        }



        // -------------------------------------------------------------------
        // 6 — GPT (Fallback final)
        // -------------------------------------------------------------------
        return respostaGPT(phone, msg);



    } catch (error) {

        logError(error, { phone, msg, local: "processarMensagem" });

        return sendMessage(phone,
            "⚠️ Ops, ocorreu um erro ao processar sua mensagem. Tente novamente."
        );
    }
}
