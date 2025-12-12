import {
    createLoteDB,
    listLotesDB,
    addAnimalToLoteDB,
    removeAnimalFromLoteDB,
    deleteLoteDB
} from "../database/database.js";

import supabase from "../database/supabase.js";
import { logError } from "../utils/logger.js";

// ======================================================
// 📦 Criar Lote
// ======================================================
export async function criarLote(phone, nomeLote) {
    try {
        if (!nomeLote || nomeLote.length < 2) {
            return "⚠️ Nome do lote inválido. Use: criar lote nome_do_lote";
        }

        const { data: existente } = await supabase
            .from("lotes")
            .select("id")
            .eq("phone", phone)
            .eq("nome", nomeLote)
            .maybeSingle();

        if (existente) {
            return `⚠️ O lote *${nomeLote}* já existe.`;
        }

        await createLoteDB(phone, nomeLote);

        return `📦 Lote *${nomeLote}* criado com sucesso!`;

    } catch (err) {
        logError(err, { local: "criarLote", phone });
        return "❌ Erro ao criar lote. Tente novamente.";
    }
}

// ======================================================
// 📋 Listar Lotes
// ======================================================
export async function listarLotes(phone) {
    try {
        const lotes = await listLotesDB(phone);

        if (!lotes.length) {
            return "📭 Você ainda não tem lotes cadastrados.";
        }

        let texto = "📦 *SEUS LOTES:*\n\n";

        for (const lote of lotes) {
            texto +=
                `• ID: ${lote.id}\n` +
                `  Nome: ${lote.nome}\n` +
                "-----------------------\n";
        }

        return texto;

    } catch (err) {
        logError(err, { local: "listarLotes", phone });
        return "❌ Erro ao listar lotes.";
    }
}

// ======================================================
// 🐮 Adicionar Animal ao Lote
// ======================================================
export async function adicionarAoLote(phone, nomeLote, animalId) {
    try {
        if (!nomeLote || !animalId) {
            return "⚠️ Use: adicionar ao lote nome_do_lote id_do_animal";
        }

        const { data: lote } = await supabase
            .from("lotes")
            .select("id")
            .eq("phone", phone)
            .eq("nome", nomeLote)
            .maybeSingle();

        if (!lote) {
            return `❌ Lote *${nomeLote}* não encontrado.`;
        }

        const { data: animal } = await supabase
            .from("animals")
            .select("id, nome")
            .eq("phone", phone)
            .eq("id", animalId)
            .maybeSingle();

        if (!animal) {
            return `❌ Animal ID *${animalId}* não encontrado.`;
        }

        const { data: existe } = await supabase
            .from("lote_animais")
            .select("id")
            .eq("lote_id", lote.id)
            .eq("animal_id", animalId)
            .maybeSingle();

        if (existe) {
            return `⚠️ O animal já está no lote *${nomeLote}*.`;
        }

        await addAnimalToLoteDB(phone, lote.id, animalId);

        return `🐮 Animal *${animal.nome}* (ID ${animalId}) adicionado ao lote *${nomeLote}*.`;

    } catch (err) {
        logError(err, { local: "adicionarAoLote", phone });
        return "❌ Erro ao adicionar animal ao lote.";
    }
}

// ======================================================
// ❌ Remover Animal do Lote
// ======================================================
export async function removerDoLote(phone, nomeLote, animalId) {
    try {
        if (!nomeLote || !animalId) {
            return "⚠️ Use: remover do lote nome_do_lote id_do_animal";
        }

        const { data: lote } = await supabase
            .from("lotes")
            .select("id")
            .eq("phone", phone)
            .eq("nome", nomeLote)
            .maybeSingle();

        if (!lote) {
            return `❌ Lote *${nomeLote}* não encontrado.`;
        }

        const { data: existe } = await supabase
            .from("lote_animais")
            .select("id")
            .eq("lote_id", lote.id)
            .eq("animal_id", animalId)
            .maybeSingle();

        if (!existe) {
            return `⚠️ Animal ID *${animalId}* não está no lote *${nomeLote}*.`;
        }

        await removeAnimalFromLoteDB(phone, lote.id, animalId);

        return `❌ Animal ID *${animalId}* removido do lote *${nomeLote}*.`;

    } catch (err) {
        logError(err, { local: "removerDoLote", phone });
        return "❌ Erro ao remover animal do lote.";
    }
}

// ======================================================
// 🗑️ Deletar Lote
// ======================================================
export async function deletarLote(phone, nomeLote) {
    try {
        if (!nomeLote) {
            return "⚠️ Use: remover lote nome_do_lote";
        }

        const { data: lote } = await supabase
            .from("lotes")
            .select("id")
            .eq("phone", phone)
            .eq("nome", nomeLote)
            .maybeSingle();

        if (!lote) {
            return `❌ Lote *${nomeLote}* não encontrado.`;
        }

        await deleteLoteDB(phone, lote.id);

        return `🗑️ Lote *${nomeLote}* deletado com sucesso.`;

    } catch (err) {
        logError(err, { local: "deletarLote", phone });
        return "❌ Erro ao deletar lote.";
    }
}
