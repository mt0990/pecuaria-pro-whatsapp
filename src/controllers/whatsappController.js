import { processarMensagem } from "../services/nlp.js";
import { sendMessage } from "../services/whatsapp.js";
import { usuarioExiste, registrarUser } from "./userController.js";
import { mensagemBoasVindas } from "../utils/welcome.js";
import { mostrarMenu } from "./menuController.js";

export async function handleIncoming(req, res, next) {
    try {
        const { data } = req.body;

        if (!data) {
            return res.status(400).json({ error: "Payload inválido" });
        }

        const phone = data.from;
        const mensagem = (data.body || "").trim();

        // 🔹 Verificar se o usuário já existe
        const existe = await usuarioExiste(phone);

        if (!existe) {
            await registrarUser(phone);
            await sendMessage(phone, mensagemBoasVindas());
            await mostrarMenu(phone);
            return res.status(200).json({ status: "ok" });
        }

        // 🔹 Processamento normal
        const resposta = await processarMensagem(phone, mensagem);

        if (resposta && typeof resposta === "string") {
            await sendMessage(phone, resposta);
        }

        return res.status(200).json({ status: "ok" });

    } catch (err) {
        console.error("❌ Erro no handleIncoming:", err);
        next(err);
    }
}
