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

    // Extrair números da mensagem
    const regexNumeros = msg.match(/\d+([\.,]\d+)?/g);

    if (!regexNumeros || regexNumeros.length < 2) {
        return sendMessage(phone,
            "📌 Envie: custo por arroba PESO_KG VALOR_TOTAL\n\nEx: custo por arroba 373 kg 2200 reais"
        );
    }

    // Converter para número
    let peso = Number(regexNumeros[0].replace(",", "."));
    let valor = Number(regexNumeros[1].replace(",", "."));

    if (peso <= 0 || valor <= 0) {
        return sendMessage(phone,
            "⚠️ Peso ou valor inválido. Envie assim:\n👉 *custo por arroba 373 kg 2200 reais*"
        );
    }

    // Cálculo
    const arrobas = peso / 15;
    const custo = valor / arrobas;

    return sendMessage(
        phone,
        `💰 *Custo por arroba:* R$ ${custo.toFixed(2)}\n\n📏 Peso: ${peso} kg\n💵 Valor total: R$ ${valor}`
    );
}
