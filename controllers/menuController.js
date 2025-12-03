// =========================================
// 📋 MENU CONTROLLER – Pecuária Pro
// =========================================

import { sendMessage } from "../services/whatsapp.js";
import { listarAnimais } from "./animalController.js";
import { listarTodosLotes } from "./loteController.js";

// =========================================
// 📌 Mostrar Menu Principal
// =========================================
export async function mostrarMenu(phone) {
    const menu = `
📋 *MENU PRINCIPAL – Pecuária Pro*  
Escolha uma das opções abaixo:

1️⃣ Registrar animal  
2️⃣ Listar todos os animais  
3️⃣ Adicionar ao lote  
4️⃣ Listar meus lotes  
5️⃣ Dieta (cálculo rápido)  
6️⃣ Custo por arroba  
7️⃣ Unidade Animal (UA)  
8️⃣ Lotação UA/ha  
9️⃣ Diagnóstico / Cuidados / Vacinas 🩺  
0️⃣ Falar com o assistente (GPT)

Digite apenas o número da opção.
    `.trim();

    return sendMessage(phone, menu);
}

// =========================================
// 📌 Processar escolha do menu (0–9)
// =========================================
export async function processarOpcaoMenu(phone, opcaoBruta) {
    // Remove emojis, espaços e qualquer coisa que não seja número
    const opcao = opcaoBruta.replace(/\D/g, "");

    switch (opcao) {

        // =========================================
        // 1️⃣ Registrar animal
        // =========================================
        case "1":
            return sendMessage(
                phone,
                "Para registrar um animal, envie no formato:\n\n" +
                "*registrar animal nome raça peso idade notas*"
            );

        // =========================================
        // 2️⃣ Listar todos os animais
        // =========================================
        case "2":
            return listarAnimais(phone);

        // =========================================
        // 3️⃣ Adicionar ao lote
        // =========================================
        case "3":
            return sendMessage(
                phone,
                "Para adicionar ao lote envie:\n\n" +
                "*adicionar ao lote 1 boi nelore 350kg 2 animais*"
            );

        // =========================================
        // 4️⃣ Listar todos os lotes
        // =========================================
        case "4":
            return listarTodosLotes(phone);

        // =========================================
        // 5️⃣ Dieta
        // =========================================
        case "5":
            return sendMessage(
                phone,
                "Para calcular a dieta envie:\n\n" +
                "*dieta 380kg 20 animais*"
            );

        // =========================================
        // 6️⃣ Custo da arroba
        // =========================================
        case "6":
            return sendMessage(
                phone,
                "Para calcular custo por arroba envie:\n\n" +
                "*custo 1.20 peso 350kg*"
            );

        // =========================================
        // 7️⃣ Unidade Animal (UA)
        // =========================================
        case "7":
            return sendMessage(
                phone,
                "Para calcular UA envie:\n\n" +
                "*UA 420kg 10 animais*"
            );

        // =========================================
        // 8️⃣ Lotação (UA/ha)
        // =========================================
        case "8":
            return sendMessage(
                phone,
                "Para calcular lotação envie:\n\n" +
                "*lotação 20 bois 350kg 10ha*"
            );

        // =========================================
        // 9️⃣ Diagnóstico / Vacinas / Manejo
        // =========================================
        case "9":
            return sendMessage(
                phone,
`🩺 *Diagnóstico, Vacinas e Cuidados*
Envie sua dúvida sobre saúde, vacinas ou manejo.

Exemplos:

• "Boi com febre"  
• "O que aplicar para tristeza parasitária?"  
• "Vacina para bezerro de 3 meses"  
• "Boi mancando"  
• "Controle de carrapato"  
`
            );

        // =========================================
        // 0️⃣ Falar com o GPT
        // =========================================
        case "0":
            return sendMessage(phone, "Claro! Pode enviar sua pergunta.");

        // =========================================
        // ❌ Opção inválida
        // =========================================
        default:
            return sendMessage(
                phone,
                "❌ Opção inválida. Digite apenas números de 0 a 9."
            );
    }
}
