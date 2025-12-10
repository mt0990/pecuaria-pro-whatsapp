// =============================================
// 🥛 DIETA PROFISSIONAL — VACAS LEITEIRAS
// Pecuária Pro — MS, PB, NDT, requerimento por litro de leite
// =============================================

// -------------------------------------------------
// 1) Extração dos valores: peso + litros de leite
// -------------------------------------------------
export function extrairPesoLeite(msg) {
    const numeros = msg.match(/\d+/g);
    if (!numeros || numeros.length < 2) return null;

    return {
        peso: Number(numeros[0]),
        litros: Number(numeros[1])
    };
}

// -------------------------------------------------
// 2) Tabela nutricional básica
// -------------------------------------------------
const compostos = {
    silagem: { ms: 35, pb: 8, ndt: 62 },
    milho: { ms: 87, pb: 9, ndt: 82 },
    soja: { ms: 89, pb: 46, ndt: 84 },
    farelo: { ms: 90, pb: 28, ndt: 75 },
    nucleo: { ms: 95, pb: 36, ndt: 60 },
};

// -------------------------------------------------
// 3) Cálculo de requerimentos
// -------------------------------------------------
export function calcularDietaLeite(peso, litros) {

    // consumo 3.5% PV
    const msTotal = peso * 0.035;

    const requerPB = 14 + (litros * 0.09);  // 14 kg PV + produção
    const requerNDT = 30 + (litros * 0.32); // fórmula prática

    return {
        peso,
        litros,
        msTotal,
        requerPB,
        requerNDT
    };
}

// -------------------------------------------------
// 4) Formatação
// -------------------------------------------------
export function formatarDietaLeite(resultado) {

    return `
🥛 *DIETA PROFISSIONAL — Vaca Leiteira*

🐄 *Peso:* ${resultado.peso} kg  
🥛 *Produção:* ${resultado.litros} litros/dia  

📦 *Consumo de MS estimado:* ${resultado.msTotal.toFixed(1)} kg/dia  

🔬 *Requerimentos nutricionais:*  
• *Proteína Bruta (PB):* ${resultado.requerPB.toFixed(1)}%  
• *NDT:* ${resultado.requerNDT.toFixed(1)}%  

📌 Ajuste conforme nutricionista ou disponibilidade de volumoso.
    `;
}
