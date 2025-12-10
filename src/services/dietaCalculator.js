// =============================================
// 🧪 DIETA PROFISSIONAL – Cálculos Técnicos
// Pecuária Pro — MS, PB, NDT, limites e ajustes
// =============================================

// ---------------------------------------------
// 1) Converter lista de ingredientes do usuário
// Ex: "milho 60kg\nsoja 30kg\ncasca 50kg\nnucleo 10kg"
// ---------------------------------------------
export function parseIngredientes(msg) {
    const linhas = msg.split("\n").map(l => l.trim()).filter(Boolean);

    const ingredientes = [];

    for (const linha of linhas) {
        const match = linha.match(/([a-zA-Zçãõáéíóú]+)\s+(\d+)\s?kg/i);
        if (!match) continue;

        ingredientes.push({
            nome: match[1].toLowerCase(),
            quantidade: Number(match[2])
        });
    }

    return ingredientes;
}



// ---------------------------------------------
// 2) Banco simplificado de composição nutricional
// Valores médios por ingrediente (percentual)
// ---------------------------------------------
const tabelaNutrientes = {
    milho: { ms: 87, pb: 9, ndt: 82 },
    soja: { ms: 89, pb: 46, ndt: 84 },
    casca: { ms: 90, pb: 12, ndt: 65 },
    farelo: { ms: 90, pb: 28, ndt: 75 },
    nucleo: { ms: 95, pb: 36, ndt: 60 },
    sal: { ms: 100, pb: 0, ndt: 0 },
    silagem: { ms: 35, pb: 8, ndt: 62 }
};



// ---------------------------------------------
// 3) Cálculo principal da dieta PRO
// ---------------------------------------------
export function calcularDietaProfissional(peso, ingredientes) {

    const consumoMaximo = peso * 0.03; // 3% PV (peso vivo)
    const consumoTotalKg = ingredientes.reduce((s, ing) => s + ing.quantidade, 0);

    const alerta = consumoTotalKg > consumoMaximo
        ? `⚠️ A dieta ultrapassa o limite de *3% do peso vivo* (${consumoMaximo.toFixed(1)} kg).`
        : null;

    let totalMS = 0;
    let totalPB = 0;
    let totalNDT = 0;

    ingredientes.forEach(ing => {
        const comp = tabelaNutrientes[ing.nome];

        if (!comp) return; // ingrediente não reconhecido

        totalMS += ing.quantidade * (comp.ms / 100);
        totalPB += ing.quantidade * (comp.pb / 100);
        totalNDT += ing.quantidade * (comp.ndt / 100);
    });

    return {
        peso,
        consumoTotalKg,
        maxPermitido: consumoMaximo,
        totalMS,
        totalPB,
        totalNDT,
        alerta
    };
}



// ---------------------------------------------
// 4) Formatação final para envio no WhatsApp
// ---------------------------------------------
export function formatarDietaAPP(resultado, ingredientes) {

    const lista = ingredientes
        .map(i => `• ${i.nome} — ${i.quantidade} kg`)
        .join("\n");

    return `
📘 *DIETA PROFISSIONAL — Pecuária Pro*

🐮 *Peso do animal:* ${resultado.peso} kg

📦 *Ingredientes utilizados:*
${lista}

⚖️ *Consumo total:* ${resultado.consumoTotalKg.toFixed(1)} kg  
📏 *Máximo permitido (3% PV):* ${resultado.maxPermitido.toFixed(1)} kg

🌾 *Resultados nutricionais:*  
• MS: ${resultado.totalMS.toFixed(2)} kg  
• PB: ${resultado.totalPB.toFixed(2)} kg  
• NDT: ${resultado.totalNDT.toFixed(2)} kg  

${resultado.alerta ? "\n" + resultado.alerta + "\n" : ""}
✔️ Ajuste conforme necessidade nutricional.
`;
}
