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

export async function dietaBezerroRecriaController(phone, msg) {
    const texto = msg.toLowerCase();

    // ----- Detectar bezerros -----
    if (texto.includes("bezerro") || texto.includes("bezerra")) {
        const peso = extrairPesoBezerro(msg);
        
        if (!peso)
            return "⚠️ Envie: dieta bezerro 120 kg";
        
        const r = calcularDietaBezerro(peso);
        return formatarDietaBezerro(r);
    }

    // ----- Detectar recria -----
    if (texto.includes("recria")) {
        const peso = extrairPesoRecria(msg);

        if (!peso)
            return "⚠️ Envie: dieta recria 220 kg";

        const r = calcularDietaRecria(peso);
        return formatarDietaRecria(r);
    }

    return null;
}
