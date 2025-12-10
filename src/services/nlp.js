// =============================================
// 🤖 NLP PRINCIPAL — PECUÁRIA PRO (Versão Otimizada Final)
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

import { sendMessage } from "../services/whatsapp.js";
import { logInfo, logError } from "../utils/logger.js";

import { dietaProfissionalController } from "../controllers/dietaController.js";


// =================================================
// 🔧 Função principal do NLP
// =================================================
export async function processarMensagem(phone, msg) {

    logInfo("📩 Mensagem recebida", { phone, msg });

    const texto = msg.toLowerCase().trim();

    try {
        // =================================================
        // 1) MENU PRINCIPAL EM QUALQUER MOMENTO
        // =================================================
        if (/(menu|ajuda|help)/.test(texto)) {
            return mostrarMenu(phone);
        }

        // =================================================
        // 2) SAUDAÇÕES
        // =================================================
        const saudacoes = ["oi", "ola", "olá", "opa", "eae", "bom dia", "boa tarde", "boa noite"];
        if (saudacoes.includes(texto)) {
            return mostrarMenu(phone);
        }

        // =================================================
        // 3) NAVEGAÇÃO POR NÚMEROS (0–9)
        // =================================================
        if (/^\d$/.test(texto)) {
            const r = await processarOpcaoMenu(phone, texto);

            if (r?.submenu === "animais") return mostrarMenuAnimais(phone);
            if (r?.submenu === "lotes") return mostrarMenuLotes(phone);
            if (r?.submenu === "calculos") return mostrarMenuCalculos(phone);
            if (r?.submenu === "diagnostico") return mostrarMenuDiagnostico(phone);
            if (r?.submenu === "gpt") return mostrarMenuGPT(phone);

            return r;
        }

        // =================================================
        // 4) SUBMENUS (1.1 / 1.2 / 2.3 etc)
        // =================================================
        if (/^\d+\.\d+$/.test(texto)) {
            const r = await processarOpcaoMenu(phone, texto);

            if (r?.acao === "listar_animais") return listarAnimais(phone);
            if (r?.acao === "listar_lotes") return listarLotes(phone);

            return r;
        }

        // =================================================
        // 5) COMANDOS DE TEXTO DIRETO
        // =================================================
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
            const p = texto.split(" ");
            return adicionarAoLote(phone, p[3], p[4]);
        }

        if (texto.startsWith("remover do lote")) {
            const p = texto.split(" ");
            return removerDoLote(phone, p[3], p[4]);
        }

        if (texto.startsWith("remover lote")) {
            const nome = texto.replace("remover lote", "").trim();
            return deletarLote(phone, nome);
        }

        // =================================================
        // 6) CÁLCULOS RÁPIDOS + DIETA PRO AUTOMÁTICA
        // =================================================
        if (texto.includes("dieta")) {
            return dietaProfissionalController(phone, msg);
        }

        if (texto.startsWith("ua")) {
            return calcularUA(phone, msg);
        }

        if (texto.includes("lotacao")) {
            return calcularLotacao(phone, msg);
        }

        if (texto.includes("arroba")) {
            return custoPorArroba(phone, msg);
        }

        // =================================================
        // 7) DIAGNÓSTICO AUTOMÁTICO
        // =================================================
        if (msg.length > 25 && !texto.includes("gpt")) {
            return diagnosticoAnimal(phone, msg);
        }

        // =================================================
        // 8) GPT — fallback final
        // =================================================
        return respostaGPT(phone, msg);

    } catch (err) {

        logError(err, { phone, msg, local: "processarMensagem" });

        return sendMessage(
            phone,
            "⚠️ Ops, ocorreu um erro ao processar sua mensagem. Tente novamente."
        );
    }
}
