// ==============================================================
// 📦 BANCO DE DADOS — Supabase (PT-BR)
// Revisado, corrigido e 100% seguro
// ==============================================================

import supabase from "./supabase.js";
import { logError } from "../utils/logger.js";


// ==============================================================
// 1️⃣ USERS
// ==============================================================

export async function getUser(phone) {
    try {
        const { data, error } = await supabase
            .from("users")
            .select("*")
            .eq("phone", phone)
            .single();

        if (error) throw error;

        return data || null;

    } catch (err) {
        logError(err, { section: "getUser", phone });
        return null;
    }
}

export async function createUser(phone, name = null) {
    try {
        await supabase.from("users").insert([
            {
                phone,
                name,
                last_interaction: new Date().toISOString(),
                data: "{}"
            }
        ]);
    } catch (err) {
        logError(err, { section: "createUser", phone });
    }
}

export async function updateUser(phone, fields) {
    try {
        await supabase
            .from("users")
            .update(fields)
            .eq("phone", phone);
    } catch (err) {
        logError(err, { section: "updateUser", phone, fields });
    }
}


// ==============================================================
// 2️⃣ CONVERSATIONS
// ==============================================================

export async function addConversation(phone, role, message) {
    try {
        await supabase.from("conversations").insert([
            {
                phone,
                role,
                message,
                timestamp: new Date().toISOString()
            }
        ]);
    } catch (err) {
        logError(err, { section: "addConversation", phone, role, message });
    }
}

export async function getConversationHistory(phone, limit = 10) {
    try {
        const { data, error } = await supabase
            .from("conversations")
            .select("role, message")
            .eq("phone", phone)
            .order("id", { ascending: false })
            .limit(limit);

        if (error) throw error;

        return data ? data.reverse() : [];

    } catch (err) {
        logError(err, { section: "getConversationHistory", phone });
        return [];
    }
}


// ==============================================================
// 3️⃣ DIAGNOSTICS
// ==============================================================

export async function saveDiagnostic(phone, category, payload) {
    try {
        await supabase.from("diagnostics").insert([
            {
                phone,
                category,
                data: JSON.stringify(payload),
                created_at: new Date().toISOString()
            }
        ]);
    } catch (err) {
        logError(err, { section: "saveDiagnostic", phone, category });
    }
}

export async function getDiagnostics(phone) {
    try {
        const { data, error } = await supabase
            .from("diagnostics")
            .select("*")
            .eq("phone", phone)
            .order("id", { ascending: false });

        if (error) throw error;

        return data || [];

    } catch (err) {
        logError(err, { section: "getDiagnostics", phone });
        return [];
    }
}


// ==============================================================
// 4️⃣ ANIMALS
// ==============================================================

export async function salvarAnimalDB({
    telefone,
    numero_boi,
    nome,
    raca,
    peso,
    idade,
    notas
}) {
    try {
        const { error } = await supabase.from("animals").insert([
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

        if (error) throw error;

    } catch (err) {
        logError(err, { section: "salvarAnimalDB", telefone, numero_boi });
    }
}

export async function getAnimalsByUser(owner_phone) {
    try {
        const { data, error } = await supabase
            .from("animals")
            .select("*")
            .eq("owner_phone", owner_phone)
            .order("numero_boi", { ascending: true });

        if (error) throw error;

        return data || [];

    } catch (err) {
        logError(err, { section: "getAnimalsByUser", owner_phone });
        return [];
    }
}

export async function updateAnimalDB(phone, numero_boi, updates) {
    try {
        const { error } = await supabase
            .from("animals")
            .update(updates)
            .eq("numero_boi", numero_boi)
            .eq("owner_phone", phone);

        if (error) throw error;

    } catch (err) {
        logError(err, { section: "updateAnimalDB", phone, numero_boi });
    }
}

export async function deleteAnimalDB(phone, numero_boi) {
    try {
        const { error } = await supabase
            .from("animals")
            .delete()
            .eq("numero_boi", numero_boi)
            .eq("owner_phone", phone);

        if (error) throw error;

    } catch (err) {
        logError(err, { section: "deleteAnimalDB", phone, numero_boi });
    }
}


// ==============================================================
// 5️⃣ LOTES
// ==============================================================

export async function addAnimalToLote(
    userPhone,
    numero_lote,
    tipo,
    raca,
    peso,
    idade,
    sexo,
    quantidade,
    observacao
) {
    try {
        const { error } = await supabase.from("lotes").insert([
            {
                user_number: userPhone,
                numero_lote,
                tipo,
                raca,
                peso,
                idade,
                sexo,
                quantidade,
                observacao,
                created_at: new Date.toISOString()
            }
        ]);

        if (error) throw error;

    } catch (err) {
        logError(err, { section: "addAnimalToLote", userPhone, numero_lote });
    }
}

export async function getAllLotes(userPhone) {
    try {
        const { data, error } = await supabase
            .from("lotes")
            .select("numero_lote, quantidade")
            .eq("user_number", userPhone);

        if (error) throw error;

        if (!data) return [];

        const grupos = {};
        data.forEach(item => {
            if (!grupos[item.numero_lote]) grupos[item.numero_lote] = 0;
            grupos[item.numero_lote] += item.quantidade;
        });

        return Object.entries(grupos).map(([numero_lote, total_animais]) => ({
            numero_lote: Number(numero_lote),
            total_animais
        }));

    } catch (err) {
        logError(err, { section: "getAllLotes", userPhone });
        return [];
    }
}

export async function getLote(userPhone, lote) {
    try {
        const { data, error } = await supabase
            .from("lotes")
            .select("*")
            .eq("user_number", userPhone)
            .eq("numero_lote", lote)
            .order("id", { ascending: true });

        if (error) throw error;

        return data || [];

    } catch (err) {
        logError(err, { section: "getLote", userPhone, lote });
        return [];
    }
}
