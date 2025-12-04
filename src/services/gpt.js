import OpenAI from "openai";
import { config } from "../config/env.js";

const openai = new OpenAI({ apiKey: config.OPENAI_KEY });

export async function respostaGPT(phone, msg) {
    const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
            { role: "system", content: "Você é o assistente da Pecuária Pro." },
            { role: "user", content: msg }
        ]
    });

    return completion.choices[0].message.content;
}
