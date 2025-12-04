import { logError } from "./logger.js";

// =============================================
// 🛑 TRATAMENTO GLOBAL DE ERROS (MIDDLEWARE FINAL)
// =============================================

export default function errorHandler(err, req, res, next) {

    logError(err, {
        rota: req.originalUrl,
        metodo: req.method,
        corpo: req.body,
        params: req.params,
        query: req.query
    });

    return res.status(500).json({
        status: "erro",
        mensagem: "Erro interno no servidor.",
        detalhe: err.message
    });
}
