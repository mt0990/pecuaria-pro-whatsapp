// =========================================
// 📌 ANIMAL CONTROLLER – CRUD de Animais
// =========================================

import {
    salvarAnimalDB,
    getAnimalsByUser,
    updateAnimalDB,
    deleteAnimalDB
} from "../database/database.js";

import { sendMessage } from "../services/whatsapp.js";

// =========================================
// 📌 Registrar Animal
// =========================================
export async function registrarAnimal(phone, data) {
    await salvarAnimalDB({
        telefone: phone,
        numero_boi: data.numero_boi,
        nome: data.nome,
        raca: data.raca,
        peso: data.peso,
        idade: data.idade,
        notas: data.notas
    });

    return sendMessage(phone, "🐄 Animal registrado com sucesso!");
}

// =========================================
// 📌 Atualizar Animal
// =========================================
export async function atualizarAnimal(phone, data) {
    await updateAnimalDB(data.numero_boi, {
        peso: data.peso,
        idade: data.idade,
        raca: data.raca,
        notas: data.notas
    });

    return sendMessage(phone, "✔ Animal atualizado!");
}

// =========================================
// 📌 Deletar Animal
// =========================================
export async function deletarAnimal(phone, numero) {
    await deleteAnimalDB(numero);
    return sendMessage(phone, "🗑 Animal removido!");
}

// =========================================
// 📌 Listar Animais
// =========================================
export async function listarAnimais(phone) {
    const animais = await getAnimalsByUser(phone);

    if (!animais.length)
        return sendMessage(phone, "📭 Você não tem animais cadastrados.");

    let txt = "🐮 *Seus animais cadastrados*\n\n";

    animais.forEach(a => {
        txt += `• Boi #${a.numero_boi}
📌 Nome: ${a.nome}
🐄 Raça: ${a.raca || "não informada"}
⚖️ Peso: ${a.peso} kg
📅 Idade: ${a.idade} ano(s)
📝 Obs: ${a.notas || "nenhuma"}\n\n`;
    });

    return sendMessage(phone, txt);
}
