// =============================================
// 🐮 CATTLE CALCULATIONS — Versão Otimizada
// Agora: Dieta simples NÃO é mais usada.
// Dieta PRO é processada via dietaController.js
// =============================================

import { sendMessage } from "../services/whatsapp.js";
import { 
    extrairPesoDaMensagem, 
    extrairAreaHa 
} from "../utils/extract.js";


// =========================================================
// 1️⃣ UA — Unidade Animal
// =========================================================
export async function calcularUA(phone, msg) {
    const peso = extrairPesoDaMensagem(msg);

    if (!peso) {
        return sendMessage(phone, "❌ Informe o peso do animal.");
    }

    const ua = peso / 450;

    return sendMessage(phone, `🐄 *UA:* ${ua.toFixed(2)}`);
}



// =========================================================
// 2️⃣ Lotação (UA/ha)
// =========================================================
export async function calcularLotacao(phone, msg) {
    const area = extrairAreaHa(msg);
    const peso = extrairPesoDaMensagem(msg);

    if (!area || !peso) {
        return sendMessage(phone,
            "❌ Envie: área em hectares + peso dos animais.\nExemplo: 12ha 400kg"
        );
    }

    const ua = peso / 450;
    const lotacao = ua / area;

    return sendMessage(phone,
        `🌱 *Lotação recomendada:* ${lotacao.toFixed(2)} UA/ha`
    );
}



// =========================================================
// 3️⃣ Custo por Arroba
// =========================================================
export async function custoPorArroba(phone, msg) {

    const numeros = msg.match(/\d+([\.,]\d+)?/g);

    if (!numeros || numeros.length < 2) {
        return sendMessage(phone,
            "📌 Envie: custo por arroba PESO_KG VALOR_TOTAL\n\nEx: custo por arroba 373 kg 2200"
        );
    }

    const peso = Number(numeros[0].replace(",", "."));
    const valor = Number(numeros[1].replace(",", "."));

    if (peso <= 0 || valor <= 0) {
        return sendMessage(phone,
            "⚠️ Peso ou valor inválido.\nExemplo: custo por arroba 373 kg 2200 reais"
        );
    }

    const arrobas = peso / 30;
    const custo = valor / arrobas;

    return sendMessage(phone,
        `💰 *Custo por arroba:* R$ ${custo.toFixed(2)}\n\n📏 Peso: ${peso} kg\n💵 Valor total: R$ ${valor}`
    );
}
