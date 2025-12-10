// =============================================
// 🍼 DIETA PROFISSIONAL — BEZERROS (0–8 meses)
// Pecuária Pro — Módulo oficial
// =============================================

// Extrai peso do bezerro
export function extrairPesoBezerro(msg) {
    const match = msg.match(/\d+/);
    return match ? Number(match[0]) : null;
}

export function calcularDietaBezerro(peso) {
    const ms = peso * 0.03; // 3% do PV

    return {
        peso,
        ms,
        pb: 18,   // proteína bruta recomendada
        ndt: 65   // energia digestível
    };
}

export function formatarDietaBezerro(resultado) {
    return `
🍼 *DIETA PROFISSIONAL — Bezerro*

🐮 *Peso:* ${resultado.peso} kg  
📦 *Consumo de MS:* ${resultado.ms.toFixed(1)} kg/dia  

🔬 *Requisitos nutricionais:*  
• PB: ${resultado.pb}%  
• NDT: ${resultado.ndt}%  

🎯 *Recomendações:*  
• Creep-feeding 18% PB  
• Feno de boa qualidade  
• Água limpa + mineralização
`;
}
