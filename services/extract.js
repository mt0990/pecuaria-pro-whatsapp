// =============================================================
// 🧪 EXTRACT PRO v6 — Extração Inteligente Pecuária Pro
// =============================================================

// -------------------------------------------------------------
// PESO (kg)
// -------------------------------------------------------------
export function extrairPesoDaMensagem(texto) {
    texto = texto.toLowerCase();

    // 420kg, 450 kg
    let m = texto.match(/(\d+([.,]\d+)?)\s?kg/);
    if (m) return Number(m[1].replace(",", "."));

    // peso 420
    m = texto.match(/peso\s?(\d+([.,]\d+)?)/);
    if (m) return Number(m[1].replace(",", "."));

    // "boi 380"
    m = texto.match(/boi\s?(\d+([.,]\d+)?)/);
    if (m) return Number(m[1].replace(",", "."));

    // arrobas: 15@
    m = texto.match(/(\d+([.,]\d+)?)\s?@/);
    if (m) return Number(m[1].replace(",", ".")) * 15;

    return null;
}

// -------------------------------------------------------------
// QUANTIDADE DE ANIMAIS
// -------------------------------------------------------------
export function extrairQuantidadeDaMensagem(texto) {
    texto = texto.toLowerCase();

    // 5 animais, 10 cabeças, 3 bois, 4 vacas
    let m = texto.match(/(\d+)\s?(animais|cabeças|bois|vacas|garrotes)/);
    if (m) return Number(m[1]);

    // lote com 20
    m = texto.match(/lote\s?(com)?\s?(\d+)/);
    if (m) return Number(m[2]);

    // "quantidade 10"
    m = texto.match(/quantidade\s?(\d+)/);
    if (m) return Number(m[1]);

    // Padrão → 1 animal (evita crash)
    return 1;
}

// -------------------------------------------------------------
// CUSTO (R$/kg - insumos, ração, dieta, etc.)
// -------------------------------------------------------------
export function extrairCustoDaMensagem(texto) {
    texto = texto.toLowerCase();

    // "ração 2.50"
    let m = texto.match(/ração\s?(\d+([.,]\d+)?)/);
    if (m) return Number(m[1].replace(",", "."));

    // "custo 3.20"
    m = texto.match(/custo\s?(\d+([.,]\d+)?)/);
    if (m) return Number(m[1].replace(",", "."));

    // "ms 1.90"
    m = texto.match(/ms\s?(\d+([.,]\d+)?)/);
    if (m) return Number(m[1].replace(",", "."));

    // Evitar pegar QUALQUER número aleatório
    return null;
}

// -------------------------------------------------------------
// ÁREA EM HECTARES
// -------------------------------------------------------------
export function extrairAreaHa(texto) {
    texto = texto.toLowerCase();

    // "4 ha"
    let m = texto.match(/(\d+([.,]\d+)?)\s?ha/);
    if (m) return Number(m[1].replace(",", "."));

    // "área 5.2"
    m = texto.match(/área\s?(\d+([.,]\d+)?)/);
    if (m) return Number(m[1].replace(",", "."));

    // "5 hectares"
    m = texto.match(/(\d+([.,]\d+)?)\s?hectares?/);
    if (m) return Number(m[1].replace(",", "."));

    return null;
}
