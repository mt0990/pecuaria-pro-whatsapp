// =========================================
// 📦 LOTE CONTROLLER – Gerenciamento de Lotes
// =========================================

import {
    getLote,
    getAllLotes,
    addAnimalToLote
} from "../database/database.js";

import { sendMessage } from "../services/whatsapp.js";

// =========================================
// 📌 Adicionar Animal ao Lote
// =========================================
export async function adicionarAoLote(phone, data) {
    await addAnimalToLote(
        phone,
        data.numero_lote,
        data.tipo,
        data.raca,
        data.peso,
        data.idade,
        data.sexo,
        data.quantidade,
        data.observacao
    );

    return sendMessage(phone, `📦 Animal adicionado ao lote ${data.numero_lote}!`);
}

// =========================================
// 📌 Listar Lote Individual
// =========================================
export async function listarLote(phone, numeroLote) {
    const animais = await getLote(phone, numeroLote);

    if (!animais.length)
        return sendMessage(phone, `📭 O lote ${numeroLote} está vazio.`);

    let txt = `📦 *Lote ${numeroLote}*\n\n`;

    animais.forEach(a => {
        txt += `🐂 Tipo: ${a.tipo}
Raça: ${a.raca || "não informada"}
Peso: ${a.peso} kg
Idade: ${a.idade} ano(s)
Sexo: ${a.sexo}
Quantidade: ${a.quantidade}
Observação: ${a.observacao || "nenhuma"}\n\n`;
    });

    return sendMessage(phone, txt);
}

// =========================================
// 📌 Listar Todos os Lotes
// =========================================
export async function listarTodosLotes(phone) {
    const lotes = await getAllLotes(phone);

    if (!lotes.length)
        return sendMessage(phone, "📭 Você não possui lotes cadastrados.");

    let txt = "📦 *Seus lotes cadastrados*\n\n";

    lotes.forEach(l => {
        txt += `• Lote ${l.numero_lote} — ${l.total_animais} animais\n`;
    });

    return sendMessage(phone, txt);
}
