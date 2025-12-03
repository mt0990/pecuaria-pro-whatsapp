// =========================================
// 🌐 WEBHOOK – Porta de entrada UltraMSG
// =========================================

import express from "express";
import { processIncomingMessage } from "../services/whatsapp.js";

const router = express.Router();

// =========================================
// GET – Usado pelo UltraMSG para teste
// =========================================
router.get("/", (req, res) => {
    res.send("Webhook OK");
});

// =========================================
// POST – Recebe mensagens do WhatsApp
// =========================================
router.post("/", async (req, res) => {
    try {
        // UltraMSG exige resposta imediata
        res.sendStatus(200);

        // Processar mensagem em background
        await processIncomingMessage(req.body);

    } catch (error) {
        console.error("Erro no webhook:", error);
    }
});

export default router;
