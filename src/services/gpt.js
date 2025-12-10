import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";
import { logError, logInfo } from "../utils/logger.js";

import {
    getConversationHistory,
    addConversation
} from "../database/database.js";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// ==================================================
// 🧠 GPT PREMIUM — Com memória otimizada (SEM DUPLICAR MENSAGEM)
// ==================================================
export async function respostaGPT(phone, mensagem) {
    try {
        logInfo("➡️ Preparando GPT com memória otimizada", { phone });

        // 1️⃣ Buscar histórico
        let history = await getConversationHistory(phone);

        // 2️⃣ Limitar ao mais recente
        if (history.length > 20) {
            history = history.slice(history.length - 20);
        }

        // 3️⃣ Resumo opcional
        const resumoHistorico = gerarResumoSeNecessario(history);

        // 4️⃣ Prompt do ChatGPT
        const messages = [
            {
                role: "system",
                 content:
                    "Você é o assistente oficial Pecuária Pro. " +
                    "Responda SOMENTE à pergunta atual do usuário. " +
                    "NÃO continue conversas anteriores, NÃO ofereça sugestões extras, " +
                    "e NÃO gere respostas longas demais. " +
                    "Se o usuário pedir valores, informe valores. " +
                    "Se pedir explicação, explique, mas sempre de forma curta, clara e direta. " +
                    "NÃO invente ingredientes, NÃO monte dietas completas se não for pedido. " +
                    "Foque APENAS no que foi perguntado AGORA."
            },

            ...(resumoHistorico
                ? [{ role: "system", content: `Resumo da conversa anterior: ${resumoHistorico}` }]
                : []),

            ...history.map(h => ({
                role: h.role,
                content: h.message
            })),

            { role: "user", content: mensagem }
        ];

        // 5️⃣ Chamada GPT
        const completion = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages,
            temperature: 0.5
        });

        const resposta = completion.choices[0].message.content;
        const respostaFinal = resposta?.trim() || "Não consegui entender a pergunta.";

        // 6️⃣ Salvar histórico
        await addConversation(phone, "assistant", respostaFinal);

        // 7️⃣ IMPORTANTE: NÃO enviar aqui — apenas retornar
        return respostaFinal;

    } catch (err) {
        logError(err, {
            local: "respostaGPT",
            phone,
            mensagem
        });

        return "⚠️ A IA encontrou um erro. Tente novamente em instantes.";
    }
}

// ==================================================
// 🔧 Redução de histórico
// ==================================================
function gerarResumoSeNecessario(history) {
    if (history.length < 10) return null;

    const resumo = history
        .slice(0, history.length - 8)
        .map(h => `${h.role === "user" ? "Usuário" : "Assistente"}: ${h.message}`)
        .join(" | ");

    return resumo.length > 800 ? resumo.slice(0, 800) + "..." : resumo;
}
