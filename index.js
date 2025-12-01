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

// Banco (Agora Supabase)
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
( MANTIVE SEU SYSTEM PROMPT INALTERADO )
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

    // =========================================
    // USUÁRIO (VERSÃO ASSÍNCRONA CORRIGIDA)
    // =========================================

    let user = await getUser(phone);

    if (!user) {
        await createUser(phone, data.pushname);
        user = await getUser(phone);
    }

    await updateUser(phone, {
        last_message: message,
        last_interaction: new Date().toISOString()
    });

    await addConversation(phone, "user", message);

    // Detectar intenção
    const intent = detectIntent(message);

    // ======================
    // INTENÇÕES FIXAS
    // ======================

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

    // =========================================
    // GPT FALLBACK
    // =========================================

    const history = await getConversationHistory(phone, 10);

    const conversationMessages = [
        { role: "system", content: systemPrompt },
        { role: "system", content: `O nome do usuário é: ${user?.name || "Cliente"}` },
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
    // INTERPRETAR JSON
    // =========================================

    let json = null;
    const jsonRegex = /\{[^]*?\}/g;
    const encontrados = resposta.match(jsonRegex);

    if (encontrados) {
        for (const bloco of encontrados) {
            try {
                const parsed = JSON.parse(bloco);
                if (parsed.acao) json = parsed;
            } catch {}
        }
    }

    // =========================================
    // AÇÕES DO JSON (ASSÍNCRONAS!)
    // =========================================

    if (json) {

        // Registrar animal simples
        if (json.acao === "registrar_animal") {

            await createAnimal(
                phone,
                json.tipo,
                json.raca,
                json.peso,
                json.idade,
                json.observacao || ""
            );

            return sendMessage(phone, "🐮 Animal cadastrado com sucesso!");
        }

        // Adicionar animal ao lote
        if (json.acao === "adicionar_lote") {

            const numeroLote = Number(json.numero_lote);
            const tipo = json.tipo?.trim() || "";
            const raca = json.raca?.trim() || "";
            const peso = Number(json.peso);
            const idade = Number(json.idade);
            const quantidade = Number(json.quantidade || 1);
            let sexo = (json.sexo || "").toLowerCase().trim();

            if (["m", "macho"].includes(sexo)) sexo = "macho";
            else if (["f", "fêmea", "femea"].includes(sexo)) sexo = "fêmea";
            else sexo = "não informado";

            if (!numeroLote)
                return sendMessage(phone, "❌ Informe o número do lote.");

            await addAnimalToLote(
                phone,
                numeroLote,
                tipo,
                raca,
                peso,
                idade,
                sexo,
                quantidade,
                json.observacao || ""
            );

            return sendMessage(phone, `📦🐮 Animal adicionado ao lote ${numeroLote}!`);
        }

        // Listar lotes
        if (json.acao === "listar_lotes") {

            const lotes = await getAllLotes(phone);

            if (!lotes.length)
                return sendMessage(phone, "📭 Você não tem lotes cadastrados.");

            let txt = "📦 *Seus lotes*\n\n";

            lotes.forEach(l => {
                txt += `• Lote ${l.numero_lote}: ${l.total_animais} animais\n`;
            });

            return sendMessage(phone, txt);
        }

        // Listar animais do lote
        if (json.acao === "listar_lote") {

            const animais = await getLote(phone, json.numero_lote);

            if (!animais.length)
                return sendMessage(phone, `📭 O lote ${json.numero_lote} está vazio.`);

            let txt = `📦 *Lote ${json.numero_lote}*\n\n`;

            animais.forEach(a => {
                txt += `🐂 *${a.tipo}* (${a.raca || "sem raça"})  
⚖️ Peso: ${a.peso} kg  
🔢 Quantidade: ${a.quantidade}  
👤 Sexo: ${a.sexo}  
📝 Obs: ${a.observacao || "nenhuma"}\n\n`;
            });

            return sendMessage(phone, txt);
        }
    }

    // =========================================
    // RESPOSTA NORMAL (SEM JSON)
    // =========================================

    await addConversation(phone, "assistant", resposta);
    return sendMessage(phone, resposta);
});

// =========================================
// 🚀 INICIAR SERVIDOR
// =========================================

app.listen(PORT, () => {
    console.log(`🚀 Pecuária Pro rodando na porta ${PORT}`);
});
