// =========================================
// 📌 PECUÁRIA PRO - WhatsApp Bot (PT-BR)
// Versão Estável Corrigida 100% compatível com Supabase
// =========================================

import express from "express";
import axios from "axios";
import OpenAI from "openai";
import dotenv from "dotenv";

// NLP
import { detectarIntencao } from "./services/nlp.js";

// DB
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

const processedMessages = new Set();

const ULTRA_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID;
const ULTRA_TOKEN = process.env.ULTRAMSG_TOKEN;
const ULTRA_API_URL = process.env.ULTRAMSG_API_URL;

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// =========================================
// Função de envio
// =========================================

async function sendMessage(phone, message, userName = null) {
    try {
        const finalMessage = userName
            ? message.replace("{nome}", userName)
            : message;

        await axios.post(
            `${ULTRA_API_URL}/${ULTRA_INSTANCE_ID}/messages/chat`,
            { to: phone, body: finalMessage },
            { params: { token: ULTRA_TOKEN } }
        );
    } catch (err) {
        console.error("Erro ao enviar:", err.response?.data || err);
    }
}

// =========================================
// SYSTEM PROMPT (corrigido: remove suporte JSON para listar lote)
// =========================================

const systemPrompt = `
Você é o assistente da PECUÁRIA PRO.

⚠️ SOMENTE envie JSON quando:
- Cadastrar animal
- Atualizar animal
- Deletar animal
- Listar ANIMAIS
- Adicionar animal ao lote
- Listar LOTES (não lote individual)
❌ NUNCA envie JSON para "listar lote 1", "ver lote", "mostrar lote".
➡️ Isso é SEMPRE ação local (NLP).
`;

// =========================================
// WEBHOOK GET
// =========================================

app.get("/webhook", (req, res) => res.send("Webhook OK"));

// =========================================
// WEBHOOK POST
// =========================================

app.post("/webhook", async (req, res) => {
    res.sendStatus(200);

    const data = req.body.data;
    if (!data || data.type !== "chat") return;
    if (data.fromMe) return;

    const phone = data.from.replace("@c.us", "");
    const message = data.body?.trim() || "";

    if (processedMessages.has(data.id)) return;
    processedMessages.add(data.id);

    // Verifica usuário
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

    // Detecta intenção
    const intent = detectarIntencao(message);

    // =========================================
    // AÇÕES DIRETAS (SEM GPT)
    // =========================================

    // DIETA
    if (intent.intent === "dieta") {
        const peso = extrairPesoDaMensagem(message);
        const qtd = extrairQuantidadeDaMensagem(message);
        if (!peso) return sendMessage(phone, "Informe o peso. Ex: boi 380kg");
        return sendMessage(phone, formatDieta(calcularDieta(peso, qtd), peso, qtd));
    }

    // UA
    if (intent.intent === "ua") {
        const peso = extrairPesoDaMensagem(message);
        const qtd = extrairQuantidadeDaMensagem(message);
        if (!peso) return sendMessage(phone, "Informe peso. Ex: UA boi 420kg");
        return sendMessage(phone, formatUA(calcularUA(peso) * qtd));
    }

    // Custo da arroba
    if (intent.intent === "arroba") {
        const peso = extrairPesoDaMensagem(message);
        const custo = extrairCustoDaMensagem(message);
        if (!peso || !custo) return sendMessage(phone, formatMissingData());
        return sendMessage(phone, formatCustoArroba(custoPorArroba(custo, peso), peso, custo));
    }

    // Listar animais
    if (intent.intent === "listar_animais") {
        const animais = await getAnimalsByUser(phone);

        if (!animais.length)
            return sendMessage(phone, "📭 Você não tem animais cadastrados.");

        let txt = "🐮 *Seus animais cadastrados*\n\n";

        animais.forEach(a => {
            txt += `• Boi #${a.numero_boi}
📌 Nome: ${a.nome}
🐄 Raça: ${a.raca || "não informada"}
⚖️ Peso: ${a.peso} kg
📅 Idade: ${a.idade} ano(s)
📝 Obs: ${a.notas || "nenhuma"}\n\n`;
        });

        return sendMessage(phone, txt);
    }

    // Listar LOTE (via NLP — CORRIGIDO)
    if (intent.intent === "listar_lote" && intent.numero_lote) {
        const animais = await getLote(phone, intent.numero_lote);

        if (!animais.length)
            return sendMessage(phone, `📭 O lote ${intent.numero_lote} está vazio.`);

        let txt = `📦 *Lote ${intent.numero_lote}*\n\n`;

        animais.forEach(a => {
            txt += `🐂 ${a.tipo}
Raça: ${a.raca || "não informada"}
Peso: ${a.peso} kg
Idade: ${a.idade} ano(s)
Sexo: ${a.sexo}
Quantidade: ${a.quantidade}
Obs: ${a.observacao || "nenhuma"}\n\n`;
        });

        return sendMessage(phone, txt);
    }

    // =========================================
    // GPT (somente quando o NLP NÃO resolve)
    // =========================================

    const history = await getConversationHistory(phone, 6);

    const messages = [
        { role: "system", content: systemPrompt },
        { role: "system", content: `Nome do usuário: ${user?.name || "produtor"}` },
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
        return sendMessage(phone, "Erro ao processar sua solicitação.");
    }

    // -------------------------------------------
    // INTERPRETAR JSON (apenas ações válidas)
    // -------------------------------------------

    let json = null;
    const regex = /\{[\s\S]*?\}/g;
    const matches = resposta.match(regex);

    if (matches) {
        for (const bloco of matches) {
            try {
                const parsed = JSON.parse(bloco);

                const acoesValidas = [
                    "registrar_animal",
                    "listar_animais",
                    "atualizar_animal",
                    "deletar_animal",
                    "adicionar_lote",
                    "listar_lotes"
                ];

                if (parsed.acao && acoesValidas.includes(parsed.acao)) {
                    json = parsed;
                }

            } catch {}
        }
    }

    // -------------------------------------------
    // EXECUTAR AÇÕES DO JSON (listagem de lote REMOVIDA)
    // -------------------------------------------

    if (json) {

        // Registrar
        if (json.acao === "registrar_animal") {
            await salvarAnimalDB({
                telefone: phone,
                numero_boi: json.numero_boi,
                nome: json.nome,
                raca: json.raca,
                peso: json.peso,
                idade: json.idade,
                notas: json.notas
            });

            return sendMessage(phone, "🐄 Animal registrado com sucesso!");
        }

        // Atualizar animal
        if (json.acao === "atualizar_animal") {
            await updateAnimalDB(json.numero_boi, {
                peso: json.peso,
                idade: json.idade,
                raca: json.raca,
                notas: json.notas
            });

            return sendMessage(phone, "✔ Animal atualizado!");
        }

        // Deletar animal
        if (json.acao === "deletar_animal") {
            await deleteAnimalDB(json.numero_boi);
            return sendMessage(phone, "🗑 Animal removido!");
        }

        // Adicionar ao lote
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

            return sendMessage(phone, `📦 Animal adicionado ao lote ${json.numero_lote}!`);
        }

        // Listar lotes (todos)
        if (json.acao === "listar_lotes") {
            const lotes = await getAllLotes(phone);

            if (!lotes.length)
                return sendMessage(phone, "📭 Você não possui lotes.");

            let txt = "📦 *Seus lotes cadastrados*\n\n";

            lotes.forEach(l => {
                txt += `• Lote ${l.numero_lote} — ${l.total_animais} animais\n`;
            });

            return sendMessage(phone, txt);
        }
    }

    // Resposta normal
    return sendMessage(phone, resposta);
});

// =========================================
// INICIAR SERVIDOR
// =========================================

app.listen(PORT, () =>
    console.log(`🚀 Pecuária Pro rodando na porta ${PORT}`)
);
