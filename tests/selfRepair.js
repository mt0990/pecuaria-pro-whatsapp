// tests/selfRepair.js

import supabase from "../database/supabase.js";

// =============================================================
// SCHEMA IDEAL DO SEU SISTEMA – usado apenas para comparação!
// =============================================================
const schemaIdeal = {
    animals: {
        id: "integer",
        phone: "text",
        nome: "text",
        raca: "text",
        peso: "numeric",
        idade: "text",
        notas: "text"
    },

    lotes: {
        id: "integer",
        phone: "text",
        nome: "text",
        criado_em: "timestamp"
    },

    lote_animais: {
        id: "integer",
        phone: "text",
        lote_id: "integer",
        animal_id: "integer"
    },

    users: {
        id: "integer",
        phone: "text",
        name: "text",
        last_interaction: "timestamp",
        data: "json"
    },

    conversations: {
        id: "integer",
        phone: "text",
        role: "text",
        message: "text",
        timestamp: "timestamp"
    }
};

// =============================================================
// 1️⃣ Verifica tabelas existentes
// =============================================================
async function listarTabelas() {
    const { data, error } = await supabase.rpc("get_tables");

    if (error) {
        console.log("❌ Necessário criar função RPC get_tables no Supabase.");
        return [];
    }

    return data.map(t => t.table_name);
}

// =============================================================
// 2️⃣ Verifica colunas de uma tabela
// =============================================================
async function listarColunas(tabela) {
    const { data, error } = await supabase.rpc("get_columns", { table_name: tabela });

    if (error) {
        console.log(`❌ Função get_columns não retornou colunas para '${tabela}'`);
        return [];
    }

    return data;
}

// =============================================================
// 3️⃣ Gera RELATÓRIO COMPLETO sem alterar nada
// =============================================================
async function gerarRelatorio() {
    console.log("\n🔍 INICIANDO RELATÓRIO DE INTEGRIDADE DO BANCO DE DADOS\n");

    const existentes = await listarTabelas();
    let comandosSQL = [];

    for (const tabela in schemaIdeal) {
        const existe = existentes.includes(tabela);

        console.log(`\n📌 Tabela: ${tabela}`);

        if (!existe) {
            console.log(`❌ NÃO EXISTE`);
            console.log(`➡ Recomendação: criar tabela completa\n`);

            const campos = schemaIdeal[tabela];
            const cols = Object.entries(campos)
                .map(([col, type]) => `    ${col} ${type}`)
                .join(",\n");

            comandosSQL.push(`
CREATE TABLE ${tabela} (
${cols}
);
`);
            continue;
        }

        console.log("✔ Existe");

        const colunas = await listarColunas(tabela);
        const nomesColunas = colunas.map(c => c.column_name);

        // Verifica colunas faltando
        const esperado = schemaIdeal[tabela];

        for (const col in esperado) {
            if (!nomesColunas.includes(col)) {
                console.log(`   ❌ Coluna faltando: ${col}`);
                comandosSQL.push(
                    `ALTER TABLE ${tabela} ADD COLUMN ${col} ${esperado[col]};`
                );
            } else {
                console.log(`   ✔ Coluna OK: ${col}`);
            }
        }
    }

    console.log("\n=================================================");
    console.log("📄 SQL RECOMENDADO PARA CORRIGIR O BANCO");
    console.log("=================================================\n");

    if (comandosSQL.length === 0) {
        console.log("🎉 Nenhum problema encontrado. Banco consistente!");
    } else {
        comandosSQL.forEach(sql => console.log(sql));
    }

    console.log("\n🔍 RELATÓRIO FINALIZADO.\n");
}

// =============================================================
// EXECUTAR
// =============================================================
gerarRelatorio();
