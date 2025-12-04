import { mostrarMenu, processarOpcaoMenu } from "../controllers/menuController.js";
import { registrarAnimal, listarAnimais } from "../controllers/animalController.js";
import { criarLote, adicionarAoLote } from "../controllers/loteController.js";
import { calcularDieta, calcularUA, calcularLotacao, custoPorArroba } from "./cattle.js";
import { diagnosticoAnimal } from "../controllers/diagnosticoController.js";
import { respostaGPT } from "./gpt.js";   // ✔️ AJUSTADO
import { sendMessage } from "../services/whatsapp.js";

import { logInfo, logError } from "../utils/logger.js";

export async function processarMensagem(phone, msg) {

    logInfo("📩 Mensagem recebida", { phone, msg });

    const texto = msg.toLowerCase().trim();

    try {

        if (/(menu|ajuda|help)/.test(texto)) {
            await mostrarMenu(phone);
            return null;
        }

        if (/^\d$/.test(texto)) {
            const resposta = await processarOpcaoMenu(phone, texto);

            if (resposta?.acao === "listar_animais") {
                return await listarAnimais(phone);
            }
            return resposta;
        }

        if (texto.startsWith("registrar animal"))
            return await registrarAnimal(phone, msg);

        if (texto === "listar animais")
            return await listarAnimais(phone);

        if (texto.startsWith("criar lote")) {
            const nome = texto.replace("criar lote", "").trim();
            return await criarLote(phone, nome);
        }

        if (texto.startsWith("adicionar ao lote")) {
            const partes = texto.split(" ");
            return await adicionarAoLote(phone, partes[3], partes[4]);
        }

        if (texto.includes("dieta"))
            return await calcularDieta(phone, msg);

        if (texto.includes("ua ") || texto === "ua")
            return await calcularUA(phone, msg);

        if (texto.includes("lotacao"))
            return await calcularLotacao(phone, msg);

        if (texto.includes("arroba"))
            return await custoPorArroba(phone, msg);

        if (msg.length > 25 && !texto.includes("gpt"))
            return await diagnosticoAnimal(phone, msg);

        // 🔹 enviar para GPT
        return await respostaGPT(phone, msg);

    } catch (err) {

        logError(err, { phone, msg, local: "processarMensagem" });

        return await sendMessage(
            phone,
            "⚠️ Ops, ocorreu um erro ao processar sua mensagem. Tente novamente."
        );
    }
}
