// =========================================
// 📌 PECUÁRIA PRO – WhatsApp Bot (Versão PT-BR Otimizada)
// =========================================

import express from "express";
import axios from "axios";
import OpenAI from "openai";
import dotenv from "dotenv";

// NLP
import { detectIntent } from "./services/nlp.js";

// Banco de Dados
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
// 🧠 SYSTEM PROMPT (GPT só quando necessário)
// =========================================

const systemPrompt = `
Você é o assistente oficial da PECUÁRIA PRO.

⚠️ REGRAS IMPORTANTES PARA JSON:
- Só envie JSON quando o usuário pedir uma ação.
- JSON deve usar APENAS campos em português.
- Nunca deixe campos vazios.
- Nunca invente campos.
- Se faltar informação, peça ao usuário (sem JSON).

📘 AÇÕES DISPONÍVEIS:

1️⃣ registrar_animal  
{
  "acao": "registrar_animal",
  "numero_boi": 0,
  "nome": "",
  "raca": "",
  "peso": 0,
  "idade": 0,
  "notas": ""
}

2️⃣ listar_animais  
{ "acao": "listar_animais" }

3️⃣ atualizar_animal  
{
  "acao": "atualizar_animal",
  "numero_boi": 0,
  "peso": 0,
  "idade": 0,
  "raca": "",
  "notas": ""
}

4️⃣ deletar_animal  
{
  "acao": "deletar_animal",
  "numero_boi": 0
}

5️⃣ adicionar_lote  
{
  "acao": "adicionar_lote",
  "numero_lote": 0,
  "tipo": "",
  "raca": "",
  "peso": 0,
  "idade": 0,
  "sexo": "",
  "quantidade": 1,
  "observacao": ""
}

6️⃣ listar_lotes  
{ "acao": "listar_lotes" }

7️⃣ listar_lote  
{
  "acao": "listar_lote",
  "numero_lote": 0
}

⚠️ SE NÃO FOR UMA AÇÃO → responda normalmente em português.
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
        await createUser(phone, data.pushname || "Produtor");
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
    // 🔵 AÇÕES DIRETAS (SEM GPT)
    // ============================================================

    // Dieta
    if (intent.intent === "diet") {
        const peso = extrairPesoDaMensagem(message);
        const qtd = extrairQuantidadeDaMensagem(message);
        if (!peso) return sendMessage(phone, "Informe o peso do animal.");
        return sendMessage(phone, formatDieta(calcularDieta(peso, qtd), peso, qtd));
    }

    // UA
    if (intent.intent === "ua_calc") {
        const peso = extrairPesoDaMensagem(message);
        const qtd = extrairQuantidadeDaMensagem(message);
        if (!peso) return sendMessage(phone, "Informe o peso para calcular UA.");
        return sendMessage(phone, formatUA(calcularUA(peso) * qtd));
    }

    // Arroba
    if (intent.intent === "arroba_cost") {
        const peso = extrairPesoDaMensagem(message);
        const custo = extrairCustoDaMensagem(message);
        if (!peso || !custo) return sendMessage(phone, formatMissingData());
        return sendMessage(phone, formatCustoArroba(custoPorArroba(custo, peso), peso, custo));
    }

    // Listar animais
    if (intent.intent === "listar_animais") {
        const animais = await getAnimalsByUser(phone);

        if (!animais.length)
            return sendMessage(phone, "📭 Você ainda não cadastrou nenhum animal.");

        let txt = "🐮 *Seus animais cadastrados*\n\n";
        animais.forEach(a => {
            txt += `• #${a.numero_boi} - ${a.nome}\nRaça: ${a.raca}\nPeso: ${a.peso} kg\nIdade: ${a.idade}\n\n`;
        });

        return sendMessage(phone, txt);
    }

    // Listar lotes
    if (intent.intent === "listar_lotes") {
        const lotes = await getAllLotes(phone);

        if (!lotes.length)
            return sendMessage(phone, "📭 Você não possui lotes cadastrados.");

        let txt = "📦 *Seus lotes*\n\n";
        lotes.forEach(l => {
            txt += `• Lote ${l.numero_lote}: ${l.total_animais} animais\n`;
        });

        return sendMessage(phone, txt);
    }

    // Listar lote específico
    if (intent.intent === "listar_lote" && intent.numero_lote) {
        const animais = await getLote(phone, intent.numero_lote);

        if (!animais.length)
            return sendMessage(phone, `📭 O lote ${intent.numero_lote} está vazio.`);

        let txt = `📦 *Lote ${intent.numero_lote}*\n\n`;

        animais.forEach(a => {
            txt += `🐂 ${a.tipo}\nPeso: ${a.peso} kg\nRaça: ${a.raca}\nSexo: ${a.sexo}\nQtd: ${a.quantidade}\n\n`;
        });

        return sendMessage(phone, txt);
    }

    // =============================================================
    // 🔮 GPT – USADO APENAS QUANDO O NLP NÃO SABE A INTENÇÃO
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
        return sendMessage(phone, "❌ Erro ao processar IA.");
    }

    // Interpretar JSON
    const jsonMatch = resposta.match(/\{[^]*?\}/);
    let json = null;

    if (jsonMatch) {
        try { json = JSON.parse(jsonMatch[0]); } catch {}
    }

    // ===================================================
    // 🟦 EXECUÇÃO FINAL DAS AÇÕES JSON
    // ===================================================

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
                notas: json.notas || ""
            });
            return sendMessage(phone, "🐮 Animal registrado com sucesso!");
        }

        // Atualizar animal
        if (json.acao === "atualizar_animal") {
            await updateAnimalDB(json.numero_boi, {
                peso: json.peso,
                idade: json.idade,
                raca: json.raca,
                notas: json.notas
            });
            return sendMessage(phone, "🔄 Animal atualizado com sucesso!");
        }

        // Deletar animal
        if (json.acao === "deletar_animal") {
            await deleteAnimalDB(json.numero_boi);
            return sendMessage(phone, "🗑️ Animal deletado com sucesso!");
        }

        // Adicionar lote
        if (json.acao === "adicionar_lote") {
            await addAnimalToLote(
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
            return sendMessage(phone, `📦🐮 Animal adicionado ao lote ${json.numero_lote}!`);
        }

        // Listar lote via JSON
        if (json.acao === "listar_lote") {
            const animais = await getLote(phone, json.numero_lote);

            if (!animais.length)
                return sendMessage(phone, `📭 O lote ${json.numero_lote} está vazio.`);

            let txt = `📦 *Lote ${json.numero_lote}*\n\n`;
            animais.forEach(a => txt += `🐂 ${a.tipo} - ${a.peso}kg\n`);
            return sendMessage(phone, txt);
        }
    }

    // Sem JSON → resposta normal
    return sendMessage(phone, resposta);
});

// =========================================
// 🚀 INICIAR SERVIDOR
// =========================================

app.listen(PORT, () => console.log(`🚀 Pecuária Pro rodando na porta ${PORT}`));
