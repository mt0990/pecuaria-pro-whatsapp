import { processarMensagem } from "../services/nlp.js";
import { sendMessage } from "../services/whatsapp.js";
import { usuarioExiste, registrarUser } from "./userController.js";
import { mensagemBoasVindas } from "../utils/welcome.js";
import { mostrarMenu } from "./menuController.js";

export async function handleIncoming(req, res, next) {
    try {
        const { data } = req.body;
        const phone = data.from;
        const mensagem = data.body.trim();

        // Primeiro acesso (novo usuário)
        const existe = await usuarioExiste(phone);
        if (!existe) {
            await registrarUser(phone);
            await sendMessage(phone, mensagemBoasVindas());
            await mostrarMenu(phone);
            return res.json({ status: "ok" });
        }

        // Processar mensagem
        const resposta = await processarMensagem(phone, mensagem);

        // Caso o processarMensagem já tenha enviado (ex: menu), NÃO enviar novamente
        if (!resposta) {
            return res.json({ status: "ok" });
        }

        // Caso a resposta seja uma ação (ex: listar animais)
        if (typeof resposta === "object" && resposta.acao) {

            if (resposta.acao === "listar_animais") {
                // IMPORTANTE: não chamar menu aqui! Apenas listar animais.
                const { listarAnimais } = await import("./animalController.js");
                await listarAnimais(phone);
                return res.json({ status: "ok" });
            }

            return res.json({ status: "ok" });
        }

        // Caso seja texto normal
        await sendMessage(phone, resposta);

        return res.json({ status: "ok" });

    } catch (err) {
        console.error(err);
        next(err);
    }
}
