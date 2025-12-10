import { extrairPesoLeite, calcularDietaLeite, formatarDietaLeite } 
from "../services/dietaLeiteCalculator.js";

import { sendMessage } from "../services/whatsapp.js";
import { getUser, updateUser } from "../database/database.js";

export async function dietaLeiteiraController(phone, msg) {
    try {
        const valores = extrairPesoLeite(msg);

        if (!valores) {
            return sendMessage(phone,
`⚠️ Envie no formato correto:

dieta leite 550 kg 20 litros

Ou:

dieta vaca leiteira 600 kg 18 litros`);
        }

        const { peso, litros } = valores;

        const resultado = calcularDietaLeite(peso, litros);

        // ================================
        // 🔥 SALVAR NO SUPABASE
        // ================================
        const user = await getUser(phone);

        await updateUser(phone, {
    data: {
        ...user?.data,
        ultima_dieta: {
            tipo: "leite",
            peso,
            litros,
            resultado
        },
        contexto: {
            assunto: "dieta",
            tipo: "leite",
            ultima_msg: formatarDietaLeite(resultado)
        }
    }
});

        // ================================
        // 🔥 ENVIAR RESPOSTA AO USUÁRIO
        // ================================
        return sendMessage(phone, formatarDietaLeite(resultado));

    } catch (err) {
        console.error(err);
        return sendMessage(phone, "❌ Erro ao calcular dieta de vaca leiteira.");
    }
}
