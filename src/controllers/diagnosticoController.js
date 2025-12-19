import { respostaGPT } from "../services/gpt.js";
import { getUser, updateUser } from "../database/database.js";

export async function diagnosticoAnimal(phone, msg) {
    const user = await getUser(phone);
    const data = user?.data || {};

    // ===============================
    // 🔁 DIAGNÓSTICO EM ANDAMENTO
    // ===============================
    if (data.diagnostico?.ativo) {
        return await continuarDiagnostico(phone, msg, data);
    }

    // ===============================
    // 🆕 INICIAR DIAGNÓSTICO
    // ===============================
    await updateUser(phone, {
        data: {
            ...data,
            diagnostico: {
                ativo: true,
                etapa: 1,
                respostas: {
                    sintoma: msg
                }
            }
        }
    });

    return (
        "🚑 Entendi. Vamos avaliar com calma.\n\n" +
        "1️⃣ O animal está com *febre*? (sim/não)"
    );
}

// ==================================================
// 🔄 CONTINUAÇÃO DO DIAGNÓSTICO
// ==================================================
async function continuarDiagnostico(phone, msg, data) {
    const diag = data.diagnostico;

    // ETAPA 1 — FEBRE
    if (diag.etapa === 1) {
        diag.respostas.febre = msg;
        diag.etapa = 2;

        await updateUser(phone, {
            data: {
                ...data,
                diagnostico: diag
            }
        });

        return "2️⃣ Qual a *idade aproximada* do animal?";
    }

    // ETAPA 2 — IDADE
    if (diag.etapa === 2) {
        diag.respostas.idade = msg;
        diag.etapa = 3;

        await updateUser(phone, {
            data: {
                ...data,
                diagnostico: diag
            }
        });

        return "3️⃣ Há quantos *dias* o sintoma começou?";
    }

    // ETAPA 3 — FINALIZA
    if (diag.etapa === 3) {
        diag.respostas.duracao = msg;

        // 🧠 Montar prompt final
        const prompt = `
Você é um veterinário.
Analise o caso abaixo e forneça:
- diagnóstico provável
- urgência
- recomendações
- possíveis causas

Sintoma inicial: ${diag.respostas.sintoma}
Febre: ${diag.respostas.febre}
Idade: ${diag.respostas.idade}
Duração: ${diag.respostas.duracao}
`;

        const resposta = await respostaGPT(phone, prompt);

        // 🧹 LIMPAR ESTADO
        await updateUser(phone, {
            data: {
                ...data,
                diagnostico: null
            }
        });

        return (
            "🧠 *Análise final:*\n\n" +
            resposta +
            "\n\n✅ Diagnóstico encerrado."
        );
    }
}
