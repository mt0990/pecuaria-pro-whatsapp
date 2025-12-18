import { processarMensagem } from "../services/nlp.js";
import { sendMessage } from "../services/whatsapp.js";
import { usuarioExiste, registrarUser } from "./userController.js";
import { mensagemBoasVindas } from "../utils/welcome.js";
import { mostrarMenu } from "./menuController.js";
import { addConversation } from "../database/database.js";
import { logInfo, logError } from "../utils/logger.js";

// ==================================================
// 🔒 Anti-duplicação em memória (mensagens)
// ==================================================
const mensagensProcessadas = new Set();

// ==================================================
// 📩 CONTROLLER PRINCIPAL DO WEBHOOK WHATSAPP
// ==================================================
export async function handleIncoming(req, res) {
    try {
        const payload = req.body;

        // ⚠️ Segurança: payload inválido
        if (!payload || !payload.data) {
            return res.sendStatus(200);
        }

        const data = payload.data;

        // ==================================================
        // ✅ FILTRO CRÍTICO — processa SOMENTE mensagem real
        // ==================================================
        if (
            data.type !== "chat" ||     // ignora status, ack, etc
            data.fromMe === true ||     // ignora mensagens do próprio bot
            !data.from ||               // número inválido
            !data.body ||               // mensagem vazia
            !data.id                    // sem ID confiável
        ) {
            return res.sendStatus(200);
        }

        const messageId = data.id;

        // ==================================================
        // 🚫 DEDUPLICAÇÃO REAL (por messageId)
        // ==================================================
        if (mensagensProcessadas.has(messageId)) {
            return res.sendStatus(200);
        }

        mensagensProcessadas.add(messageId);

        // limpa após 2 minutos (seguro p/ retry)
        setTimeout(() => {
            mensagensProcessadas.delete(messageId);
        }, 120_000);

        const phone = data.from;
        const mensagem = data.body.trim();

        logInfo("📩 Mensagem recebida", {
            phone,
            mensagem,
            messageId
        });

        // ==================================================
        // 💾 SALVAR MENSAGEM DO USUÁRIO
        // ==================================================
        await addConversation(phone, "user", mensagem);

        // ==================================================
        // 👤 VERIFICAR / REGISTRAR USUÁRIO
        // ==================================================
        const existe = await usuarioExiste(phone);

        let respostaFinal;

        if (!existe) {
            await registrarUser(phone);
            respostaFinal =
                mensagemBoasVindas() +
                "\n\n" +
                mostrarMenu();
        } else {
            // ==================================================
            // 🤖 PROCESSAMENTO NLP (única entrada)
            // ==================================================
            respostaFinal = await processarMensagem(phone, mensagem);
        }

        // ==================================================
        // 📤 ENVIO CENTRALIZADO DA RESPOSTA
        // ==================================================
        if (typeof respostaFinal === "string" && respostaFinal.trim()) {
            await addConversation(phone, "assistant", respostaFinal);
            await sendMessage(phone, respostaFinal);
        }

        return res.sendStatus(200);

    } catch (err) {
        logError(err, { local: "handleIncoming" });
        return res.sendStatus(200);
    }
}
