// =========================================
// 🤖 AI CONTROLLER – GPT + JSON + AÇÕES
// =========================================

import OpenAI from "openai";

import { 
    registrarAnimal,
    atualizarAnimal,
    deletarAnimal,
    listarAnimais
} from "./animalController.js";

import {
    adicionarAoLote,
    listarLote,
    listarTodosLotes
} from "./loteController.js";

import {
    recuperarHistorico
} from "./userController.js";

import { sendMessage } from "../services/whatsapp.js";

// =========================================
// GPT INIT
// =========================================
const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// =========================================
// SYSTEM PROMPT (SEGURO)
// =========================================
const systemPrompt = `
Você é o assistente oficial da PECUÁRIA PRO.

⚠️ REGRAS IMPORTANTES:
- NUNCA envie JSON ao listar lote individual.
- Apenas responda "OK" se o usuário pedir para listar lote 1, lote 2, etc.
- O servidor executa essa ação localmente.
- JSON só é permitido para:

1) registrar_animal
2) atualizar_animal
3) deletar_animal
4) listar_animais
5) adicionar_lote
6) listar_lotes (todos)

⚠️ Se o usuário perguntar algo sobre:
- doenças
- manejo
- pastagem
- nutrição
- vacinas
- curiosidades
→ responda em texto normal.

Se JSON for usado, ele DEVE seguir este formato:

{
  "acao": "registrar_animal",
  ...
}

Somente isso. Não adicione texto fora do JSON.
`;

// =========================================
// PROCESSADOR GPT PRINCIPAL
// =========================================
export async function processAI(phone, message, userName) {
    try {
        // Histórico
        const history = await recuperarHistorico(phone, 6);

        const messages = [
            { role: "system", content: systemPrompt },
            { role: "system", content: `Nome do usuário: ${userName || "produtor"}` },
            ...history.map(h => ({ role: h.role, content: h.message })),
            { role: "user", content: message }
        ];

        // Chama GPT
        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages
        });

        const resposta = completion.choices[0].message.content;

        // Tenta extrair JSON
        const json = extrairJSONSeguro(resposta);

        if (!json) {
            // Apenas texto normal
            return sendMessage(phone, resposta);
        }

        // JSON válido → executar ação
        return executarAcaoJSON(phone, json);

    } catch (err) {
        console.error("Erro no AI Controller:", err);
        return sendMessage(phone, "⚠️ Erro ao processar sua solicitação.");
    }
}

// =========================================
// EXTRATOR DE JSON SEGURO
// =========================================
function extrairJSONSeguro(texto) {
    try {
        const regex = /\{[\s\S]*?\}/g;
        const bloco = texto.match(regex);

        if (!bloco) return null;

        for (const b of bloco) {
            try {
                const json = JSON.parse(b);

                const acoesValidas = [
                    "registrar_animal",
                    "atualizar_animal",
                    "deletar_animal",
                    "listar_animais",
                    "adicionar_lote",
                    "listar_lotes"
                ];

                if (json?.acao && acoesValidas.includes(json.acao)) {
                    return json;
                }

            } catch {}
        }

        return null;

    } catch {
        return null;
    }
}

// =========================================
// EXECUTOR DE AÇÕES JSON
// =========================================
async function executarAcaoJSON(phone, json) {

    switch (json.acao) {
        case "registrar_animal":
            return registrarAnimal(phone, json);

        case "atualizar_animal":
            return atualizarAnimal(phone, json);

        case "deletar_animal":
            return deletarAnimal(phone, json.numero_boi);

        case "listar_animais":
            return listarAnimais(phone);

        case "adicionar_lote":
            return adicionarAoLote(phone, json);

        case "listar_lotes":
            return listarTodosLotes(phone);

        default:
            return sendMessage(phone, "⚠️ Ação não reconhecida.");
    }
}
