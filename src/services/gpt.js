import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";
import { logError, logInfo } from "../utils/logger.js";
import { sendMessage } from "./whatsapp.js";

import {
    getConversationHistory,
    addConversation
} from "../database/database.js";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// ==================================================
// 🧠 GPT PREMIUM — Com memória otimizada
// ==================================================
export async function respostaGPT(phone, mensagem) {
    try {
        logInfo("➡️ Preparando GPT com memória otimizada", { phone });

        // 1️⃣ Buscar histórico completo
        let history = await getConversationHistory(phone);

        // 2️⃣ Limitar ao histórico mais recente (20 interações)
        if (history.length > 20) {
            history = history.slice(history.length - 20);
        }

        // 3️⃣ Comprimir histórico longo (reduz custo)
        const resumoHistorico = gerarResumoSeNecessario(history);

        // 4️⃣ Montar prompt final
        const messages = [
            {
                role: "system",
                content:
                    "Você é o assistente oficial Pecuária Pro. " +
                    "Seu objetivo é ajudar criadores com respostas claras, práticas " +
                    "e objetivas sobre pecuária, dietas, manejo, reprodução, saúde e gestão. " +
                    "Nunca responda de forma genérica ou vaga."
            },

            // Resumo comprimido (se existir)
            ...(resumoHistorico
                ? [{ role: "system", content: `Resumo da conversa anterior: ${resumoHistorico}` }]
                : []),

            // Histórico original
            ...history.map(h => ({
                role: h.role,
                content: h.message
            })),

            // Pergunta atual
            { role: "user", content: mensagem }
        ];

        // 5️⃣ Chamar modelo com suporte a histórico
        const completion = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages,
            temperature: 0.5
        });

        const resposta = completion.choices[0].message.content;

        // Segurança: evita resposta vazia
        const respostaFinal = resposta?.trim() || "Não consegui entender a pergunta.";

        // 6️⃣ Salvar resposta no histórico
        await addConversation(phone, "assistant", respostaFinal);

        // 7️⃣ Enviar ao WhatsApp
        await sendMessage(phone, respostaFinal);

        return respostaFinal;

    } catch (err) {
        logError(err, {
            local: "respostaGPT",
            phone,
            mensagem
        });

        await sendMessage(
            phone,
            "⚠️ A IA encontrou um erro. Tente novamente em instantes."
        );

        return null;
    }
}

// ==================================================
// 🔧 Função que comprime histórico para reduzir custo
// ==================================================
function gerarResumoSeNecessario(history) {
    if (history.length < 10) return null;

    const resumo = history
        .slice(0, history.length - 8)
        .map(h => `${h.role === "user" ? "Usuário" : "Assistente"}: ${h.message}`)
        .join(" | ");

    return resumo.length > 800 ? resumo.slice(0, 800) + "..." : resumo;
}
