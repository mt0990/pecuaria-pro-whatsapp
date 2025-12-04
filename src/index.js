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
// 🧩 MIDDLEWARES PRINCIPAIS
// =============================================
app.use(cors());
app.use(express.json());

// (opcional) ativar morgan somente em ambiente de desenvolvimento
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

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
    logInfo(`🔥 Servidor rodando na porta ${config.PORT}`, {
        url: `http://localhost:${config.PORT}`
    });
});

// =============================================
// 🛑 CAPTURAR ERROS GLOBAIS
// =============================================
process.on("unhandledRejection", (reason) => {
    logError(reason, { type: "unhandledRejection" });
});

process.on("uncaughtException", (error) => {
    logError(error, { type: "uncaughtException" });
});
