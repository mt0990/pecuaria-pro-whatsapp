import express from "express";
import cors from "cors";
import morgan from "morgan";

import whatsappRoutes from "./routes/whatsapp.routes.js";
import errorHandler from "./utils/errorHandler.js";
import { config } from "./config/env.js";
import { logInfo, logError } from "./utils/logger.js";
import { metrics } from "./utils/metrics.js";

// =============================================
// 🚀 INÍCIO DO SISTEMA
// =============================================
logInfo("🔄 Iniciando Pecuária Pro WhatsApp Bot...");

const app = express();

// =============================================
// 🧩 MIDDLEWARES BÁSICOS
// =============================================
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// logs HTTP apenas em desenvolvimento
if (config.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

// =============================================
// 🛡️ PROTEÇÃO CONTRA RESPOSTA DUPLA
// Detecta quando mais de um fluxo tenta responder
// =============================================
app.use((req, res, next) => {
    res._sent = false;

    const originalJson = res.json.bind(res);

    res.json = (body) => {
        if (res._sent) {
            logError("❌ Tentativa de resposta duplicada ao webhook", {
                path: req.path,
                body
            });
            return;
        }

        res._sent = true;
        return originalJson(body);
    };

    next();
});

// =============================================
// 🔐 SEGURANÇA: POST SEM BODY
// =============================================
app.use((req, res, next) => {
    if (req.method === "POST" && (!req.body || Object.keys(req.body).length === 0)) {
        logError("❗ Webhook POST recebido sem body", {
            path: req.path
        });
    }
    next();
});

// =============================================
// ❤️ HEALTHCHECK
// =============================================
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        service: "Pecuária Pro WhatsApp Bot",
        environment: config.NODE_ENV || "production",
        uptime_seconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

// =============================================
// 📊 MÉTRICAS INTERNAS (ADMIN)
// =============================================
app.get("/metrics", (req, res) => {
    res.json({
        mensagens: metrics.mensagens,
        erros: metrics.erros,
        ultimas: metrics.ultimas
    });
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
// 🛑 ERROS NÃO TRATADOS
// =============================================
process.on("unhandledRejection", (reason) => {
    logError(reason, { type: "unhandledRejection" });
});

process.on("uncaughtException", (error) => {
    logError(error, { type: "uncaughtException" });
});
