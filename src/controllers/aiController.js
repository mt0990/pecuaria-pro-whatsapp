import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";
import { logError, logInfo } from "../utils/logger.js";
import { sendMessage } from "../services/whatsapp.js";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function respostaGPT(phone, mensagem) {

    logInfo("➡️ Enviando prompt ao GPT", { phone, mensagem });

    const prompt = `
Você é o assistente de pecuária. 
Responda de forma clara, objetiva e específica.

Mensagem do usuário:
"${mensagem}"
`;

    try {

        const response = await openai.responses.create({
            model: "gpt-4.1-mini",
            input: prompt
        });

        logInfo("🧠 GPT respondeu com sucesso", { phone });

        const texto =
            response.output_text ||
            response.output?.[0]?.content?.[0]?.text ||
            "Não consegui gerar resposta.";

        return texto;

    } catch (err) {

        logError(err, {
            local: "respostaGPT",
            phone,
            mensagem,
            prompt
        });

        await sendMessage(
            phone,
            "⚠️ Desculpe, ocorreu um erro ao acessar o GPT. Tente novamente."
        );

        return null;
    }
}
