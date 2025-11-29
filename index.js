// =========================================
// 📌 PECUÁRIA PRO - WhatsApp Bot Completo
// Sistema Antigo + Sistema de LOTES (Novidade)
// =========================================

import express from "express";
import axios from "axios";
import OpenAI from "openai";
import dotenv from "dotenv";

// NLP (detecta intenção do usuário)
import { detectIntent } from "./services/nlp.js";

// Funções de cálculos pecuários
import {
    calcularDieta,
    custoPorArroba,
    calcularUA,
    calcularLotacao
} from "./services/cattle.js";

// Funções de EXTRAÇÃO (peso, quantidade, área, etc.)
import {
    extrairPesoDaMensagem,
    extrairQuantidadeDaMensagem,
    extrairCustoDaMensagem,
    extrairAreaHa
} from "./services/extract.js";

// Respostas formatadas
import {
    formatDieta,
    formatCustoArroba,
    formatUA,
    formatLotacao,
    formatError,
    formatMissingData
} from "./services/formatter.js";

// BANCO DE DADOS (funções antigas + novos lotes)
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
    deleteAnimal,

    // NOVAS FUNÇÕES (LOTES)
    addAnimalToLote,
    getAllLotes,
    getLote
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
// ⛔ ANTI-DUPLICAÇÃO (evita duplicar respostas)
// =========================================
const processedMessages = new Set();

// =========================================
// 🔗 CONFIG ULTRAMSG
// =========================================

const ULTRA_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID;
const ULTRA_TOKEN = process.env.ULTRAMSG_TOKEN;
const ULTRA_API_URL = process.env.ULTRAMSG_API_URL;

// =========================================
// 🤖 CONFIG OPENAI (GPT)
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
// 🧠 SYSTEM PROMPT – AGORA COM LOTES
// =========================================

/*
Este prompt foi ajustado para:

• Responder curto e limpo
• Não repetir
• Não inventar
• Atender linguagem natural e técnica
• Usar JSON SOMENTE para LOTES
• Sistema antigo de animais continua funcionando
*/

const systemPrompt = `
Você é o PECUÁRIA PRO, especialista em bovinos.
Responda em até 5 linhas. Estilo WhatsApp.

REGRAS:
- Nada de textos longos.
- Nada de explicações científicas.
- Nada de inventar dados.
- Evite bullets demais.
- Sempre peça apenas o essencial.

📦 LOTES — JSON OBRIGATÓRIO:
Para cadastrar um animal em um lote:
{
  "acao": "registrar_animal_lote",
  "lote": 1,
  "tipo": "...",
  "raca": "...",
  "peso": "...",
  "idade": "...",
  "sexo": "...",
  "quantidade": 1,
  "observacao": "..."
}

Para listar todos os lotes:
{ "acao": "listar_lotes" }

Para listar um lote específico:
{
  "acao": "listar_lote",
  "lote": 1
}

📌 Importante: Para “cadastrar animal” sem mencionar lote,
responda normalmente (sistema antigo).
`;

// =========================================
// 🌐 TESTE RÁPIDO DO WEBHOOK
// =========================================

app.get("/webhook", (req, res) => {
    res.status(200).send("Webhook OK");
});

// =========================================
// 📩 WEBHOOK PRINCIPAL (CORAÇÃO DO BOT)
// =========================================

app.post("/webhook", async (req, res) => {
    res.sendStatus(200);

    const data = req.body.data;
    if (!data) return;

    if (data.fromMe === true) return;
    if (["sent", "delivered", "read"].includes(data.ack)) return;
    if (data.type !== "chat") return;

    const msgId = data.id;
    if (!msgId) return;

    if (processedMessages.has(msgId)) return;
    processedMessages.add(msgId);

    const phone = data.from.replace("@c.us", "");
    const message = data.body || "";

    // =========================================
    // 👤 USUÁRIO NO BANCO
    // =========================================

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

    // =========================================
    // 🧠 DETECTAR INTENÇÃO (NLP)
    // =========================================

    const intent = detectIntent(message);
    console.log("🧠 INTENÇÃO:", intent);

    // =========================================
    // 🔰 SISTEMA ANTIGO
    // =========================================
    // (Dietas, custo, UA, lotação, cadastro simples)
    // =========================================

    if (intent.intent === "diet") {
        const peso = extrairPesoDaMensagem(message);
        const qtd = extrairQuantidadeDaMensagem(message);

        if (!peso)
            return await sendMessage(phone, formatError("Informe o peso (ex.: boi 380kg)"));

        const result = calcularDieta(peso, qtd);
        return await sendMessage(phone, formatDieta(result, peso, qtd));
    }

    if (intent.intent === "arroba_cost") {
        const peso = extrairPesoDaMensagem(message);
        const custo = extrairCustoDaMensagem(message);

        if (!peso || !custo)
            return await sendMessage(phone, formatMissingData());

        const result = custoPorArroba(custo, peso);
        return await sendMessage(phone, formatCustoArroba(result, peso, custo));
    }

    if (intent.intent === "ua_calc") {
        const peso = extrairPesoDaMensagem(message);
        const qtd = extrairQuantidadeDaMensagem(message);

        if (!peso)
            return await sendMessage(phone, formatError("Informe peso. Ex.: UA boi 420kg"));

        const uaAnimal = calcularUA(peso);
        const totalUA = uaAnimal * qtd;

        return await sendMessage(phone, formatUA(totalUA));
    }

    if (intent.intent === "lotacao_calc") {
        const peso = extrairPesoDaMensagem(message);
        const qtd = extrairQuantidadeDaMensagem(message);
        const area = extrairAreaHa(message);

        if (!peso || !qtd || !area)
            return await sendMessage(phone, formatMissingData());

        const ua = calcularUA(peso);
        const totalUA = ua * qtd;

        const lotacao = calcularLotacao(totalUA, area);

        return await sendMessage(phone, formatLotacao(lotacao));
    }

    // =========================================
    // 🐄 ANTIGO – CADASTRO MANUAL DE ANIMAIS
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

        return await sendMessage(phone, "🐮 Animal cadastrado com sucesso!");
    }

    // =========================================
    // 🐄 ANTIGO – LISTAR ANIMAIS
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
    // 🧠 GPT - FALLBACK (ULTIMO RECURSO)
    // =========================================

    if (!GPT_ATIVO) {
        return await sendMessage(phone, "⚠️ GPT desativado.");
    }

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
            temperature: 0.6
        });

        resposta = completion.choices[0].message.content;

    } catch {
        return await sendMessage(phone, "❌ Erro no GPT.");
    }

    // =========================================
    // 🔍 PROCURAR JSON NA RESPOSTA DO GPT
    // =========================================

    let jsonAcao = null;

    try {
        const jsonMatch = resposta.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonAcao = JSON.parse(jsonMatch[0]);
            console.log("🔎 JSON detectado:", jsonAcao);
        }
    } catch {
        console.log("⚠️ JSON inválido");
    }

    // =========================================
    // 📦 SISTEMA DE LOTES (NOVO)
    // =========================================

    if (jsonAcao) {

        // 1️⃣ Registrar animal em lote
        if (jsonAcao.acao === "registrar_animal_lote") {

            addAnimalToLote(
                phone,
                jsonAcao.lote,
                jsonAcao.tipo,
                jsonAcao.raca,
                jsonAcao.peso,
                jsonAcao.idade,
                jsonAcao.sexo,
                jsonAcao.quantidade,
                jsonAcao.observacao
            );

            return await sendMessage(phone, `🐮 Animal registrado no lote ${jsonAcao.lote}!`);
        }

        // 2️⃣ Listar todos os lotes
        if (jsonAcao.acao === "listar_lotes") {

            const lotes = getAllLotes(phone);

            if (lotes.length === 0)
                return await sendMessage(phone, "📭 Você não tem lotes registrados.");

            let texto = "📦 *Lotes Registrados:*\n\n";

            lotes.forEach(l => {
                texto += `• Lote ${l.numero_lote}: ${l.total_animais} animal(is)\n`;
            });

            return await sendMessage(phone, texto);
        }

        // 3️⃣ Listar um lote específico
        if (jsonAcao.acao === "listar_lote") {

            const animais = getLote(phone, jsonAcao.lote);

            if (animais.length === 0)
                return await sendMessage(phone, `📭 O lote ${jsonAcao.lote} está vazio.`);

            let texto = `📦 *Lote ${jsonAcao.lote}:*\n\n`;

            animais.forEach(a => {
                texto += `🐂 ${a.tipo} (${a.raca}) — ${a.peso}, idade: ${a.idade}, sexo: ${a.sexo}\n`;
            });

            return await sendMessage(phone, texto);
        }
    }

    // =========================================
    // 🗣️ Se não teve JSON → responde normal
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
