import { mostrarMenu, processarOpcaoMenu } from "../controllers/menuController.js";
import { registrarAnimal, listarAnimais } from "../controllers/animalController.js";
import { criarLote, adicionarAoLote } from "../controllers/loteController.js";
import { calcularDieta, calcularUA, calcularLotacao, custoPorArroba } from "./cattle.js";
import { diagnosticoAnimal } from "../controllers/diagnosticoController.js";
import { falarComGPT } from "../controllers/aiController.js";

export async function processarMensagem(phone, msg) {

    msg = msg.toLowerCase().trim();

    // Comando universal
    if (msg === "menu") {
        await mostrarMenu(phone);
        return null;  // NÃO ENVIA MENU 2x
    }

    // Usuário digitou número do menu
    if (/^[0-9]$/.test(msg)) {
        return await processarOpcaoMenu(phone, msg);
    }

    // Registrar animal
    if (msg.startsWith("registrar animal")) {
        return await registrarAnimal(phone, msg);
    }

    // Listar animais
    if (msg === "listar animais") {
        return { acao: "listar_animais" };
    }

    // Criar lote
    if (msg.startsWith("criar lote")) {
        return await criarLote(phone, msg.replace("criar lote", "").trim());
    }

    // Adicionar animal ao lote
    if (msg.startsWith("adicionar ao lote")) {
        const partes = msg.split(" ");
        return await adicionarAoLote(phone, partes[3], partes[4]);
    }

    // Cálculos
    if (msg.includes("dieta")) return await calcularDieta(phone, msg);
    if (msg.includes("ua")) return await calcularUA(phone, msg);
    if (msg.includes("lotacao")) return await calcularLotacao(phone, msg);
    if (msg.includes("arroba")) return await custoPorArroba(phone, msg);

    // Diagnóstico
    if (msg.length > 20 && !msg.includes("gpt")) {
        return await diagnosticoAnimal(phone, msg);
    }

    // Modo GPT
    return await falarComGPT(phone, msg);
}
