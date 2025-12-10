// =============================================
// 🤖 NLP PRINCIPAL — PECUÁRIA PRO (Versão Final Oficial)
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
import { sendMessage } from "../services/whatsapp.js";
import { logInfo, logError } from "../utils/logger.js";


// =============================================
// 🔍 Dieta Corte — Respostas subsequentes
// =============================================
async function tentarResponderDietaCorte(user, texto) {
    const dieta = user?.data?.ultima_dieta;
    if (!dieta?.resultado?.detalhesPorIngrediente) return null;

    // Percentuais
    if (texto.includes("porcent") || texto.includes("percent")) {
        const lista = dieta.resultado.detalhesPorIngrediente
            .map(i => `• ${i.nome}: ${i.percentual.toFixed(1)}%`)
            .join("\n");

        return `📊 *Percentual dos ingredientes da sua última dieta:*\n\n${lista}`;
    }

    // Ingrediente predominante
    if (
        texto.includes("qual ingrediente") ||
        texto.includes("predominante") ||
        texto.includes("mais alto") ||
        texto.includes("maior")
    ) {
        const ordenado = [...dieta.resultado.detalhesPorIngrediente]
            .sort((a, b) => b.percentual - a.percentual);

        const top = ordenado[0];

        return `📈 *Ingrediente predominante:* ${top.nome} (${top.percentual.toFixed(1)}%)`;
    }

    return null;
}


// =============================================
// 🔍 Dieta Leiteira — Respostas subsequentes
// =============================================
async function tentarResponderDietaLeiteira(user, texto) {
    const ultima = user?.data?.ultima_dieta;
    if (!ultima || ultima.tipo !== "leite") return null;

    // Ingredientes recomendados
    if (
        texto.includes("ingred") ||
        texto.includes("ração") ||
        texto.includes("usar") ||
        texto.includes("compos")
    ) {
        return (
            "🥛 *Ingredientes recomendados para vaca leiteira:*\n\n" +
            "• Silagem ou capim de boa qualidade\n" +
            "• Milho moído / polpa cítrica\n" +
            "• Farelo de soja ou ureia protegida\n" +
            "• Núcleo mineral para leite\n\n" +
            "Ajuste conforme produção e condição corporal."
        );
    }

    // Fórmula geral
    if (texto.includes("formula") || texto.includes("cálculo") || texto.includes("como faz")) {
        return (
            "📐 *Fórmula geral para dieta leiteira:*\n\n" +
            "Consumo MS = 3,2% do PV + 0,33 × litros de leite\n" +
            "PB ideal = 14% a 16%\n" +
            "NDT = 32% a 35%\n\n" +
            "Volumoso como base + concentrado conforme produção."
        );
    }

    return null;
}


// =============================================
// 🔍 Bezerro / Recria — Respostas subsequentes
// =============================================
function tentarResponderBezerroRecria(user, texto) {
    const ultima = user?.data?.ultima_dieta;
    if (!ultima) return null;

    // Bezerro
    if (ultima.tipo === "bezerro" && texto.includes("ingred")) {
        return (
            "🍼 *Ingredientes para bezerros (creep-feeding):*\n\n" +
            "• Fubá de milho\n" +
            "• Farelo de soja\n" +
            "• Núcleo mineral\n" +
            "• Feno de boa qualidade\n\n" +
            "Ofereça ad libitum."
        );
    }

    // Recria
    if (ultima.tipo === "recria" && texto.includes("ingred")) {
        return (
            "🐮 *Ingredientes para recria:*\n\n" +
            "• Silagem ou capim\n" +
            "• Milho moído\n" +
            "• Suplemento proteico (20% PB)\n" +
            "• Mineral apropriado"
        );
    }

    return null;
}



// =============================================
// 🔧 FUNÇÃO PRINCIPAL DO NLP
// =============================================
export async function processarMensagem(phone, msg) {

    logInfo("📩 Mensagem recebida", { phone, msg });

    const texto = msg.toLowerCase().trim();

    try {
        // MENU — sempre disponível
        if (/(menu|ajuda|help)/.test(texto)) return mostrarMenu(phone);

        // Saudações → abre menu
        const saudacoes = ["oi", "ola", "olá", "opa", "eae", "bom dia", "boa tarde", "boa noite"];
        if (saudacoes.includes(texto)) return mostrarMenu(phone);

        // Números do menu
        if (/^\d$/.test(texto)) {
            const r = await processarOpcaoMenu(phone, texto);

            if (r?.submenu === "animais") return mostrarMenuAnimais(phone);
            if (r?.submenu === "lotes") return mostrarMenuLotes(phone);
            if (r?.submenu === "calculos") return mostrarMenuCalculos(phone);
            if (r?.submenu === "diagnostico") return mostrarMenuDiagnostico(phone);
            if (r?.submenu === "gpt") return mostrarMenuGPT(phone);

            return r;
        }

        // Submenus (1.1 / 3.5 etc.)
        if (/^\d+\.\d+$/.test(texto)) {
            const r = await processarOpcaoMenu(phone, texto);
            if (r?.acao === "listar_animais") return listarAnimais(phone);
            if (r?.acao === "listar_lotes") return listarLotes(phone);
            return r;
        }


        // =============================================
        // 🔧 COMANDOS DIRETOS / CRUD ANIMAIS & LOTES
        // =============================================
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


        // =============================================
        // 🔥 DIETAS — ORDEM CORRETA (não mexer)
        // =============================================

        // Dieta Leite
        if (texto.includes("dieta") && texto.includes("leite")) {
            return dietaLeiteiraController(phone, msg);
        }

        // Bezerro / Recria
        const br = await dietaBezerroRecriaController(phone, msg);
        if (br) return br;

        // Dieta Corte / Dieta PRO
        if (texto.includes("dieta")) {
            return dietaProfissionalController(phone, msg);
        }


        // =============================================
        // Cálculos rápidos
        // =============================================
        if (texto.startsWith("ua")) return calcularUA(phone, msg);
        if (texto.includes("lotacao")) return calcularLotacao(phone, msg);
        if (texto.includes("arroba")) return custoPorArroba(phone, msg);


        // =============================================
        // 🔍 Perguntas sobre dieta salva
        // =============================================
        const user = await getUser(phone);

        const r1 = await tentarResponderDietaCorte(user, texto);
        if (r1) return sendMessage(phone, r1);

        const r2 = await tentarResponderDietaLeiteira(user, texto);
        if (r2) return sendMessage(phone, r2);

        const r3 = tentarResponderBezerroRecria(user, texto);
        if (r3) return sendMessage(phone, r3);


        // =============================================
        // 🩺 Diagnóstico — só se houver sintoma real
        // =============================================
        const gatilhos = [
            "febre", "doente", "diarreia", "toss", "ferida",
            "manco", "mancando", "abatido", "triste", "sem comer",
            "magro", "peso caindo", "inchado", "chiado", "respiração"
        ];

        if (gatilhos.some(g => texto.includes(g))) {
            return diagnosticoAnimal(phone, msg);
        }


        // =============================================
        // 🤖 GPT — fallback final
        // =============================================
        return respostaGPT(phone, msg);

    } catch (err) {
        logError(err, { phone, msg, local: "NLP" });
        return sendMessage(phone, "⚠️ Ocorreu um erro ao processar sua mensagem.");
    }
}
