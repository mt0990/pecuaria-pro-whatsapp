// =========================================
// 📌 CATTLE CONTROLLER – Cálculos diretos (sem GPT)
// =========================================

import {
    calcularDieta,
    custoPorArroba,
    calcularUA,
    calcularLotacao
} from "../services/cattle.js";

import {
    extrairPesoDaMensagem,
    extrairQuantidadeDaMensagem,
    extrairCustoDaMensagem,
    extrairAreaHa
} from "../services/extract.js";

import {
    formatDieta,
    formatCustoArroba,
    formatUA,
    formatLotacao,
    formatMissingData
} from "../services/formatter.js";

import { sendMessage } from "../services/whatsapp.js";

// =========================================
// 📌 DIETA
// =========================================
export async function handleDieta(phone, message) {
    const peso = extrairPesoDaMensagem(message);
    const qtd = extrairQuantidadeDaMensagem(message);

    if (!peso)
        return sendMessage(phone, "Informe o peso. Ex: boi 380kg");

    const dieta = calcularDieta(peso, qtd);
    return sendMessage(phone, formatDieta(dieta, peso, qtd));
}

// =========================================
// 📌 UA
// =========================================
export async function handleUA(phone, message) {
    const peso = extrairPesoDaMensagem(message);
    const qtd = extrairQuantidadeDaMensagem(message);

    if (!peso)
        return sendMessage(phone, "Informe peso. Ex: UA 420kg");

    const ua = calcularUA(peso) * (qtd || 1);
    return sendMessage(phone, formatUA(ua));
}

// =========================================
// 📌 CUSTO POR ARROBA
// =========================================
export async function handleArroba(phone, message) {
    const peso = extrairPesoDaMensagem(message);
    const custo = extrairCustoDaMensagem(message);

    if (!peso || !custo)
        return sendMessage(phone, formatMissingData());

    const valor = custoPorArroba(custo, peso);
    return sendMessage(phone, formatCustoArroba(valor, peso, custo));
}

// =========================================
// 📌 LOTAÇÃO (UA/ha)
// =========================================
export async function handleLotacao(phone, message) {
    const ua = extrairQuantidadeDaMensagem(message);
    const area = extrairAreaHa(message);

    if (!ua || !area)
        return sendMessage(phone, formatMissingData());

    const lotacao = calcularLotacao(ua, area);
    return sendMessage(phone, formatLotacao(lotacao, ua, area));
}
