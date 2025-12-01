// ==============================================
// 📦 BANCO DE DADOS – Versão Supabase
// Conversão completa de SQLite → Supabase
// ==============================================

import supabase from "./supabase.js";

// ==============================================
// 1️⃣ USERS
// ==============================================

// Buscar usuário
export async function getUser(phone) {
    const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("phone", phone)
        .single();

    return data || null;
}

// Criar usuário
export async function createUser(phone, name = null) {
    await supabase.from("users").insert([
        {
            phone,
            name,
            last_interaction: new Date().toISOString(),
            data: "{}"
        }
    ]);
}

// Atualizar usuário
export async function updateUser(phone, fields) {
    await supabase
        .from("users")
        .update(fields)
        .eq("phone", phone);
}

// ==============================================
// 2️⃣ CONVERSAS
// ==============================================

export async function addConversation(phone, role, message) {
    await supabase.from("conversations").insert([
        {
            phone,
            role,
            message,
            timestamp: new Date().toISOString()
        }
    ]);
}

export async function getConversationHistory(phone, limit = 10) {
    const { data } = await supabase
        .from("conversations")
        .select("role, message")
        .eq("phone", phone)
        .order("id", { ascending: false })
        .limit(limit);

    return data ? data.reverse() : [];
}

// ==============================================
// 3️⃣ DIAGNÓSTICOS
// ==============================================

export async function saveDiagnostic(phone, category, payload) {
    await supabase.from("diagnostics").insert([
        {
            phone,
            category,
            data: JSON.stringify(payload),
            created_at: new Date().toISOString()
        }
    ]);
}

export async function getDiagnostics(phone) {
    const { data } = await supabase
        .from("diagnostics")
        .select("*")
        .eq("phone", phone)
        .order("id", { ascending: false });

    return data || [];
}

// ==============================================
// 4️⃣ ANIMAIS (sistema antigo)
// ==============================================

export async function createAnimal(owner_phone, name, breed, weight, age, notes) {
    await supabase.from("animals").insert([
        {
            owner_phone,
            name,
            breed,
            weight,
            age,
            notes,
            created_at: new Date().toISOString()
        }
    ]);
}

export async function getAnimalsByUser(owner_phone) {
    const { data } = await supabase
        .from("animals")
        .select("*")
        .eq("owner_phone", owner_phone);

    return data || [];
}

export async function updateAnimal(id, name, breed, weight, age, notes) {
    await supabase
        .from("animals")
        .update({ name, breed, weight, age, notes })
        .eq("id", id);
}

export async function deleteAnimal(id) {
    await supabase.from("animals").delete().eq("id", id);
}

// ==============================================
// 5️⃣ LOTES (SISTEMA NOVO)
// ==============================================

// Inserir animal no lote
export async function addAnimalToLote(
    user,
    lote,
    tipo,
    raca,
    peso,
    idade,
    sexo,
    quantidade,
    observacao
) {
    await supabase.from("lotes").insert([
        {
            user_number: user,
            numero_lote: lote,
            tipo,
            raca,
            peso,
            idade,
            sexo,
            quantidade,
            observacao,
            created_at: new Date().toISOString()
        }
    ]);
}

// Listar todos os lotes do usuário
export async function getAllLotes(user) {
    const { data } = await supabase
        .from("lotes")
        .select("numero_lote, quantidade")
        .eq("user_number", user);

    if (!data) return [];

    // Agrupa por lote
    const grupos = {};

    data.forEach(item => {
        if (!grupos[item.numero_lote]) grupos[item.numero_lote] = 0;
        grupos[item.numero_lote] += item.quantidade;
    });

    return Object.entries(grupos).map(([lote, total]) => ({
        numero_lote: lote,
        total_animais: total
    }));
}

// Listar animais de um lote
export async function getLote(user, lote) {
    const { data } = await supabase
        .from("lotes")
        .select("*")
        .eq("user_number", user)
        .eq("numero_lote", lote)
        .order("id", { ascending: true });

    return data || [];
}
    