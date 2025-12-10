// ==============================================================
// 📦 BANCO DE DADOS — Supabase (PT-BR)
// Versão final corrigida
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

        return error ? null : data;
    } catch (err) {
        logError(err, { section: "getUser", phone });
        return null;
    }
}

export async function createUser(phone, name = null) {
    try {
        await supabase.from("users").insert([{
            phone,
            name,
            last_interaction: new Date().toISOString(),
            data: {}
        }]);
    } catch (err) {
        logError(err, { section: "createUser", phone });
    }
}

export async function updateUser(phone, fields) {
    try {
        const { data: user } = await supabase
            .from("users")
            .select("data")
            .eq("phone", phone)
            .single();

        const dataAtual = user?.data || {};
        const novoData = { ...dataAtual, ...(fields.data || {}) };

        const enviar = {
            ...fields,
            data: novoData
        };

        await supabase
            .from("users")
            .update(enviar)
            .eq("phone", phone);

    } catch (err) {
        logError(err, { section: "updateUser", phone, fields });
    }
}

// ==============================================================
// 2️⃣ CONVERSATIONS (corrigido! usa created_at corretamente)
// ==============================================================

export async function addConversation(phone, role, message) {
    try {
        await supabase.from("conversations").insert([
            {
                phone,
                role,
                message
                // created_at é automático
            }
        ]);
    } catch (err) {
        logError(err, { section: "addConversation", phone, role, message });
    }
}

export async function getConversationHistory(phone, limit = 15) {
    try {
        const { data } = await supabase
            .from("conversations")
            .select("role, message")
            .eq("phone", phone)
            .order("id", { ascending: false })
            .limit(limit);

        return data?.reverse() || [];

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
                data: JSON.stringify(payload)
                // created_at automático
            }
        ]);
    } catch (err) {
        logError(err, { section: "saveDiagnostic", phone, category });
    }
}

export async function getDiagnostics(phone) {
    try {
        const { data } = await supabase
            .from("diagnostics")
            .select("*")
            .eq("phone", phone)
            .order("id", { ascending: false });

        return data || [];

    } catch (err) {
        logError(err, { section: "getDiagnostics", phone });
        return [];
    }
}

// ==============================================================
// 4️⃣ ANIMALS
// ==============================================================

export async function salvarAnimalDB(obj) {
    try {
        await supabase.from("animals").insert([
            {
                ...obj,
                created_at: new Date().toISOString()
            }
        ]);
    } catch (err) {
        logError(err, { section: "salvarAnimalDB" });
    }
}

export async function getAnimalsByUser(phone) {
    try {
        const { data } = await supabase
            .from("animals")
            .select("*")
            .eq("phone", phone)
            .order("id", { ascending: true });

        return data || [];

    } catch (err) {
        logError(err, { section: "getAnimalsByUser", phone });
        return [];
    }
}

export async function updateAnimalDB(phone, id, updates) {
    try {
        await supabase
            .from("animals")
            .update(updates)
            .eq("id", id)
            .eq("phone", phone);

    } catch (err) {
        logError(err, { section: "updateAnimalDB", id, phone });
    }
}

export async function deleteAnimalDB(phone, id) {
    try {
        await supabase
            .from("animals")
            .delete()
            .eq("id", id)
            .eq("phone", phone);

    } catch (err) {
        logError(err, { section: "deleteAnimalDB", id, phone });
    }
}

// ==============================================================
// 5️⃣ LOTES
// ==============================================================

export async function createLoteDB(phone, nome) {
    try {
        await supabase
            .from("lotes")
            .insert([{ phone, nome }]);
    } catch (err) {
        logError(err, { section: "createLoteDB", phone, nome });
    }
}

export async function listLotesDB(phone) {
    try {
        const { data } = await supabase
            .from("lotes")
            .select("*")
            .eq("phone", phone);

        return data || [];

    } catch (err) {
        logError(err, { section: "listLotesDB", phone });
        return [];
    }
}

export async function addAnimalToLoteDB(phone, lote_id, animal_id) {
    try {
        await supabase.from("lote_animais").insert([
            { lote_id, animal_id }
        ]);
    } catch (err) {
        logError(err, { section: "addAnimalToLoteDB", phone, lote_id });
    }
}

export async function removeAnimalFromLoteDB(phone, lote_id, animal_id) {
    try {
        await supabase
            .from("lote_animais")
            .delete()
            .eq("lote_id", lote_id)
            .eq("animal_id", animal_id);

    } catch (err) {
        logError(err, { section: "removeAnimalFromLoteDB", lote_id });
    }
}

export async function deleteLoteDB(phone, lote_id) {
    try {
        await supabase
            .from("lote_animais")
            .delete()
            .eq("lote_id", lote_id);

        await supabase
            .from("lotes")
            .delete()
            .eq("id", lote_id);

    } catch (err) {
        logError(err, { section: "deleteLoteDB", lote_id });
    }
}
