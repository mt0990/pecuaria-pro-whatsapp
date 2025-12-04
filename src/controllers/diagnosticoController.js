import { respostaGPT } from "../services/gpt.js";
import { sendMessage } from "../services/whatsapp.js";

export async function diagnosticoAnimal(phone, msg) {
    const prompt = `
Você é um veterinário virtual. Analise os sintomas abaixo e ofereça:
- diagnóstico provável  
- urgência  
- recomendações  
- possíveis causas  

Sintomas: ${msg}
`;

    const resposta = await respostaGPT(phone, prompt);
    return sendMessage(phone, resposta);
}
