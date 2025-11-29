// =========================================
// 📌 PECUÁRIA PRO - WhatsApp Bot Completo
// Sistema Antigo + Sistema de LOTES + Nome do Usuário
// =========================================

import express from "express";
import axios from "axios";
import OpenAI from "openai";
import dotenv from "dotenv";

import { detectIntent } from "./services/nlp.js";

import {
    calcularDieta,
    custoPorArroba,
    calcularUA,
    calcularLotacao
} from "./services/cattle.js";

import {
    extrairPesoDaMensagem,
    extrairQuantidadeDaMensagem,
    extrairCustoDaMensagem,
    extrairAreaHa
} from "./services/extract.js";

import {
    formatDieta,
    formatCustoArroba,
    formatUA,
    formatLotacao,
    formatError,
    formatMissingData
} from "./services/formatter.js";

import {
    getUser,
    createUser,
    updateUser,
    addConversation,
    getConversationHistory,

    // SISTEMA ANTIGO
    createAnimal,
    getAnimalsByUser,
    updateAnimal,
    deleteAnimal,

    // SISTEMA DE LOTES (NOVO)
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
// ⛔ EVITAR MENSAGENS DUPLICADAS
// =========================================
const processedMessages = new Set();

// =========================================
// 🔗 CONFIG ULTRAMSG
// =========================================

const ULTRA_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID;
const ULTRA_TOKEN = process.env.ULTRAMSG_TOKEN;
const ULTRA_API_URL = process.env.ULTRAMSG_API_URL;

// =========================================
// 🤖 CONFIG OPENAI (GPT-4o-mini)
// =========================================

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// =========================================
// 📤 ENVIAR MENSAGEM PARA O WHATSAPP
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
// 🧠 SYSTEM PROMPT – COM NOME DO USUÁRIO
// =========================================
const systemPrompt = `
Você é o PECUÁRIA PRO, especialista em bovinos.
O nome do usuário é: {{userName}}

Responda sempre em até 5 linhas, de forma prática e estilo WhatsApp.

REGRAS IMPORTANTES:
- Não repita informações.
- Não invente dados.
- Evite listas longas.
- Se faltar informação, peça APENAS o essencial.

📦 LOTES — JSON OBRIGATÓRIO para cadastro:
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

📌 Importante:
• Se o usuário não mencionar "lote", use o sistema antigo de animais.
• Pode entender linguagem natural e linguagem técnica.
`;

// =========================================
// 🌐 TESTE RÁPIDO DO WEBHOOK
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
    // 👤 CRIAÇÃO E ATUALIZAÇÃO DO USUÁRIO
    // =========================================

    let user = getUser(phone);

    if (!user) {
        createUser(phone, data.pushname || "Cliente");
        user = getUser(phone);
    } else {
        // Atualiza nome caso tenha mudado no WhatsApp
        if (data.pushname && data.pushname !== user.name) {
            updateUser(phone, { name: data.pushname });
        }
    }

    updateUser(phone, {
        last_message: message,
        last_interaction: new Date().toISOString()
    });

    // Salvar histórico — mensagem do usuário
    addConversation(phone, "user", message);

    // =========================================
    // 🧠 DETECTAR INTENÇÃO
    // =========================================

    const intent = detectIntent(message);
    console.log("🧠 INTENÇÃO:", intent);

    // =========================================
    // 🔶 SISTEMA ANTIGO – DIETA
    // =========================================

    if (intent.intent === "diet") {
        const peso = extrairPesoDaMensagem(message);
        const qtd = extrairQuantidadeDaMensagem(message);

        if (!peso)
            return await sendMessage(phone, formatError("Informe o peso (ex.: 380kg)"));

        const result = calcularDieta(peso, qtd);
        return await sendMessage(phone, formatDieta(result, peso, qtd));
    }

    // =========================================
    // 🔷 SISTEMA ANTIGO – CUSTO POR ARROBA
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
    // 🔶 SISTEMA ANTIGO – UA
    // =========================================

    if (intent.intent === "ua_calc") {
        const peso = extrairPesoDaMensagem(message);
        const qtd = extrairQuantidadeDaMensagem(message);

        if (!peso)
            return await sendMessage(phone, formatError("Informe o peso (ex.: 420kg)"));

        const ua = calcularUA(peso);
        const totalUA = ua * qtd;

        return await sendMessage(phone, formatUA(totalUA));
    }

    // =========================================
    // 🔷 SISTEMA ANTIGO – LOTAÇÃO
    // =========================================

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
    // 🔶 SISTEMA ANTIGO – CADASTRAR ANIMAL
    // =========================================

    if (intent.intent === "register_animal") {
        const nome = /nome[:=]\s*([a-zA-Z0-9 ]+)/i.exec(message)?.[1];
        const peso = /peso[:=]\s*([0-9.,]+)/i.exec(message)?.[1];
        const idade = /idade[:=]\s*([0-9]+)/i.exec(message)?.[1];
        const raca = /raca[:=]\s*([a-zA-Z0-9 ]+)/i.exec(message)?.[1];
        const anotacoes = /obs[:=]\s*(.*)/i.exec(message)?.[1] || "";

        if (!nome || !peso)
            return await sendMessage(phone,
                "🐄 Cadastro incompleto.\nExemplo:\n" +
                "cadastrar nome: nelore, peso: 380, idade: 3, raca: gir"
            );

        createAnimal(phone, nome, raca, peso, idade, anotacoes);

        return await sendMessage(phone, "🐮 Animal cadastrado com sucesso!");
    }

    // =========================================
    // 🔷 SISTEMA ANTIGO – LISTAR ANIMAIS
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
    // 🤖 GPT FALLBACK
    // =========================================

    if (!GPT_ATIVO)
        return await sendMessage(phone, "⚠️ GPT desativado.");

    const history = getConversationHistory(phone, 10);

    const conversationMessages = [
        {
            role: "system",
            content: systemPrompt.replace("{{userName}}", user.name || "Cliente")
        },
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
    } catch (err) {
        console.log(err);
        return await sendMessage(phone, "❌ Erro no GPT.");
    }

    // =========================================
    // 🔍 PROCURAR JSON DO GPT
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

        // 1️⃣ REGISTRAR ANIMAL EM LOTE
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

        // 2️⃣ LISTAR TODOS OS LOTES
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

        // 3️⃣ LISTAR ANIMAIS DE UM LOTE
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
    // 🗣️ SE NÃO TEVE JSON → RESPONDER NORMAL
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
