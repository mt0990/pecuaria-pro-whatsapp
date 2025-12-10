import { 
    extrairPesoBezerro,
    calcularDietaBezerro,
    formatarDietaBezerro
} from "../services/dietaBezerroCalculator.js";

import {
    extrairPesoRecria,
    calcularDietaRecria,
    formatarDietaRecria
} from "../services/dietaRecriaCalculator.js";

import { sendMessage } from "../services/whatsapp.js";

export async function dietaBezerroRecriaController(phone, msg) {
    const texto = msg.toLowerCase();

    // ----- Detectar bezerros -----
    if (texto.includes("bezerro") || texto.includes("bezerra")) {
        const peso = extrairPesoBezerro(msg);
        
        if (!peso)
            return sendMessage(phone, "⚠️ Envie: dieta bezerro 120 kg");
        
        const r = calcularDietaBezerro(peso);
        return sendMessage(phone, formatarDietaBezerro(r));
    }

    // ----- Detectar recria -----
    if (texto.includes("recria")) {
        const peso = extrairPesoRecria(msg);

        if (!peso)
            return sendMessage(phone, "⚠️ Envie: dieta recria 220 kg");

        const r = calcularDietaRecria(peso);
        return sendMessage(phone, formatarDietaRecria(r));
    }

    return null; // deixa o NLP tentar outra lógica
}
