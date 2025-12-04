import { sendMessage } from "./whatsapp.js";
import { 
    extrairPesoDaMensagem,
    extrairAreaHa,
    extrairCustoDaMensagem
} from "../utils/extract.js";

// =============================================
// 🍽 DIETA
// =============================================

export async function calcularDieta(phone, msg) {
    const peso = extrairPesoDaMensagem(msg);

    if (!peso) {
        return sendMessage(phone, "❌ Informe o peso do animal. Ex: 300kg");
    }

    const ms = peso * 0.025;
    const concentrado = ms * 0.30;
    const volumoso = ms * 0.70;

    const texto = `
🍽 *Dieta sugerida para ${peso} kg*

🌾 Volumoso: *${volumoso.toFixed(1)} kg MS/dia*
🌽 Concentrado: *${concentrado.toFixed(1)} kg MS/dia*

📌 Ajuste conforme nutricionista.
`;

    return sendMessage(phone, texto);
}

// =============================================
// 🐄 UNIDADE ANIMAL - UA
// =============================================

export async function calcularUA(phone, msg) {
    const peso = extrairPesoDaMensagem(msg);

    if (!peso) {
        return sendMessage(phone, "❌ Envie o peso. Ex: ua 400kg");
    }

    const ua = peso / 450;

    return sendMessage(phone, `🐄 *UA:* ${ua.toFixed(2)} por animal`);
}

// =============================================
// 🌱 LOTAÇÃO - UA/ha
// =============================================

export async function calcularLotacao(phone, msg) {
    const peso = extrairPesoDaMensagem(msg);
    const area = extrairAreaHa(msg);

    if (!peso || !area) {
        return sendMessage(phone, "❌ Envie peso e área. Ex: 20ha 400kg");
    }

    const ua = peso / 450;
    const lotacao = ua / area;

    return sendMessage(phone, `🌱 *Lotação:* ${lotacao.toFixed(2)} UA/ha`);
}

// =============================================
// 💰 CUSTO POR ARROBA
// =============================================

export async function custoPorArroba(phone, msg) {
    const custo = extrairCustoDaMensagem(msg);
    const peso = extrairPesoDaMensagem(msg);

    if (!custo || !peso) {
        return sendMessage(phone, "❌ Envie custo total e peso. Ex: 2800 450kg");
    }

    const arroba = peso / 15;
    const preco = custo / arroba;

    return sendMessage(phone, `💰 *Custo por arroba:* R$ ${preco.toFixed(2)}`);
}
