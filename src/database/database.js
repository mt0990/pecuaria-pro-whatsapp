// ==============================================================
// 📦 BANCO DE DADOS — Supabase (PT-BR)
// Versão unificada, estável e 100% compatível com o projeto atual
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

        if (error) return null;

        return data || null;

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

export async function getConversationHistory(phone, limit = 15) {
    try {
        const { data, error } = await supabase
            .from("conversations")
            .select("role, message")
            .eq("phone", phone)
            .order("id", { ascending: false })
            .limit(limit);

        if (error) return [];

        return data.reverse();

    } catch (err) {
        logError(err, { section: "getConversationHistory", phone });
        return [];
    }
}


// ==============================================================
// 3️⃣ DIAGNOSTICS — (usado no diagnóstico veterinário)
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

        if (error) return [];

        return data || [];

    } catch (err) {
        logError(err, { section: "getDiagnostics", phone });
        return [];
    }
}


// ==============================================================
// 4️⃣ ANIMALS — COMPLETAMENTE COMPATÍVEL COM SEU animalController.js
// ==============================================================

export async function salvarAnimalDB({
    phone,
    nome,
    raca,
    peso,
    idade,
    notas
}) {
    try {
        const { error } = await supabase.from("animals").insert([
            {
                phone,
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
        logError(err, { section: "salvarAnimalDB", phone });
    }
}

export async function getAnimalsByUser(phone) {
    try {
        const { data, error } = await supabase
            .from("animals")
            .select("*")
            .eq("phone", phone)
            .order("id", { ascending: true });

        if (error) return [];

        return data;

    } catch (err) {
        logError(err, { section: "getAnimalsByUser", phone });
        return [];
    }
}

export async function updateAnimalDB(phone, id, updates) {
    try {
        const { error } = await supabase
            .from("animals")
            .update(updates)
            .eq("id", id)
            .eq("phone", phone);

        if (error) throw error;

    } catch (err) {
        logError(err, { section: "updateAnimalDB", phone, id });
    }
}

export async function deleteAnimalDB(phone, id) {
    try {
        const { error } = await supabase
            .from("animals")
            .delete()
            .eq("id", id)
            .eq("phone", phone);

        if (error) throw error;

    } catch (err) {
        logError(err, { section: "deleteAnimalDB", phone, id });
    }
}


// ==============================================================
// 5️⃣ LOTES — COMPATÍVEL COM SEU loteController.js ATUAL
// ==============================================================

// Criar lote
export async function createLoteDB(phone, nome) {
    try {
        const { error } = await supabase
            .from("lotes")
            .insert([
                {
                    phone,
                    nome,
                    criado_em: new Date().toISOString()
                }
            ]);

        if (error) throw error;

    } catch (err) {
        logError(err, { section: "createLoteDB", phone, nome });
    }
}

// Listar lotes
export async function listLotesDB(phone) {
    try {
        const { data, error } = await supabase
            .from("lotes")
            .select("*")
            .eq("phone", phone)
            .order("id", { ascending: true });

        if (error) return [];

        return data;

    } catch (err) {
        logError(err, { section: "listLotesDB", phone });
        return [];
    }
}

// Adicionar animal ao lote
export async function addAnimalToLoteDB(phone, lote_id, animal_id) {
    try {
        const { error } = await supabase
            .from("lote_animais")
            .insert([
                { phone, lote_id, animal_id }
            ]);

        if (error) throw error;

    } catch (err) {
        logError(err, { section: "addAnimalToLoteDB", phone, lote_id });
    }
}

// Remover animal do lote
export async function removeAnimalFromLoteDB(phone, lote_id, animal_id) {
    try {
        const { error } = await supabase
            .from("lote_animais")
            .delete()
            .eq("lote_id", lote_id)
            .eq("animal_id", animal_id);

        if (error) throw error;

    } catch (err) {
        logError(err, { section: "removeAnimalFromLoteDB", phone, lote_id });
    }
}

// Deletar lote
export async function deleteLoteDB(phone, lote_id) {
    try {
        // Remove todos os animais do lote
        await supabase
            .from("lote_animais")
            .delete()
            .eq("lote_id", lote_id);

        // Remove o lote
        const { error } = await supabase
            .from("lotes")
            .delete()
            .eq("id", lote_id);

        if (error) throw error;

    } catch (err) {
        logError(err, { section: "deleteLoteDB", phone, lote_id });
    }
}
