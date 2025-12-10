import { processarMensagem } from "../services/nlp.js";
import { sendMessage } from "../services/whatsapp.js";
import { usuarioExiste, registrarUser } from "./userController.js";
import { mensagemBoasVindas } from "../utils/welcome.js";
import { mostrarMenu } from "./menuController.js";

import { addConversation } from "../database/database.js";
import { logInfo, logError } from "../utils/logger.js";

export async function handleIncoming(req, res, next) {
    try {
        const { data } = req.body;

        if (!data) {
            return res.status(400).json({ error: "Payload inválido" });
        }

        const phone = data.from;
        const mensagem = (data.body || "").trim();

        logInfo("📩 Mensagem recebida", { phone, mensagem });

        // ======================================================
        // 1️⃣ SALVAR MENSAGEM DO USUÁRIO
        // ======================================================
        await addConversation(phone, "user", mensagem);

        // ======================================================
        // 2️⃣ Verificar se usuário é novo
        // ======================================================
        const existe = await usuarioExiste(phone);

        if (!existe) {
            await registrarUser(phone);

            await addConversation(phone, "assistant", mensagemBoasVindas());
            await sendMessage(phone, mensagemBoasVindas());

            await addConversation(phone, "assistant", "menu inicial");
            await mostrarMenu(phone);

            return res.status(200).json({ status: "ok" });
        }

        // ======================================================
        // 3️⃣ Processamento normal (NLP)
        // ======================================================
        const resposta = await processarMensagem(phone, mensagem);

        // Caso o NLP retorne string (resposta direta)
        if (resposta && typeof resposta === "string") {
            // salvar resposta do assistente
            await addConversation(phone, "assistant", resposta);

            await sendMessage(phone, resposta);
        }

        return res.status(200).json({ status: "ok" });

    } catch (err) {
        logError(err, { local: "handleIncoming" });
        next(err);
    }
}
