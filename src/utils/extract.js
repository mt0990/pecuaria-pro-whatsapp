// =============================================
// 🔍 FUNÇÕES DE EXTRAÇÃO — NLP CONTROLADO
// =============================================

export function extrairNumero(msg) {
    const match = msg.match(/\d+(\.\d+)?/);
    return match ? Number(match[0]) : null;
}

export function extrairPesoDaMensagem(msg) {
    const match = msg.match(/(\d+)\s?kg/i);
    if (match) return Number(match[1]);

    const numero = extrairNumero(msg);
    return numero || null;
}

export function extrairAreaHa(msg) {
    const match = msg.match(/(\d+(\.\d+)?)\s?ha/i);
    if (match) return Number(match[1]);

    const numero = extrairNumero(msg);
    return numero || null;
}

export function extrairCustoDaMensagem(msg) {
    const match = msg.match(/(\d+(\,\d+)?)/);
    if (!match) return null;

    return Number(match[1].replace(",", "."));
}

export function extrairQuantidadeDaMensagem(msg) {
    return extrairNumero(msg);
}
