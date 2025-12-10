import { 
    parseIngredientes, 
    calcularDietaProfissional, 
    formatarDietaAPP 
} from "../services/dietaCalculator.js";

import { sendMessage } from "../services/whatsapp.js";
import { updateUser, getUser } from "../database/database.js";

export async function dietaProfissionalController(phone, msg) {
    try {
        // Proteção para não capturar dietas de outros módulos
        const texto = msg.toLowerCase();
        if (texto.includes("leite") || texto.includes("bezerro") || texto.includes("recria")) {
            return null; 
        }

        // Captura do peso
        const matchPeso = msg.match(/(\d+)\s?kg/i);
        if (!matchPeso) {
            return sendMessage(
                phone,
                "⚠️ Envie no formato:\n\n" +
                "dieta 391 kg\n" +
                "milho 60kg\nsoja 30kg\ncasca 40kg\nnucleo 10kg"
            );
        }

        const peso = Number(matchPeso[1]);

        // Captura dos ingredientes
        const ingredientes = parseIngredientes(msg);
        if (ingredientes.length === 0) {
            return sendMessage(
                phone,
                "⚠️ Não encontrei ingredientes válidos.\n\n" +
                "Exemplo:\n" +
                "dieta 391 kg\n" +
                "milho 60kg\nsoja 30kg\ncasca 40kg\nnucleo 10kg"
            );
        }

        // Cálculo da dieta PRO
        const resultado = calcularDietaProfissional(peso, ingredientes);
        const resposta = formatarDietaAPP(resultado, ingredientes);

        // Salvar dieta na memória do usuário
        const user = await getUser(phone);

        await updateUser(phone, {
            data: {
                ...user.data,
                ultima_dieta: {
                    tipo: "corte_pro",
                    peso,
                    ingredientes,
                    resultado
                }
            }
        });

        return sendMessage(phone, resposta);

    } catch (err) {
        console.error(err);
        return sendMessage(phone, "❌ Erro ao calcular dieta.");
    }
}
