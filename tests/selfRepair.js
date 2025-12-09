// tests/selfRepair.js
import supabase from "../src/database/supabase.js";

console.log("🔍 Iniciando verificação completa do banco Supabase...\n");

async function testConnection() {
    console.log("🌐 Testando conexão básica...");

    const { data, error } = await supabase
        .from("users")
        .select("id")
        .limit(1);

    if (error) {
        console.log("❌ ERRO: Conexão falhou:", error.message);
        return false;
    }

    console.log("✅ Conexão OK!");
    return true;
}

async function testTable(name) {
    console.log(`\n📦 Testando tabela '${name}'...`);

    const { data, error } = await supabase
        .from(name)
        .select("*")
        .limit(1);

    if (error) {
        console.log(`❌ Tabela '${name}' com problema:`, error.message);
        return false;
    }

    console.log(`✅ Tabela '${name}' OK! (${data.length} linhas retornadas)`);
    return true;
}

async function testInsert(name, payload) {
    console.log(`📝 Testando INSERT na tabela '${name}' (modo seguro)...`);

    const { error } = await supabase
        .from(name)
        .insert([payload]);

    if (error) {
        console.log(`⚠️ INSERT bloqueado (pode ser normal em produção):`, error.message);
        return false;
    }

    // Remover registro
    await supabase.from(name).delete().eq("id", payload.id);

    console.log(`✅ INSERT/DELETE funcionando normalmente em '${name}'`);
    return true;
}

async function runTests() {
    const ok = await testConnection();
    if (!ok) return console.log("⛔ Abortando testes.");

    const tabelas = [
        "users",
        "animals",
        "lotes",
        "lote_animais",
        "diagnostics",
        "conversations"
    ];

    for (const t of tabelas) {
        await testTable(t);
    }

    console.log("\n🔧 Testes concluídos.");
}

runTests();
