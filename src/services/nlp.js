import { mostrarMenu, processarOpcaoMenu } from "../controllers/menuController.js";
import { registrarAnimal, listarAnimais } from "../controllers/animalController.js";
import { criarLote, adicionarAoLote } from "../controllers/loteController.js";
import { calcularDieta, calcularUA, calcularLotacao, custoPorArroba } from "./cattle.js";
import { diagnosticoAnimal } from "../controllers/diagnosticoController.js";
import { falarComGPT } from "../controllers/aiController.js";
import { sendMessage } from "../services/whatsapp.js";

import { logInfo, logError } from "../utils/logger.js";  // ✅ ADICIONE ISTO

export async function processarMensagem(phone, msg) {

    logInfo("📩 Mensagem recebida", { phone, msg });  // ✅ Log da entrada

    const texto = msg.toLowerCase().trim();

    try {

        // 🔹 Comandos universais
        if (/(menu|ajuda|help)/.test(texto)) {
            logInfo("➡️ Usuário pediu MENU", { phone });
            await mostrarMenu(phone);
            return null;
        }

        // 🔹 Opções de menu (número)
        if (/^\d$/.test(texto)) {
            logInfo("➡️ Usuário escolheu opção do MENU", { phone, opcao: texto });

            const resposta = await processarOpcaoMenu(phone, texto);

            if (resposta?.acao === "listar_animais") {
                return await listarAnimais(phone);
            }

            return resposta;
        }

        // 🔹 Registrar animal
        if (texto.startsWith("registrar animal")) {
            logInfo("➡️ Registrar animal", { phone });
            return await registrarAnimal(phone, msg);
        }

        // 🔹 Listar animais
        if (texto === "listar animais") {
            logInfo("➡️ Listar animais", { phone });
            return await listarAnimais(phone);
        }

        // 🔹 Criar lote
        if (texto.startsWith("criar lote")) {
            const nome = texto.replace("criar lote", "").trim();
            logInfo("➡️ Criar lote", { phone, nome });
            return await criarLote(phone, nome);
        }

        // 🔹 Adicionar ao lote
        if (texto.startsWith("adicionar ao lote")) {
            const partes = texto.split(" ");
            const lote = partes[3];
            const animalId = partes[4];

            logInfo("➡️ Adicionar ao lote", { phone, lote, animalId });

            return await adicionarAoLote(phone, lote, animalId);
        }

        // 🔹 Dieta
        if (texto.includes("dieta")) {
            logInfo("➡️ Calcular dieta", { phone });
            return await calcularDieta(phone, msg);
        }

        // 🔹 UA
        if (texto.includes("ua ") || texto === "ua") {
            logInfo("➡️ Calcular UA", { phone });
            return await calcularUA(phone, msg);
        }

        // 🔹 Lotação
        if (texto.includes("lotacao")) {
            logInfo("➡️ Calcular lotação", { phone });
            return await calcularLotacao(phone, msg);
        }

        // 🔹 Arroba
        if (texto.includes("arroba")) {
            logInfo("➡️ Custo por arroba", { phone });
            return await custoPorArroba(phone, msg);
        }

        // 🔹 Diagnóstico automático
        if (msg.length > 25 && !texto.includes("gpt")) {
            logInfo("➡️ Diagnóstico", { phone });
            return await diagnosticoAnimal(phone, msg);
        }

        // 🔹 Falar com GPT
        logInfo("➡️ Enviando para GPT", { phone, msg });
        return await falarComGPT(phone, msg);

    } catch (err) {
        // ❌ Captura qualquer erro inesperado no fluxo
        logError(err, { phone, msg, local: "processarMensagem" });

        return await sendMessage(phone,
            "⚠️ Ops, ocorreu um erro ao processar sua mensagem. Tente novamente."
        );
    }
}
