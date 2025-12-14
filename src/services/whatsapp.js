// ==============================================================
// 📡 SERVIÇO DE WHATSAPP — UltraMSG
// Produção (real) + Teste (mock)
// ==============================================================

let sendMessage;

if (process.env.NODE_ENV === "test") {
    // 👉 MODO TESTE (NÃO ENVIA WHATSAPP)
    const mock = await import("../../tests/mocks/whatsapp.mock.js");
    sendMessage = mock.sendMessage;

} else {
    // 👉 MODO PRODUÇÃO (ULTRAMSG REAL)
    const axiosModule = await import("axios");
    const axios = axiosModule.default;

    const { config } = await import("../config/env.js");
    const { logInfo, logError } = await import("../utils/logger.js");

    sendMessage = async (phone, body) => {
        const url = `https://api.ultramsg.com/${config.ULTRA_INSTANCE}/messages/chat`;

        try {
            const response = await axios.post(url, {
                token: config.ULTRA_TOKEN,
                to: phone,
                body
            });

            logInfo("📤 Mensagem enviada via UltraMSG", { phone, body });
            return response.data;

        } catch (err) {
            logError(err, {
                phone,
                body,
                service: "UltraMSG"
            });
            return null;
        }
    };
}

export { sendMessage };
