import { 
    parseIngredientes, 
    calcularDietaProfissional, 
    formatarDietaAPP 
} from "../services/dietaCalculator.js";

import { sendMessage } from "../services/whatsapp.js";
import { updateUser, getUser } from "../database/database.js";

export async function dietaProfissionalController(phone, msg) {
    try {
        const matchPeso = msg.match(/(\d+)\s?kg/i);
        if (!matchPeso) {
            return sendMessage(phone, "⚠️ Envie no formato:\n\ndieta 391 kg\nseguido dos ingredientes");
        }

        const peso = Number(matchPeso[1]);

        const ingredientes = parseIngredientes(msg);
        if (ingredientes.length === 0) {
            return sendMessage(phone, "⚠️ Não encontrei ingredientes válidos.");
        }

        const resultado = calcularDietaProfissional(peso, ingredientes);
        const resposta = formatarDietaAPP(resultado, ingredientes);

        // SALVA A DIETA NA MEMÓRIA DO USUÁRIO
        const user = await getUser(phone);
        await updateUser(phone, {
            data: {
                ...user.data,
                ultima_dieta: {
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
