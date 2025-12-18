import fs from "fs";
import path from "path";
import { registrarErro } from "./metrics.js";

const logsDir = path.join(process.cwd(), "logs");

// garante que a pasta existe
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

function writeLog(file, payload) {
    const logEntry = {
        level: payload.level || "info",
        time: new Date().toISOString(),
        ...payload
    };

    const logLine = JSON.stringify(logEntry) + "\n";
    const filePath = path.join(logsDir, file);

    // grava em arquivo (best-effort)
    fs.appendFile(filePath, logLine, err => {
        if (err) {
            console.error("Erro ao gravar log:", err);
        }
    });

    // sempre aparece no Render
    console.log(logLine);
}

// ===============================
// ℹ️ INFO
// ===============================
export function logInfo(message, context = {}) {
    writeLog("info.log", {
        level: "info",
        message,
        context
    });
}

// ===============================
// ❌ ERROR (único e definitivo)
// ===============================
export function logError(error, context = {}) {
    // métrica de erro
    try {
        registrarErro();
    } catch (_) {
        // nunca deixa métricas quebrarem o app
    }

    writeLog("error.log", {
        level: "error",
        message:
            error instanceof Error
                ? error.message
                : typeof error === "string"
                ? error
                : "Erro desconhecido",
        stack: error instanceof Error ? error.stack : null,
        context
    });
}

// ===============================
// 📌 EVENT
// ===============================
export function logEvent(event, context = {}) {
    writeLog("events.log", {
        level: "event",
        event,
        context
    });
}
