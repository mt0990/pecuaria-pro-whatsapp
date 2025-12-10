import { 
    extrairPesoLeite, 
    calcularDietaLeite, 
    formatarDietaLeite 
} from "../services/dietaLeiteCalculator.js";

import { sendMessage } from "../services/whatsapp.js";
import { updateUser, getUser } from "../database/database.js";

export async function dietaLeiteiraController(phone, msg) {
    try {
        const valores = extrairPesoLeite(msg);

        // Validação
        if (!valores) {
            return sendMessage(
                phone,
                `⚠️ Envie no formato correto:

*dieta leite 550 kg 20 litros*

Ou:

*dieta vaca leiteira 600 kg 18 litros*`
            );
        }

        const { peso, litros } = valores;

        // Proteções adicionais
        if (peso < 300 || peso > 900) {
            return sendMessage(phone, "⚠️ Informe um peso entre 300 kg e 900 kg.");
        }

        if (litros < 5 || litros > 70) {
            return sendMessage(phone, "⚠️ Informe litros produzidos entre 5 e 70.");
        }

        // Cálculo da dieta
        const resultado = calcularDietaLeite(peso, litros);
        const resposta = formatarDietaLeite(resultado);

        // Salvar memória do usuário
        const user = await getUser(phone);

        await updateUser(phone, {
            data: {
                ...user.data,
                ultima_dieta: {
                    tipo: "leiteira",
                    peso,
                    litros,
                    resultado
                }
            }
        });

        // Retorno final
        return sendMessage(phone, resposta);

    } catch (err) {
        console.error(err);
        return sendMessage(phone, "❌ Erro ao calcular dieta de vaca leiteira.");
    }
}
