import { 
    parseIngredientes, 
    calcularDietaProfissional, 
    formatarDietaAPP
} from "../services/dietaCalculator.js";

import { sendMessage } from "../services/whatsapp.js";

// ==============================================
// 🐮 DIETA PROFISSIONAL – CONTROLADOR OFICIAL
// ==============================================

export async function dietaProfissionalController(phone, msg) {
    try {
        // 1 — Extrair peso vivo
        const matchPeso = msg.match(/(\d+)\s?kg/i);
        if (!matchPeso) {
            return sendMessage(
                phone,
                "⚠️ Envie no formato:\n\n*dieta 391 kg*\nseguido dos ingredientes"
            );
        }

        const peso = Number(matchPeso[1]);

        // 2 — Extrair ingredientes
        const ingredientes = parseIngredientes(msg);

        if (ingredientes.length === 0) {
            return sendMessage(
                phone,
                "⚠️ Não encontrei ingredientes válidos.\n\nExemplo:\n*dieta 391 kg*\nmilho 60kg\nsoja 30kg\ncasca 40kg\nnucleo 10kg"
            );
        }

        // 3 — Calcular dieta PRO
        const resultado = calcularDietaProfissional(peso, ingredientes);

        // 4 — Formatar resposta para WhatsApp
        const resposta = formatarDietaAPP(resultado, ingredientes);

        return sendMessage(phone, resposta);

    } catch (err) {
        console.error(err);
        return sendMessage(phone, "❌ Erro ao calcular dieta.");
    }
}
