// =============================================
// 🤖 NLP PRINCIPAL — PECUÁRIA PRO (CORRIGIDO)
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

import { getUser } from "../database/database.js";
import { logInfo, logError } from "../utils/logger.js";
import { registrarMensagem } from "../utils/metrics.js";

// =============================================
// 🔧 FUNÇÃO PRINCIPAL DO NLP
// =============================================
export async function processarMensagem(phone, msg) {

    registrarMensagem(phone, msg);
    logInfo("📩 NLP processando mensagem", { phone, msg });

    const texto = msg.toLowerCase().trim();

    try {

        // =============================================
        // MENU / AJUDA
        // =============================================
        if (/(menu|ajuda|help)/.test(texto)) {
            return mostrarMenu();
        }

        const saudacoes = ["oi", "ola", "olá", "opa", "eae", "bom dia", "boa tarde", "boa noite"];
        if (saudacoes.includes(texto)) {
            return mostrarMenu();
        }

        // =============================================
        // MENUS NUMÉRICOS
        // =============================================
        if (/^\d$/.test(texto)) {
            const r = processarOpcaoMenu(texto);

            if (r?.submenu === "animais") return mostrarMenuAnimais();
            if (r?.submenu === "lotes") return mostrarMenuLotes();
            if (r?.submenu === "calculos") return mostrarMenuCalculos();
            if (r?.submenu === "diagnostico") return mostrarMenuDiagnostico();
            if (r?.submenu === "gpt") return mostrarMenuGPT();

            return r;
        }

        if (/^\d+\.\d+$/.test(texto)) {
            const r = processarOpcaoMenu(texto);
            if (r?.acao === "listar_animais") return await listarAnimais(phone);
            if (r?.acao === "listar_lotes") return await listarLotes(phone);
            return r;
        }

        // =============================================
        // CRUD ANIMAIS
        // =============================================
        if (texto.startsWith("registrar animal")) return await registrarAnimal(phone, msg);
        if (texto.startsWith("editar animal")) return await editarAnimal(phone, msg);
        if (texto.startsWith("remover animal")) return await removerAnimal(phone, msg);
        if (texto === "listar animais") return await listarAnimais(phone);

        // =============================================
        // LOTES
        // =============================================
        if (texto.startsWith("criar lote")) {
            const nome = texto.replace("criar lote", "").trim();
            return await criarLote(phone, nome);
        }

        if (texto === "listar lotes") return await listarLotes(phone);

        if (texto.startsWith("adicionar ao lote")) {
            const p = texto.split(" ");
            return await adicionarAoLote(phone, p[3], p[4]);
        }

        if (texto.startsWith("remover do lote")) {
            const p = texto.split(" ");
            return await removerDoLote(phone, p[3], p[4]);
        }

        if (texto.startsWith("remover lote")) {
            const nome = texto.replace("remover lote", "").trim();
            return await deletarLote(phone, nome);
        }

        // =============================================
        // 🚑 DIAGNÓSTICO — PRIORIDADE MÁXIMA
        // =============================================
        const gatilhos = [
            "febre", "doente", "diarreia", "tosse", "tossindo",
            "ferida", "manco", "mancando", "abatido", "triste",
            "sem comer", "perdeu o apetite", "não come",
            "magro", "peso caindo", "inchado",
            "chiado", "respiração", "fraqueza"
        ];

        if (gatilhos.some(g => texto.includes(g))) {
            return await diagnosticoAnimal(phone, msg);
        }

        // =============================================
        // DIETAS
        // =============================================
        if (texto.includes("dieta") && texto.includes("leite")) {
            return await dietaLeiteiraController(phone, msg);
        }

        const br = await dietaBezerroRecriaController(phone, msg);
        if (br) return br;

        if (texto.includes("dieta")) {
            return await dietaProfissionalController(phone, msg);
        }

        // =============================================
        // CÁLCULOS
        // =============================================
        if (texto.startsWith("ua")) return await calcularUA(phone, msg);
        if (texto.includes("lotacao")) return await calcularLotacao(phone, msg);
        if (texto.includes("arroba")) return await custoPorArroba(phone, msg);

        // =============================================
        // GPT — FALLBACK FINAL
        // =============================================
        return await respostaGPT(phone, msg);

    } catch (err) {
        logError(err, { phone, msg, local: "NLP" });
        return "⚠️ Ocorreu um erro ao processar sua mensagem.";
    }
}
