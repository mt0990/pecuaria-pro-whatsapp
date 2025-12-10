import { 
    parseIngredientes, 
    calcularDietaProfissional, 
    formatarDietaAPP 
} from "../services/dietaCalculator.js";

import { updateUser, getUser } from "../database/database.js";

export async function dietaProfissionalController(phone, msg) {
    try {
        const texto = msg.toLowerCase();
        if (texto.includes("leite") || texto.includes("bezerro") || texto.includes("recria")) {
            return null;
        }

        const matchPeso = msg.match(/(\d+)\s?kg/i);
        if (!matchPeso) {
            return (
                "⚠️ Envie no formato:\n\n" +
                "dieta 391 kg\n" +
                "milho 60kg\nsoja 30kg\ncasca 40kg\nnucleo 10kg"
            );
        }

        const peso = Number(matchPeso[1]);
        const ingredientes = parseIngredientes(msg);

        if (ingredientes.length === 0) {
            return (
                "⚠️ Não encontrei ingredientes válidos.\n\n" +
                "Exemplo:\n" +
                "dieta 391 kg\n" +
                "milho 60kg\nsoja 30kg\ncasca 40kg\nnucleo 10kg"
            );
        }

        const resultado = calcularDietaProfissional(peso, ingredientes);
        const resposta = formatarDietaAPP(resultado, ingredientes);

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

        return resposta;

    } catch (err) {
        console.error(err);
        return "❌ Erro ao calcular dieta.";
    }
}
