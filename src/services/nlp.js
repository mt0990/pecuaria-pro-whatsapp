import { mostrarMenu, processarOpcaoMenu } from "../controllers/menuController.js";

// Controllers
import { registrarAnimal, listarAnimais } from "../controllers/animalController.js";
import { criarLote, adicionarAoLote } from "../controllers/loteController.js";
import { calcularDieta, calcularUA, calcularLotacao, custoPorArroba } from "./cattle.js";
import { diagnosticoAnimal } from "../controllers/diagnosticoController.js";
import { falarComGPT } from "../controllers/aiController.js";
import { sendMessage } from "../services/whatsapp.js";

export async function processarMensagem(phone, msg) {

    const texto = msg.toLowerCase().trim();

    // 🔹 Comandos universais
    if (/(menu|ajuda|help)/.test(texto)) {
        await mostrarMenu(phone);
        return null;
    }

    // 🔹 Opções de menu (apenas um número)
    if (/^\d$/.test(texto)) {
        const resposta = await processarOpcaoMenu(phone, texto);

        if (resposta?.acao === "listar_animais") {
            return await listarAnimais(phone);
        }

        return resposta;
    }

    // 🔹 Registrar animal
    if (texto.startsWith("registrar animal")) {
        return await registrarAnimal(phone, msg);
    }

    // 🔹 Listar animais
    if (texto === "listar animais") {
        return await listarAnimais(phone);
    }

    // 🔹 Criar lote
    if (texto.startsWith("criar lote")) {
        const nome = texto.replace("criar lote", "").trim();
        return await criarLote(phone, nome);
    }

    // 🔹 Adicionar ao lote
    if (texto.startsWith("adicionar ao lote")) {
        const partes = texto.split(" ");
        const lote = partes[3];
        const animalId = partes[4];
        return await adicionarAoLote(phone, lote, animalId);
    }

    // 🔹 Calcular dieta
    if (texto.includes("dieta")) return await calcularDieta(phone, msg);

    // 🔹 UA
    if (texto.includes("ua")) return await calcularUA(phone, msg);

    // 🔹 Lotação
    if (texto.includes("lotacao")) return await calcularLotacao(phone, msg);

    // 🔹 Arroba
    if (texto.includes("arroba")) return await custoPorArroba(phone, msg);

    // 🔹 Diagnóstico
    if (msg.length > 25 && !texto.includes("gpt")) {
        return await diagnosticoAnimal(phone, msg);
    }

    // 🔹 Falar com o GPT
    return await falarComGPT(phone, msg);
}
