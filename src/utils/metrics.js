// =============================================
// 📊 MÉTRICAS INTERNAS — PECUÁRIA PRO
// =============================================

export const metrics = {
    mensagens: 0,
    erros: 0,
    ultimas: []
};

// registra mensagem recebida
export function registrarMensagem(phone, msg) {
    metrics.mensagens++;

    metrics.ultimas.push({
        phone,
        msg,
        time: new Date().toISOString()
    });

    // mantém só as últimas 20
    if (metrics.ultimas.length > 20) {
        metrics.ultimas.shift();
    }
}

// registra erro
export function registrarErro() {
    metrics.erros++;
}
