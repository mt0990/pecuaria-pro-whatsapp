// services/nlp.js — DETECÇÃO PROFISSIONAL PECUÁRIA PRO

export function detectIntent(message) {
    const t = message.toLowerCase();

    // --------------------------
    // 1. NUTRIÇÃO / CUSTOS
    // --------------------------
    if (t.includes("dieta") || t.includes("ração") || t.includes("alimentação"))
        return { intent: "diet" };

    if ((t.includes("custo") || t.includes("arroba")) && t.includes("peso"))
        return { intent: "arroba_cost" };

    // --------------------------
    // 2. CRUD DE ANIMAIS
    // --------------------------
    if (t.includes("cadastrar") || t.includes("novo animal"))
        return { intent: "register_animal" };

    if (t.includes("listar animais") || t.includes("meus animais") || t.includes("ver animais"))
        return { intent: "list_animals" };

    if (t.includes("editar animal") || t.includes("atualizar animal") || t.includes("alterar animal"))
        return { intent: "update_animal" };

    if (t.includes("apagar animal") || t.includes("deletar animal") || t.includes("remover animal"))
        return { intent: "delete_animal" };

    // --------------------------
    // 3. UA E LOTAÇÃO
    // --------------------------
    if (t.includes("ua") || t.includes("unidade animal"))
        return { intent: "ua_calc" };

    if (t.includes("lotação") || t.includes("ua/ha") || t.includes("ua por hectare"))
        return { intent: "lotacao_calc" };

    // --------------------------
    // 4. MANEJO / PASTAGEM
    // --------------------------
    if (t.includes("pasto") || t.includes("pastagem") || t.includes("capim") || t.includes("piquete"))
        return { intent: "pasture" };

    // --------------------------
    // 5. FICHA DO ANIMAL
    // --------------------------
    if (t.includes("ficha") || t.includes("técnica") || t.includes("detalhes do animal"))
        return { intent: "animal_report" };

    // --------------------------
    // FALLBACK GPT
    // --------------------------
    return { intent: "gpt" };
}
