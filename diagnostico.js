import { exec } from "child_process";
import http from "http";

function runCommand(command) {
    return new Promise((resolve) => {
        exec(command, (error, stdout) => {
            if (error) return resolve("");
            resolve(stdout.trim());
        });
    });
}

async function testarWebhook() {
    return new Promise((resolve) => {
        http.get("http://localhost:3000/webhook", (res) => {
            resolve(res.statusCode === 200);
        }).on("error", () => resolve(false));
    });
}

(async () => {
    console.log("\n🔍 INICIANDO DIAGNÓSTICO DO PECUÁRIA PRO BOT\n");

    // Teste da porta 3000
    const porta = await runCommand("netstat -ano | findstr :3000");
    const portaAtiva = porta.includes("LISTENING");

    // Teste do webhook
    const webhookOK = await testarWebhook();

    // Teste do ngrok
    let ngrokOnline = false;
    let ngrokURL = "";
    try {
        const ngrok = await runCommand('curl -s http://127.0.0.1:4040/api/tunnels');
        if (ngrok.includes("public_url")) {
            ngrokOnline = true;
            ngrokURL = JSON.parse(ngrok).tunnels[0].public_url;
        }
    } catch {}

    console.log("📡 Porta 3000:", portaAtiva ? "✔ Ativa" : "❌ Não encontrada");

    console.log("🌐 Webhook /webhook:", webhookOK ? "✔ Respondendo corretamente" : "❌ Não respondeu");

    console.log("🚇 Ngrok:", ngrokOnline ? `✔ Online (${ngrokURL})` : "❌ Não encontrado");

    console.log("\n📘 RESUMO FINAL\n");

    if (portaAtiva && webhookOK) {
        console.log("✅ O BOT ESTÁ RODANDO NORMALMENTE!\n");
    } else {
        console.log("❌ O BOT NÃO ESTÁ TOTALMENTE FUNCIONANDO.");
        console.log("➡ Verifique se você rodou:  npm run dev");
        console.log("➡ Verifique se o ngrok está ligado:  ngrok http 3000\n");
    }

    console.log("🔚 Diagnóstico completo.\n");
})();
