// =========================================
// 📌 PECUÁRIA PRO – Estrutura Modular (Profissional)
// =========================================

import express from "express";
import dotenv from "dotenv";
import webhookRoutes from "./routes/webhook.js";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Rotas separadas
app.use("/webhook", webhookRoutes);

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Pecuária Pro rodando na porta ${PORT}`);
});
