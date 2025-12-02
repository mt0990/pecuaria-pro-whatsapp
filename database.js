// ==============================================
// 📦 BANCO DE DADOS – Versão Supabase (PT-BR)
// Totalmente compatível com o index.js em português
// ==============================================

import supabase from "./supabase.js";

// ==============================================
// 1️⃣ USERS
// ==============================================

export async function getUser(phone) {
    const { data } = await supabase
        .from("users")
        .select("*")
        .eq("phone", phone)
        .single();

    return data || null;
}

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
// 4️⃣ ANIMAIS (CAMPOS EM PORTUGUÊS)
// ==============================================
//
// IMPORTANTE → seu Supabase precisa indicar estes campos:
//
// id (PK)
// owner_phone (text)
// numero_boi (int)
// nome (text)
// raca (text)
// peso (numeric)
// idade (int)
// notas (text)
// created_at (timestamp)
//

export async function salvarAnimalDB({ telefone, numero_boi, nome, raca, peso, idade, notas }) {
    const { error } = await supabase
        .from("animals")
        .insert([
            {
                owner_phone: telefone,
                numero_boi,
                nome,
                raca,
                peso,
                idade,
                notas,
                created_at: new Date().toISOString()
            }
        ]);

    if (error) {
        console.log("❌ Erro ao salvar animal:", error);
        return false;
    }

    return true;
}

export async function getAnimalsByUser(owner_phone) {
    const { data, error } = await supabase
        .from("animals")
        .select("*")
        .eq("owner_phone", owner_phone)
        .order("id", { ascending: true });

    if (error) {
        console.log("❌ Erro ao buscar animais:", error);
        return [];
    }

    return data || [];
}

// Atualizar animal pelo NUMERO_BOI
export async function updateAnimalDB(numero_boi, updates) {
    const { error } = await supabase
        .from("animals")
        .update(updates)
        .eq("numero_boi", numero_boi);

    if (error) {
        console.log("❌ Erro ao atualizar animal:", error);
        return false;
    }

    return true;
}

export async function deleteAnimalDB(numero_boi) {
    const { error } = await supabase
        .from("animals")
        .delete()
        .eq("numero_boi", numero_boi);

    if (error) {
        console.log("❌ Erro ao deletar animal:", error);
        return false;
    }

    return true;
}

// ==============================================
// 5️⃣ LOTES
// ==============================================
//
// Sua tabela `lotes` deve ter:
//
// id
// user_number
// numero_lote
// tipo
// raca
// peso
// idade
// sexo
// quantidade
// observacao
// created_at
//

export async function addAnimalToLote(
    user,
    numero_lote,
    tipo,
    raca,
    peso,
    idade,
    sexo,
    quantidade,
    observacao
) {
    const { error } = await supabase.from("lotes").insert([
        {
            user_number: user,
            numero_lote,
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

    if (error) {
        console.log("❌ Erro ao adicionar ao lote:", error);
    }
}

export async function getAllLotes(user) {
    const { data, error } = await supabase
        .from("lotes")
        .select("numero_lote, quantidade")
        .eq("user_number", user);

    if (error || !data) return [];

    // Agrupar soma por lote
    const grupos = {};
    data.forEach(item => {
        if (!grupos[item.numero_lote]) grupos[item.numero_lote] = 0;
        grupos[item.numero_lote] += item.quantidade;
    });

    return Object.entries(grupos).map(([numero_lote, total_animais]) => ({
        numero_lote,
        total_animais
    }));
}

export async function getLote(user, lote) {
    const { data } = await supabase
        .from("lotes")
        .select("*")
        .eq("user_number", user)
        .eq("numero_lote", lote)
        .order("id", { ascending: true });

    return data || [];
}
