import { sendMessage } from "../services/whatsapp.js";

export async function mostrarMenu(phone) {
    const texto = `
📋 *MENU PRINCIPAL — Pecuária Pro*

Escolha uma opção enviando apenas o número:

1️⃣ Registrar animal  
2️⃣ Listar animais  
3️⃣ Criar lote  
4️⃣ Adicionar animal ao lote  
5️⃣ Cálculos (Dieta, UA, Arroba, Lotação)  
9️⃣ Diagnóstico / sintomas  
0️⃣ Falar com o GPT 🤖  

ℹ️ Dica: digite *menu* a qualquer momento.
`;
    return await sendMessage(phone, texto);
}

export async function processarOpcaoMenu(phone, opcao) {
    switch (opcao) {
        case "1": 
            return "📌 Envie no formato:\nregistrar animal nome raça peso idade notas";

        case "2":
            return { acao: "listar_animais" };

        case "3":
            return "📌 Envie: criar lote nome_do_lote";

        case "4":
            return "📌 Envie: adicionar ao lote nome_do_lote id_do_animal";

        case "5":
            return "📌 Envie: dieta, ua, arroba ou lotacao";

        case "9":
            return "📌 Envie os sintomas do animal.";

        case "0":
            return "🤖 Modo GPT ativado! Envie sua pergunta.";

        default:
            return "❌ Opção inválida. Digite um número entre 0 e 9.";
    }
}
