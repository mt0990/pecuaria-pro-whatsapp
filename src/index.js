import express from "express";
import cors from "cors";
import morgan from "morgan";

import whatsappRoutes from "./routes/whatsapp.routes.js";
import errorHandler from "./utils/errorHandler.js";
import { config } from "./config/env.js";
import { logInfo, logError } from "./utils/logger.js";

// =============================================
// 🚀 INÍCIO DO SISTEMA
// =============================================
logInfo("🔄 Iniciando Pecuária Pro WhatsApp Bot...");

const app = express();

// =============================================
// 🧩 MIDDLEWARES
// =============================================
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// habilita logs somente em desenvolvimento
if (config.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

// segurança para evitar requisições ultramsg sem body
app.use((req, res, next) => {
    if (req.method === "POST" && !req.body) {
        logError("❗ Webhook POST recebido sem body", { path: req.path });
    }
    next();
});

// =============================================
// 📩 ROTAS DO WHATSAPP
// =============================================
app.use("/webhook", whatsappRoutes);

// =============================================
// 🛑 TRATAMENTO GLOBAL DE ERROS
// =============================================
app.use(errorHandler);

// =============================================
// 🚀 INICIAR SERVIDOR
// =============================================
app.listen(config.PORT, () => {
    logInfo(
        `🔥 Servidor rodando na porta ${config.PORT} — Modo: ${config.NODE_ENV || "production"}`,
        { url: `http://localhost:${config.PORT}` }
    );
});

// =============================================
// 🛑 CAPTURA DE ERROS NÃO TRATADOS
// =============================================
process.on("unhandledRejection", (reason) => {
    logError(reason, { type: "unhandledRejection" });
});

process.on("uncaughtException", (error) => {
    logError(error, { type: "uncaughtException" });
});
