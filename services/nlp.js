// =============================================================
// 🤖 NLP PRO v5 — Pecuária Pro (PT-BR)
// 100% compatível com arquitetura modular
// =============================================================

export function detectarIntencao(message) {
    if (!message) return { intent: "gpt" };

    const t = message.toLowerCase().trim();

    // ---------------------------------------------------------
    // EXTRAÇÃO DE NÚMEROS AUTOMÁTICOS
    // ---------------------------------------------------------
    const numeroEncontrado = t.match(/\d+(\.\d+)?/);
    const numero = numeroEncontrado ? Number(numeroEncontrado[0]) : null;

    // ---------------------------------------------------------
    // INTENÇÕES — AÇÕES DIRETAS (SEM GPT)
    // ---------------------------------------------------------

    // 🔹 dieta
    if (t.includes("dieta") || t.includes("ração") || t.includes("alimentação")) {
        return { intent: "dieta" };
    }

    // 🔹 UA
    if (t.includes("ua") || t.includes("unidade animal")) {
        return { intent: "ua" };
    }

    // 🔹 Custo da arroba
    if (t.includes("arroba") || t.includes("custo da arroba") || t.includes("preço arroba")) {
        return { intent: "arroba" };
    }

    // 🔹 Lotação (UA/ha)
    if (
        t.includes("lotação") ||
        t.includes("ua por hectare") ||
        t.includes("capacidade de suporte") ||
        t.includes("lotacao") ||
        t.includes("ua/ha")
    ) {
        return { intent: "lotacao" };
    }

    // 🔹 Listar animais
    if (t.includes("listar animais") || t.includes("meus animais") || t.includes("mostrar animais")) {
        return { intent: "listar_animais" };
    }

    // ---------------------------------------------------------
    // LOTES
    // ---------------------------------------------------------

    // listar lote com número
    if (
        (t.includes("listar lote") || t.includes("mostrar lote") || t.includes("ver lote")) &&
        numero
    ) {
        return { intent: "listar_lote", numero_lote: numero };
    }

    // listar lote sem número
    if (t.includes("listar lote") || t.includes("ver lote") || t.includes("mostrar lote")) {
        return { intent: "listar_lote", numero_lote: null };
    }

    // listar todos os lotes
    if (t.includes("listar lotes") || t.includes("meus lotes") || t.includes("ver lotes")) {
        return { intent: "listar_lotes" };
    }

    // adicionar ao lote (com número)
    if (t.includes("adicionar") && t.includes("lote") && numero) {
        return { intent: "adicionar_lote", numero_lote: numero };
    }

    // adicionar ao lote (sem número)
    if (t.includes("adicionar ao lote")) {
        return { intent: "adicionar_lote", numero_lote: null };
    }

    // ---------------------------------------------------------
    // CRUD ANIMAIS
    // ---------------------------------------------------------

    // registrar
    if (t.includes("cadastrar animal") || t.includes("registrar animal") || (t.includes("novo") && t.includes("animal"))) {
        return { intent: "registrar_animal" };
    }

    // atualizar
    if ((t.includes("editar animal") || t.includes("atualizar animal") || t.includes("alterar animal")) && numero) {
        return { intent: "atualizar_animal", numero_boi: numero };
    }

    // deletar
    if ((t.includes("deletar animal") || t.includes("remover animal") || t.includes("excluir animal")) && numero) {
        return { intent: "deletar_animal", numero_boi: numero };
    }

    // ---------------------------------------------------------
    // FALLBACK: GPT Resolve
    // ---------------------------------------------------------
    return { intent: "gpt" };
}
