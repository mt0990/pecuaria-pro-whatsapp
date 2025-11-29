// services/extract.js — EXTRAÇÃO PROFISSIONAL PECUÁRIA PRO

// PESO
export function extrairPesoDaMensagem(texto) {
    texto = texto.toLowerCase();

    let m = texto.match(/(\d+)\s?kg/);
    if (m) return Number(m[1]);

    m = texto.match(/peso\s?(\d+)/);
    if (m) return Number(m[1]);

    m = texto.match(/(\d+)\s?@/);
    if (m) return Number(m[1]) * 15;

    return null;
}

// QUANTIDADE DE ANIMAIS
export function extrairQuantidadeDaMensagem(texto) {
    texto = texto.toLowerCase();

    let m = texto.match(/(\d+)\s?(animais|cabeças|bois|vacas|garrotes)/);
    if (m) return Number(m[1]);

    m = texto.match(/lote\s?(com)?\s?(\d+)/);
    if (m) return Number(m[2]);

    return 1;
}

// CUSTO
export function extrairCustoDaMensagem(texto) {
    texto = texto.toLowerCase();

    let m = texto.match(/ms\s?(\d+([.,]\d+)?)/);
    if (m) return Number(m[1].replace(",", "."));

    m = texto.match(/custo\s?(\d+([.,]\d+)?)/);
    if (m) return Number(m[1].replace(",", "."));

    m = texto.match(/ração\s?(\d+([.,]\d+)?)/);
    if (m) return Number(m[1].replace(",", "."));

    m = texto.match(/(\d+([.,]\d+)?)/);
    if (m) return Number(m[1].replace(",", "."));

    return null;
}

// AREA EM HECTARES
export function extrairAreaHa(texto) {
    texto = texto.toLowerCase();

    let m = texto.match(/(\d+([.,]\d+)?)\s?ha/);
    if (m) return Number(m[1].replace(",", "."));

    m = texto.match(/área\s?(\d+([.,]\d+)?)/);
    if (m) return Number(m[1].replace(",", "."));

    return null;
}
