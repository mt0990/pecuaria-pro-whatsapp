// =============================================
// ✨ FORMATADOR PADRÃO PARA RESPOSTAS DO BOT
// =============================================

// Formata listas simples numeradas
export function formatLista(lista) {
    if (!lista || !lista.length) return "Nenhum item encontrado.";
    return lista.map((item, idx) => `${idx + 1}. ${item}`).join("\n");
}

// Formata informações de um animal
export function formatAnimal(a) {
    return `
🐮 *Animal ID: ${a.id}*
Nome: ${a.nome}
Raça: ${a.raca}
Peso: ${a.peso} kg
Idade: ${a.idade}
Notas: ${a.notas || "Nenhuma"}
`.trim();
}

// Formata lista de animais
export function formatListaAnimais(animais) {
    if (!animais.length) return "📭 Nenhum animal cadastrado.";

    let txt = "🐮 *SEUS ANIMAIS:*\n\n";

    animais.forEach(a => {
        txt += `${formatAnimal(a)}\n\n`;
    });

    return txt;
}

// Formata informações de lote
export function formatLote(lote) {
    return `
📦 *Lote ${lote.numero_lote}*
Quantidade: ${lote.total_animais} animais
`.trim();
}

// Lista lotes agrupados
export function formatListaLotes(lotes) {
    if (!lotes.length) return "📭 Nenhum lote encontrado.";

    let txt = "📦 *SEUS LOTES:*\n\n";

    lotes.forEach(l => {
        txt += `${formatLote(l)}\n\n`;
    });

    return txt;
}

// Formata mensagens de diagnóstico
export function formatDiagnostico(textoGPT) {
    return `
🩺 *Diagnóstico Inicial (IA)*  
${textoGPT}
`.trim();
}
