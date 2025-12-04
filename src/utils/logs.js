import fs from "fs";
import path from "path";

const logsDir = path.join(process.cwd(), "logs");

// garante que a pasta existe
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
}

function writeLog(file, content) {
    const logLine = JSON.stringify(content) + "\n";
    const filePath = path.join(logsDir, file);

    fs.appendFile(filePath, logLine, (err) => {
        if (err) console.error("Erro ao gravar log:", err);
    });

    console.log(logLine); // aparece no Render
}

export function logInfo(message, context = {}) {
    writeLog("info.log", {
        time: new Date().toISOString(),
        message,
        context
    });
}

export function logError(error, context = {}) {
    writeLog("error.log", {
        time: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        context
    });
}

export function logEvent(event, context = {}) {
    writeLog("events.log", {
        time: new Date().toISOString(),
        event,
        context
    });
}
