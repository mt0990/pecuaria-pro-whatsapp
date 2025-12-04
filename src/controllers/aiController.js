import OpenAI from "openai";
import { logError, logInfo } from "../utils/logger.js";
import { sendMessage } from "./whatsapp.js";

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

        return response.output_text;

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
