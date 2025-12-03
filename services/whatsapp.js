// =========================================
// 📞 WHATSAPP SERVICE – Fluxo Principal
// =========================================

import axios from "axios";
import dotenv from "dotenv";

import { detectarIntencao } from "./nlp.js";

import { 
    handleDieta,
    handleUA,
    handleArroba,
    handleLotacao
} from "../controllers/cattleController.js";

import {
    garantirUsuario,
    atualizarStatusUsuario,
    registrarConversacao
} from "../controllers/userController.js";

import { 
    listarLote, 
    listarTodosLotes 
} from "../controllers/loteController.js";

import { processAI } from "../controllers/aiController.js";

dotenv.config();

const ULTRA_INSTANCE_ID = process.env.ULTRAMSG_INSTANCE_ID;
const ULTRA_TOKEN = process.env.ULTRAMSG_TOKEN;
const ULTRA_API_URL = process.env.ULTRAMSG_API_URL;

const processedMessages = new Set();

// =========================================
// 📤 Enviar mensagem
// =========================================
export async function sendMessage(phone, message) {
    try {
        await axios.post(
            `${ULTRA_API_URL}/${ULTRA_INSTANCE_ID}/messages/chat`,
            { to: phone, body: message },
            { params: { token: ULTRA_TOKEN } }
        );
    } catch (error) {
        console.error("Erro ao enviar mensagem:", error.response?.data || error);
    }
}

// =========================================
// 📩 PROCESSAR MENSAGEM PRINCIPAL
// =========================================
export async function processIncomingMessage(body) {
    try {
        const data = body.data;

        if (!data || data.type !== "chat") return;
        if (data.fromMe) return;

        const phone = data.from.replace("@c.us", "");
        const message = (data.body || "").trim();
        const msgId = data.id;

        if (processedMessages.has(msgId)) return;
        processedMessages.add(msgId);

        const user = await garantirUsuario(phone, data.pushname);

        await atualizarStatusUsuario(phone, message);
        await registrarConversacao(phone, "user", message);

        const intent = detectarIntencao(message);

        // =========================================
        // AÇÕES DIRETAS
        // =========================================
        if (intent.intent === "dieta") return handleDieta(phone, message);
        if (intent.intent === "ua") return handleUA(phone, message);
        if (intent.intent === "arroba") return handleArroba(phone, message);
        if (intent.intent === "lotacao") return handleLotacao(phone, message);

        // LOTES
        if (intent.intent === "listar_lote" && intent.numero_lote) {
            return listarLote(phone, intent.numero_lote);
        }

        if (intent.intent === "listar_lote" && !intent.numero_lote) {
            return sendMessage(phone, "Qual número do lote?");
        }

        if (intent.intent === "listar_lotes") {
            return listarTodosLotes(phone);
        }

        // REGISTRO / ATUALIZAÇÃO / DELETE DE ANIMAL VIA NLP
        if ([
            "registrar_animal",
            "atualizar_animal",
            "deletar_animal",
            "adicionar_lote"
        ].includes(intent.intent)) {
            return processAI(phone, message, user.name, intent);
        }

        // =========================================
        // GPT (AI CONTROLLER)
        // =========================================
        return processAI(phone, message, user.name, intent);

    } catch (err) {
        console.error("Erro no WhatsApp Service:", err);
    }
}
