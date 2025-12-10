// ======================================================
// 🐄 CATTLE — Funções retornam texto (NÃO enviam mensagem)
// ======================================================

import { 
    extrairPesoDaMensagem,
    extrairAreaHa,
    extrairCustoDaMensagem
} from "../utils/extract.js";

// =============================================
// 🍽 DIETA
// =============================================
export function calcularDieta(phone, msg) {
    const peso = extrairPesoDaMensagem(msg);

    if (!peso) {
        return "❌ Informe o peso do animal. Ex: 300kg";
    }

    const ms = peso * 0.025;
    const concentrado = ms * 0.30;
    const volumoso = ms * 0.70;

    return `
🍽 *Dieta sugerida para ${peso} kg*

🌾 Volumoso: *${volumoso.toFixed(1)} kg MS/dia*
🌽 Concentrado: *${concentrado.toFixed(1)} kg MS/dia*

📌 Ajuste conforme nutricionista.
`;
}

// =============================================
// 🐄 UNIDADE ANIMAL - UA
// =============================================
export function calcularUA(phone, msg) {
    const peso = extrairPesoDaMensagem(msg);

    if (!peso) {
        return "❌ Envie o peso. Ex: ua 400kg";
    }

    const ua = peso / 450;

    return `🐄 *UA:* ${ua.toFixed(2)} por animal`;
}

// =============================================
// 🌱 LOTAÇÃO - UA/ha
// =============================================
export function calcularLotacao(phone, msg) {
    const peso = extrairPesoDaMensagem(msg);
    const area = extrairAreaHa(msg);

    if (!peso || !area) {
        return "❌ Envie peso e área. Ex: 20ha 400kg";
    }

    const ua = peso / 450;
    const lotacao = ua / area;

    return `🌱 *Lotação:* ${lotacao.toFixed(2)} UA/ha`;
}

// =============================================
// 💰 CUSTO POR ARROBA
// =============================================
export function custoPorArroba(phone, msg) {
    const custo = extrairCustoDaMensagem(msg);
    const peso = extrairPesoDaMensagem(msg);

    if (!custo || !peso) {
        return "❌ Envie custo total e peso. Ex: 2800 450kg";
    }

    const arroba = peso / 15;
    const preco = custo / arroba;

    return `💰 *Custo por arroba:* R$ ${preco.toFixed(2)}`;
}
