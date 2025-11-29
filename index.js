// =========================================
// 📌 PECUÁRIA PRO - WhatsApp Bot Completo
// =========================================

import express from "express";
import axios from "axios";
import OpenAI from "openai";
import dotenv from "dotenv";

// NLP
import { detectIntent } from "./services/nlp.js";

// Cálculos (não interferem com lotes)
import {
    calcularDieta,
    custoPorArroba,
    calcularUA,
    calcularLotacao
} from "./services/cattle.js";

// Extração
import {
    extrairPesoDaMensagem,
    extrairQuantidadeDaMensagem,
    extrairCustoDaMensagem,
    extrairAreaHa
} from "./services/extract.js";

// Formatação
import {
    formatDieta,
    formatCustoArroba,
    formatUA,
    formatLotacao,
    formatError,
    formatMissingData
} from "./services/formatter.js";

// Banco de dados (com LOTES funcionando)
import {
    getUser,
    createUser,
    updateUser,
    addConversation,
    getConversationHistory,
    createAnimal,
    getAnimalsByUser,
    updateAnimal,
    deleteAnimal,
    getLote,
    getAllLotes,
    addAnimalToLote
} from "./database.js";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// =========================================
// 🔧 CONFIG
// =========================================

const GPT_ATIVO = true;

const processedMessages = new Set();

const ULTRA_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID;
const ULTRA_TOKEN = process.env.ULTRAMSG_TOKEN;
const ULTRA_API_URL = process.env.ULTRAMSG_API_URL;

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// =========================================
// 📤 Função universal de envio
// =========================================

async function sendMessage(phone, message) {
    try {
        await axios.post(
            `${ULTRA_API_URL}/${ULTRA_INSTANCE_ID}/messages/chat`,
            { to: phone, body: message },
            { params: { token: ULTRA_TOKEN } }
        );
    } catch (err) {
        console.error("❌ Erro ao enviar:", err.response?.data || err);
    }
}

// =========================================
// 🧠 SYSTEM PROMPT — Ajustado para LOTES
// =========================================

const systemPrompt = `
Você é o PECUÁRIA PRO, especialista em bovinos. 
Responda sempre curto, direto, claro e prático.

⚠ Regras:
- Nunca repetir textos.
- Nunca explicar demais.
- Não usar "ler mais".
- Nunca dizer que não armazena dados.
- Quando detectar cadastro de ANIMAL:
{
 "acao": "registrar_animal",
 "tipo": "",
 "raca": "",
 "peso": "",
 "idade": "",
 "sexo": "",
 "quantidade": "",
 "observacao": ""
}

- Cadastro por LOTE:
{
 "acao": "adicionar_lote",
 "numero_lote": "",
 "tipo": "",
 "raca": "",
 "peso": "",
 "idade": "",
 "sexo": "",
 "quantidade": "",
 "observacao": ""
}

- Listar lotes:
{ "acao": "listar_lotes" }

- Listar um lote:
{ "acao": "listar_lote", "numero_lote": "" }

⚠ Jamais misture lotes com cálculos de dieta/UA/custo.
`;

// =========================================
// 🌐 Webhook Teste
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
    if (!data || data.type !== "chat") return;

    if (data.fromMe) return;

    const phone = data.from.replace("@c.us", "");
    const message = data.body?.trim() || "";

    // Anti duplicação
    if (processedMessages.has(data.id)) return;
    processedMessages.add(data.id);

    // ===== Usuário
    let user = getUser(phone);
    if (!user) createUser(phone, data.pushname);
    updateUser(phone, { last_message: message, last_interaction: new Date().toISOString() });

    addConversation(phone, "user", message);

    // ===== Intenção
    const intent = detectIntent(message);

    // ============================
    // Primeira camada: INTENÇÕES fixas
    // ============================

    // Dieta
    if (intent.intent === "diet") {
        const peso = extrairPesoDaMensagem(message);
        const qtd = extrairQuantidadeDaMensagem(message);
        if (!peso) return sendMessage(phone, "Informe peso. Ex.: boi 380kg");
        return sendMessage(phone, formatDieta(calcularDieta(peso, qtd), peso, qtd));
    }

    // UA
    if (intent.intent === "ua_calc") {
        const peso = extrairPesoDaMensagem(message);
        const qtd = extrairQuantidadeDaMensagem(message);
        if (!peso) return sendMessage(phone, "Informe peso. Ex.: UA boi 420kg");
        return sendMessage(phone, formatUA(calcularUA(peso) * qtd));
    }

    // Custo por arroba
    if (intent.intent === "arroba_cost") {
        const peso = extrairPesoDaMensagem(message);
        const custo = extrairCustoDaMensagem(message);
        if (!peso || !custo) return sendMessage(phone, formatMissingData());
        return sendMessage(phone, formatCustoArroba(custoPorArroba(custo, peso), peso, custo));
    }

    // ==============================
    // GPT fallback (agora com LOTE)
    // ==============================

    const history = getConversationHistory(phone, 10);

    const conversationMessages = [
        { role: "system", content: systemPrompt },
        ...history.map(h => ({ role: h.role, content: h.message })),
        { role: "user", content: message }
    ];

    let resposta = "";

    try {
        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: conversationMessages
        });
        resposta = completion.choices[0].message.content;
    } catch {
        return sendMessage(phone, "❌ Erro com GPT.");
    }

    // =========================================
    // TENTAR LER JSON DO GPT
    // =========================================

    let json = null;

    try {
        const match = resposta.match(/\{[\s\S]*\}/);
        if (match) json = JSON.parse(match[0]);
    } catch {}

    // =========================================
    // EXECUTAR AÇÕES DO JSON
    // =========================================

    if (json) {
        // ---------- Registrar animal simples
        if (json.acao === "registrar_animal") {

            createAnimal(
                phone,
                json.tipo,
                json.raca,
                json.peso,
                json.idade,
                json.observacao || ""
            );

            return sendMessage(phone, "🐮 Animal cadastrado com sucesso!");
        }

        // ---------- Adicionar animal a lote
        if (json.acao === "adicionar_lote") {

            addAnimalToLote(
                phone,
                json.numero_lote,
                json.tipo,
                json.raca,
                json.peso,
                json.idade,
                json.sexo,
                json.quantidade,
                json.observacao
            );

            return sendMessage(phone, `📦 Animal adicionado ao lote ${json.numero_lote}!`);
        }

        // ---------- Listar todos os lotes
        if (json.acao === "listar_lotes") {

            const lotes = getAllLotes(phone);

            if (lotes.length === 0)
                return sendMessage(phone, "📭 Você não tem lotes cadastrados.");

            let txt = "📦 *Seus lotes*\n\n";
            lotes.forEach(l => {
                txt += `• Lote ${l.numero_lote}: ${l.total_animais} animais\n`;
            });

            return sendMessage(phone, txt);
        }

        // ---------- Listar animais de um lote
        if (json.acao === "listar_lote") {

            const animais = getLote(phone, json.numero_lote);

            if (animais.length === 0)
                return sendMessage(phone, `📭 O lote ${json.numero_lote} está vazio.`);

            let txt = `📦 *Lote ${json.numero_lote}*\n\n`;

            animais.forEach(a => {
                txt += `• ${a.tipo} (${a.raca || "sem raça"})  
Peso: ${a.peso}  
Qtd: ${a.quantidade}  
Sexo: ${a.sexo}\n\n`;
            });

            return sendMessage(phone, txt);
        }
    }

    // =========================================
    // SE NÃO HOUVER JSON → resposta normal
    // =========================================

    addConversation(phone, "assistant", resposta);
    return sendMessage(phone, resposta);
});

// =========================================
// 🚀 INICIAR SERVIDOR
// =========================================

app.listen(PORT, () => {
    console.log(`🚀 Pecuária Pro rodando na porta ${PORT}`);
});
