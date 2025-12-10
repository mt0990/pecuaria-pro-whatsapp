// =============================================
// 🤖 NLP PRINCIPAL — PECUÁRIA PRO (Versão Final Corrigida)
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


// =============================================
// 🔍 Dieta Corte — Respostas subsequentes
// =============================================
async function tentarResponderDietaCorte(user, texto) {
    const dieta = user?.data?.ultima_dieta;
    if (!dieta?.resultado?.detalhesPorIngrediente) return null;

    if (texto.includes("porcent") || texto.includes("percent")) {
        const lista = dieta.resultado.detalhesPorIngrediente
            .map(i => `• ${i.nome}: ${i.percentual.toFixed(1)}%`)
            .join("\n");

        return `📊 *Percentual dos ingredientes da sua última dieta:*\n\n${lista}`;
    }

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
// 🔧 FUNÇÃO PRINCIPAL DO NLP (CORRIGIDA)
// =============================================
export async function processarMensagem(phone, msg) {

    logInfo("📩 Mensagem recebida", { phone, msg });

    const texto = msg.toLowerCase().trim();

    try {

        // MENU — SEMPRE DISPONÍVEL
        if (/(menu|ajuda|help)/.test(texto)) {
            await mostrarMenu(phone);
            return null;
        }

        // SAUDAÇÕES → MENU
        const saudacoes = ["oi", "ola", "olá", "opa", "eae", "bom dia", "boa tarde", "boa noite"];
        if (saudacoes.includes(texto)) {
            await mostrarMenu(phone);
            return null;
        }

        // MENU PRINCIPAL (NÚMEROS)
        if (/^\d$/.test(texto)) {
            const r = await processarOpcaoMenu(phone, texto);

            if (r?.submenu === "animais") { await mostrarMenuAnimais(phone); return null; }
            if (r?.submenu === "lotes") { await mostrarMenuLotes(phone); return null; }
            if (r?.submenu === "calculos") { await mostrarMenuCalculos(phone); return null; }
            if (r?.submenu === "diagnostico") { await mostrarMenuDiagnostico(phone); return null; }
            if (r?.submenu === "gpt") { await mostrarMenuGPT(phone); return null; }

            return r; // Pode retornar instruções de submenu
        }

        // SUBMENUS (1.1 / 3.5 etc.)
        if (/^\d+\.\d+$/.test(texto)) {
            const r = await processarOpcaoMenu(phone, texto);

            if (r?.acao === "listar_animais") { await listarAnimais(phone); return null; }
            if (r?.acao === "listar_lotes") { await listarLotes(phone); return null; }

            return r;
        }

        // CRUD ANIMAIS & LOTES
        if (texto.startsWith("registrar animal")) { await registrarAnimal(phone, msg); return null; }
        if (texto.startsWith("editar animal")) { await editarAnimal(phone, msg); return null; }
        if (texto.startsWith("remover animal")) { await removerAnimal(phone, msg); return null; }
        if (texto === "listar animais") { await listarAnimais(phone); return null; }

        if (texto.startsWith("criar lote")) {
            const nome = texto.replace("criar lote", "").trim();
            await criarLote(phone, nome);
            return null;
        }

        if (texto === "listar lotes") { await listarLotes(phone); return null; }

        if (texto.startsWith("adicionar ao lote")) {
            const p = texto.split(" ");
            await adicionarAoLote(phone, p[3], p[4]);
            return null;
        }

        if (texto.startsWith("remover do lote")) {
            const p = texto.split(" ");
            await removerDoLote(phone, p[3], p[4]);
            return null;
        }

        if (texto.startsWith("remover lote")) {
            const nome = texto.replace("remover lote", "").trim();
            await deletarLote(phone, nome);
            return null;
        }

        // DIETAS (que RETORNAM TEXTO apenas)
        if (texto.includes("dieta") && texto.includes("leite")) {
            return await dietaLeiteiraController(phone, msg);
        }

        const br = await dietaBezerroRecriaController(phone, msg);
        if (br) return br;

        if (texto.includes("dieta")) {
            return await dietaProfissionalController(phone, msg);
        }

        // CÁLCULOS (RETORNAM TEXTO)
        if (texto.startsWith("ua")) return await calcularUA(phone, msg);
        if (texto.includes("lotacao")) return await calcularLotacao(phone, msg);
        if (texto.includes("arroba")) return await custoPorArroba(phone, msg);

        // RESPOSTAS BASEADAS EM DIETA SALVA
        const user = await getUser(phone);

        const r1 = await tentarResponderDietaCorte(user, texto);
        if (r1) return r1;

        const r2 = await tentarResponderDietaLeiteira(user, texto);
        if (r2) return r2;

        const r3 = tentarResponderBezerroRecria(user, texto);
        if (r3) return r3;

        // DIAGNÓSTICO
        const gatilhos = [
            "febre", "doente", "diarreia", "toss", "ferida",
            "manco", "mancando", "abatido", "triste", "sem comer",
            "magro", "peso caindo", "inchado", "chiado", "respiração"
        ];

        if (gatilhos.some(g => texto.includes(g))) {
            return await diagnosticoAnimal(phone, msg);
        }

        // GPT (retorna texto)
        return await respostaGPT(phone, msg);

    } catch (err) {
        logError(err, { phone, msg, local: "NLP" });
        return "⚠️ Ocorreu um erro ao processar sua mensagem.";
    }
}
