// =============================================
// 🔍 FUNÇÕES DE EXTRAÇÃO — VERSÃO INTELIGENTE
// =============================================

// extrai TODOS os números da mensagem (aceita vírgula ou ponto)
export function extrairTodosNumeros(msg) {
    if (typeof msg !== "string") return [];

    const encontrados = msg.match(/\d+[.,]?\d*/g);
    if (!encontrados) return [];

    return encontrados.map(n =>
        Number(
            n
                .replace(/\./g, "") // remove separador de milhar
                .replace(",", ".")  // normaliza decimal
        )
    );
}

// extrai o primeiro número da frase (peso normalmente)
export function extrairPesoDaMensagem(msg) {
    const nums = extrairTodosNumeros(msg);
    return nums.length >= 1 ? nums[0] : null;
}

// extrai o segundo número da frase (custo normalmente)
export function extrairCustoDaMensagem(msg) {
    const nums = extrairTodosNumeros(msg);
    return nums.length >= 2 ? nums[1] : null;
}

// extrai quantidade quando necessário
export function extrairQuantidadeDaMensagem(msg) {
    const nums = extrairTodosNumeros(msg);
    return nums.length >= 1 ? nums[0] : null;
}

// extrai área em hectares
export function extrairAreaHa(msg) {
    const nums = extrairTodosNumeros(msg);
    return nums.length >= 1 ? nums[0] : null;
}
