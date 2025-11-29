// =========================================
// 📌 PECUÁRIA PRO - WhatsApp Bot Completo
// =========================================

import express from "express";
import axios from "axios";
import OpenAI from "openai";
import dotenv from "dotenv";

// NLP
import { detectIntent } from "./services/nlp.js";

// CALCULOS
import {
    calcularDieta,
    custoPorArroba,
    calcularUA,
    calcularLotacao
} from "./services/cattle.js";

// EXTRAÇÃO
import {
    extrairPesoDaMensagem,
    extrairQuantidadeDaMensagem,
    extrairCustoDaMensagem,
    extrairAreaHa
} from "./services/extract.js";

// FORMATAÇÃO
import {
    formatDieta,
    formatCustoArroba,
    formatUA,
    formatLotacao,
    formatError,
    formatMissingData
} from "./services/formatter.js";

// DATABASE
import {
    getUser,
    createUser,
    updateUser,
    addConversation,
    getConversationHistory,
    createAnimal,
    getAnimalsByUser,
    getAnimalById,
    updateAnimal,
    deleteAnimal
} from "./database.js";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// =========================================
// 🔧 MODO: ATIVAR/DESATIVAR GPT
// =========================================
const GPT_ATIVO = true;

// =========================================
// ⛔ ANTI-DUPLICAÇÃO
// =========================================
const processedMessages = new Set();

// =========================================
// 🔗 CONFIG ULTRAMSG
// =========================================

const ULTRA_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID;
const ULTRA_TOKEN = process.env.ULTRAMSG_TOKEN;
const ULTRA_API_URL = process.env.ULTRAMSG_API_URL;

// =========================================
// 🤖 CONFIG OPENAI
// =========================================

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// =========================================
// 📤 FUNÇÃO PARA ENVIAR MENSAGEM WHATSAPP
// =========================================

async function sendMessage(phone, message) {
    try {
        await axios.post(
            `${ULTRA_API_URL}/${ULTRA_INSTANCE_ID}/messages/chat`,
            {
                to: phone,
                body: message,
                priority: "normal",
            },
            {
                params: { token: ULTRA_TOKEN },
                headers: { "Content-Type": "application/json" }
            }
        );

        console.log("📤 Enviado para:", phone);
    } catch (err) {
        console.error("❌ Erro ao enviar:", err.response?.data || err);
    }
}

// =========================================
// 🧠 SYSTEM PROMPT PARA GPT
// =========================================

const systemPrompt = `
Você é o PECUÁRIA PRO, especialista em bovinos. 
Seu objetivo é responder de forma curta, clara e prática (máx. 6 linhas). Estilo WhatsApp.

REGRAS IMPORTANTES:
- Não repetir informações.
- Nada de textos longos ou explicações científicas.
- Não use “ler mais”.
- Não dizer que não pode armazenar dados.
- Evite bullets em excesso.
- Sempre que o usuário solicitar cadastro, registro, adicionar animal, ficha ou similar:
  Responda brevemente e devolva um JSON assim:

  {
    "acao": "registrar_animal",
    "tipo": "...",
    "raca": "...",
    "quantidade": "...",
    "idade": "...",
    "sexo": "...",
    "observacao": "..."
  }

- Para pedidos de listagem de animais:
  { "acao": "listar_animais" }

- Nunca invente dados. Se faltar alguma informação essencial, peça APENAS o necessário.
- Mantenha tom de consultor rural prático.
`;

// =========================================
// 🌐 TESTE WEBHOOK
// =========================================

app.get("/webhook", (req, res) => {
    res.status(200).send("Webhook OK");
});

// =========================================
// 📩 WEBHOOK PRINCIPAL
// =========================================

app.post("/webhook", async (req, res) => {
    res.sendStatus(200);

    const data = req.body.data;
    if (!data) return;

    console.log("📦 Recebido:\n", JSON.stringify(req.body, null, 2));

    if (data.fromMe === true) return;
    if (["sent", "delivered", "read"].includes(data.ack)) return;
    if (data.type !== "chat") return;

    const msgId = data.id;
    if (!msgId) return;

    if (processedMessages.has(msgId)) return;
    processedMessages.add(msgId);

    const phone = data.from.replace("@c.us", "");
    const message = data.body || "";

    // USUÁRIO
    let user = getUser(phone);
    if (!user) {
        createUser(phone, data.pushname || null);
        user = getUser(phone);
    }

    updateUser(phone, {
        last_message: message,
        last_interaction: new Date().toISOString()
    });

    addConversation(phone, "user", message);

    // INTENÇÃO
    const intent = detectIntent(message);
    console.log("🧠 INTENÇÃO:", intent);

    // =========================================
    // 🟩 DIETA
    // =========================================

    if (intent.intent === "diet") {
        const peso = extrairPesoDaMensagem(message);
        const qtd = extrairQuantidadeDaMensagem(message);

        if (!peso)
            return await sendMessage(phone, formatError("Informe o peso. Ex.: boi de 380kg"));

        const result = calcularDieta(peso, qtd);
        return await sendMessage(phone, formatDieta(result, peso, qtd));
    }

    // =========================================
    // 🟦 CUSTO POR ARROBA
    // =========================================

    if (intent.intent === "arroba_cost") {
        const peso = extrairPesoDaMensagem(message);
        const custo = extrairCustoDaMensagem(message);

        if (!peso || !custo)
            return await sendMessage(phone, formatMissingData());

        const result = custoPorArroba(custo, peso);
        return await sendMessage(phone, formatCustoArroba(result, peso, custo));
    }

    // =========================================
    // 🟧 UA
    // =========================================

    if (intent.intent === "ua_calc") {
        const peso = extrairPesoDaMensagem(message);
        const qtd = extrairQuantidadeDaMensagem(message);

        if (!peso)
            return await sendMessage(phone, formatError("Informe peso. Ex.: UA boi 420kg"));

        const uaPorAnimal = calcularUA(peso);
        const totalUA = uaPorAnimal * qtd;

        return await sendMessage(phone, formatUA(totalUA));
    }

    // =========================================
    // 🟨 LOTAÇÃO UA/HA
    // =========================================

    if (intent.intent === "lotacao_calc") {
        const peso = extrairPesoDaMensagem(message);
        const qtd = extrairQuantidadeDaMensagem(message);
        const area = extrairAreaHa(message);

        if (!peso || !qtd || !area)
            return await sendMessage(phone, formatMissingData());

        const uaPorAnimal = calcularUA(peso);
        const totalUA = uaPorAnimal * qtd;

        const lotacao = calcularLotacao(totalUA, area);

        return await sendMessage(phone, formatLotacao(lotacao));
    }

    // =========================================
    // 🟫 CADASTRO DE ANIMAL
    // =========================================

    if (intent.intent === "register_animal") {
        const nome = /nome[:=]\s*([a-zA-Z0-9 ]+)/i.exec(message)?.[1];
        const peso = /peso[:=]\s*([0-9.,]+)/i.exec(message)?.[1];
        const idade = /idade[:=]\s*([0-9]+)/i.exec(message)?.[1];
        const raca = /raca[:=]\s*([a-zA-Z0-9 ]+)/i.exec(message)?.[1];
        const anotacoes = /obs[:=]\s*(.*)/i.exec(message)?.[1] || "";

        if (!nome || !peso)
            return await sendMessage(phone,
                "🐄 Cadastro incompleto!\nExemplo:\n" +
                "cadastrar nome: nelore, peso: 380, idade: 3, raca: gir"
            );

        createAnimal(phone, nome, raca, peso, idade, anotacoes);

        return await sendMessage(phone, "✅ Animal cadastrado!");
    }

    // =========================================
    // 🟫 LISTAR ANIMAIS
    // =========================================

    if (intent.intent === "list_animals") {
        const animais = getAnimalsByUser(phone);

        if (animais.length === 0)
            return await sendMessage(phone, "📭 Você não tem animais cadastrados.");

        let texto = "🐮 *Seus Animais*\n\n";

        animais.forEach(a => {
            texto += `
ID: *${a.id}*
🐂 Nome: *${a.name}*
⚖️ Peso: *${a.weight} kg*
📅 Idade: *${a.age} anos*
🐮 Raça: *${a.breed}*\n\n`;
        });

        return await sendMessage(phone, texto);
    }

    // =========================================
    // 🟫 EDITAR ANIMAL
    // =========================================

    if (intent.intent === "update_animal") {
        const id = /animal\s+([0-9]+)/i.exec(message)?.[1];

        if (!id)
            return await sendMessage(phone, "❌ Envie: editar animal 5 peso: 450");

        const nome = /nome[:=]\s*([a-zA-Z0-9 ]]+)/i.exec(message)?.[1];
        const peso = /peso[:=]\s*([0-9.,]+)/i.exec(message)?.[1];
        const idade = /idade[:=]\s*([0-9]+)/i.exec(message)?.[1];
        const raca = /raca[:=]\s*([a-zA-Z0-9 ]+)/i.exec(message)?.[1];
        const anotacoes = /obs[:=]\s*(.*)/i.exec(message)?.[1];

        updateAnimal(id, nome, raca, peso, idade, anotacoes);

        return await sendMessage(phone, "✏️ Animal atualizado.");
    }

    // =========================================
    // 🟫 APAGAR ANIMAL
    // =========================================

    if (intent.intent === "delete_animal") {
        const id = /animal\s+([0-9]+)/i.exec(message)?.[1];

        if (!id)
            return await sendMessage(phone, "❌ Envie: apagar animal 3");

        deleteAnimal(id);

        return await sendMessage(phone, "🗑️ Animal apagado!");
    }

    // =========================================
    // 🔴 GPT DESATIVADO — MODO TESTE MANUAL
    // =========================================

    if (!GPT_ATIVO) {
        return await sendMessage(
            phone,
            "⚠️ GPT desativado.\nUse comandos:\n\n" +
            "• dieta 380kg\n" +
            "• custo 1.20 peso 450kg\n" +
            "• UA 420kg\n" +
            "• lotação 20 bois 350kg 8ha\n" +
            "• cadastrar nome: boi, peso: 320\n" +
            "• listar animais\n"
        );
    }

    // =========================================
    // 🧠 GPT FALLBACK
    // =========================================

    const history = getConversationHistory(phone, 10);

    const conversationMessages = [
        { role: "system", content: systemPrompt },
        ...history.map(h => ({ role: h.role, content: h.message })),
        { role: "user", content: message }
    ];

    let resposta;

    try {
        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: conversationMessages,
            temperature: 0.7
        });

        resposta = completion.choices[0].message.content;

    } catch {
        return await sendMessage(phone, "❌ Erro GPT.");
    }
    // =========================================
// 🔍 VERIFICAR SE O GPT MANDOU JSON
// =========================================

let jsonAcao = null;

try {
    const jsonMatch = resposta.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        jsonAcao = JSON.parse(jsonMatch[0]);
        console.log("🔎 JSON detectado:", jsonAcao);
    }
} catch (e) {
    console.log("⚠️ Nenhum JSON válido.");
}


// =========================================
// 🐄 EXECUTAR AÇÕES DO GPT
// =========================================

if (jsonAcao) {

    if (jsonAcao.acao === "registrar_animal") {

        createAnimal(
            phone,
            jsonAcao.tipo || null,
            jsonAcao.raca || null,
            jsonAcao.quantidade || null,
            jsonAcao.idade || null,
            jsonAcao.sexo || null,
            jsonAcao.observacao || null
        );

        return await sendMessage(phone, "🐮 Animal registrado com sucesso!");
    }


    if (jsonAcao.acao === "listar_animais") {

        const animais = getAnimalsByUser(phone);

        if (animais.length === 0)
            return await sendMessage(phone, "📭 Você não tem animais cadastrados.");

        let texto = "🐮 *Seus Animais*\n\n";

        animais.forEach(a => {
            texto += `• ${a.tipo} ${a.raca ? "(" + a.raca + ")" : ""} — ${a.quantidade}\n`;
        });

        return await sendMessage(phone, texto);
    }
}


// =========================================
// Se não houver JSON → enviar texto normal
// =========================================

    addConversation(phone, "assistant", resposta);
    return await sendMessage(phone, resposta);
});

// =========================================
// 🚀 INICIAR SERVIDOR
// =========================================

app.listen(PORT, () => {
    console.log(`🚀 Pecuária Pro rodando na porta ${PORT}`);
});
