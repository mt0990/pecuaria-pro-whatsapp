// =============================================
// 🤖 NLP PRINCIPAL — PECUÁRIA PRO (STATEFUL)
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

import { calcularUA, calcularLotacao, custoPorArroba } from "./cattle.js";

import { diagnosticoAnimal } from "../controllers/diagnosticoController.js";
import { respostaGPT } from "./gpt.js";

import { dietaProfissionalController } from "../controllers/dietaController.js";
import { dietaLeiteiraController } from "../controllers/dietaLeiteController.js";
import { dietaBezerroRecriaController } from "../controllers/dietaBezerroRecriaController.js";

import { logInfo, logError } from "../utils/logger.js";
import { registrarMensagem } from "../utils/metrics.js";
import { getUser } from "../database/database.js";

// =============================================
// 🔧 FUNÇÃO PRINCIPAL
// =============================================
export async function processarMensagem(phone, msg) {
    registrarMensagem(phone, msg);
    logInfo("📩 NLP processando mensagem", { phone, msg });

    const texto = msg.toLowerCase().trim();

    try {
        // =============================================
        // 🔒 BLOQUEIO GLOBAL — DIAGNÓSTICO ATIVO
        // =============================================
        const user = await getUser(phone);

        if (user?.data?.diagnostico?.ativo) {
            return {
                type: "reply",
                text: await diagnosticoAnimal(phone, msg)
            };
        }

        // =============================================
        // MENU / AJUDA / SAUDAÇÕES
        // =============================================
        if (/(menu|ajuda|help)/.test(texto)) {
            return { type: "reply", text: mostrarMenu() };
        }

        const saudacoes = ["oi", "ola", "olá", "opa", "eae", "bom dia", "boa tarde", "boa noite"];
        if (saudacoes.includes(texto)) {
            return { type: "reply", text: mostrarMenu() };
        }

        // =============================================
        // MENUS NUMÉRICOS
        // =============================================
        if (/^\d$/.test(texto)) {
            const r = processarOpcaoMenu(texto);

            if (r?.submenu === "animais") return { type: "reply", text: mostrarMenuAnimais() };
            if (r?.submenu === "lotes") return { type: "reply", text: mostrarMenuLotes() };
            if (r?.submenu === "calculos") return { type: "reply", text: mostrarMenuCalculos() };
            if (r?.submenu === "diagnostico") return { type: "reply", text: mostrarMenuDiagnostico() };
            if (r?.submenu === "gpt") return { type: "reply", text: mostrarMenuGPT() };

            if (typeof r === "string") {
                return { type: "reply", text: r };
            }
        }

        if (/^\d+\.\d+$/.test(texto)) {
            const r = processarOpcaoMenu(texto);
            if (r?.acao === "listar_animais") {
                return { type: "reply", text: await listarAnimais(phone) };
            }
            if (r?.acao === "listar_lotes") {
                return { type: "reply", text: await listarLotes(phone) };
            }
        }

        // =============================================
        // CRUD ANIMAIS
        // =============================================
        if (texto.startsWith("registrar animal")) {
            return { type: "reply", text: await registrarAnimal(phone, msg) };
        }

        if (texto.startsWith("editar animal")) {
            return { type: "reply", text: await editarAnimal(phone, msg) };
        }

        if (texto.startsWith("remover animal")) {
            return { type: "reply", text: await removerAnimal(phone, msg) };
        }

        if (texto === "listar animais") {
            return { type: "reply", text: await listarAnimais(phone) };
        }

        // =============================================
        // LOTES
        // =============================================
        if (texto.startsWith("criar lote")) {
            const nome = texto.replace("criar lote", "").trim();
            return { type: "reply", text: await criarLote(phone, nome) };
        }

        if (texto === "listar lotes") {
            return { type: "reply", text: await listarLotes(phone) };
        }

        if (texto.startsWith("adicionar ao lote")) {
            const p = texto.split(" ");
            return { type: "reply", text: await adicionarAoLote(phone, p[3], p[4]) };
        }

        if (texto.startsWith("remover do lote")) {
            const p = texto.split(" ");
            return { type: "reply", text: await removerDoLote(phone, p[3], p[4]) };
        }

        if (texto.startsWith("remover lote")) {
            const nome = texto.replace("remover lote", "").trim();
            return { type: "reply", text: await deletarLote(phone, nome) };
        }

        // =============================================
        // 🚑 GATILHOS DE DIAGNÓSTICO (INÍCIO)
        // =============================================
        const gatilhosDiagnostico = [
            "febre", "doente", "diarreia", "tosse", "tossindo",
            "ferida", "manco", "mancando", "abatido", "triste",
            "sem comer", "perdeu o apetite", "não come",
            "magro", "peso caindo", "inchado",
            "chiado", "respiração", "fraqueza"
        ];

        if (gatilhosDiagnostico.some(g => texto.includes(g))) {
            return {
                type: "reply",
                text: await diagnosticoAnimal(phone, msg)
            };
        }

        const intencaoProblema = [
            "problema",
            "algo errado",
            "não está bem",
            "estranho",
            "passando mal"
        ];

        if (intencaoProblema.some(p => texto.includes(p))) {
            return {
                type: "reply",
                text:
                    "🚑 Entendi.\n\n" +
                    "Para te ajudar corretamente, me diga *qual sintoma* o animal apresenta.\n\n" +
                    "Exemplos:\n" +
                    "- febre\n" +
                    "- diarreia\n" +
                    "- parou de comer\n" +
                    "- mancando\n" +
                    "- ferida\n"
            };
        }

        // =============================================
        // DIETAS
        // =============================================
        if (texto.includes("dieta") && texto.includes("leite")) {
            return { type: "reply", text: await dietaLeiteiraController(phone, msg) };
        }

        const br = await dietaBezerroRecriaController(phone, msg);
        if (br) {
            return { type: "reply", text: br };
        }

        if (texto.includes("dieta")) {
            return { type: "reply", text: await dietaProfissionalController(phone, msg) };
        }

        // =============================================
        // CÁLCULOS
        // =============================================
        if (texto.startsWith("ua")) {
            return { type: "reply", text: await calcularUA(phone, msg) };
        }

        if (texto.includes("lotacao")) {
            return { type: "reply", text: await calcularLotacao(phone, msg) };
        }

        if (texto.includes("arroba")) {
            return { type: "reply", text: await custoPorArroba(phone, msg) };
        }

        // =============================================
        // GPT — FALLBACK FINAL (LIVRE)
        // =============================================
        return {
            type: "reply",
            text: await respostaGPT(phone, msg)
        };

    } catch (err) {
        logError(err, { phone, msg, local: "NLP" });
        return {
            type: "reply",
            text: "⚠️ Ocorreu um erro ao processar sua mensagem."
        };
    }
}
