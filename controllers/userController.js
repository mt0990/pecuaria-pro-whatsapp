// =========================================
// 👤 USER CONTROLLER – Gerenciamento de Usuários
// =========================================

import {
    getUser,
    createUser,
    updateUser,
    addConversation,
    getConversationHistory
} from "../database/database.js";

import { sendMessage } from "../services/whatsapp.js";

// =========================================
// 📌 Garantir que usuário existe
// =========================================
export async function garantirUsuario(phone, name) {
    let user = await getUser(phone);

    if (!user) {
        await createUser(phone, name || null);
        user = await getUser(phone);
    }

    return user;
}

// =========================================
// 📌 Atualizar última interação
// =========================================
export async function atualizarStatusUsuario(phone, message) {
    return await updateUser(phone, {
        last_message: message,
        last_interaction: new Date().toISOString()
    });
}

// =========================================
// 📌 Registrar mensagem no histórico
// =========================================
export async function registrarConversacao(phone, role, message) {
    return await addConversation(phone, role, message);
}

// =========================================
// 📌 Recuperar últimas mensagens
// =========================================
export async function recuperarHistorico(phone, limit = 6) {
    return await getConversationHistory(phone, limit);
}

// =========================================
// 📌 (FUTURO) Verificar plano Premium
// =========================================
export function isPremium(user) {
    return user?.plano === "premium";
}

// =========================================
// 📌 (FUTURO) Ativar Premium
// =========================================
export async function ativarPremium(phone) {
    await updateUser(phone, {
        plano: "premium",
        premium_since: new Date().toISOString()
    });

    return sendMessage(phone, "✨ Seu plano Premium foi ativado com sucesso!");
}
