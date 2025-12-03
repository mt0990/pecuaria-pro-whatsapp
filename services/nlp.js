// =============================================================
// 🤖 NLP PRO v6 – Pecuária Pro (Versão Final Revisada)
// 100% compatível com seu menu + WhatsApp Service + AI Controller
// =============================================================

export function detectarIntencao(message) {
    if (!message) return { intent: "gpt" };

    const t = message.toLowerCase().trim();
    const numeroMatch = t.match(/\d+/);
    const numero = numeroMatch ? Number(numeroMatch[0]) : null;

    // =============================
    // 📋 MENU PRINCIPAL
    // =============================
    if (
        t === "menu" ||
        t === "opções" ||
        t === "ajuda" ||
        t === "0" ||
        t.includes("voltar")
    ) {
        return { intent: "menu" };
    }

    // =============================
    // 📌 LISTAR TODOS ANIMAIS
    // =============================
    if (
        t.includes("listar animais") ||
        t.includes("meus animais") ||
        t.includes("animais cadastrados")
    ) {
        return { intent: "listar_animais" };
    }

    // =============================
    // 📦 LISTAR TODOS LOTES
    // (vem ANTES de listar lote individual)
    // =============================
    if (
        t.includes("listar lotes") ||
        t.includes("meus lotes") ||
        t.includes("todos lotes")
    ) {
        return { intent: "listar_lotes" };
    }

    // =============================
    // 📦 LOTE INDIVIDUAL
    // =============================
    if (
        (t.includes("lote") || t.includes("ver lote")) &&
        numero
    ) {
        return { intent: "listar_lote", numero_lote: numero };
    }

    // =============================
    // 🐂 REGISTRAR ANIMAL
    // =============================
    if (
        t.includes("registrar animal") ||
        t.includes("cadastrar animal") ||
        (t.includes("novo") && t.includes("animal"))
    ) {
        return { intent: "registrar_animal" };
    }

    // =============================
    // ✏️ ATUALIZAR ANIMAL
    // =============================
    if (
        (t.includes("editar animal") ||
         t.includes("atualizar animal") ||
         t.includes("alterar animal")) &&
        numero
    ) {
        return { intent: "atualizar_animal", numero_boi: numero };
    }

    // =============================
    // ❌ REMOVER ANIMAL
    // =============================
    if (
        (t.includes("remover animal") ||
         t.includes("deletar animal") ||
         t.includes("excluir animal")) &&
        numero
    ) {
        return { intent: "deletar_animal", numero_boi: numero };
    }

    // =============================
    // 🍽️ DIETA
    // =============================
    if (t.includes("dieta") || t.includes("ração") || t.includes("alimentação")) {
        return { intent: "dieta" };
    }

    // =============================
    // 🐄 UA
    // =============================
    if (/\bua\b/.test(t) || t.includes("unidade animal")) {
        return { intent: "ua" };
    }

    // =============================
    // 💲 CUSTO ARROBA
    // =============================
    if (
        t.includes("arroba") ||
        t.includes("custo arroba") ||
        t.includes("custo por arroba")
    ) {
        return { intent: "arroba" };
    }

    // =============================
    // 🌱 LOTAÇÃO / UA/ha
    // =============================
    if (
        t.includes("lotação") ||
        t.includes("ua/ha") ||
        t.includes("ua ha")
    ) {
        return { intent: "lotacao" };
    }

    // =============================
    // FALLBACK → GPT RESPONDE
    // (doenças, vacinas, manejo, dúvidas gerais)
    // =============================
    return { intent: "gpt" };
}
