// =============================================
// 🐮 RECRIA — DIETA PROFISSIONAL (8–18 meses)
// Pecuária Pro — MS, PB e NDT otimizados
// =============================================

// Extrai o peso (somente o primeiro número relevante)
export function extrairPesoRecria(msg) {
    // captura números seguidos ou precedidos de "kg"
    const match = msg.match(/(\d+)\s?(kg)?/i);
    return match ? Number(match[1]) : null;
}

// Cálculo da dieta para recria
export function calcularDietaRecria(peso) {
    const ms = peso * 0.027; // 2,7% do PV — ótimo para recria

    return {
        peso,
        ms,
        pb: 14,  // Proteína bruta adequada para crescimento
        ndt: 70  // Energia intermediária para ganho de peso
    };
}

// Formatação para envio no WhatsApp
export function formatarDietaRecria(resultado) {
    return `
🐮 *DIETA PROFISSIONAL — Recria (8–18 meses)*

📏 *Peso:* ${resultado.peso} kg  
📦 *Consumo de MS:* ${resultado.ms.toFixed(1)} kg/dia  

🔬 *Requisitos nutricionais:*  
• PB: ${resultado.pb}%  
• NDT: ${resultado.ndt}%  

🎯 *Indicações:*  
• Volumoso de boa qualidade (silagem / capim)  
• Suplementação proteica conforme estação  
• Dieta ideal para ganhos de 400–700 g/dia  
`;
}
