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

// -------------------------------------------
// FUNÇÃO AUXILIAR — Saudação por horário
// -------------------------------------------
function saudacaoPorHorario() {
    const hora = new Date().getHours();

    if (hora >= 5 && hora < 12) return "Bom dia";
    if (hora >= 12 && hora < 18) return "Boa tarde";
    return "Boa noite";
}
export async function processarMensagem(phone, msg) {

    logInfo("📩 Mensagem recebida", { phone, msg });

    const texto = msg.toLowerCase().trim();

    try {
        // -------------------------------------------------------------------
        // 0 — MENU PRINCIPAL A QUALQUER MOMENTO
        // -------------------------------------------------------------------
        if (/(menu|ajuda|help)/.test(texto)) {
            return await mostrarMenu(phone);
        }
        // -------------------------------------------------------------------
        // SAUDAÇÕES INTELIGENTES + NOME + ÚLTIMA AÇÃO
        // -------------------------------------------------------------------
            const saudacoesSimples = ["oi", "ola", "olá", "opa", "eae", "bom dia", "boa tarde", "boa noite"];
        if (saudacoesSimples.includes(texto)) {

            const user = await getUser(phone);

            const nome = user?.name || "";
            const ultimaAcao = user?.data?.ultima_acao || null;

            const saudacao = saudacaoPorHorario();
            const saudacaoNome = nome ? `${saudacao}, ${nome}!` : `${saudacao}!`;

        if (ultimaAcao) {
            return await sendMessage(phone, 
            `${saudacaoNome}

        Você deseja continuar de onde parou?
        ➡ Última ação pendente: *${ultimaAcao}*

        Ou escolha uma opção:

        1️⃣ Animais 
        2️⃣ Lotes  
        3️⃣ Cálculos  
        4️⃣ Diagnóstico   
        5️⃣ Falar com o GPT 🤖  
        `);
        }

            return await sendMessage(phone,
            `${saudacaoNome} Como posso ajudar hoje?

        Aqui está o menu:

         1️⃣ Animais  
         2️⃣ Lotes  
         3️⃣ Cálculos  
         4️⃣ Diagnóstico  
         5️⃣ Falar com o GPT 🤖  

         Digite o número da opção desejada.`);
        }

        // -------------------------------------------------------------------
        // 1 — MENU PRINCIPAL → OPÇÕES GRANDES (1–5)
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
        // 2 — SUBMENUS (1.1, 2.3, 3.4 etc.)
        // -------------------------------------------------------------------
        if (/^\d+\.\d+$/.test(texto)) {
            const resposta = await processarOpcaoMenu(phone, texto);

            if (resposta?.acao === "listar_animais") return listarAnimais(phone);
            if (resposta?.acao === "listar_lotes") return listarLotes(phone);

            return resposta;
        }

        // -------------------------------------------------------------------
        // 3 — COMANDOS DIRETOS
        // -------------------------------------------------------------------

        // 🔹 Registrar animal
        if (texto.startsWith("registrar animal")) {
            return registrarAnimal(phone, msg);
        }

        // EDITAR ANIMAL (MULTILINHAS)
        if (texto.startsWith("editar animal")) {
            return await editarAnimal(phone, msg);
        }

        // 🔹 Remover animal
        if (texto.startsWith("remover animal")) {
            return removerAnimal(phone, msg);
        }

        // 🔹 Listar animais
        if (texto === "listar animais") {
            return listarAnimais(phone);
        }

        // 🔹 Criar lote
        if (texto.startsWith("criar lote")) {
            const nome = texto.replace("criar lote", "").trim();
            return criarLote(phone, nome);
        }

        // 🔹 Listar lotes
        if (texto === "listar lotes") {
            return listarLotes(phone);
        }

        // 🔹 Adicionar animal ao lote
        if (texto.startsWith("adicionar ao lote")) {
            const partes = texto.split(" ");
            return adicionarAoLote(phone, partes[3], partes[4]);
        }

        // 🔹 Remover animal do lote
        if (texto.startsWith("remover do lote")) {
            const partes = texto.split(" ");
            return removerDoLote(phone, partes[3], partes[4]);
        }

        // 🔹 Deletar lote
        if (texto.startsWith("remover lote")) {
            const nome = texto.replace("remover lote", "").trim();
            return deletarLote(phone, nome);
        }


        // -------------------------------------------------------------------
        // 4 — CÁLCULOS E MÉTRICAS
        // -------------------------------------------------------------------
        if (texto.includes("dieta")) return calcularDieta(phone, msg);

        if (texto.includes("ua ") || texto === "ua") return calcularUA(phone, msg);

        if (texto.includes("lotacao")) return calcularLotacao(phone, msg);

        if (texto.includes("arroba")) return custoPorArroba(phone, msg);


        // -------------------------------------------------------------------
        // 5 — DIAGNÓSTICO AUTOMÁTICO
        // -------------------------------------------------------------------
        const comandosReconhecidos = [
            "registrar animal",
            "editar animal",
            "remover animal",
            "listar animais",
            "criar lote",
            "listar lotes",
            "adicionar ao lote",
            "remover do lote",
            "remover lote",
            "dieta",
            "ua",
            "arroba",
            "lotacao"
        ];

        const ehComando = comandosReconhecidos.some(cmd => texto.startsWith(cmd));

        if (!ehComando && msg.length > 25 && !texto.includes("gpt")) {
            logInfo("➡️ Diagnóstico automático ativado", { phone });
            return diagnosticoAnimal(phone, msg);
        }


        // -------------------------------------------------------------------
        // 6 — GPT (fallback final)
        // -------------------------------------------------------------------
        return respostaGPT(phone, msg);


    } catch (err) {

        logError(err, { phone, msg, local: "processarMensagem" });

        return sendMessage(
            phone,
            "⚠️ Ops, ocorreu um erro ao processar sua mensagem. Tente novamente."
        );
    }
}
