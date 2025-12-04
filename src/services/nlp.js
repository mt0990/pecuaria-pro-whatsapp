import { mostrarMenu, processarOpcaoMenu } from "../controllers/menuController.js";
import { registrarAnimal, listarAnimais } from "../controllers/animalController.js";
import { criarLote, adicionarAoLote } from "../controllers/loteController.js";
import { calcularDieta, calcularUA, calcularLotacao, custoPorArroba } from "./cattle.js";
import { diagnosticoAnimal } from "../controllers/diagnosticoController.js";
import { falarComGPT } from "../controllers/aiController.js";

export async function processarMensagem(phone, msg) {

    msg = msg.trim().toLowerCase();

    // Comandos universais
    if (/^(menu|ajuda|help)$/i.test(msg)) {
        await mostrarMenu(phone);
        return null;
    }

    // Opções do menu (1 a 9)
    if (/^[0-9]$/.test(msg)) {
        return await processarOpcaoMenu(phone, msg);
    }

    // Registrar animal
    if (msg.startsWith("registrar animal")) {
        return await registrarAnimal(phone, msg);
    }

    // Listar animais
    if (msg === "listar animais") {
        return await listarAnimais(phone);
    }

    // Criar lote
    if (msg.startsWith("criar lote")) {
        const nome = msg.replace("criar lote", "").trim();
        return await criarLote(phone, nome);
    }

    // Adicionar ao lote
    if (msg.startsWith("adicionar ao lote")) {
        const partes = msg.split(" ");
        const lote = partes[3];
        const animalId = partes[4];
        return await adicionarAoLote(phone, lote, animalId);
    }

    // Cálculos
    if (msg.includes("dieta")) return await calcularDieta(phone, msg);
    if (msg.includes("ua")) return await calcularUA(phone, msg);
    if (msg.includes("lotacao")) return await calcularLotacao(phone, msg);
    if (msg.includes("arroba")) return await custoPorArroba(phone, msg);

    // Diagnóstico (somente se o usuário vier do menu)
    if (msg.startsWith("diagnosticar")) {
        const texto = msg.replace("diagnosticar", "").trim();
        return await diagnosticoAnimal(phone, texto);
    }

    // Chat GPT geral
    return await falarComGPT(phone, msg);
}
