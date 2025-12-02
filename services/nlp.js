// =============================================================
// 🤖 NLP PRO v4 — Pecuária Pro (PT-BR)
// 100% compatível com SEU index.js atual
// =============================================================

export function detectarIntencao(message) {
    if (!message) return { intent: "gpt" };

    const t = message.toLowerCase().trim();

    // ---------------------------------------------------------
    // EXTRAÇÃO DE NÚMEROS AUTOMÁTICOS
    // ---------------------------------------------------------
    const numeroEncontrado = t.match(/\d+/);
    const numero = numeroEncontrado ? Number(numeroEncontrado[0]) : null;

    // ---------------------------------------------------------
    // INTENÇÕES — AÇÕES SIMPLES (SEM GPT)
    // Estas intenções chamam blocos DIRETOS do seu index.js
    // ---------------------------------------------------------

    // DIETA
    if (
        t.includes("dieta") ||
        t.includes("ração") ||
        t.includes("alimentação")
    ) {
        return { intent: "dieta" };
    }

    // UA
    if (
        t.includes("ua") ||
        t.includes("unidade animal")
    ) {
        return { intent: "ua" };
    }

    // ARROBA
    if (
        t.includes("arroba") ||
        t.includes("custo da arroba") ||
        t.includes("preço arroba")
    ) {
        return { intent: "arroba" };
    }

    // LISTAR ANIMAIS
    if (
        t.includes("listar animais") ||
        t.includes("meus animais") ||
        t.includes("mostrar animais")
    ) {
        return { intent: "listar_animais" };
    }

    // ---------------------------------------------------------
    // LOTES — COMPATÍVEL COM index.js
    // ---------------------------------------------------------

    // "listar lote 3"
    if (
        (t.includes("listar lote") ||
            t.includes("mostrar lote") ||
            t.includes("ver lote")) &&
        numero
    ) {
        return { intent: "listar_lote", numero_lote: numero };
    }

    // "listar lotes"
    if (
        t.includes("listar lotes") ||
        t.includes("meus lotes") ||
        t.includes("ver lotes") ||
        t.includes("mostrar lotes")
    ) {
        return { intent: "listar_lotes" };
    }

    // "adicionar ao lote 2"
    if (
        t.includes("adicionar") &&
        t.includes("lote") &&
        numero
    ) {
        return {
            intent: "adicionar_lote",
            numero_lote: numero
        };
    }

    // Caso diga "adicionar ao lote" sem número
    if (
        t.includes("adicionar ao lote") ||
        (t.includes("adicionar") && t.includes("lote"))
    ) {
        return { intent: "adicionar_lote", numero_lote: null };
    }

    // ---------------------------------------------------------
    // CRUD ANIMAIS — COMPATÍVEL COM index.js
    // ---------------------------------------------------------

    // CADASTRAR ANIMAL
    if (
        t.includes("cadastrar animal") ||
        t.includes("registrar animal") ||
        (t.includes("novo") && t.includes("animal"))
    ) {
        return { intent: "registrar_animal" };
    }

    // ATUALIZAR ANIMAL
    if (
        (t.includes("editar animal") ||
            t.includes("atualizar animal") ||
            t.includes("alterar animal")) &&
        numero
    ) {
        return { intent: "atualizar_animal", numero_boi: numero };
    }

    // DELETAR ANIMAL
    if (
        (t.includes("deletar animal") ||
            t.includes("remover animal") ||
            t.includes("excluir animal")) &&
        numero
    ) {
        return { intent: "deletar_animal", numero_boi: numero };
    }

    // ---------------------------------------------------------
    // FALLBACK — GPT resolve
    // ---------------------------------------------------------
    return { intent: "gpt" };
}
