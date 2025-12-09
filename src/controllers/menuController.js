import { sendMessage } from "../services/whatsapp.js";

// ===============================
// MENU PRINCIPAL
// ===============================
export async function mostrarMenu(phone) {
    const texto = `
📋 *MENU PRINCIPAL — Pecuária Pro*

Escolha uma opção enviando apenas o número:

1️⃣ Animais  
2️⃣ Lotes  
3️⃣ Cálculos (Dieta, UA, Arroba, Lotação)  
4️⃣ Diagnóstico / sintomas  
5️⃣ Falar com o GPT 🤖  

ℹ️ Dica: digite *menu* a qualquer momento.
`;
    return sendMessage(phone, texto);
}


// ===============================
// SUBMENUS PREMIUM
// ===============================

export async function mostrarMenuAnimais(phone) {
    const texto = `
🐮 *MÓDULO ANIMAIS*

1.1 ➕ Registrar animal  
1.2 📋 Listar animais  
1.3 ✏️ Editar animal  
1.4 ❌ Remover animal  

⬅️ Digite *menu* para voltar.
`;
    return sendMessage(phone, texto);
}

export async function mostrarMenuLotes(phone) {
    const texto = `
📦 *MÓDULO LOTES*

2.1 ➕ Criar lote  
2.2 📋 Listar lotes  
2.3 🐮 Adicionar animal ao lote  
2.4 ❌ Remover animal do lote  
2.5 🗑️ Deletar lote  

⬅️ Digite *menu* para voltar.
`;
    return sendMessage(phone, texto);
}

export async function mostrarMenuCalculos(phone) {
    const texto = `
🥩 *MÓDULO DIETA & CÁLCULOS*

3.1 🍽️ Dieta automatizada  
3.2 🐂 Custo por arroba  
3.3 🌱 UA (Unidade Animal)  
3.4 🌾 Lotação UA/ha  
3.5 🧪 Dieta PRO (MS, PB, NDT, ajuste)

⬅️ Digite *menu* para voltar.
`;
    return sendMessage(phone, texto);
}

export async function mostrarMenuDiagnostico(phone) {
    const texto = `
🩺 *DIAGNÓSTICO VETERINÁRIO*

Envie sintomas detalhados para análise.
⬅️ Digite *menu* para voltar.
`;
    return sendMessage(phone, texto);
}

export async function mostrarMenuGPT(phone) {
    const texto = `
🤖 *ASSISTENTE GPT — Premium*

Envie qualquer pergunta!
⬅️ Digite *menu* para voltar.
`;
    return sendMessage(phone, texto);
}


// ===============================
// PROCESSADOR DE OPÇÕES
// ===============================
export async function processarOpcaoMenu(phone, opcao) {

    switch (opcao) {

        // ==========================
        // MENU PRINCIPAL
        // ==========================
        case "1":
            return { submenu: "animais" };

        case "2":
            return { submenu: "lotes" };

        case "3":
            return { submenu: "calculos" };

        case "4":
            return { submenu: "diagnostico" };

        case "5":
            return { submenu: "gpt" };


        // ==========================
        // SUBMENU — ANIMAIS
        // ==========================
        case "1.1":
            return "📌 Envie no formato:\nregistrar animal nome raça peso idade notas";

        case "1.2":
            return { acao: "listar_animais" };

        case "1.3":
            return "📌 Envie: editar animal ID campo novo_valor";

        case "1.4":
            return "📌 Envie: remover animal ID";


        // ==========================
        // SUBMENU — LOTES
        // ==========================
        case "2.1":
            return "📌 Envie: criar lote nome_do_lote";

        case "2.2":
            return { acao: "listar_lotes" };

        case "2.3":
            return "📌 Envie: adicionar ao lote nome_do_lote id_do_animal";

        case "2.4":
            return "📌 Envie: remover do lote nome_do_lote id_do_animal";

        case "2.5":
            return "📌 Envie: remover lote nome_do_lote";


        // ==========================
        // SUBMENU — CÁLCULOS
        // ==========================
        case "3.1":
            return "📌 Envie: dieta peso animal ingredientes quantidades";

        case "3.2":
            return "📌 Envie: custo por arroba peso_kg valor_total";

        case "3.3":
            return "📌 Envie: ua peso_kg";

        case "3.4":
            return "📌 Envie: lotacao area_ha numero_animais";

        case "3.5":
    return "📘 *Dieta PRO – Envie a dieta no formato:*\n\n" +
           "dieta 391 kg\n" +
           "milho 60kg\n" +
           "soja 30kg\n" +
           "casca 50kg\n" +
           "nucleo 10kg";

        // ==========================
        // SUBMENU — DIAGNÓSTICO
        // ==========================
        case "4":
            return "🩺 Envie os sintomas do animal.";


        // ==========================
        // DEFAULT
        // ==========================
        default:
            return "❌ Opção inválida. Digite *menu*.";
    }
}
