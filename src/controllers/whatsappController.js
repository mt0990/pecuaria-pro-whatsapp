import { processarMensagem } from "../services/nlp.js";
import { sendMessage } from "../services/whatsapp.js";
import { usuarioExiste, registrarUser } from "./userController.js";
import { mensagemBoasVindas } from "../utils/welcome.js";
import { mostrarMenu } from "./menuController.js";
import { listarAnimais } from "./animalController.js";

export async function handleIncoming(req, res, next) {
    try {
        const { data } = req.body;
        const phone = data.from;
        const mensagem = data.body.trim();

        // Primeiro acesso do usuário
        const existe = await usuarioExiste(phone);
        if (!existe) {
            await registrarUser(phone);
            await sendMessage(phone, mensagemBoasVindas());
            await mostrarMenu(phone);
            return res.status(200).json({ status: "ok" });
        }

        // Processamento normal
        const resposta = await processarMensagem(phone, mensagem);

        // SE A RESPOSTA FOR UMA AÇÃO DO MENU
        if (typeof resposta === "object" && resposta.acao) {

            if (resposta.acao === "listar_animais") {
                await listarAnimais(phone);
                return res.status(200).json({ status: "ok" });
            }

            return res.status(200).json({ status: "ok" });
        }

        // Resposta normal
        if (resposta) {
            await sendMessage(phone, resposta);
        }

        return res.status(200).json({ status: "ok" });

    } catch (err) {
        next(err);
    }
}
