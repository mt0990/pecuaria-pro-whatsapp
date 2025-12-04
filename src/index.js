import express from "express";
import cors from "cors";
import morgan from "morgan";

import whatsappRoutes from "./routes/whatsapp.routes.js";
import errorHandler from "./utils/errorHandler.js";
import { config } from "./config/env.js";

const app = express();

// =============================================
// 🧩 MIDDLEWARES PRINCIPAIS
// =============================================
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// =============================================
// 📩 ROTAS DO WHATSAPP
// =============================================
app.use("/webhook", whatsappRoutes);

// =============================================
// 🛑 TRATAMENTO DE ERROS (FINAL)
// =============================================
app.use(errorHandler);

// =============================================
// 🚀 INICIAR SERVIDOR
// =============================================
app.listen(config.PORT, () => {
    console.log(`🔥 Servidor rodando em http://localhost:${config.PORT}`);
});
