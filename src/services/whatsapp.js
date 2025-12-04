// ==============================================================
// 📡 SERVIÇO DE WHATSAPP — UltraMSG
// Revisado, limpo e 100% funcional
// ==============================================================

import axios from "axios";
import { config } from "../config/env.js";
import { logInfo, logError } from "../utils/logger.js";

export async function sendMessage(phone, body) {
    const url = `https://api.ultramsg.com/${config.ULTRA_INSTANCE}/messages/chat`;

    try {
        const response = await axios.post(url, {
            token: config.ULTRA_TOKEN,
            to: phone,
            body
        });

        logInfo("📤 Mensagem enviada via UltraMSG", { phone, body });

        return response.data;

    } catch (err) {

        logError(err, {
            phone,
            body,
            service: "UltraMSG"
        });

        return null;
    }
}
