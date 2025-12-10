// =============================================
// 🤖 NLP PRINCIPAL — PECUÁRIA PRO (Versão Final)
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
import { dietaLeiteiraController } from "../controllers/dietaLeiteController.js";
import { dietaBezerroRecriaController } from "../controllers/dietaBezerroRecriaController.js";

import { getUser } from "../database/database.js";

// NOVO — Assistente Nutricional
import {
    isPerguntaDieta,
    processarPerguntaDieta
} from "../services/dietAssistant.js";


// =================================================
// Função externa para responder perguntas simples (percentuais e dominante)
// =================================================
async function tentarResponderDieta(phone, texto) {
    const user = await getUser(phone);
    const dieta = user?.data?.ultima_dieta;

    if (!dieta) return null;

    // Percentuais
    if (texto.includes("porcent") || texto.includes("percent")) {
        if (!dieta.resultado?.detalhesPorIngrediente) return null;

        const lista = dieta.resultado.detalhesPorIngrediente
            .map(i => `• ${i.nome}: ${i.percentual.toFixed(1)}%`)
            .join("\n");

        return `📊 *Percentual de cada ingrediente:*\n${lista}`;
    }

    // Ingrediente dominante
    if (
        texto.includes("qual ingrediente mais") ||
        texto.includes("predominante") ||
        texto.includes("mais alto") ||
        texto.includes("maior")
    ) {
        if (!dieta.resultado?.detalhesPorIngrediente) return null;

        const ordenado = [...dieta.resultado.detalhesPorIngrediente]
            .sort((a, b) => b.percentual - a.percentual);

        const top = ordenado[0];

        return `📈 *Ingrediente predominante:*  
${top.nome} com ${top.percentual.toFixed(1)}% da mistura.`;
    }

    return null;
}



// =================================================
// 🔧 Função principal do NLP
// =================================================
export async function processarMensagem(phone, msg) {

    logInfo("📩 Mensagem recebida", { phone, msg });

    const texto = msg.toLowerCase().trim();

    try {
        // =================================================
        // 1) MENU PRINCIPAL
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
        // 4) SUBMENUS (1.1 / 2.3 etc)
        // =================================================
        if (/^\d+\.\d+$/.test(texto)) {
            const r = await processarOpcaoMenu(phone, texto);

            if (r?.acao === "listar_animais") return listarAnimais(phone);
            if (r?.acao === "listar_lotes") return listarLotes(phone);

            return r;
        }

        // =================================================
        // 5) COMANDOS DIRETOS (texto)
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
        // 6) DIETAS (Ordem correta)
        // =================================================

        if (texto.includes("dieta") && texto.includes("leite")) {
            return dietaLeiteiraController(phone, msg);
        }

        if (texto.includes("dieta") && (texto.includes("bezerro") || texto.includes("recria"))) {
            return dietaBezerroRecriaController(phone, msg);
        }

        if (texto.includes("dieta")) {
            return dietaProfissionalController(phone, msg);
        }


        // =================================================
        // 7) CÁLCULOS RÁPIDOS
        // =================================================
        if (texto.startsWith("ua")) return calcularUA(phone, msg);
        if (texto.includes("lotacao")) return calcularLotacao(phone, msg);
        if (texto.includes("arroba")) return custoPorArroba(phone, msg);


        // =================================================
        // 8) PERGUNTAS SOBRE DIETA ANTERIOR (REGRAS FIXAS)
        // =================================================
        const respostaDieta = await tentarResponderDieta(phone, texto);
        if (respostaDieta) return sendMessage(phone, respostaDieta);

        // =================================================
        // 8.1 — PERGUNTAS SOBRE DIETA (Assistente Nutricional Inteligente)
        // =================================================
        if (isPerguntaDieta(texto)) {
            const user = await getUser(phone);
            const dieta = user?.data?.ultima_dieta;

            if (dieta) {
                const resposta = await processarPerguntaDieta(phone, texto, dieta);
                return sendMessage(phone, resposta);
            }
        }


        // =================================================
        // 9) DIAGNÓSTICO AUTOMÁTICO
        // =================================================
        if (msg.length > 35 && !texto.includes("gpt")) {
            return diagnosticoAnimal(phone, msg);
        }


        // =================================================
        // 10) GPT — fallback final
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
