// services/cattle.js — CÁLCULOS PROFISSIONAIS PECUÁRIA PRO

// DIETA PROFISSIONAL
export function calcularDieta(peso, quantidade = 1) {
    let msPercent;

    if (peso < 200) msPercent = 0.03;
    else if (peso < 350) msPercent = 0.028;
    else if (peso < 500) msPercent = 0.025;
    else msPercent = 0.023;

    const msDiaria = peso * msPercent;
    const ndtDiaria = msDiaria * 0.70;
    const pbDiaria = msDiaria * 0.12;

    return {
        msDiaria,
        ndtDiaria,
        pbDiaria,
        totalMs: msDiaria * quantidade,
        totalNdt: ndtDiaria * quantidade,
        totalPb: pbDiaria * quantidade
    };
}

// CUSTO POR ARROBA PROFISSIONAL
export function custoPorArroba(custoMsKg, peso, ganhoKgDia = null) {
    const msDiaria = peso * 0.025;
    const custoDia = msDiaria * custoMsKg;
    const custoMes = custoDia * 30;

    let ganho = ganhoKgDia ? ganhoKgDia * 30 : 22.5;

    const arrobasGanhas = ganho / 15;
    const custoPorArroba = custoMes / arrobasGanhas;

    return {
        custoDia,
        custoMes,
        arrobasGanhas,
        custoPorArroba
    };
}

// UA
export function calcularUA(peso) {
    return peso / 450;
}

// LOTAÇÃO
export function calcularLotacao(uaTotal, areaHa) {
    return uaTotal / areaHa;
}
