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

        if (!data?.from || !data?.body) {
            return res.sendStatus(200);
        }

        const phone = data.from;
        const mensagem = data.body.trim();

        logInfo("📩 Mensagem recebida", { phone, mensagem });

        // 1️⃣ Salvar mensagem do usuário
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

        // 4️⃣ ENVIO CENTRALIZADO (ÚNICO LUGAR)
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
