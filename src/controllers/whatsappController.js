import { processarMensagem } from "../services/nlp.js";
import { sendMessage } from "../services/whatsapp.js";
import { usuarioExiste, registrarUser } from "./userController.js";
import { mensagemBoasVindas } from "../utils/welcome.js";
import { mostrarMenu } from "./menuController.js";
import { addConversation } from "../database/database.js";
import { logInfo, logError } from "../utils/logger.js";

const mensagensProcessadas = new Set();

export async function handleIncoming(req, res) {
    try {
        const payload = req.body;

        if (!payload || !payload.data) {
            return res.sendStatus(200);
        }

        const data = payload.data;

        if (
            data.type !== "chat" ||
            data.fromMe === true ||
            !data.from ||
            !data.body ||
            !data.id
        ) {
            return res.sendStatus(200);
        }

        const messageId = data.id;

        if (mensagensProcessadas.has(messageId)) {
            return res.sendStatus(200);
        }

        mensagensProcessadas.add(messageId);
        setTimeout(() => mensagensProcessadas.delete(messageId), 120_000);

        const phone = data.from;
        const mensagem = data.body.trim();

        logInfo("📩 Mensagem recebida", { phone, mensagem, messageId });

        await addConversation(phone, "user", mensagem);

        const existe = await usuarioExiste(phone);

        let resposta;

        if (!existe) {
            await registrarUser(phone);
            resposta = {
                type: "reply",
                text: mensagemBoasVindas() + "\n\n" + mostrarMenu()
            };
        } else {
            resposta = await processarMensagem(phone, mensagem);
        }

        // ===============================
        // 🔐 CONTRATO DE RESPOSTA
        // ===============================
        if (!resposta || typeof resposta !== "object") {
            logError("❌ NLP retornou resposta inválida", { resposta });
            return res.sendStatus(200);
        }

        if (resposta.type === "reply" && resposta.text?.trim()) {
            await addConversation(phone, "assistant", resposta.text);
            await sendMessage(phone, resposta.text);
        }

        return res.sendStatus(200);

    } catch (err) {
        logError(err, { local: "handleIncoming" });
        return res.sendStatus(200);
    }
}
