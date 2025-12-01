// =========================================
// 📌 PECUÁRIA PRO - WhatsApp Bot Completo
// =========================================

import express from "express";
import axios from "axios";
import OpenAI from "openai";
import dotenv from "dotenv";

// NLP
import { detectIntent } from "./services/nlp.js";

// ==============================
// 📦 DATABASE (SUPABASE)
// ==============================
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

// ==============================
// 🔢 Cálculos pecuários
// ==============================
import {
    calcularDieta,
    custoPorArroba,
    calcularUA,
    calcularLotacao
} from "./services/cattle.js";

// ==============================
// 🔎 Extração de dados
// ==============================
import {
    extrairPesoDaMensagem,
    extrairQuantidadeDaMensagem,
    extrairCustoDaMensagem,
    extrairAreaHa
} from "./services/extract.js";

// ==============================
// 🧾 Formatação
// ==============================
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
// 🧠 SYSTEM PROMPT
// =========================================

const systemPrompt = `
Você é o assistente oficial da Pecuária Pro.
Ajuda o produtor com:
- dietas
- cálculos
- lotes
- registro de animais
- diagnósticos

Quando precisar executar ações, responda COM JSON no formato:
{
  "acao": "...",
  "campo1": "...",
  "campo2": "..."
}

Ações possíveis:

1️⃣ registrar_animal  
   { "acao":"registrar_animal", "nome":"", "raca":"", "peso":0, "idade":0, "observacao":"" }

2️⃣ listar_animais  
   { "acao":"listar_animais" }

3️⃣ atualizar_animal  
   { "acao":"atualizar_animal", "id":0, "peso":0, "raca":"", "idade":0, "observacao":"" }

4️⃣ deletar_animal  
   { "acao":"deletar_animal", "id":0 }

5️⃣ adicionar_lote  
   { "acao":"adicionar_lote", "numero_lote":1, "tipo":"", "raca":"", "peso":0, "idade":0, "sexo":"macho|fêmea", "quantidade":1 }

6️⃣ listar_lotes  
   { "acao":"listar_lotes" }

7️⃣ listar_lote  
   { "acao":"listar_lote", "numero_lote":1 }

NUNCA invente campos.
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
    // 👤 USUÁRIO
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
    // 🔮 GPT FALLBACK
    // =========================================

    const history = await getConversationHistory(phone, 10);

    const conversationMessages = [
        { role: "system", content: systemPrompt },
        { role: "system", content: `Nome do usuário: ${user?.name || "Cliente"}` },
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
    // 🟦 AÇÕES DO JSON (CRUD + LOTES)
    // =========================================

    if (json) {

        // 1️⃣ Registrar Animal
        if (json.acao === "registrar_animal") {

            await salvarAnimalDB({
                telefone: phone,
                nome: json.nome || json.tipo || "Animal",
                raca: json.raca,
                peso: json.peso,
                idade: json.idade,
                notas: json.observacao || ""
            });

            return sendMessage(phone, "🐮 Animal cadastrado com sucesso!");
        }

        // 2️⃣ Listar Animais
        if (json.acao === "listar_animais") {
            const animais = await getAnimalsByUser(phone);

            if (!animais.length)
                return sendMessage(phone, "📭 Você ainda não tem animais cadastrados.");

            let txt = "🐮 *Seus animais cadastrados*\n\n";

            animais.forEach(a => {
                txt += `• ${a.nome} (${a.raca || "sem raça"})  
⚖️ Peso: ${a.peso} kg  
📅 Idade: ${a.idade || "não informada"}  
📝 Obs: ${a.notas || "nenhuma"}  
🆔 ID: ${a.id}\n\n`;
            });

            return sendMessage(phone, txt);
        }

        // 3️⃣ Atualizar Animal
        if (json.acao === "atualizar_animal") {

            if (!json.id)
                return sendMessage(phone, "❌ Informe o ID do animal.");

            await updateAnimalDB(json.id, {
                peso: json.peso,
                idade: json.idade,
                raca: json.raca,
                notas: json.observacao
            });

            return sendMessage(phone, "✔️ Animal atualizado com sucesso!");
        }

        // 4️⃣ Deletar Animal
        if (json.acao === "deletar_animal") {

            if (!json.id)
                return sendMessage(phone, "❌ Informe o ID do animal para excluir.");

            await deleteAnimalDB(json.id);

            return sendMessage(phone, "🗑️ Animal removido com sucesso!");
        }

        // 5️⃣ Adicionar Animal ao Lote
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

        // 6️⃣ Listar Lotes
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

        // 7️⃣ Listar Animais de um Lote
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
