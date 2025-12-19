import { 
    parseIngredientes, 
    calcularDietaProfissional, 
    formatarDietaAPP 
} from "../services/dietaCalculator.js";

import { updateUser, getUser } from "../database/database.js";

export async function dietaProfissionalController(phone, msg) {
    try {
        const texto = msg.toLowerCase();

        // 🔒 Ignora se não for dieta de corte
        if (texto.includes("leite") || texto.includes("bezerro") || texto.includes("recria")) {
            return null;
        }

        // 📏 Extrair peso
        const matchPeso = msg.match(/(\d+)\s?kg/i);
        if (!matchPeso) {
            return (
                "⚠️ Envie no formato:\n\n" +
                "dieta 391 kg\n" +
                "milho 60kg\nsoja 30kg\ncasca 40kg\nnucleo 10kg"
            );
        }

        const peso = Number(matchPeso[1]);

        // 🌽 Ingredientes
        const ingredientes = parseIngredientes(msg);
        if (ingredientes.length === 0) {
            return (
                "⚠️ Não encontrei ingredientes válidos.\n\n" +
                "Exemplo:\n" +
                "dieta 391 kg\n" +
                "milho 60kg\nsoja 30kg\ncasca 40kg\nnucleo 10kg"
            );
        }

        // 🧮 Cálculo
        const resultado = calcularDietaProfissional(peso, ingredientes);
        const resposta = formatarDietaAPP(resultado, ingredientes);

        // 👤 Buscar usuário (pode ser null)
        const user = await getUser(phone);

        // 🔐 ATUALIZAÇÃO SEGURA DO ESTADO
        await updateUser(phone, {
            data: {
                ...(user?.data || {}),   // <<< AJUSTE CRÍTICO
                ultima_dieta: {
                    tipo: "corte_pro",
                    peso,
                    ingredientes,
                    resultado
                }
            }
        });

        return resposta;

    } catch (err) {
        console.error(err);
        return "❌ Erro ao calcular dieta.";
    }
}
