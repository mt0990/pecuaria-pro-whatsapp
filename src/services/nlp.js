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

// =================================================
// 🔍 Respostas para perguntas sobre dietas anteriores
// =================================================
async function tentarResponderDietaCorte(user, texto) {
    const dieta = user?.data?.ultima_dieta;
    if (!dieta?.resultado?.detalhesPorIngrediente) return null;

    // Percentuais
    if (texto.includes("porcent") || texto.includes("percent")) {
        const lista = dieta.resultado.detalhesPorIngrediente
            .map(i => `• ${i.nome}: ${i.percentual.toFixed(1)}%`)
            .join("\n");

        return `📊 *Percentual de cada ingrediente:*\n${lista}`;
    }

    // Ingrediente predominante
    if (
        texto.includes("qual ingrediente mais") ||
        texto.includes("predominante") ||
        texto.includes("mais alto") ||
        texto.includes("maior")
    ) {
        const ordenado = [...dieta.resultado.detalhesPorIngrediente]
            .sort((a, b) => b.percentual - a.percentual);

        const top = ordenado[0];

        return `📈 *Ingrediente predominante:* ${top.nome} com ${top.percentual.toFixed(1)}% da mistura.`;
    }

    return null;
}


// =================================================
// 🔍 Regras específicas para dieta de vaca leiteira
// =================================================
async function tentarResponderDietaLeiteira(user, texto) {
    const ultima = user?.data?.ultima_dieta;
    if (!ultima || ultima.tipo !== "leite") return null;

    if (
        texto.includes("ingred") ||
        texto.includes("ração") ||
        texto.includes("compos") ||
        texto.includes("usar")
    ) {
        return (
            "🥛 *Ingredientes recomendados para vaca leiteira:*\n\n" +
            "• Volumoso de qualidade (silagem ou capim picado)\n" +
            "• Fonte energética (milho moído / polpa cítrica)\n" +
            "• Proteína (farelo de soja ou ureia protegida)\n" +
            "• Núcleo mineral específico para leite\n" +
            "\nAjuste conforme produção e condição corporal."
        );
    }

    if (texto.includes("formula") || texto.includes("cálculo") || texto.includes("como faz")) {
        return (
            "📐 *Fórmula geral para dieta de vacas leiteiras:*\n\n" +
            "Consumo de MS (kg/dia) = 3,2% do PV + 0,33 × litros de leite\n" +
            "Proteína Bruta ideal: 14% a 16%\n" +
            "NDT recomendado: 32% a 35%\n\n" +
            "Use volumoso como base e ajuste concentrado conforme produção."
        );
    }

    return null;
}


// =================================================
// 🔍 Bebzerro e Recria – Perguntas pós-dieta
// =================================================
function tentarResponderBezerroRecria(user, texto) {
    const ultima = user?.data?.ultima_dieta;
    if (!ultima) return null;

    if (ultima.tipo === "bezerro" && texto.includes("ingred")) {
        return (
            "🍼 *Ingredientes para bezerros (creep-feeding):*\n\n" +
            "• Fubá de milho\n" +
            "• Farelo de soja\n" +
            "• Núcleo mineral\n" +
            "• Feno ou capim de boa qualidade\n" +
            "\nManter oferta ad libitum."
        );
    }

    if (ultima.tipo === "recria" && texto.includes("ingred")) {
        return (
            "🐮 *Ingredientes recomendados para recria:*\n\n" +
            "• Silagem ou capim\n" +
            "• Milho moído\n" +
            "• Suplemento proteico 20% PB\n" +
            "• Mineral apropriado\n"
        );
    }

    return null;
}



// =================================================
// 🔧 FUNÇÃO PRINCIPAL DO NLP
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
        // 4) SUBMENUS (ex: 1.1 / 2.3)
        // =================================================
        if (/^\d+\.\d+$/.test(texto)) {
            const r = await processarOpcaoMenu(phone, texto);

            if (r?.acao === "listar_animais") return listarAnimais(phone);
            if (r?.acao === "listar_lotes") return listarLotes(phone);

            return r;
        }

        // =================================================
        // 5) COMANDOS DIRETOS
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

        const rBR = await dietaBezerroRecriaController(phone, msg);
        if (rBR) return rBR;

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
        // 8) PERGUNTAS SOBRE DIETA SALVA
        // =================================================
        const user = await getUser(phone);

        // Dieta Corte
        const respostaCorte = await tentarResponderDietaCorte(user, texto);
        if (respostaCorte) return sendMessage(phone, respostaCorte);

        // Dieta Leiteira
        const respostaLeite = await tentarResponderDietaLeiteira(user, texto);
        if (respostaLeite) return sendMessage(phone, respostaLeite);

        // Bezerro / Recria
        const respostaBR = tentarResponderBezerroRecria(user, texto);
        if (respostaBR) return sendMessage(phone, respostaBR);

        // =================================================
        // 9) DIAGNÓSTICO AUTOMÁTICO (somente com sintomas reais)
        // =================================================
        const gatilhosDiagnostico = [
        "febre", "febril", "doente", "diarreia", "diarréia",
        "tossindo", "tosse", "lesão", "ferida", "manco", "mancando",
        "triste", "abatido", "apático", "sem comer", "não come",
        "magro", "emagrecendo", "isolado", "respiração", "chiado",
        "inchaço", "inchado", "babando", "muco", "nariz", "olhos"
        ];

        const temSintoma = gatilhosDiagnostico.some(s => texto.includes(s));

        // Se tiver palavras de sintomas → diagnóstico
        if (temSintoma) {
        return diagnosticoAnimal(phone, msg);
        }
        
        // =================================================
        // 10) GPT — Fallback final
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
