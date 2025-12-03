// =============================================================
// 🎨 FORMATTER PRO v5 — Mensagens profissionais Pecuária Pro
// =============================================================

// ------------------------------
// DIETA
// ------------------------------
export function formatDieta(result, peso, qtd) {
    const plural = qtd > 1 ? "animais" : "animal";

    return (
        `📌 *Dieta Calculada — Pecuária Pro*\n\n` +
        `🐂 Peso por animal: *${peso} kg*\n` +
        `📦 Lote: *${qtd} ${plural}*\n\n` +

        `🍃 *Consumo por animal*\n` +
        `• MS: *${result.msDiaria.toFixed(2)} kg*\n` +
        `• NDT: *${result.ndtDiaria.toFixed(2)} kg*\n` +
        `• PB: *${result.pbDiaria.toFixed(2)} kg*\n\n` +

        `📊 *Totais do lote*\n` +
        `• MS: *${result.totalMs.toFixed(2)} kg/dia*\n` +
        `• NDT: *${result.totalNdt.toFixed(2)} kg/dia*\n` +
        `• PB: *${result.totalPb.toFixed(2)} kg/dia*`
    );
}

// ------------------------------
// CUSTO POR ARROBA
// ------------------------------
export function formatCustoArroba(result, peso, custo) {
    if (!peso || !custo) {
        return formatError("Peso e custo são necessários para calcular a arroba.");
    }

    return (
        `💲 *Custo por Arroba — Pecuária Pro*\n\n` +
        `🐂 Peso: *${peso} kg*\n` +
        `🌾 Custo MS/kg: *R$ ${custo}*\n\n` +

        `📅 Custo diário: *R$ ${result.custoDia.toFixed(2)}*\n` +
        `📆 Custo mensal: *R$ ${result.custoMes.toFixed(2)}*\n` +
        `🏋️ Arrobas ganhas/mês: *${result.arrobasGanhas.toFixed(2)}*\n\n` +

        `💰 *Custo por arroba: R$ ${result.custoPorArroba.toFixed(2)}*`
    );
}

// ------------------------------
// UA
// ------------------------------
export function formatUA(ua) {
    return (
        `🐄 *Unidade Animal (UA)*\n\n` +
        `UA total: *${ua.toFixed(2)}*`
    );
}

// ------------------------------
// LOTAÇÃO (UA/ha)
// ------------------------------
export function formatLotacao(lotacao, ua, area) {
    return (
        `🌱 *Taxa de Lotação — Pecuária Pro*\n\n` +
        `📐 Área: *${area} ha*\n` +
        `🐂 UA utilizadas: *${ua}*\n\n` +
        `📊 Lotação: *${lotacao.toFixed(2)} UA/ha*`
    );
}

// ------------------------------
// ERROS COMUNS
// ------------------------------
export function formatError(text) {
    return `❌ *Atenção — Pecuária Pro*\n${text}`;
}

// ------------------------------
// DADOS INCOMPLETOS
// ------------------------------
export function formatMissingData() {
    return (
        `⚠️ *Dados insuficientes*\n\n` +
        `Exemplos:\n` +
        `• dieta 380kg\n` +
        `• custo 1.20 peso 450kg\n` +
        `• UA 420kg\n` +
        `• lotação 20 bois 350kg 10ha`
    );
}
