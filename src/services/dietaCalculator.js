// =============================================
// 🧪 DIETA PROFISSIONAL – Cálculos Avançados
// =============================================

// Parser de ingredientes enviados pelo usuário
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


// Tabela nutricional base
const tabelaNutrientes = {
    milho: { ms: 87, pb: 9, ndt: 82 },
    soja: { ms: 89, pb: 46, ndt: 84 },
    casca: { ms: 90, pb: 12, ndt: 65 },
    farelo: { ms: 90, pb: 28, ndt: 75 },
    nucleo: { ms: 95, pb: 36, ndt: 60 },
    sal: { ms: 100, pb: 0, ndt: 0 },
    silagem: { ms: 35, pb: 8, ndt: 62 }
};


// Cálculo principal
export function calcularDietaProfissional(peso, ingredientes) {

    const consumoMaximo = peso * 0.03; // 3% do PV
    const consumoTotalKg = ingredientes.reduce((s, ing) => s + ing.quantidade, 0);

    const alerta = consumoTotalKg > consumoMaximo
        ? `⚠️ A dieta ultrapassa o limite de *3% do peso vivo* (${consumoMaximo.toFixed(1)} kg).`
        : null;

    // Totais
    let totalMS = 0;
    let totalPB = 0;
    let totalNDT = 0;

    const detalhesPorIngrediente = [];

    ingredientes.forEach(ing => {
        const comp = tabelaNutrientes[ing.nome];
        if (!comp) return;

        const msKg = ing.quantidade * (comp.ms / 100);
        const pbKg = ing.quantidade * (comp.pb / 100);
        const ndtKg = ing.quantidade * (comp.ndt / 100);

        totalMS += msKg;
        totalPB += pbKg;
        totalNDT += ndtKg;

        detalhesPorIngrediente.push({
            nome: ing.nome,
            quantidade: ing.quantidade,
            percentual: (ing.quantidade / consumoTotalKg) * 100,
            msKg,
            pbKg,
            ndtKg
        });
    });

    return {
        peso,
        consumoTotalKg,
        maxPermitido: consumoMaximo,
        totalMS,
        totalPB,
        totalNDT,
        alerta,
        detalhesPorIngrediente
    };
}


// Formatação final
export function formatarDietaAPP(resultado, ingredientes) {

    const lista = resultado.detalhesPorIngrediente
        .map(i =>
            `• ${i.nome} — ${i.quantidade} kg (${i.percentual.toFixed(1)}%)`
        )
        .join("\n");

    const detalhamentoNutri = resultado.detalhesPorIngrediente
        .map(i =>
            `• ${i.nome}: MS ${i.msKg.toFixed(2)} kg, PB ${i.pbKg.toFixed(2)} kg, NDT ${i.ndtKg.toFixed(2)} kg`
        )
        .join("\n");

    return `
📘 *DIETA PROFISSIONAL – Pecuária Pro*

🐮 *Peso:* ${resultado.peso} kg

📦 *Ingredientes (% da mistura):*
${lista}

⚖️ *Consumo total:* ${resultado.consumoTotalKg.toFixed(1)} kg  
📏 *Máximo permitido (3% PV):* ${resultado.maxPermitido.toFixed(1)} kg  

🌾 *Resultados Totais:*  
• MS: ${resultado.totalMS.toFixed(2)} kg  
• PB: ${resultado.totalPB.toFixed(2)} kg  
• NDT: ${resultado.totalNDT.toFixed(2)} kg  

🔬 *Contribuição Nutricional por Ingrediente:*  
${detalhamentoNutri}

${resultado.alerta ? "\n" + resultado.alerta + "\n" : ""}

✔️ Ajuste a dieta conforme objetivo do lote.
`;
}
