import OpenAI from "openai";
import { sendMessage } from "../services/whatsapp.js";

import {
    registrarAnimal,
    atualizarAnimal,
    deletarAnimal,
    listarAnimais
} from "./animalController.js";

import { adicionarAoLote, listarTodosLotes } from "./loteController.js";
import { recuperarHistorico } from "./userController.js";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// ------------------------------------------------------
// SYSTEM PROMPT v5 — MODO ESPECIALISTA COMPLETO
// ------------------------------------------------------
const systemPrompt = `
Você é o assistente oficial da Pecuária Pro.
Comporta-se como Zootecnista e Veterinário especialista.

📌 Estilo de resposta:
- Explicações completas, claras e detalhadas.
- Sempre pedagógico.
- Sempre recomenda veterinário no final.
- Nunca envia respostas curtas como "OK", "Certo", "Sim".
- Nunca envia JSON exceto ações do sistema.

📌 JSON permitido SOMENTE para:
1) registrar_animal
2) atualizar_animal
3) deletar_animal
4) listar_animais
5) adicionar_lote
6) listar_lotes
`;

// ------------------------------------------------------
// PROCESSAMENTO PRINCIPAL GPT
// ------------------------------------------------------
export async function processAI(phone, message, userName) {
    try {
        const history = await recuperarHistorico(phone, 6);

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "system", content: `Nome do usuário: ${userName}` },
            ...history.map(h => ({ role: h.role, content: h.message })),
            { role: "user", content: message }
        ];

        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages
        });

        let resposta = completion.choices[0].message.content.trim();

        // Anti-resposta curta
        if (resposta.length < 15) {
            resposta = "Entendi! Pode me explicar melhor para que eu possa ajudar de forma completa?";
        }

        // Tentar extrair JSON
        const json = extrairJSONSeguro(resposta);
        if (!json) return sendMessage(phone, resposta);

        return executarAcaoJSON(phone, json);

    } catch (err) {
        console.error("Erro no AI:", err);
        return sendMessage(phone, "⚠️ Ocorreu um erro ao processar sua solicitação.");
    }
}

// ------------------------------------------------------
// EXTRATOR DE JSON
// ------------------------------------------------------
function extrairJSONSeguro(text) {
    try {
        const match = text.match(/\{[\s\S]*?\}/g);
        if (!match) return null;

        for (const bloco of match) {
            try {
                const json = JSON.parse(bloco);

                const acoesValidas = [
                    "registrar_animal",
                    "atualizar_animal",
                    "deletar_animal",
                    "listar_animais",
                    "adicionar_lote",
                    "listar_lotes"
                ];

                if (acoesValidas.includes(json?.acao)) return json;

            } catch { }
        }

        return null;

    } catch {
        return null;
    }
}

// ------------------------------------------------------
// EXECUTOR DE AÇÕES
// ------------------------------------------------------
async function executarAcaoJSON(phone, json) {
    switch (json.acao) {
        case "registrar_animal": return registrarAnimal(phone, json);
        case "atualizar_animal": return atualizarAnimal(phone, json);
        case "deletar_animal": return deletarAnimal(phone, json.numero_boi);
        case "listar_animais": return listarAnimais(phone);
        case "adicionar_lote": return adicionarAoLote(phone, json);
        case "listar_lotes": return listarTodosLotes(phone);
        default: return sendMessage(phone, "⚠️ Ação desconhecida.");
    }
}
