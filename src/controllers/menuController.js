// ===============================
// MENU PRINCIPAL (RETORNA TEXTO)
// ===============================
export function mostrarMenu() {
    return `
📋 *MENU PRINCIPAL — Pecuária Pro*

Escolha uma opção enviando apenas o número:

1️⃣ Animais  
2️⃣ Lotes  
3️⃣ Cálculos (Dieta, UA, Arroba, Lotação)  
4️⃣ Diagnóstico / sintomas  
5️⃣ Falar com o GPT 🤖  

ℹ️ Dica: digite *menu* a qualquer momento.
`;
}

export function mostrarMenuAnimais() {
    return `
🐮 *MÓDULO ANIMAIS*

1.1 ➕ Registrar animal  
1.2 📋 Listar animais  
1.3 ✏️ Editar animal  
1.4 ❌ Remover animal  

⬅️ Digite *menu* para voltar.
`;
}

export function mostrarMenuLotes() {
    return `
📦 *MÓDULO LOTES*

2.1 ➕ Criar lote  
2.2 📋 Listar lotes  
2.3 🐮 Adicionar animal ao lote  
2.4 ❌ Remover animal do lote  
2.5 🗑️ Deletar lote  

⬅️ Digite *menu* para voltar.
`;
}

export function mostrarMenuCalculos() {
    return `
🥩 *MÓDULO DIETA & CÁLCULOS*

3.1 🍽️ Dieta Corte (automática)  
3.2 🐄 Custo por arroba  
3.3 🌱 UA (Unidade Animal)  
3.4 🌾 Lotação UA/ha  
3.5 🧪 Dieta PRO Corte  
3.6 🍼 Dieta Bezerros  
3.7 🐮 Dieta Recria  
3.8 🥛 Dieta Leite  

⬅️ Digite *menu* para voltar.
`;
}

export function mostrarMenuDiagnostico() {
    return `
🩺 *DIAGNÓSTICO VETERINÁRIO*

Envie sintomas detalhados para análise.
⬅️ Digite *menu* para voltar.
`;
}

export function mostrarMenuGPT() {
    return `
🤖 *ASSISTENTE GPT — Premium*

Envie qualquer pergunta!
⬅️ Digite *menu* para voltar.
`;
}

// ===============================
// PROCESSADOR DE OPÇÕES (RETORNA)
// ===============================
export function processarOpcaoMenu(opcao) {
    switch (opcao) {
        case "1": return { submenu: "animais" };
        case "2": return { submenu: "lotes" };
        case "3": return { submenu: "calculos" };
        case "4": return { submenu: "diagnostico" };
        case "5": return { submenu: "gpt" };

        case "1.1": return "📌 Envie:\nregistrar animal nome raça peso idade notas";
        case "1.2": return { acao: "listar_animais" };
        case "1.3": return "📌 Envie:\neditar animal ID\nNome\nRaça\nPeso\nIdade\nNotas";
        case "1.4": return "📌 Envie: remover animal ID";

        case "2.1": return "📌 Envie: criar lote nome_do_lote";
        case "2.2": return { acao: "listar_lotes" };
        case "2.3": return "📌 Envie: adicionar ao lote nome_do_lote id_do_animal";
        case "2.4": return "📌 Envie: remover do lote nome_do_lote id_do_animal";
        case "2.5": return "📌 Envie: remover lote nome_do_lote";

        case "3.1": return "📌 Envie: dieta 400 kg";
        case "3.2": return "📌 Envie: custo por arroba 373 kg 2200 reais";
        case "3.3": return "📌 Envie: ua 450 kg";
        case "3.4": return "📌 Envie: lotacao 10 ha 20 bois";
        case "3.5": return "📌 Dieta PRO Corte — veja exemplo no menu";
        case "3.6": return "📌 Dieta Bezerros: dieta bezerro 120kg";
        case "3.7": return "📌 Dieta Recria: dieta recria 250kg";
        case "3.8": return "📌 Dieta Leite: dieta leite 550 kg 20 litros";

        default:
            return "❌ Opção inválida. Digite *menu*.";
    }
}
