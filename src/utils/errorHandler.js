// =============================================
// 🛑 TRATAMENTO GLOBAL DE ERROS
// =============================================

export default function errorHandler(err, req, res, next) {

    console.error("🔥 ERRO INTERNO:", {
        mensagem: err.message,
        stack: err.stack,
        rota: req.originalUrl,
        corpo: req.body
    });

    return res.status(500).json({
        status: "erro",
        mensagem: "Erro interno no servidor.",
        detalhe: err.message
    });
}
