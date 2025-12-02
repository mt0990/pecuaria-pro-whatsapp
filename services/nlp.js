// =============================================================
// 🤖 NLP PRO v2 — Pecuária Pro
// Detector de intenções universal, modular, inteligente e expansível
// =============================================================

export function detectIntent(message) {
    if (!message) return { intent: "gpt" };

    const t = message.toLowerCase().trim();

    // ---------------------------------------------------------
    // 📌 0. REGEX AVANÇADO (Lotes e números)
    // ---------------------------------------------------------

    // "listar lote 3", "mostre o lote 12", "ver lote 8"
    const regexListarLote = /lote\s+(\d+)/;
    if (
        (t.includes("listar lote") || t.includes("mostrar lote") || t.includes("ver lote")) &&
        regexListarLote.test(t)
    ) {
        return {
            intent: "listar_lote",
            numero_lote: parseInt(t.match(regexListarLote)[1])
        };
    }

    // "adicionar ao lote 3", "colocar no lote 2"
    const regexAddLote = /(lote\s+(\d+))|(ao lote\s+(\d+))/;
    if (
        (t.includes("adicionar") || t.includes("colocar") || t.includes("inserir")) &&
        t.includes("lote") &&
        regexAddLote.test(t)
    ) {
        const numero = t.match(/\d+/)[0];
        return {
            intent: "add_lote",
            numero_lote: parseInt(numero)
        };
    }

    // ---------------------------------------------------------
    // 📌 1. INTENÇÕES FIXAS (resolvidas sem GPT)
    // ---------------------------------------------------------

    const intents = [
        {
            intent: "diet",
            patterns: ["dieta", "ração", "alimentação", "formulação"]
        },
        {
            intent: "arroba_cost",
            patterns: ["custo da arroba", "custo arroba", "preço arroba", "valor arroba"]
        },
        {
            intent: "ua_calc",
            patterns: ["ua", "unidade animal"]
        },
        {
            intent: "lotacao_calc",
            patterns: ["lotação", "ua/ha", "ua por hectare", "capacidade de suporte"]
        },
        {
            intent: "listar_lotes",
            patterns: ["listar lotes", "meus lotes", "ver lotes", "mostrar lotes"]
        },
        {
            intent: "pasture",
            patterns: ["pasto", "pastagem", "capim", "piquete"]
        },
        {
            intent: "animal_report",
            patterns: ["ficha", "detalhes do animal", "relatório do animal"]
        }
    ];

    // Verifica padrões simples
    for (const i of intents) {
        for (const p of i.patterns) {
            if (t.includes(p)) {
                return { intent: i.intent };
            }
        }
    }

    // ---------------------------------------------------------
    // 📌 2. CRUD COMPLETO DE ANIMAIS
    // ---------------------------------------------------------

    // Cadastrar animal
    if (
        t.includes("cadastrar animal") ||
        t.includes("novo animal") ||
        t.includes("registrar animal") ||
        (t.includes("adicionar animal") && !t.includes("lote"))
    ) {
        return { intent: "registrar_animal" };
    }

    // Listar animais
    if (
        t.includes("listar animais") ||
        t.includes("meus animais") ||
        t.includes("mostrar animais")
    ) {
        return { intent: "listar_animais" };
    }

    // Atualizar animal
    if (
        t.includes("atualizar animal") ||
        t.includes("editar animal") ||
        t.includes("alterar animal")
    ) {
        return { intent: "atualizar_animal" };
    }

    // Deletar animal
    if (
        t.includes("apagar animal") ||
        t.includes("deletar animal") ||
        t.includes("remover animal")
    ) {
        return { intent: "deletar_animal" };
    }

    // ---------------------------------------------------------
    // 📌 3. INTENÇÕES RELACIONADAS A LOTES
    // ---------------------------------------------------------

    // Listar um lote, sem número explícito
    if (
        (t.includes("listar lote") || t.includes("ver lote") || t.includes("mostrar lote")) &&
        !regexListarLote.test(t)
    ) {
        return { intent: "listar_lote", numero_lote: null };
    }

    // Adicionar animal ao lote (sem número)
    if (
        t.includes("adicionar ao lote") ||
        (t.includes("adicionar") && t.includes("lote"))
    ) {
        return { intent: "add_lote", numero_lote: null };
    }

    // ---------------------------------------------------------
    // 📌 4. FALLBACK – GPT interpreta e retorna JSON
    // ---------------------------------------------------------

    return { intent: "gpt" };
}
