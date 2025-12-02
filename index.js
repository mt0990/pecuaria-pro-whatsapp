// =========================================
// 📌 PECUÁRIA PRO - WhatsApp Bot (Token Saver Edition)
// =========================================

import express from "express";
import axios from "axios";
import OpenAI from "openai";
import dotenv from "dotenv";

// NLP
import { detectIntent } from "./services/nlp.js";

// DB (Supabase)
import {
    salvarAnimalDB,
    getAnimalsByUser,
    updateAnimalDB,
    deleteAnimalDB,
    getLote,
    getAllLotes,
    addAnimalToLote,
    getUser,
    createUser,
    updateUser,
    addConversation,
    getConversationHistory
} from "./database.js";

// Cálculos
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
// 📤 Enviar mensagem
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
// 🧠 SYSTEM PROMPT (apenas quando GPT for usado)
// =========================================

const systemPrompt = `
Você é o assistente oficial da Pecuária Pro.
Responda somente quando necessário interpretar linguagem natural complexa.

Quando precisar executar ações, retorne APENAS JSON:

{
  "acao": "...",
  "campo1": "...",
  "campo2": "..."
}

Ações disponíveis:
- registrar_animal
- listar_animais
- atualizar_animal
- deletar_animal
- adicionar_lote
- listar_lotes
- listar_lote
`;

// =========================================
// 🌐 Webhook
// =========================================

app.get("/webhook", (req, res) => res.send("Webhook OK"));

app.post("/webhook", async (req, res) => {
    res.sendStatus(200);

    const data = req.body.data;
    if (!data || data.type !== "chat") return;
    if (data.fromMe) return;

    const phone = data.from.replace("@c.us", "");
    const message = data.body?.trim() || "";

    if (processedMessages.has(data.id)) return;
    processedMessages.add(data.id);

    // Usuário
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

    // NLP
    const intent = detectIntent(message);

    // ============================================================
    // 🔵 AÇÕES DIRETAS (NÃO USAM GPT → ECONOMIA DE TOKENS)
    // ============================================================

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

    // Arroba
    if (intent.intent === "arroba_cost") {
        const peso = extrairPesoDaMensagem(message);
        const custo = extrairCustoDaMensagem(message);
        if (!peso || !custo) return sendMessage(phone, formatMissingData());
        return sendMessage(phone, formatCustoArroba(custoPorArroba(custo, peso), peso, custo));
    }

    // ================================
    // CRUD DIRETO - SEM GPT
    // ================================

    // Registrar animal
    if (intent.intent === "registrar_animal") {
        return sendMessage(phone, "🐮 Vamos registrar! Informe: nome, raça, peso, idade.");
    }

    // Listar animais
    if (intent.intent === "listar_animais") {
        const animais = await getAnimalsByUser(phone);
        if (!animais.length) return sendMessage(phone, "📭 Você não tem animais cadastrados.");
        
        let txt = "🐮 *Seus animais cadastrados*\n\n";
        animais.forEach(a => {
            txt += `• ${a.nome} (${a.raca || "sem raça"}) - ${a.peso}kg (ID ${a.id})\n`;
        });

        return sendMessage(phone, txt);
    }

    // Listar lotes
    if (intent.intent === "listar_lotes") {
        const lotes = await getAllLotes(phone);
        if (!lotes.length) return sendMessage(phone, "📭 Você não tem lotes cadastrados.");

        let txt = "📦 *Seus lotes*\n\n";
        lotes.forEach(l => txt += `• Lote ${l.numero_lote}: ${l.total_animais} animais\n`);
        return sendMessage(phone, txt);
    }

    // Listar um lote específico
    if (intent.intent === "listar_lote" && intent.numero_lote) {
        const animais = await getLote(phone, intent.numero_lote);
        if (!animais.length) return sendMessage(phone, `📭 O lote ${intent.numero_lote} está vazio.`);
        
        let txt = `📦 *Lote ${intent.numero_lote}*\n\n`;
        animais.forEach(a => {
            txt += `🐂 ${a.tipo} - ${a.peso}kg (${a.raca || "sem raça"})\n`;
        });
        
        return sendMessage(phone, txt);
    }

    // Adicionar ao lote sem interpretação → GPT NECESSÁRIO
    if (intent.intent === "add_lote") {
        return sendMessage(phone, "📦 Informe: tipo, raça, peso, idade, sexo e quantidade.");
    }

    // =============================================================
    // 🔮 GPT USADO APENAS PARA INTERPRETAÇÃO COMPLEXA
    // =============================================================

    const history = await getConversationHistory(phone, 6);

    const messages = [
        { role: "system", content: systemPrompt },
        ...history.map(h => ({ role: h.role, content: h.message })),
        { role: "user", content: message }
    ];

    let resposta = "";

    try {
        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages
        });

        resposta = completion.choices[0].message.content;

    } catch (e) {
        return sendMessage(phone, "❌ Erro com GPT.");
    }

    // Interpretar JSON
    const jsonMatch = resposta.match(/\{[^]*?\}/);
    let json = null;

    if (jsonMatch) {
        try { json = JSON.parse(jsonMatch[0]); } catch {}
    }

    // ================================
    // Execução final das ações JSON
    // ================================

    if (json) {

        // Registrar animal
        if (json.acao === "registrar_animal") {
            await salvarAnimalDB({
                telefone: phone,
                numero_boi: json.numero_boi,
                nome: json.nome,
                raca: json.raca,
                peso: json.peso,
                idade: json.idade,
                notas: json.observacao || ""
            });
            return sendMessage(phone, "🐮 Animal registrado com sucesso!");
        }

        // Atualizar animal
        if (json.acao === "atualizar_animal") {
            await updateAnimalDB(json.id, {
                peso: json.peso,
                idade: json.idade,
                raca: json.raca,
                notas: json.observacao
            });
            return sendMessage(phone, "✔ Animal atualizado!");
        }

        // Deletar animal
        if (json.acao === "deletar_animal") {
            await deleteAnimalDB(json.id);
            return sendMessage(phone, "🗑️ Animal removido!");
        }

        // Adicionar lote
        if (json.acao === "adicionar_lote") {
            await addAnimalToLote(phone, json.numero_lote, json.tipo, json.raca, json.peso, json.idade, json.sexo, json.quantidade, json.observacao);
            return sendMessage(phone, `📦🐮 Animal adicionado ao lote ${json.numero_lote}!`);
        }

        // Listar lote via GPT
        if (json.acao === "listar_lote") {
            const animais = await getLote(phone, json.numero_lote);
            if (!animais.length)
                return sendMessage(phone, `📭 O lote ${json.numero_lote} está vazio.`);

            let txt = `📦 *Lote ${json.numero_lote}*\n\n`;
            animais.forEach(a => {
                txt += `🐂 ${a.tipo} - ${a.peso}kg\n`;
            });

            return sendMessage(phone, txt);
        }
    }

    // Caso GPT gerou texto normal
    return sendMessage(phone, resposta);
});

// =========================================
// 🚀 INICIAR SERVIDOR
// =========================================

app.listen(PORT, () => console.log(`🚀 Pecuária Pro rodando na porta ${PORT}`));
