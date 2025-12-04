import { sendMessage } from "../services/whatsapp.js";
import { extrairPesoDaMensagem, extrairAreaHa, extrairCustoDaMensagem } from "../utils/extract.js";

export async function calcularDieta(phone, msg) {
    try {
        const peso = extrairPesoDaMensagem(msg);
        if (!peso) return sendMessage(phone, "❌ Informe o peso do animal em kg.");

        const ms = peso * 0.025;
        const concentrado = ms * 0.30;
        const volumoso = ms * 0.70;

        const texto = `
🍽 *Dieta Sugerida para ${peso} kg*

🌾 Volumoso: ${volumoso.toFixed(1)} kg MS/dia  
🌽 Concentrado: ${concentrado.toFixed(1)} kg MS/dia  

📌 Ajuste conforme nutricionista.
`;

        return sendMessage(phone, texto);

    } catch (err) {
        console.error(err);
        return sendMessage(phone, "❌ Erro ao calcular dieta.");
    }
}

export async function calcularUA(phone, msg) {
    const peso = extrairPesoDaMensagem(msg);
    if (!peso) return sendMessage(phone, "❌ Informe o peso do animal.");

    const ua = peso / 450;
    return sendMessage(phone, `🐄 *UA:* ${ua.toFixed(2)}`);
}

export async function calcularLotacao(phone, msg) {
    const area = extrairAreaHa(msg);
    const peso = extrairPesoDaMensagem(msg);

    if (!area || !peso)
        return sendMessage(phone, "❌ Envie: área em ha + peso dos animais.");

    const ua = peso / 450;
    const lotacao = ua / area;

    return sendMessage(phone, `🌱 *Lotação:* ${lotacao.toFixed(2)} UA/ha`);
}

export async function custoPorArroba(phone, msg) {
    const custo = extrairCustoDaMensagem(msg);
    const peso = extrairPesoDaMensagem(msg);

    if (!custo || !peso)
        return sendMessage(phone, "❌ Envie: custo total + peso do animal.");

    const arrobas = peso / 15;
    const preco = custo / arrobas;

    return sendMessage(phone, `💰 Custo por arroba: R$ ${preco.toFixed(2)}`);
}
