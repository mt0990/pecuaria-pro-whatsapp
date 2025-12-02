// =============================================================
// 🤖 NLP PRO v3 — Pecuária Pro (PT-BR)
// Detector de intenções inteligente, limpo e profissional
// =============================================================

export function detectarIntencao(message) {
    if (!message) return { intent: "gpt" };

    const t = message.toLowerCase().trim();

    // ---------------------------------------------------------
    // NÚMEROS AUTOMÁTICOS
    // ---------------------------------------------------------
    const num = t.match(/\d+/) ? Number(t.match(/\d+/)[0]) : null;

    // ---------------------------------------------------------
    // LOTES
    // ---------------------------------------------------------

    // listar lote 1
    if (t.includes("lote") && t.includes("listar") && num)
        return { intent: "listar_lote", numero_lote: num };

    // listar todos os lotes
    if (t.includes("listar lotes") || t.includes("meus lotes"))
        return { intent: "listar_lotes" };

    // adicionar ao lote 2
    if (t.includes("adicionar") && t.includes("lote") && num)
        return { intent: "adicionar_lote", numero_lote: num };

    // ---------------------------------------------------------
    // CRUD ANIMAIS
    // ---------------------------------------------------------

    if (t.includes("cadastrar animal") || t.includes("novo animal"))
        return { intent: "registrar_animal" };

    if (t.includes("listar animais") || t.includes("meus animais"))
        return { intent: "listar_animais" };

    if (t.includes("atualizar animal") || t.includes("editar animal"))
        return { intent: "atualizar_animal", numero_boi: num };

    if (t.includes("deletar animal") || t.includes("remover animal"))
        return { intent: "deletar_animal", numero_boi: num };

    // ---------------------------------------------------------
    // CÁLCULOS
    // ---------------------------------------------------------

    if (t.includes("dieta"))
        return { intent: "diet" };

    if (t.includes("ua"))
        return { intent: "ua_calc" };

    if (t.includes("arroba"))
        return { intent: "arroba_cost" };

    // ---------------------------------------------------------
    // FALLBACK → GPT resolve
    // ---------------------------------------------------------
    return { intent: "gpt" };
}
