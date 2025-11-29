// services/formatter.js — FORMATAÇÃO PROFISSIONAL PECUÁRIA PRO

export function formatDieta(result, peso, qtd) {
    return (
        `📌 *Dieta Calculada — Pecuária Pro*\n\n` +
        `🐂 Peso por animal: *${peso} kg*\n` +
        `📦 Lote: *${qtd} animais*\n\n` +
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

export function formatCustoArroba(result, peso, custo) {
    return (
        `💲 *Custo por Arroba — Pecuária Pro*\n\n` +
        `🐂 Peso: *${peso} kg*\n` +
        `🌾 Custo MS/kg: *R$ ${custo}*\n\n` +
        `📅 Custo diário: *R$ ${result.custoDia.toFixed(2)}*\n` +
        `📆 Custo mensal: *R$ ${result.custoMes.toFixed(2)}*\n` +
        `🏋️ Arrobas ganhas/mês: *${result.arrobasGanhas.toFixed(2)}*\n\n` +
        `💰 Custo por arroba: *R$ ${result.custoPorArroba.toFixed(2)}*`
    );
}

export function formatUA(ua) {
    return `🐄 *Unidade Animal (UA)*\n\nUA total: *${ua.toFixed(2)}*`;
}

export function formatLotacao(lotacao) {
    return (
        `🌱 *Taxa de Lotação — Pecuária Pro*\n\n` +
        `UA/ha: *${lotacao.toFixed(2)}*`
    );
}

export function formatError(text) {
    return `❌ *Atenção — Pecuária Pro*\n${text}`;
}

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
