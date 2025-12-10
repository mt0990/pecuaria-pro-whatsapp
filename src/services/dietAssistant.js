// =============================================
// 🍽️ ASSISTENTE NUTRICIONAL — Pecuária Pro
// Responde perguntas sobre a ÚLTIMA dieta feita
// complementando com GPT quando necessário
// =============================================

import { respostaGPT } from "./gpt.js";

// ----------------------
// Detecta intenção
// ----------------------
export function isPerguntaDieta(texto) {
    return (
        texto.includes("dieta") ||
        texto.includes("volumoso") ||
        texto.includes("concentrado") ||
        texto.includes("milho") ||
        texto.includes("soja") ||
        texto.includes("farelo") ||
        texto.includes("feno") ||
        texto.includes("quais ingredientes") ||
        texto.includes("posso usar") ||
        texto.includes("qual usar") ||
        texto.includes("o que usar") ||
        texto.includes("como ajustar") ||
        texto.includes("percent") ||
        texto.includes("porcent") ||
        texto.includes("qual o melhor ingrediente") ||
        texto.includes("ingrediente mais forte")
    );
}

// ----------------------
// Responde perguntas específicas
// ----------------------
export function responderPerguntaDieta(dieta, texto) {

    const ingredientes = dieta.ingredientes || [];
    const resultado = dieta.resultado;

    // Percentuais
    if (texto.includes("percent") || texto.includes("porcent")) {
        if (!resultado?.detalhesPorIngrediente) return null;

        const lista = resultado.detalhesPorIngrediente
            .map(i => `• ${i.nome}: ${i.percentual.toFixed(1)}%`)
            .join("\n");

        return `📊 *Percentual dos ingredientes:*\n${lista}`;
    }

    // Ingrediente predominante
    if (texto.includes("qual ingrediente mais") || texto.includes("mais forte")) {

        if (!resultado?.detalhesPorIngrediente) return null;

        const ordenado = [...resultado.detalhesPorIngrediente]
            .sort((a, b) => b.percentual - a.percentual);

        const top = ordenado[0];

        return `📈 *Ingrediente predominante:*  
${top.nome} com ${top.percentual.toFixed(1)}% da mistura.`;
    }

    // Perguntas sobre volumoso
    if (texto.includes("melhor volumoso") || texto.includes("volumoso usar")) {
        return `🌾 *Melhores volumosos:*  
• Silagem de milho (NDT alto)  
• Capim bem manejado (MS 25–35%)  
• Feno de tifton para dietas secas`;
    }

    // Perguntas sobre concentrado
    if (texto.includes("concentrado usar") || texto.includes("melhor concentrado")) {
        return `🌽 *Melhores concentrados:*  
• Milho moído (energia)  
• Farelo de soja (proteína)  
• Casca de soja (fibra + energia)  
• Núcleo mineral conforme categoria`;
    }

    // Ajustes
    if (texto.includes("ajustar") || texto.includes("mudar") || texto.includes("reduzir")) {
        return `🔧 *Ajustes comuns:*  
• Aumentar PB com soja / ureia (com cuidado)  
• Reduzir NDT diminuindo milho  
• Aumentar fibra adicionando volumoso  
• Melhorar desempenho aumentando MS total`;
    }

    return null; // deixa para o GPT se nada se encaixar
}

// ----------------------
// Função final: usa regras + GPT se necessário
// ----------------------
export async function processarPerguntaDieta(phone, texto, dieta) {

    // Resposta por regras fixas
    const resposta = responderPerguntaDieta(dieta, texto);
    if (resposta) return resposta;

    // Pergunta aberta → GPT
    const prompt = `
Você é um nutricionista de bovinos.
O produtor perguntou: "${texto}"

Use como base a última dieta dele:
Peso: ${dieta.peso} kg
Ingredientes: ${JSON.stringify(dieta.ingredientes)}
Resultado: ${JSON.stringify(dieta.resultado)}

Responda com objetividade, sem termos muito técnicos.
    `;

    return await respostaGPT(phone, prompt);
}
