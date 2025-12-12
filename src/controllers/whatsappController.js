import { processarMensagem } from "../services/nlp.js";
import { sendMessage } from "../services/whatsapp.js";
import { usuarioExiste, registrarUser } from "./userController.js";
import { mensagemBoasVindas } from "../utils/welcome.js";
import { mostrarMenu } from "./menuController.js";
import { addConversation } from "../database/database.js";
import { logInfo, logError } from "../utils/logger.js";

// 🔒 Anti-duplicação simples (memória)
const mensagensProcessadas = new Set();

export async function handleIncoming(req, res) {
    try {
        const { data } = req.body;

        if (!data?.from || !data?.body) {
            return res.sendStatus(200);
        }

        // 🔑 Identificador único da mensagem
        const messageId =
            data.id ||
            `${data.from}-${data.body}-${data.timestamp || Date.now()}`;

        // 🚫 Bloqueio de duplicação
        if (mensagensProcessadas.has(messageId)) {
            return res.sendStatus(200);
        }

        mensagensProcessadas.add(messageId);
        setTimeout(() => mensagensProcessadas.delete(messageId), 60_000);

        const phone = data.from;
        const mensagem = data.body.trim();

        logInfo("📩 Mensagem recebida", { phone, mensagem });

        // 1️⃣ Salvar mensagem do usuário (AGORA É SEGURO)
        await addConversation(phone, "user", mensagem);

        // 2️⃣ Verificar se usuário existe
        const existe = await usuarioExiste(phone);

        let respostaFinal = null;

        if (!existe) {
            await registrarUser(phone);

            respostaFinal =
                mensagemBoasVindas() +
                "\n\n" +
                mostrarMenu();
        } else {
            // 3️⃣ Processar NLP
            respostaFinal = await processarMensagem(phone, mensagem);
        }

        // 4️⃣ ENVIO CENTRALIZADO
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
